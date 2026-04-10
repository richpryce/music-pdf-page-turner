'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CameraPreview } from '@/components/camera-preview'
import { GestureStatus } from '@/components/gesture-status'
import { PDFViewer } from '@/components/pdf-viewer'
import { useGestureDetector } from '@/hooks/use-gesture-detector'
import { usePDFViewer } from '@/hooks/use-pdf-viewer'
import { GestureAction } from '@/types'

export default function Home() {
  const { pdfState, canvasRef, openFile, nextPage, prevPage, undoPageTurn, canUndo } = usePDFViewer()
  const [performanceMode, setPerformanceMode] = useState(false)

  const nextPageRef = useRef(nextPage)
  const prevPageRef = useRef(prevPage)

  useEffect(() => {
    nextPageRef.current = nextPage
    prevPageRef.current = prevPage
  }, [nextPage, prevPage])

  const handleAction = useCallback((action: GestureAction) => {
    if (action === 'next') {
      void nextPageRef.current()
    } else {
      void prevPageRef.current()
    }
  }, [])

  const {
    gestureState,
    videoRef,
    isActive,
    startCamera,
    stopCamera,
    config,
    updateConfig,
    cameraError,
  } = useGestureDetector({
    onAction: handleAction,
  })

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault()
          void nextPage()
          break
        case 'ArrowLeft':
          e.preventDefault()
          void prevPage()
          break
        case 'u':
        case 'U':
          e.preventDefault()
          void undoPageTurn()
          break
        case 'p':
        case 'P':
          e.preventDefault()
          setPerformanceMode(prev => !prev)
          break
      }
    },
    [nextPage, prevPage, undoPageTurn],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#020617_0%,#0b1120_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        {!performanceMode && (
          <header className="flex flex-col justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-5 shadow-2xl backdrop-blur-xl lg:flex-row lg:items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300/60">Music PDF Page Turner</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Hands-free score reading with configurable gestures
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55 sm:text-base">
                Configure separate gestures for next and previous page, keep a small live camera preview,
                and switch into performance mode when you want the PDF to dominate the screen.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start lg:self-center">
              <CameraPreview videoRef={videoRef} isActive={isActive} />
            </div>
          </header>
        )}

        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-h-[70vh]">
            <PDFViewer
              pdfState={pdfState}
              canvasRef={canvasRef}
              onOpenFile={openFile}
              onNext={nextPage}
              onPrev={prevPage}
              onUndo={undoPageTurn}
              canUndo={canUndo}
              performanceMode={performanceMode}
            />
          </div>

          {!performanceMode && (
            <div className="space-y-6">
              <GestureStatus
                gestureState={gestureState}
                config={config}
                onUpdateConfig={updateConfig}
                isActive={isActive}
                onStart={startCamera}
                onStop={stopCamera}
                cameraError={cameraError}
                performanceMode={performanceMode}
                onTogglePerformanceMode={() => setPerformanceMode(prev => !prev)}
              />
            </div>
          )}
        </div>
      </div>

      {performanceMode && (
        <>
          <div className="fixed right-4 top-4 z-30 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-3 py-3 shadow-2xl backdrop-blur-xl">
            <CameraPreview videoRef={videoRef} isActive={isActive} compact />
            <div className="space-y-2 text-xs text-white/75">
              <div className="uppercase tracking-[0.18em] text-white/45">Performance mode</div>
              <div>Page {pdfState.currentPage} / {pdfState.pageCount || '—'}</div>
              <div>Next: {config.nextGesture.kind} ×{config.nextGesture.count}</div>
              <div>Prev: {config.previousGesture.kind} ×{config.previousGesture.count}</div>
              <button
                onClick={() => setPerformanceMode(false)}
                className="mt-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] transition hover:bg-white/10"
              >
                Open controls
              </button>
            </div>
          </div>

          <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs text-white/70 shadow-xl backdrop-blur-md">
            Press <span className="font-semibold text-white">P</span> to exit performance mode · <span className="font-semibold text-white">U</span> undo · arrows to navigate
          </div>
        </>
      )}
    </div>
  )
}
