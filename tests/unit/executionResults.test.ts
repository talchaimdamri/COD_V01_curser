import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { ExecutionResultsService } from '../../api/services/executionResults'
import { AgentExecutionResult } from '../../src/services/agentExecution'

// Mock PrismaClient
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    agentExecution: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn()
    },
    executionLog: {
      create: vi.fn(),
      findMany: vi.fn()
    },
    executionChunk: {
      create: vi.fn(),
      findMany: vi.fn()
    },
    executionStats: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
      update: vi.fn()
    }
  }))
}))

describe('ExecutionResultsService', () => {
  let service: ExecutionResultsService
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = new PrismaClient()
    service = new ExecutionResultsService(mockPrisma)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('storeExecutionResult', () => {
    it('should store execution result successfully', async () => {
      const mockResult = {
        id: 'exec-123',
        agentId: 'agent-123',
        input: 'Test input',
        output: 'Test output',
        status: 'completed',
        duration: 1000,
        tokensUsed: 150,
        modelUsed: 'gpt-3.5-turbo',
        metadata: { userId: 'user-123' },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.agentExecution.create.mockResolvedValue(mockResult)

      const executionResult: AgentExecutionResult = {
        id: 'exec-123',
        agentId: 'agent-123',
        input: 'Test input',
        output: 'Test output',
        status: 'completed',
        duration: 1000,
        tokensUsed: 150,
        modelUsed: 'gpt-3.5-turbo',
        metadata: { userId: 'user-123' }
      }

      const result = await service.storeExecutionResult(executionResult)

      expect(mockPrisma.agentExecution.create).toHaveBeenCalledWith({
        data: {
          agentId: 'agent-123',
          input: 'Test input',
          output: 'Test output',
          status: 'completed',
          duration: 1000,
          tokens: 150,
          modelUsed: 'gpt-3.5-turbo',
          metadata: { userId: 'user-123' },
          userId: 'user-123',
          sessionId: undefined,
          completedAt: expect.any(Date)
        }
      })

      expect(result).toEqual(mockResult)
    })
  })

  describe('getExecutionResult', () => {
    it('should retrieve execution result by ID', async () => {
      const mockResult = {
        id: 'exec-123',
        agentId: 'agent-123',
        input: 'Test input',
        output: 'Test output',
        status: 'completed',
        duration: 1000,
        tokens: 150,
        modelUsed: 'gpt-3.5-turbo',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.agentExecution.findUnique.mockResolvedValue(mockResult)

      const result = await service.getExecutionResult('exec-123')

      expect(mockPrisma.agentExecution.findUnique).toHaveBeenCalledWith({
        where: { id: 'exec-123' }
      })

      expect(result).toEqual(mockResult)
    })

    it('should return null for non-existent execution', async () => {
      mockPrisma.agentExecution.findUnique.mockResolvedValue(null)

      const result = await service.getExecutionResult('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getExecutionResultsByAgent', () => {
    it('should retrieve execution results by agent ID', async () => {
      const mockResults = [
        {
          id: 'exec-1',
          agentId: 'agent-123',
          input: 'Test input 1',
          output: 'Test output 1',
          status: 'completed',
          duration: 1000,
          tokens: 150,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'exec-2',
          agentId: 'agent-123',
          input: 'Test input 2',
          output: 'Test output 2',
          status: 'completed',
          duration: 2000,
          tokens: 300,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      mockPrisma.agentExecution.findMany.mockResolvedValue(mockResults)

      const results = await service.getExecutionResultsByAgent('agent-123', 10, 0)

      expect(mockPrisma.agentExecution.findMany).toHaveBeenCalledWith({
        where: { agentId: 'agent-123' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0
      })

      expect(results).toEqual(mockResults)
    })
  })

  describe('updateExecutionStatus', () => {
    it('should update execution status successfully', async () => {
      const mockResult = {
        id: 'exec-123',
        status: 'completed',
        updatedAt: new Date(),
        completedAt: new Date()
      }

      mockPrisma.agentExecution.update.mockResolvedValue(mockResult)

      const result = await service.updateExecutionStatus('exec-123', 'completed')

      expect(mockPrisma.agentExecution.update).toHaveBeenCalledWith({
        where: { id: 'exec-123' },
        data: {
          status: 'completed',
          updatedAt: expect.any(Date),
          completedAt: expect.any(Date)
        }
      })

      expect(result).toEqual(mockResult)
    })
  })

  describe('storeExecutionLog', () => {
    it('should store execution log successfully', async () => {
      const mockLog = {
        id: 'log-123',
        executionId: 'exec-123',
        level: 'info',
        message: 'Test log message',
        timestamp: new Date(),
        metadata: { source: 'test' }
      }

      mockPrisma.executionLog.create.mockResolvedValue(mockLog)

      const result = await service.storeExecutionLog('exec-123', {
        level: 'info',
        message: 'Test log message',
        metadata: { source: 'test' }
      })

      expect(mockPrisma.executionLog.create).toHaveBeenCalledWith({
        data: {
          executionId: 'exec-123',
          level: 'info',
          message: 'Test log message',
          metadata: { source: 'test' }
        }
      })

      expect(result).toEqual(mockLog)
    })
  })

  describe('storeExecutionChunk', () => {
    it('should store execution chunk successfully', async () => {
      const mockChunk = {
        id: 'chunk-123',
        executionId: 'exec-123',
        type: 'content',
        content: 'Test content',
        sequence: 1,
        timestamp: new Date()
      }

      mockPrisma.executionChunk.create.mockResolvedValue(mockChunk)

      const result = await service.storeExecutionChunk('exec-123', {
        type: 'content',
        content: 'Test content',
        sequence: 1
      })

      expect(mockPrisma.executionChunk.create).toHaveBeenCalledWith({
        data: {
          executionId: 'exec-123',
          type: 'content',
          content: 'Test content',
          error: undefined,
          tokensUsed: undefined,
          modelUsed: undefined,
          sequence: 1
        }
      })

      expect(result).toEqual(mockChunk)
    })
  })

  describe('updateExecutionStats', () => {
    it('should update execution statistics successfully', async () => {
      const mockStats = {
        id: 'stats-123',
        agentId: 'agent-123',
        userId: 'user-123',
        date: new Date(),
        totalExecutions: 1,
        successfulExecutions: 1,
        failedExecutions: 0,
        totalTokens: 150,
        totalDuration: 1000,
        avgTokens: 150,
        avgDuration: 1000,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.executionStats.upsert.mockResolvedValue(mockStats)
      mockPrisma.executionStats.update.mockResolvedValue(mockStats)

      const executionResult: AgentExecutionResult = {
        id: 'exec-123',
        agentId: 'agent-123',
        input: 'Test input',
        output: 'Test output',
        status: 'completed',
        duration: 1000,
        tokensUsed: 150,
        modelUsed: 'gpt-3.5-turbo',
        metadata: { userId: 'user-123' }
      }

      await service.updateExecutionStats('agent-123', 'user-123', executionResult)

      expect(mockPrisma.executionStats.upsert).toHaveBeenCalledWith({
        where: {
          agentId_userId_date: {
            agentId: 'agent-123',
            userId: 'user-123',
            date: expect.any(Date)
          }
        },
        update: {
          totalExecutions: { increment: 1 },
          successfulExecutions: { increment: 1 },
          failedExecutions: { increment: 0 },
          totalTokens: { increment: 150 },
          totalDuration: { increment: 1000 },
          updatedAt: expect.any(Date)
        },
        create: {
          agentId: 'agent-123',
          userId: 'user-123',
          date: expect.any(Date),
          totalExecutions: 1,
          successfulExecutions: 1,
          failedExecutions: 0,
          totalTokens: 150,
          totalDuration: 1000,
          avgTokens: 150,
          avgDuration: 1000
        }
      })
    })
  })

  describe('getExecutionSummary', () => {
    it('should get execution summary statistics', async () => {
      const mockAggregate = {
        _sum: {
          totalExecutions: 10,
          successfulExecutions: 8,
          failedExecutions: 2,
          totalTokens: 1500,
          totalDuration: 10000
        },
        _avg: {
          avgTokens: 150,
          avgDuration: 1000
        }
      }

      mockPrisma.executionStats.aggregate.mockResolvedValue(mockAggregate)

      const summary = await service.getExecutionSummary('agent-123', 'user-123')

      expect(mockPrisma.executionStats.aggregate).toHaveBeenCalledWith({
        where: {
          agentId: 'agent-123',
          userId: 'user-123'
        },
        _sum: {
          totalExecutions: true,
          successfulExecutions: true,
          failedExecutions: true,
          totalTokens: true,
          totalDuration: true
        },
        _avg: {
          avgTokens: true,
          avgDuration: true
        }
      })

      expect(summary).toEqual({
        totalExecutions: 10,
        successfulExecutions: 8,
        failedExecutions: 2,
        totalTokens: 1500,
        totalDuration: 10000,
        avgTokens: 150,
        avgDuration: 1000
      })
    })
  })

  describe('cleanupOldExecutions', () => {
    it('should cleanup old executions successfully', async () => {
      const mockDeleteResult = { count: 5 }
      mockPrisma.agentExecution.deleteMany.mockResolvedValue(mockDeleteResult)

      const deletedCount = await service.cleanupOldExecutions(30)

      expect(mockPrisma.agentExecution.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date)
          }
        }
      })

      expect(deletedCount).toBe(5)
    })
  })
})
