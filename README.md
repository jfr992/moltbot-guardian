<div align="center">

# 🦀 MoltBot Guardian

**Real-time security monitoring for AI agent operations**

[![CI](https://github.com/jfr992/moltbot-guardian/actions/workflows/ci.yml/badge.svg)](https://github.com/jfr992/moltbot-guardian/actions/workflows/ci.yml)
[![Docker](https://img.shields.io/badge/docker-ghcr.io-blue.svg)](https://github.com/jfr992/moltbot-guardian/pkgs/container/moltbot-guardian)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![MoltBot Guardian Dashboard](docs/screenshot.png)

</div>

---

## What is this?

A **security monitoring layer** for [Clawdbot](https://github.com/clawdbot/clawdbot) AI agents. It watches what your agents do and alerts you to suspicious activity.

**This is NOT MoltBot itself** — it's a companion tool that monitors MoltBot/Clawdbot operations.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🚨 Security Alerts** | Detects reverse shells, data exfiltration, privilege escalation |
| **⚡ Kill Session** | One-click termination of suspicious agent sessions |
| **🌐 Network Monitor** | Real-time connections with threat detection (50+ domains, 30+ ports) |
| **📊 Operation Stats** | Counters by type: Read, Write, Edit, Exec, Message, Browser |
| **📝 Activity Log** | Real-time feed of all tool calls with timestamps |
| **🧠 Baseline Learning** | Learns normal patterns, flags anomalies |
| **🔐 Local Only** | No external data transmission |

---

## 🚀 Quick Start

### Docker (Recommended)

```bash
# Get your Clawdbot gateway token
TOKEN=$(jq -r '.gateway.auth.token' ~/.clawdbot/clawdbot.json)

# Run Guardian
docker run -d --name guardian \
  -p 5050:5050 \
  -v ~/.clawdbot:/data:ro \
  -e CLAWDBOT_API_TOKEN="$TOKEN" \
  ghcr.io/jfr992/moltbot-guardian:latest
```

**Dashboard:** http://localhost:5050

### From Source

```bash
git clone https://github.com/jfr992/moltbot-guardian.git
cd moltbot-guardian
./dev.sh setup
./dev.sh start
```

---

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MOLTBOT_PORT` | `5050` | Dashboard port |
| `CLAWDBOT_DIR` | `~/.clawdbot` | Agent session logs location |
| `CLAWDBOT_API_TOKEN` | - | Gateway token (for kill functionality) |

---

## 📊 API

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/activity` | Recent tool calls, connections |
| `GET /api/alerts` | Security alerts |
| `GET /api/network/detailed` | Network analysis with threats |
| `POST /api/sessions/kill` | Kill agent session |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              MoltBot Guardian                    │
├─────────────────────────────────────────────────┤
│  React Dashboard    │  Flask API + SocketIO     │
│  ├─ Metrics         │  ├─ Session parser        │
│  ├─ Activity Log    │  ├─ Security detector     │
│  ├─ Alerts          │  ├─ Threat intelligence   │
│  ├─ Network         │  └─ Gateway WebSocket     │
│  └─ Operation Stats │                           │
├─────────────────────────────────────────────────┤
│  ~/.clawdbot/agents/*.jsonl (session logs)      │
└─────────────────────────────────────────────────┘
```

---

## vs Crabwalk

| | **Guardian** | **[Crabwalk](https://github.com/luccast/crabwalk)** |
|---|---|---|
| **Purpose** | Security monitoring | Visual agent watching |
| **Focus** | Threat detection & alerts | Node graph visualization |
| **Kill sessions** | ✅ Yes | ❌ No |
| **Use case** | "Is my agent doing something bad?" | "What is my agent doing?" |

**They're complementary** — use both for full visibility.

---

## 📜 License

MIT — See [LICENSE](LICENSE)

---

<div align="center">

**A security layer for [Clawdbot](https://github.com/clawdbot/clawdbot)** 🦀

</div>
