import React from 'react'
import type { CanvasNode } from '../../../schemas/chain'
import { DocumentNode } from './DocumentNode'
import { AgentNode } from './AgentNode'

interface NodeRendererProps {
  node: CanvasNode
  isSelected: boolean
  onSelect: (nodeId: string) => void
  onToggleSelect?: (nodeId: string) => void
  onDrag: (nodeId: string, x: number, y: number) => void
  onDoubleClick: (nodeId: string) => void
  viewport: { x: number; y: number; scale: number }
}

export const NodeRenderer: React.FC<NodeRendererProps> = ({
  node,
  isSelected,
  onSelect,
  onToggleSelect,
  onDrag,
  onDoubleClick,
  viewport,
}) => {
  switch (node.type) {
    case 'document':
      return (
        <DocumentNode
          node={node}
          isSelected={isSelected}
          onSelect={onSelect}
          // @ts-ignore optional prop forwarded
          onToggleSelect={onToggleSelect}
          onDrag={onDrag}
          onDoubleClick={onDoubleClick}
          viewport={viewport}
        />
      )
    case 'agent':
      return (
        <AgentNode
          node={node}
          isSelected={isSelected}
          onSelect={onSelect}
          // @ts-ignore optional prop forwarded
          onToggleSelect={onToggleSelect}
          onDrag={onDrag}
          onDoubleClick={onDoubleClick}
          viewport={viewport}
        />
      )
    default:
      console.warn(`Unknown node type: ${node.type}`)
      return null
  }
} 