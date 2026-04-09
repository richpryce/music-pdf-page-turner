export interface GestureConfig {
  nodThreshold: number      // Minimum Y-axis movement to count as a nod (0–1 normalized)
  requiredNods: number      // Number of nods needed to trigger page turn
  windowMs: number          // Time window in ms within which nods must occur
  cooldownMs: number        // Cooldown after page turn in ms
}

export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  nodThreshold: 0.015,
  requiredNods: 3,
  windowMs: 3000,
  cooldownMs: 2000,
}

export type GestureStatus =
  | 'idle'
  | 'camera-off'
  | 'initializing'
  | 'ready'
  | 'nodding'
  | 'cooldown'
  | 'turning'

export interface GestureState {
  status: GestureStatus
  nodCount: number
  requiredNods: number
  cooldownRemaining: number   // ms remaining in cooldown
  lastNodAt: number | null    // timestamp
}

export interface PDFState {
  file: File | null
  pageCount: number
  currentPage: number
  loading: boolean
  error: string | null
}
