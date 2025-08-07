import React, { useState, useEffect, useCallback } from 'react'
import { AgentTool } from '../../schemas/agent'

interface ToolsConfigurationPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedTools: AgentTool[]
  onToolsChange: (tools: AgentTool[]) => void
}

interface ToolCategory {
  id: string
  name: string
  description: string
  icon: string
}

interface CustomToolForm {
  name: string
  description: string
  type: 'function' | 'api' | 'file'
  config: Record<string, any>
  category: string
}

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'web',
    name: 'Web & Search',
    description: 'Tools for web search and information retrieval',
    icon: '🌐',
  },
  {
    id: 'file',
    name: 'File Operations',
    description: 'Tools for reading, writing, and analyzing files',
    icon: '📁',
  },
  {
    id: 'code',
    name: 'Code & Development',
    description: 'Tools for code execution and development tasks',
    icon: '💻',
  },
  {
    id: 'data',
    name: 'Data & Analytics',
    description: 'Tools for data analysis and mathematical operations',
    icon: '📊',
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Tools for messaging and communication',
    icon: '💬',
  },
  {
    id: 'custom',
    name: 'Custom Tools',
    description: 'User-defined custom tools',
    icon: '⚙️',
  },
]

const DEFAULT_TOOLS: AgentTool[] = [
  {
    name: 'web_search',
    description: 'Search the web for current information',
    type: 'api',
    config: { endpoint: '/api/tools/web-search', timeout: 30000 },
  },
  {
    name: 'file_reader',
    description: 'Read and analyze files',
    type: 'file',
    config: { allowedExtensions: ['.txt', '.md', '.pdf'], maxSize: '10MB' },
  },
  {
    name: 'calculator',
    description: 'Perform mathematical calculations',
    type: 'function',
    config: { precision: 10, timeout: 5000 },
  },
  {
    name: 'code_executor',
    description: 'Execute code snippets safely',
    type: 'function',
    config: { timeout: 5000, sandbox: true, allowedLanguages: ['javascript', 'python'] },
  },
  {
    name: 'email_sender',
    description: 'Send emails via configured SMTP',
    type: 'api',
    config: { endpoint: '/api/tools/email', smtpConfig: {} },
  },
  {
    name: 'data_analyzer',
    description: 'Analyze and visualize data',
    type: 'function',
    config: { maxRows: 10000, chartTypes: ['line', 'bar', 'pie'] },
  },
]

