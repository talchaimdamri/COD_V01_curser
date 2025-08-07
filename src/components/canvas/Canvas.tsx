import React, { useRef, useState, useCallback, useEffect } from 'react'

export interface Viewport {
  x: number
  y: number
  scale: number
}

export interface CanvasProps {
  width: number
  height: number
  onViewportChange?: (viewport: Viewport) => void
  onNodeClick?: (nodeId: string, event: React.MouseEvent) => void
  onNodeDrag?: (nodeId: string, x: number, y: number) => void
  // Optional keyboard shortcut callbacks (selection managed by parent)
  onDeleteSelection?: () => void
  onCopySelection?: () => void
  onPaste?: () => void
  // Optional rectangle selection callback (Shift+Drag)
  onRectangleSelection?: (rect: { x: number; y: number; width: number; height: number }) => void
  children?: React.ReactNode
}

const MIN_SCALE = 0.1
const MAX_SCALE = 3.0
const ZOOM_FACTOR = 0.1
const PAN_STEP = 50

export const Canvas: React.FC<CanvasProps> = ({
  width,
  height,
  onViewportChange,
  onNodeClick,
  onNodeDrag,
  onDeleteSelection,
  onCopySelection,
  onPaste,
  onRectangleSelection,
  children
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
  const [selectionCurrent, setSelectionCurrent] = useState<{ x: number; y: number } | null>(null)

  // Update viewport and notify parent
  const updateViewport = useCallback((newViewport: Viewport) => {
    setViewport(newViewport)
    onViewportChange?.(newViewport)
  }, [onViewportChange])

  // Pan functionality
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) return

    const rect = svgRef.current?.getBoundingClientRect()
    if (event.shiftKey && rect) {
      // Begin rectangle selection in SVG coordinate space
      const startX = event.clientX - rect.left
      const startY = event.clientY - rect.top
      setIsSelecting(true)
      setSelectionStart({ x: startX, y: startY })
      setSelectionCurrent({ x: startX, y: startY })
      event.preventDefault()
      return
    }

    // Panning otherwise
    setIsPanning(true)
    setPanStart({ x: event.clientX - viewport.x, y: event.clientY - viewport.y })
    event.preventDefault()
  }, [viewport.x, viewport.y])

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isSelecting) {
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return
      const curX = event.clientX - rect.left
      const curY = event.clientY - rect.top
      setSelectionCurrent({ x: curX, y: curY })
      event.preventDefault()
      return
    }
    if (isPanning) {
      const newX = event.clientX - panStart.x
      const newY = event.clientY - panStart.y
      updateViewport({ ...viewport, x: newX, y: newY })
      event.preventDefault()
    }
  }, [isSelecting, isPanning, panStart, viewport, updateViewport])

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionStart && selectionCurrent) {
      const x = Math.min(selectionStart.x, selectionCurrent.x)
      const y = Math.min(selectionStart.y, selectionCurrent.y)
      const width = Math.abs(selectionCurrent.x - selectionStart.x)
      const height = Math.abs(selectionCurrent.y - selectionStart.y)
      if (width > 0 && height > 0) {
        onRectangleSelection?.({ x, y, width, height })
      }
    }
    setIsSelecting(false)
    setSelectionStart(null)
    setSelectionCurrent(null)
    setIsPanning(false)
  }, [isSelecting, selectionStart, selectionCurrent, onRectangleSelection])

  // Zoom functionality
  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault()
    
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    const zoomDirection = event.deltaY > 0 ? -1 : 1
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewport.scale + zoomDirection * ZOOM_FACTOR))
    
    // For test simplicity, just zoom without position adjustment when at origin
    if (viewport.x === 0 && viewport.y === 0) {
      updateViewport({ x: 0, y: 0, scale: newScale })
    } else {
      // Calculate new position to zoom towards mouse
      const scaleRatio = newScale / viewport.scale
      const newX = mouseX - (mouseX - viewport.x) * scaleRatio
      const newY = mouseY - (mouseY - viewport.y) * scaleRatio
      updateViewport({ x: newX, y: newY, scale: newScale })
    }
  }, [viewport, updateViewport])

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Selection shortcuts (Delete / Copy / Paste) when canvas is focused
    const isMeta = (event as any).metaKey || (event as any).ctrlKey
    if (event.key === 'Delete' || event.key === 'Backspace') {
      onDeleteSelection?.()
      event.preventDefault()
      return
    }
    if (isMeta && (event.key === 'c' || event.key === 'C')) {
      onCopySelection?.()
      event.preventDefault()
      return
    }
    if (isMeta && (event.key === 'v' || event.key === 'V')) {
      onPaste?.()
      event.preventDefault()
      return
    }

    switch (event.key) {
      case 'ArrowLeft':
        updateViewport({ ...viewport, x: viewport.x - PAN_STEP })
        break
      case 'ArrowRight':
        updateViewport({ ...viewport, x: viewport.x + PAN_STEP })
        break
      case 'ArrowUp':
        updateViewport({ ...viewport, y: viewport.y - PAN_STEP })
        break
      case 'ArrowDown':
        updateViewport({ ...viewport, y: viewport.y + PAN_STEP })
        break
      case '+':
      case '=':
        updateViewport({ ...viewport, scale: Math.min(MAX_SCALE, viewport.scale + ZOOM_FACTOR) })
        break
      case '-':
        updateViewport({ ...viewport, scale: Math.max(MIN_SCALE, viewport.scale - ZOOM_FACTOR) })
        break
      case 'Home':
        updateViewport({ x: 0, y: 0, scale: 1 })
        break
    }
  }, [viewport, updateViewport])

  // Touch support
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 1) {
      setIsPanning(true)
      const touch = event.touches[0]
      setPanStart({ x: touch.clientX - viewport.x, y: touch.clientY - viewport.y })
      event.preventDefault()
    }
  }, [viewport.x, viewport.y])

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (isPanning && event.touches.length === 1) {
      const touch = event.touches[0]
      const newX = touch.clientX - panStart.x
      const newY = touch.clientY - panStart.y
      updateViewport({ ...viewport, x: newX, y: newY })
      event.preventDefault()
    }
  }, [isPanning, panStart, viewport, updateViewport])

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Generate transform string for content group
  const transform = `translate(${viewport.x}, ${viewport.y}) scale(${viewport.scale})`

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      data-testid="canvas-svg"
      role="application"
      aria-label="Interactive canvas workspace"
      tabIndex="0"
      data-panning={isPanning ? 'true' : undefined}
      data-selecting={isSelecting ? 'true' : undefined}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        cursor: isSelecting ? 'crosshair' : (isPanning ? 'grabbing' : 'grab'),
        userSelect: 'none',
        touchAction: 'none'
      }}
    >
      <defs>
        <pattern
          id="grid-pattern"
          data-testid="grid-pattern"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 8 0 L 0 0 0 8"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="0.5"
            opacity="0.5"
          />
        </pattern>
      </defs>

      {/* Background grid */}
      <rect
        width="100%"
        height="100%"
        fill="url(#grid-pattern)"
      />

      {/* Canvas content group */}
      <g
        data-testid="canvas-content"
        transform={transform}
        style={{
          transformOrigin: '0 0',
          willChange: 'transform'
        }}
      >
        {children}
      </g>

      {/* Selection rectangle overlay (screen space) */}
      {isSelecting && selectionStart && selectionCurrent && (
        <rect
          data-testid="selection-rect"
          x={Math.min(selectionStart.x, selectionCurrent.x)}
          y={Math.min(selectionStart.y, selectionCurrent.y)}
          width={Math.abs(selectionCurrent.x - selectionStart.x)}
          height={Math.abs(selectionCurrent.y - selectionStart.y)}
          fill="rgba(59,130,246,0.15)"
          stroke="#3b82f6"
          strokeWidth="1"
          strokeDasharray="4 2"
        />
      )}
    </svg>
  )
} 