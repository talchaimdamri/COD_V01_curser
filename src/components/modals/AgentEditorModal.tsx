import React, { useState, useCallback, useEffect } from 'react'
import { Agent, AgentTool } from '../../schemas/agent'
import PromptLibraryModal from './PromptLibraryModal'
import { PromptTemplate } from '../../services/promptLibrary'
import AgentTestingPanel from './AgentTestingPanel'
import ToolsConfigurationPanel from './ToolsConfigurationPanel'

interface AgentEditorModalProps {
  isOpen: boolean
  onClose: () => void
  agent?: Agent
  onSave: (agent: Partial<Agent>) => void
}

// Supported models configuration
const SUPPORTED_MODELS = {
  openai: [
    { value: 'gpt-4', label: 'GPT-4', maxTokens: 8192, temperature: 0.7 },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', maxTokens: 128000, temperature: 0.7 },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', maxTokens: 4096, temperature: 0.7 },
  ],
  anthropic: [
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', maxTokens: 200000, temperature: 0.7 },
    { value: 'claude-3-opus', label: 'Claude 3 Opus', maxTokens: 200000, temperature: 0.7 },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku', maxTokens: 200000, temperature: 0.7 },
  ],
  local: [
    { value: 'llama-2-70b', label: 'Llama 2 70B', maxTokens: 4096, temperature: 0.7 },
    { value: 'gemini-pro', label: 'Gemini Pro', maxTokens: 32768, temperature: 0.7 },
  ],
}

// Available tools
const AVAILABLE_TOOLS: AgentTool[] = [
  {
    name: 'web_search',
    description: 'Search the web for current information',
    type: 'api',
    config: { endpoint: '/api/tools/web-search' },
  },
  {
    name: 'file_reader',
    description: 'Read and analyze files',
    type: 'function',
    config: { allowedExtensions: ['.txt', '.md', '.pdf'] },
  },
  {
    name: 'calculator',
    description: 'Perform mathematical calculations',
    type: 'function',
    config: { precision: 10 },
  },
  {
    name: 'code_executor',
    description: 'Execute code snippets safely',
    type: 'function',
    config: { timeout: 5000, sandbox: true },
  },
]

// Agent templates
const AGENT_TEMPLATES = [
  {
    name: 'Document Analyzer',
    prompt: 'You are a document analysis expert. Your role is to analyze documents and extract key insights, summarize content, and identify important patterns or trends.',
    model: 'gpt-4',
    tools: ['file_reader', 'web_search'],
  },
  {
    name: 'Code Reviewer',
    prompt: 'You are a senior software engineer specializing in code review. Analyze code for best practices, security issues, performance optimizations, and maintainability.',
    model: 'gpt-4',
    tools: ['code_executor'],
  },
  {
    name: 'Data Analyst',
    prompt: 'You are a data analyst expert. Help users analyze data, create visualizations, identify trends, and provide actionable insights.',
    model: 'claude-3-sonnet',
    tools: ['calculator', 'file_reader'],
  },
]

