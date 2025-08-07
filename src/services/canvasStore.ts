import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { CanvasNode, CanvasEdge } from '../../schemas/chain'

export interface CanvasViewportState {
  x: number
  y: number
  zoom: number
}

export interface CanvasStoreState {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  viewport: CanvasViewportState
  selection: string[]

  setNodes: (nodes: CanvasNode[]) => void
  setEdges: (edges: CanvasEdge[]) => void
  setViewport: (viewport: Partial<CanvasViewportState>) => void
  setSelection: (ids: string[]) => void
  clear: () => void
}

export const useCanvasStore = create<CanvasStoreState>()(
  devtools((set) => ({
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    selection: [],
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setViewport: (viewport) => set((s) => ({ viewport: { ...s.viewport, ...viewport } })),
    setSelection: (ids) => set({ selection: ids }),
    clear: () => set({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 }, selection: [] }),
  }))
)


