'use client'

import { useRef } from 'react'
import clsx from 'clsx'
import { PDFState } from '@/types'

interface PDFViewerProps {
  pdfState: PDFState
  canvasRef: React.RefObject<HTMLCanvasElement>
  onOpenFile: (file: File) => void
  onNext: () => void
  onPrev: () => void
  onUndo: () => void
  canUndo: boolean
  performanceMode: boolean
}

export function PDFViewer({
  pdfState,
  canvasRef,
  onOpenFile,
  onNext,
  onPrev,
  onUndo,
  canUndo,
  performanceMode,
}: PDFViewerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { file, pageCount, currentPage, loading, error } = pdfState

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) onOpenFile(selected)
    e.target.value = ''
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1020] shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
      <div
        className={clsx(
          'z-10 flex items-center gap-3 border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl',
          performanceMode && 'absolute left-4 right-4 top-4 rounded-2xl border bg-black/35',
        )}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
        >
          Open PDF
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {file && (
          <>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white">{file.name}</div>
              <div className="text-xs text-white/45">Page {currentPage} of {pageCount}</div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {canUndo && (
                <button
                  onClick={onUndo}
                  className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:bg-amber-400/20"
                >
                  Undo
                </button>
              )}
              <button
                onClick={onPrev}
                disabled={currentPage <= 1}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                onClick={onNext}
                disabled={currentPage >= pageCount}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>

      <div className="relative flex-1 overflow-auto bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_35%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mx-auto max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!file && !error && (
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center text-white/65">
            <div className="rounded-full border border-white/10 bg-white/5 p-5">
              <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m8 3H4a1 1 0 01-1-1V6a1 1 0 011-1h5.586a1 1 0 01.707.293l1.414 1.414A1 1 0 0012.414 7H20a1 1 0 011 1v11a1 1 0 01-1 1z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-semibold text-white">Open a score and start gesturing</p>
              <p className="mt-2 max-w-lg text-sm text-white/45">
                Upload a PDF, enable the camera, and use configurable face gestures to move through the music hands-free.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 pt-10 text-white/70">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            Loading PDF…
          </div>
        )}

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className={clsx(
              'max-w-full rounded-[1.5rem] bg-white shadow-[0_20px_80px_rgba(15,23,42,0.5)]',
              !file || loading ? 'hidden' : 'block',
            )}
            aria-label={`PDF page ${currentPage}`}
          />
        </div>
      </div>
    </div>
  )
}
