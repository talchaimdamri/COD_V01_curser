import React, { useState } from 'react'
import { Canvas, Viewport } from './Canvas'

export const CanvasDemo: React.FC = () => {
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 })

  const handleViewportChange = (newViewport: Viewport) => {
    setViewport(newViewport)
    console.log('Viewport changed:', newViewport)
  }

  return (
    <div className="w-full h-screen bg-gray-50 p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Canvas Demo</h2>
        <p className="text-sm text-gray-600 mb-2">
          Pan: Click and drag | Zoom: Mouse wheel | Keyboard: Arrow keys, +/-/Home
        </p>
        <div className="text-xs text-gray-500">
          Viewport: x={Math.round(viewport.x)}, y={Math.round(viewport.y)}, scale={viewport.scale.toFixed(2)}
        </div>
      </div>
      
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <Canvas
          width={800}
          height={600}
          onViewportChange={handleViewportChange}
        >
          {/* Demo content */}
          <rect
            x={100}
            y={100}
            width={200}
            height={100}
            fill="#3b82f6"
            stroke="#1d4ed8"
            strokeWidth="2"
            rx="8"
          />
          <text
            x={200}
            y={155}
            textAnchor="middle"
            fill="white"
            fontSize="16"
            fontWeight="bold"
          >
            Document Node
          </text>

          <rect
            x={400}
            y={200}
            width={150}
            height={80}
            fill="#10b981"
            stroke="#059669"
            strokeWidth="2"
            rx="8"
          />
          <text
            x={475}
            y={245}
            textAnchor="middle"
            fill="white"
            fontSize="14"
            fontWeight="bold"
          >
            Agent Node
          </text>

          <line
            x1={300}
            y1={150}
            x2={400}
            y2={200}
            stroke="#6b7280"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />

          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6b7280"
              />
            </marker>
          </defs>
        </Canvas>
      </div>
    </div>
  )
} 