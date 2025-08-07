import { PrismaClient } from '@prisma/client'
import { AgentExecutionResult } from '../../src/services/agentExecution'

export interface ExecutionResult {
  id: string
  agentId: string
  input: string
  output: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  duration: number
  tokens: number
  modelUsed?: string
  metadata?: any
  userId?: string
  sessionId?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface ExecutionLog {
  id: string
  executionId: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: Date
  metadata?: any
}

export interface ExecutionChunk {
  id: string
  executionId: string
  type: 'content' | 'error' | 'done'
  content?: string
  error?: string
  tokensUsed?: number
  modelUsed?: string
  sequence: number
  timestamp: Date
}

export interface ExecutionStats {
  id: string
  agentId: string
  userId?: string
  date: Date
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  totalTokens: number
  totalDuration: number
  avgTokens: number
  avgDuration: number
  createdAt: Date
  updatedAt: Date
}

export class ExecutionResultsService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Store execution result in database
   */
  async storeExecutionResult(result: AgentExecutionResult): Promise<ExecutionResult> {
    const execution = await this.prisma.agentExecution.create({
      data: {
        agentId: result.agentId,
        input: result.input,
        output: result.output,
        status: result.status,
        duration: result.duration,
        tokens: result.tokensUsed || 0,
        modelUsed: result.modelUsed,
        metadata: result.metadata,
        userId: result.metadata?.userId,
        sessionId: result.metadata?.sessionId,
        completedAt: result.status === 'completed' ? new Date() : null
      }
    })

    return execution
  }

  /**
   * Get execution result by ID
   */
  async getExecutionResult(id: string): Promise<ExecutionResult | null> {
    return await this.prisma.agentExecution.findUnique({
      where: { id }
    })
  }

  /**
   * Get execution results by agent ID
   */
  async getExecutionResultsByAgent(agentId: string, limit = 50, offset = 0): Promise<ExecutionResult[]> {
    return await this.prisma.agentExecution.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })
  }

  /**
   * Get execution results by user ID
   */
  async getExecutionResultsByUser(userId: string, limit = 50, offset = 0): Promise<ExecutionResult[]> {
    return await this.prisma.agentExecution.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })
  }

  /**
   * Update execution status
   */
  async updateExecutionStatus(id: string, status: ExecutionResult['status'], metadata?: any): Promise<ExecutionResult> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    if (status === 'completed') {
      updateData.completedAt = new Date()
    }

    if (metadata) {
      updateData.metadata = metadata
    }

    return await this.prisma.agentExecution.update({
      where: { id },
      data: updateData
    })
  }

  /**
   * Store execution log
   */
  async storeExecutionLog(executionId: string, log: Omit<ExecutionLog, 'id' | 'executionId' | 'timestamp'>): Promise<ExecutionLog> {
    return await this.prisma.executionLog.create({
      data: {
        executionId,
        level: log.level,
        message: log.message,
        metadata: log.metadata
      }
    })
  }

  /**
   * Get execution logs
   */
  async getExecutionLogs(executionId: string, level?: ExecutionLog['level']): Promise<ExecutionLog[]> {
    const where: any = { executionId }
    if (level) {
      where.level = level
    }

    return await this.prisma.executionLog.findMany({
      where,
      orderBy: { timestamp: 'asc' }
    })
  }

  /**
   * Store execution chunk
   */
  async storeExecutionChunk(executionId: string, chunk: Omit<ExecutionChunk, 'id' | 'executionId' | 'timestamp'>): Promise<ExecutionChunk> {
    return await this.prisma.executionChunk.create({
      data: {
        executionId,
        type: chunk.type,
        content: chunk.content,
        error: chunk.error,
        tokensUsed: chunk.tokensUsed,
        modelUsed: chunk.modelUsed,
        sequence: chunk.sequence
      }
    })
  }

  /**
   * Get execution chunks
   */
  async getExecutionChunks(executionId: string): Promise<ExecutionChunk[]> {
    return await this.prisma.executionChunk.findMany({
      where: { executionId },
      orderBy: { sequence: 'asc' }
    })
  }

  /**
   * Update execution statistics
   */
  async updateExecutionStats(agentId: string, userId: string | undefined, result: AgentExecutionResult): Promise<void> {
    const date = new Date()
    date.setHours(0, 0, 0, 0) // Start of day

    const stats = await this.prisma.executionStats.upsert({
      where: {
        agentId_userId_date: {
          agentId,
          userId: userId || '',
          date
        }
      },
      update: {
        totalExecutions: { increment: 1 },
        successfulExecutions: { increment: result.status === 'completed' ? 1 : 0 },
        failedExecutions: { increment: result.status === 'failed' ? 1 : 0 },
        totalTokens: { increment: result.tokensUsed || 0 },
        totalDuration: { increment: result.duration },
        updatedAt: new Date()
      },
      create: {
        agentId,
        userId,
        date,
        totalExecutions: 1,
        successfulExecutions: result.status === 'completed' ? 1 : 0,
        failedExecutions: result.status === 'failed' ? 1 : 0,
        totalTokens: result.tokensUsed || 0,
        totalDuration: result.duration,
        avgTokens: result.tokensUsed || 0,
        avgDuration: result.duration
      }
    })

    // Update averages
    await this.prisma.executionStats.update({
      where: { id: stats.id },
      data: {
        avgTokens: stats.totalTokens / stats.totalExecutions,
        avgDuration: stats.totalDuration / stats.totalExecutions
      }
    })
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(agentId?: string, userId?: string, startDate?: Date, endDate?: Date): Promise<ExecutionStats[]> {
    const where: any = {}
    
    if (agentId) where.agentId = agentId
    if (userId) where.userId = userId
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }

    return await this.prisma.executionStats.findMany({
      where,
      orderBy: { date: 'desc' }
    })
  }

  /**
   * Delete execution result and related data
   */
  async deleteExecutionResult(id: string): Promise<void> {
    await this.prisma.agentExecution.delete({
      where: { id }
    })
  }

  /**
   * Get execution summary statistics
   */
  async getExecutionSummary(agentId?: string, userId?: string): Promise<{
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    totalTokens: number
    totalDuration: number
    avgTokens: number
    avgDuration: number
  }> {
    const where: any = {}
    if (agentId) where.agentId = agentId
    if (userId) where.userId = userId

    const stats = await this.prisma.executionStats.aggregate({
      where,
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

    return {
      totalExecutions: stats._sum.totalExecutions || 0,
      successfulExecutions: stats._sum.successfulExecutions || 0,
      failedExecutions: stats._sum.failedExecutions || 0,
      totalTokens: stats._sum.totalTokens || 0,
      totalDuration: stats._sum.totalDuration || 0,
      avgTokens: stats._avg.avgTokens || 0,
      avgDuration: stats._avg.avgDuration || 0
    }
  }

  /**
   * Clean up old execution data
   */
  async cleanupOldExecutions(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await this.prisma.agentExecution.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    })

    return result.count
  }
}
