import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AgentInspector } from './AgentInspector'
import type { CanvasNode } from '../../../schemas/chain'

const mockAgentNode: CanvasNode = {
  id: 'agent-1',
  type: 'agent',
  position: { x: 100, y: 100 },
  data: {
    name: 'Test Agent',
    prompt: 'You are a test agent',
    model: 'gpt-4',
    tools: [
      {
        name: 'web_search',
        description: 'Search the web for current information',
        type: 'api',
        config: { endpoint: '/api/tools/web-search' },
      },
    ],
  },
}

describe('AgentInspector', () => {
  const mockOnUpdateNode = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders agent inspector with all fields', () => {
    render(
      <AgentInspector
        node={mockAgentNode}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    expect(screen.getByText('Agent Name')).toBeInTheDocument()
    expect(screen.getByText('AI Model')).toBeInTheDocument()
    expect(screen.getByText('System Prompt')).toBeInTheDocument()
    expect(screen.getByText('Available Tools')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('displays current agent data', () => {
    render(
      <AgentInspector
        node={mockAgentNode}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    expect(screen.getByDisplayValue('Test Agent')).toBeInTheDocument()
    expect(screen.getByDisplayValue('You are a test agent')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('gpt-4')
  })

  it('calls onUpdateNode when name is changed', () => {
    render(
      <AgentInspector
        node={mockAgentNode}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    const nameInput = screen.getByDisplayValue('Test Agent')
    fireEvent.change(nameInput, { target: { value: 'Updated Agent' } })

    expect(mockOnUpdateNode).toHaveBeenCalledWith('agent-1', {
      data: {
        ...mockAgentNode.data,
        name: 'Updated Agent',
      },
    })
  })

  it('calls onUpdateNode when prompt is changed', () => {
    render(
      <AgentInspector
        node={mockAgentNode}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    const promptInput = screen.getByDisplayValue('You are a test agent')
    fireEvent.change(promptInput, { target: { value: 'Updated prompt' } })

    expect(mockOnUpdateNode).toHaveBeenCalledWith('agent-1', {
      data: {
        ...mockAgentNode.data,
        prompt: 'Updated prompt',
      },
    })
  })

  it('calls onUpdateNode when model is changed', () => {
    render(
      <AgentInspector
        node={mockAgentNode}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    const modelSelect = screen.getByRole('combobox')
    fireEvent.change(modelSelect, { target: { value: 'claude-3-sonnet' } })

    expect(mockOnUpdateNode).toHaveBeenCalledWith('agent-1', {
      data: {
        ...mockAgentNode.data,
        model: 'claude-3-sonnet',
      },
    })
  })

  it('displays available tools with checkboxes', () => {
    render(
      <AgentInspector
        node={mockAgentNode}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    expect(screen.getByText('web_search')).toBeInTheDocument()
    expect(screen.getByText('file_reader')).toBeInTheDocument()
    expect(screen.getByText('calculator')).toBeInTheDocument()
    expect(screen.getByText('code_executor')).toBeInTheDocument()
  })

  it('shows enabled tools as checked', () => {
    render(
      <AgentInspector
        node={mockAgentNode}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    const webSearchCheckbox = screen.getByLabelText(/web_search/)
    expect(webSearchCheckbox).toBeChecked()
  })

  it('shows disabled tools as unchecked', () => {
    render(
      <AgentInspector
        node={mockAgentNode}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    const fileReaderCheckbox = screen.getByLabelText(/file_reader/)
    expect(fileReaderCheckbox).not.toBeChecked()
  })

  it('calls onUpdateNode when tool is toggled', () => {
    render(
      <AgentInspector
        node={mockAgentNode}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    const fileReaderCheckbox = screen.getByLabelText(/file_reader/)
    fireEvent.click(fileReaderCheckbox)

    expect(mockOnUpdateNode).toHaveBeenCalledWith('agent-1', {
      data: {
        ...mockAgentNode.data,
        tools: [
          ...mockAgentNode.data!.tools!,
          {
            name: 'file_reader',
            description: 'Read and analyze files',
            type: 'function',
            config: { allowedExtensions: ['.txt', '.md', '.pdf'] },
          },
        ],
      },
    })
  })

  it('renders action buttons', () => {
    render(
      <AgentInspector
        node={mockAgentNode}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    expect(screen.getByText('Test Agent')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('renders auto-generate prompt button', () => {
    render(
      <AgentInspector
        node={mockAgentNode}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    expect(screen.getByText('Auto-generate')).toBeInTheDocument()
  })

  it('shows status indicator', () => {
    render(
      <AgentInspector
        node={mockAgentNode}
        onUpdateNode={mockOnUpdateNode}
      />
    )

    expect(screen.getByText('Ready')).toBeInTheDocument()
  })
}) 