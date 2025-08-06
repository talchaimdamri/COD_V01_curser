import React, { useState, useCallback } from 'react'
import type { CanvasNode } from '../../../schemas/chain'
import type { AgentTool } from '../../../schemas/agent'

interface AgentInspectorProps {
  node: CanvasNode
  onUpdateNode: (nodeId: string, updates: Partial<CanvasNode>) => void
}

// Supported models configuration
const SUPPORTED_MODELS = {
  openai: [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
  ],
  local: [
    { value: 'llama-2-70b', label: 'Llama 2 70B' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
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

export const AgentInspector: React.FC<AgentInspectorProps> = ({
  node,
  onUpdateNode,
}) => {
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  
  // Extract agent data
  const agentData = node.data || {}
  const name = agentData.name || 'Unnamed Agent'
  const prompt = agentData.prompt || ''
  const model = agentData.model || 'gpt-4'
  const tools = agentData.tools || []
  const metadata = agentData.metadata || {}

  // Handle name change
  const handleNameChange = useCallback((newName: string) => {
    onUpdateNode(node.id, {
      data: {
        ...agentData,
        name: newName,
      },
    })
  }, [node.id, agentData, onUpdateNode])

  // Handle prompt change
  const handlePromptChange = useCallback((newPrompt: string) => {
    onUpdateNode(node.id, {
      data: {
        ...agentData,
        prompt: newPrompt,
      },
    })
  }, [node.id, agentData, onUpdateNode])

  // Handle model change
  const handleModelChange = useCallback((newModel: string) => {
    onUpdateNode(node.id, {
      data: {
        ...agentData,
        model: newModel,
      },
    })
  }, [node.id, agentData, onUpdateNode])

  // Handle tool toggle
  const handleToolToggle = useCallback((toolName: string, enabled: boolean) => {
    let newTools = [...tools]
    
    if (enabled) {
      const tool = AVAILABLE_TOOLS.find(t => t.name === toolName)
      if (tool) {
        newTools.push(tool)
      }
    } else {
      newTools = newTools.filter(t => t.name !== toolName)
    }

    onUpdateNode(node.id, {
      data: {
        ...agentData,
        tools: newTools,
      },
    })
  }, [node.id, agentData, tools, onUpdateNode])

  // Auto-generate prompt
  const handleGeneratePrompt = useCallback(async () => {
    setIsGeneratingPrompt(true)
    try {
      // TODO: Implement AI prompt generation
      // This would call an API to generate a prompt based on the agent's name and tools
      const generatedPrompt = `You are ${name}, an AI agent specialized in ${tools.map(t => t.name).join(', ')}. Please help users with their requests.`
      
      handlePromptChange(generatedPrompt)
    } catch (error) {
      console.error('Failed to generate prompt:', error)
    } finally {
      setIsGeneratingPrompt(false)
    }
  }, [name, tools, handlePromptChange])

  return (
    <div className="p-4 space-y-6">
      {/* Agent Name */}
      <div>
        <label htmlFor="agent-name" className="block text-sm font-medium text-gray-700 mb-2">
          Agent Name
        </label>
        <input
          id="agent-name"
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter agent name"
        />
      </div>

      {/* Model Selection */}
      <div>
        <label htmlFor="agent-model" className="block text-sm font-medium text-gray-700 mb-2">
          AI Model
        </label>
        <select
          id="agent-model"
          value={model}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      </div>

      {/* Prompt */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="agent-prompt" className="block text-sm font-medium text-gray-700">
            System Prompt
          </label>
          <button
            onClick={handleGeneratePrompt}
            disabled={isGeneratingPrompt}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            {isGeneratingPrompt ? 'Generating...' : 'Auto-generate'}
          </button>
        </div>
        <textarea
          id="agent-prompt"
          value={prompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter the system prompt for this agent..."
        />
      </div>

      {/* Tools */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available Tools
        </label>
        <div className="space-y-2">
          {AVAILABLE_TOOLS.map((tool) => {
            const isEnabled = tools.some(t => t.name === tool.name)
            return (
              <label key={tool.name} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => handleToolToggle(tool.name, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                  <div className="text-xs text-gray-500">{tool.description}</div>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Agent Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Ready</span>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => {
              // TODO: Implement test agent functionality
              console.log('Test agent:', { name, model, prompt, tools })
            }}
          >
            Test Agent
          </button>
          <button
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => {
              // TODO: Implement save agent functionality
              console.log('Save agent:', { name, model, prompt, tools })
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
} 