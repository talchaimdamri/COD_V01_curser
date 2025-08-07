import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { optionalAuth } from '../middleware/auth'
import { ChainService } from '../services/chain'

const prisma = new PrismaClient()
const chainService = new ChainService(prisma)

const SaveCanvasSchema = z.object({
  chainId: z.string(),
  name: z.string().optional(),
  canvasState: z.record(z.any()),
})

export default async function chainsRoutes(fastify: FastifyInstance) {
  // Get chain snapshot
  fastify.get('/chains/:chainId', { preHandler: optionalAuth }, async (request, reply) => {
    const { chainId } = request.params as { chainId: string }
    const chain = await chainService.getChain(chainId)
    if (!chain) return reply.status(404).send({ success: false, error: 'Chain not found' })
    return reply.send({ success: true, chain })
  })

  // Save/Update chain canvas
  fastify.post('/chains/:chainId/canvas', {
    preHandler: optionalAuth,
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          canvasState: { type: 'object' },
        },
        required: ['canvasState'],
      },
    },
  }, async (request, reply) => {
    try {
      const { chainId } = request.params as { chainId: string }
      const body = SaveCanvasSchema.parse({ ...request.body, chainId })
      const userId = request.user?.id || null
      const result = await chainService.upsertChainCanvas({ chainId, name: body.name, canvasState: body.canvasState, userId })
      return reply.send({ success: true, chain: result })
    } catch (error) {
      fastify.log.error('Error saving chain canvas', error)
      return reply.status(400).send({ success: false, error: 'Invalid payload' })
    }
  })
}


