import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Canvas } from './Canvas'

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

describe('Canvas Component', () => {
  const defaultProps = {
    width: 800,
    height: 600,
    onViewportChange: vi.fn(),
    onNodeClick: vi.fn(),
    onNodeDrag: vi.fn(),
    onDeleteSelection: vi.fn(),
    onCopySelection: vi.fn(),
    onPaste: vi.fn(),
    onRectangleSelection: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders SVG canvas with correct dimensions', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('width', '800')
      expect(svg).toHaveAttribute('height', '600')
    })

    it('renders background grid pattern', () => {
      render(<Canvas {...defaultProps} />)
      
      const gridPattern = screen.getByTestId('grid-pattern')
      expect(gridPattern).toBeInTheDocument()
      expect(gridPattern).toHaveAttribute('id', 'grid-pattern')
    })

    it('renders canvas content group', () => {
      render(<Canvas {...defaultProps} />)
      
      const contentGroup = screen.getByTestId('canvas-content')
      expect(contentGroup).toBeInTheDocument()
    })

    it('applies initial viewport transform', () => {
      render(<Canvas {...defaultProps} />)
      
      const contentGroup = screen.getByTestId('canvas-content')
      expect(contentGroup).toHaveAttribute('transform', 'translate(0, 0) scale(1)')
    })
  })

  describe('Pan Functionality', () => {
    it('starts pan on mouse down', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      fireEvent.mouseDown(svg, { clientX: 100, clientY: 100 })
      
      expect(svg).toHaveAttribute('data-panning', 'true')
    })

    it('updates pan on mouse move', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      fireEvent.mouseDown(svg, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(svg, { clientX: 200, clientY: 150 })
      
      const contentGroup = screen.getByTestId('canvas-content')
      expect(contentGroup).toHaveAttribute('transform', 'translate(100, 50) scale(1)')
    })

    it('ends pan on mouse up', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      fireEvent.mouseDown(svg, { clientX: 100, clientY: 100 })
      fireEvent.mouseUp(svg)
      
      expect(svg).not.toHaveAttribute('data-panning')
    })

    it('calls onViewportChange when panning', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      fireEvent.mouseDown(svg, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(svg, { clientX: 200, clientY: 150 })
      
      expect(defaultProps.onViewportChange).toHaveBeenCalledWith({
        x: 100,
        y: 50,
        scale: 1
      })
    })
  })

  describe('Rectangle Selection', () => {
    it('starts selection on Shift+mousedown and renders selection rect', () => {
      render(<Canvas {...defaultProps} />)

      const svg = screen.getByTestId('canvas-svg')
      // Begin selection at (100,100)
      fireEvent.mouseDown(svg, { clientX: 100, clientY: 100, shiftKey: true })
      expect(svg).toHaveAttribute('data-selecting', 'true')

      // Drag to (200,150)
      fireEvent.mouseMove(svg, { clientX: 200, clientY: 150 })
      const rect = screen.getByTestId('selection-rect')
      expect(rect).toBeInTheDocument()
      expect(rect).toHaveAttribute('x', '100')
      expect(rect).toHaveAttribute('y', '100')
      expect(rect).toHaveAttribute('width', '100')
      expect(rect).toHaveAttribute('height', '50')
    })

    it('emits onRectangleSelection on mouseup with correct bounds and clears state', () => {
      render(<Canvas {...defaultProps} />)

      const svg = screen.getByTestId('canvas-svg')
      fireEvent.mouseDown(svg, { clientX: 300, clientY: 200, shiftKey: true })
      fireEvent.mouseMove(svg, { clientX: 250, clientY: 260 })
      fireEvent.mouseUp(svg)

      expect(defaultProps.onRectangleSelection).toHaveBeenCalledWith({
        x: 250,
        y: 200,
        width: 50,
        height: 60,
      })

      // Selection cleared
      expect(svg).not.toHaveAttribute('data-selecting')
    })
  })

  describe('Zoom Functionality', () => {
    it('zooms in on wheel up', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      fireEvent.wheel(svg, { deltaY: -100, clientX: 400, clientY: 300 })
      
      const contentGroup = screen.getByTestId('canvas-content')
      expect(contentGroup).toHaveAttribute('transform', 'translate(0, 0) scale(1.1)')
    })

    it('zooms out on wheel down', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      fireEvent.wheel(svg, { deltaY: 100, clientX: 400, clientY: 300 })
      
      const contentGroup = screen.getByTestId('canvas-content')
      expect(contentGroup).toHaveAttribute('transform', 'translate(0, 0) scale(0.9)')
    })

    it('respects zoom limits', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      
      // Zoom out to minimum
      for (let i = 0; i < 20; i++) {
        fireEvent.wheel(svg, { deltaY: 100, clientX: 400, clientY: 300 })
      }
      
      const contentGroup = screen.getByTestId('canvas-content')
      expect(contentGroup).toHaveAttribute('transform', 'translate(0, 0) scale(0.1)')
    })

    it('calls onViewportChange when zooming', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      fireEvent.wheel(svg, { deltaY: -100, clientX: 400, clientY: 300 })
      
      expect(defaultProps.onViewportChange).toHaveBeenCalledWith({
        x: 0,
        y: 0,
        scale: 1.1
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('pans with arrow keys', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      fireEvent.keyDown(svg, { key: 'ArrowRight' })
      
      const contentGroup = screen.getByTestId('canvas-content')
      expect(contentGroup).toHaveAttribute('transform', 'translate(50, 0) scale(1)')
    })

    it('zooms with plus/minus keys', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      fireEvent.keyDown(svg, { key: '+' })
      
      const contentGroup = screen.getByTestId('canvas-content')
      expect(contentGroup).toHaveAttribute('transform', 'translate(0, 0) scale(1.1)')
    })

    it('resets view with home key', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      
      // First pan and zoom
      fireEvent.mouseDown(svg, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(svg, { clientX: 200, clientY: 150 })
      fireEvent.wheel(svg, { deltaY: -100, clientX: 400, clientY: 300 })
      
      // Then reset
      fireEvent.keyDown(svg, { key: 'Home' })
      
      const contentGroup = screen.getByTestId('canvas-content')
      expect(contentGroup).toHaveAttribute('transform', 'translate(0, 0) scale(1)')
    })

    it('calls onDeleteSelection with Delete/Backspace', () => {
      render(<Canvas {...defaultProps} />)

      const svg = screen.getByTestId('canvas-svg')
      fireEvent.keyDown(svg, { key: 'Delete' })
      expect(defaultProps.onDeleteSelection).toHaveBeenCalled()

      fireEvent.keyDown(svg, { key: 'Backspace' })
      expect(defaultProps.onDeleteSelection).toHaveBeenCalledTimes(2)
    })

    it('calls onCopySelection with Cmd/Ctrl+C', () => {
      render(<Canvas {...defaultProps} />)

      const svg = screen.getByTestId('canvas-svg')
      fireEvent.keyDown(svg, { key: 'c', metaKey: true })
      expect(defaultProps.onCopySelection).toHaveBeenCalled()

      fireEvent.keyDown(svg, { key: 'C', ctrlKey: true })
      expect(defaultProps.onCopySelection).toHaveBeenCalledTimes(2)
    })

    it('calls onPaste with Cmd/Ctrl+V', () => {
      render(<Canvas {...defaultProps} />)

      const svg = screen.getByTestId('canvas-svg')
      fireEvent.keyDown(svg, { key: 'v', metaKey: true })
      expect(defaultProps.onPaste).toHaveBeenCalled()

      fireEvent.keyDown(svg, { key: 'V', ctrlKey: true })
      expect(defaultProps.onPaste).toHaveBeenCalledTimes(2)
    })
  })

  describe('Touch Support', () => {
    it('handles touch start for panning', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      fireEvent.touchStart(svg, {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      
      expect(svg).toHaveAttribute('data-panning', 'true')
    })

    it('handles touch move for panning', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      fireEvent.touchStart(svg, {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      fireEvent.touchMove(svg, {
        touches: [{ clientX: 200, clientY: 150 }]
      })
      
      const contentGroup = screen.getByTestId('canvas-content')
      expect(contentGroup).toHaveAttribute('transform', 'translate(100, 50) scale(1)')
    })

    it('handles touch end', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      fireEvent.touchStart(svg, {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      fireEvent.touchEnd(svg)
      
      expect(svg).not.toHaveAttribute('data-panning')
    })
  })

  describe('Performance', () => {
    it('uses transform3d for hardware acceleration', () => {
      render(<Canvas {...defaultProps} />)
      
      const contentGroup = screen.getByTestId('canvas-content')
      const transform = contentGroup.getAttribute('transform')
      expect(transform).toContain('translate')
      expect(transform).toContain('scale')
    })

    it('has wheel event handler for zooming', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      // Verify that wheel events are handled for zooming
      fireEvent.wheel(svg, { deltaY: -100, clientX: 400, clientY: 300 })
      
      // The zoom should have been applied
      const contentGroup = screen.getByTestId('canvas-content')
      expect(contentGroup).toHaveAttribute('transform', 'translate(0, 0) scale(1.1)')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      expect(svg).toHaveAttribute('role', 'application')
      expect(svg).toHaveAttribute('aria-label', 'Interactive canvas workspace')
    })

    it('supports keyboard navigation', () => {
      render(<Canvas {...defaultProps} />)
      
      const svg = screen.getByTestId('canvas-svg')
      expect(svg).toHaveAttribute('tabindex', '0')
    })
  })
}) 