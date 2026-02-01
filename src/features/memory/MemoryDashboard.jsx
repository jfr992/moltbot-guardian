import { useState, useEffect, useCallback } from 'react'
import { Brain, Zap, Search, Database, Clock, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'

const MEMORY_API = 'http://localhost:5057'

function StatCard({ title, value, subtitle, icon: Icon, color = 'orange', trend }) {
  const colors = {
    orange: 'text-[var(--accent-orange)]',
    green: 'text-[var(--accent-green)]',
    blue: 'text-[var(--accent-blue)]',
    purple: 'text-[var(--accent-purple)]',
    cyan: 'text-[var(--accent-cyan)]',
    red: 'text-[var(--accent-red)]'
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">{title}</span>
        <Icon className={`w-4 h-4 ${colors[color]}`} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${colors[color]}`}>{value}</span>
        {trend && (
          <span className={`text-xs ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</p>}
    </div>
  )
}

function SourceBreakdown({ title, data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="card p-4">
        <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">{title}</h4>
        <p className="text-xs text-[var(--text-muted)]">No data yet</p>
      </div>
    )
  }

  const entries = Object.entries(data).sort((a, b) => {
    const aVal = typeof a[1] === 'object' ? a[1].tokens || a[1].count || 0 : a[1]
    const bVal = typeof b[1] === 'object' ? b[1].tokens || b[1].count || 0 : b[1]
    return bVal - aVal
  })

  return (
    <div className="card p-4">
      <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">{title}</h4>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {entries.map(([source, value]) => {
          const displayValue = typeof value === 'object' 
            ? `${value.chunks || 0} chunks, ${value.tokens || 0} tokens`
            : `${value} chunks`
          
          return (
            <div key={source} className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-muted)] truncate max-w-[60%]" title={source}>
                {source.replace('memory/', '').replace('.md', '')}
              </span>
              <span className="text-[var(--accent-cyan)]">{displayValue}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function MemoryDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMetrics = useCallback(async () => {
    try {
      const [metricsRes, healthRes] = await Promise.all([
        fetch(`${MEMORY_API}/metrics`).catch(() => null),
        fetch(`${MEMORY_API}/health`).catch(() => null)
      ])

      if (metricsRes?.ok) {
        setMetrics(await metricsRes.json())
        setError(null)
      } else {
        setError('Cannot connect to cangrejo-memory (port 5057)')
      }

      if (healthRes?.ok) {
        setHealth(await healthRes.json())
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 15000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="w-12 h-12 text-[var(--accent-purple)] animate-pulse mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading memory metrics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 border-[var(--accent-red)] bg-red-500/10">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-[var(--accent-red)]" />
          <div>
            <h3 className="font-semibold text-[var(--accent-red)]">Memory Service Unavailable</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">{error}</p>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Start with: <code className="bg-[var(--bg-secondary)] px-1 rounded">cd ~/clawd/cangrejo-memory && npm start</code>
            </p>
          </div>
        </div>
        <button 
          onClick={fetchMetrics}
          className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] rounded text-sm hover:bg-[var(--border)] transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      </div>
    )
  }

  const { embeddings, queries, chunks, system } = metrics || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-[var(--accent-purple)]" />
          <div>
            <h2 className="text-lg font-semibold">Vector Memory</h2>
            <p className="text-xs text-[var(--text-muted)]">
              cangrejo-memory • {health?.embedding?.provider || 'ollama'} ({health?.embedding?.model || 'nomic-embed-text'})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {health?.status === 'healthy' ? (
            <span className="flex items-center gap-1.5 text-xs text-[var(--accent-green)]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Healthy
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-[var(--accent-red)]">
              <AlertCircle className="w-3.5 h-3.5" />
              Degraded
            </span>
          )}
          <button
            onClick={fetchMetrics}
            className="p-1.5 rounded bg-[var(--bg-secondary)] hover:bg-[var(--border)] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Embeddings"
          value={embeddings?.total || 0}
          subtitle={`${embeddings?.successRate || 'N/A'} success rate`}
          icon={Zap}
          color="orange"
        />
        <StatCard
          title="Queries"
          value={queries?.total || 0}
          subtitle={`${queries?.avgLatencyMs || 0}ms avg latency`}
          icon={Search}
          color="cyan"
        />
        <StatCard
          title="Chunks Indexed"
          value={chunks?.total || 0}
          subtitle={`${chunks?.avgSize || 0} avg chars`}
          icon={Database}
          color="purple"
        />
        <StatCard
          title="Uptime"
          value={system?.uptimeHuman || 'N/A'}
          subtitle={system?.lastActivity ? `Last: ${new Date(system.lastActivity).toLocaleTimeString()}` : 'No activity'}
          icon={Clock}
          color="green"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--accent-orange)]" />
            Embedding Performance
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Avg Latency</span>
              <span className="text-[var(--accent-orange)]">{embeddings?.avgLatencyMs || 0}ms</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">P95 Latency</span>
              <span className="text-[var(--accent-orange)]">{embeddings?.p95LatencyMs || 0}ms</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Tokens Used</span>
              <span className="text-[var(--accent-orange)]">{(embeddings?.tokensUsed || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Failed</span>
              <span className={embeddings?.failed > 0 ? 'text-[var(--accent-red)]' : 'text-[var(--text-muted)]'}>
                {embeddings?.failed || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-[var(--accent-cyan)]" />
            Query Performance
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Avg Latency</span>
              <span className="text-[var(--accent-cyan)]">{queries?.avgLatencyMs || 0}ms</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">P95 Latency</span>
              <span className="text-[var(--accent-cyan)]">{queries?.p95LatencyMs || 0}ms</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Cache Hit Rate</span>
              <span className="text-[var(--accent-cyan)]">{queries?.cacheHitRate || '0%'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Avg Results</span>
              <span className="text-[var(--accent-cyan)]">{queries?.avgResultCount || '0'}</span>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-[var(--accent-purple)]" />
            Collection Info
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Total Chunks</span>
              <span className="text-[var(--accent-purple)]">{chunks?.total || 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Avg Chunk Size</span>
              <span className="text-[var(--accent-purple)]">{chunks?.avgSize || 0} chars</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Sources</span>
              <span className="text-[var(--accent-purple)]">{Object.keys(chunks?.bySource || {}).length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Dimensions</span>
              <span className="text-[var(--accent-purple)]">{health?.embedding?.dimensions || 768}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Source Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SourceBreakdown title="Embeddings by Source" data={embeddings?.bySource} />
        <SourceBreakdown title="Chunks by Source" data={chunks?.bySource} />
      </div>
    </div>
  )
}

export default MemoryDashboard
