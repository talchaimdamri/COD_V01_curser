import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveCanvasState, loadCanvasState } from './canvasPersistence'

describe('canvasPersistence', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      store: new Map<string, string>(),
      getItem(key: string) { return this.store.get(key) ?? null },
      setItem(key: string, value: string) { this.store.set(key, value) },
      removeItem(key: string) { this.store.delete(key) },
      clear() { this.store.clear() },
      key: (i: number) => null,
      length: 0,
    } as any)
  })

  it('saves and loads canvas state', () => {
    const state = {
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      selection: [],
    }
    saveCanvasState(state)
    const loaded = loadCanvasState()
    expect(loaded).toEqual(state)
  })
})


