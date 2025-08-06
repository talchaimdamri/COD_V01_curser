import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DocumentNode } from './DocumentNode'
import type { CanvasNode } from '../../../schemas/chain'

// Mock the event sourcing hook
vi.mock('../../hooks/useEventSourcing', () => ({
  useEventSourcing: () => ({
    trackEvent: vi.fn(),
    getEvents: vi.fn(() => []),
    replayEvents: vi.fn(),
  }),
}))

describe('DocumentNode', () => {
  const mockNode: CanvasNode = {
    id: 'doc-1',
    type: 'document',
    position: { x: 100, y: 100 },
    data: {
      title: 'Test Document',
      content: 'This is a test document',
      documentId: 'doc-1',
    },
    metadata: {
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    },
  }

  const defaultProps = {
    node: mockNode,
    isSelected: false,
    onSelect: vi.fn(),
    onDrag: vi.fn(),
    onDoubleClick: vi.fn(),
    viewport: { x: 0, y: 0, scale: 1 },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders document node with correct title', () => {
      render(<DocumentNode {...defaultProps} />)
      expect(screen.getByText('Test Document')).toBeInTheDocument()
    })

    it('renders document icon', () => {
      render(<DocumentNode {...defaultProps} />)
      const icon = screen.getByTestId('document-icon')
      expect(icon).toBeInTheDocument()
    })

    it('applies correct position based on viewport', () => {
      const props = {
        ...defaultProps,
        viewport: { x: 50, y: 50, scale: 1.5 },
      }
      render(<DocumentNode {...props} />)
      const node = screen.getByTestId('document-node')
      expect(node).toHaveAttribute('transform', 'translate(75, 75) scale(1.5)')
    })

    it('applies selection styling when selected', () => {
      const props = { ...defaultProps, isSelected: true }
      render(<DocumentNode {...props} />)
      const node = screen.getByTestId('document-node')
      expect(node).toHaveClass('selected')
    })

    it('renders with default styling when not selected', () => {
      render(<DocumentNode {...defaultProps} />)
      const node = screen.getByTestId('document-node')
      expect(node).not.toHaveClass('selected')
    })
  })

  describe('Interaction', () => {
    it('calls onSelect when clicked', () => {
      render(<DocumentNode {...defaultProps} />)
      const node = screen.getByTestId('document-node')
      fireEvent.click(node)
      expect(defaultProps.onSelect).toHaveBeenCalledWith('doc-1')
    })

    it('calls onDoubleClick when double-clicked', () => {
      render(<DocumentNode {...defaultProps} />)
      const node = screen.getByTestId('document-node')
      fireEvent.doubleClick(node)
      expect(defaultProps.onDoubleClick).toHaveBeenCalledWith('doc-1')
    })

    it('prevents default on context menu', () => {
      render(<DocumentNode {...defaultProps} />)
      const node = screen.getByTestId('document-node')
      const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true })
      const preventDefaultSpy = vi.spyOn(contextMenuEvent, 'preventDefault')
      fireEvent(node, contextMenuEvent)
      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Drag functionality', () => {
    it('handles drag start correctly', () => {
      render(<DocumentNode {...defaultProps} />)
      const node = screen.getByTestId('document-node')
      fireEvent.mouseDown(node, { clientX: 100, clientY: 100 })
      expect(node).toHaveAttribute('data-dragging', 'true')
    })

    it('handles drag end correctly', () => {
      render(<DocumentNode {...defaultProps} />)
      const node = screen.getByTestId('document-node')
      fireEvent.mouseDown(node, { clientX: 100, clientY: 100 })
      fireEvent.mouseUp(node)
      expect(node).toHaveAttribute('data-dragging', 'false')
    })

    it('calls onDrag with correct coordinates during drag', () => {
      render(<DocumentNode {...defaultProps} />)
      const node = screen.getByTestId('document-node')
      
      fireEvent.mouseDown(node, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(node, { clientX: 150, clientY: 150 })
      
      expect(defaultProps.onDrag).toHaveBeenCalledWith('doc-1', 150, 150)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<DocumentNode {...defaultProps} />)
      const node = screen.getByTestId('document-node')
      expect(node).toHaveAttribute('role', 'button')
      expect(node).toHaveAttribute('tabIndex', '0')
      expect(node).toHaveAttribute('aria-label', 'Document: Test Document')
    })

    it('handles keyboard navigation', () => {
      render(<DocumentNode {...defaultProps} />)
      const node = screen.getByTestId('document-node')
      
      fireEvent.keyDown(node, { key: 'Enter' })
      expect(defaultProps.onSelect).toHaveBeenCalledWith('doc-1')
      
      fireEvent.keyDown(node, { key: ' ' })
      expect(defaultProps.onSelect).toHaveBeenCalledWith('doc-1')
    })
  })

  describe('Visual styling', () => {
    it('renders with correct dimensions', () => {
      render(<DocumentNode {...defaultProps} />)
      const rect = screen.getByTestId('document-rect')
      expect(rect).toHaveAttribute('width', '200')
      expect(rect).toHaveAttribute('height', '120')
      expect(rect).toHaveAttribute('rx', '8')
    })

    it('renders title text with proper positioning', () => {
      render(<DocumentNode {...defaultProps} />)
      const title = screen.getByText('Test Document')
      expect(title).toHaveAttribute('x', '100')
      expect(title).toHaveAttribute('y', '70')
    })

    it('truncates long titles', () => {
      const longTitleNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          title: 'This is a very long document title that should be truncated',
        },
      }
      const props = { ...defaultProps, node: longTitleNode }
      render(<DocumentNode {...props} />)
      const title = screen.getByText('This is a very long documen...')
      expect(title).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('handles missing title gracefully', () => {
      const nodeWithoutTitle = {
        ...mockNode,
        data: {
          ...mockNode.data,
          title: '',
        },
      }
      const props = { ...defaultProps, node: nodeWithoutTitle }
      render(<DocumentNode {...props} />)
      expect(screen.getByText('Untitled Document')).toBeInTheDocument()
    })

    it('handles missing data gracefully', () => {
      const nodeWithoutData = {
        ...mockNode,
        data: {},
      }
      const props = { ...defaultProps, node: nodeWithoutData }
      render(<DocumentNode {...props} />)
      expect(screen.getByText('Untitled Document')).toBeInTheDocument()
    })

    it('handles extreme viewport scales', () => {
      const props = {
        ...defaultProps,
        viewport: { x: 0, y: 0, scale: 0.1 },
      }
      render(<DocumentNode {...props} />)
      const node = screen.getByTestId('document-node')
      expect(node).toHaveAttribute('transform', 'translate(10, 10) scale(0.1)')
    })
  })
}) 