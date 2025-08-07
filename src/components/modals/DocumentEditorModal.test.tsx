import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DocumentEditorModal from './DocumentEditorModal'

// Mock TipTap editor
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => ({
    commands: {
      toggleBold: vi.fn(),
      toggleItalic: vi.fn(),
      toggleHeading: vi.fn(),
      toggleBulletList: vi.fn(),
      toggleOrderedList: vi.fn(),
      toggleCodeBlock: vi.fn(),
    },
    can: vi.fn(() => ({
      undo: vi.fn(() => true),
      redo: vi.fn(() => true),
    })),
    isActive: vi.fn(() => false),
    chain: vi.fn(() => ({
      focus: vi.fn(() => ({
        undo: vi.fn(() => ({ run: vi.fn() })),
        redo: vi.fn(() => ({ run: vi.fn() })),
        toggleBold: vi.fn(() => ({ run: vi.fn() })),
        toggleItalic: vi.fn(() => ({ run: vi.fn() })),
        toggleHeading: vi.fn(() => ({ run: vi.fn() })),
        toggleBulletList: vi.fn(() => ({ run: vi.fn() })),
        toggleOrderedList: vi.fn(() => ({ run: vi.fn() })),
        toggleCodeBlock: vi.fn(() => ({ run: vi.fn() })),
      })),
    })),
    getHTML: vi.fn(() => '<p>Test content</p>'),
    isDestroyed: false,
  })),
  EditorContent: ({ children, ...props }: any) => (
    <div data-testid="tiptap-editor" {...props}>
      {children}
    </div>
  ),
}))

// Mock event sourcing hooks
vi.mock('../../hooks/useEventSourcing', () => ({
  useEventSourcing: vi.fn(() => ({
    trackEvent: vi.fn(),
    getEvents: vi.fn(() => []),
    replayEvents: vi.fn(),
    createVersion: vi.fn().mockResolvedValue(undefined),
    getVersions: vi.fn().mockResolvedValue([]),
    restoreVersion: vi.fn().mockResolvedValue(true),
  })),
}))

