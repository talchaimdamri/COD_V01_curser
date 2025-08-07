import { Agent, AgentExecution, AgentExecutionResult } from '../../schemas/agent'
import { LLMProviderManager } from './llmProviders'
import { ExecutionResultsService } from '../../api/services/executionResults'

export interface LLMProvider {
  name: string
  models: string[]
  execute: (request: LLMRequest) => Promise<LLMResponse>
  stream: (request: LLMRequest) => AsyncIterable<LLMStreamChunk>
}

export interface LLMRequest {
  model: string
  prompt: string
  temperature?: number
  maxTokens?: number
  tools?: any[]
  userId?: string
}

export interface LLMResponse {
  success: boolean
  output?: string
  error?: string
  tokensUsed?: number
  modelUsed?: string
  duration?: number
}

export interface LLMStreamChunk {
  type: 'content' | 'error' | 'done'
  content?: string
  error?: string
  tokensUsed?: number
  modelUsed?: string
}

export interface ExecutionStatus {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  error?: string
  startTime?: Date
  endTime?: Date
  tokensUsed?: number
  modelUsed?: string
}

export class AgentExecutionService {
  private static instance: AgentExecutionService
  private providers: Map<string, LLMProvider> = new Map()
  private executions: Map<string, ExecutionStatus> = new Map()
  private rateLimiter: Map<string, number[]> = new Map()
  private executionCounter: number = 0
  private resultsService?: ExecutionResultsService

  private constructor() {
    this.initializeProviders()
  }

  static getInstance(): AgentExecutionService {
    if (!AgentExecutionService.instance) {
      AgentExecutionService.instance = new AgentExecutionService()
    }
    return AgentExecutionService.instance
  }

  /**
   * Set the execution results service for storing results
   */
  setResultsService(resultsService: ExecutionResultsService) {
    this.resultsService = resultsService
  }

  private initializeProviders() {
    // Initialize with mock providers for now
    // Will be replaced with actual API integrations
  }

  async executeAgent(execution: AgentExecution): Promise<AgentExecutionResult> {
    const startTime = Date.now()
    const executionId = `exec-${Date.now()}-${++this.executionCounter}`

    try {
      // Validate input
      if (!execution.agentId) {
        throw new Error('Agent ID is required')
      }

      if (!execution.input?.trim()) {
        throw new Error('Input is required')
      }

      // Check rate limiting
      const userId = execution.metadata?.userId
      if (userId && !this.checkRateLimit(userId)) {
        throw new Error('Rate limit exceeded')
      }

      // Update execution status
      this.executions.set(executionId, {
        status: 'running',
        progress: 0,
        startTime: new Date()
      })

      // Get agent configuration (mock for now)
      const agent: Agent = {
        id: execution.agentId,
        name: 'Test Agent',
        prompt: 'You are a helpful assistant.',
        model: 'mock-model-1', // Use mock model by default
        tools: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Execute with LLM provider
      const output = await this.executeWithStreaming(agent, execution.input)
      const endTime = Date.now()
      const duration = endTime - startTime

      // Create result
      const result: AgentExecutionResult = {
        id: executionId,
        agentId: execution.agentId,
        input: execution.input,
        output,
        status: 'completed',
        duration,
        tokensUsed: 100, // Mock value
        modelUsed: agent.model,
        metadata: execution.metadata
      }

      // Store result if service is available
      if (this.resultsService) {
        try {
          await this.resultsService.storeExecutionResult(result)
          await this.resultsService.updateExecutionStats(execution.agentId, userId, result)
        } catch (error) {
          console.error('Failed to store execution result:', error)
        }
      }

      // Update execution status
      this.executions.set(executionId, {
        status: 'completed',
        progress: 100,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        tokensUsed: result.tokensUsed,
        modelUsed: result.modelUsed
      })

      return result
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime

      // Update execution status
      this.executions.set(executionId, {
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      })

      throw new Error(`Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async *streamExecution(execution: AgentExecution): AsyncIterable<LLMStreamChunk> {
    const startTime = Date.now()
    const executionId = `exec-${Date.now()}-${++this.executionCounter}`
    let sequence = 0

    try {
      // Validate input
      if (!execution.agentId) {
        throw new Error('Agent ID is required')
      }

      if (!execution.input?.trim()) {
        throw new Error('Input is required')
      }

      // Check rate limiting
      const userId = execution.metadata?.userId
      if (userId && !this.checkRateLimit(userId)) {
        throw new Error('Rate limit exceeded')
      }

      // Update execution status
      this.executions.set(executionId, {
        status: 'running',
        progress: 0,
        startTime: new Date()
      })

      // Get agent configuration (mock for now)
      const agent: Agent = {
        id: execution.agentId,
        name: 'Test Agent',
        prompt: 'You are a helpful assistant.',
        model: 'mock-model-1', // Use mock model by default
        tools: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Stream execution
      for await (const chunk of this.streamWithProvider(agent, execution.input)) {
        // Store chunk if service is available
        if (this.resultsService) {
          try {
            await this.resultsService.storeExecutionChunk(executionId, {
              type: chunk.type,
              content: chunk.content,
              error: chunk.error,
              tokensUsed: chunk.tokensUsed,
              modelUsed: chunk.modelUsed,
              sequence: ++sequence
            })
          } catch (error) {
            console.error('Failed to store execution chunk:', error)
          }
        }

        yield chunk
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Update execution status
      this.executions.set(executionId, {
        status: 'completed',
        progress: 100,
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      })

    } catch (error) {
      const endTime = Date.now()

      // Update execution status
      this.executions.set(executionId, {
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      })

      // Store error chunk if service is available
      if (this.resultsService) {
        try {
          await this.resultsService.storeExecutionChunk(executionId, {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            sequence: ++sequence
          })
        } catch (storeError) {
          console.error('Failed to store error chunk:', storeError)
        }
      }

      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async executeWithStreaming(agent: Agent, input: string): Promise<string> {
    let output = ''
    
    for await (const chunk of this.streamWithProvider(agent, input)) {
      if (chunk.type === 'content' && chunk.content) {
        output += chunk.content
      } else if (chunk.type === 'error') {
        throw new Error(chunk.error || 'Unknown error')
      }
    }
    
    return output
  }

  private async *streamWithProvider(agent: Agent, input: string): AsyncIterable<LLMStreamChunk> {
    // Mock streaming implementation
    const words = `Mock streaming response for: ${input}. This is a simulated response that demonstrates the streaming functionality.`.split(' ')
    
    for (const word of words) {
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate delay
      yield {
        type: 'content',
        content: word + ' '
      }
    }
    
    yield {
      type: 'done',
      tokensUsed: 100,
      modelUsed: agent.model
    }
  }

  getExecutionStatus(executionId: string): ExecutionStatus | undefined {
    return this.executions.get(executionId)
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 minute
    const maxRequests = 10

    if (!this.rateLimiter.has(userId)) {
      this.rateLimiter.set(userId, [])
    }

    const userRequests = this.rateLimiter.get(userId)!
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs)
    
    if (validRequests.length >= maxRequests) {
      return false
    }
    
    validRequests.push(now)
    this.rateLimiter.set(userId, validRequests)
    
    return true
  }
}
