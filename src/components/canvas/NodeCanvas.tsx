import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import type { CanvasNode } from '../../../schemas/chain'
import { Canvas, type Viewport } from './Canvas'
import { NodeRenderer } from './NodeRenderer'
import { useCanvasStore } from '../../services/canvasStore'
import { loadCanvasState, saveCanvasStateDebounced } from '../../services/canvasPersistence'

interface NodeCanvasProps {
  initialNodes: CanvasNode[]
}

function generateId(prefix: string = 'node'): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now().toString(36)}-${rand}`
}

export const NodeCanvas: React.FC<NodeCanvasProps> = ({ initialNodes }) => {
  const nodes = useCanvasStore(s => s.nodes)
  const edges = useCanvasStore(s => s.edges)
  const selection = useCanvasStore(s => s.selection)
  const storeViewport = useCanvasStore(s => s.viewport)
  const setNodes = useCanvasStore(s => s.setNodes)
  const setEdges = useCanvasStore(s => s.setEdges)
  const setViewportStore = useCanvasStore(s => s.setViewport)
  const setSelection = useCanvasStore(s => s.setSelection)

  const viewport: Viewport = { x: storeViewport.x, y: storeViewport.y, scale: storeViewport.zoom }

  const [clipboard, setClipboard] = React.useState<CanvasNode[] | null>(null)
  const clipboardRef = useRef<CanvasNode[] | null>(null)
  const selectedIdsRef = useRef<Set<string>>(new Set(selection))

  // Keep refs in sync with state to avoid async state timing in key handlers
  selectedIdsRef.current = new Set(selection)
  clipboardRef.current = clipboard

  const isSelected = useCallback((id: string) => selection.includes(id), [selection])

  const handleViewportChange = useCallback((vp: Viewport) => {
    setViewportStore({ x: vp.x, y: vp.y, zoom: vp.scale })
  }, [setViewportStore])

  const handleSelect = useCallback((nodeId: string) => {
    setSelection([nodeId])
  }, [setSelection])

  const handleToggleSelect = useCallback((nodeId: string) => {
    const set = new Set(selection)
    if (set.has(nodeId)) set.delete(nodeId)
    else set.add(nodeId)
    setSelection(Array.from(set))
  }, [selection, setSelection])

  const handleDrag = useCallback((nodeId: string, x: number, y: number) => {
    const curr = useCanvasStore.getState().nodes
    const next = curr.map(n => (n.id === nodeId ? { ...n, position: { x, y } } : n))
    setNodes(next)
  }, [setNodes])

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
    setSelection(Array.from(next))
  }, [nodes, viewport, setSelection])

  const handleDeleteSelection = useCallback(() => {
    const current = selectedIdsRef.current
    if (!current || current.size === 0) return
    const curr = useCanvasStore.getState().nodes
    const next = curr.filter(n => !current.has(n.id))
    setNodes(next)
    setSelection([])
  }, [setNodes, setSelection])

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
    const curr = useCanvasStore.getState().nodes
    setNodes([...curr, ...clones])
    setSelection(clones.map(c => c.id))
  }, [setNodes, setSelection])

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

  // Load initial state and/or seed with provided nodes on first mount
  useEffect(() => {
    const loaded = loadCanvasState()
    if (loaded) {
      setNodes(loaded.nodes)
      setEdges(loaded.edges)
      setViewportStore({ x: loaded.viewport.x, y: loaded.viewport.y, zoom: loaded.viewport.zoom })
      setSelection(loaded.selection)
    } else if (initialNodes?.length) {
      setNodes(initialNodes)
      setEdges([])
      setViewportStore({ x: 0, y: 0, zoom: 1 })
      setSelection([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save (debounced) whenever state changes
  useEffect(() => {
    saveCanvasStateDebounced({
      nodes,
      edges,
      viewport: { x: storeViewport.x, y: storeViewport.y, zoom: storeViewport.zoom },
      selection,
    })
  }, [nodes, edges, storeViewport.x, storeViewport.y, storeViewport.zoom, selection])

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


