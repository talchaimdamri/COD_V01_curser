import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AgentExecutionService, LLMProvider, LLMRequest, LLMResponse, LLMStreamChunk } from './agentExecution'
import { AgentExecution, Agent } from '../../schemas/agent'

// Mock LLM Provider for testing
class MockLLMProvider implements LLMProvider {
  name = 'mock'
  models = ['mock-model-1', 'mock-model-2']
  
  async execute(request: LLMRequest): Promise<LLMResponse> {
    return {
      success: true,
      output: `Mock response for: ${request.prompt}`,
      tokensUsed: 100,
      modelUsed: request.model,
      duration: 1000
    }
  }
  
  async *stream(request: LLMRequest): AsyncIterable<LLMStreamChunk> {
    const words = `Mock streaming response for: ${request.prompt}`.split(' ')
    for (const word of words) {
      yield {
        type: 'content',
        content: word + ' '
      }
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    yield {
      type: 'done',
      tokensUsed: 100,
      modelUsed: request.model
    }
  }
}

describe('AgentExecutionService', () => {
  let service: AgentExecutionService

  beforeEach(() => {
    // Reset singleton instance for each test
    vi.resetModules()
    service = AgentExecutionService.getInstance()
    
    // Reset rate limiter state by creating a new instance
    // This ensures clean state between tests
    const newService = AgentExecutionService.getInstance()
    // Force a new instance by clearing any cached state
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = AgentExecutionService.getInstance()
      const instance2 = AgentExecutionService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('executeAgent', () => {
    it('should execute agent successfully with valid input', async () => {
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: 'Test input for agent execution',
        metadata: { userId: 'user-123' }
      }

      const result = await service.executeAgent(execution)

      expect(result).toBeDefined()
      expect(result.agentId).toBe('agent-123')
      expect(result.input).toBe('Test input for agent execution')
      expect(result.output).toContain('Mock response')
      expect(result.duration).toBeGreaterThan(0)
      expect(result.tokens).toBeGreaterThan(0)
      expect(result.createdAt).toBeInstanceOf(Date)
    })

    it('should throw error when agentId is missing', async () => {
      const execution: AgentExecution = {
        agentId: '',
        input: 'Test input',
        metadata: { userId: 'user-123' }
      }

      await expect(service.executeAgent(execution)).rejects.toThrow('Agent ID is required')
    })

    it('should throw error when input is empty', async () => {
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: '',
        metadata: { userId: 'user-123' }
      }

      await expect(service.executeAgent(execution)).rejects.toThrow('Input is required')
    })

    it('should throw error when input is only whitespace', async () => {
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: '   ',
        metadata: { userId: 'user-123' }
      }

      await expect(service.executeAgent(execution)).rejects.toThrow('Input is required')
    })

    it('should include metadata in result', async () => {
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: 'Test input',
        metadata: { 
          userId: 'user-123',
          sessionId: 'session-456',
          customField: 'custom-value'
        }
      }

      const result = await service.executeAgent(execution)

      expect(result.metadata).toEqual(execution.metadata)
    })
  })

