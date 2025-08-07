import React, { useState, useEffect, useRef, useCallback } from 'react'
import { AgentExecution } from '../../../schemas/agent'

export interface StreamingChunk {
  type: 'content' | 'error' | 'done'
  content?: string
  error?: string
  tokensUsed?: number
  modelUsed?: string
}

export interface StreamingOutputProps {
  execution: AgentExecution
  onComplete?: (result: any) => void
  onError?: (error: string) => void
  className?: string
}

export interface ExecutionStatus {
  status: 'idle' | 'connecting' | 'streaming' | 'completed' | 'error'
  progress: number
  error?: string
  startTime?: Date
  endTime?: Date
  tokensUsed?: number
  modelUsed?: string
}

export const StreamingOutput: React.FC<StreamingOutputProps> = ({
  execution,
  onComplete,
  onError,
  className = ''
}) => {
  const [status, setStatus] = useState<ExecutionStatus>({
    status: 'idle',
    progress: 0
  })
  const [output, setOutput] = useState<string>('')
  const [chunks, setChunks] = useState<StreamingChunk[]>([])
  const outputRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [output, scrollToBottom])

  const startStreaming = useCallback(async () => {
    try {
      setStatus({
        status: 'connecting',
        progress: 0
      })

      abortControllerRef.current = new AbortController()

      // Start the streaming execution
      const response = await fetch('/api/agents/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(execution),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setStatus(prev => ({
        ...prev,
        status: 'streaming',
        startTime: new Date()
      }))

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              
              if (data === '[DONE]') {
                setStatus(prev => ({
                  ...prev,
                  status: 'completed',
                  progress: 100,
                  endTime: new Date()
                }))
                onComplete?.({
                  output,
                  tokensUsed: status.tokensUsed,
                  modelUsed: status.modelUsed,
                  duration: status.endTime && status.startTime 
                    ? status.endTime.getTime() - status.startTime.getTime()
                    : 0
                })
                return
              }

              try {
                const chunk: StreamingChunk = JSON.parse(data)
                setChunks(prev => [...prev, chunk])
                
                if (chunk.type === 'content' && chunk.content) {
                  setOutput(prev => prev + chunk.content)
                } else if (chunk.type === 'error') {
                  setStatus(prev => ({
                    ...prev,
                    status: 'error',
                    error: chunk.error
                  }))
                  onError?.(chunk.error || 'Unknown error')
                  return
                } else if (chunk.type === 'done') {
                  setStatus(prev => ({
                    ...prev,
                    tokensUsed: chunk.tokensUsed,
                    modelUsed: chunk.modelUsed
                  }))
                }
              } catch (parseError) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, don't show error
        return
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setStatus(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }))
      onError?.(errorMessage)
    }
  }, [execution, output, status.tokensUsed, status.modelUsed, onComplete, onError])

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setStatus(prev => ({
      ...prev,
      status: 'idle'
    }))
  }, [])

  const clearOutput = useCallback(() => {
    setOutput('')
    setChunks([])
    setStatus({
      status: 'idle',
      progress: 0
    })
  }, [])

  useEffect(() => {
    if (execution && status.status === 'idle') {
      startStreaming()
    }
  }, [execution, status.status, startStreaming])

  useEffect(() => {
    return () => {
      stopStreaming()
    }
  }, [stopStreaming])

  const getStatusColor = (status: ExecutionStatus['status']) => {
    switch (status) {
      case 'idle': return 'text-gray-500'
      case 'connecting': return 'text-yellow-500'
      case 'streaming': return 'text-blue-500'
      case 'completed': return 'text-green-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: ExecutionStatus['status']) => {
    switch (status) {
      case 'idle': return '⏸️'
      case 'connecting': return '🔄'
      case 'streaming': return '📡'
      case 'completed': return '✅'
      case 'error': return '❌'
      default: return '⏸️'
    }
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon(status.status)}</span>
          <span className={`font-medium ${getStatusColor(status.status)}`}>
            {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
          </span>
          {status.status === 'streaming' && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Streaming...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {status.tokensUsed && (
            <span className="text-sm text-gray-600">
              Tokens: {status.tokensUsed}
            </span>
          )}
          {status.modelUsed && (
            <span className="text-sm text-gray-600">
              Model: {status.modelUsed}
            </span>
          )}
          {status.startTime && status.endTime && (
            <span className="text-sm text-gray-600">
              Duration: {Math.round((status.endTime.getTime() - status.startTime.getTime()) / 1000)}s
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          {status.status === 'streaming' && (
            <button
              onClick={stopStreaming}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Stop
            </button>
          )}
          {(status.status === 'completed' || status.status === 'error') && (
            <button
              onClick={clearOutput}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            Agent: {execution.agentId}
          </span>
        </div>
      </div>

      {/* Output Display */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={outputRef}
          className="h-full p-4 overflow-y-auto bg-white font-mono text-sm leading-relaxed"
        >
          {status.status === 'connecting' && (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>Connecting to agent...</span>
            </div>
          )}
          
          {status.status === 'error' && status.error && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded text-red-700">
              <div className="font-medium">Error:</div>
              <div>{status.error}</div>
            </div>
          )}
          
          {output && (
            <div className="whitespace-pre-wrap break-words">
              {output}
            </div>
          )}
          
          {status.status === 'streaming' && !output && (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-pulse">●</div>
              <span>Waiting for response...</span>
            </div>
          )}
          
          {status.status === 'completed' && !output && (
            <div className="text-gray-500">
              No output received
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Chunks: {chunks.length}</span>
            <span>Characters: {output.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            {status.startTime && (
              <span>
                Started: {status.startTime.toLocaleTimeString()}
              </span>
            )}
            {status.endTime && (
              <span>
                Ended: {status.endTime.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StreamingOutput
