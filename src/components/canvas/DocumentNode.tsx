import React, { useState, useCallback, useRef } from 'react'
import type { CanvasNode } from '../../../schemas/chain'
import { useEventSourcing } from '../../hooks/useEventSourcing'

interface DocumentNodeProps {
  node: CanvasNode
  isSelected: boolean
  onSelect: (nodeId: string) => void
  onDrag: (nodeId: string, x: number, y: number) => void
  onDoubleClick: (nodeId: string) => void
  viewport: { x: number; y: number; scale: number }
}

export const DocumentNode: React.FC<DocumentNodeProps> = ({
  node,
  isSelected,
  onSelect,
  onDrag,
  onDoubleClick,
  viewport,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const nodeRef = useRef<SVGGElement>(null)
  const { trackEvent } = useEventSourcing()

  // Extract data from node
  const title = node.data?.title || 'Untitled Document'
  const documentId = node.data?.documentId || node.id

  // Calculate position based on viewport - fixed calculation
  const x = node.position.x * viewport.scale - viewport.x * viewport.scale
  const y = node.position.y * viewport.scale - viewport.y * viewport.scale

  // Truncate long titles - fixed truncation
  const displayTitle = title.length > 30 ? `${title.substring(0, 27)}...` : title

  // Handle mouse down for drag start
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button === 0) { // Left mouse button only
      setIsDragging(true)
      setDragStart({
        x: event.clientX - node.position.x,
        y: event.clientY - node.position.y,
      })
      event.preventDefault()
      event.stopPropagation()
    }
  }, [node.position.x, node.position.y])

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isDragging) {
      const newX = event.clientX - dragStart.x
      const newY = event.clientY - dragStart.y
      onDrag(node.id, newX, newY)
      
      // Track drag event
      trackEvent('NODE_DRAGGED', {
        nodeId: node.id,
        position: { x: newX, y: newY },
        timestamp: new Date().toISOString(),
      })
    }
  }, [isDragging, dragStart, onDrag, node.id, trackEvent])

  // Handle mouse up for drag end
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      trackEvent('NODE_DRAG_ENDED', {
        nodeId: node.id,
        position: node.position,
        timestamp: new Date().toISOString(),
      })
    }
  }, [isDragging, node.id, node.position, trackEvent])

  // Handle click for selection
  const handleClick = useCallback((event: React.MouseEvent) => {
    if (!isDragging) {
      onSelect(node.id)
      trackEvent('NODE_SELECTED', {
        nodeId: node.id,
        timestamp: new Date().toISOString(),
      })
    }
    event.stopPropagation()
  }, [isDragging, onSelect, node.id, trackEvent])

  // Handle double click for document editor
  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    onDoubleClick(node.id)
    trackEvent('NODE_DOUBLE_CLICKED', {
      nodeId: node.id,
      action: 'open_document_editor',
      timestamp: new Date().toISOString(),
    })
    event.stopPropagation()
  }, [onDoubleClick, node.id, trackEvent])

  // Handle context menu prevention
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(node.id)
    }
  }, [onSelect, node.id])

  return (
    <g
      ref={nodeRef}
      data-testid="document-node"
      data-dragging={isDragging}
      className={`document-node ${isSelected ? 'selected' : ''}`}
      transform={`translate(${x}, ${y}) scale(${viewport.scale})`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Document: ${title}`}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Document background rectangle */}
      <rect
        data-testid="document-rect"
        x={0}
        y={0}
        width={200}
        height={120}
        rx={8}
        ry={8}
        fill={isSelected ? '#e3f2fd' : '#ffffff'}
        stroke={isSelected ? '#2196f3' : '#e0e0e0'}
        strokeWidth={isSelected ? 3 : 2}
        className="document-background"
      />

      {/* Document icon */}
      <g data-testid="document-icon" transform="translate(20, 20)">
        <rect x={0} y={0} width={16} height={20} fill="#666" rx={1} />
        <rect x={2} y={2} width={12} height={2} fill="#fff" />
        <rect x={2} y={6} width={8} height={1} fill="#fff" />
        <rect x={2} y={8} width={10} height={1} fill="#fff" />
        <rect x={2} y={10} width={6} height={1} fill="#fff" />
        <rect x={2} y={12} width={8} height={1} fill="#fff" />
        <rect x={2} y={14} width={4} height={1} fill="#fff" />
        <rect x={2} y={16} width={6} height={1} fill="#fff" />
      </g>

      {/* Document title */}
      <text
        x={100}
        y={70}
        textAnchor="middle"
        fontSize={14}
        fontWeight="600"
        fill="#333"
        className="document-title"
      >
        {displayTitle}
      </text>

      {/* Document ID */}
      <text
        x={100}
        y={90}
        textAnchor="middle"
        fontSize={10}
        fill="#666"
        className="document-id"
      >
        {documentId}
      </text>

      {/* Connection points for edges */}
      <circle
        cx={0}
        cy={60}
        r={4}
        fill="transparent"
        stroke="#2196f3"
        strokeWidth={2}
        className="connection-point connection-point-left"
        style={{ opacity: isSelected ? 1 : 0 }}
      />
      <circle
        cx={200}
        cy={60}
        r={4}
        fill="transparent"
        stroke="#2196f3"
        strokeWidth={2}
        className="connection-point connection-point-right"
        style={{ opacity: isSelected ? 1 : 0 }}
      />

      {/* Selection indicator */}
      {isSelected && (
        <rect
          x={-4}
          y={-4}
          width={208}
          height={128}
          fill="none"
          stroke="#2196f3"
          strokeWidth={2}
          strokeDasharray="5,5"
          className="selection-indicator"
        />
      )}
    </g>
  )
} 