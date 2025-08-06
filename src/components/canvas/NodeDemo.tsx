import React, { useState } from 'react'
import { Canvas } from './Canvas'
import { NodeRenderer } from './NodeRenderer'
import type { CanvasNode } from '../../../schemas/chain'

export const NodeDemo: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [nodes, setNodes] = useState<CanvasNode[]>([
    {
      id: 'doc-1',
      type: 'document',
      position: { x: 100, y: 100 },
      data: {
        title: 'Research Paper',
        content: 'This is a research paper about AI...',
        documentId: 'doc-1',
      },
      metadata: {
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      },
    },
    {
      id: 'agent-1',
      type: 'agent',
      position: { x: 400, y: 100 },
      data: {
        name: 'Research Assistant',
        prompt: 'You are a helpful research assistant',
        model: 'gpt-4',
        tools: ['search', 'calculator', 'web_browser'],
        agentId: 'agent-1',
      },
      metadata: {
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        status: 'idle',
      },
    },
    {
      id: 'doc-2',
      type: 'document',
      position: { x: 100, y: 300 },
      data: {
        title: 'Analysis Report',
        content: 'Analysis of the research findings...',
        documentId: 'doc-2',
      },
      metadata: {
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-04'),
      },
    },
    {
      id: 'agent-2',
      type: 'agent',
      position: { x: 400, y: 300 },
      data: {
        name: 'Data Analyst',
        prompt: 'You are a data analyst expert',
        model: 'claude-3-sonnet',
        tools: ['python', 'sql', 'visualization'],
        agentId: 'agent-2',
      },
      metadata: {
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-04'),
        status: 'running',
      },
    },
  ])

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(nodeId)
    console.log('Selected node:', nodeId)
  }

  const handleNodeDrag = (nodeId: string, x: number, y: number) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId
          ? { ...node, position: { x, y } }
          : node
      )
    )
  }

  const handleNodeDoubleClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (node?.type === 'document') {
      console.log('Opening document editor for:', nodeId)
      // In a real app, this would open the document editor modal
    } else if (node?.type === 'agent') {
      console.log('Opening agent editor for:', nodeId)
      // In a real app, this would open the agent editor
    }
  }

  const handleViewportChange = (viewport: { x: number; y: number; scale: number }) => {
    console.log('Viewport changed:', viewport)
  }

  return (
    <div className="w-full h-screen bg-gray-50">
      <div className="p-4 bg-white border-b">
        <h1 className="text-2xl font-bold text-gray-800">Node Components Demo</h1>
        <p className="text-gray-600 mt-2">
          Interactive demo of Document and Agent node components with drag, select, and double-click functionality.
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <p>• Click nodes to select them</p>
          <p>• Drag nodes to move them around</p>
          <p>• Double-click documents to open editor</p>
          <p>• Double-click agents to open agent editor</p>
          <p>• Use mouse wheel to zoom, drag to pan</p>
        </div>
      </div>
      
      <Canvas
        width={window.innerWidth}
        height={window.innerHeight - 200}
        onViewportChange={handleViewportChange}
      >
        {nodes.map(node => (
          <NodeRenderer
            key={node.id}
            node={node}
            isSelected={selectedNode === node.id}
            onSelect={handleNodeSelect}
            onDrag={handleNodeDrag}
            onDoubleClick={handleNodeDoubleClick}
            viewport={{ x: 0, y: 0, scale: 1 }}
          />
        ))}
      </Canvas>
    </div>
  )
} 