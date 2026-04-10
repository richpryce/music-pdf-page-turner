'use client'

import { useEffect, useCallback, useRef } from 'react'
import { usePDFViewer } from '@/hooks/use-pdf-viewer'
import { useGestureDetector } from '@/hooks/use-gesture-detector'
import { PDFViewer } from '@/components/pdf-viewer'
import { GestureStatus } from '@/components/gesture-status'
import { CameraPreview } from '@/components/camera-preview'

export default function Home() {
  const {
    pdfState,
    canvasRef,
    openFile,
    nextPage,
    prevPage,
    undoPageTurn,
    canUndo,
  } = usePDFViewer()

  const nextPageRef = useRef(nextPage)

  useEffect(() => {
    nextPageRef.current = nextPage
  }, [nextPage])

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
    onPageTurn: () => nextPageRef.current(),
  })

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault()
          nextPage()
          break
        case 'ArrowLeft':
          e.preventDefault()
          prevPage()
          break
        case 'u':
        case 'U':
          e.preventDefault()
          undoPageTurn()
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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 flex-shrink-0">
        <h1 className="text-lg font-semibold text-gray-100">
          Music PDF Page Turner
        </h1>
        <div className="flex items-center gap-3">
          <CameraPreview videoRef={videoRef} isActive={isActive} />
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* PDF area */}
        <main className="flex-1 overflow-hidden">
          <PDFViewer
            pdfState={pdfState}
            canvasRef={canvasRef}
            onOpenFile={openFile}
            onNext={nextPage}
            onPrev={prevPage}
            onUndo={undoPageTurn}
            canUndo={canUndo}
          />
        </main>

        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 border-l border-gray-700 bg-gray-900 overflow-y-auto p-4 space-y-4">
          <GestureStatus
            gestureState={gestureState}
            config={config}
            onUpdateConfig={updateConfig}
            isActive={isActive}
            onStart={startCamera}
            onStop={stopCamera}
            cameraError={cameraError}
          />

          {/* Keyboard shortcuts help */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
              Keyboard Shortcuts
            </h2>
            <dl className="space-y-1 text-xs text-gray-400">
              <div className="flex justify-between">
                <dt>Next page</dt>
                <dd className="font-mono text-gray-300">→ / Space</dd>
              </div>
              <div className="flex justify-between">
                <dt>Previous page</dt>
                <dd className="font-mono text-gray-300">←</dd>
              </div>
              <div className="flex justify-between">
                <dt>Undo turn</dt>
                <dd className="font-mono text-gray-300">U</dd>
              </div>
            </dl>
          </div>

          {/* How to use */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
              How to Use
            </h2>
            <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside">
              <li>Open a PDF score</li>
              <li>Click <strong className="text-gray-300">Enable Camera</strong></li>
              <li>Position your face in view</li>
              <li>Nod {config.requiredNods}x deliberately to turn page</li>
              <li>Adjust sensitivity if needed</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  )
}
