import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StreamingOutput from './StreamingOutput'
import { AgentExecution } from '../../../schemas/agent'

// Mock fetch
global.fetch = vi.fn()

describe('StreamingOutput', () => {
  const mockExecution: AgentExecution = {
    agentId: 'test-agent',
    input: 'Test input',
    metadata: { userId: 'test-user' }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with initial connecting state', () => {
    render(<StreamingOutput execution={mockExecution} />)
    
    expect(screen.getByText('Connecting')).toBeInTheDocument()
    expect(screen.getByText('Agent: test-agent')).toBeInTheDocument()
  })

  it('shows connecting state when starting', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn().mockReturnValue({
          read: vi.fn().mockResolvedValue({ done: true }),
          releaseLock: vi.fn()
        })
      }
    }
    
    ;(fetch as any).mockResolvedValue(mockResponse)

    render(<StreamingOutput execution={mockExecution} />)
    
    await waitFor(() => {
      expect(screen.getByText('Connecting to agent...')).toBeInTheDocument()
    })
  })

  it('displays streaming content', async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: {"type":"content","content":"Hello"}\n\n')
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: {"type":"content","content":" World"}\n\n')
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: [DONE]\n\n')
        })
        .mockResolvedValue({ done: true }),
      releaseLock: vi.fn()
    }

    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn().mockReturnValue(mockReader)
      }
    }
    
    ;(fetch as any).mockResolvedValue(mockResponse)

    render(<StreamingOutput execution={mockExecution} />)
    
    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument()
    })
  })

  it('handles errors gracefully', async () => {
    const mockResponse = {
      ok: false,
      status: 500
    }
    
    ;(fetch as any).mockResolvedValue(mockResponse)

    const onError = vi.fn()
    render(<StreamingOutput execution={mockExecution} onError={onError} />)
    
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument()
      expect(onError).toHaveBeenCalled()
    })
  })

  it('shows stop button during streaming', async () => {
    const mockReader = {
      read: vi.fn().mockResolvedValue({ done: true }),
      releaseLock: vi.fn()
    }

    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn().mockReturnValue(mockReader)
      }
    }
    
    ;(fetch as any).mockResolvedValue(mockResponse)

    render(<StreamingOutput execution={mockExecution} />)
    
    await waitFor(() => {
      expect(screen.getByText('Stop')).toBeInTheDocument()
    })
  })

  it('shows clear button after completion', async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: [DONE]\n\n')
        })
        .mockResolvedValue({ done: true }),
      releaseLock: vi.fn()
    }

    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn().mockReturnValue(mockReader)
      }
    }
    
    ;(fetch as any).mockResolvedValue(mockResponse)

    render(<StreamingOutput execution={mockExecution} />)
    
    await waitFor(() => {
      expect(screen.getByText('Clear')).toBeInTheDocument()
    })
  })

  it('calls onComplete when streaming finishes', async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: [DONE]\n\n')
        })
        .mockResolvedValue({ done: true }),
      releaseLock: vi.fn()
    }

    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn().mockReturnValue(mockReader)
      }
    }
    
    ;(fetch as any).mockResolvedValue(mockResponse)

    const onComplete = vi.fn()
    render(<StreamingOutput execution={mockExecution} onComplete={onComplete} />)
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    })
  })

  it('displays token usage and model information', async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: {"type":"done","tokensUsed":150,"modelUsed":"gpt-3.5-turbo"}\n\n')
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: [DONE]\n\n')
        })
        .mockResolvedValue({ done: true }),
      releaseLock: vi.fn()
    }

    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn().mockReturnValue(mockReader)
      }
    }
    
    ;(fetch as any).mockResolvedValue(mockResponse)

    render(<StreamingOutput execution={mockExecution} />)
    
    await waitFor(() => {
      expect(screen.getByText('Tokens: 150')).toBeInTheDocument()
      expect(screen.getByText('Model: gpt-3.5-turbo')).toBeInTheDocument()
    })
  })

  it('handles clear button click', async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: [DONE]\n\n')
        })
        .mockResolvedValue({ done: true }),
      releaseLock: vi.fn()
    }

    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn().mockReturnValue(mockReader)
      }
    }
    
    ;(fetch as any).mockResolvedValue(mockResponse)

    render(<StreamingOutput execution={mockExecution} />)
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('Clear')).toBeInTheDocument()
    })
    
    // Click clear button
    const clearButton = screen.getByText('Clear')
    fireEvent.click(clearButton)
    
    // Should reset to connecting state (since it auto-starts)
    await waitFor(() => {
      expect(screen.getByText('Connecting')).toBeInTheDocument()
    })
  })
})
