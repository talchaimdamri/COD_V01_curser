import React, { useCallback } from 'react'
import type { CanvasNode } from '../../../schemas/chain'

interface DocumentInspectorProps {
  node: CanvasNode
  onUpdateNode: (nodeId: string, updates: Partial<CanvasNode>) => void
}

export const DocumentInspector: React.FC<DocumentInspectorProps> = ({
  node,
  onUpdateNode,
}) => {
  // Extract document data
  const documentData = node.data || {}
  const title = documentData.title || 'Untitled Document'
  const content = documentData.content || ''
  const metadata = documentData.metadata || {}

  // Handle title change
  const handleTitleChange = useCallback((newTitle: string) => {
    onUpdateNode(node.id, {
      data: {
        ...documentData,
        title: newTitle,
      },
    })
  }, [node.id, documentData, onUpdateNode])

  // Handle content change
  const handleContentChange = useCallback((newContent: string) => {
    onUpdateNode(node.id, {
      data: {
        ...documentData,
        content: newContent,
      },
    })
  }, [node.id, documentData, onUpdateNode])

  return (
    <div className="p-4 space-y-6">
      {/* Document Title */}
      <div>
        <label htmlFor="document-title" className="block text-sm font-medium text-gray-700 mb-2">
          Document Title
        </label>
        <input
          id="document-title"
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter document title"
        />
      </div>

      {/* Document Content Preview */}
      <div>
        <label htmlFor="document-content" className="block text-sm font-medium text-gray-700 mb-2">
          Content Preview
        </label>
        <textarea
          id="document-content"
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter document content..."
        />
        <div className="mt-1 text-xs text-gray-500">
          {content.length} characters
        </div>
      </div>

      {/* Document Metadata */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Metadata
        </label>
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="text-sm text-gray-600">
            <div>Type: Document</div>
            <div>Created: {metadata.createdAt || 'Unknown'}</div>
            <div>Modified: {metadata.updatedAt || 'Unknown'}</div>
            <div>Version: {metadata.version || '1.0'}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => {
              // TODO: Implement open document editor functionality
              console.log('Open document editor:', { title, content })
            }}
          >
            Open Editor
          </button>
          <button
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => {
              // TODO: Implement save document functionality
              console.log('Save document:', { title, content })
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
} 