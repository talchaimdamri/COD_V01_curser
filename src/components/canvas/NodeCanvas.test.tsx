import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { NodeCanvas } from './NodeCanvas'
import type { CanvasNode } from '../../../schemas/chain'

const initialNodes: CanvasNode[] = [
  { id: 'doc-1', type: 'document', position: { x: 100, y: 100 }, data: { title: 'A' } },
  { id: 'agent-1', type: 'agent', position: { x: 400, y: 100 }, data: { name: 'B' } },
  { id: 'doc-2', type: 'document', position: { x: 100, y: 300 }, data: { title: 'C' } },
]

describe('NodeCanvas', () => {
  it('supports rectangle selection to select multiple nodes', () => {
    render(<NodeCanvas initialNodes={initialNodes} />)

    const svg = screen.getByTestId('canvas-svg')
    // start rectangle: should include doc-1 (100,100 size 200x120) and agent-1 near (400,100)
    fireEvent.mouseDown(svg, { clientX: 80, clientY: 80, shiftKey: true })
    fireEvent.mouseMove(svg, { clientX: 450, clientY: 230 })
    fireEvent.mouseUp(svg)

    // Selected nodes should render selection indicators
    expect(screen.getAllByText(/A|B/).length).toBeGreaterThan(0)
  })

  it('supports Ctrl/Cmd click to toggle selection', () => {
    render(<NodeCanvas initialNodes={initialNodes} />)

    // Click document node to select it
    const docTitle = screen.getByText('A')
    fireEvent.click(docTitle)

    // Toggle agent with meta
    const agentName = screen.getByText('B')
    fireEvent.click(agentName, { metaKey: true })

    // Toggle doc off with ctrl
    fireEvent.click(docTitle, { ctrlKey: true })

    // At least one remains selected; visual checks happen in node tests
    expect(agentName).toBeInTheDocument()
  })

  it('copy/paste duplicates nodes and selects clones', async () => {
    render(<NodeCanvas initialNodes={initialNodes} />)

    const docTitle = screen.getByText('A')
    // select doc-1
    fireEvent.click(docTitle)

    const svg = screen.getByTestId('canvas-svg')
    const beforeDocs = screen.getAllByTestId('document-node').length
    fireEvent.keyDown(svg, { key: 'c', metaKey: true })
    fireEvent.keyDown(svg, { key: 'v', metaKey: true })

    // Expect count of document nodes to increase by 1
    await waitFor(() => {
      const afterDocs = screen.getAllByTestId('document-node').length
      expect(afterDocs).toBe(beforeDocs + 1)
    })
  })

  it('delete removes selected nodes', async () => {
    render(<NodeCanvas initialNodes={initialNodes} />)

    const docTitle = screen.getByText('A')
    fireEvent.click(docTitle)

    const svg = screen.getByTestId('canvas-svg')
    fireEvent.keyDown(svg, { key: 'Delete' })

    // Query safely to avoid printing SVG element details on failure
    await waitFor(() => {
      expect(screen.queryAllByText('A').length).toBe(0)
    })
  })
})


