import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AgentNode } from './AgentNode'
import type { CanvasNode } from '../../../schemas/chain'

// Mock the event sourcing hook
vi.mock('../../hooks/useEventSourcing', () => ({
  useEventSourcing: () => ({
    trackEvent: vi.fn(),
    getEvents: vi.fn(() => []),
    replayEvents: vi.fn(),
  }),
}))

describe('AgentNode', () => {
  const mockNode: CanvasNode = {
    id: 'agent-1',
    type: 'agent',
    position: { x: 200, y: 200 },
    data: {
      name: 'Test Agent',
      prompt: 'You are a helpful assistant',
      model: 'gpt-4',
      tools: ['search', 'calculator'],
      agentId: 'agent-1',
    },
    metadata: {
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      status: 'idle',
    },
  }

  const defaultProps = {
    node: mockNode,
    isSelected: false,
    onSelect: vi.fn(),
    onDrag: vi.fn(),
    onDoubleClick: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    viewport: { x: 0, y: 0, scale: 1 },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders agent node with correct name', () => {
      render(<AgentNode {...defaultProps} />)
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })

    it('renders agent icon', () => {
      render(<AgentNode {...defaultProps} />)
      const icon = screen.getByTestId('agent-icon')
      expect(icon).toBeInTheDocument()
    })

    it('displays model information', () => {
      render(<AgentNode {...defaultProps} />)
      expect(screen.getByText('GPT-4')).toBeInTheDocument()
    })

    it('applies correct position based on viewport', () => {
      const props = {
        ...defaultProps,
        viewport: { x: 50, y: 50, scale: 1.5 },
      }
      render(<AgentNode {...props} />)
      const node = screen.getByTestId('agent-node')
      expect(node).toHaveAttribute('transform', 'translate(225, 225) scale(1.5)')
    })

    it('applies selection styling when selected', () => {
      const props = { ...defaultProps, isSelected: true }
      render(<AgentNode {...props} />)
      const node = screen.getByTestId('agent-node')
      expect(node).toHaveClass('selected')
    })

    it('renders with default styling when not selected', () => {
      render(<AgentNode {...defaultProps} />)
      const node = screen.getByTestId('agent-node')
      expect(node).not.toHaveClass('selected')
    })

    it('displays status indicator', () => {
      render(<AgentNode {...defaultProps} />)
      const statusIndicator = screen.getByTestId('status-indicator')
      expect(statusIndicator).toBeInTheDocument()
      expect(statusIndicator).toHaveClass('status-idle')
    })
  })

  describe('Interaction', () => {
    it('calls onSelect when clicked', () => {
      render(<AgentNode {...defaultProps} />)
      const node = screen.getByTestId('agent-node')
      fireEvent.click(node)
      expect(defaultProps.onSelect).toHaveBeenCalledWith('agent-1')
    })

    it('calls onDoubleClick when double-clicked', () => {
      render(<AgentNode {...defaultProps} />)
      const node = screen.getByTestId('agent-node')
      fireEvent.doubleClick(node)
      expect(defaultProps.onDoubleClick).toHaveBeenCalledWith('agent-1')
    })

    it('prevents default on context menu', () => {
      render(<AgentNode {...defaultProps} />)
      const node = screen.getByTestId('agent-node')
      const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true })
      const preventDefaultSpy = vi.spyOn(contextMenuEvent, 'preventDefault')
      fireEvent(node, contextMenuEvent)
      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Drag functionality', () => {
    it('handles drag start correctly', () => {
      render(<AgentNode {...defaultProps} />)
      const node = screen.getByTestId('agent-node')
      fireEvent.mouseDown(node, { clientX: 200, clientY: 200 })
      expect(node).toHaveAttribute('data-dragging', 'true')
    })

    it('handles drag end correctly', () => {
      render(<AgentNode {...defaultProps} />)
      const node = screen.getByTestId('agent-node')
      fireEvent.mouseDown(node, { clientX: 200, clientY: 200 })
      fireEvent.mouseUp(node)
      expect(node).toHaveAttribute('data-dragging', 'false')
    })

    it('calls onDrag with correct coordinates during drag', () => {
      render(<AgentNode {...defaultProps} />)
      const node = screen.getByTestId('agent-node')
      
      fireEvent.mouseDown(node, { clientX: 200, clientY: 200 })
      fireEvent.mouseMove(node, { clientX: 250, clientY: 250 })
      
      expect(defaultProps.onDrag).toHaveBeenCalledWith('agent-1', 250, 250)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<AgentNode {...defaultProps} />)
      const node = screen.getByTestId('agent-node')
      expect(node).toHaveAttribute('role', 'button')
      expect(node).toHaveAttribute('tabIndex', '0')
      expect(node).toHaveAttribute('aria-label', 'Agent: Test Agent (GPT-4)')
    })

    it('handles keyboard navigation', () => {
      render(<AgentNode {...defaultProps} />)
      const node = screen.getByTestId('agent-node')
      
      fireEvent.keyDown(node, { key: 'Enter' })
      expect(defaultProps.onSelect).toHaveBeenCalledWith('agent-1')
      
      fireEvent.keyDown(node, { key: ' ' })
      expect(defaultProps.onSelect).toHaveBeenCalledWith('agent-1')
    })
  })

  describe('Visual styling', () => {
    it('renders with correct dimensions', () => {
      render(<AgentNode {...defaultProps} />)
      const circle = screen.getByTestId('agent-circle')
      expect(circle).toHaveAttribute('r', '60')
    })

    it('renders name text with proper positioning', () => {
      render(<AgentNode {...defaultProps} />)
      const name = screen.getByText('Test Agent')
      expect(name).toHaveAttribute('x', '0')
      expect(name).toHaveAttribute('y', '20')
    })

    it('renders model text with proper positioning', () => {
      render(<AgentNode {...defaultProps} />)
      const model = screen.getByText('GPT-4')
      expect(model).toHaveAttribute('x', '0')
      expect(model).toHaveAttribute('y', '40')
    })

    it('truncates long names', () => {
      const longNameNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          name: 'This is a very long agent name that should be truncated',
        },
      }
      const props = { ...defaultProps, node: longNameNode }
      render(<AgentNode {...props} />)
      const name = screen.getByText('This is a very lo...')
      expect(name).toBeInTheDocument()
    })

    it('displays tools count', () => {
      render(<AgentNode {...defaultProps} />)
      expect(screen.getByText('2 tools')).toBeInTheDocument()
    })
  })

  describe('Status indicators', () => {
    it('displays idle status correctly', () => {
      render(<AgentNode {...defaultProps} />)
      const statusIndicator = screen.getByTestId('status-indicator')
      expect(statusIndicator).toHaveClass('status-idle')
    })

    it('displays running status correctly', () => {
      const runningNode = {
        ...mockNode,
        metadata: {
          ...mockNode.metadata,
          status: 'running',
        },
      }
      const props = { ...defaultProps, node: runningNode }
      render(<AgentNode {...props} />)
      const statusIndicator = screen.getByTestId('status-indicator')
      expect(statusIndicator).toHaveClass('status-running')
    })

    it('displays error status correctly', () => {
      const errorNode = {
        ...mockNode,
        metadata: {
          ...mockNode.metadata,
          status: 'error',
        },
      }
      const props = { ...defaultProps, node: errorNode }
      render(<AgentNode {...props} />)
      const statusIndicator = screen.getByTestId('status-indicator')
      expect(statusIndicator).toHaveClass('status-error')
    })
  })

  describe('Edge cases', () => {
    it('handles missing name gracefully', () => {
      const nodeWithoutName = {
        ...mockNode,
        data: {
          ...mockNode.data,
          name: '',
        },
      }
      const props = { ...defaultProps, node: nodeWithoutName }
      render(<AgentNode {...props} />)
      expect(screen.getByText('Unnamed Agent')).toBeInTheDocument()
    })

    it('handles missing data gracefully', () => {
      const nodeWithoutData = {
        ...mockNode,
        data: {},
      }
      const props = { ...defaultProps, node: nodeWithoutData }
      render(<AgentNode {...props} />)
      expect(screen.getByText('Unnamed Agent')).toBeInTheDocument()
      expect(screen.getByText('Unknown Model')).toBeInTheDocument()
    })

    it('handles missing tools gracefully', () => {
      const nodeWithoutTools = {
        ...mockNode,
        data: {
          ...mockNode.data,
          tools: [],
        },
      }
      const props = { ...defaultProps, node: nodeWithoutTools }
      render(<AgentNode {...props} />)
      expect(screen.getByText('0 tools')).toBeInTheDocument()
    })

    it('handles extreme viewport scales', () => {
      const props = {
        ...defaultProps,
        viewport: { x: 0, y: 0, scale: 0.1 },
      }
      render(<AgentNode {...props} />)
      const node = screen.getByTestId('agent-node')
      expect(node).toHaveAttribute('transform', 'translate(20, 20) scale(0.1)')
    })
  })

  describe('Model display', () => {
    it('formats model names correctly', () => {
      const gpt4Node = {
        ...mockNode,
        data: { ...mockNode.data, model: 'gpt-4' },
      }
      const props = { ...defaultProps, node: gpt4Node }
      render(<AgentNode {...props} />)
      expect(screen.getByText('GPT-4')).toBeInTheDocument()
    })

    it('formats Claude model names correctly', () => {
      const claudeNode = {
        ...mockNode,
        data: { ...mockNode.data, model: 'claude-3-sonnet' },
      }
      const props = { ...defaultProps, node: claudeNode }
      render(<AgentNode {...props} />)
      expect(screen.getByText('Claude 3 Sonnet')).toBeInTheDocument()
    })

    it('handles unknown models gracefully', () => {
      const unknownModelNode = {
        ...mockNode,
        data: { ...mockNode.data, model: 'unknown-model' },
      }
      const props = { ...defaultProps, node: unknownModelNode }
      render(<AgentNode {...props} />)
      expect(screen.getByText('Unknown Model')).toBeInTheDocument()
    })
  })

  describe('Context Menu', () => {
    it('shows context menu on long press', async () => {
      render(<AgentNode {...defaultProps} />)
      const node = screen.getByTestId('agent-node')
      
      // Simulate long press
      fireEvent.mouseDown(node)
      
      // Wait for long press to trigger
      await new Promise(resolve => setTimeout(resolve, 600))
      
      expect(screen.getByTestId('context-menu')).toBeInTheDocument()
    })

    it('calls onEdit when Edit Agent is clicked', async () => {
      render(<AgentNode {...defaultProps} />)
      const node = screen.getByTestId('agent-node')
      
      // Simulate long press
      fireEvent.mouseDown(node)
      await new Promise(resolve => setTimeout(resolve, 600))
      
      const editButton = screen.getByTestId('context-menu-item-edit')
      fireEvent.click(editButton)
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith('agent-1')
    })

    it('calls onDelete when Delete Agent is clicked', async () => {
      render(<AgentNode {...defaultProps} />)
      const node = screen.getByTestId('agent-node')
      
      // Simulate long press
      fireEvent.mouseDown(node)
      await new Promise(resolve => setTimeout(resolve, 600))
      
      const deleteButton = screen.getByTestId('context-menu-item-delete')
      fireEvent.click(deleteButton)
      
      expect(defaultProps.onDelete).toHaveBeenCalledWith('agent-1')
    })

    it('closes context menu when clicking outside', async () => {
      render(<AgentNode {...defaultProps} />)
      const node = screen.getByTestId('agent-node')
      
      // Simulate long press
      fireEvent.mouseDown(node)
      await new Promise(resolve => setTimeout(resolve, 600))
      
      expect(screen.getByTestId('context-menu')).toBeInTheDocument()
      
      // Click outside
      fireEvent.mouseDown(document.body)
      
      expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument()
    })

    it('closes context menu on Escape key', async () => {
      render(<AgentNode {...defaultProps} />)
      const node = screen.getByTestId('agent-node')
      
      // Simulate long press
      fireEvent.mouseDown(node)
      await new Promise(resolve => setTimeout(resolve, 600))
      
      expect(screen.getByTestId('context-menu')).toBeInTheDocument()
      
      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument()
    })
  })
}) 