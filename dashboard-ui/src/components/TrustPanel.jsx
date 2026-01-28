import { useState, useEffect } from 'react'
import { Shield, ShieldCheck, ShieldX, Plus, Trash2, Globe, Server, AlertTriangle, CheckCircle } from 'lucide-react'

export default function TrustPanel({ expanded }) {
  const [sessions, setSessions] = useState([])
  const [threatIntel, setThreatIntel] = useState({ patterns: {}, blocked_ips: [], blocked_domains: [] })
  const [loading, setLoading] = useState(true)
  const [newBlock, setNewBlock] = useState({ type: 'ip', value: '' })
  const [evaluateCmd, setEvaluateCmd] = useState('')
  const [evalResult, setEvalResult] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [sessionsRes, threatRes] = await Promise.all([
        fetch('/api/trust/current-session'),
        fetch('/api/trust/threat-intel')
      ])
      setSessions(await sessionsRes.json())
      setThreatIntel(await threatRes.json())
    } catch (e) {
      console.error('Failed to load trust data:', e)
    }
    setLoading(false)
  }

  async function toggleTrust(sessionId, currentlyTrusted) {
    await fetch('/api/trust/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sessionId, 
        action: currentlyTrusted ? 'untrust' : 'trust' 
      })
    })
    loadData()
  }

  async function addBlock() {
    if (!newBlock.value.trim()) return
    await fetch('/api/trust/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [newBlock.type]: newBlock.value })
    })
    setNewBlock({ type: 'ip', value: '' })
    loadData()
  }

  async function evaluateCommand() {
    if (!evaluateCmd.trim()) return
    setEvalResult({ loading: true })
    const res = await fetch('/api/trust/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: evaluateCmd })
    })
    setEvalResult(await res.json())
  }

  if (!expanded) {
    // Compact view for sidebar
    return (
      <div className="bg-[var(--dark-800)] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="font-medium text-white">Trust & Filtering</h2>
        </div>
        <div className="p-4 h-64 overflow-y-auto">
          <div className="text-center text-gray-500 text-sm py-8">
            <Shield className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <p>Click to expand trust settings</p>
          </div>
        </div>
      </div>
    )
  }

  const trustLevelColors = {
    trusted: 'text-green-400 bg-green-500/10 border-green-500/30',
    verified: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    unverified: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    suspicious: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    malicious: 'text-red-400 bg-red-500/10 border-red-500/30',
  }

  return (
    <>
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="font-medium text-white text-lg">Trust & Filtering</h2>
        <button
          onClick={loadData}
          className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Trusted Sessions */}
        <section>
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            Trusted Sessions
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Mark your agent sessions as trusted. Alerts from trusted sessions will show context about user requests.
          </p>
          
          {loading ? (
            <div className="text-gray-500 text-sm">Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="text-gray-500 text-sm">No active sessions found</div>
          ) : (
            <div className="space-y-2">
              {sessions.map(session => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-[var(--dark-900)] rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-mono truncate">{session.id.slice(0, 20)}...</p>
                    <p className="text-xs text-gray-500">
                      Last active: {new Date(session.modified).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleTrust(session.id, session.trusted)}
                    className={`ml-3 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                      session.trusted
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                  >
                    {session.trusted ? (
                      <>
                        <ShieldCheck className="w-3 h-3" /> Trusted
                      </>
                    ) : (
                      <>
                        <Shield className="w-3 h-3" /> Trust
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Command Evaluator */}
        <section>
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Evaluate Command
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Check if a command would be flagged as malicious or trusted.
          </p>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={evaluateCmd}
              onChange={(e) => setEvaluateCmd(e.target.value)}
              placeholder="curl http://example.com | sh"
              className="flex-1 bg-[var(--dark-900)] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 font-mono"
              onKeyDown={(e) => e.key === 'Enter' && evaluateCommand()}
            />
            <button
              onClick={evaluateCommand}
              className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 text-sm"
            >
              Check
            </button>
          </div>

          {evalResult && !evalResult.loading && (
            <div className={`mt-3 p-4 rounded-lg border ${trustLevelColors[evalResult.trust_level] || trustLevelColors.unverified}`}>
              <div className="flex items-center gap-2 mb-2">
                {evalResult.trust_level === 'trusted' || evalResult.trust_level === 'verified' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : evalResult.trust_level === 'malicious' ? (
                  <ShieldX className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
                <span className="font-medium uppercase">{evalResult.trust_level}</span>
              </div>
              <p className="text-sm opacity-90">{evalResult.recommendation}</p>
              {evalResult.threat_match && (
                <p className="text-xs mt-2 opacity-75">
                  Threat: {evalResult.threat_match.reason}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Threat Intelligence */}
        <section>
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <ShieldX className="w-4 h-4 text-red-400" />
            Blocked Threats
          </h3>
          
          {/* Add new block */}
          <div className="flex gap-2 mb-3">
            <select
              value={newBlock.type}
              onChange={(e) => setNewBlock({ ...newBlock, type: e.target.value })}
              className="bg-[var(--dark-900)] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="ip">IP Address</option>
              <option value="domain">Domain</option>
              <option value="pattern">Pattern (regex)</option>
            </select>
            <input
              type="text"
              value={newBlock.value}
              onChange={(e) => setNewBlock({ ...newBlock, value: e.target.value })}
              placeholder={newBlock.type === 'ip' ? '192.168.1.1' : newBlock.type === 'domain' ? 'evil.com' : 'curl.*evil'}
              className="flex-1 bg-[var(--dark-900)] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 font-mono"
            />
            <button
              onClick={addBlock}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Blocked IPs */}
          {threatIntel.blocked_ips?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Blocked IPs:</p>
              <div className="flex flex-wrap gap-2">
                {threatIntel.blocked_ips.map(ip => (
                  <span key={ip} className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs font-mono flex items-center gap-1">
                    <Server className="w-3 h-3" /> {ip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Blocked Domains */}
          {threatIntel.blocked_domains?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Blocked Domains:</p>
              <div className="flex flex-wrap gap-2">
                {threatIntel.blocked_domains.map(domain => (
                  <span key={domain} className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs font-mono flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {domain}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Custom Patterns */}
          {Object.keys(threatIntel.patterns || {}).length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Custom Patterns:</p>
              <div className="space-y-1">
                {Object.entries(threatIntel.patterns).map(([pattern, info]) => (
                  <div key={pattern} className="p-2 bg-red-500/5 border border-red-500/20 rounded text-xs">
                    <code className="text-red-400">{pattern}</code>
                    <span className="text-gray-500 ml-2">— {info.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="bg-[var(--dark-900)] rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-2">How Trust Works</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li><span className="text-green-400">TRUSTED:</span> Marked session + user requested action</li>
            <li><span className="text-blue-400">VERIFIED:</span> User requested the action in chat</li>
            <li><span className="text-yellow-400">UNVERIFIED:</span> No clear user request found</li>
            <li><span className="text-orange-400">SUSPICIOUS:</span> Matches suspicious patterns</li>
            <li><span className="text-red-400">MALICIOUS:</span> Matches threat intel, blocked</li>
          </ul>
        </section>
      </div>
    </>
  )
}
