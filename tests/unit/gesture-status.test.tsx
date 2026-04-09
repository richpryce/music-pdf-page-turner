import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GestureStatus } from '@/components/gesture-status'
import { GestureConfig, GestureState, DEFAULT_GESTURE_CONFIG } from '@/types'

const mockGestureState = (overrides?: Partial<GestureState>): GestureState => ({
  status: 'camera-off',
  nodCount: 0,
  requiredNods: 3,
  cooldownRemaining: 0,
  lastNodAt: null,
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
  }

  it('shows "Enable Camera" when camera is off', () => {
    render(<GestureStatus {...defaultProps} />)
    expect(screen.getByRole('button', { name: /enable camera/i })).toBeInTheDocument()
  })

  it('shows "Stop Camera" when camera is active', () => {
    render(<GestureStatus {...defaultProps} isActive={true} />)
    expect(screen.getByRole('button', { name: /stop camera/i })).toBeInTheDocument()
  })

  it('calls onStart when Enable Camera is clicked', () => {
    const onStart = vi.fn()
    render(<GestureStatus {...defaultProps} onStart={onStart} />)
    fireEvent.click(screen.getByRole('button', { name: /enable camera/i }))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('calls onStop when Stop Camera is clicked', () => {
    const onStop = vi.fn()
    render(<GestureStatus {...defaultProps} isActive={true} onStop={onStop} />)
    fireEvent.click(screen.getByRole('button', { name: /stop camera/i }))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('displays camera error', () => {
    render(<GestureStatus {...defaultProps} cameraError="Permission denied" />)
    expect(screen.getByText(/permission denied/i)).toBeInTheDocument()
  })

  it('shows "Ready" status text when camera is active and ready', () => {
    render(
      <GestureStatus
        {...defaultProps}
        isActive={true}
        gestureState={mockGestureState({ status: 'ready' })}
      />
    )
    // The status span shows "Ready — nod 3x to turn page"
    expect(screen.getByText(/ready — nod/i)).toBeInTheDocument()
  })

  it('shows nodding progress with count', () => {
    render(
      <GestureStatus
        {...defaultProps}
        isActive={true}
        gestureState={mockGestureState({ status: 'nodding', nodCount: 2, requiredNods: 3 })}
      />
    )
    expect(screen.getByText(/nodding/i)).toBeInTheDocument()
    expect(screen.getAllByText('2/3').length).toBeGreaterThanOrEqual(1)
  })

  it('shows cooldown status with time remaining', () => {
    render(
      <GestureStatus
        {...defaultProps}
        isActive={true}
        gestureState={mockGestureState({ status: 'cooldown', cooldownRemaining: 1500 })}
      />
    )
    // The status text "Cooldown (1.5s)" appears in the status span
    expect(screen.getByText(/cooldown \(/i)).toBeInTheDocument()
  })
})
