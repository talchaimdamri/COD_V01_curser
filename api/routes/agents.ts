import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { AgentExecutionService } from '../../src/services/agentExecution'
import { AgentExecution } from '../../schemas/agent'

interface StreamRequest {
  Body: AgentExecution
}

interface StatusRequest {
  Params: {
    id: string
  }
}

export default async function agentsRoutes(fastify: FastifyInstance) {
  // POST /api/agents/stream - Stream agent execution
  fastify.post<StreamRequest>('/agents/stream', async (request, reply) => {
    try {
      const execution = request.body

      // Validate request
      if (!execution.agentId) {
        return reply.status(400).send({ error: 'Agent ID is required' })
      }

      if (!execution.input?.trim()) {
        return reply.status(400).send({ error: 'Input is required' })
      }

      // Set up Server-Sent Events
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      })

      const agentExecutionService = AgentExecutionService.getInstance()

      // Stream the execution
      try {
        for await (const chunk of agentExecutionService.streamExecution(execution)) {
          // Send chunk as Server-Sent Event
          reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`)
        }
        
        // Send completion signal
        reply.raw.write('data: [DONE]\n\n')
      } catch (error) {
        const errorChunk = {
          type: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        reply.raw.write(`data: ${JSON.stringify(errorChunk)}\n\n`)
      }

      reply.raw.end()
    } catch (error) {
      console.error('Streaming error:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // POST /api/agents/execute - Execute agent without streaming
  fastify.post<StreamRequest>('/agents/execute', async (request, reply) => {
    try {
      const execution = request.body

      // Validate request
      if (!execution.agentId) {
        return reply.status(400).send({ error: 'Agent ID is required' })
      }

      if (!execution.input?.trim()) {
        return reply.status(400).send({ error: 'Input is required' })
      }

      const agentExecutionService = AgentExecutionService.getInstance()
      const result = await agentExecutionService.executeAgent(execution)

      return reply.send(result)
    } catch (error) {
      console.error('Execution error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return reply.status(500).send({ error: errorMessage })
    }
  })

  // GET /api/agents/:id/status - Get execution status
  fastify.get<StatusRequest>('/agents/:id/status', async (request, reply) => {
    try {
      const executionId = request.params.id
      const agentExecutionService = AgentExecutionService.getInstance()
      const status = agentExecutionService.getExecutionStatus(executionId)

      if (!status) {
        return reply.status(404).send({ error: 'Execution not found' })
      }

      return reply.send(status)
    } catch (error) {
      console.error('Status error:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // GET /api/agents/providers - Get available providers
  fastify.get('/agents/providers', async (request, reply) => {
    try {
      const agentExecutionService = AgentExecutionService.getInstance()
      const providers = agentExecutionService.getAvailableProviders()

      return reply.send({ providers })
    } catch (error) {
      console.error('Providers error:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
