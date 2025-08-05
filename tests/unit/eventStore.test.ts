import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { EventStore } from '../../api/services/eventStore'
import { createEvent } from '../../schemas/event'

describe('EventStore', () => {
  let prisma: PrismaClient
  let eventStore: EventStore

  beforeEach(async () => {
    prisma = new PrismaClient()
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

  describe('append', () => {
    it('should append events to the store', async () => {
      const events = [
        {
          type: 'chain.created' as const,
          payload: { name: 'Test Chain', description: 'Test Description' },
          streamId: 'chain-1',
          version: 1,
          userId: 'user-1',
        },
      ]

      await eventStore.append(events)

      const storedEvents = await prisma.event.findMany({
        where: { streamId: 'chain-1' },
      })

      expect(storedEvents).toHaveLength(1)
      expect(storedEvents[0].type).toBe('chain.created')
      expect(storedEvents[0].streamId).toBe('chain-1')
      expect(storedEvents[0].version).toBe(1)
    })

    it('should validate event payloads', async () => {
      const events = [
        {
          type: 'chain.created' as const,
          payload: { invalidField: 'test' }, // Missing required fields
          streamId: 'chain-1',
          version: 1,
        },
      ]

      await expect(eventStore.append(events)).rejects.toThrow()
    })
  })

  describe('getEvents', () => {
    it('should retrieve events for a stream', async () => {
      // Create test events
      await prisma.event.createMany({
        data: [
          {
            id: 'event-1',
            type: 'chain.created',
            payload: { name: 'Test Chain' },
            streamId: 'chain-1',
            version: 1,
            timestamp: new Date(),
          },
          {
            id: 'event-2',
            type: 'chain.updated',
            payload: { name: 'Updated Chain' },
            streamId: 'chain-1',
            version: 2,
            timestamp: new Date(),
          },
        ],
      })

      const events = await eventStore.getEvents('chain-1')

      expect(events).toHaveLength(2)
      expect(events[0].version).toBe(1)
      expect(events[1].version).toBe(2)
    })
  })

  describe('getLatestVersion', () => {
    it('should return the latest version for a stream', async () => {
      await prisma.event.createMany({
        data: [
          {
            id: 'event-1',
            type: 'chain.created',
            payload: { name: 'Test Chain' },
            streamId: 'chain-1',
            version: 1,
            timestamp: new Date(),
          },
          {
            id: 'event-2',
            type: 'chain.updated',
            payload: { name: 'Updated Chain' },
            streamId: 'chain-1',
            version: 2,
            timestamp: new Date(),
          },
        ],
      })

      const version = await eventStore.getLatestVersion('chain-1')
      expect(version).toBe(2)
    })

    it('should return 0 for non-existent stream', async () => {
      const version = await eventStore.getLatestVersion('non-existent')
      expect(version).toBe(0)
    })
  })

  describe('createSnapshot', () => {
    it('should create a chain snapshot', async () => {
      // Create a test event first
      await prisma.event.create({
        data: {
          id: 'event-1',
          type: 'chain.created',
          payload: { name: 'Test Chain' },
          streamId: 'chain-1',
          version: 1,
          timestamp: new Date(),
        },
      })

      const snapshotData = {
        name: 'Test Chain',
        canvasState: { nodes: [], edges: [] },
        metadata: {},
      }

      const snapshot = await eventStore.createSnapshot('chain-1', snapshotData, 'chain')

      expect(snapshot.id).toBe('chain-1')
      expect(snapshot.name).toBe('Test Chain')
      expect(snapshot.lastEventVersion).toBe(1)
    })

    it('should throw error for non-existent stream', async () => {
      const snapshotData = {
        name: 'Test Chain',
        canvasState: { nodes: [], edges: [] },
        metadata: {},
      }

      await expect(
        eventStore.createSnapshot('non-existent', snapshotData, 'chain')
      ).rejects.toThrow('No events found for stream')
    })
  })

  describe('replay', () => {
    it('should replay events to reconstruct state', async () => {
      // Create test events
      await prisma.event.createMany({
        data: [
          {
            id: 'event-1',
            type: 'chain.created',
            payload: { name: 'Test Chain', description: 'Test Description' },
            streamId: 'chain-1',
            version: 1,
            timestamp: new Date(),
          },
          {
            id: 'event-2',
            type: 'chain.updated',
            payload: { name: 'Updated Chain' },
            streamId: 'chain-1',
            version: 2,
            timestamp: new Date(),
          },
        ],
      })

      const state = await eventStore.replay('chain-1', 'chain')

      expect(state).toBeDefined()
      expect(state.name).toBe('Updated Chain')
      expect(state.description).toBe('Test Description')
    })
  })

  describe('getEventStats', () => {
    it('should return event statistics', async () => {
      // Create test events
      await prisma.event.createMany({
        data: [
          {
            id: 'event-1',
            type: 'chain.created',
            payload: { name: 'Test Chain' },
            streamId: 'chain-1',
            version: 1,
            timestamp: new Date(),
          },
          {
            id: 'event-2',
            type: 'document.created',
            payload: { title: 'Test Document' },
            streamId: 'doc-1',
            version: 1,
            timestamp: new Date(),
          },
        ],
      })

      const stats = await eventStore.getEventStats()

      expect(stats.totalEvents).toBe(2)
      expect(stats.eventsByType).toHaveLength(2)
      expect(stats.recentEvents).toHaveLength(2)
    })
  })
}) 