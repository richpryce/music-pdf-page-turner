'use client'

import { useRef } from 'react'
import { PDFState } from '@/types'
import clsx from 'clsx'

interface PDFViewerProps {
  pdfState: PDFState
  canvasRef: React.RefObject<HTMLCanvasElement>
  onOpenFile: (file: File) => void
  onNext: () => void
  onPrev: () => void
  onUndo: () => void
  canUndo: boolean
}

export function PDFViewer({
  pdfState,
  canvasRef,
  onOpenFile,
  onNext,
  onPrev,
  onUndo,
  canUndo,
}: PDFViewerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onOpenFile(file)
    // Reset input so same file can be re-opened
    e.target.value = ''
  }

  const { file, pageCount, currentPage, loading, error } = pdfState

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-3 bg-gray-900 border-b border-gray-700 flex-shrink-0">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-medium transition-colors"
        >
          Open PDF
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Open PDF file"
        />

        {file && (
          <>
            <span className="text-gray-400 text-sm truncate max-w-xs" title={file.name}>
              {file.name}
            </span>

            <div className="ml-auto flex items-center gap-2">
              {canUndo && (
                <button
                  onClick={onUndo}
                  className="px-2 py-1 bg-yellow-700 hover:bg-yellow-600 text-white text-xs rounded transition-colors"
                  title="Undo last page turn (U)"
                >
                  Undo
                </button>
              )}

              <button
                onClick={onPrev}
                disabled={currentPage <= 1}
                className={clsx(
                  'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                  currentPage > 1
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed',
                )}
                aria-label="Previous page"
              >
                ← Prev
              </button>

              <span className="text-sm text-gray-300 min-w-[7rem] text-center">
                {loading ? 'Loading…' : `Page ${currentPage} of ${pageCount}`}
              </span>

              <button
                onClick={onNext}
                disabled={currentPage >= pageCount}
                className={clsx(
                  'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                  currentPage < pageCount
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed',
                )}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto bg-gray-950 flex items-start justify-center p-4">
        {error && (
          <div className="text-red-400 bg-red-900/20 rounded p-4 text-sm max-w-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!file && !error && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
            <svg
              className="w-16 h-16 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg">Open a PDF score to get started</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
            >
              Open PDF
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-gray-400 mt-8">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            Loading PDF…
          </div>
        )}

        <canvas
          ref={canvasRef}
          className={clsx(
            'shadow-2xl max-w-full',
            !file || loading ? 'hidden' : 'block',
          )}
          aria-label={`PDF page ${currentPage}`}
        />
      </div>
    </div>
  )
}
