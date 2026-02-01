import { useState, useEffect, useCallback } from 'react'
import { Shield, ShieldAlert, AlertTriangle, Activity, Globe, FileWarning, RefreshCw } from 'lucide-react'
import RiskGauge from './RiskGauge'
import AlertFeed from './AlertFeed'
import ExposurePanel from './ExposurePanel'

export default function SecurityDashboard() {
  const [risks, setRisks] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [exposure, setExposure] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [risksRes, alertsRes, exposureRes] = await Promise.all([
        fetch('/api/security/risks'),
        fetch('/api/security/alerts?limit=20'),
        fetch('/api/security/exposure')
      ])

      if (risksRes.ok) setRisks(await risksRes.json())
      if (alertsRes.ok) {
        const data = await alertsRes.json()
        setAlerts(data.alerts || [])
      }
      if (exposureRes.ok) setExposure(await exposureRes.json())
      
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // WebSocket for real-time alerts
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)

    let ws
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      ws = new WebSocket(`${protocol}//${window.location.host}/ws/security`)
      
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        if (msg.type === 'alert') {
          setAlerts(prev => [msg.data, ...prev].slice(0, 50))
        } else if (msg.type === 'risk_update') {
          setRisks(prev => ({ ...prev, ...msg.data }))
        }
      }
      
      ws.onerror = () => console.log('[WS] Connection error')
      ws.onclose = () => console.log('[WS] Disconnected')
    } catch (err) {
      console.log('[WS] Failed to connect:', err.message)
    }

    return () => {
      clearInterval(interval)
      if (ws) ws.close()
    }
  }, [fetchData])

  const acknowledgeAlert = async (id) => {
    try {
      await fetch(`/api/security/alerts/${id}/acknowledge`, { method: 'POST' })
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a))
    } catch (err) {
      console.error('Failed to acknowledge:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-[var(--accent-purple)] mx-auto mb-2 animate-pulse" />
          <p className="text-[var(--text-muted)]">Analyzing security...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-[var(--accent-purple)]" />
          <h2 className="text-xl font-bold">Security Monitor</h2>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--border)] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="card p-4 border-[var(--accent-red)] bg-red-500/10">
          <div className="flex items-center gap-2 text-[var(--accent-red)]">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk Gauge */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Risk Level
          </h3>
          <RiskGauge 
            level={risks?.level || 0} 
            levelName={risks?.levelName || 'NONE'}
            criticalCount={risks?.criticalCount || 0}
            highCount={risks?.highCount || 0}
          />
        </div>

        {/* Risk Summary */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Risk Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)]">Total Risks</span>
              <span className="font-mono font-bold">{risks?.totalRisks || 0}</span>
            </div>
            {risks?.summary?.byType && Object.entries(risks.summary.byType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] text-sm capitalize">
                  {type.replace(/_/g, ' ')}
                </span>
                <span className="font-mono text-sm">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Exposure Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)]">External Calls</span>
              <span className="font-mono font-bold">{exposure?.externalCalls?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)]">Unique Domains</span>
              <span className="font-mono font-bold">{exposure?.topDestinations?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)]">Sensitive Access</span>
              <span className={`font-mono font-bold ${exposure?.sensitiveAccess?.length > 0 ? 'text-[var(--accent-red)]' : ''}`}>
                {exposure?.sensitiveAccess?.length || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)]">Data Flow Out</span>
              <span className="font-mono font-bold">{exposure?.dataFlowOut || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts and Exposure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Feed */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--accent-amber)]" />
            Recent Alerts
            {alerts.filter(a => !a.acknowledged).length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-[var(--accent-red)] text-white">
                {alerts.filter(a => !a.acknowledged).length}
              </span>
            )}
          </h3>
          <AlertFeed alerts={alerts} onAcknowledge={acknowledgeAlert} />
        </div>

        {/* Exposure Panel */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-[var(--accent-cyan)]" />
            Network Exposure
          </h3>
          <ExposurePanel exposure={exposure} />
        </div>
      </div>

      {/* Recent Risks Detail */}
      {risks?.recentRisks?.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">
            Recent Risk Details
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {risks.recentRisks.map((risk, i) => (
              <div 
                key={i}
                className={`p-3 rounded-lg border ${
                  risk.level >= 4 ? 'border-purple-500/50 bg-purple-500/10' :
                  risk.level >= 3 ? 'border-red-500/50 bg-red-500/10' :
                  risk.level >= 2 ? 'border-orange-500/50 bg-orange-500/10' :
                  'border-yellow-500/50 bg-yellow-500/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-xs font-bold uppercase ${
                      risk.level >= 4 ? 'text-purple-400' :
                      risk.level >= 3 ? 'text-red-400' :
                      risk.level >= 2 ? 'text-orange-400' :
                      'text-yellow-400'
                    }`}>
                      {risk.level >= 4 ? 'CRITICAL' :
                       risk.level >= 3 ? 'HIGH' :
                       risk.level >= 2 ? 'MEDIUM' : 'LOW'}
                    </span>
                    <p className="text-sm mt-1">{risk.description}</p>
                    <code className="text-xs text-[var(--text-muted)] mt-1 block">
                      {risk.match}
                    </code>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">
                    {risk.toolCall}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
