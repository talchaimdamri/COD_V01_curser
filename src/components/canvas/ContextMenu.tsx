import React, { useEffect, useRef, useState } from 'react'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  action: () => void
  disabled?: boolean
  divider?: boolean
}

interface ContextMenuProps {
  items: ContextMenuItem[]
  position: { x: number; y: number }
  onClose: () => void
  className?: string
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  position,
  onClose,
  className = '',
}) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  // Adjust position to keep menu within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let newX = position.x
      let newY = position.y

      // Adjust horizontal position if menu would overflow
      if (newX + rect.width > viewportWidth) {
        newX = viewportWidth - rect.width - 10
      }

      // Adjust vertical position if menu would overflow
      if (newY + rect.height > viewportHeight) {
        newY = viewportHeight - rect.height - 10
      }

      // Ensure menu doesn't go off-screen to the left or top
      newX = Math.max(10, newX)
      newY = Math.max(10, newY)

      setAdjustedPosition({ x: newX, y: newY })
    }
  }, [position])

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    // Register immediately so tests can observe close behavior deterministically
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [onClose])

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled) {
      item.action()
      onClose()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent, item: ContextMenuItem) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleItemClick(item)
    }
  }

  return (
    <div
      ref={menuRef}
      data-testid="context-menu"
      className={`fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-48 ${className}`}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      role="menu"
      aria-label="Context menu"
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {item.divider ? (
            <div className="border-t border-gray-200 my-1" />
          ) : (
            <button
              data-testid={`context-menu-item-${item.id}`}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center space-x-2 ${
                item.disabled ? 'text-gray-400 opacity-50 cursor-not-allowed' : 'text-gray-700'
              }`}
              onClick={() => handleItemClick(item)}
              onKeyDown={(e) => handleKeyDown(e, item)}
              disabled={item.disabled}
              role="menuitem"
              tabIndex={0}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
