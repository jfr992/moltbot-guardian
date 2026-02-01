/**
 * PerformanceDashboard - Display all performance metrics
 */
import { useState, useEffect, useCallback } from 'react'
import { 
  CheckCircle, 
  Clock, 
  Wrench, 
  Brain, 
  Zap, 
  HeartPulse,
  RefreshCw,
  Activity
} from 'lucide-react'
import OverallScore from './OverallScore'
import MetricCard from './MetricCard'

export default function PerformanceDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/performance/summary')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSummary(data)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
    const interval = setInterval(fetchSummary, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [fetchSummary])

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (error && !summary) {
    return (
      <div className="p-6 rounded-lg bg-red-900/20 border border-red-800 text-red-400">
        <p className="font-medium">Failed to load performance data</p>
        <p className="text-sm mt-1">{error}</p>
        <button 
          onClick={fetchSummary}
          className="mt-3 px-4 py-2 bg-red-800/50 rounded hover:bg-red-800/70 transition"
        >
          Retry
        </button>
      </div>
    )
  }

  const { 
    overallScore = 0, 
    status = 'unknown',
    tasks = {},
    latency = {},
    tools = {},
    memory = {},
    proactive = {},
    recovery = {}
  } = summary || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-100">Performance</h2>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={fetchSummary}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Score */}
      <div className="flex justify-center">
        <OverallScore score={overallScore} status={status} />
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          title="Task Completion"
          icon={CheckCircle}
          value={tasks.completionRate || 0}
          unit="%"
          subValue={tasks.total || 0}
          subLabel="Total tasks"
          status={tasks.completionRate >= 80 ? 'healthy' : tasks.completionRate >= 60 ? 'needs-attention' : 'poor'}
        />

        <MetricCard
          title="Response Latency"
          icon={Clock}
          value={latency.avgMs || 0}
          unit="ms"
          trend={latency.trend}
          status={latency.avgMs < 5000 ? 'fast' : latency.avgMs < 15000 ? 'normal' : 'slow'}
        />

        <MetricCard
          title="Tool Success"
          icon={Wrench}
          value={tools.successRate || 0}
          unit="%"
          subValue={tools.total || 0}
          subLabel="Total calls"
          status={tools.successRate >= 95 ? 'excellent' : tools.successRate >= 80 ? 'good' : 'needs-attention'}
        />

        <MetricCard
          title="Memory Usage"
          icon={Brain}
          value={memory.usageRate || 0}
          unit="%"
          status={memory.effectiveness || 'unknown'}
        />

        <MetricCard
          title="Proactive Actions"
          icon={Zap}
          value={proactive.valueScore || 0}
          unit="pts"
          subValue={proactive.total || 0}
          subLabel="Total actions"
          status={proactive.valueScore >= 50 ? 'valuable' : proactive.total > 0 ? 'moderate' : 'inactive'}
        />

        <MetricCard
          title="Error Recovery"
          icon={HeartPulse}
          value={recovery.recoveryRate || 0}
          unit="%"
          subValue={recovery.totalErrors || 0}
          subLabel="Total errors"
          status={recovery.recoveryRate >= 80 ? 'resilient' : recovery.recoveryRate >= 50 ? 'moderate' : 'fragile'}
        />
      </div>

      {/* Timestamp */}
      {summary?.timestamp && (
        <div className="text-center text-xs text-gray-600">
          Data from: {new Date(summary.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  )
}
