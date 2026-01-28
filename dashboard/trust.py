"""
Trust & Context Engine
Differentiates legitimate agent activity from malicious actions
"""

import json
import hashlib
import re
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Set

class TrustEngine:
    """
    Manages trust levels and context for agent sessions.
    
    Trust Levels:
    - TRUSTED: Known agent session, user-initiated actions
    - VERIFIED: Agent session with context showing user requested action
    - UNVERIFIED: Agent session, but action wasn't clearly requested
    - SUSPICIOUS: Matches malicious patterns, no user context
    - MALICIOUS: Confirmed malicious (blocked threat intel, known attack)
    """
    
    TRUSTED = "trusted"
    VERIFIED = "verified" 
    UNVERIFIED = "unverified"
    SUSPICIOUS = "suspicious"
    MALICIOUS = "malicious"
    
    def __init__(self, config_dir: Path = None):
        self.config_dir = config_dir or Path.home() / '.moltbot'
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
        self.trusted_sessions_file = self.config_dir / 'trusted-sessions.json'
        self.baseline_file = self.config_dir / 'behavioral-baseline.json'
        self.threat_intel_file = self.config_dir / 'threat-intel.json'
        
        self.trusted_sessions: Set[str] = set()
        self.baseline: Dict = {}
        self.threat_intel: Dict = {}
        
        self._load_data()
    
    def _load_data(self):
        """Load persisted trust data."""
        if self.trusted_sessions_file.exists():
            try:
                data = json.loads(self.trusted_sessions_file.read_text())
                self.trusted_sessions = set(data.get('sessions', []))
            except:
                pass
        
        if self.baseline_file.exists():
            try:
                self.baseline = json.loads(self.baseline_file.read_text())
            except:
                pass
                
        if self.threat_intel_file.exists():
            try:
                self.threat_intel = json.loads(self.threat_intel_file.read_text())
            except:
                pass
    
    def _save_trusted_sessions(self):
        """Persist trusted sessions."""
        self.trusted_sessions_file.write_text(json.dumps({
            'sessions': list(self.trusted_sessions),
            'updated': datetime.now().isoformat()
        }, indent=2))
    
    def trust_session(self, session_id: str):
        """Mark a session as trusted (user's agent)."""
        self.trusted_sessions.add(session_id)
        self._save_trusted_sessions()
    
    def untrust_session(self, session_id: str):
        """Remove trust from a session."""
        self.trusted_sessions.discard(session_id)
        self._save_trusted_sessions()
    
    def is_trusted_session(self, session_id: str) -> bool:
        """Check if session is explicitly trusted."""
        # Also trust partial matches (session IDs can be truncated in logs)
        for trusted in self.trusted_sessions:
            if session_id.startswith(trusted[:8]) or trusted.startswith(session_id[:8]):
                return True
        return False
    
    def analyze_context(self, session_file: Path, command: str) -> Dict:
        """
        Analyze session context to determine if action was user-requested.
        
        Returns:
            {
                'trust_level': str,
                'user_requested': bool,
                'context_messages': list,
                'reasoning': str
            }
        """
        result = {
            'trust_level': self.UNVERIFIED,
            'user_requested': False,
            'context_messages': [],
            'reasoning': ''
        }
        
        if not session_file.exists():
            result['reasoning'] = 'Session file not found'
            return result
        
        try:
            # Read last N messages from session
            messages = []
            with open(session_file, 'r') as f:
                lines = f.readlines()[-50:]  # Last 50 entries
                for line in lines:
                    try:
                        entry = json.loads(line)
                        if entry.get('type') == 'message':
                            msg = entry.get('message', {})
                            role = msg.get('role', '')
                            content = msg.get('content', '')
                            if isinstance(content, str):
                                messages.append({'role': role, 'content': content[:500]})
                            elif isinstance(content, list):
                                text = ' '.join(
                                    c.get('text', '')[:200] 
                                    for c in content 
                                    if c.get('type') == 'text'
                                )
                                messages.append({'role': role, 'content': text[:500]})
                    except:
                        continue
            
            result['context_messages'] = messages[-10:]  # Return last 10
            
            # Check if user recently requested something related to the command
            user_requested = self._check_user_request(messages, command)
            result['user_requested'] = user_requested
            
            if user_requested:
                result['trust_level'] = self.VERIFIED
                result['reasoning'] = 'User message found requesting this action'
            else:
                result['trust_level'] = self.UNVERIFIED
                result['reasoning'] = 'No clear user request found for this action'
                
        except Exception as e:
            result['reasoning'] = f'Error analyzing context: {e}'
        
        return result
    
    def _check_user_request(self, messages: List[Dict], command: str) -> bool:
        """Check if any recent user message requested this action."""
        # Keywords that might appear in user requests
        command_lower = command.lower()
        
        # Extract key terms from command
        command_terms = set(re.findall(r'\b\w{4,}\b', command_lower))
        
        # Look at recent user messages
        for msg in reversed(messages[-20:]):
            if msg.get('role') != 'user':
                continue
            
            content = msg.get('content', '').lower()
            
            # Check for explicit requests
            request_patterns = [
                r'run\s', r'execute\s', r'install\s', r'setup\s',
                r'create\s', r'build\s', r'start\s', r'download\s',
                r'please\s', r'can you\s', r'could you\s', r'would you\s',
            ]
            
            has_request = any(re.search(p, content) for p in request_patterns)
            
            # Check for term overlap
            content_terms = set(re.findall(r'\b\w{4,}\b', content))
            overlap = command_terms & content_terms
            
            if has_request and len(overlap) >= 2:
                return True
            
            # Check for very specific matches
            if any(term in content for term in ['curl', 'wget', 'npm', 'pip', 'git']):
                if any(term in command_lower for term in ['curl', 'wget', 'npm', 'pip', 'git']):
                    return True
        
        return False
    
    def evaluate_command(self, command: str, session_id: str = None, 
                         session_file: Path = None) -> Dict:
        """
        Full trust evaluation of a command.
        
        Returns:
            {
                'trust_level': str,
                'is_trusted_session': bool,
                'user_requested': bool,
                'threat_match': dict or None,
                'recommendation': str
            }
        """
        result = {
            'trust_level': self.UNVERIFIED,
            'is_trusted_session': False,
            'user_requested': False,
            'threat_match': None,
            'recommendation': ''
        }
        
        # Check trusted session
        if session_id:
            result['is_trusted_session'] = self.is_trusted_session(session_id)
        
        # Check threat intel
        threat_match = self.check_threat_intel(command)
        if threat_match:
            result['threat_match'] = threat_match
            result['trust_level'] = self.MALICIOUS
            result['recommendation'] = f"BLOCK: Matches threat intel - {threat_match.get('reason')}"
            return result
        
        # Check context if session file provided
        if session_file:
            context = self.analyze_context(session_file, command)
            result['user_requested'] = context['user_requested']
            
            if result['is_trusted_session'] and result['user_requested']:
                result['trust_level'] = self.TRUSTED
                result['recommendation'] = "ALLOW: Trusted session, user requested"
            elif result['is_trusted_session']:
                result['trust_level'] = self.VERIFIED
                result['recommendation'] = "ALLOW with logging: Trusted session, action not explicitly requested"
            elif result['user_requested']:
                result['trust_level'] = self.VERIFIED
                result['recommendation'] = "ALLOW: User requested this action"
            else:
                result['trust_level'] = self.SUSPICIOUS
                result['recommendation'] = "REVIEW: No trusted session or user request"
        else:
            result['recommendation'] = "Unable to verify - no session context"
        
        return result
    
    def check_threat_intel(self, text: str) -> Optional[Dict]:
        """Check if text matches known threats."""
        text_lower = text.lower()
        
        # Built-in threat patterns
        builtin_threats = [
            {
                'pattern': r'pastebin\.com/raw/',
                'reason': 'Pastebin raw URL (common malware host)',
                'severity': 'high'
            },
            {
                'pattern': r'raw\.githubusercontent\.com.*\.sh\s*\|\s*(?:ba)?sh',
                'reason': 'GitHub raw script piped to shell',
                'severity': 'medium'
            },
            {
                'pattern': r'(?:[\d]{1,3}\.){3}[\d]{1,3}:\d{4,5}',
                'reason': 'Direct IP:port connection (potential C2)',
                'severity': 'high'
            },
            {
                'pattern': r'nc\s+-[a-z]*e|ncat.*-e|netcat.*-e',
                'reason': 'Netcat reverse shell',
                'severity': 'critical'
            },
            {
                'pattern': r'/dev/tcp/|/dev/udp/',
                'reason': 'Bash /dev/tcp socket (reverse shell)',
                'severity': 'critical'
            },
            {
                'pattern': r'mkfifo.*/tmp/.*\|.*nc',
                'reason': 'Named pipe reverse shell',
                'severity': 'critical'
            },
            {
                'pattern': r'python.*-c.*socket.*connect',
                'reason': 'Python reverse shell',
                'severity': 'critical'
            },
            {
                'pattern': r'base64\s+-d.*\|\s*(?:ba)?sh',
                'reason': 'Base64 decoded payload executed',
                'severity': 'critical'
            },
        ]
        
        for threat in builtin_threats:
            if re.search(threat['pattern'], text_lower):
                return threat
        
        # Check custom threat intel
        for pattern, info in self.threat_intel.get('patterns', {}).items():
            if re.search(pattern, text_lower):
                return {'pattern': pattern, **info}
        
        # Check blocked IPs
        for ip in self.threat_intel.get('blocked_ips', []):
            if ip in text:
                return {'pattern': ip, 'reason': 'Blocked IP address', 'severity': 'high'}
        
        # Check blocked domains
        for domain in self.threat_intel.get('blocked_domains', []):
            if domain.lower() in text_lower:
                return {'pattern': domain, 'reason': 'Blocked domain', 'severity': 'high'}
        
        return None
    
    def add_threat_pattern(self, pattern: str, reason: str, severity: str = 'high'):
        """Add custom threat pattern."""
        if 'patterns' not in self.threat_intel:
            self.threat_intel['patterns'] = {}
        self.threat_intel['patterns'][pattern] = {'reason': reason, 'severity': severity}
        self._save_threat_intel()
    
    def block_ip(self, ip: str):
        """Block an IP address."""
        if 'blocked_ips' not in self.threat_intel:
            self.threat_intel['blocked_ips'] = []
        if ip not in self.threat_intel['blocked_ips']:
            self.threat_intel['blocked_ips'].append(ip)
            self._save_threat_intel()
    
    def block_domain(self, domain: str):
        """Block a domain."""
        if 'blocked_domains' not in self.threat_intel:
            self.threat_intel['blocked_domains'] = []
        if domain not in self.threat_intel['blocked_domains']:
            self.threat_intel['blocked_domains'].append(domain)
            self._save_threat_intel()
    
    def _save_threat_intel(self):
        """Persist threat intel."""
        self.threat_intel['updated'] = datetime.now().isoformat()
        self.threat_intel_file.write_text(json.dumps(self.threat_intel, indent=2))
    
    def update_baseline(self, session_id: str, activity: Dict):
        """Update behavioral baseline for a session/agent."""
        if session_id not in self.baseline:
            self.baseline[session_id] = {
                'common_commands': {},
                'common_paths': {},
                'common_hosts': {},
                'activity_hours': [0] * 24,
                'total_actions': 0
            }
        
        b = self.baseline[session_id]
        b['total_actions'] += 1
        
        # Track command patterns
        cmd = activity.get('command', '')
        cmd_base = cmd.split()[0] if cmd else ''
        if cmd_base:
            b['common_commands'][cmd_base] = b['common_commands'].get(cmd_base, 0) + 1
        
        # Track file paths
        path = activity.get('path', '')
        if path:
            path_dir = str(Path(path).parent)
            b['common_paths'][path_dir] = b['common_paths'].get(path_dir, 0) + 1
        
        # Track network hosts
        host = activity.get('host', '')
        if host:
            b['common_hosts'][host] = b['common_hosts'].get(host, 0) + 1
        
        # Track activity hours
        hour = datetime.now().hour
        b['activity_hours'][hour] += 1
        
        # Save periodically
        if b['total_actions'] % 100 == 0:
            self._save_baseline()
    
    def check_anomaly(self, session_id: str, activity: Dict) -> Optional[Dict]:
        """Check if activity is anomalous compared to baseline."""
        if session_id not in self.baseline:
            return None
        
        b = self.baseline[session_id]
        if b['total_actions'] < 50:  # Need enough data
            return None
        
        anomalies = []
        
        # Check if command is unusual
        cmd = activity.get('command', '')
        cmd_base = cmd.split()[0] if cmd else ''
        if cmd_base and cmd_base not in b['common_commands']:
            anomalies.append(f"Unusual command: {cmd_base}")
        
        # Check if path is unusual
        path = activity.get('path', '')
        if path:
            path_dir = str(Path(path).parent)
            if path_dir not in b['common_paths']:
                anomalies.append(f"Unusual path: {path_dir}")
        
        # Check if host is unusual
        host = activity.get('host', '')
        if host and host not in b['common_hosts']:
            anomalies.append(f"Unusual host: {host}")
        
        # Check if time is unusual
        hour = datetime.now().hour
        if b['activity_hours'][hour] == 0:
            anomalies.append(f"Unusual activity hour: {hour}:00")
        
        if anomalies:
            return {'anomalies': anomalies, 'baseline_actions': b['total_actions']}
        return None
    
    def _save_baseline(self):
        """Persist behavioral baseline."""
        self.baseline_file.write_text(json.dumps(self.baseline, indent=2))


# Singleton instance
_trust_engine = None

def get_trust_engine() -> TrustEngine:
    global _trust_engine
    if _trust_engine is None:
        _trust_engine = TrustEngine()
    return _trust_engine
