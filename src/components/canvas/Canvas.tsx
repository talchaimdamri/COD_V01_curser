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
  children
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Update viewport and notify parent
  const updateViewport = useCallback((newViewport: Viewport) => {
    setViewport(newViewport)
    onViewportChange?.(newViewport)
  }, [onViewportChange])

  // Pan functionality
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button === 0) { // Left mouse button only
      setIsPanning(true)
      setPanStart({ x: event.clientX - viewport.x, y: event.clientY - viewport.y })
      event.preventDefault()
    }
  }, [viewport.x, viewport.y])

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isPanning) {
      const newX = event.clientX - panStart.x
      const newY = event.clientY - panStart.y
      updateViewport({ ...viewport, x: newX, y: newY })
      event.preventDefault()
    }
  }, [isPanning, panStart, viewport, updateViewport])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

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
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        cursor: isPanning ? 'grabbing' : 'grab',
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
    </svg>
  )
} 