export type GestureKind = 'none' | 'nod' | 'shake' | 'tilt-left' | 'tilt-right'
export type GestureAction = 'next' | 'previous'

export interface GestureBinding {
  kind: GestureKind
  count: number
}

export interface GestureConfig {
  nodThreshold: number
  shakeThreshold: number
  tiltThreshold: number
  windowMs: number
  cooldownMs: number
  nextGesture: GestureBinding
  previousGesture: GestureBinding
}

export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  nodThreshold: 0.015,
  shakeThreshold: 0.02,
  tiltThreshold: 0.12,
  windowMs: 3000,
  cooldownMs: 2000,
  nextGesture: { kind: 'nod', count: 2 },
  previousGesture: { kind: 'shake', count: 2 },
}

export type GestureStatus =
  | 'idle'
  | 'camera-off'
  | 'initializing'
  | 'ready'
  | 'tracking'
  | 'cooldown'
  | 'turning'

export interface GestureProgress {
  next: number
  previous: number
}

export interface GestureState {
  status: GestureStatus
  progress: GestureProgress
  activeAction: GestureAction | null
  cooldownRemaining: number
  lastTriggeredAction: GestureAction | null
  lastTriggeredAt: number | null
}

export interface PDFState {
  file: File | null
  pageCount: number
  currentPage: number
  loading: boolean
  error: string | null
}
