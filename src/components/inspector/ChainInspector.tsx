import React, { useCallback } from 'react'
import type { CanvasNode } from '../../../schemas/chain'

interface ChainInspectorProps {
  node: CanvasNode
  onUpdateNode: (nodeId: string, updates: Partial<CanvasNode>) => void
}

export const ChainInspector: React.FC<ChainInspectorProps> = ({
  node,
  onUpdateNode,
}) => {
  // Extract chain data
  const chainData = node.data || {}
  const name = chainData.name || 'Untitled Chain'
  const description = chainData.description || ''
  const nodes = chainData.nodes || []
  const edges = chainData.edges || []
  const metadata = chainData.metadata || {}

  // Handle name change
  const handleNameChange = useCallback((newName: string) => {
    onUpdateNode(node.id, {
      data: {
        ...chainData,
        name: newName,
      },
    })
  }, [node.id, chainData, onUpdateNode])

  // Handle description change
  const handleDescriptionChange = useCallback((newDescription: string) => {
    onUpdateNode(node.id, {
      data: {
        ...chainData,
        description: newDescription,
      },
    })
  }, [node.id, chainData, onUpdateNode])

  return (
    <div className="p-4 space-y-6">
      {/* Chain Name */}
      <div>
        <label htmlFor="chain-name" className="block text-sm font-medium text-gray-700 mb-2">
          Chain Name
        </label>
        <input
          id="chain-name"
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter chain name"
        />
      </div>

      {/* Chain Description */}
      <div>
        <label htmlFor="chain-description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="chain-description"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter chain description..."
        />
      </div>

      {/* Chain Statistics */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chain Statistics
        </label>
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <div className="font-medium">Nodes</div>
              <div>{nodes.length}</div>
            </div>
            <div>
              <div className="font-medium">Connections</div>
              <div>{edges.length}</div>
            </div>
            <div>
              <div className="font-medium">Agents</div>
              <div>{nodes.filter(n => n.type === 'agent').length}</div>
            </div>
            <div>
              <div className="font-medium">Documents</div>
              <div>{nodes.filter(n => n.type === 'document').length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chain Metadata */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Metadata
        </label>
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="text-sm text-gray-600">
            <div>Type: Chain</div>
            <div>Created: {metadata.createdAt || 'Unknown'}</div>
            <div>Modified: {metadata.updatedAt || 'Unknown'}</div>
            <div>Status: {metadata.status || 'Draft'}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => {
              // TODO: Implement run chain functionality
              console.log('Run chain:', { name, nodes, edges })
            }}
          >
            Run Chain
          </button>
          <button
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => {
              // TODO: Implement save chain functionality
              console.log('Save chain:', { name, description, nodes, edges })
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
} 