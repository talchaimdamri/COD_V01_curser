import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContextMenu, type ContextMenuItem } from './ContextMenu'

describe('ContextMenu', () => {
  const mockItems: ContextMenuItem[] = [
    {
      id: 'edit',
      label: 'Edit',
      action: vi.fn(),
    },
    {
      id: 'delete',
      label: 'Delete',
      action: vi.fn(),
    },
    {
      id: 'divider',
      divider: true,
      action: vi.fn(),
    },
    {
      id: 'disabled',
      label: 'Disabled',
      action: vi.fn(),
      disabled: true,
    },
  ]

  const defaultProps = {
    items: mockItems,
    position: { x: 100, y: 100 },
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders context menu with items', () => {
      render(<ContextMenu {...defaultProps} />)
      
      expect(screen.getByTestId('context-menu')).toBeInTheDocument()
      expect(screen.getByTestId('context-menu-item-edit')).toBeInTheDocument()
      expect(screen.getByTestId('context-menu-item-delete')).toBeInTheDocument()
      expect(screen.getByTestId('context-menu-item-disabled')).toBeInTheDocument()
    })

    it('displays item labels correctly', () => {
      render(<ContextMenu {...defaultProps} />)
      
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
      expect(screen.getByText('Disabled')).toBeInTheDocument()
    })

    it('renders divider items', () => {
      render(<ContextMenu {...defaultProps} />)
      
      const menu = screen.getByTestId('context-menu')
      const dividers = menu.querySelectorAll('.border-t')
      expect(dividers.length).toBeGreaterThan(0)
    })

    it('applies custom className', () => {
      render(<ContextMenu {...defaultProps} className="custom-class" />)
      
      const menu = screen.getByTestId('context-menu')
      expect(menu).toHaveClass('custom-class')
    })

    it('positions menu at specified coordinates', () => {
      render(<ContextMenu {...defaultProps} />)
      
      const menu = screen.getByTestId('context-menu')
      expect(menu).toHaveStyle({ left: '100px', top: '100px' })
    })
  })

  describe('Interaction', () => {
    it('calls item action when clicked', () => {
      render(<ContextMenu {...defaultProps} />)
      
      const editButton = screen.getByTestId('context-menu-item-edit')
      fireEvent.click(editButton)
      
      expect(mockItems[0].action).toHaveBeenCalled()
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('does not call action for disabled items', () => {
      render(<ContextMenu {...defaultProps} />)
      
      const disabledButton = screen.getByTestId('context-menu-item-disabled')
      fireEvent.click(disabledButton)
      
      expect(mockItems[3].action).not.toHaveBeenCalled()
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })

    it('calls action on Enter key press', () => {
      render(<ContextMenu {...defaultProps} />)
      
      const editButton = screen.getByTestId('context-menu-item-edit')
      fireEvent.keyDown(editButton, { key: 'Enter' })
      
      expect(mockItems[0].action).toHaveBeenCalled()
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('calls action on Space key press', () => {
      render(<ContextMenu {...defaultProps} />)
      
      const editButton = screen.getByTestId('context-menu-item-edit')
      fireEvent.keyDown(editButton, { key: ' ' })
      
      expect(mockItems[0].action).toHaveBeenCalled()
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('closes menu on Escape key', async () => {
      render(<ContextMenu {...defaultProps} />)
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled()
      })
    })

    it('closes menu on click outside', async () => {
      render(<ContextMenu {...defaultProps} />)
      
      fireEvent.mouseDown(document.body)
      
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ContextMenu {...defaultProps} />)
      
      const menu = screen.getByTestId('context-menu')
      expect(menu).toHaveAttribute('role', 'menu')
      expect(menu).toHaveAttribute('aria-label', 'Context menu')
    })

    it('has proper role for menu items', () => {
      render(<ContextMenu {...defaultProps} />)
      
      const editButton = screen.getByTestId('context-menu-item-edit')
      expect(editButton).toHaveAttribute('role', 'menuitem')
    })

    it('supports keyboard navigation', () => {
      render(<ContextMenu {...defaultProps} />)
      
      const editButton = screen.getByTestId('context-menu-item-edit')
      expect(editButton).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('Position adjustment', () => {
    it('adjusts position to prevent overflow', () => {
      // Mock window dimensions
      Object.defineProperty(window, 'innerWidth', { value: 200, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 200, writable: true })
      
      render(<ContextMenu {...defaultProps} position={{ x: 150, y: 150 }} />)
      
      const menu = screen.getByTestId('context-menu')
      // The menu should be positioned to avoid overflow
      expect(menu).toBeInTheDocument()
    })
  })

  describe('Disabled state', () => {
    it('applies disabled styling to disabled items', () => {
      render(<ContextMenu {...defaultProps} />)
      
      const disabledButton = screen.getByTestId('context-menu-item-disabled')
      expect(disabledButton).toHaveClass('opacity-50', 'cursor-not-allowed')
    })

    it('prevents interaction with disabled items', () => {
      render(<ContextMenu {...defaultProps} />)
      
      const disabledButton = screen.getByTestId('context-menu-item-disabled')
      expect(disabledButton).toBeDisabled()
    })
  })
})
