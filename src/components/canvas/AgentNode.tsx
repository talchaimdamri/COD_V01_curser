import React, { useState, useCallback, useRef } from 'react'
import type { CanvasNode } from '../../../schemas/chain'
import { useEventSourcing } from '../../hooks/useEventSourcing'
import { useLongPress } from '../../hooks/useLongPress'
import { ContextMenu, type ContextMenuItem } from './ContextMenu'

interface AgentNodeProps {
  node: CanvasNode
  isSelected: boolean
  onSelect: (nodeId: string) => void
  onToggleSelect?: (nodeId: string) => void
  onDrag: (nodeId: string, x: number, y: number) => void
  onDoubleClick: (nodeId: string) => void
  onEdit?: (nodeId: string) => void
  onDelete?: (nodeId: string) => void
  viewport: { x: number; y: number; scale: number }
}

export const AgentNode: React.FC<AgentNodeProps> = ({
  node,
  isSelected,
  onSelect,
  onDrag,
  onDoubleClick,
  onEdit,
  onDelete,
  viewport,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const nodeRef = useRef<SVGGElement>(null)
  const { trackEvent } = useEventSourcing()

  // Extract data from node
  const name = node.data?.name || 'Unnamed Agent'
  const model = node.data?.model || 'unknown-model'
  const tools = node.data?.tools || []
  const status = node.metadata?.status || 'idle'
  const agentId = node.data?.agentId || node.id

  // Calculate position based on viewport - fixed calculation
  const x = node.position.x * viewport.scale - viewport.x * viewport.scale
  const y = node.position.y * viewport.scale - viewport.y * viewport.scale

  // Truncate long names - fixed truncation
  const displayName = name.length > 20 ? `${name.substring(0, 17)}...` : name

  // Format model name for display
  const formatModelName = (modelName: string): string => {
    const modelMap: Record<string, string> = {
      'gpt-4': 'GPT-4',
      'gpt-3.5-turbo': 'GPT-3.5',
      'claude-3-sonnet': 'Claude 3 Sonnet',
      'claude-3-opus': 'Claude 3 Opus',
      'claude-3-haiku': 'Claude 3 Haiku',
      'gemini-pro': 'Gemini Pro',
      'llama-2-70b': 'Llama 2 70B',
    }
    return modelMap[modelName] || 'Unknown Model'
  }

  // Get status color
  const getStatusColor = (agentStatus: string): string => {
    const statusColors: Record<string, string> = {
      idle: '#4caf50',
      running: '#ff9800',
      error: '#f44336',
      busy: '#2196f3',
    }
    return statusColors[agentStatus] || '#9e9e9e'
  }

  // Handle long press for context menu
  const handleLongPress = useCallback((event?: React.MouseEvent | React.TouchEvent) => {
    if (!event) return
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
    
    setContextMenuPosition({ x: clientX, y: clientY })
    setShowContextMenu(true)
    
    trackEvent('NODE_CONTEXT_MENU_OPENED', {
      nodeId: node.id,
      position: { x: clientX, y: clientY },
      timestamp: new Date().toISOString(),
    })
  }, [node.id, trackEvent])

  // Handle mouse down for drag start
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    // Treat undefined (testing library) or 0 as left button
    if (event.button === 0 || typeof event.button === 'undefined') {
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
      if ((event.metaKey || event.ctrlKey) && typeof onToggleSelect === 'function') {
        onToggleSelect(node.id)
      } else {
        onSelect(node.id)
      }
      trackEvent('NODE_SELECTED', {
        nodeId: node.id,
        timestamp: new Date().toISOString(),
      })
    }
    event.stopPropagation()
  }, [isDragging, onSelect, node.id, trackEvent])

  // Handle context menu actions
  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit(node.id)
      trackEvent('NODE_EDIT_REQUESTED', {
        nodeId: node.id,
        timestamp: new Date().toISOString(),
      })
    }
  }, [onEdit, node.id, trackEvent])

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(node.id)
      trackEvent('NODE_DELETE_REQUESTED', {
        nodeId: node.id,
        timestamp: new Date().toISOString(),
      })
    }
  }, [onDelete, node.id, trackEvent])

  // Context menu items
  const contextMenuItems: ContextMenuItem[] = [
    {
      id: 'edit',
      label: 'Edit Agent',
      action: handleEdit,
      disabled: !onEdit,
    },
    {
      id: 'delete',
      label: 'Delete Agent',
      action: handleDelete,
      disabled: !onDelete,
    },
  ]

  // Long press handlers
  const longPressHandlers = useLongPress({
    onLongPress: handleLongPress,
    onPress: handleClick,
    ms: 500,
    preventDefault: false,
  })

  // Combine drag and long-press handlers so neither overrides the other
  const handleCombinedMouseDown = useCallback((event: React.MouseEvent) => {
    handleMouseDown(event)
    longPressHandlers.onMouseDown(event)
  }, [handleMouseDown, longPressHandlers])

  const handleCombinedMouseUp = useCallback((event: React.MouseEvent) => {
    handleMouseUp()
    longPressHandlers.onMouseUp(event)
  }, [handleMouseUp, longPressHandlers])

  const handleCombinedMouseLeave = useCallback(() => {
    longPressHandlers.onMouseLeave()
  }, [longPressHandlers])

  // Handle double click for agent editor
  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    onDoubleClick(node.id)
    trackEvent('NODE_DOUBLE_CLICKED', {
      nodeId: node.id,
      action: 'open_agent_editor',
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
    <>
      <g
        ref={nodeRef}
        data-testid="agent-node"
        data-dragging={isDragging}
        className={`agent-node ${isSelected ? 'selected' : ''}`}
        transform={`translate(${x}, ${y}) scale(${viewport.scale})`}
        onMouseDown={handleCombinedMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleCombinedMouseUp}
        onMouseLeave={handleCombinedMouseLeave}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Agent: ${name} (${formatModelName(model)})`}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
      {/* Agent background circle */}
      <circle
        data-testid="agent-circle"
        cx={0}
        cy={0}
        r={60}
        fill={isSelected ? '#f3e5f5' : '#ffffff'}
        stroke={isSelected ? '#9c27b0' : '#e0e0e0'}
        strokeWidth={isSelected ? 3 : 2}
        className="agent-background"
      />

      {/* Agent icon */}
      <g data-testid="agent-icon" transform="translate(-8, -8)">
        <circle cx={8} cy={8} r={6} fill="#9c27b0" />
        <circle cx={6} cy={6} r={1.5} fill="#fff" />
        <circle cx={10} cy={6} r={1.5} fill="#fff" />
        <path d="M 5 10 Q 8 13 11 10" stroke="#fff" strokeWidth={1.5} fill="none" />
      </g>

      {/* Agent name */}
      <text
        x={0}
        y={20}
        textAnchor="middle"
        fontSize={12}
        fontWeight="600"
        fill="#333"
        className="agent-name"
      >
        {displayName}
      </text>

      {/* Model name */}
      <text
        x={0}
        y={40}
        textAnchor="middle"
        fontSize={10}
        fill="#666"
        className="agent-model"
      >
        {formatModelName(model)}
      </text>

      {/* Tools count */}
      <text
        x={0}
        y={55}
        textAnchor="middle"
        fontSize={9}
        fill="#888"
        className="agent-tools"
      >
        {tools.length} tools
      </text>

      {/* Status indicator */}
      <circle
        data-testid="status-indicator"
        cx={45}
        cy={-45}
        r={8}
        fill={getStatusColor(status)}
        stroke="#fff"
        strokeWidth={2}
        className={`status-indicator status-${status}`}
      />

      {/* Status text */}
      <text
        x={45}
        y={-42}
        textAnchor="middle"
        fontSize={8}
        fill="#fff"
        fontWeight="bold"
        className="status-text"
      >
        {status.charAt(0).toUpperCase()}
      </text>

      {/* Connection points for edges */}
      <circle
        cx={-60}
        cy={0}
        r={4}
        fill="transparent"
        stroke="#9c27b0"
        strokeWidth={2}
        className="connection-point connection-point-left"
        style={{ opacity: isSelected ? 1 : 0 }}
      />
      <circle
        cx={60}
        cy={0}
        r={4}
        fill="transparent"
        stroke="#9c27b0"
        strokeWidth={2}
        className="connection-point connection-point-right"
        style={{ opacity: isSelected ? 1 : 0 }}
      />

      {/* Selection indicator */}
      {isSelected && (
        <circle
          cx={0}
          cy={0}
          r={68}
          fill="none"
          stroke="#9c27b0"
          strokeWidth={2}
          strokeDasharray="5,5"
          className="selection-indicator"
        />
      )}

      {/* Agent ID (small text) */}
      <text
        x={0}
        y={70}
        textAnchor="middle"
        fontSize={8}
        fill="#999"
        className="agent-id"
      >
        {agentId}
      </text>
      </g>

      {/* Context Menu */}
      {showContextMenu && (
        <ContextMenu
          items={contextMenuItems}
          position={contextMenuPosition}
          onClose={() => setShowContextMenu(false)}
        />
      )}
    </>
  )
} 