/**
 * Detects deliberate head nods from a stream of nose Y-positions.
 *
 * A "nod" is defined as:
 * 1. Head moves DOWN past the threshold (Y increases by >= threshold from the local valley)
 * 2. Head then comes back UP past the threshold (Y decreases by >= threshold from the local peak)
 *
 * Counting: one nod = one complete down-then-up cycle.
 * requiredNods=3 means three such cycles within windowMs.
 */

export interface NodDetectorOptions {
  threshold: number    // minimum Y amplitude to count a direction change
  windowMs: number     // rolling window in ms
  requiredNods: number // nods needed to fire callback
  cooldownMs: number   // ms to ignore input after firing
}

type NodCallback = () => void

export class NodDetector {
  private options: NodDetectorOptions
  private onNod: NodCallback
  private onCount: (count: number) => void

  private direction: 'down' | 'up' | null = null
  private extremeY: number | null = null
  private nodTimestamps: number[] = []
  private inCooldown = false
  private cooldownTimer: ReturnType<typeof setTimeout> | null = null

  constructor(
    options: NodDetectorOptions,
    onNod: NodCallback,
    onCount: (count: number) => void,
  ) {
    this.options = options
    this.onNod = onNod
    this.onCount = onCount
  }

  feed(y: number): void {
    if (this.inCooldown) return

    const { threshold, windowMs, requiredNods, cooldownMs } = this.options

    if (this.extremeY === null) {
      this.extremeY = y
      return
    }

    const delta = y - this.extremeY

    if (Math.abs(delta) < threshold) {
      // Haven't moved enough to change direction — track extreme in current direction
      if (this.direction === 'down') {
        this.extremeY = Math.max(this.extremeY, y)
      } else if (this.direction === 'up') {
        this.extremeY = Math.min(this.extremeY, y)
      }
      return
    }

    const newDirection: 'down' | 'up' = delta > 0 ? 'down' : 'up'

    if (newDirection !== this.direction) {
      // Direction reversal detected
      if (this.direction === 'down' && newDirection === 'up') {
        // Completed a downward nod motion — count it
        const now = Date.now()
        this.nodTimestamps.push(now)
        this.nodTimestamps = this.nodTimestamps.filter(t => now - t <= windowMs)

        const currentCount = this.nodTimestamps.length
        this.onCount(Math.min(currentCount, requiredNods))

        if (currentCount >= requiredNods) {
          this.fire(cooldownMs)
          return
        }
      }
      this.direction = newDirection
      this.extremeY = y
    } else {
      // Same direction — update extreme
      if (this.direction === 'down') {
        this.extremeY = Math.max(this.extremeY, y)
      } else {
        this.extremeY = Math.min(this.extremeY, y)
      }
    }
  }

  private fire(cooldownMs: number): void {
    this.nodTimestamps = []
    this.inCooldown = true
    this.onCount(0)
    this.onNod()

    if (this.cooldownTimer) clearTimeout(this.cooldownTimer)
    this.cooldownTimer = setTimeout(() => {
      this.inCooldown = false
      this.cooldownTimer = null
    }, cooldownMs)
  }

  updateOptions(options: Partial<NodDetectorOptions>): void {
    this.options = { ...this.options, ...options }
  }

  reset(): void {
    this.direction = null
    this.extremeY = null
    this.nodTimestamps = []
    this.inCooldown = false
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer)
      this.cooldownTimer = null
    }
  }

  isInCooldown(): boolean {
    return this.inCooldown
  }

  getCurrentNodCount(): number {
    const now = Date.now()
    return this.nodTimestamps.filter(t => now - t <= this.options.windowMs).length
  }
}
