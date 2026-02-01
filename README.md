# 🦞 OpenClaw Sentinel

**Agent Monitoring Dashboard for OpenClaw**

Real-time monitoring of your AI agent's usage, memory, performance, and security.

[![CI](https://github.com/jfr992/openclaw-sentinel/actions/workflows/ci.yml/badge.svg)](https://github.com/jfr992/openclaw-sentinel/actions/workflows/ci.yml)
[![Security](https://github.com/jfr992/openclaw-sentinel/actions/workflows/security.yml/badge.svg)](https://github.com/jfr992/openclaw-sentinel/actions/workflows/security.yml)
[![Docker](https://github.com/jfr992/openclaw-sentinel/actions/workflows/docker.yml/badge.svg)](https://github.com/jfr992/openclaw-sentinel/actions/workflows/docker.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![OpenClaw Sentinel](https://img.shields.io/badge/OpenClaw-Sentinel-orange?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48dGV4dCB5PSIuOWVtIiBmb250LXNpemU9IjkwIj7wn6adPC90ZXh0Pjwvc3ZnPg==)

## Features

| Tab | Description |
|-----|-------------|
| 📊 **Usage** | Token usage, cache efficiency, cost tracking |
| 🧠 **Memory** | Vector search status, indexed chunks, embeddings |
| ⚡ **Performance** | Task completion, latency, tool reliability |
| 🛡️ **Security** | Risk detection, threat alerts, exposure analysis |
| 💡 **Insights** | AI-generated analysis and recommendations |
| 🔴 **Live Feed** | Real-time agent activity via OpenClaw Gateway WebSocket |

### Live Feed (NEW)

Real-time streaming of agent activity directly from the OpenClaw Gateway:

- **Live token streaming** — Watch responses generate in real-time
- **Tool call tracking** — See every tool invocation as it happens
- **Run lifecycle** — Track active and completed agent runs
- **Risk alerts** — Instant security notifications on suspicious commands

Requires OpenClaw Gateway running (default: `ws://127.0.0.1:18789`).

## Quick Start

### One-Line Install

```bash
curl -fsSL https://raw.githubusercontent.com/jfr992/openclaw-sentinel/main/install.sh | bash
```

### Docker (Recommended)

```bash
# Clone
git clone https://github.com/jfr992/openclaw-sentinel.git
cd openclaw-sentinel

# Configure
cp .env.example .env
# Edit .env with your gateway token:
# OPENCLAW_GATEWAY_TOKEN=$(jq -r '.gateway.auth.token' ~/.openclaw/openclaw.json)

# Run
docker compose up -d
```

Dashboard opens at: **http://localhost:5056**

### Manual Install

```bash
# Clone
git clone https://github.com/jfr992/openclaw-sentinel.git
cd openclaw-sentinel

# Install dependencies
npm install

# Start dashboard (dev mode)
npm start
```

Dashboard opens at: **http://localhost:5055** (dev) or **5056** (production)

## Requirements

| Requirement | Required | Notes |
|-------------|----------|-------|
| Node.js 22+ | ✅ | Runtime |
| OpenClaw | ✅ | For memory/session data |
| Docker | Optional | For OTEL stack |

### Platform Support

| Platform | Status |
|----------|--------|
| macOS (arm64) | ✅ Tested |
| macOS (x64) | ✅ Supported |
| Ubuntu/Debian | ✅ Supported |
| Other Linux | ✅ Supported |
| Windows | ⚠️ Needs WSL |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5055 | Dashboard port |
| `OPENCLAW_DIR` | ~/.openclaw | OpenClaw data directory |
| `OPENCLAW_GATEWAY_URL` | ws://127.0.0.1:18789 | Gateway WebSocket URL |
| `OPENCLAW_GATEWAY_TOKEN` | — | Gateway auth token (if required) |

## Architecture

```
openclaw-sentinel/
├── src/
│   ├── App.jsx                    # Main dashboard
│   ├── components/                # Shared UI components
│   └── features/                  # Feature modules
│       ├── memory/                # OpenClaw memory status
│       ├── performance/           # Performance metrics
│       ├── security/              # Security monitoring
│       └── insights/              # AI insights
├── server/
│   └── src/
│       ├── domain/services/       # Metric calculators (13 services)
│       │   ├── LiveFeed.js        # Real-time event processing
│       │   ├── RiskScorer.js      # Security analysis
│       │   └── ...                # Other trackers
│       ├── infrastructure/
│       │   └── OpenClawGatewayClient.js  # Gateway WebSocket client
│       └── interfaces/http/       # API routes
└── server.js                      # Express + Vite server

Data Flow:
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│  OpenClaw       │  ──WS→  │  Sentinel        │  ──WS→  │  Dashboard   │
│  Gateway:18789  │         │  Server:5056     │         │  (React)     │
│  (agent events) │         │  (LiveFeed)      │         │              │
└─────────────────┘         └──────────────────┘         └──────────────┘
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/usage` | Token/cost metrics |
| `GET /api/sessions` | Session list |
| `GET /api/memory` | OpenClaw memory status |
| `GET /api/performance/*` | Performance metrics |
| `GET /api/security/*` | Security assessment |
| `GET /api/live/stats` | Live feed + gateway stats |
| `GET /api/live/events` | Recent activity, runs |
| `GET /api/health` | Health check |

### WebSocket Endpoints

| Endpoint | Description |
|----------|-------------|
| `ws://host:port/ws/live` | Real-time agent activity stream |
| `ws://host:port/ws/security` | Security alerts |

#### `/ws/live` Events

```js
// Initial snapshot on connect
{ type: 'snapshot', data: { recentEvents, activeRuns, completedRuns, stats } }

// Real-time activity
{ type: 'activity', data: { type: 'agent', runId, stream, delta, ... } }

// Run lifecycle
{ type: 'run:start', data: { runId, sessionKey, startedAt } }
{ type: 'run:complete', data: { runId, durationMs, toolCalls, risks } }

// Security alerts
{ type: 'risk:alert', data: { runId, toolCall, risk: { level, type, match } } }
```

## Optional: OTEL Stack

For traces and metrics collection:

```bash
cd otel
docker compose up -d
```

This starts:
- **Prometheus** (port 9091) — Metrics storage
- **Jaeger** (port 16686) — Traces UI
- **OTEL Collector** (port 4318) — Telemetry receiver

## Development

```bash
# Dev server with HMR
npm run dev

# Run tests (230 tests)
npm test

# Build for production
npm run build

# Lint
npm run lint
```

## Testing with Dagger

```bash
# Run tests in container
dagger call unit-test --source=.

# Full CI pipeline
dagger call ci --source=.
```

## Screenshots

### Usage Dashboard
- Real-time token consumption
- Cache hit ratio visualization
- Cost tracking by day

### Memory Dashboard
- Vector search status (sqlite-vec)
- Per-agent indexed files and chunks
- Embedding provider info

### Security Dashboard
- Risk level gauge (0-4)
- Alert feed with acknowledgment
- Network exposure analysis

---

Built with 🦞 for the OpenClaw community
