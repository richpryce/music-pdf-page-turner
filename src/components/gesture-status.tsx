'use client'

import clsx from 'clsx'
import { GestureConfig, GestureKind, GestureState } from '@/types'

interface GestureStatusProps {
  gestureState: GestureState
  config: GestureConfig
  onUpdateConfig: (updates: Partial<GestureConfig>) => void
  isActive: boolean
  onStart: () => void
  onStop: () => void
  cameraError: string | null
  performanceMode: boolean
  onTogglePerformanceMode: () => void
}

const gestureOptions: { value: GestureKind; label: string }[] = [
  { value: 'none', label: 'Disabled' },
  { value: 'nod', label: 'Nod' },
  { value: 'shake', label: 'Shake' },
  { value: 'tilt-left', label: 'Tilt left' },
  { value: 'tilt-right', label: 'Tilt right' },
]

function bindingLabel(kind: GestureKind, count: number) {
  if (kind === 'none') return 'Disabled'
  return `${count}× ${kind.replace('-', ' ')}`
}

export function GestureStatus({
  gestureState,
  config,
  onUpdateConfig,
  isActive,
  onStart,
  onStop,
  cameraError,
  performanceMode,
  onTogglePerformanceMode,
}: GestureStatusProps) {
  const { status, progress, activeAction, cooldownRemaining, lastTriggeredAction } = gestureState

  const statusText = (() => {
    switch (status) {
      case 'camera-off':
        return 'Camera off'
      case 'initializing':
        return 'Starting camera…'
      case 'ready':
        return 'Ready'
      case 'tracking':
        return activeAction ? `Tracking ${activeAction}` : 'Tracking gestures'
      case 'turning':
        return lastTriggeredAction ? `${lastTriggeredAction} page` : 'Turning page'
      case 'cooldown':
        return `Cooldown ${(cooldownRemaining / 1000).toFixed(1)}s`
      default:
        return 'Ready'
    }
  })()

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Gesture control</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Hands-free navigation</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePerformanceMode}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10"
          >
            {performanceMode ? 'Exit performance' : 'Performance mode'}
          </button>
          <button
            onClick={isActive ? onStop : onStart}
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-medium text-white transition',
              isActive ? 'bg-rose-500 hover:bg-rose-400' : 'bg-emerald-500 hover:bg-emerald-400',
            )}
          >
            {isActive ? 'Stop camera' : 'Enable camera'}
          </button>
        </div>
      </div>

      {cameraError && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
          {cameraError}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Status</div>
          <div className="mt-2 flex items-center gap-2 text-sm text-white">
            <span
              className={clsx(
                'h-2.5 w-2.5 rounded-full',
                status === 'ready' && 'bg-emerald-400',
                status === 'tracking' && 'bg-sky-400',
                status === 'turning' && 'bg-violet-400',
                status === 'cooldown' && 'bg-amber-400',
                (status === 'camera-off' || status === 'initializing') && 'bg-white/30',
              )}
            />
            <span>{statusText}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Next page</div>
          <div className="mt-2 text-sm text-white">{bindingLabel(config.nextGesture.kind, config.nextGesture.count)}</div>
          <div className="mt-2 h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-emerald-400 transition-all"
              style={{ width: `${Math.min(100, (progress.next / Math.max(config.nextGesture.count, 1)) * 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Previous page</div>
          <div className="mt-2 text-sm text-white">{bindingLabel(config.previousGesture.kind, config.previousGesture.count)}</div>
          <div className="mt-2 h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-sky-400 transition-all"
              style={{ width: `${Math.min(100, (progress.previous / Math.max(config.previousGesture.count, 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <details className="rounded-2xl border border-white/10 bg-black/20 p-4" open={!performanceMode}>
        <summary className="cursor-pointer select-none text-sm font-medium text-white/85">Gesture mapping & calibration</summary>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-medium text-white">Next page gesture</h3>
            <label className="block text-xs text-white/55">
              Gesture type
              <select
                value={config.nextGesture.kind}
                onChange={e => onUpdateConfig({ nextGesture: { kind: e.target.value as GestureKind } as any })}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
              >
                {gestureOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-white/55">
              Repetitions
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={config.nextGesture.count}
                onChange={e => onUpdateConfig({ nextGesture: { count: parseInt(e.target.value, 10) } as any })}
                className="mt-2 w-full accent-emerald-400"
              />
              <div className="mt-1 text-sm text-white">{config.nextGesture.count}</div>
            </label>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-medium text-white">Previous page gesture</h3>
            <label className="block text-xs text-white/55">
              Gesture type
              <select
                value={config.previousGesture.kind}
                onChange={e => onUpdateConfig({ previousGesture: { kind: e.target.value as GestureKind } as any })}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
              >
                {gestureOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-white/55">
              Repetitions
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={config.previousGesture.count}
                onChange={e => onUpdateConfig({ previousGesture: { count: parseInt(e.target.value, 10) } as any })}
                className="mt-2 w-full accent-sky-400"
              />
              <div className="mt-1 text-sm text-white">{config.previousGesture.count}</div>
            </label>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-medium text-white">Motion thresholds</h3>
            <label className="block text-xs text-white/55">
              Nod sensitivity
              <input
                type="range"
                min="0.005"
                max="0.05"
                step="0.001"
                value={config.nodThreshold}
                onChange={e => onUpdateConfig({ nodThreshold: parseFloat(e.target.value) })}
                className="mt-2 w-full accent-emerald-400"
              />
            </label>
            <label className="block text-xs text-white/55">
              Shake sensitivity
              <input
                type="range"
                min="0.005"
                max="0.05"
                step="0.001"
                value={config.shakeThreshold}
                onChange={e => onUpdateConfig({ shakeThreshold: parseFloat(e.target.value) })}
                className="mt-2 w-full accent-sky-400"
              />
            </label>
            <label className="block text-xs text-white/55">
              Tilt sensitivity
              <input
                type="range"
                min="0.04"
                max="0.35"
                step="0.01"
                value={config.tiltThreshold}
                onChange={e => onUpdateConfig({ tiltThreshold: parseFloat(e.target.value) })}
                className="mt-2 w-full accent-violet-400"
              />
            </label>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-medium text-white">Timing</h3>
            <label className="block text-xs text-white/55">
              Gesture window ({(config.windowMs / 1000).toFixed(1)}s)
              <input
                type="range"
                min="1200"
                max="6000"
                step="200"
                value={config.windowMs}
                onChange={e => onUpdateConfig({ windowMs: parseInt(e.target.value, 10) })}
                className="mt-2 w-full accent-white"
              />
            </label>
            <label className="block text-xs text-white/55">
              Cooldown ({(config.cooldownMs / 1000).toFixed(1)}s)
              <input
                type="range"
                min="500"
                max="5000"
                step="250"
                value={config.cooldownMs}
                onChange={e => onUpdateConfig({ cooldownMs: parseInt(e.target.value, 10) })}
                className="mt-2 w-full accent-white"
              />
            </label>
          </div>
        </div>
      </details>
    </div>
  )
}
