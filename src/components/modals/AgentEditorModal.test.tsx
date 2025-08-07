import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgentEditorModal from './AgentEditorModal'
import { Agent } from '../../schemas/agent'

// Mock agent data
const mockAgent: Agent = {
  id: 'agent-1',
  name: 'Test Agent',
  prompt: 'You are a test agent.',
  model: 'gpt-4',
  tools: [
    {
      name: 'web_search',
      description: 'Search the web for current information',
      type: 'api',
      config: { endpoint: '/api/tools/web-search' },
    },
  ],
  metadata: {
    temperature: 0.7,
    maxTokens: 4096,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('AgentEditorModal', () => {
  const defaultProps = {
    isOpen: false,
    onClose: vi.fn(),
    onSave: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<AgentEditorModal {...defaultProps} isOpen={false} />)
      
      const modal = screen.queryByTestId('agent-editor-modal')
      expect(modal).not.toBeInTheDocument()
    })

    it('should render modal when isOpen is true', () => {
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const modal = screen.getByTestId('agent-editor-modal')
      expect(modal).toBeInTheDocument()
    })

    it('should show "Create New Agent" title when no agent is provided', () => {
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      expect(screen.getByText('Create New Agent')).toBeInTheDocument()
    })

    it('should show "Edit Agent" title when agent is provided', () => {
      render(<AgentEditorModal {...defaultProps} isOpen={true} agent={mockAgent} />)
      
      expect(screen.getByText('Edit Agent')).toBeInTheDocument()
    })

    it('should render all form fields', () => {
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      expect(screen.getByTestId('agent-name-input')).toBeInTheDocument()
      expect(screen.getByTestId('agent-model-select')).toBeInTheDocument()
      expect(screen.getByTestId('agent-temperature-input')).toBeInTheDocument()
      expect(screen.getByTestId('agent-max-tokens-input')).toBeInTheDocument()
      expect(screen.getByTestId('agent-prompt-textarea')).toBeInTheDocument()
    })

    it('should render tool checkboxes', () => {
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      expect(screen.getByTestId('tool-web_search-checkbox')).toBeInTheDocument()
      expect(screen.getByTestId('tool-file_reader-checkbox')).toBeInTheDocument()
      expect(screen.getByTestId('tool-calculator-checkbox')).toBeInTheDocument()
      expect(screen.getByTestId('tool-code_executor-checkbox')).toBeInTheDocument()
    })

    it('should render action buttons', () => {
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      expect(screen.getByTestId('save-agent-button')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('should update agent name when typing', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const nameInput = screen.getByTestId('agent-name-input')
      await user.type(nameInput, 'New Agent Name')
      
      expect(nameInput).toHaveValue('New Agent Name')
    })

    it('should update model selection', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const modelSelect = screen.getByTestId('agent-model-select')
      await user.selectOptions(modelSelect, 'claude-3-sonnet')
      
      expect(modelSelect).toHaveValue('claude-3-sonnet')
    })

    it('should update temperature when changed', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const temperatureInput = screen.getByTestId('agent-temperature-input')
      await user.clear(temperatureInput)
      await user.type(temperatureInput, '0.5')
      
      expect(temperatureInput).toHaveValue(0.5)
    })

    it('should update max tokens when changed', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const maxTokensInput = screen.getByTestId('agent-max-tokens-input')
      await user.clear(maxTokensInput)
      await user.type(maxTokensInput, '8192')
      
      expect(maxTokensInput).toHaveValue(8192)
    })

    it('should update prompt when typing', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const promptTextarea = screen.getByTestId('agent-prompt-textarea')
      await user.type(promptTextarea, 'You are a helpful assistant.')
      
      expect(promptTextarea).toHaveValue('You are a helpful assistant.')
    })

    it('should toggle tools when checkboxes are clicked', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const webSearchCheckbox = screen.getByTestId('tool-web_search-checkbox')
      await user.click(webSearchCheckbox)
      
      expect(webSearchCheckbox).toBeChecked()
    })
  })

  describe('Form Validation', () => {
    it('should show error when trying to save with empty name', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const saveButton = screen.getByTestId('save-agent-button')
      await user.click(saveButton)
      
      expect(screen.getByTestId('agent-name-error')).toBeInTheDocument()
      expect(screen.getByText('Agent name is required')).toBeInTheDocument()
    })

    it('should show error when trying to save with empty prompt', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      // Fill in name but leave prompt empty
      const nameInput = screen.getByTestId('agent-name-input')
      await user.type(nameInput, 'Test Agent')
      
      const saveButton = screen.getByTestId('save-agent-button')
      await user.click(saveButton)
      
      expect(screen.getByTestId('agent-prompt-error')).toBeInTheDocument()
      expect(screen.getByText('System prompt is required')).toBeInTheDocument()
    })

    it('should show error for invalid temperature', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const temperatureInput = screen.getByTestId('agent-temperature-input')
      await user.clear(temperatureInput)
      await user.type(temperatureInput, '3.0') // Invalid value
      
      const saveButton = screen.getByTestId('save-agent-button')
      await user.click(saveButton)
      
      expect(screen.getByTestId('agent-temperature-error')).toBeInTheDocument()
      expect(screen.getByText('Temperature must be between 0 and 2')).toBeInTheDocument()
    })

    it('should show error for invalid max tokens', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const maxTokensInput = screen.getByTestId('agent-max-tokens-input')
      await user.clear(maxTokensInput)
      await user.type(maxTokensInput, '300000') // Invalid value
      
      const saveButton = screen.getByTestId('save-agent-button')
      await user.click(saveButton)
      
      expect(screen.getByTestId('agent-max-tokens-error')).toBeInTheDocument()
      expect(screen.getByText('Max tokens must be between 1 and 200000')).toBeInTheDocument()
    })

    it('should save successfully when form is valid', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(<AgentEditorModal {...defaultProps} isOpen={true} onSave={onSave} />)
      
      // Fill in all required fields
      const nameInput = screen.getByTestId('agent-name-input')
      await user.type(nameInput, 'Test Agent')
      
      const promptTextarea = screen.getByTestId('agent-prompt-textarea')
      await user.type(promptTextarea, 'You are a helpful assistant.')
      
      const saveButton = screen.getByTestId('save-agent-button')
      await user.click(saveButton)
      
      expect(onSave).toHaveBeenCalledWith({
        name: 'Test Agent',
        prompt: 'You are a helpful assistant.',
        model: 'gpt-4',
        tools: [],
        metadata: {
          temperature: 0.7,
          maxTokens: 8192,
        },
      })
    })
  })

  describe('Templates', () => {
    it('should show templates modal when templates button is clicked', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const templatesButton = screen.getByTestId('show-templates-button')
      await user.click(templatesButton)
      
      expect(screen.getByTestId('templates-modal')).toBeInTheDocument()
      expect(screen.getByText('Agent Templates')).toBeInTheDocument()
    })

    it('should apply template when template is clicked', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      // Open templates modal
      const templatesButton = screen.getByTestId('show-templates-button')
      await user.click(templatesButton)
      
      // Click on Document Analyzer template
      const documentAnalyzerTemplate = screen.getByTestId('template-document-analyzer')
      await user.click(documentAnalyzerTemplate)
      
      // Check that template was applied
      expect(screen.getByTestId('agent-name-input')).toHaveValue('Document Analyzer')
      expect(screen.getByTestId('agent-prompt-textarea')).toHaveValue(
        'You are a document analysis expert. Your role is to analyze documents and extract key insights, summarize content, and identify important patterns or trends.'
      )
      expect(screen.getByTestId('agent-model-select')).toHaveValue('gpt-4')
      
      // Check that tools were selected
      expect(screen.getByTestId('tool-file_reader-checkbox')).toBeChecked()
      expect(screen.getByTestId('tool-web_search-checkbox')).toBeChecked()
    })

    it('should close templates modal when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      // Open templates modal
      const templatesButton = screen.getByTestId('show-templates-button')
      await user.click(templatesButton)
      
      // Close templates modal
      const closeButton = screen.getByText('Close')
      await user.click(closeButton)
      
      expect(screen.queryByTestId('templates-modal')).not.toBeInTheDocument()
    })
  })

  describe('Prompt Library', () => {
    it('should show prompt library modal when library button is clicked', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const libraryButton = screen.getByTestId('show-prompt-library-button')
      await user.click(libraryButton)
      
      expect(screen.getByTestId('prompt-library-modal')).toBeInTheDocument()
      expect(screen.getByText('Prompt Library')).toBeInTheDocument()
    })
  })

  describe('Auto-generate Prompt', () => {
    it('should generate prompt when auto-generate button is clicked', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      // Fill in name and select tools
      const nameInput = screen.getByTestId('agent-name-input')
      await user.type(nameInput, 'Data Processor')
      
      const webSearchCheckbox = screen.getByTestId('tool-web_search-checkbox')
      await user.click(webSearchCheckbox)
      
      // Click auto-generate button
      const autoGenerateButton = screen.getByTestId('auto-generate-prompt-button')
      await user.click(autoGenerateButton)
      
      // Wait for prompt generation to complete
      await waitFor(() => {
        const promptTextarea = screen.getByTestId('agent-prompt-textarea')
        expect(promptTextarea.value).toContain('You are Data Processor, a specialized AI assistant with expertise in web_search')
        expect(promptTextarea.value).toContain('Your capabilities include: Search the web for current information')
      }, { timeout: 3000 })
    })

    it('should show loading state during prompt generation', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const autoGenerateButton = screen.getByTestId('auto-generate-prompt-button')
      await user.click(autoGenerateButton)
      
      expect(screen.getByText('Generating...')).toBeInTheDocument()
    })
  })

  describe('Testing Interface', () => {
    it('should show testing panel elements', () => {
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      expect(screen.getByTestId('open-testing-panel-button')).toBeInTheDocument()
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })

    it('should open testing panel when button is clicked', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      // Fill in agent name
      const nameInput = screen.getByTestId('agent-name-input')
      await user.type(nameInput, 'Test Agent')
      
      // Click open testing panel button
      const openButton = screen.getByTestId('open-testing-panel-button')
      await user.click(openButton)
      
      // Check that testing panel is opened
      expect(screen.getByTestId('agent-testing-panel')).toBeInTheDocument()
    })

    it('should show testing panel info', () => {
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      expect(screen.getByText('Sample inputs available')).toBeInTheDocument()
      expect(screen.getByText('Real-time response testing')).toBeInTheDocument()
      expect(screen.getByText('Performance metrics')).toBeInTheDocument()
    })
  })

  describe('Modal Interactions', () => {
    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<AgentEditorModal {...defaultProps} isOpen={true} onClose={onClose} />)
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)
      
      expect(onClose).toHaveBeenCalled()
    })

    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<AgentEditorModal {...defaultProps} isOpen={true} onClose={onClose} />)
      
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      expect(onClose).toHaveBeenCalled()
    })

    it('should close modal when clicking outside', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<AgentEditorModal {...defaultProps} isOpen={true} onClose={onClose} />)
      
      const overlay = screen.getByTestId('agent-editor-modal-overlay')
      await user.click(overlay)
      
      expect(onClose).toHaveBeenCalled()
    })

    it('should toggle maximize when maximize button is clicked', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const maximizeButton = screen.getByTestId('maximize-agent-modal')
      await user.click(maximizeButton)
      
      // The modal should be maximized (this would be reflected in CSS classes)
      const modal = screen.getByTestId('agent-editor-modal')
      expect(modal).toHaveClass('w-full', 'h-full')
    })
  })

  describe('Agent Data Population', () => {
    it('should populate form with existing agent data', () => {
      render(<AgentEditorModal {...defaultProps} isOpen={true} agent={mockAgent} />)
      
      expect(screen.getByTestId('agent-name-input')).toHaveValue('Test Agent')
      expect(screen.getByTestId('agent-prompt-textarea')).toHaveValue('You are a test agent.')
      expect(screen.getByTestId('agent-model-select')).toHaveValue('gpt-4')
      expect(screen.getByTestId('agent-temperature-input')).toHaveValue(0.7)
      expect(screen.getByTestId('agent-max-tokens-input')).toHaveValue(4096)
      
      // Check that tools are selected
      expect(screen.getByTestId('tool-web_search-checkbox')).toBeChecked()
    })

    it('should call onSave with updated agent data when editing', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(<AgentEditorModal {...defaultProps} isOpen={true} agent={mockAgent} onSave={onSave} />)
      
      // Update the name
      const nameInput = screen.getByTestId('agent-name-input')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Agent Name')
      
      // Save
      const saveButton = screen.getByTestId('save-agent-button')
      await user.click(saveButton)
      
      expect(onSave).toHaveBeenCalledWith({
        name: 'Updated Agent Name',
        prompt: 'You are a test agent.',
        model: 'gpt-4',
        tools: mockAgent.tools,
        metadata: {
          temperature: 0.7,
          maxTokens: 4096,
        },
      })
    })
  })

  describe('Form Validation', () => {
    it('should show validation error for empty name', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const nameInput = screen.getByTestId('agent-name-input')
      await user.clear(nameInput)
      await user.tab() // Trigger blur event
      
      expect(screen.getByTestId('agent-name-error')).toBeInTheDocument()
      expect(screen.getByText('Agent name is required')).toBeInTheDocument()
    })

    it('should show validation error for empty prompt', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const promptTextarea = screen.getByTestId('agent-prompt-textarea')
      await user.clear(promptTextarea)
      await user.tab() // Trigger blur event
      
      expect(screen.getByTestId('agent-prompt-error')).toBeInTheDocument()
      expect(screen.getByText('Prompt is required')).toBeInTheDocument()
    })

    it('should show validation error for invalid temperature', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const temperatureInput = screen.getByTestId('agent-temperature-input')
      await user.clear(temperatureInput)
      await user.type(temperatureInput, '2.5') // Above max
      await user.tab() // Trigger blur event
      
      expect(screen.getByTestId('agent-temperature-error')).toBeInTheDocument()
      expect(screen.getByText('Temperature must be at most 2')).toBeInTheDocument()
    })

    it('should show validation error for invalid maxTokens', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const maxTokensInput = screen.getByTestId('agent-max-tokens-input')
      await user.clear(maxTokensInput)
      await user.type(maxTokensInput, '0') // Below min
      await user.tab() // Trigger blur event
      
      expect(screen.getByTestId('agent-max-tokens-error')).toBeInTheDocument()
      expect(screen.getByText('Max tokens must be at least 1')).toBeInTheDocument()
    })

    it('should disable save button when form is invalid', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      // Clear required fields to make form invalid
      const nameInput = screen.getByTestId('agent-name-input')
      const promptTextarea = screen.getByTestId('agent-prompt-textarea')
      
      await user.clear(nameInput)
      await user.clear(promptTextarea)
      
      const saveButton = screen.getByTestId('save-agent-button')
      expect(saveButton).toBeDisabled()
    })

    it('should enable save button when form is valid', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      // Fill in required fields
      const nameInput = screen.getByTestId('agent-name-input')
      const promptTextarea = screen.getByTestId('agent-prompt-textarea')
      
      await user.clear(nameInput)
      await user.type(nameInput, 'Valid Agent Name')
      await user.clear(promptTextarea)
      await user.type(promptTextarea, 'Valid prompt content')
      
      const saveButton = screen.getByTestId('save-agent-button')
      expect(saveButton).not.toBeDisabled()
    })

    it('should show validation error count in footer', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      // Create multiple validation errors
      const nameInput = screen.getByTestId('agent-name-input')
      const promptTextarea = screen.getByTestId('agent-prompt-textarea')
      
      await user.clear(nameInput)
      await user.clear(promptTextarea)
      await user.tab() // Trigger blur events
      
      expect(screen.getByText('Please fix 2 validation errors')).toBeInTheDocument()
    })

    it('should clear validation errors when fields become valid', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const nameInput = screen.getByTestId('agent-name-input')
      
      // Create error
      await user.clear(nameInput)
      await user.tab()
      expect(screen.getByTestId('agent-name-error')).toBeInTheDocument()
      
      // Fix error
      await user.type(nameInput, 'Valid Name')
      expect(screen.queryByTestId('agent-name-error')).not.toBeInTheDocument()
    })

    it('should validate fields on change', async () => {
      const user = userEvent.setup()
      render(<AgentEditorModal {...defaultProps} isOpen={true} />)
      
      const nameInput = screen.getByTestId('agent-name-input')
      
      // Clear and immediately type to trigger onChange validation
      await user.clear(nameInput)
      await user.type(nameInput, 'Valid Name')
      
      // Should not show error because field is now valid
      expect(screen.queryByTestId('agent-name-error')).not.toBeInTheDocument()
    })
  })
})
