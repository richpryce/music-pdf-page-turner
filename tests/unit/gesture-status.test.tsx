import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GestureStatus } from '@/components/gesture-status'
import { GestureConfig, GestureState, DEFAULT_GESTURE_CONFIG } from '@/types'

const mockGestureState = (overrides?: Partial<GestureState>): GestureState => ({
  status: 'camera-off',
  progress: { next: 0, previous: 0 },
  activeAction: null,
  cooldownRemaining: 0,
  lastTriggeredAction: null,
  lastTriggeredAt: null,
  ...overrides,
})

describe('GestureStatus component', () => {
  const defaultProps = {
    gestureState: mockGestureState(),
    config: DEFAULT_GESTURE_CONFIG,
    onUpdateConfig: vi.fn(),
    isActive: false,
    onStart: vi.fn(),
    onStop: vi.fn(),
    cameraError: null,
    performanceMode: false,
    onTogglePerformanceMode: vi.fn(),
  }

  it('shows "Enable Camera" when camera is off', () => {
    render(<GestureStatus {...defaultProps} />)
    expect(screen.getByRole('button', { name: /enable camera/i })).toBeInTheDocument()
  })

  it('shows "Stop camera" when camera is active', () => {
    render(<GestureStatus {...defaultProps} isActive={true} />)
    expect(screen.getByRole('button', { name: /stop camera/i })).toBeInTheDocument()
  })

  it('calls onStart when Enable Camera is clicked', () => {
    const onStart = vi.fn()
    render(<GestureStatus {...defaultProps} onStart={onStart} />)
    fireEvent.click(screen.getByRole('button', { name: /enable camera/i }))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('calls onStop when Stop camera is clicked', () => {
    const onStop = vi.fn()
    render(<GestureStatus {...defaultProps} isActive={true} onStop={onStop} />)
    fireEvent.click(screen.getByRole('button', { name: /stop camera/i }))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('displays camera error', () => {
    render(<GestureStatus {...defaultProps} cameraError="Permission denied" />)
    expect(screen.getByText(/permission denied/i)).toBeInTheDocument()
  })

  it('shows Ready status text when camera is active and ready', () => {
    render(
      <GestureStatus
        {...defaultProps}
        isActive={true}
        gestureState={mockGestureState({ status: 'ready' })}
      />,
    )
    expect(screen.getByText(/^Ready$/i)).toBeInTheDocument()
  })

  it('shows progress for next gesture', () => {
    render(
      <GestureStatus
        {...defaultProps}
        isActive={true}
        gestureState={mockGestureState({ status: 'tracking', progress: { next: 1, previous: 0 } })}
      />,
    )
    expect(screen.getByText(/2× nod/i)).toBeInTheDocument()
  })

  it('shows cooldown status with time remaining', () => {
    render(
      <GestureStatus
        {...defaultProps}
        isActive={true}
        gestureState={mockGestureState({ status: 'cooldown', cooldownRemaining: 1500 })}
      />,
    )
    expect(screen.getByText(/cooldown 1.5s/i)).toBeInTheDocument()
  })
})
