import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { NodeRenderer } from './NodeRenderer'
import type { CanvasNode } from '../../../schemas/chain'

// Mock the node components
vi.mock('./DocumentNode', () => ({
  DocumentNode: ({ node }: { node: CanvasNode }) => (
    <div data-testid="document-node">Document: {node.data?.title}</div>
  ),
}))

vi.mock('./AgentNode', () => ({
  AgentNode: ({ node }: { node: CanvasNode }) => (
    <div data-testid="agent-node">Agent: {node.data?.name}</div>
  ),
}))

describe('NodeRenderer', () => {
  const mockDocumentNode: CanvasNode = {
    id: 'doc-1',
    type: 'document',
    position: { x: 100, y: 100 },
    data: { title: 'Test Document' },
  }

  const mockAgentNode: CanvasNode = {
    id: 'agent-1',
    type: 'agent',
    position: { x: 200, y: 200 },
    data: { name: 'Test Agent' },
  }

  const defaultProps = {
    isSelected: false,
    onSelect: vi.fn(),
    onDrag: vi.fn(),
    onDoubleClick: vi.fn(),
    viewport: { x: 0, y: 0, scale: 1 },
  }

  it('renders DocumentNode for document type', () => {
    const props = { ...defaultProps, node: mockDocumentNode }
    const { getByTestId } = render(<NodeRenderer {...props} />)
    expect(getByTestId('document-node')).toBeInTheDocument()
  })

  it('renders AgentNode for agent type', () => {
    const props = { ...defaultProps, node: mockAgentNode }
    const { getByTestId } = render(<NodeRenderer {...props} />)
    expect(getByTestId('agent-node')).toBeInTheDocument()
  })

  it('returns null for unknown node type', () => {
    const unknownNode = { ...mockDocumentNode, type: 'unknown' as any }
    const props = { ...defaultProps, node: unknownNode }
    const { container } = render(<NodeRenderer {...props} />)
    expect(container.firstChild).toBeNull()
  })
}) 