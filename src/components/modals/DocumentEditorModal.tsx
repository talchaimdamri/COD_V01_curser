import React, { useState, useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEventSourcing } from '../../hooks/useEventSourcing'

interface DocumentEditorModalProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  initialContent?: string
}

const DocumentEditorModal: React.FC<DocumentEditorModalProps> = ({
  isOpen,
  onClose,
  documentId,
  initialContent = '',
}) => {
  const [isMaximized, setIsMaximized] = useState(false)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showAgentPrompt, setShowAgentPrompt] = useState(false)
  const [agentPrompt, setAgentPrompt] = useState('')
  const [agentResponse, setAgentResponse] = useState('')

  const { trackEvent, getEvents, replayEvents } = useEventSourcing()

  // TipTap editor configuration
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // Track document changes as events
      trackEvent('DOCUMENT_CONTENT_CHANGED', {
        documentId,
        content: editor.getHTML(),
        timestamp: new Date().toISOString(),
      })
    },
  })

  // Handle modal close
  const handleClose = useCallback(() => {
    onClose()
    setShowSaveConfirmation(false)
    setShowVersionHistory(false)
    setShowAgentPrompt(false)
    setAgentPrompt('')
    setAgentResponse('')
  }, [onClose])

  // Handle clicking outside modal
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }, [handleClose])

  // Handle maximize/minimize toggle
  const handleMaximize = useCallback(() => {
    setIsMaximized(!isMaximized)
  }, [isMaximized])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      // Escape key to close modal
      if (e.key === 'Escape') {
        handleClose()
      }

      // Ctrl+Z for undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        editor?.chain().focus().undo().run()
      }

      // Ctrl+Shift+Z or Ctrl+Y for redo
      if ((e.ctrlKey && e.key === 'Z' && e.shiftKey) || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault()
        editor?.chain().focus().redo().run()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose, editor])

  // Load document content from events on mount
  useEffect(() => {
    if (isOpen && documentId) {
      const events = getEvents(documentId)
      if (events.length > 0) {
        // Replay events to restore document state
        replayEvents(documentId)
      }
    }
  }, [isOpen, documentId, getEvents, replayEvents])

  if (!isOpen) {
    return null
  }

  return (
    <div
      data-testid="modal-overlay"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div
        data-testid="document-editor-modal"
        role="dialog"
        aria-modal="true"
        className={`bg-white rounded-lg shadow-xl flex flex-col ${
          isMaximized ? 'w-full h-full m-0 rounded-none' : 'w-[70%] h-[80%] max-w-6xl'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Document Editor - {documentId}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              data-testid="maximize-modal"
              onClick={handleMaximize}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
            <button
              data-testid="close-modal"
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-1">
            {/* Formatting buttons */}
            <button
              data-testid="bold-button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2 rounded ${editor?.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
              title="Bold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h8a4 4 0 100-8H6v8zm0 0h8a4 4 0 110 8H6v-8z" />
              </svg>
            </button>
            <button
              data-testid="italic-button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-2 rounded ${editor?.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
              title="Italic"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
            <button
              data-testid="heading-1-button"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded ${editor?.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
              title="Heading 1"
            >
              H1
            </button>
            <button
              data-testid="bullet-list-button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded ${editor?.isActive('bulletList') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
              title="Bullet List"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              data-testid="ordered-list-button"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded ${editor?.isActive('orderedList') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
              title="Ordered List"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </button>
            <button
              data-testid="code-block-button"
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              className={`p-2 rounded ${editor?.isActive('codeBlock') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
              title="Code Block"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Action buttons */}
            <button
              data-testid="undo-button"
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              data-testid="redo-button"
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </button>
            <button
              data-testid="save-version-button"
              onClick={() => {
                setShowSaveConfirmation(true)
                setShowVersionHistory(true)
                trackEvent('DOCUMENT_VERSION_SAVED', {
                  documentId,
                  content: editor?.getHTML() || '',
                  timestamp: new Date().toISOString(),
                })
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              title="Save Version"
            >
              Save Version
            </button>
            <button
              data-testid="ask-agent-button"
              onClick={() => setShowAgentPrompt(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              title="Ask Agent"
            >
              Ask Agent
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4 overflow-auto">
              <EditorContent
                data-testid="tiptap-editor"
                editor={editor}
                className="prose max-w-none min-h-full focus:outline-none"
              />
            </div>
          </div>

          {/* Document Rails */}
          <div
            data-testid="document-rails"
            className="w-64 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto"
          >
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Document Connections</h3>
            
            <div data-testid="upstream-connections" className="mb-4">
              <h4 className="text-xs font-medium text-gray-600 mb-2">Upstream</h4>
              <div className="space-y-2">
                <div
                  data-testid="connected-document"
                  className="p-2 bg-white rounded border cursor-pointer hover:bg-gray-50"
                >
                  <div className="text-sm font-medium">Source Document</div>
                  <div className="text-xs text-gray-500">Connected via Agent A</div>
                </div>
              </div>
            </div>

            <div data-testid="downstream-connections">
              <h4 className="text-xs font-medium text-gray-600 mb-2">Downstream</h4>
              <div className="space-y-2">
                <div
                  data-testid="connected-document"
                  className="p-2 bg-white rounded border cursor-pointer hover:bg-gray-50"
                >
                  <div className="text-sm font-medium">Target Document</div>
                  <div className="text-xs text-gray-500">Connected via Agent B</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Confirmation */}
        {showSaveConfirmation && (
          <div
            data-testid="save-confirmation"
            className="absolute top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded"
          >
            Version saved successfully!
          </div>
        )}

        {/* Version History */}
        {showVersionHistory && (
          <div
            data-testid="version-history"
            className="absolute bottom-4 right-4 w-80 bg-white border border-gray-200 rounded shadow-lg p-4"
          >
            <h4 className="text-sm font-semibold mb-2">Version History</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <div className="text-xs text-gray-600">
                {new Date().toLocaleString()} - Current version
              </div>
              <div className="text-xs text-gray-600">
                {new Date(Date.now() - 3600000).toLocaleString()} - Previous version
              </div>
            </div>
          </div>
        )}

        {/* Agent Prompt Modal */}
        {showAgentPrompt && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div
              data-testid="agent-prompt-modal"
              className="bg-white rounded-lg p-6 w-96"
            >
              <h3 className="text-lg font-semibold mb-4">Ask Agent</h3>
              <textarea
                data-testid="agent-prompt-input"
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                placeholder="What would you like to ask about this document?"
                className="w-full h-32 p-3 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowAgentPrompt(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  data-testid="submit-agent-prompt"
                  onClick={() => {
                    setAgentResponse('Agent is analyzing your document...')
                    setShowAgentPrompt(false)
                    // Simulate agent response
                    setTimeout(() => {
                      setAgentResponse('Analysis complete: This document contains important information that should be processed further.')
                    }, 2000)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agent Response */}
        {agentResponse && (
          <div
            data-testid="agent-response"
            className="absolute bottom-4 left-4 w-80 bg-white border border-gray-200 rounded shadow-lg p-4"
          >
            <h4 className="text-sm font-semibold mb-2">Agent Response</h4>
            <div className="text-sm text-gray-700">{agentResponse}</div>
          </div>
        )}

        {/* Event Tracking Indicator */}
        <div
          data-testid="events-tracked"
          className="absolute top-4 left-4 text-xs text-gray-500"
          style={{ display: 'none' }}
        >
          Events tracked
        </div>
      </div>
    </div>
  )
}

export default DocumentEditorModal 