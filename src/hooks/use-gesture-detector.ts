'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { GestureConfig, GestureState, DEFAULT_GESTURE_CONFIG } from '@/types'
import { NodDetector } from '@/utils/nod-detector'

interface UseGestureDetectorOptions {
  config?: Partial<GestureConfig>
  onPageTurn: () => void
}

interface UseGestureDetectorReturn {
  gestureState: GestureState
  videoRef: React.RefObject<HTMLVideoElement>
  isActive: boolean
  startCamera: () => Promise<void>
  stopCamera: () => void
  config: GestureConfig
  updateConfig: (updates: Partial<GestureConfig>) => void
  cameraError: string | null
}

export function useGestureDetector({
  config: configOverrides,
  onPageTurn,
}: UseGestureDetectorOptions): UseGestureDetectorReturn {
  const [config, setConfig] = useState<GestureConfig>({
    ...DEFAULT_GESTURE_CONFIG,
    ...configOverrides,
  })

  const [gestureState, setGestureState] = useState<GestureState>({
    status: 'camera-off',
    nodCount: 0,
    requiredNods: config.requiredNods,
    cooldownRemaining: 0,
    lastNodAt: null,
  })

  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const faceMeshRef = useRef<any>(null)
  const cameraInstanceRef = useRef<any>(null)
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cooldownEndRef = useRef<number>(0)

  const nodDetectorRef = useRef<NodDetector>(
    new NodDetector(
      {
        threshold: config.nodThreshold,
        windowMs: config.windowMs,
        requiredNods: config.requiredNods,
        cooldownMs: config.cooldownMs,
      },
      () => {
        // onNod fired
        setGestureState(prev => ({
          ...prev,
          status: 'turning',
          nodCount: 0,
          lastNodAt: Date.now(),
        }))
        onPageTurn()

        // Start cooldown display
        cooldownEndRef.current = Date.now() + config.cooldownMs
        if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current)
        cooldownTimerRef.current = setInterval(() => {
          const remaining = cooldownEndRef.current - Date.now()
          if (remaining <= 0) {
            clearInterval(cooldownTimerRef.current!)
            cooldownTimerRef.current = null
            setGestureState(prev => ({
              ...prev,
              status: 'ready',
              cooldownRemaining: 0,
            }))
          } else {
            setGestureState(prev => ({
              ...prev,
              status: 'cooldown',
              cooldownRemaining: remaining,
            }))
          }
        }, 100)
      },
      (count: number) => {
        setGestureState(prev => {
          if (prev.status === 'cooldown' || prev.status === 'turning') return prev
          return {
            ...prev,
            status: count > 0 ? 'nodding' : 'ready',
            nodCount: count,
          }
        })
      },
    ),
  )

  const loadMediaPipe = useCallback(async () => {
    // Dynamically load MediaPipe via CDN scripts
    if (typeof window === 'undefined') return

    // Load FaceMesh from CDN if not already loaded
    if (!(window as any).FaceMesh) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js'
        script.crossOrigin = 'anonymous'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load MediaPipe FaceMesh'))
        document.head.appendChild(script)
      })
    }

    if (!(window as any).Camera) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.js'
        script.crossOrigin = 'anonymous'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load MediaPipe Camera Utils'))
        document.head.appendChild(script)
      })
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      setGestureState(prev => ({ ...prev, status: 'initializing' }))

      if (!videoRef.current) {
        throw new Error('Camera preview is not ready yet. Please try again.')
      }

      // Get camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      })
      streamRef.current = stream

      const videoEl = videoRef.current
      if (!videoEl) {
        throw new Error('Camera preview is not available on this device yet.')
      }

      videoEl.srcObject = stream
      await videoEl.play()

      setIsActive(true)

      // Load MediaPipe
      await loadMediaPipe()

      const FaceMesh = (window as any).FaceMesh
      const Camera = (window as any).Camera

      const faceMesh = new FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
      })

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      faceMesh.onResults((results: any) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const landmarks = results.multiFaceLandmarks[0]
          const noseTip = landmarks[1]
          if (noseTip) {
            nodDetectorRef.current.feed(noseTip.y)
          }
        }
      })

      faceMeshRef.current = faceMesh

      const camera = new Camera(videoEl, {
        onFrame: async () => {
          if (faceMeshRef.current) {
            await faceMeshRef.current.send({ image: videoEl })
          }
        },
        width: 640,
        height: 480,
      })

      await camera.start()
      cameraInstanceRef.current = camera

      setGestureState(prev => ({
        ...prev,
        status: 'ready',
        nodCount: 0,
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera error'
      setCameraError(msg)

      if (cameraInstanceRef.current) {
        try {
          cameraInstanceRef.current.stop()
        } catch (_) {}
        cameraInstanceRef.current = null
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }

      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current)
        cooldownTimerRef.current = null
      }

      nodDetectorRef.current.reset()
      setIsActive(false)
      setGestureState(prev => ({ ...prev, status: 'camera-off', nodCount: 0 }))
    }
  }, [loadMediaPipe])

  const stopCamera = useCallback(() => {
    if (cameraInstanceRef.current) {
      try {
        cameraInstanceRef.current.stop()
      } catch (_) {}
      cameraInstanceRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }

    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current)
      cooldownTimerRef.current = null
    }

    nodDetectorRef.current.reset()
    setIsActive(false)
    setGestureState(prev => ({ ...prev, status: 'camera-off', nodCount: 0 }))
  }, [])

  const updateConfig = useCallback((updates: Partial<GestureConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates }
      nodDetectorRef.current.updateOptions({
        threshold: next.nodThreshold,
        windowMs: next.windowMs,
        requiredNods: next.requiredNods,
        cooldownMs: next.cooldownMs,
      })
      return next
    })
    setGestureState(prev => ({ ...prev, requiredNods: updates.requiredNods ?? prev.requiredNods }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    gestureState,
    videoRef,
    isActive,
    startCamera,
    stopCamera,
    config,
    updateConfig,
    cameraError,
  }
}
