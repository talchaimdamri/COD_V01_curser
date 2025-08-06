import React, { useMemo } from 'react'
import type { CanvasEdge } from '../../../schemas/chain'
import { useEventSourcing } from '../../hooks/useEventSourcing'

interface EdgeProps {
  edge: CanvasEdge
  sourceNode: { position: { x: number; y: number }; type: string }
  targetNode: { position: { x: number; y: number }; type: string }
  isSelected: boolean
  onSelect: (edgeId: string) => void
  viewport: { x: number; y: number; scale: number }
}

export const Edge: React.FC<EdgeProps> = ({
  edge,
  sourceNode,
  targetNode,
  isSelected,
  onSelect,
  viewport,
}) => {
  const { trackEvent } = useEventSourcing()

  // Calculate positions based on viewport
  const sourceX = sourceNode.position.x * viewport.scale - viewport.x * viewport.scale
  const sourceY = sourceNode.position.y * viewport.scale - viewport.y * viewport.scale
  const targetX = targetNode.position.x * viewport.scale - viewport.x * viewport.scale
  const targetY = targetNode.position.y * viewport.scale - viewport.y * viewport.scale

  // Calculate connection points based on node types
  const getConnectionPoints = useMemo(() => {
    const sourceType = sourceNode.type
    const targetType = targetNode.type

    // Calculate base positions
    let sourcePoint = { x: sourceX, y: sourceY }
    let targetPoint = { x: targetX, y: targetY }

    // Adjust source point based on source node type
    if (sourceType === 'document') {
      sourcePoint = { x: sourceX + 200, y: sourceY + 60 } // Right side of document
    } else if (sourceType === 'agent') {
      sourcePoint = { x: sourceX + 60, y: sourceY } // Right side of agent circle
    }

    // Adjust target point based on target node type
    if (targetType === 'document') {
      targetPoint = { x: targetX, y: targetY + 60 } // Left side of document
    } else if (targetType === 'agent') {
      targetPoint = { x: targetX - 60, y: targetY } // Left side of agent circle
    }

    return { sourcePoint, targetPoint }
  }, [sourceX, sourceY, targetX, targetY, sourceNode.type, targetNode.type])

  // Calculate bezier curve control points
  const getBezierPath = useMemo(() => {
    const { sourcePoint, targetPoint } = getConnectionPoints
    
    // Calculate distance between points
    const dx = targetPoint.x - sourcePoint.x
    const dy = targetPoint.y - sourcePoint.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Control point offset (1/3 of distance)
    const offset = Math.max(distance * 0.33, 50)
    
    // Control points for smooth curve
    const controlPoint1 = {
      x: sourcePoint.x + offset,
      y: sourcePoint.y
    }
    const controlPoint2 = {
      x: targetPoint.x - offset,
      y: targetPoint.y
    }
    
    return `M ${sourcePoint.x} ${sourcePoint.y} C ${controlPoint1.x} ${controlPoint1.y} ${controlPoint2.x} ${controlPoint2.y} ${targetPoint.x} ${targetPoint.y}`
  }, [getConnectionPoints])

  // Get edge color based on type and selection
  const getEdgeColor = () => {
    if (isSelected) return '#2196f3'
    
    const edgeType = edge.type || 'default'
    const typeColors: Record<string, string> = {
      'document-to-agent': '#4caf50',
      'agent-to-document': '#ff9800',
      'agent-to-agent': '#9c27b0',
      'document-to-document': '#2196f3',
      'default': '#666'
    }
    
    return typeColors[edgeType] || typeColors.default
  }

  // Handle edge click
  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onSelect(edge.id)
    trackEvent('EDGE_SELECTED', {
      edgeId: edge.id,
      timestamp: new Date().toISOString(),
    })
  }

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      onSelect(edge.id)
    }
  }

  return (
    <g
      data-testid="edge"
      className={`edge ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Edge from ${edge.source} to ${edge.target}`}
    >
      {/* Main edge path */}
      <path
        data-testid="edge-path"
        d={getBezierPath}
        fill="none"
        stroke={getEdgeColor()}
        strokeWidth={isSelected ? 3 : 2}
        className="edge-path"
        style={{ cursor: 'pointer' }}
      />

      {/* Arrow marker at the end */}
      <defs>
        <marker
          id={`arrow-${edge.id}`}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0,0 0,6 9,3"
            fill={getEdgeColor()}
          />
        </marker>
      </defs>

      {/* Edge path with arrow */}
      <path
        data-testid="edge-path-with-arrow"
        d={getBezierPath}
        fill="none"
        stroke={getEdgeColor()}
        strokeWidth={isSelected ? 3 : 2}
        markerEnd={`url(#arrow-${edge.id})`}
        className="edge-path-with-arrow"
      />

      {/* Selection indicator */}
      {isSelected && (
        <path
          d={getBezierPath}
          fill="none"
          stroke="#2196f3"
          strokeWidth={6}
          strokeDasharray="5,5"
          opacity={0.3}
          className="selection-indicator"
        />
      )}

      {/* Edge label */}
      {edge.label && (
        <text
          x={(getConnectionPoints.sourcePoint.x + getConnectionPoints.targetPoint.x) / 2}
          y={(getConnectionPoints.sourcePoint.y + getConnectionPoints.targetPoint.y) / 2 - 10}
          textAnchor="middle"
          fontSize={12}
          fill="#333"
          className="edge-label"
          style={{ pointerEvents: 'none' }}
        >
          {edge.label}
        </text>
      )}
    </g>
  )
} 