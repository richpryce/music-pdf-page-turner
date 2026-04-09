'use client'

import { GestureState, GestureConfig } from '@/types'
import clsx from 'clsx'

interface GestureStatusProps {
  gestureState: GestureState
  config: GestureConfig
  onUpdateConfig: (updates: Partial<GestureConfig>) => void
  isActive: boolean
  onStart: () => void
  onStop: () => void
  cameraError: string | null
}

export function GestureStatus({
  gestureState,
  config,
  onUpdateConfig,
  isActive,
  onStart,
  onStop,
  cameraError,
}: GestureStatusProps) {
  const { status, nodCount, requiredNods, cooldownRemaining } = gestureState

  const statusLabel = (): { text: string; color: string } => {
    switch (status) {
      case 'camera-off':
        return { text: 'Camera off', color: 'text-gray-400' }
      case 'initializing':
        return { text: 'Starting camera…', color: 'text-yellow-400' }
      case 'ready':
        return { text: `Ready — nod ${requiredNods}x to turn page`, color: 'text-green-400' }
      case 'nodding':
        return { text: `Nodding… ${nodCount}/${requiredNods}`, color: 'text-blue-400' }
      case 'turning':
        return { text: 'Turning page!', color: 'text-purple-400' }
      case 'cooldown':
        return {
          text: `Cooldown (${(cooldownRemaining / 1000).toFixed(1)}s)`,
          color: 'text-orange-400',
        }
      default:
        return { text: 'Unknown', color: 'text-gray-400' }
    }
  }

  const { text, color } = statusLabel()

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Gesture Control
        </h2>
        <button
          onClick={isActive ? onStop : onStart}
          className={clsx(
            'px-3 py-1 rounded text-sm font-medium transition-colors',
            isActive
              ? 'bg-red-700 hover:bg-red-600 text-white'
              : 'bg-green-700 hover:bg-green-600 text-white',
          )}
        >
          {isActive ? 'Stop Camera' : 'Enable Camera'}
        </button>
      </div>

      {cameraError && (
        <p className="text-red-400 text-sm bg-red-900/20 rounded p-2">{cameraError}</p>
      )}

      {/* Status */}
      <div className="flex items-center gap-2">
        <div
          className={clsx(
            'w-2 h-2 rounded-full flex-shrink-0',
            status === 'ready' && 'bg-green-400 animate-pulse',
            status === 'nodding' && 'bg-blue-400 animate-bounce',
            status === 'turning' && 'bg-purple-400',
            status === 'cooldown' && 'bg-orange-400',
            (status === 'camera-off' || status === 'initializing') && 'bg-gray-500',
          )}
        />
        <span className={clsx('text-sm', color)}>{text}</span>
      </div>

      {/* Nod progress bar */}
      {isActive && status !== 'camera-off' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Nod progress</span>
            <span>{nodCount}/{requiredNods}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${requiredNods > 0 ? (nodCount / requiredNods) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Cooldown bar */}
      {status === 'cooldown' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Cooldown</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${(cooldownRemaining / config.cooldownMs) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Config controls */}
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-300 select-none">
          Calibration settings
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="flex justify-between text-gray-400 mb-1">
              <span>Sensitivity (nod threshold)</span>
              <span>{config.nodThreshold.toFixed(3)}</span>
            </label>
            <input
              type="range"
              min="0.005"
              max="0.05"
              step="0.001"
              value={config.nodThreshold}
              onChange={e => onUpdateConfig({ nodThreshold: parseFloat(e.target.value) })}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-gray-600 text-xs mt-0.5">
              <span>More sensitive</span>
              <span>Less sensitive</span>
            </div>
          </div>

          <div>
            <label className="flex justify-between text-gray-400 mb-1">
              <span>Required nods</span>
              <span>{config.requiredNods}</span>
            </label>
            <input
              type="range"
              min="2"
              max="5"
              step="1"
              value={config.requiredNods}
              onChange={e => onUpdateConfig({ requiredNods: parseInt(e.target.value, 10) })}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <label className="flex justify-between text-gray-400 mb-1">
              <span>Time window</span>
              <span>{(config.windowMs / 1000).toFixed(1)}s</span>
            </label>
            <input
              type="range"
              min="1500"
              max="6000"
              step="500"
              value={config.windowMs}
              onChange={e => onUpdateConfig({ windowMs: parseInt(e.target.value, 10) })}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <label className="flex justify-between text-gray-400 mb-1">
              <span>Cooldown</span>
              <span>{(config.cooldownMs / 1000).toFixed(1)}s</span>
            </label>
            <input
              type="range"
              min="500"
              max="5000"
              step="500"
              value={config.cooldownMs}
              onChange={e => onUpdateConfig({ cooldownMs: parseInt(e.target.value, 10) })}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      </details>
    </div>
  )
}