const AgentEditorModal: React.FC<AgentEditorModalProps> = ({
  isOpen,
  onClose,
  agent,
  onSave,
}) => {
  const [isMaximized, setIsMaximized] = useState(false)
  const [name, setName] = useState(agent?.name || '')
  const [prompt, setPrompt] = useState(agent?.prompt || '')
  const [model, setModel] = useState(agent?.model || 'gpt-4')
  const [tools, setTools] = useState<AgentTool[]>(agent?.tools || [])
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(4096)
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showPromptLibrary, setShowPromptLibrary] = useState(false)
  const [showTesting, setShowTesting] = useState(false)
  const [showTestingPanel, setShowTestingPanel] = useState(false)
  const [showToolsPanel, setShowToolsPanel] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get current model config
  const currentModelConfig = Object.values(SUPPORTED_MODELS)
    .flat()
    .find(m => m.value === model)

  // Update model parameters when model changes
  useEffect(() => {
    if (currentModelConfig) {
      setTemperature(currentModelConfig.temperature)
      setMaxTokens(currentModelConfig.maxTokens)
    }
  }, [model, currentModelConfig])

  // Initialize with agent data if provided
  useEffect(() => {
    if (agent) {
      setName(agent.name)
      setPrompt(agent.prompt)
      setModel(agent.model)
      setTools(agent.tools || [])
      if (agent.metadata) {
        setTemperature(agent.metadata.temperature || 0.7)
        setMaxTokens(agent.metadata.maxTokens || 4096)
      }
    }
  }, [agent])

  // Handle modal close
  const handleClose = useCallback(() => {
    onClose()
    setShowTemplates(false)
    setShowTesting(false)
    setShowTestingPanel(false)
    setShowToolsPanel(false)
    setErrors({})
  }, [onClose])

  // Handle clicking outside modal
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }, [handleClose])

  // Handle maximize/minimize toggle
  const handleMaximize = useCallback(() => {
    setIsMaximized(!isMaximized)
  }, [isMaximized])

  // Handle tool toggle (kept for backward compatibility with templates)
  const handleToolToggle = useCallback((toolName: string, enabled: boolean) => {
    if (enabled) {
      const tool = AVAILABLE_TOOLS.find(t => t.name === toolName)
      if (tool) {
        setTools(prev => [...prev, tool])
      }
    } else {
      setTools(prev => prev.filter(t => t.name !== toolName))
    }
  }, [])

  // Auto-generate prompt using LLM API
  const handleGeneratePrompt = useCallback(async () => {
    setIsGeneratingPrompt(true)
    try {
      // TODO: Implement real LLM API call for prompt generation
      // This would call the selected model's API to generate a custom prompt
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      // Enhanced prompt generation based on agent context
      const toolDescriptions = tools.map(t => t.description).join(', ')
      const agentRole = name || 'an AI agent'
      const toolNames = tools.map(t => t.name).join(', ')
      
      const generatedPrompt = `You are ${agentRole}, a specialized AI assistant with expertise in ${toolNames || 'general tasks'}.

Your capabilities include: ${toolDescriptions || 'general problem-solving and information processing'}.

Your role is to:
1. Understand user requests and provide accurate, helpful responses
2. Utilize your specialized tools and knowledge effectively
3. Communicate clearly and professionally
4. Adapt your approach based on the specific context and requirements
5. Provide actionable insights and practical solutions

When working with users, always:
- Ask clarifying questions when needed
- Provide step-by-step explanations for complex tasks
- Offer multiple approaches when appropriate
- Ensure your responses are relevant and valuable
- Maintain a helpful and professional tone

Please help users with their requests in the most effective and efficient way possible.`
      
      setPrompt(generatedPrompt)
    } catch (error) {
      console.error('Failed to generate prompt:', error)
    } finally {
      setIsGeneratingPrompt(false)
    }
  }, [name, tools])

  // Handle prompt library selection
  const handlePromptLibrarySelect = useCallback((selectedPrompt: PromptTemplate) => {
    setPrompt(selectedPrompt.prompt)
    setModel(selectedPrompt.model)
    
    // Update tools to match the selected prompt's tools
    const promptTools = AVAILABLE_TOOLS.filter(tool => 
      selectedPrompt.tools.includes(tool.name)
    )
    setTools(promptTools)
    
    setShowPromptLibrary(false)
  }, [])

  // Apply template
  const handleApplyTemplate = useCallback((template: typeof AGENT_TEMPLATES[0]) => {
    setName(template.name)
    setPrompt(template.prompt)
    setModel(template.model)
    setTools(AVAILABLE_TOOLS.filter(t => template.tools.includes(t.name)))
    setShowTemplates(false)
  }, [])

  // Open testing panel
  const handleOpenTestingPanel = useCallback(() => {
    setShowTestingPanel(true)
  }, [])

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}
    
    if (!name.trim()) {
      newErrors.name = 'Agent name is required'
    }
    
    if (!prompt.trim()) {
      newErrors.prompt = 'System prompt is required'
    }
    
    if (!model) {
      newErrors.model = 'Model selection is required'
    }
    
    if (temperature < 0 || temperature > 2) {
      newErrors.temperature = 'Temperature must be between 0 and 2'
    }
    
    if (maxTokens < 1 || maxTokens > 200000) {
      newErrors.maxTokens = 'Max tokens must be between 1 and 200000'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, prompt, model, temperature, maxTokens])

  // Handle save
  const handleSave = useCallback(() => {
    if (!validateForm()) return

    const agentData: Partial<Agent> = {
      name: name.trim(),
      prompt: prompt.trim(),
      model,
      tools,
      metadata: {
        temperature,
        maxTokens,
      },
    }

    onSave(agentData)
    handleClose()
  }, [name, prompt, model, tools, temperature, maxTokens, validateForm, onSave, handleClose])

  if (!isOpen) return null

  return (
    <div
      data-testid="agent-editor-modal-overlay"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div
        data-testid="agent-editor-modal"
        role="dialog"
        aria-modal="true"
        className={`bg-white rounded-lg shadow-xl flex flex-col ${
          isMaximized ? 'w-full h-full m-0 rounded-none' : 'w-[80%] h-[90%] max-w-6xl'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {agent ? 'Edit Agent' : 'Create New Agent'}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              data-testid="maximize-agent-modal"
              onClick={handleMaximize}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Form */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Agent Name */}
              <div>
                <label htmlFor="agent-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Name *
                </label>
                <input
                  id="agent-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="Enter agent name"
                  data-testid="agent-name-input"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600" data-testid="agent-name-error">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Model Selection */}
              <div>
                <label htmlFor="agent-model" className="block text-sm font-medium text-gray-700 mb-2">
                  AI Model *
                </label>
                <select
                  id="agent-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.model ? 'border-red-300' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  data-testid="agent-model-select"
                >
                  <optgroup label="OpenAI">
                    {SUPPORTED_MODELS.openai.map((modelOption) => (
                      <option key={modelOption.value} value={modelOption.value}>
                        {modelOption.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Anthropic">
                    {SUPPORTED_MODELS.anthropic.map((modelOption) => (
                      <option key={modelOption.value} value={modelOption.value}>
                        {modelOption.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Local">
                    {SUPPORTED_MODELS.local.map((modelOption) => (
                      <option key={modelOption.value} value={modelOption.value}>
                        {modelOption.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
                {errors.model && (
                  <p className="mt-1 text-sm text-red-600" data-testid="agent-model-error">
                    {errors.model}
                  </p>
                )}
              </div>

              {/* Model Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="agent-temperature" className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature
                  </label>
                  <input
                    id="agent-temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.temperature ? 'border-red-300' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    data-testid="agent-temperature-input"
                  />
                  {errors.temperature && (
                    <p className="mt-1 text-sm text-red-600" data-testid="agent-temperature-error">
                      {errors.temperature}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="agent-max-tokens" className="block text-sm font-medium text-gray-700 mb-2">
                    Max Tokens
                  </label>
                  <input
                    id="agent-max-tokens"
                    type="number"
                    min="1"
                    max="200000"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.maxTokens ? 'border-red-300' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    data-testid="agent-max-tokens-input"
                  />
                  {errors.maxTokens && (
                    <p className="mt-1 text-sm text-red-600" data-testid="agent-max-tokens-error">
                      {errors.maxTokens}
                    </p>
                  )}
                </div>
              </div>

              {/* System Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="agent-prompt" className="block text-sm font-medium text-gray-700">
                    System Prompt *
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowTemplates(true)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                      data-testid="show-templates-button"
                    >
                      Templates
                    </button>
                    <button
                      onClick={() => setShowPromptLibrary(true)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                      data-testid="show-prompt-library-button"
                    >
                      Library
                    </button>
                    <button
                      onClick={handleGeneratePrompt}
                      disabled={isGeneratingPrompt}
                      className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                      data-testid="auto-generate-prompt-button"
                    >
                      {isGeneratingPrompt ? 'Generating...' : 'Auto-generate'}
                    </button>
                  </div>
                </div>
                <textarea
                  id="agent-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={8}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                    errors.prompt ? 'border-red-300' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="Enter the system prompt for this agent..."
                  data-testid="agent-prompt-textarea"
                />
                {errors.prompt && (
                  <p className="mt-1 text-sm text-red-600" data-testid="agent-prompt-error">
                    {errors.prompt}
                  </p>
                )}
              </div>

              {/* Tools */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tools Configuration
                  </label>
                  <button
                    onClick={() => setShowToolsPanel(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                    data-testid="open-tools-panel-button"
                  >
                    Configure Tools
                  </button>
                </div>
                <div className="border rounded-lg p-3 bg-gray-50">
                  {tools.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tools.map((tool) => (
                        <span
                          key={tool.name}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                        >
                          {tool.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No tools selected. Click "Configure Tools" to add tools.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Testing Panel */}
          <div className="w-96 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Test Agent</h3>
              <button
                onClick={handleOpenTestingPanel}
                className="text-sm text-blue-600 hover:text-blue-800"
                data-testid="open-testing-panel-button"
              >
                Open Testing Panel
              </button>
            </div>

            <div className="text-sm text-gray-600">
              <p className="mb-4">
                Test your agent configuration with sample inputs and see how it responds.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Sample inputs available
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Real-time response testing
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Performance metrics
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {agent ? 'Editing existing agent' : 'Creating new agent'}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              data-testid="save-agent-button"
            >
              {agent ? 'Update Agent' : 'Create Agent'}
            </button>
          </div>
        </div>

        {/* Templates Modal */}
        {showTemplates && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div
              data-testid="templates-modal"
              className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto"
            >
              <h3 className="text-lg font-semibold mb-4">Agent Templates</h3>
              <div className="space-y-3">
                {AGENT_TEMPLATES.map((template) => (
                  <div
                    key={template.name}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => handleApplyTemplate(template)}
                    data-testid={`template-${template.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="font-medium text-gray-900">{template.name}</div>
                    <div className="text-sm text-gray-500 mt-1">{template.prompt.substring(0, 100)}...</div>
                    <div className="text-xs text-gray-400 mt-2">
                      Model: {template.model} | Tools: {template.tools.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowTemplates(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prompt Library Modal */}
        <PromptLibraryModal
          isOpen={showPromptLibrary}
          onClose={() => setShowPromptLibrary(false)}
          onSelectPrompt={handlePromptLibrarySelect}
          currentModel={model}
          currentTools={tools.map(t => t.name)}
        />

        {/* Agent Testing Panel */}
        <AgentTestingPanel
          agent={{
            name,
            prompt,
            model,
            tools,
            metadata: {
              temperature,
              maxTokens,
            },
          }}
          isOpen={showTestingPanel}
          onClose={() => setShowTestingPanel(false)}
        />

        {/* Tools Configuration Panel */}
        <ToolsConfigurationPanel
          isOpen={showToolsPanel}
          onClose={() => setShowToolsPanel(false)}
          selectedTools={tools}
          onToolsChange={setTools}
        />
      </div>
    </div>
  )
}

export default AgentEditorModal
