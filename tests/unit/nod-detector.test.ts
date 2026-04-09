import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NodDetector } from '@/utils/nod-detector'

/**
 * Simulate N complete nods: each nod = head moves DOWN then comes back UP.
 * The detector counts a nod when it transitions from 'down' to 'up' direction.
 */
function simulateNods(detector: NodDetector, count: number, amplitude = 0.04, base = 0.5) {
  detector.feed(base)                 // initial neutral position
  for (let i = 0; i < count; i++) {
    detector.feed(base + amplitude)   // move down (Y increases)
    detector.feed(base)               // come back up → nod counted here
  }
}

describe('NodDetector', () => {
  let onNod: ReturnType<typeof vi.fn>
  let onCount: ReturnType<typeof vi.fn>
  let detector: NodDetector

  const defaultOptions = {
    threshold: 0.02,
    windowMs: 3000,
    requiredNods: 3,
    cooldownMs: 500,
  }

  beforeEach(() => {
    vi.useFakeTimers()
    onNod = vi.fn()
    onCount = vi.fn()
    detector = new NodDetector(defaultOptions, onNod, onCount)
  })

  afterEach(() => {
    vi.useRealTimers()
    detector.reset()
  })

  describe('basic nod detection', () => {
    it('does not fire on tiny movements below threshold', () => {
      detector.feed(0.5)
      detector.feed(0.505)  // delta 0.005 < 0.02 threshold
      detector.feed(0.5)
      detector.feed(0.505)
      detector.feed(0.5)
      expect(onNod).not.toHaveBeenCalled()
    })

    it('fires after 3 deliberate nods', () => {
      simulateNods(detector, 3)
      expect(onNod).toHaveBeenCalledTimes(1)
    })

    it('does not fire after only 2 nods when 3 required', () => {
      simulateNods(detector, 2)
      expect(onNod).not.toHaveBeenCalled()
    })

    it('calls onCount with intermediate nod counts', () => {
      simulateNods(detector, 3)
      const calls = onCount.mock.calls.map((c: number[]) => c[0])
      expect(calls).toContain(1)
      expect(calls).toContain(2)
    })
  })

  describe('cooldown', () => {
    it('ignores new gestures immediately after firing', () => {
      simulateNods(detector, 3) // fires, enters cooldown
      simulateNods(detector, 3) // should be blocked
      expect(onNod).toHaveBeenCalledTimes(1)
    })

    it('allows new gesture after cooldown expires', () => {
      simulateNods(detector, 3)
      vi.advanceTimersByTime(defaultOptions.cooldownMs + 50)
      simulateNods(detector, 3)
      expect(onNod).toHaveBeenCalledTimes(2)
    })

    it('isInCooldown returns true immediately after firing', () => {
      simulateNods(detector, 3)
      expect(detector.isInCooldown()).toBe(true)
    })

    it('isInCooldown returns false after cooldown expires', () => {
      simulateNods(detector, 3)
      vi.advanceTimersByTime(defaultOptions.cooldownMs + 50)
      expect(detector.isInCooldown()).toBe(false)
    })
  })

  describe('time window', () => {
    it('does not fire when nods fall outside the rolling window', () => {
      // 2 nods within window
      detector.feed(0.5)
      detector.feed(0.54)
      detector.feed(0.5)   // nod 1
      detector.feed(0.54)
      detector.feed(0.5)   // nod 2

      // Wait past window — those nods are now stale
      vi.advanceTimersByTime(defaultOptions.windowMs + 100)

      // 1 more nod — only 1 in window, not enough
      detector.feed(0.54)
      detector.feed(0.5)

      expect(onNod).not.toHaveBeenCalled()
    })
  })

  describe('reset', () => {
    it('clears partial state so a fresh gesture fires normally', () => {
      // Partial gesture (1 nod)
      detector.feed(0.5)
      detector.feed(0.54)
      detector.feed(0.5) // nod 1

      detector.reset()

      // Full 3 nods after reset
      simulateNods(detector, 3)
      expect(onNod).toHaveBeenCalledTimes(1)
    })

    it('clears cooldown on reset', () => {
      simulateNods(detector, 3)
      expect(detector.isInCooldown()).toBe(true)

      detector.reset()
      expect(detector.isInCooldown()).toBe(false)
    })
  })

  describe('updateOptions', () => {
    it('raises threshold to prevent small amplitude nods from firing', () => {
      detector.updateOptions({ threshold: 0.1 })

      // Amplitude 0.04 < new threshold 0.1 — should not fire
      simulateNods(detector, 3, 0.04)

      expect(onNod).not.toHaveBeenCalled()
    })

    it('lowers requiredNods so fewer nods trigger the event', () => {
      detector.updateOptions({ requiredNods: 2 })
      simulateNods(detector, 2)
      expect(onNod).toHaveBeenCalledTimes(1)
    })
  })
})
