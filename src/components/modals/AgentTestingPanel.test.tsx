import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgentTestingPanel from './AgentTestingPanel'
import { Agent } from '../../schemas/agent'

// Mock the AgentTestingService
vi.mock('../../services/agentTesting', () => ({
  AgentTestingService: {
    getInstance: vi.fn(() => ({
      getSampleInputs: vi.fn(() => [
        {
          id: 'doc-summary',
          name: 'Document Summary Request',
          description: 'Request to summarize a document',
          input: 'Please summarize the key points from this document and identify the main themes.',
          category: 'Document Processing',
          tags: ['summary', 'analysis', 'document']
        },
        {
          id: 'code-review',
          name: 'Code Review Request',
          description: 'Request to review code for issues',
          input: 'Please review this code for potential bugs, security issues, and performance improvements.',
          category: 'Code & Development',
          tags: ['code-review', 'bugs', 'security', 'performance']
        }
      ]),
      getCategories: vi.fn(() => ['Document Processing', 'Code & Development', 'Data Analysis']),
      testAgent: vi.fn()
    }))
  }
}))

describe('AgentTestingPanel', () => {
  const mockAgent: Partial<Agent> = {
    name: 'Test Agent',
    prompt: 'You are a helpful assistant.',
    model: 'gpt-4',
    tools: [
      { name: 'web_search', description: 'Search the web', type: 'api', config: {} },
      { name: 'file_reader', description: 'Read files', type: 'function', config: {} }
    ],
    metadata: {
      temperature: 0.7,
      maxTokens: 4096
    }
  }

  const defaultProps = {
    agent: mockAgent,
    isOpen: true,
    onClose: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render when open', () => {
      render(<AgentTestingPanel {...defaultProps} />)
      
      expect(screen.getByTestId('agent-testing-panel')).toBeInTheDocument()
      expect(screen.getByText('Test Agent: Test Agent')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<AgentTestingPanel {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByTestId('agent-testing-panel')).not.toBeInTheDocument()
    })

    it('should display agent configuration summary', () => {
      render(<AgentTestingPanel {...defaultProps} />)
      
      expect(screen.getByText('Agent Configuration')).toBeInTheDocument()
      expect(screen.getByText(/Model: gpt-4/)).toBeInTheDocument()
      expect(screen.getByText(/Tools: web_search, file_reader/)).toBeInTheDocument()
      expect(screen.getByText(/Temperature: 0.7/)).toBeInTheDocument()
      expect(screen.getByText(/Max Tokens: 4096/)).toBeInTheDocument()
    })

    it('should display test input textarea', () => {
      render(<AgentTestingPanel {...defaultProps} />)
      
      expect(screen.getByTestId('test-input-textarea')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter test input for the agent...')).toBeInTheDocument()
    })

    it('should display test controls', () => {
      render(<AgentTestingPanel {...defaultProps} />)
      
      expect(screen.getByTestId('test-agent-button')).toBeInTheDocument()
      expect(screen.getByTestId('clear-test-button')).toBeInTheDocument()
    })
  })

  describe('Sample Inputs', () => {
    it('should show sample inputs when toggle button is clicked', async () => {
      const user = userEvent.setup()
      render(<AgentTestingPanel {...defaultProps} />)
      
      const toggleButton = screen.getByTestId('toggle-sample-inputs')
      await user.click(toggleButton)
      
      expect(screen.getByText('Document Summary Request')).toBeInTheDocument()
      expect(screen.getByText('Code Review Request')).toBeInTheDocument()
    })

    it('should filter sample inputs by category', async () => {
      const user = userEvent.setup()
      render(<AgentTestingPanel {...defaultProps} />)
      
      // Show sample inputs
      const toggleButton = screen.getByTestId('toggle-sample-inputs')
      await user.click(toggleButton)
      
      // Select category filter
      const categoryFilter = screen.getByTestId('sample-input-category-filter')
      await user.selectOptions(categoryFilter, 'Document Processing')
      
      expect(screen.getByText('Document Summary Request')).toBeInTheDocument()
      expect(screen.queryByText('Code Review Request')).not.toBeInTheDocument()
    })

    it('should select sample input when clicked', async () => {
      const user = userEvent.setup()
      render(<AgentTestingPanel {...defaultProps} />)
      
      // Show sample inputs
      const toggleButton = screen.getByTestId('toggle-sample-inputs')
      await user.click(toggleButton)
      
      // Click on a sample input
      const sampleInput = screen.getByTestId('sample-input-doc-summary')
      await user.click(sampleInput)
      
      // Check that the input was populated
      const textarea = screen.getByTestId('test-input-textarea')
      expect(textarea).toHaveValue('Please summarize the key points from this document and identify the main themes.')
      
      // Check that the sample input info is shown
      expect(screen.getByText(/Using sample: Document Summary Request/)).toBeInTheDocument()
    })
  })

  describe('Agent Testing', () => {
    it('should test agent when test button is clicked', async () => {
      const user = userEvent.setup()
      const mockTestAgent = vi.fn().mockResolvedValue({
        success: true,
        output: 'Test response from agent',
        executionTime: 1500,
        tokensUsed: 250,
        modelUsed: 'gpt-4'
      })

      // Update the mock to return the test function
      const { AgentTestingService } = require('../../services/agentTesting')
      const mockInstance = AgentTestingService.getInstance()
      mockInstance.testAgent = mockTestAgent

      render(<AgentTestingPanel {...defaultProps} />)
      
      // Enter test input
      const textarea = screen.getByTestId('test-input-textarea')
      await user.type(textarea, 'Test input')
      
      // Click test button
      const testButton = screen.getByTestId('test-agent-button')
      await user.click(testButton)
      
      // Wait for test to complete
      await waitFor(() => {
        expect(screen.getByText('Test response from agent')).toBeInTheDocument()
      })
      
      // Check that test results are displayed
      expect(screen.getByText(/Execution Time: 1500ms/)).toBeInTheDocument()
      expect(screen.getByText(/Tokens Used: 250/)).toBeInTheDocument()
      expect(screen.getByText(/Model Used: gpt-4/)).toBeInTheDocument()
      expect(screen.getByText(/Status: Success/)).toBeInTheDocument()
    })

    it('should handle test errors gracefully', async () => {
      const user = userEvent.setup()
      const mockTestAgent = vi.fn().mockResolvedValue({
        success: false,
        error: 'Agent prompt is required'
      })

      // Update the mock to return the test function
      const { AgentTestingService } = require('../../services/agentTesting')
      const mockInstance = AgentTestingService.getInstance()
      mockInstance.testAgent = mockTestAgent

      render(<AgentTestingPanel {...defaultProps} />)
      
      // Enter test input
      const textarea = screen.getByTestId('test-input-textarea')
      await user.type(textarea, 'Test input')
      
      // Click test button
      const testButton = screen.getByTestId('test-agent-button')
      await user.click(testButton)
      
      // Wait for test to complete
      await waitFor(() => {
        expect(screen.getByText('Error: Agent prompt is required')).toBeInTheDocument()
      })
      
      // Check that error status is displayed
      expect(screen.getByText(/Status: Error/)).toBeInTheDocument()
    })

    it('should disable test button when no input is provided', () => {
      render(<AgentTestingPanel {...defaultProps} />)
      
      const testButton = screen.getByTestId('test-agent-button')
      expect(testButton).toBeDisabled()
    })

    it('should show loading state during testing', async () => {
      const user = userEvent.setup()
      let resolveTest: (value: any) => void
      const mockTestAgent = vi.fn().mockImplementation(() => 
        new Promise(resolve => {
          resolveTest = resolve
        })
      )

      // Update the mock to return the test function
      const { AgentTestingService } = require('../../services/agentTesting')
      const mockInstance = AgentTestingService.getInstance()
      mockInstance.testAgent = mockTestAgent

      render(<AgentTestingPanel {...defaultProps} />)
      
      // Enter test input
      const textarea = screen.getByTestId('test-input-textarea')
      await user.type(textarea, 'Test input')
      
      // Click test button
      const testButton = screen.getByTestId('test-agent-button')
      await user.click(testButton)
      
      // Check loading state
      expect(screen.getByText('Testing...')).toBeInTheDocument()
      expect(testButton).toBeDisabled()
      
      // Resolve the test
      resolveTest!({
        success: true,
        output: 'Test response'
      })
      
      // Wait for test to complete
      await waitFor(() => {
        expect(screen.getByText('Test response')).toBeInTheDocument()
      })
    })
  })

  describe('Clear Functionality', () => {
    it('should clear test input and output when clear button is clicked', async () => {
      const user = userEvent.setup()
      render(<AgentTestingPanel {...defaultProps} />)
      
      // Enter test input
      const textarea = screen.getByTestId('test-input-textarea')
      await user.type(textarea, 'Test input')
      
      // Clear the test
      const clearButton = screen.getByTestId('clear-test-button')
      await user.click(clearButton)
      
      // Check that input is cleared
      expect(textarea).toHaveValue('')
    })
  })

  describe('Modal Interactions', () => {
    it('should close when overlay is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<AgentTestingPanel {...defaultProps} onClose={onClose} />)
      
      const overlay = screen.getByTestId('agent-testing-panel-overlay')
      await user.click(overlay)
      
      expect(onClose).toHaveBeenCalled()
    })

    it('should close when close button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<AgentTestingPanel {...defaultProps} onClose={onClose} />)
      
      const closeButton = screen.getByTestId('close-testing-panel')
      await user.click(closeButton)
      
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Agent Configuration Display', () => {
    it('should display agent name in header', () => {
      render(<AgentTestingPanel {...defaultProps} />)
      
      expect(screen.getByText('Test Agent: Test Agent')).toBeInTheDocument()
    })

    it('should handle unnamed agent', () => {
      const unnamedAgent = { ...mockAgent, name: undefined }
      render(<AgentTestingPanel {...defaultProps} agent={unnamedAgent} />)
      
      expect(screen.getByText('Test Agent: Unnamed Agent')).toBeInTheDocument()
    })

    it('should handle missing agent configuration', () => {
      const minimalAgent = { name: 'Minimal Agent' }
      render(<AgentTestingPanel {...defaultProps} agent={minimalAgent} />)
      
      expect(screen.getByText(/Model: Not set/)).toBeInTheDocument()
      expect(screen.getByText(/Tools: None/)).toBeInTheDocument()
      expect(screen.getByText(/Temperature: Not set/)).toBeInTheDocument()
      expect(screen.getByText(/Max Tokens: Not set/)).toBeInTheDocument()
    })
  })
})
