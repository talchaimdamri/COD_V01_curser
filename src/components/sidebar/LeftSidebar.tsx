import React, { useState, useCallback } from 'react'

interface LeftSidebarProps {
  chains: Array<{ id: string; name: string; description?: string }>
  documents: Array<{ id: string; title: string; content?: string }>
  agents: Array<{ id: string; name: string; model?: string }>
  onChainSelect?: (chainId: string) => void
  onDocumentSelect?: (documentId: string) => void
  onAgentSelect?: (agentId: string) => void
  onDragStart?: (item: { type: string; id: string; data: any }) => void
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  chains,
  documents,
  agents,
  onChainSelect,
  onDocumentSelect,
  onAgentSelect,
  onDragStart,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState<'chains' | 'documents' | 'agents'>('chains')

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed)
  }, [isCollapsed])

  const handleSectionClick = useCallback((section: 'chains' | 'documents' | 'agents') => {
    setActiveSection(section)
  }, [])

  const handleDragStart = useCallback((event: React.DragEvent, item: { type: string; id: string; data: any }) => {
    if (onDragStart) {
      onDragStart(item)
    }
    event.dataTransfer.setData('application/json', JSON.stringify(item))
    event.dataTransfer.effectAllowed = 'copy'
  }, [onDragStart])

  if (isCollapsed) {
    return (
      <div
        data-testid="left-sidebar-collapsed"
        className="fixed left-0 top-0 h-full w-12 bg-white border-r border-gray-200 shadow-sm z-10"
      >
        <button
          onClick={handleToggleCollapse}
          className="w-full h-12 flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Expand sidebar"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div
      data-testid="left-sidebar"
      className="fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 shadow-sm z-10 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Object Library</h2>
        <button
          onClick={handleToggleCollapse}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Collapse sidebar"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => handleSectionClick('chains')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeSection === 'chains'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Chains ({chains.length})
        </button>
        <button
          onClick={() => handleSectionClick('documents')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeSection === 'documents'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Documents ({documents.length})
        </button>
        <button
          onClick={() => handleSectionClick('agents')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeSection === 'agents'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Agents ({agents.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === 'chains' && (
          <div className="p-4">
            <div className="space-y-2">
              {chains.map((chain) => (
                <div
                  key={chain.id}
                  data-testid={`chain-item-${chain.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, { type: 'chain', id: chain.id, data: chain })}
                  onClick={() => onChainSelect?.(chain.id)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{chain.name}</h3>
                      {chain.description && (
                        <p className="text-xs text-gray-500 truncate">{chain.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'documents' && (
          <div className="p-4">
            <div className="space-y-2">
              {documents.map((document) => (
                <div
                  key={document.id}
                  data-testid={`document-item-${document.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, { type: 'document', id: document.id, data: document })}
                  onClick={() => onDocumentSelect?.(document.id)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{document.title}</h3>
                      {document.content && (
                        <p className="text-xs text-gray-500 truncate">
                          {document.content.substring(0, 50)}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'agents' && (
          <div className="p-4">
            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  data-testid={`agent-item-${agent.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, { type: 'agent', id: agent.id, data: agent })}
                  onClick={() => onAgentSelect?.(agent.id)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{agent.name}</h3>
                      {agent.model && (
                        <p className="text-xs text-gray-500 truncate">{agent.model}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 