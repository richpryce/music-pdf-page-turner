'use client'

import { useState, useCallback, useRef } from 'react'
import { PDFState } from '@/types'

interface UsePDFViewerReturn {
  pdfState: PDFState
  canvasRef: React.RefObject<HTMLCanvasElement>
  openFile: (file: File) => Promise<void>
  goToPage: (page: number) => Promise<void>
  nextPage: () => Promise<void>
  prevPage: () => Promise<void>
  undoPageTurn: () => Promise<void>
  canUndo: boolean
}

export function usePDFViewer(): UsePDFViewerReturn {
  const [pdfState, setPDFState] = useState<PDFState>({
    file: null,
    pageCount: 0,
    currentPage: 1,
    loading: false,
    error: null,
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfDocRef = useRef<any>(null)
  const renderTaskRef = useRef<any>(null)
  const previousPageRef = useRef<number | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const renderPage = useCallback(async (doc: any, pageNumber: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const page = await doc.getPage(pageNumber)

    // Scale to fit canvas width
    const containerWidth = canvas.parentElement?.clientWidth ?? 800
    const viewport = page.getViewport({ scale: 1 })
    const scale = Math.min(containerWidth / viewport.width, 2.0)
    const scaledViewport = page.getViewport({ scale })

    canvas.height = scaledViewport.height
    canvas.width = scaledViewport.width

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Cancel any in-progress render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel()
    }

    const renderTask = page.render({
      canvasContext: ctx,
      viewport: scaledViewport,
    })
    renderTaskRef.current = renderTask

    try {
      await renderTask.promise
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        throw err
      }
    }
  }, [])

  const openFile = useCallback(async (file: File) => {
    setPDFState(prev => ({ ...prev, loading: true, error: null, file }))

    try {
      const pdfjsLib = await import('pdfjs-dist')

      // Set worker — must be done before loading
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

      const arrayBuffer = await file.arrayBuffer()
      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      pdfDocRef.current = doc
      previousPageRef.current = null

      setPDFState(prev => ({
        ...prev,
        pageCount: doc.numPages,
        currentPage: 1,
        loading: false,
      }))

      await renderPage(doc, 1)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load PDF'
      setPDFState(prev => ({ ...prev, loading: false, error: msg }))
    }
  }, [renderPage])

  const goToPage = useCallback(async (page: number) => {
    const doc = pdfDocRef.current
    if (!doc) return

    const targetPage = Math.max(1, Math.min(page, pdfState.pageCount))
    if (targetPage === pdfState.currentPage) return

    previousPageRef.current = pdfState.currentPage
    setPDFState(prev => ({ ...prev, currentPage: targetPage }))

    // Clear undo timer
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => {
      previousPageRef.current = null
      undoTimerRef.current = null
    }, 5000)

    await renderPage(doc, targetPage)
  }, [pdfState.currentPage, pdfState.pageCount, renderPage])

  const nextPage = useCallback(async () => {
    await goToPage(pdfState.currentPage + 1)
  }, [pdfState.currentPage, goToPage])

  const prevPage = useCallback(async () => {
    await goToPage(pdfState.currentPage - 1)
  }, [pdfState.currentPage, goToPage])

  const undoPageTurn = useCallback(async () => {
    if (previousPageRef.current !== null) {
      const target = previousPageRef.current
      previousPageRef.current = null
      await goToPage(target)
    }
  }, [goToPage])

  const canUndo = previousPageRef.current !== null

  return {
    pdfState,
    canvasRef,
    openFile,
    goToPage,
    nextPage,
    prevPage,
    undoPageTurn,
    canUndo,
  }
}
