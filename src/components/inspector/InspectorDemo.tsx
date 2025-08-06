import React, { useState } from 'react'
import { InspectorPanel } from './InspectorPanel'
import type { CanvasNode } from '../../../schemas/chain'

// Sample nodes for demo
const SAMPLE_NODES: CanvasNode[] = [
  {
    id: 'agent-1',
    type: 'agent',
    position: { x: 100, y: 100 },
    data: {
      name: 'Research Agent',
      prompt: 'You are a research assistant specialized in finding and analyzing information.',
      model: 'gpt-4',
      tools: [
        {
          name: 'web_search',
          description: 'Search the web for current information',
          type: 'api',
          config: { endpoint: '/api/tools/web-search' },
        },
      ],
    },
  },
  {
    id: 'document-1',
    type: 'document',
    position: { x: 300, y: 100 },
    data: {
      title: 'Research Report',
      content: 'This is a sample research report document...',
      metadata: {
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T14:45:00Z',
        version: '1.2',
      },
    },
  },
  {
    id: 'chain-1',
    type: 'chain',
    position: { x: 500, y: 100 },
    data: {
      name: 'Research Workflow',
      description: 'A complete research workflow from data collection to report generation',
      nodes: [
        { id: 'agent-1', type: 'agent' },
        { id: 'document-1', type: 'document' },
      ],
      edges: [
        { id: 'edge-1', source: 'agent-1', target: 'document-1', type: 'processes' },
      ],
      metadata: {
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T15:00:00Z',
        status: 'Active',
      },
    },
  },
]

export const InspectorDemo: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)

  const handleNodeSelect = (node: CanvasNode) => {
    setSelectedNode(node)
    setIsInspectorOpen(true)
  }

  const handleUpdateNode = (nodeId: string, updates: Partial<CanvasNode>) => {
    setSelectedNode(prev => prev ? { ...prev, ...updates } : null)
    console.log('Node updated:', nodeId, updates)
  }

  const handleCloseInspector = () => {
    setIsInspectorOpen(false)
    setSelectedNode(null)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Inspector Panel Demo
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Node Selection Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Select a Node to Inspect
            </h2>
            <div className="space-y-3">
              {SAMPLE_NODES.map((node) => (
                <button
                  key={node.id}
                  onClick={() => handleNodeSelect(node)}
                  className={`w-full p-4 text-left rounded-md border transition-colors ${
                    selectedNode?.id === node.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      node.type === 'agent' ? 'bg-green-500' :
                      node.type === 'document' ? 'bg-blue-500' :
                      'bg-purple-500'
                    }`}></div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {node.data?.name || node.data?.title || 'Unnamed Node'}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {node.type}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Inspector Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Inspector Panel
            </h2>
            {selectedNode ? (
              <div className="text-sm text-gray-600">
                <p><strong>Selected:</strong> {selectedNode.data?.name || selectedNode.data?.title || 'Unnamed Node'}</p>
                <p><strong>Type:</strong> {selectedNode.type}</p>
                <p><strong>ID:</strong> {selectedNode.id}</p>
                <p><strong>Position:</strong> ({selectedNode.position.x}, {selectedNode.position.y})</p>
              </div>
            ) : (
              <p className="text-gray-500">Select a node to see its details</p>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Instructions
          </h3>
          <ul className="text-blue-800 space-y-1">
            <li>• Click on any node in the left panel to open the inspector</li>
            <li>• The inspector panel will slide in from the right</li>
            <li>• Modify the node properties and see real-time updates</li>
            <li>• Use the close button to hide the inspector</li>
          </ul>
        </div>
      </div>

      {/* Inspector Panel */}
      <InspectorPanel
        selectedNode={selectedNode}
        isOpen={isInspectorOpen}
        onClose={handleCloseInspector}
        onUpdateNode={handleUpdateNode}
      />
    </div>
  )
} 