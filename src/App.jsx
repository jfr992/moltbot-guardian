import { useState, useEffect, useCallback } from 'react'
import { Activity, Zap, Database, DollarSign, AlertTriangle, Clock, Cpu, RefreshCw } from 'lucide-react'
import TokenChart from './components/TokenChart'
import CacheChart from './components/CacheChart'
import CostChart from './components/CostChart'
import MetricCard from './components/MetricCard'
import ToolCallsList from './components/ToolCallsList'
import SessionInfo from './components/SessionInfo'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [online, setOnline] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [usageRes, sessionsRes, healthRes] = await Promise.all([
        fetch('/api/usage').catch(() => null),
        fetch('/api/sessions').catch(() => null),
        fetch('/api/health').catch(() => null)
      ])

      const usage = usageRes?.ok ? await usageRes.json() : null
      const sessions = sessionsRes?.ok ? await sessionsRes.json() : null
      const health = healthRes?.ok ? await healthRes.json() : null

      setOnline(!!health)

      if (usage) {
        setData({
          metrics: {
            totalInput: usage.totalInput || 0,
            totalOutput: usage.totalOutput || 0,
            totalCacheRead: usage.totalCacheRead || 0,
            totalCacheWrite: usage.totalCacheWrite || 0,
            totalCost: (usage.totalCost || 0).toFixed(4),
            messageCount: usage.messageCount || 0,
            cacheHitRatio: usage.cacheHitRatio || '0',
            byModel: usage.byModel || {},
            byDay: usage.byDay || {}
          },
          toolCalls: usage.toolCalls || [],
          sessions: sessions?.sessions || []
        })
        setLastUpdate(new Date())
        setError(null)
      } else {
        setError('Failed to fetch data')
      }
    } catch (err) {
      setError(err.message)
      setOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🦀</div>
          <div className="text-[var(--text-muted)]">Loading...</div>
        </div>
      </div>
    )
  }

  const { metrics, toolCalls, sessions } = data || {}

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-3 md:gap-4">
          <span className="text-3xl md:text-4xl">🦀</span>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[var(--accent-orange)]">Don Cangrejo Monitor</h1>
            <p className="text-[var(--text-muted)] text-xs md:text-sm">Self-monitoring dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {lastUpdate && (
            <span className="text-xs text-[var(--text-muted)] hidden md:flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={fetchData}
            className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--border)] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {online ? (
            <span className="flex items-center gap-2 text-[var(--accent-green)] text-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse-glow" />
              <span className="hidden md:inline">Online</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-[var(--accent-red)] text-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-red)]" />
              <span className="hidden md:inline">Offline</span>
            </span>
          )}
        </div>
      </header>

      {error && (
        <div className="card p-4 mb-6 border-[var(--accent-red)] bg-red-500/10">
          <div className="flex items-center gap-2 text-[var(--accent-red)]">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <MetricCard
          title="Total Tokens"
          value={((metrics?.totalInput || 0) + (metrics?.totalOutput || 0)).toLocaleString()}
          subtitle={`${(metrics?.totalInput || 0).toLocaleString()} in / ${(metrics?.totalOutput || 0).toLocaleString()} out`}
          icon={Zap}
          color="orange"
        />
        <MetricCard
          title="Cache Hit"
          value={`${metrics?.cacheHitRatio || 0}%`}
          subtitle={`${(metrics?.totalCacheRead || 0).toLocaleString()} cached`}
          icon={Database}
          color={parseFloat(metrics?.cacheHitRatio) > 50 ? 'green' : 'amber'}
        />
        <MetricCard
          title="Total Cost"
          value={`$${metrics?.totalCost || '0.00'}`}
          subtitle="Estimated spend"
          icon={DollarSign}
          color="blue"
        />
        <MetricCard
          title="Messages"
          value={metrics?.messageCount || 0}
          subtitle={`${sessions?.length || 0} sessions`}
          icon={Activity}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="card p-4 md:p-6">
          <h3 className="text-xs md:text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--accent-orange)]" />
            Token Usage by Day
          </h3>
          <TokenChart data={metrics?.byDay} />
        </div>
        <div className="card p-4 md:p-6">
          <h3 className="text-xs md:text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-[var(--accent-cyan)]" />
            Cache Efficiency
          </h3>
          <CacheChart 
            cacheRead={metrics?.totalCacheRead || 0}
            totalInput={metrics?.totalInput || 0}
          />
        </div>
        <div className="card p-4 md:p-6">
          <h3 className="text-xs md:text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[var(--accent-green)]" />
            Cost by Day
          </h3>
          <CostChart data={metrics?.byDay} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="card p-4 md:p-6">
          <h3 className="text-xs md:text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[var(--accent-purple)]" />
            Recent Tool Calls
          </h3>
          <ToolCallsList calls={toolCalls} />
        </div>
        <div className="card p-4 md:p-6">
          <h3 className="text-xs md:text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--accent-blue)]" />
            Active Sessions
          </h3>
          <SessionInfo sessions={sessions} />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 md:mt-8 text-center text-[var(--text-muted)] text-xs">
        Don Cangrejo Self-Monitor • Built with 🦀 and Recharts
      </footer>
    </div>
  )
}

export default App