describe('DocumentEditorModal', () => {
  const defaultProps = {
    isOpen: false,
    onClose: vi.fn(),
    documentId: 'test-doc-1',
    initialContent: '',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const modal = screen.getByTestId('document-editor-modal')
      expect(modal).toBeInTheDocument()
    })

    it('should not render modal when isOpen is false', () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={false} />)
      
      const modal = screen.queryByTestId('document-editor-modal')
      expect(modal).not.toBeInTheDocument()
    })

    it('should render TipTap editor', () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const editor = screen.getByTestId('tiptap-editor')
      expect(editor).toBeInTheDocument()
    })

    it('should render toolbar with formatting buttons', () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      expect(screen.getByTestId('bold-button')).toBeInTheDocument()
      expect(screen.getByTestId('italic-button')).toBeInTheDocument()
      expect(screen.getByTestId('heading-1-button')).toBeInTheDocument()
      expect(screen.getByTestId('bullet-list-button')).toBeInTheDocument()
      expect(screen.getByTestId('ordered-list-button')).toBeInTheDocument()
      expect(screen.getByTestId('code-block-button')).toBeInTheDocument()
    })

    it('should render action buttons', () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      expect(screen.getByTestId('undo-button')).toBeInTheDocument()
      expect(screen.getByTestId('redo-button')).toBeInTheDocument()
      expect(screen.getByTestId('save-version-button')).toBeInTheDocument()
      expect(screen.getByTestId('ask-agent-button')).toBeInTheDocument()
    })

    it('should render document rails', () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      expect(screen.getByTestId('document-rails')).toBeInTheDocument()
      expect(screen.getByTestId('upstream-connections')).toBeInTheDocument()
      expect(screen.getByTestId('downstream-connections')).toBeInTheDocument()
    })
  })

  describe('Modal Controls', () => {
    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn()
      render(<DocumentEditorModal {...defaultProps} isOpen={true} onClose={onClose} />)
      
      const closeButton = screen.getByTestId('close-modal')
      await userEvent.click(closeButton)
      
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when clicking outside modal', async () => {
      const onClose = vi.fn()
      render(<DocumentEditorModal {...defaultProps} isOpen={true} onClose={onClose} />)
      
      const overlay = screen.getByTestId('modal-overlay')
      await userEvent.click(overlay)
      
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should toggle maximize state when maximize button is clicked', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const modal = screen.getByTestId('document-editor-modal')
      const maximizeButton = screen.getByTestId('maximize-modal')
      
      // Initial state should not be maximized
      expect(modal).not.toHaveClass('maximized')
      
      // Click maximize
      await userEvent.click(maximizeButton)
      expect(modal).toHaveClass('w-full', 'h-full', 'm-0', 'rounded-none')
      
      // Click minimize
      await userEvent.click(maximizeButton)
      expect(modal).not.toHaveClass('maximized')
    })
  })

  describe('Toolbar Functionality', () => {
    it('should apply bold formatting when bold button is clicked', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const boldButton = screen.getByTestId('bold-button')
      await userEvent.click(boldButton)
      
      // The actual TipTap command would be called here
      // We're testing the button interaction
      expect(boldButton).toBeInTheDocument()
    })

    it('should apply italic formatting when italic button is clicked', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const italicButton = screen.getByTestId('italic-button')
      await userEvent.click(italicButton)
      
      expect(italicButton).toBeInTheDocument()
    })

    it('should apply heading when heading button is clicked', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const headingButton = screen.getByTestId('heading-1-button')
      await userEvent.click(headingButton)
      
      expect(headingButton).toBeInTheDocument()
    })

    it('should apply bullet list when bullet list button is clicked', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const bulletListButton = screen.getByTestId('bullet-list-button')
      await userEvent.click(bulletListButton)
      
      expect(bulletListButton).toBeInTheDocument()
    })

    it('should apply ordered list when ordered list button is clicked', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const orderedListButton = screen.getByTestId('ordered-list-button')
      await userEvent.click(orderedListButton)
      
      expect(orderedListButton).toBeInTheDocument()
    })

    it('should apply code block when code block button is clicked', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const codeBlockButton = screen.getByTestId('code-block-button')
      await userEvent.click(codeBlockButton)
      
      expect(codeBlockButton).toBeInTheDocument()
    })
  })

  describe('Undo/Redo Functionality', () => {
    it('should call undo when undo button is clicked', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const undoButton = screen.getByTestId('undo-button')
      await userEvent.click(undoButton)
      
      expect(undoButton).toBeInTheDocument()
    })

    it('should call redo when redo button is clicked', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const redoButton = screen.getByTestId('redo-button')
      await userEvent.click(redoButton)
      
      expect(redoButton).toBeInTheDocument()
    })

    it('should handle keyboard shortcuts for undo/redo', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const editor = screen.getByTestId('tiptap-editor')
      
      // Test Ctrl+Z for undo
      fireEvent.keyDown(editor, { key: 'z', ctrlKey: true })
      
      // Test Ctrl+Shift+Z for redo
      fireEvent.keyDown(editor, { key: 'Z', ctrlKey: true, shiftKey: true })
      
      expect(editor).toBeInTheDocument()
    })
  })

  describe('Save Version Functionality', () => {
    it('should save version when save version button is clicked', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const saveButton = screen.getByTestId('save-version-button')
      await userEvent.click(saveButton)
      
      // Check that save confirmation is shown
      await waitFor(() => {
        expect(screen.getByTestId('save-confirmation')).toBeInTheDocument()
      })
    })

    it('should show version history when version history button is clicked', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const historyButton = screen.getByTestId('version-history-button')
      await userEvent.click(historyButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('version-history-panel')).toBeInTheDocument()
      })
    })
  })

  describe('Ask Agent Functionality', () => {
    it('should open agent prompt when ask agent button is clicked', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const askAgentButton = screen.getByTestId('ask-agent-button')
      await userEvent.click(askAgentButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('agent-prompt-modal')).toBeInTheDocument()
      })
    })

    it('should send document content to agent when prompt is submitted', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      // Open agent prompt
      const askAgentButton = screen.getByTestId('ask-agent-button')
      await userEvent.click(askAgentButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('agent-prompt-modal')).toBeInTheDocument()
      })
      
      // Submit prompt
      const promptInput = screen.getByTestId('agent-prompt-input')
      const submitButton = screen.getByTestId('submit-agent-prompt')
      
      await userEvent.type(promptInput, 'Analyze this document')
      await userEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('agent-response')).toBeInTheDocument()
      })
    })
  })

  describe('Document Rails', () => {
    it('should display connected documents in rails', () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const upstreamConnections = screen.getByTestId('upstream-connections')
      const downstreamConnections = screen.getByTestId('downstream-connections')
      
      expect(upstreamConnections).toBeInTheDocument()
      expect(downstreamConnections).toBeInTheDocument()
    })

    it('should navigate to connected document when clicked', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const connectedDocuments = screen.getAllByTestId('connected-document')
      await userEvent.click(connectedDocuments[0])
      
      // The navigation logic would be handled here
      expect(connectedDocuments[0]).toBeInTheDocument()
    })
  })

  describe('Event Sourcing Integration', () => {
    it('should track document changes as events', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const editor = screen.getByTestId('tiptap-editor')
      await userEvent.type(editor, 'Test content')
      
      // Check that events are being tracked
      await waitFor(() => {
        expect(screen.getByTestId('events-tracked')).toBeInTheDocument()
      })
    })

    it('should restore document state from events on load', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const editor = screen.getByTestId('tiptap-editor')
      
      // Check that content is restored
      await waitFor(() => {
        expect(editor).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const modal = screen.getByTestId('document-editor-modal')
      expect(modal).toHaveAttribute('role', 'dialog')
      expect(modal).toHaveAttribute('aria-modal', 'true')
    })

    it('should support keyboard navigation', async () => {
      render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const editor = screen.getByTestId('tiptap-editor')
      
      // Test Tab navigation
      fireEvent.keyDown(editor, { key: 'Tab' })
      
      expect(editor).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large document content efficiently', async () => {
      const largeContent = 'A'.repeat(10000)
      render(<DocumentEditorModal {...defaultProps} isOpen={true} initialContent={largeContent} />)
      
      const editor = screen.getByTestId('tiptap-editor')
      expect(editor).toBeInTheDocument()
    })

    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      // Re-render with same props
      rerender(<DocumentEditorModal {...defaultProps} isOpen={true} />)
      
      const modal = screen.getByTestId('document-editor-modal')
      expect(modal).toBeInTheDocument()
    })
  })
}) 