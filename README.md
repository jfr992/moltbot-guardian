<div align="center">

# 🦀 MoltBot Guardian

**Security dashboard for AI agent operations**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## Quick Start

**Docker (recommended):**
```bash
docker run -d --name moltbot-guardian \
  -p 5050:5050 \
  -v ~/.clawdbot:/data:ro \
  --read-only --security-opt no-new-privileges:true \
  ghcr.io/jfr992/moltbot-security-dashboard:latest
```

**From source:**
```bash
git clone https://github.com/jfr992/moltbot-security-dashboard.git
cd moltbot-security-dashboard
./dev.sh setup && ./dev.sh start
```

**Dashboard:** http://localhost:5050

---

## Features

| Feature | Description |
|---------|-------------|
| 🚨 Security Alerts | Detect shells, exfil, privesc |
| 📊 Baseline Learning | Learns normal → flags anomalies |
| 🔐 Encrypted Baselines | AES-256-GCM for sensitive envs |
| 🌐 Network Monitor | Track connections (native only) |
| ⚡ Live Events | Real-time via gateway WebSocket |

---

## How It Works

**Data sources:**
1. **Session files** — Parses `~/.clawdbot/agents/*.jsonl`
2. **Gateway WebSocket** — Live events from Clawdbot (`ws://localhost:18789`)
3. **Network (native only)** — Uses `lsof` for connection tracking

**Docker limitation:** Network monitoring disabled (container can't see host processes). Run natively for full visibility.

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MOLTBOT_PORT` | `5050` | Dashboard port |
| `CLAWDBOT_DIR` | `~/.clawdbot` | Agent logs |
| `CLAWDBOT_URL` | `ws://127.0.0.1:18789` | Gateway URL (auto-detects Docker) |

---

## Development

```bash
./dev.sh setup   # Install deps + pre-commit
./dev.sh start   # Run locally
./dev.sh lint    # Run checks
./dev.sh docker  # Build & run container
```

---

## Live Events

Header shows **LIVE** (cyan) when connected to gateway, **OFFLINE** (gray) when not.

Auto-configures from `~/.clawdbot/clawdbot.json`. Docker uses `host.docker.internal` automatically.

---

## License

MIT — [molt.bot](https://molt.bot)
