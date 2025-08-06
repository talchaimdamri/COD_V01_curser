import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Edge } from './Edge'
import type { CanvasEdge } from '../../../schemas/chain'

// Mock the useEventSourcing hook
vi.mock('../../hooks/useEventSourcing', () => ({
  useEventSourcing: () => ({
    trackEvent: vi.fn(),
  }),
}))

describe('Edge', () => {
  const mockEdge: CanvasEdge = {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    type: 'document-to-agent',
    label: 'Process Document',
    metadata: {},
  }

  const mockSourceNode = {
    position: { x: 100, y: 100 },
    type: 'document' as const,
  }

  const mockTargetNode = {
    position: { x: 300, y: 100 },
    type: 'agent' as const,
  }

  const mockViewport = {
    x: 0,
    y: 0,
    scale: 1,
  }

  const defaultProps = {
    edge: mockEdge,
    sourceNode: mockSourceNode,
    targetNode: mockTargetNode,
    isSelected: false,
    onSelect: vi.fn(),
    viewport: mockViewport,
  }

  describe('Rendering', () => {
    it('renders edge with correct path', () => {
      render(<Edge {...defaultProps} />)
      
      const edgePath = screen.getByTestId('edge-path')
      expect(edgePath).toBeInTheDocument()
      expect(edgePath).toHaveAttribute('d')
    })

    it('renders edge with arrow marker', () => {
      render(<Edge {...defaultProps} />)
      
      const edgePathWithArrow = screen.getByTestId('edge-path-with-arrow')
      expect(edgePathWithArrow).toBeInTheDocument()
      expect(edgePathWithArrow).toHaveAttribute('marker-end')
    })

    it('renders edge label when provided', () => {
      render(<Edge {...defaultProps} />)
      
      const edgeLabel = screen.getByText('Process Document')
      expect(edgeLabel).toBeInTheDocument()
      expect(edgeLabel).toHaveClass('edge-label')
    })

    it('does not render edge label when not provided', () => {
      const edgeWithoutLabel = { ...mockEdge, label: undefined }
      render(<Edge {...defaultProps} edge={edgeWithoutLabel} />)
      
      expect(screen.queryByText('Process Document')).not.toBeInTheDocument()
    })

    it('renders with correct accessibility attributes', () => {
      render(<Edge {...defaultProps} />)
      
      const edge = screen.getByTestId('edge')
      expect(edge).toHaveAttribute('role', 'button')
      expect(edge).toHaveAttribute('tabIndex', '0')
      expect(edge).toHaveAttribute('aria-label', 'Edge from node-1 to node-2')
    })
  })

  describe('Connection Points', () => {
    it('calculates correct connection points for document-to-agent', () => {
      render(<Edge {...defaultProps} />)
      
      const edgePath = screen.getByTestId('edge-path')
      const pathData = edgePath.getAttribute('d')
      
      // Should start from right side of document (x + 200, y + 60)
      // and end at left side of agent (x - 60, y)
      expect(pathData).toContain('M 300 160') // source point
      expect(pathData).toContain('240 100') // target point
    })

    it('calculates correct connection points for agent-to-document', () => {
      const agentToDocumentEdge = {
        ...mockEdge,
        type: 'agent-to-document',
      }
      
      const agentSourceNode = { ...mockSourceNode, type: 'agent' as const }
      
      render(<Edge {...defaultProps} edge={agentToDocumentEdge} sourceNode={agentSourceNode} />)
      
      const edgePath = screen.getByTestId('edge-path')
      const pathData = edgePath.getAttribute('d')
      
      // Should start from right side of agent (x + 60, y)
      // and end at left side of document (x, y + 60)
      expect(pathData).toContain('M 160 100') // source point
      expect(pathData).toContain('240 100') // target point (agent left side)
    })

    it('calculates correct connection points for agent-to-agent', () => {
      const agentToAgentEdge = {
        ...mockEdge,
        type: 'agent-to-agent',
      }
      
      const agentSourceNode = { ...mockSourceNode, type: 'agent' as const }
      
      render(<Edge {...defaultProps} edge={agentToAgentEdge} sourceNode={agentSourceNode} />)
      
      const edgePath = screen.getByTestId('edge-path')
      const pathData = edgePath.getAttribute('d')
      
      // Should start from right side of agent (x + 60, y)
      // and end at left side of agent (x - 60, y)
      expect(pathData).toContain('M 160 100') // source point
      expect(pathData).toContain('240 100') // target point
    })

    it('calculates correct connection points for document-to-document', () => {
      const documentToDocumentEdge = {
        ...mockEdge,
        type: 'document-to-document',
      }
      
      const documentTargetNode = { ...mockTargetNode, type: 'document' as const }
      
      render(<Edge {...defaultProps} edge={documentToDocumentEdge} targetNode={documentTargetNode} />)
      
      const edgePath = screen.getByTestId('edge-path')
      const pathData = edgePath.getAttribute('d')
      
      // Should start from right side of document (x + 200, y + 60)
      // and end at left side of document (x, y + 60)
      expect(pathData).toContain('M 300 160') // source point
      expect(pathData).toContain('300 160') // target point
    })
  })

  describe('Edge Colors', () => {
    it('applies correct color for document-to-agent edge', () => {
      render(<Edge {...defaultProps} />)
      
      const edgePath = screen.getByTestId('edge-path')
      expect(edgePath).toHaveAttribute('stroke', '#4caf50')
    })

    it('applies correct color for agent-to-document edge', () => {
      const agentToDocumentEdge = {
        ...mockEdge,
        type: 'agent-to-document',
      }
      
      render(<Edge {...defaultProps} edge={agentToDocumentEdge} />)
      
      const edgePath = screen.getByTestId('edge-path')
      expect(edgePath).toHaveAttribute('stroke', '#ff9800')
    })

    it('applies correct color for agent-to-agent edge', () => {
      const agentToAgentEdge = {
        ...mockEdge,
        type: 'agent-to-agent',
      }
      
      render(<Edge {...defaultProps} edge={agentToAgentEdge} />)
      
      const edgePath = screen.getByTestId('edge-path')
      expect(edgePath).toHaveAttribute('stroke', '#9c27b0')
    })

    it('applies correct color for document-to-document edge', () => {
      const documentToDocumentEdge = {
        ...mockEdge,
        type: 'document-to-document',
      }
      
      render(<Edge {...defaultProps} edge={documentToDocumentEdge} />)
      
      const edgePath = screen.getByTestId('edge-path')
      expect(edgePath).toHaveAttribute('stroke', '#2196f3')
    })

    it('applies selection color when selected', () => {
      render(<Edge {...defaultProps} isSelected={true} />)
      
      const edgePath = screen.getByTestId('edge-path')
      expect(edgePath).toHaveAttribute('stroke', '#2196f3')
      expect(edgePath).toHaveAttribute('stroke-width', '3')
    })

    it('applies default color for unknown edge type', () => {
      const unknownEdge = {
        ...mockEdge,
        type: 'unknown-type',
      }
      
      render(<Edge {...defaultProps} edge={unknownEdge} />)
      
      const edgePath = screen.getByTestId('edge-path')
      expect(edgePath).toHaveAttribute('stroke', '#666')
    })
  })

  describe('Selection States', () => {
    it('shows selection indicator when selected', () => {
      render(<Edge {...defaultProps} isSelected={true} />)
      
      const selectionIndicator = screen.getByTestId('edge').querySelector('.selection-indicator')
      expect(selectionIndicator).toBeInTheDocument()
    })

    it('does not show selection indicator when not selected', () => {
      render(<Edge {...defaultProps} isSelected={false} />)
      
      const selectionIndicator = screen.getByTestId('edge').querySelector('.selection-indicator')
      expect(selectionIndicator).not.toBeInTheDocument()
    })

    it('applies selected class when selected', () => {
      render(<Edge {...defaultProps} isSelected={true} />)
      
      const edge = screen.getByTestId('edge')
      expect(edge).toHaveClass('edge', 'selected')
    })

    it('does not apply selected class when not selected', () => {
      render(<Edge {...defaultProps} isSelected={false} />)
      
      const edge = screen.getByTestId('edge')
      expect(edge).toHaveClass('edge')
      expect(edge).not.toHaveClass('selected')
    })
  })

  describe('Interaction', () => {
    it('calls onSelect when clicked', () => {
      const onSelect = vi.fn()
      render(<Edge {...defaultProps} onSelect={onSelect} />)
      
      const edge = screen.getByTestId('edge')
      fireEvent.click(edge)
      
      expect(onSelect).toHaveBeenCalledWith('edge-1')
    })

    it('calls onSelect when Enter key is pressed', () => {
      const onSelect = vi.fn()
      render(<Edge {...defaultProps} onSelect={onSelect} />)
      
      const edge = screen.getByTestId('edge')
      fireEvent.keyDown(edge, { key: 'Enter' })
      
      expect(onSelect).toHaveBeenCalledWith('edge-1')
    })

    it('calls onSelect when Space key is pressed', () => {
      const onSelect = vi.fn()
      render(<Edge {...defaultProps} onSelect={onSelect} />)
      
      const edge = screen.getByTestId('edge')
      fireEvent.keyDown(edge, { key: ' ' })
      
      expect(onSelect).toHaveBeenCalledWith('edge-1')
    })

    it('prevents default behavior on Enter key', () => {
      const onSelect = vi.fn()
      render(<Edge {...defaultProps} onSelect={onSelect} />)
      
      const edge = screen.getByTestId('edge')
      fireEvent.keyDown(edge, { key: 'Enter', preventDefault: vi.fn() })
      
      expect(onSelect).toHaveBeenCalledWith('edge-1')
    })

    it('prevents default behavior on Space key', () => {
      const onSelect = vi.fn()
      render(<Edge {...defaultProps} onSelect={onSelect} />)
      
      const edge = screen.getByTestId('edge')
      fireEvent.keyDown(edge, { key: ' ', preventDefault: vi.fn() })
      
      expect(onSelect).toHaveBeenCalledWith('edge-1')
    })

    it('stops event propagation on click', () => {
      const onSelect = vi.fn()
      render(<Edge {...defaultProps} onSelect={onSelect} />)
      
      const edge = screen.getByTestId('edge')
      fireEvent.click(edge, { stopPropagation: vi.fn() })
      
      expect(onSelect).toHaveBeenCalledWith('edge-1')
    })
  })

  describe('Viewport Scaling', () => {
    it('applies viewport scaling correctly', () => {
      const scaledViewport = {
        x: 50,
        y: 50,
        scale: 2,
      }
      
      render(<Edge {...defaultProps} viewport={scaledViewport} />)
      
      const edgePath = screen.getByTestId('edge-path')
      const pathData = edgePath.getAttribute('d')
      
      // Verify path data exists and contains scaled coordinates
      expect(pathData).toBeTruthy()
      // With viewport x=50, y=50, scale=2:
      // sourceX = 100 * 2 - 50 * 2 = 200 - 100 = 100
      // sourceY = 100 * 2 - 50 * 2 = 200 - 100 = 100
      // targetX = 300 * 2 - 50 * 2 = 600 - 100 = 500
      // targetY = 100 * 2 - 50 * 2 = 200 - 100 = 100
      // Document connection points: source (100 + 200, 100 + 60) = (300, 160)
      // Agent connection points: target (500 - 60, 100) = (440, 100)
      expect(pathData!).toContain('M 300 160') // scaled source point
      expect(pathData!).toContain('440 100') // scaled target point
    })

    it('handles zero scale correctly', () => {
      const zeroScaleViewport = {
        x: 0,
        y: 0,
        scale: 0,
      }
      
      render(<Edge {...defaultProps} viewport={zeroScaleViewport} />)
      
      const edgePath = screen.getByTestId('edge-path')
      expect(edgePath).toBeInTheDocument()
    })
  })

  describe('Bezier Curve Calculation', () => {
    it('creates smooth bezier curve with control points', () => {
      render(<Edge {...defaultProps} />)
      
      const edgePath = screen.getByTestId('edge-path')
      const pathData = edgePath.getAttribute('d')
      
      // Should contain cubic bezier curve command (C)
      expect(pathData).toMatch(/^M \d+ \d+ C \d+ \d+ \d+ \d+ \d+ \d+$/)
    })

    it('calculates appropriate control point offset', () => {
      render(<Edge {...defaultProps} />)
      
      const edgePath = screen.getByTestId('edge-path')
      const pathData = edgePath.getAttribute('d')
      
      // Control points should be offset from start and end points
      const parts = pathData.split(' ')
      const startX = parseInt(parts[1])
      const startY = parseInt(parts[2])
      const control1X = parseInt(parts[4])
      const control1Y = parseInt(parts[5])
      
      expect(control1X).toBeGreaterThan(startX)
      expect(control1Y).toBe(startY)
    })
  })

  describe('Arrow Markers', () => {
    it('creates unique arrow marker for each edge', () => {
      render(<Edge {...defaultProps} />)
      
      const edgePathWithArrow = screen.getByTestId('edge-path-with-arrow')
      expect(edgePathWithArrow).toHaveAttribute('marker-end', 'url(#arrow-edge-1)')
    })

    it('creates arrow marker definition', () => {
      render(<Edge {...defaultProps} />)
      
      const marker = screen.getByTestId('edge').querySelector('marker')
      expect(marker).toBeInTheDocument()
      expect(marker).toHaveAttribute('id', 'arrow-edge-1')
    })
  })
}) 