import debounce from 'lodash.debounce'
import type { CanvasNode, CanvasEdge } from '../../schemas/chain'

export interface PersistedCanvasState {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  viewport: { x: number; y: number; zoom: number }
  selection: string[]
}

const STORAGE_KEY = 'cod_canvas_state'

export function saveCanvasState(state: PersistedCanvasState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const saveCanvasStateDebounced = debounce(saveCanvasState, 1000)

export function loadCanvasState(): PersistedCanvasState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}


