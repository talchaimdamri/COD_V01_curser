import React, { useState } from 'react'
import { LeftSidebar } from './LeftSidebar'

const demoChains = [
  {
    id: 'chain-1',
    name: 'Document Processing Chain',
    description: 'Process documents with AI agents for content analysis and summarization',
  },
  {
    id: 'chain-2',
    name: 'Data Analysis Chain',
    description: 'Analyze data with machine learning models for insights and patterns',
  },
  {
    id: 'chain-3',
    name: 'Content Generation Chain',
    description: 'Generate content using various AI models and templates',
  },
]

const demoDocuments = [
  {
    id: 'doc-1',
    title: 'Research Paper on AI',
    content: 'This is a comprehensive research paper about artificial intelligence and its applications in modern technology. The paper covers various aspects including machine learning, neural networks, and deep learning algorithms.',
  },
  {
    id: 'doc-2',
    title: 'Business Report Q1 2024',
    content: 'Quarterly business report for Q1 2024 covering financial performance, market analysis, and strategic initiatives. Includes detailed metrics and projections.',
  },
  {
    id: 'doc-3',
    title: 'Technical Documentation',
    content: 'Technical documentation for the new API endpoints and system architecture. Includes code examples, deployment procedures, and troubleshooting guides.',
  },
  {
    id: 'doc-4',
    title: 'User Manual',
    content: 'Complete user manual for the application with step-by-step instructions, screenshots, and best practices for optimal usage.',
  },
]

const demoAgents = [
  {
    id: 'agent-1',
    name: 'Text Analyzer',
    model: 'GPT-4',
  },
  {
    id: 'agent-2',
    name: 'Data Processor',
    model: 'Claude-3',
  },
  {
    id: 'agent-3',
    name: 'Content Generator',
    model: 'GPT-4 Turbo',
  },
  {
    id: 'agent-4',
    name: 'Code Reviewer',
    model: 'Claude-3 Sonnet',
  },
  {
    id: 'agent-5',
    name: 'Translation Agent',
    model: 'GPT-4',
  },
]

export const LeftSidebarDemo: React.FC = () => {
  const [selectedChain, setSelectedChain] = useState<string | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [dragEvents, setDragEvents] = useState<Array<{ type: string; id: string; timestamp: string }>>([])

  const handleChainSelect = (chainId: string) => {
    setSelectedChain(chainId)
    console.log('Chain selected:', chainId)
  }

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocument(documentId)
    console.log('Document selected:', documentId)
  }

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId)
    console.log('Agent selected:', agentId)
  }

  const handleDragStart = (item: { type: string; id: string; data: any }) => {
    const newDragEvent = {
      type: item.type,
      id: item.id,
      timestamp: new Date().toLocaleTimeString(),
    }
    setDragEvents(prev => [newDragEvent, ...prev.slice(0, 4)]) // Keep last 5 events
    console.log('Drag started:', item)
  }

  return (
    <div className="h-screen bg-gray-50">
      {/* Main content area */}
      <div className="ml-80 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Left Sidebar Demo</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Selection Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Selection Status</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Selected Chain:</span>
                  <span className="ml-2 text-sm text-gray-900">
                    {selectedChain ? demoChains.find(c => c.id === selectedChain)?.name : 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Selected Document:</span>
                  <span className="ml-2 text-sm text-gray-900">
                    {selectedDocument ? demoDocuments.find(d => d.id === selectedDocument)?.title : 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Selected Agent:</span>
                  <span className="ml-2 text-sm text-gray-900">
                    {selectedAgent ? demoAgents.find(a => a.id === selectedAgent)?.name : 'None'}
                  </span>
                </div>
              </div>
            </div>

            {/* Drag Events */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Drag Events</h2>
              <div className="space-y-2">
                {dragEvents.length === 0 ? (
                  <p className="text-sm text-gray-500">No drag events yet. Try dragging items from the sidebar!</p>
                ) : (
                  dragEvents.map((event, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-900">
                        {event.type} - {event.id}
                      </span>
                      <span className="text-gray-500">{event.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">How to Use</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h3 className="font-medium mb-2">Navigation:</h3>
                <ul className="space-y-1">
                  <li>• Click on section tabs to switch between Chains, Documents, and Agents</li>
                  <li>• Click the collapse button to minimize the sidebar</li>
                  <li>• Click on items to select them (see status above)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Drag & Drop:</h3>
                <ul className="space-y-1">
                  <li>• Drag items from the sidebar to the canvas (simulated)</li>
                  <li>• Drag events are logged above</li>
                  <li>• Items are draggable and show visual feedback</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Responsive Design</h3>
                <p className="text-sm text-gray-600">
                  320px fixed width with collapse/expand functionality. Adapts to different screen sizes.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Drag & Drop</h3>
                <p className="text-sm text-gray-600">
                  Full drag and drop support with proper data transfer and visual feedback.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Accessibility</h3>
                <p className="text-sm text-gray-600">
                  ARIA labels, keyboard navigation, and screen reader support for all interactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Left Sidebar */}
      <LeftSidebar
        chains={demoChains}
        documents={demoDocuments}
        agents={demoAgents}
        onChainSelect={handleChainSelect}
        onDocumentSelect={handleDocumentSelect}
        onAgentSelect={handleAgentSelect}
        onDragStart={handleDragStart}
      />
    </div>
  )
} 