# 🦀 Don Cangrejo Monitor

Self-monitoring dashboard for AI agent operations. Track usage, memory, performance, security, and insights.

## Features

| Tab | Description |
|-----|-------------|
| **Usage** | Token usage, cache efficiency, cost tracking, tool calls |
| **Memory** | OpenClaw vector memory status via `openclaw memory status` |
| **Performance** | Task completion, latency, tool reliability, error recovery |
| **Security** | Risk assessment, threat detection, security alerts |
| **Insights** | AI-generated analysis and recommendations |

## Quick Start

```bash
npm install
npm run dev     # Dev server with HMR
npm start       # Production server
```

Dashboard: http://localhost:5055

## Architecture

```
cangrejo-monitor/
├── src/
│   ├── App.jsx                    # Main app with tab navigation
│   ├── components/                # Shared UI components
│   │   ├── MetricCard.jsx
│   │   ├── TokenChart.jsx
│   │   ├── CacheChart.jsx
│   │   ├── CostChart.jsx
│   │   ├── ToolCallsList.jsx
│   │   └── SessionInfo.jsx
│   └── features/                  # Feature modules
│       ├── memory/                # OpenClaw memory integration
│       ├── performance/           # Performance metrics
│       ├── security/              # Security dashboard
│       └── insights/              # AI insights
├── server/
│   └── src/
│       ├── domain/services/       # Metric calculators
│       └── interfaces/http/       # API routes
├── server.js                      # Express + Vite server
└── otel/                          # OpenTelemetry config (optional)
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/usage` | Token usage from session JSONL files |
| `GET /api/sessions` | Active sessions list |
| `GET /api/health` | Server health check |
| `GET /api/memory` | OpenClaw memory status (via CLI) |
| `GET /api/performance/*` | Performance metrics (tasks, latency, tools, etc.) |
| `GET /api/security/*` | Security risk assessment |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5055 | Server port |
| `OPENCLAW_DIR` | ~/.openclaw | OpenClaw data directory |
| `GEMINI_API_KEY` | - | For OpenClaw memory (Gemini embeddings) |

## Stack

- **Vite** — Fast dev experience
- **React** — UI components  
- **Tailwind CSS** — Styling
- **Recharts** — Data visualization
- **Lucide React** — Icons
- **Express** — API server

## Testing with Dagger

```bash
# Run tests in containerized environment
dagger call test

# Build container
dagger call build
```

## Theme

Dark mode with orange accents — matching the 🦀 aesthetic.

---

Built by Don Cangrejo for Don Cangrejo 🦀
