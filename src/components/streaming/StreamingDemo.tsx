import React, { useState } from 'react'
import StreamingOutput from './StreamingOutput'
import { AgentExecution } from '../../../schemas/agent'

export const StreamingDemo: React.FC = () => {
  const [execution, setExecution] = useState<AgentExecution | null>(null)
  const [input, setInput] = useState('')
  const [agentId, setAgentId] = useState('agent-123')

  const handleStartExecution = () => {
    if (!input.trim()) {
      alert('Please enter some input')
      return
    }

    const newExecution: AgentExecution = {
      agentId,
      input: input.trim(),
      metadata: {
        userId: 'demo-user',
        sessionId: 'demo-session',
        timestamp: new Date().toISOString()
      }
    }

    setExecution(newExecution)
  }

  const handleComplete = (result: any) => {
    console.log('Execution completed:', result)
  }

  const handleError = (error: string) => {
    console.error('Execution error:', error)
  }

  const handleClear = () => {
    setExecution(null)
    setInput('')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Agent Streaming Demo
        </h1>
        <p className="text-gray-600">
          Test the real-time streaming output from agent execution
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Execution Input</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent ID
              </label>
              <input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter agent ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Input Text
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your input for the agent..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleStartExecution}
                disabled={!input.trim() || !!execution}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Start Execution
              </button>
              
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Sample Inputs */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Sample Inputs</h3>
            <div className="space-y-2">
              <button
                onClick={() => setInput('Explain quantum computing in simple terms')}
                className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                Explain quantum computing in simple terms
              </button>
              <button
                onClick={() => setInput('Write a short story about a robot learning to paint')}
                className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                Write a short story about a robot learning to paint
              </button>
              <button
                onClick={() => setInput('What are the benefits of renewable energy?')}
                className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                What are the benefits of renewable energy?
              </button>
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Real-time Output</h2>
          </div>
          
          <div className="h-96">
            {execution ? (
              <StreamingOutput
                execution={execution}
                onComplete={handleComplete}
                onError={handleError}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📡</div>
                  <p>Click "Start Execution" to begin streaming</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✅</span>
            <span className="text-sm">Real-time streaming output</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✅</span>
            <span className="text-sm">Execution status indicators</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✅</span>
            <span className="text-sm">Progress tracking</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✅</span>
            <span className="text-sm">Error handling & display</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✅</span>
            <span className="text-sm">Auto-scroll to bottom</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✅</span>
            <span className="text-sm">Stop/Clear controls</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✅</span>
            <span className="text-sm">Token usage tracking</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✅</span>
            <span className="text-sm">Execution timing</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✅</span>
            <span className="text-sm">Server-Sent Events</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StreamingDemo
