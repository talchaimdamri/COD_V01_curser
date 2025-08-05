import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { EventStore } from '../services/eventStore'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const eventStore = new EventStore(prisma)

// Request/Response schemas
const GetEventsQuerySchema = z.object({
  streamId: z.string().optional(),
  type: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
})

const CreateEventSchema = z.object({
  type: z.string(),
  payload: z.record(z.any()),
  streamId: z.string(),
  version: z.number().int().positive(),
  userId: z.string().optional(),
})

const GetSnapshotSchema = z.object({
  streamId: z.string(),
  type: z.enum(['chain', 'document', 'agent']),
})

const CreateSnapshotSchema = z.object({
  streamId: z.string(),
  type: z.enum(['chain', 'document', 'agent']),
  data: z.record(z.any()),
})

export default async function eventRoutes(fastify: FastifyInstance) {
  // Get events with filtering
  fastify.get('/events', {
    schema: {
      querystring: GetEventsQuerySchema,
      response: {
        200: z.object({
          events: z.array(z.any()),
          total: z.number(),
          limit: z.number(),
          offset: z.number(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { streamId, type, userId, startDate, endDate, limit, offset } = request.query as z.infer<typeof GetEventsQuerySchema>

      let events
      let total = 0

      if (streamId) {
        events = await eventStore.getEvents(streamId)
        total = events.length
      } else if (type) {
        events = await eventStore.getEventsByType(type as any)
        total = events.length
      } else if (userId) {
        events = await eventStore.getEventsByUser(userId)
        total = events.length
      } else if (startDate && endDate) {
        events = await eventStore.getEventsByTimeRange(new Date(startDate), new Date(endDate))
        total = events.length
      } else {
        // Get all events with pagination
        const allEvents = await prisma.event.findMany({
          orderBy: { timestamp: 'desc' },
          skip: offset,
          take: limit,
        })
        events = allEvents
        total = await prisma.event.count()
      }

      return {
        events,
        total,
        limit,
        offset,
      }
    },
  })

  // Create new events
  fastify.post('/events', {
    schema: {
      body: z.array(CreateEventSchema),
      response: {
        201: z.object({
          success: z.boolean(),
          count: z.number(),
        }),
      },
    },
    handler: async (request, reply) => {
      const events = request.body as z.infer<typeof CreateEventSchema>[]

      await eventStore.append(events)

      return reply.code(201).send({
        success: true,
        count: events.length,
      })
    },
  })

  // Get events for a specific stream
  fastify.get('/events/stream/:streamId', {
    schema: {
      params: z.object({
        streamId: z.string(),
      }),
      response: {
        200: z.object({
          events: z.array(z.any()),
          streamId: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { streamId } = request.params as { streamId: string }
      const events = await eventStore.getEvents(streamId)

      return {
        events,
        streamId,
      }
    },
  })

  // Get latest version for a stream
  fastify.get('/events/stream/:streamId/version', {
    schema: {
      params: z.object({
        streamId: z.string(),
      }),
      response: {
        200: z.object({
          streamId: z.string(),
          version: z.number(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { streamId } = request.params as { streamId: string }
      const version = await eventStore.getLatestVersion(streamId)

      return {
        streamId,
        version,
      }
    },
  })

  // Get snapshot for a stream
  fastify.get('/events/snapshot', {
    schema: {
      querystring: GetSnapshotSchema,
      response: {
        200: z.object({
          snapshot: z.any().nullable(),
          streamId: z.string(),
          type: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { streamId, type } = request.query as z.infer<typeof GetSnapshotSchema>
      const snapshot = await eventStore.getSnapshot(streamId, type)

      return {
        snapshot,
        streamId,
        type,
      }
    },
  })

  // Create snapshot for a stream
  fastify.post('/events/snapshot', {
    schema: {
      body: CreateSnapshotSchema,
      response: {
        201: z.object({
          success: z.boolean(),
          snapshot: z.any(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { streamId, type, data } = request.body as z.infer<typeof CreateSnapshotSchema>
      const snapshot = await eventStore.createSnapshot(streamId, data, type)

      return reply.code(201).send({
        success: true,
        snapshot,
      })
    },
  })

  // Replay events to reconstruct state
  fastify.get('/events/replay/:streamId', {
    schema: {
      params: z.object({
        streamId: z.string(),
      }),
      querystring: z.object({
        type: z.enum(['chain', 'document', 'agent']),
      }),
      response: {
        200: z.object({
          state: z.any(),
          streamId: z.string(),
          type: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { streamId } = request.params as { streamId: string }
      const { type } = request.query as { type: 'chain' | 'document' | 'agent' }
      const state = await eventStore.replay(streamId, type)

      return {
        state,
        streamId,
        type,
      }
    },
  })

  // Get event statistics
  fastify.get('/events/stats', {
    schema: {
      response: {
        200: z.object({
          totalEvents: z.number(),
          eventsByType: z.array(z.object({
            type: z.string(),
            count: z.number(),
          })),
          recentEvents: z.array(z.any()),
        }),
      },
    },
    handler: async (request, reply) => {
      const stats = await eventStore.getEventStats()

      return {
        totalEvents: stats.totalEvents,
        eventsByType: stats.eventsByType.map(item => ({
          type: item.type,
          count: item._count.type,
        })),
        recentEvents: stats.recentEvents,
      }
    },
  })

  // Clean up old events (admin only)
  fastify.delete('/events/cleanup', {
    schema: {
      body: z.object({
        olderThan: z.string().datetime(),
      }),
      response: {
        200: z.object({
          success: z.boolean(),
          deletedCount: z.number(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { olderThan } = request.body as { olderThan: string }
      const result = await eventStore.cleanupOldEvents(new Date(olderThan))

      return {
        success: true,
        deletedCount: result.count,
      }
    },
  })
} 