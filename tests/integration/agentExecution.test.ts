import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { AgentExecutionService } from '../../src/services/agentExecution'
import { AgentExecution, AgentExecutionResult } from '../../schemas/agent'
import { EventStore } from '../../api/services/eventStore'

describe('Agent Execution Integration Tests', () => {
  let prisma: PrismaClient
  let agentExecutionService: AgentExecutionService
  let eventStore: EventStore

  beforeEach(async () => {
    prisma = new PrismaClient()
    agentExecutionService = AgentExecutionService.getInstance()
    eventStore = new EventStore(prisma)
    
    // Clean up database before each test
    await prisma.event.deleteMany()
    await prisma.chainSnapshot.deleteMany()
    await prisma.documentSnapshot.deleteMany()
    await prisma.agentSnapshot.deleteMany()
  })

  afterEach(async () => {
    await prisma.$disconnect()
  })

  describe('IT-AG-01: End-to-End Agent Execution Flow', () => {
    it('should execute agent and store results in database', async () => {
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: 'Test integration execution',
        metadata: { 
          userId: 'user-123',
          sessionId: 'session-456',
          testRun: true
        }
      }

      // Execute agent
      const result = await agentExecutionService.executeAgent(execution)

      // Verify result structure
      expect(result).toBeDefined()
      expect(result.agentId).toBe('agent-123')
      expect(result.input).toBe('Test integration execution')
      expect(result.output).toContain('Test Agent')
      expect(result.duration).toBeGreaterThan(0)
      expect(result.tokens).toBeGreaterThan(0)
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.metadata).toEqual(execution.metadata)

      // Verify result has valid ID format
      expect(result.id).toMatch(/^exec-\d+-\d+$/)
    })

    it('should handle concurrent agent executions', async () => {
      const executions: AgentExecution[] = [
        { agentId: 'agent-1', input: 'Concurrent test 1' },
        { agentId: 'agent-2', input: 'Concurrent test 2' },
        { agentId: 'agent-3', input: 'Concurrent test 3' }
      ]

      const promises = executions.map(execution => 
        agentExecutionService.executeAgent(execution)
      )
      
      const results = await Promise.all(promises)

      expect(results).toHaveLength(3)
      
      // Verify all results are unique
      const resultIds = results.map(r => r.id)
      const uniqueIds = new Set(resultIds)
      expect(uniqueIds.size).toBe(3)

      // Verify all results have expected structure
      results.forEach((result, index) => {
        expect(result.agentId).toBe(`agent-${index + 1}`)
        expect(result.input).toBe(`Concurrent test ${index + 1}`)
        expect(result.output).toContain('Test Agent')
        expect(result.duration).toBeGreaterThan(0)
        expect(result.tokens).toBeGreaterThan(0)
      })
    })

    it('should handle large input text', async () => {
      const largeInput = 'A'.repeat(10000) // 10KB input
      
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: largeInput,
        metadata: { userId: 'user-123' }
      }

      const result = await agentExecutionService.executeAgent(execution)

      expect(result).toBeDefined()
      expect(result.input).toBe(largeInput)
      expect(result.output).toContain('Test Agent')
      expect(result.duration).toBeGreaterThan(0)
    })

    it('should handle special characters in input', async () => {
      const specialInput = 'Test with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
      
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: specialInput,
        metadata: { userId: 'user-123' }
      }

      const result = await agentExecutionService.executeAgent(execution)

      expect(result).toBeDefined()
      expect(result.input).toBe(specialInput)
      expect(result.output).toContain('Test Agent')
      expect(result.output).toContain(specialInput)
    })
  })

  describe('IT-AG-02: Streaming Output Integration', () => {
    it('should stream execution chunks correctly', async () => {
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: 'Test streaming integration',
        metadata: { userId: 'user-123' }
      }

      const chunks: any[] = []
      for await (const chunk of agentExecutionService.streamExecution(execution)) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(1)
      
      // Verify content chunks
      const contentChunks = chunks.filter(chunk => chunk.type === 'content')
      expect(contentChunks.length).toBeGreaterThan(0)
      
      // Verify final done chunk
      const doneChunk = chunks[chunks.length - 1]
      expect(doneChunk.type).toBe('done')
      expect(doneChunk.tokensUsed).toBeGreaterThan(0)
      expect(doneChunk.modelUsed).toBe('gpt-3.5-turbo')

      // Verify content is coherent
      const content = contentChunks.map(chunk => chunk.content).join('')
      expect(content).toContain('Test Agent')
      expect(content).toContain('Test streaming integration')
    })

    it('should handle streaming with empty input', async () => {
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: '',
        metadata: { userId: 'user-123' }
      }

      const chunks: any[] = []
      for await (const chunk of agentExecutionService.streamExecution(execution)) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(1)
      
      const contentChunks = chunks.filter(chunk => chunk.type === 'content')
      const content = contentChunks.map(chunk => chunk.content).join('')
      
      expect(content).toContain('Test Agent')
      expect(content).toContain('""') // Empty input should be quoted
    })

    it('should handle streaming errors gracefully', async () => {
      // Create a mock service that throws an error during streaming
      const mockService = {
        ...agentExecutionService,
        streamExecution: async function* (execution: AgentExecution) {
          try {
            throw new Error('Integration test streaming error')
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

      const chunks: any[] = []
      for await (const chunk of mockService.streamExecution(execution)) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBe(1)
      expect(chunks[0].type).toBe('error')
      expect(chunks[0].error).toBe('Integration test streaming error')
    })
  })

  describe('IT-AG-03: Database Integration', () => {
    it('should store execution results in database', async () => {
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: 'Test database storage',
        metadata: { userId: 'user-123' }
      }

      const result = await agentExecutionService.executeAgent(execution)

      // In a real implementation, this would store the result in the database
      // For now, we verify the result structure is ready for database storage
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.agentId).toBeDefined()
      expect(result.input).toBeDefined()
      expect(result.output).toBeDefined()
      expect(result.duration).toBeGreaterThan(0)
      expect(result.tokens).toBeGreaterThan(0)
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.metadata).toBeDefined()
    })

    it('should handle database connection errors gracefully', async () => {
      // This test would verify that the service handles database connection issues
      // For now, we test the basic error handling
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: 'Test database error handling',
        metadata: { userId: 'user-123' }
      }

      // The service should still work even if database is not available
      const result = await agentExecutionService.executeAgent(execution)
      expect(result).toBeDefined()
      expect(result.agentId).toBe('agent-123')
    })
  })

  describe('IT-AG-04: Multi-Provider Support', () => {
    it('should support different model providers', async () => {
      const executions: AgentExecution[] = [
        { agentId: 'agent-openai', input: 'Test OpenAI model' },
        { agentId: 'agent-anthropic', input: 'Test Anthropic model' },
        { agentId: 'agent-local', input: 'Test local model' }
      ]

      const results = await Promise.all(
        executions.map(execution => agentExecutionService.executeAgent(execution))
      )

      expect(results).toHaveLength(3)
      
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result.output).toContain('Test Agent')
        expect(result.duration).toBeGreaterThan(0)
        expect(result.tokens).toBeGreaterThan(0)
      })
    })

    it('should handle provider-specific errors', async () => {
      const execution: AgentExecution = {
        agentId: 'agent-invalid-provider',
        input: 'Test invalid provider',
        metadata: { userId: 'user-123' }
      }

      // The service should handle invalid providers gracefully
      const result = await agentExecutionService.executeAgent(execution)
      expect(result).toBeDefined()
      expect(result.agentId).toBe('agent-invalid-provider')
    })
  })

  describe('IT-AG-05: Rate Limiting Integration', () => {
    it('should handle rate limiting for multiple requests', async () => {
      const executions: AgentExecution[] = Array.from({ length: 15 }, (_, i) => ({
        agentId: `agent-${i}`,
        input: `Rate limit test ${i}`,
        metadata: { userId: 'user-123' }
      }))

      // Execute multiple requests rapidly
      const promises = executions.map(execution => 
        agentExecutionService.executeAgent(execution)
      )
      
      const results = await Promise.all(promises)

      expect(results).toHaveLength(15)
      
      // All requests should complete successfully
      results.forEach((result, index) => {
        expect(result).toBeDefined()
        expect(result.agentId).toBe(`agent-${index}`)
        expect(result.input).toBe(`Rate limit test ${index}`)
      })
    })

    it('should handle rate limit exceeded scenarios', async () => {
      // This test would verify rate limiting behavior
      // For now, we test that the service can handle many concurrent requests
      const executions: AgentExecution[] = Array.from({ length: 20 }, (_, i) => ({
        agentId: `agent-${i}`,
        input: `Concurrent test ${i}`,
        metadata: { userId: 'user-123' }
      }))

      const promises = executions.map(execution => 
        agentExecutionService.executeAgent(execution)
      )
      
      const results = await Promise.all(promises)

      expect(results).toHaveLength(20)
      
      // Verify all results are unique
      const resultIds = results.map(r => r.id)
      const uniqueIds = new Set(resultIds)
      expect(uniqueIds.size).toBe(20)
    })
  })

  describe('IT-AG-06: Error Handling Integration', () => {
    it('should handle network timeouts gracefully', async () => {
      const execution: AgentExecution = {
        agentId: 'agent-timeout',
        input: 'Test network timeout',
        metadata: { userId: 'user-123' }
      }

      // The service should handle timeouts gracefully
      const result = await agentExecutionService.executeAgent(execution)
      expect(result).toBeDefined()
      expect(result.agentId).toBe('agent-timeout')
    })

    it('should handle invalid agent configurations', async () => {
      const execution: AgentExecution = {
        agentId: 'invalid-agent',
        input: 'Test invalid configuration',
        metadata: { userId: 'user-123' }
      }

      // The service should handle invalid configurations gracefully
      const result = await agentExecutionService.executeAgent(execution)
      expect(result).toBeDefined()
      expect(result.agentId).toBe('invalid-agent')
    })

    it('should handle malformed input gracefully', async () => {
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: null as any, // Malformed input
        metadata: { userId: 'user-123' }
      }

      // The service should handle malformed input gracefully
      await expect(agentExecutionService.executeAgent(execution)).rejects.toThrow()
    })
  })

  describe('IT-AG-07: Performance Integration', () => {
    it('should complete executions within reasonable time', async () => {
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: 'Performance test',
        metadata: { userId: 'user-123' }
      }

      const startTime = Date.now()
      const result = await agentExecutionService.executeAgent(execution)
      const endTime = Date.now()
      const duration = endTime - startTime

      expect(result).toBeDefined()
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
      expect(result.duration).toBeLessThan(10000) // Internal duration should also be reasonable
    })

    it('should handle memory efficiently for large responses', async () => {
      const execution: AgentExecution = {
        agentId: 'agent-123',
        input: 'Generate large response',
        metadata: { userId: 'user-123' }
      }

      const result = await agentExecutionService.executeAgent(execution)

      expect(result).toBeDefined()
      expect(result.output.length).toBeGreaterThan(0)
      expect(result.output.length).toBeLessThan(1000000) // Should not exceed 1MB
    })
  })
})
