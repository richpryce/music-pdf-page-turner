'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import {
  GestureAction,
  GestureConfig,
  GestureState,
  DEFAULT_GESTURE_CONFIG,
} from '@/types'
import { GestureDetector } from '@/utils/gesture-detector'

interface UseGestureDetectorOptions {
  config?: Partial<GestureConfig>
  onAction: (action: GestureAction) => void
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
  onAction,
}: UseGestureDetectorOptions): UseGestureDetectorReturn {
  const [config, setConfig] = useState<GestureConfig>({
    ...DEFAULT_GESTURE_CONFIG,
    ...configOverrides,
  })

  const [gestureState, setGestureState] = useState<GestureState>({
    status: 'camera-off',
    progress: { next: 0, previous: 0 },
    activeAction: null,
    cooldownRemaining: 0,
    lastTriggeredAction: null,
    lastTriggeredAt: null,
  })

  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const faceMeshRef = useRef<any>(null)
  const cameraInstanceRef = useRef<any>(null)
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cooldownEndRef = useRef<number>(0)

  const detectorRef = useRef<GestureDetector | null>(null)

  useEffect(() => {
    detectorRef.current = new GestureDetector(config, {
      onProgress: (action, count) => {
        setGestureState(prev => ({
          ...prev,
          status: isActive ? 'tracking' : prev.status,
          progress: { ...prev.progress, [action]: count },
        }))
      },
      onTrigger: (action) => {
        setGestureState(prev => ({
          ...prev,
          status: 'turning',
          activeAction: action,
          lastTriggeredAction: action,
          lastTriggeredAt: Date.now(),
          progress: { next: 0, previous: 0 },
        }))

        onAction(action)

        cooldownEndRef.current = Date.now() + config.cooldownMs
        if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current)
        cooldownTimerRef.current = setInterval(() => {
          const remaining = cooldownEndRef.current - Date.now()
          if (remaining <= 0) {
            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current)
            cooldownTimerRef.current = null
            setGestureState(prev => ({
              ...prev,
              status: 'ready',
              cooldownRemaining: 0,
              activeAction: null,
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
      onActiveActionChange: action => {
        setGestureState(prev => ({ ...prev, activeAction: action }))
      },
    })
  }, [config, isActive, onAction])

  const loadMediaPipe = useCallback(async () => {
    if (typeof window === 'undefined') return

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

  const stopCamera = useCallback(() => {
    if (cameraInstanceRef.current) {
      try {
        cameraInstanceRef.current.stop()
      } catch (_) {}
      cameraInstanceRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current)
      cooldownTimerRef.current = null
    }

    detectorRef.current?.reset()
    setIsActive(false)
    setGestureState(prev => ({
      ...prev,
      status: 'camera-off',
      progress: { next: 0, previous: 0 },
      activeAction: null,
      cooldownRemaining: 0,
    }))
  }, [])

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      setGestureState(prev => ({ ...prev, status: 'initializing' }))

      if (!videoRef.current) {
        throw new Error('Camera preview is not ready yet. Please try again.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      })
      streamRef.current = stream

      const videoEl = videoRef.current
      videoEl.srcObject = stream
      await videoEl.play()
      setIsActive(true)

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
        if (results.multiFaceLandmarks?.length > 0 && detectorRef.current) {
          const landmarks = results.multiFaceLandmarks[0]
          const noseTip = landmarks[1]
          const leftEyeOuter = landmarks[33]
          const rightEyeOuter = landmarks[263]

          if (noseTip && leftEyeOuter && rightEyeOuter) {
            const tilt = Math.atan2(rightEyeOuter.y - leftEyeOuter.y, rightEyeOuter.x - leftEyeOuter.x)
            detectorRef.current.feed({
              noseX: noseTip.x,
              noseY: noseTip.y,
              tilt,
            })
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
        progress: { next: 0, previous: 0 },
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera error'
      setCameraError(msg)
      stopCamera()
    }
  }, [loadMediaPipe, stopCamera])

  const updateConfig = useCallback((updates: Partial<GestureConfig>) => {
    setConfig(prev => {
      const next = {
        ...prev,
        ...updates,
        nextGesture: { ...prev.nextGesture, ...(updates.nextGesture ?? {}) },
        previousGesture: { ...prev.previousGesture, ...(updates.previousGesture ?? {}) },
      }
      detectorRef.current?.updateConfig(next)
      return next
    })
  }, [])

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
