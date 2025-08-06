import React from 'react'
import { Edge } from './Edge'
import type { CanvasEdge, CanvasNode } from '../../../schemas/chain'

interface EdgeRendererProps {
  edges: CanvasEdge[]
  nodes: CanvasNode[]
  selectedEdgeId?: string
  onSelectEdge: (edgeId: string) => void
  viewport: { x: number; y: number; scale: number }
}

export const EdgeRenderer: React.FC<EdgeRendererProps> = ({
  edges,
  nodes,
  selectedEdgeId,
  onSelectEdge,
  viewport,
}) => {
  // Create a map of nodes for quick lookup
  const nodeMap = React.useMemo(() => {
    const map = new Map<string, CanvasNode>()
    nodes.forEach(node => map.set(node.id, node))
    return map
  }, [nodes])

  // Filter out edges where source or target nodes don't exist
  const validEdges = React.useMemo(() => {
    return edges.filter(edge => {
      const sourceNode = nodeMap.get(edge.source)
      const targetNode = nodeMap.get(edge.target)
      return sourceNode && targetNode
    })
  }, [edges, nodeMap])

  return (
    <g data-testid="edge-renderer">
      {validEdges.map(edge => {
        const sourceNode = nodeMap.get(edge.source)!
        const targetNode = nodeMap.get(edge.target)!
        
        return (
          <Edge
            key={edge.id}
            edge={edge}
            sourceNode={sourceNode}
            targetNode={targetNode}
            isSelected={selectedEdgeId === edge.id}
            onSelect={onSelectEdge}
            viewport={viewport}
          />
        )
      })}
    </g>
  )
} 