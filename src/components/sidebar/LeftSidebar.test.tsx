import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LeftSidebar } from './LeftSidebar'

const mockChains = [
  { id: 'chain-1', name: 'Document Processing Chain', description: 'Process documents with AI agents' },
  { id: 'chain-2', name: 'Data Analysis Chain', description: 'Analyze data with machine learning' },
]

const mockDocuments = [
  { id: 'doc-1', title: 'Research Paper', content: 'This is a research paper about AI...' },
  { id: 'doc-2', title: 'Business Report', content: 'Quarterly business report for Q1...' },
]

const mockAgents = [
  { id: 'agent-1', name: 'Text Analyzer', model: 'GPT-4' },
  { id: 'agent-2', name: 'Data Processor', model: 'Claude-3' },
]

describe('LeftSidebar', () => {
  const defaultProps = {
    chains: mockChains,
    documents: mockDocuments,
    agents: mockAgents,
    onChainSelect: vi.fn(),
    onDocumentSelect: vi.fn(),
    onAgentSelect: vi.fn(),
    onDragStart: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders sidebar with correct width and structure', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      const sidebar = screen.getByTestId('left-sidebar')
      expect(sidebar).toBeInTheDocument()
      expect(sidebar).toHaveClass('w-80')
    })

    it('renders header with title and collapse button', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      expect(screen.getByText('Object Library')).toBeInTheDocument()
      expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument()
    })

    it('renders section tabs with correct counts', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      expect(screen.getByText('Chains (2)')).toBeInTheDocument()
      expect(screen.getByText('Documents (2)')).toBeInTheDocument()
      expect(screen.getByText('Agents (2)')).toBeInTheDocument()
    })

    it('shows chains section by default', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      expect(screen.getByText('Document Processing Chain')).toBeInTheDocument()
      expect(screen.getByText('Data Analysis Chain')).toBeInTheDocument()
    })
  })

  describe('Section Navigation', () => {
    it('switches to documents section when clicked', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      fireEvent.click(screen.getByText('Documents (2)'))
      
      expect(screen.getByText('Research Paper')).toBeInTheDocument()
      expect(screen.getByText('Business Report')).toBeInTheDocument()
      expect(screen.queryByText('Document Processing Chain')).not.toBeInTheDocument()
    })

    it('switches to agents section when clicked', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      fireEvent.click(screen.getByText('Agents (2)'))
      
      expect(screen.getByText('Text Analyzer')).toBeInTheDocument()
      expect(screen.getByText('Data Processor')).toBeInTheDocument()
      expect(screen.queryByText('Document Processing Chain')).not.toBeInTheDocument()
    })

    it('switches back to chains section when clicked', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      // Switch to documents first
      fireEvent.click(screen.getByText('Documents (2)'))
      expect(screen.getByText('Research Paper')).toBeInTheDocument()
      
      // Switch back to chains
      fireEvent.click(screen.getByText('Chains (2)'))
      expect(screen.getByText('Document Processing Chain')).toBeInTheDocument()
      expect(screen.queryByText('Research Paper')).not.toBeInTheDocument()
    })
  })

  describe('Collapse/Expand Functionality', () => {
    it('collapses sidebar when collapse button is clicked', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      fireEvent.click(screen.getByLabelText('Collapse sidebar'))
      
      expect(screen.getByTestId('left-sidebar-collapsed')).toBeInTheDocument()
      expect(screen.queryByTestId('left-sidebar')).not.toBeInTheDocument()
    })

    it('expands sidebar when expand button is clicked', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      // Collapse first
      fireEvent.click(screen.getByLabelText('Collapse sidebar'))
      expect(screen.getByTestId('left-sidebar-collapsed')).toBeInTheDocument()
      
      // Expand
      fireEvent.click(screen.getByLabelText('Expand sidebar'))
      expect(screen.getByTestId('left-sidebar')).toBeInTheDocument()
      expect(screen.queryByTestId('left-sidebar-collapsed')).not.toBeInTheDocument()
    })
  })

  describe('Item Selection', () => {
    it('calls onChainSelect when chain item is clicked', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('chain-item-chain-1'))
      
      expect(defaultProps.onChainSelect).toHaveBeenCalledWith('chain-1')
    })

    it('calls onDocumentSelect when document item is clicked', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      fireEvent.click(screen.getByText('Documents (2)'))
      fireEvent.click(screen.getByTestId('document-item-doc-1'))
      
      expect(defaultProps.onDocumentSelect).toHaveBeenCalledWith('doc-1')
    })

    it('calls onAgentSelect when agent item is clicked', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      fireEvent.click(screen.getByText('Agents (2)'))
      fireEvent.click(screen.getByTestId('agent-item-agent-1'))
      
      expect(defaultProps.onAgentSelect).toHaveBeenCalledWith('agent-1')
    })
  })

  describe('Drag and Drop', () => {
    it('sets up drag data for chain items', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      const chainItem = screen.getByTestId('chain-item-chain-1')
      const dragEvent = {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: '',
        },
      } as any
      
      fireEvent.dragStart(chainItem, dragEvent)
      
      expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith(
        'application/json',
        JSON.stringify({ type: 'chain', id: 'chain-1', data: mockChains[0] })
      )
      expect(dragEvent.dataTransfer.effectAllowed).toBe('copy')
    })

    it('sets up drag data for document items', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      fireEvent.click(screen.getByText('Documents (2)'))
      const documentItem = screen.getByTestId('document-item-doc-1')
      const dragEvent = {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: '',
        },
      } as any
      
      fireEvent.dragStart(documentItem, dragEvent)
      
      expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith(
        'application/json',
        JSON.stringify({ type: 'document', id: 'doc-1', data: mockDocuments[0] })
      )
    })

    it('sets up drag data for agent items', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      fireEvent.click(screen.getByText('Agents (2)'))
      const agentItem = screen.getByTestId('agent-item-agent-1')
      const dragEvent = {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: '',
        },
      } as any
      
      fireEvent.dragStart(agentItem, dragEvent)
      
      expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith(
        'application/json',
        JSON.stringify({ type: 'agent', id: 'agent-1', data: mockAgents[0] })
      )
    })

    it('calls onDragStart callback when drag starts', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      const chainItem = screen.getByTestId('chain-item-chain-1')
      const dragEvent = {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: '',
        },
      } as any
      
      fireEvent.dragStart(chainItem, dragEvent)
      
      expect(defaultProps.onDragStart).toHaveBeenCalledWith({
        type: 'chain',
        id: 'chain-1',
        data: mockChains[0],
      })
    })
  })

  describe('Content Display', () => {
    it('displays chain descriptions when available', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      expect(screen.getByText('Process documents with AI agents')).toBeInTheDocument()
      expect(screen.getByText('Analyze data with machine learning')).toBeInTheDocument()
    })

    it('displays document content preview when available', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      fireEvent.click(screen.getByText('Documents (2)'))
      
      expect(screen.getByText(/This is a research paper about AI\.\.\./)).toBeInTheDocument()
      expect(screen.getByText(/Quarterly business report for Q1\.\.\./)).toBeInTheDocument()
    })

    it('displays agent models when available', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      fireEvent.click(screen.getByText('Agents (2)'))
      
      expect(screen.getByText('GPT-4')).toBeInTheDocument()
      expect(screen.getByText('Claude-3')).toBeInTheDocument()
    })

    it('handles items without optional fields', () => {
      const chainsWithoutDescription = [
        { id: 'chain-3', name: 'Simple Chain' },
      ]
      
      render(<LeftSidebar {...defaultProps} chains={chainsWithoutDescription} />)
      
      expect(screen.getByText('Simple Chain')).toBeInTheDocument()
      // Should not crash when description is missing
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for buttons', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument()
    })

    it('has proper ARIA labels for collapsed state', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      fireEvent.click(screen.getByLabelText('Collapse sidebar'))
      
      expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument()
    })

    it('has proper test IDs for all interactive elements', () => {
      render(<LeftSidebar {...defaultProps} />)
      
      expect(screen.getByTestId('left-sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('chain-item-chain-1')).toBeInTheDocument()
      expect(screen.getByTestId('chain-item-chain-2')).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('handles empty chains list', () => {
      render(<LeftSidebar {...defaultProps} chains={[]} />)
      
      expect(screen.getByText('Chains (0)')).toBeInTheDocument()
      // Should not crash when no chains are available
    })

    it('handles empty documents list', () => {
      render(<LeftSidebar {...defaultProps} documents={[]} />)
      
      fireEvent.click(screen.getByText('Documents (0)'))
      expect(screen.getByText('Documents (0)')).toBeInTheDocument()
      // Should not crash when no documents are available
    })

    it('handles empty agents list', () => {
      render(<LeftSidebar {...defaultProps} agents={[]} />)
      
      fireEvent.click(screen.getByText('Agents (0)'))
      expect(screen.getByText('Agents (0)')).toBeInTheDocument()
      // Should not crash when no agents are available
    })
  })
}) 