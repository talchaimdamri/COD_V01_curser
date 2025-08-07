import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ToolsConfigurationPanel from './ToolsConfigurationPanel'
import { AgentTool } from '../../schemas/agent'

describe('ToolsConfigurationPanel', () => {
  const mockSelectedTools: AgentTool[] = [
    {
      name: 'web_search',
      description: 'Search the web for current information',
      type: 'api',
      config: { endpoint: '/api/tools/web-search', timeout: 30000 },
    },
  ]

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    selectedTools: mockSelectedTools,
    onToolsChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render when open', () => {
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      expect(screen.getByTestId('tools-configuration-panel')).toBeInTheDocument()
      expect(screen.getByText('Tools Configuration')).toBeInTheDocument()
      expect(screen.getByText('Configure and manage tools for your agent')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<ToolsConfigurationPanel {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByTestId('tools-configuration-panel')).not.toBeInTheDocument()
    })

    it('should display selected tools count', () => {
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      expect(screen.getByText('Selected Tools (1)')).toBeInTheDocument()
    })

    it('should display selected tools as tags', () => {
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      expect(screen.getByText('web_search')).toBeInTheDocument()
      expect(screen.getByTestId('remove-tool-web_search')).toBeInTheDocument()
    })

    it('should show "No tools selected" when no tools are selected', () => {
      render(<ToolsConfigurationPanel {...defaultProps} selectedTools={[]} />)
      
      expect(screen.getByText('Selected Tools (0)')).toBeInTheDocument()
      expect(screen.getByText('No tools selected')).toBeInTheDocument()
    })
  })

  describe('Category Navigation', () => {
    it('should display all tool categories', () => {
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      expect(screen.getByTestId('category-web')).toBeInTheDocument()
      expect(screen.getByTestId('category-file')).toBeInTheDocument()
      expect(screen.getByTestId('category-code')).toBeInTheDocument()
      expect(screen.getByTestId('category-data')).toBeInTheDocument()
      expect(screen.getByTestId('category-communication')).toBeInTheDocument()
      expect(screen.getByTestId('category-custom')).toBeInTheDocument()
    })

    it('should highlight active category', () => {
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      const webCategory = screen.getByTestId('category-web')
      expect(webCategory).toHaveClass('bg-blue-100', 'text-blue-700')
    })

    it('should switch categories when clicked', async () => {
      const user = userEvent.setup()
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      const fileCategory = screen.getByTestId('category-file')
      await user.click(fileCategory)
      
      expect(fileCategory).toHaveClass('bg-blue-100', 'text-blue-700')
    })

    it('should display category names and descriptions', () => {
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      expect(screen.getByText('Web & Search')).toBeInTheDocument()
      expect(screen.getByText('Tools for web search and information retrieval')).toBeInTheDocument()
      expect(screen.getByText('File Operations')).toBeInTheDocument()
      expect(screen.getByText('Tools for reading, writing, and analyzing files')).toBeInTheDocument()
    })
  })

  describe('Tool Search', () => {
    it('should filter tools by search query', async () => {
      const user = userEvent.setup()
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      const searchInput = screen.getByTestId('tools-search')
      await user.type(searchInput, 'web')
      
      expect(screen.getByText('web_search')).toBeInTheDocument()
      expect(screen.queryByText('calculator')).not.toBeInTheDocument()
    })

    it('should filter tools by description', async () => {
      const user = userEvent.setup()
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      const searchInput = screen.getByTestId('tools-search')
      await user.type(searchInput, 'mathematical')
      
      expect(screen.getByText('calculator')).toBeInTheDocument()
    })

    it('should show no results message when no tools match', async () => {
      const user = userEvent.setup()
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      const searchInput = screen.getByTestId('tools-search')
      await user.type(searchInput, 'nonexistent')
      
      expect(screen.getByText('No tools found in this category.')).toBeInTheDocument()
    })
  })

  describe('Tool Selection', () => {
    it('should display tool checkboxes', () => {
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      expect(screen.getByTestId('select-tool-web_search')).toBeInTheDocument()
      expect(screen.getByTestId('select-tool-calculator')).toBeInTheDocument()
      expect(screen.getByTestId('select-tool-code_executor')).toBeInTheDocument()
    })

    it('should show selected tools as checked', () => {
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      const webSearchCheckbox = screen.getByTestId('select-tool-web_search') as HTMLInputElement
      expect(webSearchCheckbox.checked).toBe(true)
    })

    it('should show unselected tools as unchecked', () => {
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      const calculatorCheckbox = screen.getByTestId('select-tool-calculator') as HTMLInputElement
      expect(calculatorCheckbox.checked).toBe(false)
    })

    it('should call onToolsChange when tool is selected', async () => {
      const user = userEvent.setup()
      const onToolsChange = vi.fn()
      render(<ToolsConfigurationPanel {...defaultProps} onToolsChange={onToolsChange} />)
      
      const calculatorCheckbox = screen.getByTestId('select-tool-calculator')
      await user.click(calculatorCheckbox)
      
      expect(onToolsChange).toHaveBeenCalledWith([
        ...mockSelectedTools,
        {
          name: 'calculator',
          description: 'Perform mathematical calculations',
          type: 'function',
          config: { precision: 10, timeout: 5000 },
        },
      ])
    })

    it('should call onToolsChange when tool is deselected', async () => {
      const user = userEvent.setup()
      const onToolsChange = vi.fn()
      render(<ToolsConfigurationPanel {...defaultProps} onToolsChange={onToolsChange} />)
      
      const webSearchCheckbox = screen.getByTestId('select-tool-web_search')
      await user.click(webSearchCheckbox)
      
      expect(onToolsChange).toHaveBeenCalledWith([])
    })
  })

  describe('Tool Configuration', () => {
    it('should display configure button for each tool', () => {
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      expect(screen.getByTestId('configure-tool-web_search')).toBeInTheDocument()
      expect(screen.getByTestId('configure-tool-calculator')).toBeInTheDocument()
    })

    it('should open tool configuration modal when configure button is clicked', async () => {
      const user = userEvent.setup()
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      const configureButton = screen.getByTestId('configure-tool-calculator')
      await user.click(configureButton)
      
      expect(screen.getByText('Configure calculator')).toBeInTheDocument()
    })

    it('should display tool configuration fields', async () => {
      const user = userEvent.setup()
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      const configureButton = screen.getByTestId('configure-tool-calculator')
      await user.click(configureButton)
      
      expect(screen.getByText('Precision')).toBeInTheDocument()
      expect(screen.getByText('Timeout')).toBeInTheDocument()
      expect(screen.getByTestId('config-precision')).toBeInTheDocument()
      expect(screen.getByTestId('config-timeout')).toBeInTheDocument()
    })

    it('should update tool configuration when values change', async () => {
      const user = userEvent.setup()
      const onToolsChange = vi.fn()
      render(<ToolsConfigurationPanel {...defaultProps} onToolsChange={onToolsChange} />)
      
      const configureButton = screen.getByTestId('configure-tool-calculator')
      await user.click(configureButton)
      
      const precisionInput = screen.getByTestId('config-precision')
      await user.clear(precisionInput)
      await user.type(precisionInput, '15')
      
      expect(onToolsChange).toHaveBeenCalledWith([
        {
          ...mockSelectedTools[0],
        },
        {
          name: 'calculator',
          description: 'Perform mathematical calculations',
          type: 'function',
          config: { precision: 15, timeout: 5000 },
        },
      ])
    })

    it('should close tool configuration modal when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      const configureButton = screen.getByTestId('configure-tool-calculator')
      await user.click(configureButton)
      
      const closeButton = screen.getByTestId('close-tool-config')
      await user.click(closeButton)
      
      expect(screen.queryByText('Configure calculator')).not.toBeInTheDocument()
    })
  })

  describe('Custom Tool Creation', () => {
    it('should display add custom tool button', () => {
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      expect(screen.getByTestId('add-custom-tool')).toBeInTheDocument()
      expect(screen.getByText('+ Add Custom Tool')).toBeInTheDocument()
    })

    it('should open custom tool form when add button is clicked', async () => {
      const user = userEvent.setup()
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      const addButton = screen.getByTestId('add-custom-tool')
      await user.click(addButton)
      
      expect(screen.getByText('Add Custom Tool')).toBeInTheDocument()
      expect(screen.getByTestId('custom-tool-name')).toBeInTheDocument()
      expect(screen.getByTestId('custom-tool-description')).toBeInTheDocument()
      expect(screen.getByTestId('custom-tool-type')).toBeInTheDocument()
    })

    it('should create custom tool when form is submitted', async () => {
      const user = userEvent.setup()
      const onToolsChange = vi.fn()
      render(<ToolsConfigurationPanel {...defaultProps} onToolsChange={onToolsChange} />)
      
      const addButton = screen.getByTestId('add-custom-tool')
      await user.click(addButton)
      
      const nameInput = screen.getByTestId('custom-tool-name')
      const descriptionInput = screen.getByTestId('custom-tool-description')
      const typeSelect = screen.getByTestId('custom-tool-type')
      
      await user.type(nameInput, 'my_custom_tool')
      await user.type(descriptionInput, 'A custom tool for testing')
      await user.selectOptions(typeSelect, 'function')
      
      const saveButton = screen.getByTestId('save-custom-tool')
      await user.click(saveButton)
      
      expect(onToolsChange).toHaveBeenCalledWith([
        ...mockSelectedTools,
        {
          name: 'my_custom_tool',
          description: 'A custom tool for testing',
          type: 'function',
          config: {},
        },
      ])
    })

    it('should close custom tool form when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      const addButton = screen.getByTestId('add-custom-tool')
      await user.click(addButton)
      
      const cancelButton = screen.getByTestId('cancel-custom-tool')
      await user.click(cancelButton)
      
      expect(screen.queryByText('Add Custom Tool')).not.toBeInTheDocument()
    })

    it('should validate required fields in custom tool form', async () => {
      const user = userEvent.setup()
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      const addButton = screen.getByTestId('add-custom-tool')
      await user.click(addButton)
      
      const saveButton = screen.getByTestId('save-custom-tool')
      await user.click(saveButton)
      
      // Form should not submit without required fields
      expect(screen.getByText('Add Custom Tool')).toBeInTheDocument()
    })
  })

  describe('Tool Removal', () => {
    it('should remove tool when remove button is clicked', async () => {
      const user = userEvent.setup()
      const onToolsChange = vi.fn()
      render(<ToolsConfigurationPanel {...defaultProps} onToolsChange={onToolsChange} />)
      
      const removeButton = screen.getByTestId('remove-tool-web_search')
      await user.click(removeButton)
      
      expect(onToolsChange).toHaveBeenCalledWith([])
    })
  })

  describe('Modal Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<ToolsConfigurationPanel {...defaultProps} onClose={onClose} />)
      
      const closeButton = screen.getByTestId('close-tools-panel')
      await user.click(closeButton)
      
      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when overlay is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<ToolsConfigurationPanel {...defaultProps} onClose={onClose} />)
      
      const overlay = screen.getByTestId('tools-configuration-panel-overlay')
      await user.click(overlay)
      
      expect(onClose).toHaveBeenCalled()
    })

    it('should not call onClose when modal content is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<ToolsConfigurationPanel {...defaultProps} onClose={onClose} />)
      
      const modal = screen.getByTestId('tools-configuration-panel')
      await user.click(modal)
      
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Tool Display', () => {
    it('should display tool names and descriptions', () => {
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      expect(screen.getByText('web_search')).toBeInTheDocument()
      expect(screen.getByText('Search the web for current information')).toBeInTheDocument()
      expect(screen.getByText('calculator')).toBeInTheDocument()
      expect(screen.getByText('Perform mathematical calculations')).toBeInTheDocument()
    })

    it('should display tool types with appropriate styling', () => {
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      const apiTool = screen.getByText('api')
      const functionTool = screen.getByText('function')
      
      expect(apiTool).toHaveClass('bg-green-100', 'text-green-800')
      expect(functionTool).toHaveClass('bg-blue-100', 'text-blue-800')
    })

    it('should display tool configuration icons', () => {
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      const configureButtons = screen.getAllByTitle('Configure tool')
      expect(configureButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Category Filtering', () => {
    it('should filter tools by category', async () => {
      const user = userEvent.setup()
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      // Initially should show web tools
      expect(screen.getByText('web_search')).toBeInTheDocument()
      
      // Switch to data category
      const dataCategory = screen.getByTestId('category-data')
      await user.click(dataCategory)
      
      // Should show data tools
      expect(screen.getByText('calculator')).toBeInTheDocument()
      expect(screen.getByText('data_analyzer')).toBeInTheDocument()
      
      // Should not show web tools
      expect(screen.queryByText('web_search')).not.toBeInTheDocument()
    })

    it('should combine category and search filtering', async () => {
      const user = userEvent.setup()
      render(<ToolsConfigurationPanel {...defaultProps} />)
      
      // Switch to data category
      const dataCategory = screen.getByTestId('category-data')
      await user.click(dataCategory)
      
      // Search for calculator
      const searchInput = screen.getByTestId('tools-search')
      await user.type(searchInput, 'calculator')
      
      // Should only show calculator
      expect(screen.getByText('calculator')).toBeInTheDocument()
      expect(screen.queryByText('data_analyzer')).not.toBeInTheDocument()
    })
  })
})
