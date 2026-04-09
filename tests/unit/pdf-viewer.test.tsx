import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PDFViewer } from '@/components/pdf-viewer'
import { PDFState } from '@/types'
import { createRef } from 'react'

const mockPDFState = (overrides?: Partial<PDFState>): PDFState => ({
  file: null,
  pageCount: 0,
  currentPage: 1,
  loading: false,
  error: null,
  ...overrides,
})

describe('PDFViewer component', () => {
  const canvasRef = createRef<HTMLCanvasElement>()

  const defaultProps = {
    pdfState: mockPDFState(),
    canvasRef,
    onOpenFile: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onUndo: vi.fn(),
    canUndo: false,
  }

  it('shows "Open PDF score" placeholder when no file loaded', () => {
    render(<PDFViewer {...defaultProps} />)
    expect(screen.getByText(/open a pdf score/i)).toBeInTheDocument()
  })

  it('shows filename when file is loaded', () => {
    const file = new File(['%PDF-1.4'], 'my-score.pdf', { type: 'application/pdf' })
    render(
      <PDFViewer
        {...defaultProps}
        pdfState={mockPDFState({ file, pageCount: 10, currentPage: 3 })}
      />
    )
    expect(screen.getByText('my-score.pdf')).toBeInTheDocument()
  })

  it('shows page indicator when file is loaded', () => {
    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })
    render(
      <PDFViewer
        {...defaultProps}
        pdfState={mockPDFState({ file, pageCount: 20, currentPage: 5 })}
      />
    )
    expect(screen.getByText('Page 5 of 20')).toBeInTheDocument()
  })

  it('calls onNext when Next button is clicked', () => {
    const onNext = vi.fn()
    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })
    render(
      <PDFViewer
        {...defaultProps}
        pdfState={mockPDFState({ file, pageCount: 10, currentPage: 3 })}
        onNext={onNext}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /next page/i }))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('calls onPrev when Prev button is clicked', () => {
    const onPrev = vi.fn()
    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })
    render(
      <PDFViewer
        {...defaultProps}
        pdfState={mockPDFState({ file, pageCount: 10, currentPage: 3 })}
        onPrev={onPrev}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /previous page/i }))
    expect(onPrev).toHaveBeenCalledOnce()
  })

  it('disables Prev button on first page', () => {
    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })
    render(
      <PDFViewer
        {...defaultProps}
        pdfState={mockPDFState({ file, pageCount: 10, currentPage: 1 })}
      />
    )
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled()
  })

  it('disables Next button on last page', () => {
    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })
    render(
      <PDFViewer
        {...defaultProps}
        pdfState={mockPDFState({ file, pageCount: 10, currentPage: 10 })}
      />
    )
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled()
  })

  it('shows Undo button when canUndo is true', () => {
    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })
    render(
      <PDFViewer
        {...defaultProps}
        pdfState={mockPDFState({ file, pageCount: 10, currentPage: 5 })}
        canUndo={true}
      />
    )
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
  })

  it('hides Undo button when canUndo is false', () => {
    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })
    render(
      <PDFViewer
        {...defaultProps}
        pdfState={mockPDFState({ file, pageCount: 10, currentPage: 5 })}
        canUndo={false}
      />
    )
    expect(screen.queryByRole('button', { name: /undo/i })).not.toBeInTheDocument()
  })

  it('displays error message', () => {
    render(
      <PDFViewer
        {...defaultProps}
        pdfState={mockPDFState({ error: 'Invalid PDF file' })}
      />
    )
    expect(screen.getByText(/invalid pdf file/i)).toBeInTheDocument()
  })

  it('shows loading indicator', () => {
    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })
    render(
      <PDFViewer
        {...defaultProps}
        pdfState={mockPDFState({ file, loading: true })}
      />
    )
    expect(screen.getByText('Loading PDF…')).toBeInTheDocument()
  })
})
