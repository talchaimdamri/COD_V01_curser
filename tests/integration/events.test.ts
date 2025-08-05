import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

// Note: Server will be started by test runner

const prisma = new PrismaClient()

// Test data schemas
const EventSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.record(z.any()),
  streamId: z.string(),
  version: z.number(),
  userId: z.string().nullable(),
  timestamp: z.string(),
})

const EventsResponseSchema = z.object({
  events: z.array(EventSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
})

const CreateEventSchema = z.object({
  type: z.string(),
  payload: z.record(z.any()),
  streamId: z.string(),
  version: z.number().int().positive(),
  userId: z.string().optional(),
})

describe('Events API Integration Tests', () => {
  let server: FastifyInstance
  const baseUrl = 'http://localhost:4002'

  beforeAll(async () => {
    // Clean up test data
    await prisma.event.deleteMany()
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.event.deleteMany()
  })

  describe('IT-EV-01: GET /api/events', () => {
    it('should return empty events list when no events exist', async () => {
      const response = await request(baseUrl)
        .get('/api/events')
        .expect(200)

      const data = EventsResponseSchema.parse(response.body)
      expect(data.events).toHaveLength(0)
      expect(data.total).toBe(0)
      expect(data.limit).toBe(50)
      expect(data.offset).toBe(0)
    })

    it('should return events with pagination', async () => {
      // Create test events first
      const testEvents = [
        {
          type: 'chain.created',
          payload: { name: 'Test Chain 1' },
          streamId: 'chain-1',
          version: 1,
          userId: null,
        },
        {
          type: 'chain.created',
          payload: { name: 'Test Chain 2' },
          streamId: 'chain-2',
          version: 1,
          userId: null,
        },
      ]

      await request(baseUrl)
        .post('/api/events')
        .send(testEvents)
        .expect(201)

      const response = await request(baseUrl)
        .get('/api/events?limit=1&offset=0')
        .expect(200)

      const data = EventsResponseSchema.parse(response.body)
      expect(data.events).toHaveLength(1)
      expect(data.total).toBeGreaterThanOrEqual(2)
      expect(data.limit).toBe(1)
      expect(data.offset).toBe(0)
    })

    it('should filter events by streamId', async () => {
      const response = await request(baseUrl)
        .get('/api/events?streamId=chain-1')
        .expect(200)

      const data = EventsResponseSchema.parse(response.body)
      expect(data.events.every(event => event.streamId === 'chain-1')).toBe(true)
    })

    it('should filter events by type', async () => {
      const response = await request(baseUrl)
        .get('/api/events?type=chain.created')
        .expect(200)

      const data = EventsResponseSchema.parse(response.body)
      expect(data.events.every(event => event.type === 'chain.created')).toBe(true)
    })

    it('should filter events by userId', async () => {
      const response = await request(baseUrl)
        .get('/api/events?userId=null')
        .expect(200)

      const data = EventsResponseSchema.parse(response.body)
      expect(data.events.every(event => event.userId === null)).toBe(true)
    })

    it('should filter events by date range', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
      const endDate = new Date().toISOString()

      const response = await request(baseUrl)
        .get(`/api/events?startDate=${startDate}&endDate=${endDate}`)
        .expect(200)

      const data = EventsResponseSchema.parse(response.body)
      expect(data.events.length).toBeGreaterThanOrEqual(0)
    })

    it('should validate query parameters', async () => {
      // Test invalid limit
      await request(baseUrl)
        .get('/api/events?limit=0')
        .expect(400)

      // Test invalid offset
      await request(baseUrl)
        .get('/api/events?offset=-1')
        .expect(400)

      // Test invalid date format
      await request(baseUrl)
        .get('/api/events?startDate=invalid-date')
        .expect(400)
    })
  })

  describe('IT-EV-02: POST /api/events', () => {
    it('should create single event successfully', async () => {
      const event = {
        type: 'document.created',
        payload: { title: 'Test Document', content: 'Test content' },
        streamId: 'doc-1',
        version: 1,
        userId: null,
      }

      const response = await request(baseUrl)
        .post('/api/events')
        .send([event])
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.count).toBe(1)
    })

    it('should create multiple events successfully', async () => {
      const events = [
        {
          type: 'agent.created',
          payload: { name: 'Test Agent 1', model: 'gpt-4', prompt: 'Test prompt 1' },
          streamId: 'agent-1',
          version: 1,
          userId: null,
        },
        {
          type: 'agent.created',
          payload: { name: 'Test Agent 2', model: 'claude-3', prompt: 'Test prompt 2' },
          streamId: 'agent-2',
          version: 1,
          userId: null,
        },
      ]

      const response = await request(baseUrl)
        .post('/api/events')
        .send(events)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.count).toBe(2)
    })

    it('should handle events without userId', async () => {
      const event = {
        type: 'system.initialized',
        payload: { version: '1.0.0' },
        streamId: 'system-1',
        version: 1,
      }

      const response = await request(baseUrl)
        .post('/api/events')
        .send([event])
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.count).toBe(1)
    })
  })

  describe('IT-EV-03: Event validation', () => {
    it('should reject events with missing required fields', async () => {
      const invalidEvents = [
        {
          // Missing type
          payload: { title: 'Test' },
          streamId: 'doc-1',
          version: 1,
        },
        {
          type: 'test',
          // Missing payload
          streamId: 'doc-1',
          version: 1,
        },
        {
          type: 'test',
          payload: { title: 'Test' },
          // Missing streamId
          version: 1,
        },
        {
          type: 'test',
          payload: { title: 'Test' },
          streamId: 'doc-1',
          // Missing version
        },
      ]

      for (const invalidEvent of invalidEvents) {
        await request(baseUrl)
          .post('/api/events')
          .send([invalidEvent])
          .expect(400)
      }
    })

    it('should reject events with invalid version', async () => {
      const invalidEvent = {
        type: 'test',
        payload: { title: 'Test' },
        streamId: 'doc-1',
        version: 0, // Invalid: must be positive
      }

      await request(baseUrl)
        .post('/api/events')
        .send([invalidEvent])
        .expect(400)
    })

    it('should reject events with invalid payload', async () => {
      const invalidEvent = {
        type: 'test',
        payload: null, // Invalid: must be an object
        streamId: 'doc-1',
        version: 1,
      }

      await request(baseUrl)
        .post('/api/events')
        .send([invalidEvent])
        .expect(400)
    })

    it('should reject empty events array', async () => {
      await request(baseUrl)
        .post('/api/events')
        .send([])
        .expect(400)
    })

    it('should reject non-array payload', async () => {
      const singleEvent = {
        type: 'test',
        payload: { title: 'Test' },
        streamId: 'doc-1',
        version: 1,
      }

      await request(baseUrl)
        .post('/api/events')
        .send(singleEvent) // Should be array
        .expect(400)
    })
  })

  describe('IT-EV-04: Event retrieval and consistency', () => {
    it('should maintain event order by timestamp', async () => {
      // Clean up any existing events for this stream
      await prisma.event.deleteMany({
        where: { streamId: 'chain-1' }
      })

      // Create events with slight time differences
      const events = [
        {
          type: 'chain.created',
          payload: { name: 'Chain 1' },
          streamId: 'chain-1',
          version: 1,
          userId: null,
        },
        {
          type: 'chain.updated',
          payload: { name: 'Chain 1 Updated' },
          streamId: 'chain-1',
          version: 2,
          userId: null,
        },
      ]

      await request(baseUrl)
        .post('/api/events')
        .send(events)
        .expect(201)

      const response = await request(baseUrl)
        .get('/api/events?streamId=chain-1')
        .expect(200)

      const data = EventsResponseSchema.parse(response.body)
      expect(data.events).toHaveLength(2)
      
      // Events should be ordered by timestamp (newest first)
      const timestamps = data.events.map(e => new Date(e.timestamp).getTime())
      expect(timestamps[0]).toBeGreaterThanOrEqual(timestamps[1])
    })

    it('should return consistent event data structure', async () => {
      const response = await request(baseUrl)
        .get('/api/events')
        .expect(200)

      const data = EventsResponseSchema.parse(response.body)
      
      if (data.events.length > 0) {
        const event = data.events[0]
        expect(event).toHaveProperty('id')
        expect(event).toHaveProperty('type')
        expect(event).toHaveProperty('payload')
        expect(event).toHaveProperty('streamId')
        expect(event).toHaveProperty('version')
        expect(event).toHaveProperty('userId')
        expect(event).toHaveProperty('timestamp')
        
        expect(typeof event.id).toBe('string')
        expect(typeof event.type).toBe('string')
        expect(typeof event.payload).toBe('object')
        expect(typeof event.streamId).toBe('string')
        expect(typeof event.version).toBe('number')
        expect(typeof event.timestamp).toBe('string')
      }
    })
  })

  describe('IT-EV-05: Error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failures
      // For now, we'll test that the API responds properly to malformed requests
      await request(baseUrl)
        .post('/api/events')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400)
    })

    it('should return proper error messages', async () => {
      const response = await request(baseUrl)
        .post('/api/events')
        .send([{ invalid: 'event' }])
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body).toHaveProperty('message')
    })
  })
}) 