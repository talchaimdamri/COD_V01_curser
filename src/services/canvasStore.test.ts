import { describe, it, expect } from 'vitest'
import { useCanvasStore } from './canvasStore'

describe('canvasStore', () => {
  it('sets and clears nodes/edges/viewport/selection', () => {
    const set = useCanvasStore.getState()
    set.setNodes([{ id: 'ck1', type: 'document', position: { x: 1, y: 2 }, data: {} } as any])
    set.setEdges([{ id: 'ce1', source: 'ck1', target: 'ck1', type: 'link' } as any])
    set.setViewport({ x: 10, y: 20, zoom: 1.5 })
    set.setSelection(['ck1'])

    const after = useCanvasStore.getState()
    expect(after.nodes.length).toBe(1)
    expect(after.edges.length).toBe(1)
    expect(after.viewport.zoom).toBe(1.5)
    expect(after.selection).toEqual(['ck1'])

    set.clear()
    const cleared = useCanvasStore.getState()
    expect(cleared.nodes.length).toBe(0)
    expect(cleared.edges.length).toBe(0)
    expect(cleared.viewport.zoom).toBe(1)
    expect(cleared.selection.length).toBe(0)
  })
})


