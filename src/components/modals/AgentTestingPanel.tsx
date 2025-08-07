import React, { useState, useEffect, useCallback } from 'react'
import { Agent } from '../../schemas/agent'
import { AgentTestingService, SampleInput, AgentTestResponse } from '../../services/agentTesting'

interface AgentTestingPanelProps {
  agent: Partial<Agent>
  isOpen: boolean
  onClose: () => void
}

const AgentTestingPanel: React.FC<AgentTestingPanelProps> = ({
  agent,
  isOpen,
  onClose
}) => {
  const [testInput, setTestInput] = useState('')
  const [testOutput, setTestOutput] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [testResponse, setTestResponse] = useState<AgentTestResponse | null>(null)
  const [selectedSampleInput, setSelectedSampleInput] = useState<SampleInput | null>(null)
  const [showSampleInputs, setShowSampleInputs] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [sampleInputs, setSampleInputs] = useState<SampleInput[]>([])
  const [categories, setCategories] = useState<string[]>([])

  const agentTestingService = AgentTestingService.getInstance()

  useEffect(() => {
    if (isOpen) {
      const inputs = agentTestingService.getSampleInputs()
      const cats = agentTestingService.getCategories()
      setSampleInputs(inputs)
      setCategories(cats)
    }
  }, [isOpen, agentTestingService])

  const handleTestAgent = useCallback(async () => {
    if (!testInput.trim()) return

    setIsTesting(true)
    setTestOutput('')
    setTestResponse(null)
    
    try {
      const response = await agentTestingService.testAgent({
        agent,
        input: testInput
      })
      
      setTestResponse(response)
      
      if (response.success && response.output) {
        setTestOutput(response.output)
      } else {
        setTestOutput(`Error: ${response.error}`)
      }
    } catch (error) {
      setTestOutput(`Error: ${error instanceof Error ? error.message : 'Failed to test agent'}`)
    } finally {
      setIsTesting(false)
    }
  }, [testInput, agent, agentTestingService])

  const handleSampleInputSelect = useCallback((sampleInput: SampleInput) => {
    setTestInput(sampleInput.input)
    setSelectedSampleInput(sampleInput)
    setShowSampleInputs(false)
  }, [])

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
    const filtered = agentTestingService.getSampleInputs(category)
    setSampleInputs(filtered)
  }, [agentTestingService])

  const handleClearTest = useCallback(() => {
    setTestInput('')
    setTestOutput('')
    setTestResponse(null)
    setSelectedSampleInput(null)
  }, [])

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div
      data-testid="agent-testing-panel-overlay"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div
        data-testid="agent-testing-panel"
        className="bg-white rounded-lg shadow-xl w-[90%] h-[90%] max-w-6xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Test Agent: {agent.name || 'Unnamed Agent'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            data-testid="close-testing-panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Input and Controls */}
          <div className="w-1/2 p-4 border-r border-gray-200 flex flex-col">
            {/* Agent Configuration Summary */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Agent Configuration</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Model:</strong> {agent.model || 'Not set'}</div>
                <div><strong>Tools:</strong> {agent.tools?.map(t => t.name).join(', ') || 'None'}</div>
                <div><strong>Temperature:</strong> {agent.metadata?.temperature || 'Not set'}</div>
                <div><strong>Max Tokens:</strong> {agent.metadata?.maxTokens || 'Not set'}</div>
              </div>
            </div>

            {/* Sample Inputs */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Sample Inputs
                </label>
                <button
                  onClick={() => setShowSampleInputs(!showSampleInputs)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  data-testid="toggle-sample-inputs"
                >
                  {showSampleInputs ? 'Hide' : 'Show'}
                </button>
              </div>

              {showSampleInputs && (
                <div className="space-y-2">
                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    data-testid="sample-input-category-filter"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>

                  {/* Sample Inputs List */}
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md">
                    {sampleInputs.map((sampleInput) => (
                      <div
                        key={sampleInput.id}
                        className="p-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSampleInputSelect(sampleInput)}
                        data-testid={`sample-input-${sampleInput.id}`}
                      >
                        <div className="text-sm font-medium text-gray-900">{sampleInput.name}</div>
                        <div className="text-xs text-gray-500">{sampleInput.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Test Input */}
            <div className="flex-1 flex flex-col">
              <label htmlFor="test-input" className="block text-sm font-medium text-gray-700 mb-2">
                Test Input
              </label>
              <textarea
                id="test-input"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                rows={6}
                className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Enter test input for the agent..."
                data-testid="test-input-textarea"
              />
              
              {/* Selected Sample Input Info */}
              {selectedSampleInput && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-xs text-blue-800">
                    <strong>Using sample:</strong> {selectedSampleInput.name}
                  </div>
                </div>
              )}
            </div>

            {/* Test Controls */}
            <div className="flex space-x-2 mt-4">
              <button
                onClick={handleTestAgent}
                disabled={!testInput.trim() || isTesting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="test-agent-button"
              >
                {isTesting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Testing...
                  </span>
                ) : (
                  'Test Agent'
                )}
              </button>
              <button
                onClick={handleClearTest}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                data-testid="clear-test-button"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Right Panel - Output */}
          <div className="w-1/2 p-4 flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Response
            </label>
            
            {testResponse && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Test Results</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  {testResponse.executionTime && (
                    <div><strong>Execution Time:</strong> {testResponse.executionTime}ms</div>
                  )}
                  {testResponse.tokensUsed && (
                    <div><strong>Tokens Used:</strong> {testResponse.tokensUsed}</div>
                  )}
                  {testResponse.modelUsed && (
                    <div><strong>Model Used:</strong> {testResponse.modelUsed}</div>
                  )}
                  <div><strong>Status:</strong> {testResponse.success ? 'Success' : 'Error'}</div>
                </div>
              </div>
            )}

            <div
              className="flex-1 w-full p-3 border border-gray-300 rounded-md bg-white text-sm whitespace-pre-wrap overflow-y-auto font-mono"
              data-testid="test-output"
            >
              {testOutput || 'Agent response will appear here...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentTestingPanel
