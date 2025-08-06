import React from 'react'
import { AgentInspector } from './AgentInspector'
import { DocumentInspector } from './DocumentInspector'
import { ChainInspector } from './ChainInspector'
import type { CanvasNode } from '../../../schemas/chain'

interface InspectorPanelProps {
  selectedNode: CanvasNode | null
  isOpen: boolean
  onClose: () => void
  onUpdateNode: (nodeId: string, updates: Partial<CanvasNode>) => void
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedNode,
  isOpen,
  onClose,
  onUpdateNode,
}) => {
  if (!isOpen || !selectedNode) {
    return null
  }

  const nodeType = selectedNode.type

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">
          Inspector
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-200 transition-colors"
          aria-label="Close inspector"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="h-full overflow-y-auto">
        {nodeType === 'agent' && (
          <AgentInspector
            node={selectedNode}
            onUpdateNode={onUpdateNode}
          />
        )}
        {nodeType === 'document' && (
          <DocumentInspector
            node={selectedNode}
            onUpdateNode={onUpdateNode}
          />
        )}
        {nodeType === 'chain' && (
          <ChainInspector
            node={selectedNode}
            onUpdateNode={onUpdateNode}
          />
        )}
      </div>
    </div>
  )
} 