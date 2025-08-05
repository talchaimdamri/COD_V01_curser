import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { EventStore } from '../services/eventStore'
import { PrismaClient } from '@prisma/client'
import { optionalAuth } from '../middleware/auth'

const prisma = new PrismaClient()
const eventStore = new EventStore(prisma)

// Serialization function to convert Prisma objects to JSON-safe objects
function serializeEvent(event: any) {
  console.log('Serializing event:', JSON.stringify(event, null, 2)); // Debug log
  const serialized = {
    id: event.id,
    type: event.type,
    payload: event.payload,
    timestamp: event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp,
    userId: event.userId,
    streamId: event.streamId,
    version: event.version,
  }
  console.log('Serialized result:', JSON.stringify(serialized, null, 2)); // Debug log
  return serialized
}

function serializeEvents(events: any[]) {
  return events.map(serializeEvent)
}

// Serialization function for snapshots
function serializeSnapshot(snapshot: any) {
  if (!snapshot) return null
  
  return {
    ...snapshot,
    createdAt: snapshot.createdAt instanceof Date ? snapshot.createdAt.toISOString() : snapshot.createdAt,
    updatedAt: snapshot.updatedAt instanceof Date ? snapshot.updatedAt.toISOString() : snapshot.updatedAt,
  }
}

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
    preHandler: optionalAuth,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          streamId: { type: 'string' },
          type: { type: 'string' },
          userId: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'number', minimum: 0, default: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            events: { type: 'array' },
            total: { type: 'number' },
            limit: { type: 'number' },
            offset: { type: 'number' },
          },
          required: ['events', 'total', 'limit', 'offset'],
        },
      },
    },
    handler: async (request, reply) => {
      // Parse and validate query using Zod to ensure defaults are applied
      const parseResult = GetEventsQuerySchema.safeParse(request.query)
      if (!parseResult.success) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: parseResult.error.message,
        })
      }
      const query = parseResult.data
      const { streamId, type, userId, startDate, endDate, limit, offset } = query

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

      const serializedEvents = serializeEvents(events)

      return {
        events: serializedEvents,
        total,
        limit,
        offset,
      }
    },
  })

  // Create new events
  fastify.post('/events', {
    preHandler: optionalAuth,
    preValidation: async (request, reply) => {
      // Handle malformed JSON
      if (request.headers['content-type']?.includes('application/json')) {
        try {
          if (typeof request.body === 'string') {
            JSON.parse(request.body)
          }
        } catch (err) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'Invalid JSON format',
          })
        }
      }
    },
    schema: {
      body: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            payload: { type: 'object' },
            streamId: { type: 'string' },
            version: { type: 'number', minimum: 1 },
            userId: { type: 'string' },
          },
          required: ['type', 'payload', 'streamId', 'version'],
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            count: { type: 'number' },
          },
          required: ['success', 'count'],
        },
      },
    },
    handler: async (request, reply) => {
      // Ensure body is an array and not empty
      if (!Array.isArray(request.body) || request.body.length === 0) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Request body must be a non-empty array of events',
        })
      }

      const events = request.body as z.infer<typeof CreateEventSchema>[]

      await eventStore.append(events as any)

      return reply.code(201).send({
        success: true,
        count: events.length,
      })
    },
  })

  // Get events for a specific stream
  fastify.get('/events/stream/:streamId', {
    preHandler: optionalAuth,
    schema: {
      params: {
        type: 'object',
        properties: {
          streamId: { type: 'string' },
        },
        required: ['streamId'],
      },
    },
    handler: async (request, reply) => {
      const { streamId } = request.params as { streamId: string }
      const events = await eventStore.getEvents(streamId)

      return {
        events: serializeEvents(events),
        streamId,
      }
    },
  })

  // Get latest version for a stream
  fastify.get('/events/stream/:streamId/version', {
    preHandler: optionalAuth,
    schema: {
      params: {
        type: 'object',
        properties: {
          streamId: { type: 'string' },
        },
        required: ['streamId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            streamId: { type: 'string' },
            version: { type: 'number' },
          },
          required: ['streamId', 'version'],
        },
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
    preHandler: optionalAuth,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          streamId: { type: 'string' },
          type: { type: 'string', enum: ['chain', 'document', 'agent'] },
        },
        required: ['streamId', 'type'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            snapshot: { type: ['object', 'null'] },
            streamId: { type: 'string' },
            type: { type: 'string' },
          },
          required: ['snapshot', 'streamId', 'type'],
        },
      },
    },
    handler: async (request, reply) => {
      const { streamId, type } = request.query as z.infer<typeof GetSnapshotSchema>
      const snapshot = await eventStore.getSnapshot(streamId, type)

      return {
        snapshot: serializeSnapshot(snapshot),
        streamId,
        type,
      }
    },
  })

  // Create snapshot for a stream
  fastify.post('/events/snapshot', {
    preHandler: optionalAuth,
    schema: {
      body: {
        type: 'object',
        properties: {
          streamId: { type: 'string' },
          type: { type: 'string', enum: ['chain', 'document', 'agent'] },
          data: { type: 'object' },
        },
        required: ['streamId', 'type', 'data'],
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            snapshot: { type: 'object' },
          },
          required: ['success', 'snapshot'],
        },
      },
    },
    handler: async (request, reply) => {
      const { streamId, type, data } = request.body as z.infer<typeof CreateSnapshotSchema>
      const snapshot = await eventStore.createSnapshot(streamId, data, type)

      return reply.code(201).send({
        success: true,
        snapshot: serializeSnapshot(snapshot),
      })
    },
  })

  // Replay events to reconstruct state
  fastify.get('/events/replay/:streamId', {
    preHandler: optionalAuth,
    schema: {
      params: {
        type: 'object',
        properties: {
          streamId: { type: 'string' },
        },
        required: ['streamId'],
      },
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['chain', 'document', 'agent'] },
        },
        required: ['type'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            state: { type: 'object' },
            streamId: { type: 'string' },
            type: { type: 'string' },
          },
          required: ['state', 'streamId', 'type'],
        },
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
    preHandler: optionalAuth,
    handler: async (request, reply) => {
      const stats = await eventStore.getEventStats()

      return {
        totalEvents: stats.totalEvents,
        eventsByType: stats.eventsByType.map(item => ({
          type: item.type,
          count: item._count.type,
        })),
        recentEvents: serializeEvents(stats.recentEvents),
      }
    },
  })

  // Debug endpoint to see raw event data
  fastify.get('/events/debug', {
    preHandler: optionalAuth,
    handler: async (request, reply) => {
      const rawEvents = await prisma.event.findMany({
        take: 2,
        orderBy: { timestamp: 'desc' },
      })
      
      const eventStoreEvents = await eventStore.getEvents('test-1')
      
      return {
        rawEvents,
        serializedEvents: serializeEvents(rawEvents),
        eventStoreEvents,
        serializedEventStoreEvents: serializeEvents(eventStoreEvents),
        eventCount: rawEvents.length,
      }
    },
  })

  // Clean up old events (admin only)
  fastify.delete('/events/cleanup', {
    preHandler: optionalAuth,
    schema: {
      body: {
        type: 'object',
        properties: {
          olderThan: { type: 'string', format: 'date-time' },
        },
        required: ['olderThan'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            deletedCount: { type: 'number' },
          },
          required: ['success', 'deletedCount'],
        },
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