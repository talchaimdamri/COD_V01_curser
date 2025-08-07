import React, { useCallback, useMemo, useRef, useState } from 'react'
import type { CanvasNode } from '../../../schemas/chain'
import { Canvas, type Viewport } from './Canvas'
import { NodeRenderer } from './NodeRenderer'

interface NodeCanvasProps {
  initialNodes: CanvasNode[]
}

function generateId(prefix: string = 'node'): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now().toString(36)}-${rand}`
}

export const NodeCanvas: React.FC<NodeCanvasProps> = ({ initialNodes }) => {
  const [nodes, setNodes] = useState<CanvasNode[]>(initialNodes)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 })
  const [clipboard, setClipboard] = useState<CanvasNode[] | null>(null)
  const clipboardRef = useRef<CanvasNode[] | null>(null)
  const selectedIdsRef = useRef<Set<string>>(selectedIds)

  // Keep refs in sync with state to avoid async state timing in key handlers
  selectedIdsRef.current = selectedIds
  clipboardRef.current = clipboard

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds])

  const handleViewportChange = useCallback((vp: Viewport) => {
    setViewport(vp)
  }, [])

  const handleSelect = useCallback((nodeId: string) => {
    setSelectedIds(new Set([nodeId]))
  }, [])

  const handleToggleSelect = useCallback((nodeId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }, [])

  const handleDrag = useCallback((nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => (n.id === nodeId ? { ...n, position: { x, y } } : n)))
  }, [])

  const handleDoubleClick = useCallback((_nodeId: string) => {
    // Hook for opening editors; out of scope here
  }, [])

  // Rectangle selection in screen space (Canvas already provides screen coords)
  const handleRectangleSelection = useCallback((rect: { x: number; y: number; width: number; height: number }) => {
    const { x, y, width, height } = rect
    const rectRight = x + width
    const rectBottom = y + height

    const toScreen = (node: CanvasNode) => {
      const screenX = node.position.x * viewport.scale - viewport.x * viewport.scale
      const screenY = node.position.y * viewport.scale - viewport.y * viewport.scale
      if (node.type === 'document') {
        const w = 200 * viewport.scale
        const h = 120 * viewport.scale
        return { left: screenX, top: screenY, right: screenX + w, bottom: screenY + h }
      }
      // agent circle radius 60
      const size = 120 * viewport.scale
      return { left: screenX - size / 2, top: screenY - size / 2, right: screenX + size / 2, bottom: screenY + size / 2 }
    }

    const intersects = (a: { left: number; top: number; right: number; bottom: number }) =>
      !(a.left > rectRight || a.right < x || a.top > rectBottom || a.bottom < y)

    const next = new Set<string>()
    for (const n of nodes) {
      const bounds = toScreen(n)
      if (intersects(bounds)) next.add(n.id)
    }
    setSelectedIds(next)
  }, [nodes, viewport])

  const handleDeleteSelection = useCallback(() => {
    const current = selectedIdsRef.current
    if (!current || current.size === 0) return
    setNodes(prev => prev.filter(n => !current.has(n.id)))
    setSelectedIds(new Set())
  }, [])

  const handleCopySelection = useCallback(() => {
    const current = selectedIdsRef.current
    if (!current || current.size === 0) return
    const toCopy = nodes.filter(n => current.has(n.id))
    clipboardRef.current = toCopy
    setClipboard(toCopy)
  }, [nodes])

  const handlePaste = useCallback(() => {
    const source = clipboardRef.current
    if (!source || source.length === 0) return
    const offset = 20
    const clones = source.map(n => ({
      ...n,
      id: generateId(n.type),
      position: { x: n.position.x + offset, y: n.position.y + offset },
      data: { ...n.data },
      metadata: { ...n.metadata },
    }))
    setNodes(prev => [...prev, ...clones])
    setSelectedIds(new Set(clones.map(c => c.id)))
  }, [])

  const canvasChildren = useMemo(() => (
    nodes.map(node => (
      <NodeRenderer
        key={node.id}
        node={node}
        isSelected={isSelected(node.id)}
        onSelect={handleSelect}
        onDrag={handleDrag}
        onDoubleClick={handleDoubleClick}
        // @ts-expect-error pass-through to concrete node components via NodeRenderer
        onToggleSelect={handleToggleSelect}
        viewport={viewport}
      />
    ))
  ), [nodes, isSelected, handleSelect, handleDrag, handleDoubleClick, handleToggleSelect, viewport])

  return (
    <Canvas
      width={800}
      height={600}
      onViewportChange={handleViewportChange}
      onDeleteSelection={handleDeleteSelection}
      onCopySelection={handleCopySelection}
      onPaste={handlePaste}
      onRectangleSelection={handleRectangleSelection}
    >
      {canvasChildren}
    </Canvas>
  )
}


