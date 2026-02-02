/**
 * EfficiencyCalculator Tests
 *
 * These metrics are DIAGNOSTIC tools, not performance metrics.
 * Tests verify correct calculation and diagnostic framing.
 */

import { describe, it, expect } from 'vitest'
import {
  calculateCostPerPR,
  calculateCostPerSession,
  calculateCostPerCommit,
  calculateAvgSessionSize,
  diagnoseEfficiency,
  calculateEfficiencyMetrics
} from '../../../src/domain/services/EfficiencyCalculator.js'

describe('EfficiencyCalculator', () => {
  describe('calculateCostPerPR', () => {
    it('should calculate cost divided by PR count', () => {
      expect(calculateCostPerPR(10, 2)).toBe(5)
      expect(calculateCostPerPR(15, 3)).toBe(5)
    })

    it('should return 0 for zero PRs (avoid division by zero)', () => {
      expect(calculateCostPerPR(10, 0)).toBe(0)
      expect(calculateCostPerPR(10, null)).toBe(0)
      expect(calculateCostPerPR(10, -1)).toBe(0)
    })

    it('should handle zero cost', () => {
      expect(calculateCostPerPR(0, 5)).toBe(0)
    })
  })

  describe('calculateCostPerSession', () => {
    it('should calculate cost divided by session count', () => {
      expect(calculateCostPerSession(20, 10)).toBe(2)
    })

    it('should return 0 for zero sessions', () => {
      expect(calculateCostPerSession(10, 0)).toBe(0)
    })
  })

  describe('calculateCostPerCommit', () => {
    it('should calculate cost divided by commit count', () => {
      expect(calculateCostPerCommit(5, 5)).toBe(1)
    })

    it('should return 0 for zero commits', () => {
      expect(calculateCostPerCommit(10, 0)).toBe(0)
    })
  })

  describe('calculateAvgSessionSize', () => {
    it('should calculate average tokens per session', () => {
      expect(calculateAvgSessionSize(100000, 10)).toBe(10000)
    })

    it('should round to nearest integer', () => {
      expect(calculateAvgSessionSize(10003, 3)).toBe(3334)
    })

    it('should return 0 for zero sessions', () => {
      expect(calculateAvgSessionSize(10000, 0)).toBe(0)
    })
  })

  describe('diagnoseEfficiency', () => {
    it('should diagnose cache issue for high cost + low cache', () => {
      const result = diagnoseEfficiency({
        costPerPR: 10, // High (>$5)
        cacheHitRatio: 20, // Low (<30%)
        avgSessionSize: 50000
      })

      expect(result.status).toBe('needs_attention')
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({
          type: 'cache_issue',
          severity: 'warning'
        })
      )
    })

    it('should diagnose session bloat for high cost + large sessions', () => {
      const result = diagnoseEfficiency({
        costPerPR: 10,
        cacheHitRatio: 60, // Good
        avgSessionSize: 150000 // High (>100k)
      })

      expect(result.status).toBe('needs_attention')
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({
          type: 'session_bloat',
          severity: 'warning'
        })
      )
    })

    it('should recognize complex work for high cost + normal metrics', () => {
      const result = diagnoseEfficiency({
        costPerPR: 10,
        cacheHitRatio: 60,
        avgSessionSize: 50000
      })

      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({
          type: 'complex_work',
          severity: 'info'
        })
      )
    })

    it('should recognize excellent efficiency', () => {
      const result = diagnoseEfficiency({
        costPerPR: 2, // Low
        cacheHitRatio: 70, // High
        avgSessionSize: 30000
      })

      expect(result.status).toBe('excellent')
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({
          type: 'excellent',
          severity: 'success'
        })
      )
    })

    it('should provide context notes', () => {
      const result = diagnoseEfficiency({
        costPerPR: 3,
        cacheHitRatio: 20,
        avgSessionSize: 50000
      })

      expect(result.context.cacheRatioNote).toContain('Low cache ratio')
    })
  })

  describe('calculateEfficiencyMetrics', () => {
    it('should calculate all metrics from usage data', () => {
      const usageData = {
        totalCost: 100,
        totalInput: 500000,
        totalOutput: 100000,
        cacheHitRatio: 45
      }

      const activityCounts = {
        prCount: 10,
        commitCount: 50,
        sessionCount: 25
      }

      const result = calculateEfficiencyMetrics(usageData, activityCounts)

      expect(result.costPerPR).toBe(10) // $100 / 10 PRs
      expect(result.costPerSession).toBe(4) // $100 / 25 sessions
      expect(result.costPerCommit).toBe(2) // $100 / 50 commits
      expect(result.avgSessionSize).toBe(24000) // 600k / 25 sessions
      expect(result.cacheHitRatio).toBe(45)

      expect(result.counts.prs).toBe(10)
      expect(result.counts.commits).toBe(50)
      expect(result.counts.sessions).toBe(25)

      expect(result.diagnostics).toBeDefined()
      expect(result.diagnostics.status).toBeDefined()
    })

    it('should handle empty activity counts', () => {
      const usageData = { totalCost: 50 }
      const result = calculateEfficiencyMetrics(usageData, {})

      expect(result.costPerPR).toBe(0)
      expect(result.costPerSession).toBe(0)
      expect(result.costPerCommit).toBe(0)
    })

    it('should NOT use max_over_time-style calculation', () => {
      // This test ensures we use simple division, not time-windowed max
      // The buggy query was: max_over_time(sum(cost)[1h:]) / max_over_time(sum(pr_count)[1h:])
      // Correct is: sum(cost) / sum(pr_count)

      const usageData = { totalCost: 30 }
      const activityCounts = { prCount: 3 }

      const result = calculateEfficiencyMetrics(usageData, activityCounts)

      // Simple division: $30 / 3 PRs = $10
      expect(result.costPerPR).toBe(10)
    })
  })
})
