import { GestureAction, GestureBinding, GestureConfig, GestureKind } from '@/types'

interface PoseSample {
  noseX: number
  noseY: number
  tilt: number
}

interface GestureDetectorCallbacks {
  onProgress: (action: GestureAction, count: number) => void
  onTrigger: (action: GestureAction) => void
  onActiveActionChange: (action: GestureAction | null) => void
}

const ACTIONS: GestureAction[] = ['next', 'previous']

export class GestureDetector {
  private config: GestureConfig
  private callbacks: GestureDetectorCallbacks
  private baselines: PoseSample | null = null
  private cooldownUntil = 0
  private state: Record<GestureAction, { direction: number; timestamps: number[] }> = {
    next: { direction: 0, timestamps: [] },
    previous: { direction: 0, timestamps: [] },
  }

  constructor(config: GestureConfig, callbacks: GestureDetectorCallbacks) {
    this.config = config
    this.callbacks = callbacks
  }

  updateConfig(config: GestureConfig) {
    this.config = config
    this.resetProgress()
  }

  feed(sample: PoseSample) {
    const now = Date.now()

    if (now < this.cooldownUntil) return

    if (!this.baselines) {
      this.baselines = sample
      return
    }

    const deltaX = sample.noseX - this.baselines.noseX
    const deltaY = sample.noseY - this.baselines.noseY
    const deltaTilt = sample.tilt - this.baselines.tilt

    let activeAction: GestureAction | null = null

    for (const action of ACTIONS) {
      const binding = this.getBinding(action)
      if (binding.kind === 'none') {
        this.state[action].timestamps = []
        this.callbacks.onProgress(action, 0)
        continue
      }

      const result = this.detect(binding, deltaX, deltaY, deltaTilt)
      if (result.changed) {
        this.state[action].direction = result.direction
      }

      if (result.completed) {
        this.state[action].timestamps.push(now)
        this.state[action].timestamps = this.state[action].timestamps.filter(
          timestamp => now - timestamp <= this.config.windowMs,
        )

        const count = Math.min(this.state[action].timestamps.length, binding.count)
        this.callbacks.onProgress(action, count)

        if (count >= binding.count) {
          this.trigger(action, now)
          return
        }
      } else {
        this.state[action].timestamps = this.state[action].timestamps.filter(
          timestamp => now - timestamp <= this.config.windowMs,
        )
        const count = this.state[action].timestamps.length
        this.callbacks.onProgress(action, count)
      }

      if (this.state[action].timestamps.length > 0) {
        activeAction = action
      }
    }

    this.callbacks.onActiveActionChange(activeAction)
    this.baselines = {
      noseX: this.baselines.noseX * 0.92 + sample.noseX * 0.08,
      noseY: this.baselines.noseY * 0.92 + sample.noseY * 0.08,
      tilt: this.baselines.tilt * 0.92 + sample.tilt * 0.08,
    }
  }

  reset() {
    this.baselines = null
    this.cooldownUntil = 0
    this.resetProgress()
  }

  isInCooldown() {
    return Date.now() < this.cooldownUntil
  }

  private trigger(action: GestureAction, now: number) {
    this.cooldownUntil = now + this.config.cooldownMs
    this.resetProgress()
    this.callbacks.onActiveActionChange(action)
    this.callbacks.onTrigger(action)
  }

  private resetProgress() {
    for (const action of ACTIONS) {
      this.state[action] = { direction: 0, timestamps: [] }
      this.callbacks.onProgress(action, 0)
    }
  }

  private getBinding(action: GestureAction): GestureBinding {
    return action === 'next' ? this.config.nextGesture : this.config.previousGesture
  }

  private detect(binding: GestureBinding, deltaX: number, deltaY: number, deltaTilt: number) {
    switch (binding.kind) {
      case 'nod':
        return this.detectAxisCycle('next', deltaY, this.config.nodThreshold)
      case 'shake':
        return this.detectAxisCycle('previous', deltaX, this.config.shakeThreshold)
      case 'tilt-left':
        return this.detectTilt('previous', deltaTilt, -this.config.tiltThreshold)
      case 'tilt-right':
        return this.detectTilt('next', deltaTilt, this.config.tiltThreshold)
      case 'none':
      default:
        return { changed: false, direction: 0, completed: false }
    }
  }

  private detectAxisCycle(action: GestureAction, delta: number, threshold: number) {
    const state = this.state[action]
    const direction = delta > threshold ? 1 : delta < -threshold ? -1 : 0

    if (direction === 0) return { changed: false, direction: state.direction, completed: false }
    if (state.direction === 0) return { changed: true, direction, completed: false }
    if (direction !== state.direction) {
      return { changed: true, direction, completed: true }
    }

    return { changed: false, direction: state.direction, completed: false }
  }

  private detectTilt(action: GestureAction, deltaTilt: number, threshold: number) {
    const state = this.state[action]
    const reached = threshold > 0 ? deltaTilt > threshold : deltaTilt < threshold

    if (!reached) return { changed: false, direction: 0, completed: false }
    if (state.direction === 1) return { changed: false, direction: 1, completed: false }
    return { changed: true, direction: 1, completed: true }
  }
}
