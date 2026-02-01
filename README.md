# OpenClaw Sentinel

**Monitor your AI agent's behavior, costs, and performance — all in one dashboard.**

![Dashboard Preview](docs/images/01-usage-tab.png)

---

## What is Sentinel?

Sentinel watches over your OpenClaw AI agent and provides visibility into:

- **Spending** — Track tokens and costs by day
- **Performance** — Task completion, response speed, tool reliability
- **Behavior** — Self-corrections, user sentiment, context health
- **Security** — Alerts for sensitive operations
- **Memory** — Vector search stats and indexing status

---

## Quick Start

### Docker (Recommended)

```bash
docker run -d \
  --name sentinel \
  -p 5056:5056 \
  -v ~/.openclaw:/data/.openclaw:ro \
  -v sentinel-data:/app/data \
  -e OPENCLAW_GATEWAY_URL=ws://host.docker.internal:18789 \
  -e OPENCLAW_GATEWAY_TOKEN=your-token-here \
  ghcr.io/jfr992/openclaw-sentinel:latest
```

Open **http://localhost:5056** in your browser.

> Replace `your-token-here` with your OpenClaw gateway token for real-time events.

### Run Locally

```bash
git clone https://github.com/jfr992/openclaw-sentinel.git
cd openclaw-sentinel
npm install
npm start
```

---

## Features

| Tab | Description |
|-----|-------------|
| **Usage** | Tokens, costs, cache efficiency, daily trends |
| **Memory** | Indexed files, chunks, vector search status |
| **Performance** | Task completion %, response time, tool success rate |
| **Security** | Risk alerts, suspicious commands, credential access |
| **Insights** | Self-correction score, user sentiment, context health |

---

## Dashboard Tour

### Usage Tab
Track token consumption, costs, and cache efficiency.

![Usage Tab](docs/images/01-usage-tab.png)

### Memory Tab
Monitor vector search and indexed files.

![Memory Tab](docs/images/02-memory-tab.png)

### Performance Tab
Overall agent performance score with detailed metrics.

![Performance Tab](docs/images/03-performance-tab.png)

### Security Tab
Risk alerts and suspicious operation monitoring.

![Security Tab](docs/images/04-security-tab.png)

### Insights Tab
Behavioral analysis: corrections, sentiment, context health.

![Insights Tab](docs/images/05-insights-tab.png)

### API Documentation
Full OpenAPI 3.0 spec with Swagger UI at `/api/docs`.

![Swagger UI](docs/images/06-swagger-ui.png)

---

## Controls

### Header
- **Refresh** — Manually refresh data
- **Import** — Import historical data from session files
- **Online/Offline** — Gateway connection status

### Multi-Agent Support

When multiple agents are detected, an **Agent** dropdown appears in the control bar:

- **All Agents** — Aggregate metrics across all agents (default)
- **Select Agent** — Filter to see only that agent's data

This works across all tabs and all metrics APIs via `?agent=<id>` parameter.

### Date Range

Select a time range to filter historical data:
- **1H, 6H, 24H** — Short-term view
- **7D, 14D, 30D** — Weekly/monthly trends
- **Custom** — Pick specific dates

---

## Metrics Reference

### Usage
- **Total Tokens** — Input + output tokens used
- **Cache Hit** — % of requests served from cache (higher = cheaper)
- **Total Cost** — Estimated spend in USD
- **Messages** — Total conversation turns

### Performance
- **Overall Score** — 0-100 rating of agent performance
- **Task Completion** — % of tasks completed successfully
- **Response Latency** — Average response time
- **Tool Success** — % of tool calls that succeeded
- **Memory Retrieval** — How often memory is accessed
- **Proactive Actions** — Self-initiated helpful actions

### Insights
- **Self-Correction Score** — Lower is better (fewer mistakes)
- **User Sentiment** — How satisfied users seem (from message tone)
- **Context Health** — Conversation continuity (higher = fewer context losses)

### Security
- **Risk Level** — 0 (none) to 4 (critical)
- **Alerts** — Suspicious operations detected
- **Actions** — Acknowledge or dismiss alerts

---

## Data Storage

Sentinel stores metrics in a local SQLite database:

| Setting | Value |
|---------|-------|
| Location | `./data/metrics.db` (native) or `/app/data/metrics.db` (Docker) |
| Retention | 30 days |
| Sync | Every 5 minutes (configurable via `SYNC_INTERVAL_MS`) |

To persist data in Docker, use a volume:
```bash
-v sentinel-data:/app/data
```

---

## Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `OPENCLAW_DIR` | Path to OpenClaw data | `~/.openclaw` |
| `DATA_DIR` | Path to Sentinel data | `./data` |
| `PORT` | Server port | `5056` |
| `OPENCLAW_GATEWAY_URL` | Gateway WebSocket URL | `ws://127.0.0.1:18789` |
| `OPENCLAW_GATEWAY_TOKEN` | Gateway auth token | — |
| `SYNC_INTERVAL_MS` | Metrics sync interval | `300000` (5 min) |
| `OTEL_ENABLED` | Enable OpenTelemetry | `false` |

---

## Troubleshooting

**Dashboard shows "Offline"**
- Check if OpenClaw Gateway is running (`openclaw status`)
- Verify the gateway URL and token in environment variables

**Memory tab shows "Not Found"**
- Ensure `~/.openclaw` is mounted in Docker
- Check that OpenClaw has indexed some files

**Metrics seem outdated**
- Click the Refresh button
- Or run Import to re-sync from session files

---

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Configuration Options](docs/CONFIGURATION.md)
- [Contributing Guide](docs/CONTRIBUTING.md)

---

## License

MIT — See [LICENSE](LICENSE) for details.
