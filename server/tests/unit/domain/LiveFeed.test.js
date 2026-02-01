/**
 * Tests for LiveFeed service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LiveFeed } from '../../../src/domain/services/LiveFeed.js'

describe('LiveFeed', () => {
  let feed

  beforeEach(() => {
    feed = new LiveFeed()
  })

  describe('Event Processing', () => {
    it('should process agent events', () => {
      const eventData = {
        event: 'agent',
        payload: {
          runId: 'run-123',
          stream: 'assistant',
          sessionKey: 'agent:main:main',
          data: { text: 'Hello', delta: 'Hello' },
          seq: 1
        }
      }

      feed.processEvent(eventData)

      expect(feed.stats.totalEvents).toBe(1)
      expect(feed.events.length).toBe(1)
      expect(feed.events[0].type).toBe('agent')
      expect(feed.events[0].runId).toBe('run-123')
    })

    it('should process chat events', () => {
      const eventData = {
        event: 'chat',
        payload: {
          runId: 'run-456',
          sessionKey: 'agent:main:main',
          state: 'delta',
          message: { role: 'assistant', content: [] }
        }
      }

      feed.processEvent(eventData)

      expect(feed.stats.totalEvents).toBe(1)
      expect(feed.events[0].type).toBe('chat')
    })

    it('should process health events', () => {
      const eventData = {
        event: 'health',
        payload: { ok: true, ts: Date.now() }
      }

      feed.processEvent(eventData)

      expect(feed.events[0].type).toBe('health')
    })

    it('should process tick events', () => {
      const eventData = {
        event: 'tick',
        payload: {}
      }

      feed.processEvent(eventData)

      expect(feed.events[0].type).toBe('tick')
    })
  })

  describe('Run Tracking', () => {
    it('should create active run on first agent event', () => {
      feed.processEvent({
        event: 'agent',
        payload: {
          runId: 'run-abc',
          stream: 'assistant',
          sessionKey: 'agent:main:main',
          data: { text: 'Hi', delta: 'Hi' }
        }
      })

      const activeRuns = feed.getActiveRuns()
      expect(activeRuns.length).toBe(1)
      expect(activeRuns[0].runId).toBe('run-abc')
      expect(activeRuns[0].status).toBe('running')
    })

    it('should track text length', () => {
      feed.processEvent({
        event: 'agent',
        payload: {
          runId: 'run-abc',
          stream: 'assistant',
          data: { delta: 'Hello ' }
        }
      })

      feed.processEvent({
        event: 'agent',
        payload: {
          runId: 'run-abc',
          stream: 'assistant',
          data: { delta: 'World!' }
        }
      })

      const runs = feed.getActiveRuns()
      expect(runs[0].textLength).toBe(12) // 'Hello ' + 'World!'
    })

    it('should complete run on final state', () => {
      const completeSpy = vi.fn()
      feed.on('run:complete', completeSpy)

      // Start run
      feed.processEvent({
        event: 'agent',
        payload: {
          runId: 'run-xyz',
          stream: 'assistant',
          data: { delta: 'Done' }
        }
      })

      expect(feed.getActiveRuns().length).toBe(1)

      // Complete run
      feed.processEvent({
        event: 'chat',
        payload: {
          runId: 'run-xyz',
          state: 'final'
        }
      })

      expect(feed.getActiveRuns().length).toBe(0)
      expect(feed.getCompletedRuns().length).toBe(1)
      expect(completeSpy).toHaveBeenCalled()
    })
  })

  describe('Tool Call Tracking', () => {
    it('should track tool calls', () => {
      feed.processEvent({
        event: 'agent',
        payload: {
          runId: 'run-tool',
          stream: 'tool',
          data: {
            type: 'tool_use',
            name: 'exec',
            input: { command: 'ls -la' }
          }
        }
      })

      const runs = feed.getActiveRuns()
      expect(runs[0].toolCalls.length).toBe(1)
      expect(runs[0].toolCalls[0].name).toBe('exec')
      expect(feed.stats.totalToolCalls).toBe(1)
    })

    it('should detect risky tool calls', () => {
      const riskSpy = vi.fn()
      feed.on('risk:alert', riskSpy)

      feed.processEvent({
        event: 'agent',
        payload: {
          runId: 'run-risk',
          stream: 'tool',
          data: {
            type: 'tool_use',
            name: 'exec',
            input: { command: 'rm -rf /' }
          }
        }
      })

      expect(riskSpy).toHaveBeenCalled()
      expect(feed.stats.riskAlerts).toBeGreaterThan(0)
    })
  })

  describe('Event Buffer', () => {
    it('should maintain max 500 events', () => {
      for (let i = 0; i < 600; i++) {
        feed.processEvent({
          event: 'tick',
          payload: { i }
        })
      }

      expect(feed.events.length).toBe(500)
    })

    it('should return recent events with limit', () => {
      for (let i = 0; i < 100; i++) {
        feed.processEvent({ event: 'tick', payload: {} })
      }

      const recent = feed.getRecentEvents(10)
      expect(recent.length).toBe(10)
    })
  })

  describe('Stats', () => {
    it('should track total events', () => {
      feed.processEvent({ event: 'agent', payload: {} })
      feed.processEvent({ event: 'chat', payload: {} })
      feed.processEvent({ event: 'tick', payload: {} })

      expect(feed.stats.totalEvents).toBe(3)
    })

    it('should calculate uptime', () => {
      const stats = feed.getStats()
      expect(stats.uptimeMs).toBeGreaterThanOrEqual(0)
    })

    it('should count active and completed runs', () => {
      // Start two runs
      feed.processEvent({
        event: 'agent',
        payload: { runId: 'run-1', stream: 'assistant', data: {} }
      })
      feed.processEvent({
        event: 'agent',
        payload: { runId: 'run-2', stream: 'assistant', data: {} }
      })

      let stats = feed.getStats()
      expect(stats.activeRuns).toBe(2)

      // Complete one
      feed.processEvent({
        event: 'chat',
        payload: { runId: 'run-1', state: 'final' }
      })

      stats = feed.getStats()
      expect(stats.activeRuns).toBe(1)
      expect(stats.completedRuns).toBe(1)
    })
  })

  describe('Snapshot', () => {
    it('should return complete snapshot', () => {
      feed.processEvent({
        event: 'agent',
        payload: { runId: 'run-snap', stream: 'assistant', data: { delta: 'test' } }
      })

      const snapshot = feed.getSnapshot()

      expect(snapshot).toHaveProperty('recentEvents')
      expect(snapshot).toHaveProperty('activeRuns')
      expect(snapshot).toHaveProperty('completedRuns')
      expect(snapshot).toHaveProperty('stats')
      expect(snapshot.activeRuns.length).toBe(1)
    })
  })

  describe('Event Emission', () => {
    it('should emit activity events', () => {
      const activitySpy = vi.fn()
      feed.on('activity', activitySpy)

      feed.processEvent({
        event: 'agent',
        payload: { runId: 'run-emit', data: {} }
      })

      expect(activitySpy).toHaveBeenCalled()
    })

    it('should emit run:start on new run', () => {
      const startSpy = vi.fn()
      feed.on('run:start', startSpy)

      feed.processEvent({
        event: 'agent',
        payload: { runId: 'run-new', stream: 'assistant', data: {} }
      })

      expect(startSpy).toHaveBeenCalledWith(
        expect.objectContaining({ runId: 'run-new', status: 'running' })
      )
    })
  })
})
