/**
 * EfficiencyCalculator - Diagnostic efficiency metrics
 *
 * IMPORTANT: These are DIAGNOSTIC tools, not performance metrics.
 * Always interpret alongside Cache Ratio and Session Size for context.
 *
 * Use cases:
 * - High Cost/PR + Low Cache Ratio → "Your CLAUDE.md needs work"
 * - High Cost/PR + High Session Size → "You're going in circles, start fresh"
 * - High Cost/PR + Normal metrics → "Complex work, that's fine"
 */

/**
 * Calculate Cost per PR
 * Simple division of totals (NOT max_over_time which gives wrong ratios)
 * @param {number} totalCost - Total cost in dollars
 * @param {number} prCount - Number of PRs
 * @returns {number} Cost per PR (or 0 if no PRs)
 */
export function calculateCostPerPR(totalCost, prCount) {
  if (!prCount || prCount <= 0) return 0
  return totalCost / prCount
}

/**
 * Calculate Cost per Session
 * @param {number} totalCost - Total cost in dollars
 * @param {number} sessionCount - Number of sessions
 * @returns {number} Cost per session (or 0 if no sessions)
 */
export function calculateCostPerSession(totalCost, sessionCount) {
  if (!sessionCount || sessionCount <= 0) return 0
  return totalCost / sessionCount
}

/**
 * Calculate Cost per Commit
 * @param {number} totalCost - Total cost in dollars
 * @param {number} commitCount - Number of commits
 * @returns {number} Cost per commit (or 0 if no commits)
 */
export function calculateCostPerCommit(totalCost, commitCount) {
  if (!commitCount || commitCount <= 0) return 0
  return totalCost / commitCount
}

/**
 * Calculate average session size (tokens per session)
 * @param {number} totalTokens - Total tokens (input + output)
 * @param {number} sessionCount - Number of sessions
 * @returns {number} Average tokens per session
 */
export function calculateAvgSessionSize(totalTokens, sessionCount) {
  if (!sessionCount || sessionCount <= 0) return 0
  return Math.round(totalTokens / sessionCount)
}

/**
 * Diagnose efficiency based on metrics
 * Returns diagnostic insights, not judgments
 * @param {Object} metrics - Efficiency metrics object
 * @returns {Object} Diagnostic assessment
 */
export function diagnoseEfficiency(metrics) {
  const { costPerPR, costPerSession, costPerCommit, cacheHitRatio, avgSessionSize } = metrics

  const diagnostics = []
  let overallStatus = 'normal'

  // Thresholds (adjustable)
  const HIGH_COST_PER_PR = 5.0 // $5 per PR
  const HIGH_COST_PER_SESSION = 2.0 // $2 per session
  const HIGH_COST_PER_COMMIT = 1.0 // $1 per commit
  const LOW_CACHE_RATIO = 30 // Below 30%
  const HIGH_SESSION_SIZE = 100000 // 100k tokens

  // High Cost/PR analysis
  if (costPerPR > HIGH_COST_PER_PR) {
    if (cacheHitRatio < LOW_CACHE_RATIO) {
      diagnostics.push({
        type: 'cache_issue',
        severity: 'warning',
        message: 'High Cost/PR with low cache ratio',
        suggestion: 'Improve CLAUDE.md or project documentation for better caching'
      })
      overallStatus = 'needs_attention'
    } else if (avgSessionSize > HIGH_SESSION_SIZE) {
      diagnostics.push({
        type: 'session_bloat',
        severity: 'warning',
        message: 'High Cost/PR with large session sizes',
        suggestion: 'Sessions may be going in circles - consider starting fresh more often'
      })
      overallStatus = 'needs_attention'
    } else {
      diagnostics.push({
        type: 'complex_work',
        severity: 'info',
        message: 'High Cost/PR with normal cache and session metrics',
        suggestion: 'Likely complex work - this is expected for difficult tasks'
      })
    }
  }

  // High Cost/Session without high Cost/PR
  if (costPerSession > HIGH_COST_PER_SESSION && costPerPR <= HIGH_COST_PER_PR) {
    diagnostics.push({
      type: 'session_efficiency',
      severity: 'info',
      message: 'Sessions are costly but PRs are efficient',
      suggestion: 'Consider batching related work into fewer sessions'
    })
  }

  // Excellent efficiency
  if (costPerPR <= HIGH_COST_PER_PR / 2 && cacheHitRatio >= 50) {
    diagnostics.push({
      type: 'excellent',
      severity: 'success',
      message: 'Great efficiency with good cache utilization',
      suggestion: 'Keep doing what you\'re doing!'
    })
    overallStatus = 'excellent'
  }

  return {
    status: overallStatus,
    diagnostics,
    context: {
      cacheRatioNote: cacheHitRatio < LOW_CACHE_RATIO
        ? 'Low cache ratio - model is re-reading files frequently'
        : 'Good cache utilization',
      sessionSizeNote: avgSessionSize > HIGH_SESSION_SIZE
        ? 'Large sessions - context may be getting cluttered'
        : 'Normal session sizes'
    }
  }
}

/**
 * Calculate all efficiency metrics from usage data
 * @param {Object} usageData - Aggregated usage data
 * @param {Object} activityCounts - { prCount, commitCount, sessionCount }
 * @returns {Object} Complete efficiency metrics with diagnostics
 */
export function calculateEfficiencyMetrics(usageData, activityCounts = {}) {
  const { totalCost = 0, totalInput = 0, totalOutput = 0, cacheHitRatio = 0 } = usageData
  const { prCount = 0, commitCount = 0, sessionCount = 0 } = activityCounts

  const totalTokens = totalInput + totalOutput

  const metrics = {
    // Cost efficiency metrics (diagnostic, not performance)
    costPerPR: calculateCostPerPR(totalCost, prCount),
    costPerSession: calculateCostPerSession(totalCost, sessionCount),
    costPerCommit: calculateCostPerCommit(totalCost, commitCount),

    // Context metrics (always show alongside cost metrics)
    cacheHitRatio,
    avgSessionSize: calculateAvgSessionSize(totalTokens, sessionCount),

    // Raw counts for transparency
    counts: {
      prs: prCount,
      commits: commitCount,
      sessions: sessionCount,
      totalCost,
      totalTokens
    }
  }

  // Add diagnostics
  metrics.diagnostics = diagnoseEfficiency(metrics)

  return metrics
}

export default {
  calculateCostPerPR,
  calculateCostPerSession,
  calculateCostPerCommit,
  calculateAvgSessionSize,
  diagnoseEfficiency,
  calculateEfficiencyMetrics
}
