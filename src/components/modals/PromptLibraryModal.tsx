import React, { useState, useEffect, useCallback } from 'react'
import { PromptLibraryService, PromptTemplate, PromptSearchFilters } from '../../services/promptLibrary'

interface PromptLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPrompt: (prompt: PromptTemplate) => void
  currentModel?: string
  currentTools?: string[]
}

const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
  currentModel,
  currentTools = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [prompts, setPrompts] = useState<PromptTemplate[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [models, setModels] = useState<string[]>([])
  const [tools, setTools] = useState<string[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null)
  const [loading, setLoading] = useState(false)

  const promptLibrary = PromptLibraryService.getInstance()

  // Initialize data
  useEffect(() => {
    if (isOpen) {
      setCategories(promptLibrary.getCategories())
      setTags(promptLibrary.getTags())
      setModels(promptLibrary.getModels())
      setTools(promptLibrary.getTools())
      
      // Set initial filters based on current context
      if (currentModel) {
        setSelectedModel(currentModel)
      }
      if (currentTools.length > 0) {
        setSelectedTools(currentTools)
      }
    }
  }, [isOpen, currentModel, currentTools])

  // Search prompts when filters change
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      
      const filters: PromptSearchFilters = {}
      if (selectedCategory) filters.category = selectedCategory
      if (selectedModel) filters.model = selectedModel
      if (selectedTags.length > 0) filters.tags = selectedTags
      if (selectedTools.length > 0) filters.tools = selectedTools
      
      const results = promptLibrary.searchPrompts(searchQuery, filters)
      setPrompts(results)
      setLoading(false)
    }
  }, [isOpen, searchQuery, selectedCategory, selectedModel, selectedTags, selectedTools])

  // Handle prompt selection
  const handlePromptSelect = useCallback((prompt: PromptTemplate) => {
    setSelectedPrompt(prompt)
  }, [])

  // Handle prompt application
  const handleApplyPrompt = useCallback(() => {
    if (selectedPrompt) {
      onSelectPrompt(selectedPrompt)
      onClose()
    }
  }, [selectedPrompt, onSelectPrompt, onClose])

  // Handle tag toggle
  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }, [])

  // Handle tool toggle
  const handleToolToggle = useCallback((tool: string) => {
    setSelectedTools(prev => 
      prev.includes(tool) 
        ? prev.filter(t => t !== tool)
        : [...prev, tool]
    )
  }, [])

  // Handle clicking outside modal
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div
      data-testid="prompt-library-modal-overlay"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div
        data-testid="prompt-library-modal"
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-lg shadow-xl w-[90%] h-[90%] max-w-6xl flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Prompt Library
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Filters Sidebar */}
          <div className="w-80 border-r border-gray-200 p-4 overflow-y-auto">
            <div className="space-y-6">
              {/* Search */}
              <div>
                <label htmlFor="prompt-search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Prompts
                </label>
                <input
                  id="prompt-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, description, or tags..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-testid="prompt-search-input"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-testid="category-filter"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Filter */}
              <div>
                <label htmlFor="model-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <select
                  id="model-filter"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-testid="model-filter"
                >
                  <option value="">All Models</option>
                  {models.map(model => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {tags.map(tag => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => handleTagToggle(tag)}
                        className="mr-2"
                        data-testid={`tag-${tag}-checkbox`}
                      />
                      <span className="text-sm text-gray-700">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tools Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tools
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {tools.map(tool => (
                    <label key={tool} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTools.includes(tool)}
                        onChange={() => handleToolToggle(tool)}
                        className="mr-2"
                        data-testid={`tool-${tool}-checkbox`}
                      />
                      <span className="text-sm text-gray-700">{tool}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Results Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    {loading ? 'Searching...' : `${prompts.length} prompts found`}
                  </h3>
                  {(selectedCategory || selectedModel || selectedTags.length > 0 || selectedTools.length > 0) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Filtered by: {[
                        selectedCategory && `Category: ${selectedCategory}`,
                        selectedModel && `Model: ${selectedModel}`,
                        selectedTags.length > 0 && `Tags: ${selectedTags.join(', ')}`,
                        selectedTools.length > 0 && `Tools: ${selectedTools.join(', ')}`
                      ].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                {selectedPrompt && (
                  <button
                    onClick={handleApplyPrompt}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="apply-prompt-button"
                  >
                    Apply Selected Prompt
                  </button>
                )}
              </div>
            </div>

            {/* Prompts List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Loading prompts...</div>
                </div>
              ) : prompts.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">No prompts found matching your criteria.</div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {prompts.map(prompt => (
                    <div
                      key={prompt.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedPrompt?.id === prompt.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handlePromptSelect(prompt)}
                      data-testid={`prompt-${prompt.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {prompt.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {prompt.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {prompt.category}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {prompt.model}
                            </span>
                            {prompt.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {prompt.tags.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                +{prompt.tags.length - 3} more
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            <p className="mb-1"><strong>Usage:</strong> {prompt.usage}</p>
                            <p><strong>Tools:</strong> {prompt.tools.join(', ') || 'None'}</p>
                          </div>
                        </div>
                        <div className="ml-4">
                          <input
                            type="radio"
                            name="selectedPrompt"
                            checked={selectedPrompt?.id === prompt.id}
                            onChange={() => handlePromptSelect(prompt)}
                            className="text-blue-600 focus:ring-blue-500"
                            data-testid={`prompt-radio-${prompt.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PromptLibraryModal
