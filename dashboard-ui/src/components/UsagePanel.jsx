import { useState, useEffect, useMemo } from 'react'
import { Calendar, Coins, Cpu, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Format number with K/M suffix
 */
function formatNumber(num) {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toLocaleString()
}

/**
 * Format cost as currency
 */
function formatCost(cost) {
  if (cost >= 1) return `$${cost.toFixed(2)}`
  if (cost >= 0.01) return `$${cost.toFixed(2)}`
  return `$${cost.toFixed(4)}`
}

/**
 * Get date string in YYYY-MM-DD format
 */
function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

/**
 * Parse YYYY-MM-DD to Date
 */
function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Get array of dates between start and end (inclusive)
 */
function getDateRange(start, end) {
  const dates = []
  const current = new Date(start)
  while (current <= end) {
    dates.push(toDateStr(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

/**
 * Date range presets
 */
const PRESETS = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
]

/**
 * Bar chart component for daily data
 */
function DailyChart({ data, dates, valueKey, formatValue, color, label }) {
  const maxValue = useMemo(() => {
    return Math.max(...dates.map(d => data[d]?.[valueKey] || 0), 1)
  }, [data, dates, valueKey])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-mono text-shell-400">{label}</span>
        <span className={`text-sm font-mono ${color}`}>
          {formatValue(dates.reduce((sum, d) => sum + (data[d]?.[valueKey] || 0), 0))} total
        </span>
      </div>
      <div className="flex items-end gap-1 h-32">
        {dates.map((date) => {
          const value = data[date]?.[valueKey] || 0
          const height = maxValue > 0 ? (value / maxValue) * 100 : 0
          const day = parseDate(date)
          const dayLabel = day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)
          
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-shell-800 border border-shell-600 rounded px-2 py-1 text-xs font-mono whitespace-nowrap">
                  <div className="text-shell-300">{date}</div>
                  <div className={color}>{formatValue(value)}</div>
                </div>
              </div>
              {/* Bar */}
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-t transition-all duration-300 hover:opacity-80 ${
                    color === 'text-neon-cyan' ? 'bg-neon-cyan/60' :
                    color === 'text-neon-green' ? 'bg-neon-green/60' :
                    color === 'text-neon-purple' ? 'bg-neon-purple/60' :
                    'bg-neon-blue/60'
                  }`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
              </div>
              {/* Day label */}
              <span className="text-[10px] font-mono text-shell-500">{dayLabel}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Model breakdown table
 */
function ModelBreakdown({ byModel }) {
  const models = useMemo(() => {
    return Object.entries(byModel || {})
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.cost - a.cost)
  }, [byModel])

  if (models.length === 0) {
    return (
      <div className="text-center text-shell-500 py-8 font-mono text-sm">
        No model data available
      </div>
    )
  }

  const totalCost = models.reduce((sum, m) => sum + m.cost, 0)

  return (
    <div className="space-y-2">
      {models.map((model) => {
        const pct = totalCost > 0 ? (model.cost / totalCost) * 100 : 0
        return (
          <div key={model.name} className="group">
            <div className="flex items-center justify-between text-sm font-mono mb-1">
              <span className="text-shell-300 truncate max-w-[60%]" title={model.name}>
                {model.name.split('/').pop()}
              </span>
              <div className="flex items-center gap-4 text-shell-400">
                <span>{formatNumber(model.tokens)} tok</span>
                <span className="text-neon-green">{formatCost(model.cost)}</span>
              </div>
            </div>
            <div className="h-1.5 bg-shell-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-neon-purple/60 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Main UsagePanel component
 */
export default function UsagePanel({ expanded }) {
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(14) // Default 14 days
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // Calculate date range
  const { startDate, endDate, dates } = useMemo(() => {
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    
    let start
    if (customStart && customEnd) {
      start = parseDate(customStart)
      const customEndDate = parseDate(customEnd)
      return {
        startDate: start,
        endDate: customEndDate,
        dates: getDateRange(start, customEndDate)
      }
    }
    
    start = new Date(end)
    start.setDate(start.getDate() - range + 1)
    
    return {
      startDate: start,
      endDate: end,
      dates: getDateRange(start, end)
    }
  }, [range, customStart, customEnd])

  // Fetch usage data
  useEffect(() => {
    async function fetchUsage() {
      setLoading(true)
      try {
        const res = await fetch('/api/usage')
        if (res.ok) {
          setUsage(await res.json())
        }
      } catch (err) {
        console.error('Failed to fetch usage:', err)
      }
      setLoading(false)
    }
    fetchUsage()
    const interval = setInterval(fetchUsage, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  // Filter byDay to selected range
  const filteredByDay = useMemo(() => {
    if (!usage?.byDay) return {}
    const result = {}
    for (const date of dates) {
      result[date] = usage.byDay[date] || { tokens: 0, cost: 0 }
    }
    return result
  }, [usage, dates])

  // Calculate totals for selected range
  const rangeTotals = useMemo(() => {
    let tokens = 0
    let cost = 0
    for (const date of dates) {
      tokens += filteredByDay[date]?.tokens || 0
      cost += filteredByDay[date]?.cost || 0
    }
    return { tokens, cost }
  }, [filteredByDay, dates])

  // Navigate date range
  const shiftRange = (direction) => {
    if (customStart && customEnd) {
      const days = dates.length
      const newStart = new Date(startDate)
      const newEnd = new Date(endDate)
      newStart.setDate(newStart.getDate() + (direction * days))
      newEnd.setDate(newEnd.getDate() + (direction * days))
      setCustomStart(toDateStr(newStart))
      setCustomEnd(toDateStr(newEnd))
    }
  }

  const clearCustomRange = () => {
    setCustomStart('')
    setCustomEnd('')
  }

  if (loading && !usage) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-shell-500 font-mono text-sm animate-pulse">
          Loading usage data...
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${expanded ? '' : ''}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-neon-cyan" />
          <h2 className="text-lg font-mono text-shell-200">Token Usage</h2>
        </div>
        
        {/* Date controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset buttons */}
          {PRESETS.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => { setRange(days); clearCustomRange() }}
              className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
                range === days && !customStart
                  ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan'
                  : 'bg-shell-800 border-shell-600 text-shell-400 hover:border-shell-500'
              }`}
            >
              {label}
            </button>
          ))}
          
          {/* Custom date inputs */}
          <div className="flex items-center gap-1 ml-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 text-xs font-mono bg-shell-800 border border-shell-600 rounded text-shell-300 focus:border-neon-cyan focus:outline-none"
            />
            <span className="text-shell-500">→</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 text-xs font-mono bg-shell-800 border border-shell-600 rounded text-shell-300 focus:border-neon-cyan focus:outline-none"
            />
          </div>
          
          {/* Navigation arrows for custom range */}
          {customStart && customEnd && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => shiftRange(-1)}
                className="p-1 rounded bg-shell-800 border border-shell-600 text-shell-400 hover:border-shell-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => shiftRange(1)}
                className="p-1 rounded bg-shell-800 border border-shell-600 text-shell-400 hover:border-shell-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card bg-neon-cyan/5 border-neon-cyan/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-neon-cyan" />
            <span className="text-xs font-mono text-shell-400">Tokens</span>
          </div>
          <div className="text-2xl font-mono text-neon-cyan">{formatNumber(rangeTotals.tokens)}</div>
          <div className="text-xs font-mono text-shell-500 mt-1">{dates.length} days</div>
        </div>
        
        <div className="card bg-neon-green/5 border-neon-green/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-neon-green" />
            <span className="text-xs font-mono text-shell-400">Cost</span>
          </div>
          <div className="text-2xl font-mono text-neon-green">{formatCost(rangeTotals.cost)}</div>
          <div className="text-xs font-mono text-shell-500 mt-1">
            ~{formatCost(rangeTotals.cost / dates.length)}/day avg
          </div>
        </div>
        
        <div className="card bg-neon-purple/5 border-neon-purple/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-neon-purple" />
            <span className="text-xs font-mono text-shell-400">Efficiency</span>
          </div>
          <div className="text-2xl font-mono text-neon-purple">
            {usage?.cacheHitRatio?.toFixed(1) || 0}%
          </div>
          <div className="text-xs font-mono text-shell-500 mt-1">cache hit ratio</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card bg-shell-900/50 border-shell-700 p-4">
          <DailyChart
            data={filteredByDay}
            dates={dates}
            valueKey="tokens"
            formatValue={formatNumber}
            color="text-neon-cyan"
            label="DAILY TOKENS"
          />
        </div>
        
        <div className="card bg-shell-900/50 border-shell-700 p-4">
          <DailyChart
            data={filteredByDay}
            dates={dates}
            valueKey="cost"
            formatValue={formatCost}
            color="text-neon-green"
            label="DAILY COST"
          />
        </div>
      </div>

      {/* Model breakdown */}
      <div className="card bg-shell-900/50 border-shell-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-neon-purple" />
          <span className="text-sm font-mono text-shell-400">MODEL BREAKDOWN</span>
        </div>
        <ModelBreakdown byModel={usage?.byModel} />
      </div>
    </div>
  )
}
