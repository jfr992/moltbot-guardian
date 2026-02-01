# 🦞 OpenClaw Sentinel

**Agent Monitoring Dashboard for OpenClaw**

Real-time monitoring of your AI agent's usage, memory, performance, and security.

![OpenClaw Sentinel](https://img.shields.io/badge/OpenClaw-Sentinel-orange?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48dGV4dCB5PSIuOWVtIiBmb250LXNpemU9IjkwIj7wn6adPC90ZXh0Pjwvc3ZnPg==)

## Features

| Tab | Description |
|-----|-------------|
| 📊 **Usage** | Token usage, cache efficiency, cost tracking |
| 🧠 **Memory** | Vector search status, indexed chunks, embeddings |
| ⚡ **Performance** | Task completion, latency, tool reliability |
| 🛡️ **Security** | Risk detection, threat alerts, exposure analysis |
| 💡 **Insights** | AI-generated analysis and recommendations |

## Quick Start

### One-Line Install

```bash
curl -fsSL https://raw.githubusercontent.com/jfr992/openclaw-sentinel/main/install.sh | bash
```

### Manual Install

```bash
# Clone
git clone https://github.com/jfr992/openclaw-sentinel.git
cd openclaw-sentinel

# Install dependencies
npm install

# Start dashboard
npm start
```

Dashboard opens at: **http://localhost:5055**

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
│       ├── domain/services/       # Metric calculators (12 services)
│       └── interfaces/http/       # API routes
└── server.js                      # Express + Vite server
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/usage` | Token/cost metrics |
| `GET /api/sessions` | Session list |
| `GET /api/memory` | OpenClaw memory status |
| `GET /api/performance/*` | Performance metrics |
| `GET /api/security/*` | Security assessment |
| `GET /api/health` | Health check |

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

# Run tests (204 tests)
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