const ToolsConfigurationPanel: React.FC<ToolsConfigurationPanelProps> = ({
  isOpen,
  onClose,
  selectedTools,
  onToolsChange,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('web')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCustomToolForm, setShowCustomToolForm] = useState(false)
  const [customToolForm, setCustomToolForm] = useState<CustomToolForm>({
    name: '',
    description: '',
    type: 'function',
    config: {},
    category: 'custom',
  })
  const [editingTool, setEditingTool] = useState<AgentTool | null>(null)
  const [showToolConfig, setShowToolConfig] = useState<AgentTool | null>(null)

  // Get category for a tool
  const getToolCategory = (tool: AgentTool): string => {
    if (tool.name.includes('web') || tool.name.includes('search')) return 'web'
    if (tool.name.includes('file') || tool.name.includes('reader')) return 'file'
    if (tool.name.includes('code') || tool.name.includes('executor')) return 'code'
    if (tool.name.includes('data') || tool.name.includes('calculator')) return 'data'
    if (tool.name.includes('email') || tool.name.includes('message')) return 'communication'
    return 'custom'
  }

  // Filter tools by category and search
  const filteredTools = DEFAULT_TOOLS.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = getToolCategory(tool) === activeCategory
    return matchesSearch && matchesCategory
  })

  // Check if tool is selected
  const isToolSelected = (tool: AgentTool): boolean => {
    return selectedTools.some(t => t.name === tool.name)
  }

  // Handle tool selection
  const handleToolToggle = useCallback((tool: AgentTool, selected: boolean) => {
    if (selected) {
      onToolsChange([...selectedTools, tool])
    } else {
      onToolsChange(selectedTools.filter(t => t.name !== tool.name))
    }
  }, [selectedTools, onToolsChange])

  // Handle custom tool form submission
  const handleCustomToolSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    const newTool: AgentTool = {
      name: customToolForm.name,
      description: customToolForm.description,
      type: customToolForm.type,
      config: customToolForm.config,
    }

    // Add to selected tools
    onToolsChange([...selectedTools, newTool])
    
    // Reset form
    setCustomToolForm({
      name: '',
      description: '',
      type: 'function',
      config: {},
      category: 'custom',
    })
    setShowCustomToolForm(false)
  }, [customToolForm, selectedTools, onToolsChange])

  // Handle tool configuration update
  const handleToolConfigUpdate = useCallback((tool: AgentTool, config: Record<string, any>) => {
    const updatedTool = { ...tool, config }
    const updatedSelectedTools = selectedTools.map(t => 
      t.name === tool.name ? updatedTool : t
    )
    onToolsChange(updatedSelectedTools)
    setShowToolConfig(null)
  }, [selectedTools, onToolsChange])

  // Handle overlay click
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div
      data-testid="tools-configuration-panel-overlay"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div
        data-testid="tools-configuration-panel"
        className="bg-white rounded-lg shadow-xl w-[90%] h-[90%] max-w-6xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tools Configuration</h2>
            <p className="text-gray-600 mt-1">
              Configure and manage tools for your agent
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            data-testid="close-tools-panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Categories */}
          <div className="w-64 bg-gray-50 border-r p-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="tools-search"
              />
            </div>

            <div className="space-y-2">
              {TOOL_CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeCategory === category.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  data-testid={`category-${category.id}`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{category.icon}</span>
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-500">{category.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => setShowCustomToolForm(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                data-testid="add-custom-tool"
              >
                + Add Custom Tool
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Selected Tools Summary */}
            <div className="p-4 border-b bg-blue-50">
              <h3 className="font-medium text-blue-900 mb-2">
                Selected Tools ({selectedTools.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedTools.map(tool => (
                  <div
                    key={tool.name}
                    className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    <span>{tool.name}</span>
                    <button
                      onClick={() => onToolsChange(selectedTools.filter(t => t.name !== tool.name))}
                      className="text-blue-600 hover:text-blue-800"
                      data-testid={`remove-tool-${tool.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {selectedTools.length === 0 && (
                  <span className="text-gray-500 text-sm">No tools selected</span>
                )}
              </div>
            </div>

            {/* Tools List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTools.map(tool => (
                  <div
                    key={tool.name}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{tool.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            tool.type === 'api' ? 'bg-green-100 text-green-800' :
                            tool.type === 'function' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {tool.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowToolConfig(tool)}
                          className="text-gray-400 hover:text-gray-600"
                          data-testid={`configure-tool-${tool.name}`}
                          title="Configure tool"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isToolSelected(tool)}
                            onChange={(e) => handleToolToggle(tool, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            data-testid={`select-tool-${tool.name}`}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredTools.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No tools found in this category.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Custom Tool Form Modal */}
        {showCustomToolForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">Add Custom Tool</h3>
              <form onSubmit={handleCustomToolSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tool Name
                    </label>
                    <input
                      type="text"
                      value={customToolForm.name}
                      onChange={(e) => setCustomToolForm({ ...customToolForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      data-testid="custom-tool-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={customToolForm.description}
                      onChange={(e) => setCustomToolForm({ ...customToolForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required
                      data-testid="custom-tool-description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={customToolForm.type}
                      onChange={(e) => setCustomToolForm({ ...customToolForm, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="custom-tool-type"
                    >
                      <option value="function">Function</option>
                      <option value="api">API</option>
                      <option value="file">File</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCustomToolForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    data-testid="cancel-custom-tool"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    data-testid="save-custom-tool"
                  >
                    Add Tool
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tool Configuration Modal */}
        {showToolConfig && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h3 className="text-lg font-medium mb-4">Configure {showToolConfig.name}</h3>
              <div className="space-y-4">
                {Object.entries(showToolConfig.config).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    {typeof value === 'boolean' ? (
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => {
                          const newConfig = { ...showToolConfig.config, [key]: e.target.checked }
                          handleToolConfigUpdate(showToolConfig, newConfig)
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        data-testid={`config-${key}`}
                      />
                    ) : typeof value === 'number' ? (
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => {
                          const newConfig = { ...showToolConfig.config, [key]: Number(e.target.value) }
                          handleToolConfigUpdate(showToolConfig, newConfig)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        data-testid={`config-${key}`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          const newConfig = { ...showToolConfig.config, [key]: e.target.value }
                          handleToolConfigUpdate(showToolConfig, newConfig)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        data-testid={`config-${key}`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowToolConfig(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  data-testid="close-tool-config"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ToolsConfigurationPanel