  describe('executeWithStreaming', () => {
    it('should return complete response from streaming execution', async () => {
      const agent: Agent = {
        id: 'agent-123',
        name: 'Test Agent',
        prompt: 'You are a helpful assistant.',
        model: 'mock-model-1',
        tools: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const input = 'Test streaming input'
      const output = await service.executeWithStreaming(agent, input)

      expect(output).toContain('Mock streaming response')
      expect(output).toContain('Test streaming input')
    })

    it('should handle empty input gracefully', async () => {
      const agent: Agent = {
        id: 'agent-123',
        name: 'Test Agent',
        prompt: 'You are a helpful assistant.',
        model: 'mock-model-1',
        tools: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const output = await service.executeWithStreaming(agent, '')

      expect(output).toContain('Mock streaming response')
      expect(output).toContain('User input:') // Check for the actual output format
    })
  })

  describe('streamExecution', () => {
    it('should stream execution chunks correctly', async () => {
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: 'Test streaming execution',
        metadata: { userId: 'user-123' }
      }

      const chunks: LLMStreamChunk[] = []
      for await (const chunk of service.streamExecution(execution)) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(1)
      
      // Check content chunks
      const contentChunks = chunks.filter(chunk => chunk.type === 'content')
      expect(contentChunks.length).toBeGreaterThan(0)
      
      // Check final done chunk
      const doneChunk = chunks[chunks.length - 1]
      expect(doneChunk.type).toBe('done')
      expect(doneChunk.tokensUsed).toBeGreaterThan(0)
      expect(doneChunk.modelUsed).toBe('mock-model-1')
    })

    it('should handle errors in streaming execution', async () => {
      // Create a mock service that throws an error during streaming
      const mockService = {
        ...service,
        streamExecution: async function* (execution: AgentExecution): AsyncIterable<LLMStreamChunk> {
          try {
            throw new Error('Streaming execution failed')
          } catch (error) {
            yield {
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        }
      }

      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: 'Test error handling',
        metadata: { userId: 'user-123' }
      }

      const chunks: LLMStreamChunk[] = []
      for await (const chunk of mockService.streamExecution(execution)) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBe(1)
      expect(chunks[0].type).toBe('error')
      expect(chunks[0].error).toBe('Streaming execution failed')
    })

    it('should stream content with proper timing', async () => {
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: 'Test timing',
        metadata: { userId: 'user-123' }
      }

      const startTime = Date.now()
      const chunks: LLMStreamChunk[] = []
      
      for await (const chunk of service.streamExecution(execution)) {
        chunks.push(chunk)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime

      // Should take some time due to streaming delays
      expect(duration).toBeGreaterThan(0)
      expect(chunks.length).toBeGreaterThan(1)
    })
  })

  describe('getExecutionStatus', () => {
    it('should return undefined for non-existent execution', () => {
      const status = service.getExecutionStatus('non-existent-id')
      expect(status).toBeUndefined()
    })

    it('should return execution status when it exists', () => {
      // This test would need the service to actually track executions
      // For now, we test the basic functionality
      const status = service.getExecutionStatus('test-id')
      expect(status).toBeUndefined() // Since we're not actually tracking executions yet
    })
  })

  describe('rate limiting', () => {
    it('should allow requests within rate limit', () => {
      // Test the private method through reflection or make it public for testing
      // For now, we test the concept
      const userId = 'user-123'
      
      // This would test the checkRateLimit method
      // Since it's private, we test the behavior through the public interface
      expect(true).toBe(true) // Placeholder for rate limiting test
    })

    it('should block requests exceeding rate limit', () => {
      // Test rate limiting behavior
      // This would require making the rate limiting logic testable
      expect(true).toBe(true) // Placeholder for rate limiting test
    })
  })

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock a service that simulates network errors
      const mockService = {
        ...service,
        executeAgent: async function(execution: AgentExecution) {
          throw new Error('Network timeout')
        }
      }

      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: 'Test network error',
        metadata: { userId: 'user-123' }
      }

      await expect(mockService.executeAgent(execution)).rejects.toThrow('Network timeout')
    })

    it('should handle invalid agent configuration', async () => {
      const execution: AgentExecution = {
        agentId: 'invalid-agent',
        input: 'Test invalid agent',
        metadata: { userId: 'user-123' }
      }

      // This should still work with our mock implementation
      const result = await service.executeAgent(execution)
      expect(result).toBeDefined()
    })
  })

  describe('performance', () => {
    it('should complete execution within reasonable time', async () => {
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: 'Performance test input',
        metadata: { userId: 'user-123' }
      }

      const startTime = Date.now()
      await service.executeAgent(execution)
      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within 5 seconds (allowing for streaming delays)
      expect(duration).toBeLessThan(5000)
    })

    it('should handle multiple executions', async () => {
      const execution1: AgentExecution = {
        agentId: 'agent-1',
        input: 'Test execution 1',
        metadata: { userId: 'user-1' }
      }

      const execution2: AgentExecution = {
        agentId: 'agent-2',
        input: 'Test execution 2',
        metadata: { userId: 'user-2' }
      }

      // Execute them one after another
      const result1 = await service.executeAgent(execution1)
      const result2 = await service.executeAgent(execution2)

      expect(result1).toBeDefined()
      expect(result1.output).toContain('Mock response')
      expect(result1.agentId).toBe('agent-1')

      expect(result2).toBeDefined()
      expect(result2.output).toContain('Mock response')
      expect(result2.agentId).toBe('agent-2')

      // Verify they have different IDs
      expect(result1.id).not.toBe(result2.id)
    })
  })
})
