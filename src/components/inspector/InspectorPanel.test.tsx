import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InspectorPanel } from './InspectorPanel'
import type { CanvasNode } from '../../../schemas/chain'

// Mock sample node
const mockAgentNode: CanvasNode = {
  id: 'agent-1',
  type: 'agent',
  position: { x: 100, y: 100 },
  data: {
    name: 'Test Agent',
    prompt: 'You are a test agent',
    model: 'gpt-4',
    tools: [],
  },
}

const mockDocumentNode: CanvasNode = {
  id: 'document-1',
  type: 'document',
  position: { x: 200, y: 200 },
  data: {
    title: 'Test Document',
    content: 'This is test content',
  },
}

const mockChainNode: CanvasNode = {
  id: 'chain-1',
  type: 'chain',
  position: { x: 300, y: 300 },
  data: {
    name: 'Test Chain',
    description: 'A test chain',
    nodes: [],
    edges: [],
  },
}

describe('InspectorPanel', () => {
  const mockOnClose = vi.fn()
  const mockOnUpdateNode = vi.fn()

  it('renders nothing when not open', () => {
    render(
      <InspectorPanel
        selectedNode={mockAgentNode}
        isOpen={false}
        onClose={mockOnClose}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    expect(screen.queryByText('Inspector')).not.toBeInTheDocument()
  })

  it('renders nothing when no node selected', () => {
    render(
      <InspectorPanel
        selectedNode={null}
        isOpen={true}
        onClose={mockOnClose}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    expect(screen.queryByText('Inspector')).not.toBeInTheDocument()
  })

  it('renders inspector panel when open with agent node', () => {
    render(
      <InspectorPanel
        selectedNode={mockAgentNode}
        isOpen={true}
        onClose={mockOnClose}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    expect(screen.getByText('Inspector')).toBeInTheDocument()
    expect(screen.getByText('Agent Name')).toBeInTheDocument()
    expect(screen.getByText('AI Model')).toBeInTheDocument()
    expect(screen.getByText('System Prompt')).toBeInTheDocument()
    expect(screen.getByText('Available Tools')).toBeInTheDocument()
  })

  it('renders inspector panel when open with document node', () => {
    render(
      <InspectorPanel
        selectedNode={mockDocumentNode}
        isOpen={true}
        onClose={mockOnClose}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    expect(screen.getByText('Inspector')).toBeInTheDocument()
    expect(screen.getByText('Document Title')).toBeInTheDocument()
    expect(screen.getByText('Content Preview')).toBeInTheDocument()
    expect(screen.getByText('Metadata')).toBeInTheDocument()
  })

  it('renders inspector panel when open with chain node', () => {
    render(
      <InspectorPanel
        selectedNode={mockChainNode}
        isOpen={true}
        onClose={mockOnClose}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    expect(screen.getByText('Inspector')).toBeInTheDocument()
    expect(screen.getByText('Chain Name')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Chain Statistics')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(
      <InspectorPanel
        selectedNode={mockAgentNode}
        isOpen={true}
        onClose={mockOnClose}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    const closeButton = screen.getByLabelText('Close inspector')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('has correct styling classes', () => {
    render(
      <InspectorPanel
        selectedNode={mockAgentNode}
        isOpen={true}
        onClose={mockOnClose}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    const panel = screen.getByText('Inspector').closest('div')?.parentElement
    expect(panel).toHaveClass('fixed', 'right-0', 'top-0', 'h-full', 'w-80')
  })
}) 