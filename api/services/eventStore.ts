import { PrismaClient } from '@prisma/client'
import { 
  EventType, 
  validateEventPayload, 
  createEvent,
  EventTypeSchemas 
} from '../../schemas/event'

export class EventStore {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Append events to the event store
   */
  async append(events: Array<{
    type: EventType
    payload: any
    streamId: string
    version: number
    userId?: string
  }>) {
    const validatedEvents = events.map(event => {
      const validatedPayload = validateEventPayload(event.type, event.payload)
      return {
        id: crypto.randomUUID(),
        type: event.type,
        payload: validatedPayload,
        timestamp: new Date(),
        userId: event.userId,
        streamId: event.streamId,
        version: event.version,
      }
    })

    return await this.prisma.event.createMany({
      data: validatedEvents,
    })
  }

  /**
   * Get all events for a specific stream
   */
  async getEvents(streamId: string) {
    return await this.prisma.event.findMany({
      where: { streamId },
      orderBy: { version: 'asc' },
    })
  }

  /**
   * Get events by type
   */
  async getEventsByType(type: EventType) {
    return await this.prisma.event.findMany({
      where: { type },
      orderBy: { timestamp: 'asc' },
    })
  }

  /**
   * Get events by user
   */
  async getEventsByUser(userId: string) {
    return await this.prisma.event.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    })
  }

  /**
   * Get events within a time range
   */
  async getEventsByTimeRange(startDate: Date, endDate: Date) {
    return await this.prisma.event.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    })
  }

  /**
   * Get the latest version number for a stream
   */
  async getLatestVersion(streamId: string): Promise<number> {
    const latestEvent = await this.prisma.event.findFirst({
      where: { streamId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })

    return latestEvent?.version || 0
  }

  /**
   * Create a snapshot for a stream
   */
  async createSnapshot(streamId: string, snapshotData: any, snapshotType: 'chain' | 'document' | 'agent') {
    const latestEvent = await this.prisma.event.findFirst({
      where: { streamId },
      orderBy: { version: 'desc' },
    })

    if (!latestEvent) {
      throw new Error(`No events found for stream: ${streamId}`)
    }

    switch (snapshotType) {
      case 'chain':
        return await this.prisma.chainSnapshot.upsert({
          where: { id: streamId },
          update: {
            ...snapshotData,
            lastEventId: latestEvent.id,
            lastEventVersion: latestEvent.version,
            updatedAt: new Date(),
          },
          create: {
            id: streamId,
            ...snapshotData,
            lastEventId: latestEvent.id,
            lastEventVersion: latestEvent.version,
          },
        })

      case 'document':
        return await this.prisma.documentSnapshot.upsert({
          where: { id: streamId },
          update: {
            ...snapshotData,
            lastEventId: latestEvent.id,
            lastEventVersion: latestEvent.version,
            updatedAt: new Date(),
          },
          create: {
            id: streamId,
            ...snapshotData,
            lastEventId: latestEvent.id,
            lastEventVersion: latestEvent.version,
          },
        })

      case 'agent':
        return await this.prisma.agentSnapshot.upsert({
          where: { id: streamId },
          update: {
            ...snapshotData,
            lastEventId: latestEvent.id,
            lastEventVersion: latestEvent.version,
            updatedAt: new Date(),
          },
          create: {
            id: streamId,
            ...snapshotData,
            lastEventId: latestEvent.id,
            lastEventVersion: latestEvent.version,
          },
        })

      default:
        throw new Error(`Unknown snapshot type: ${snapshotType}`)
    }
  }

  /**
   * Get a snapshot for a stream
   */
  async getSnapshot(streamId: string, snapshotType: 'chain' | 'document' | 'agent') {
    switch (snapshotType) {
      case 'chain':
        return await this.prisma.chainSnapshot.findUnique({
          where: { id: streamId },
        })

      case 'document':
        return await this.prisma.documentSnapshot.findUnique({
          where: { id: streamId },
        })

      case 'agent':
        return await this.prisma.agentSnapshot.findUnique({
          where: { id: streamId },
        })

      default:
        throw new Error(`Unknown snapshot type: ${snapshotType}`)
    }
  }

  /**
   * Replay events to reconstruct state
   */
  async replay(streamId: string, snapshotType: 'chain' | 'document' | 'agent') {
    const events = await this.getEvents(streamId)
    const snapshot = await this.getSnapshot(streamId, snapshotType)

    // Start with snapshot if available
    let state = snapshot ? { ...snapshot } : null

    // Replay events to reconstruct state
    for (const event of events) {
      state = this.applyEvent(state, event, snapshotType)
    }

    return state
  }

  /**
   * Apply a single event to state
   */
  private applyEvent(state: any, event: any, snapshotType: string) {
    const validatedPayload = validateEventPayload(event.type as EventType, event.payload)

    switch (event.type) {
      case 'chain.created':
        return {
          id: event.streamId,
          name: validatedPayload.name,
          description: validatedPayload.description,
          canvasState: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
          metadata: validatedPayload.metadata || {},
          createdAt: event.timestamp,
          updatedAt: event.timestamp,
        }

      case 'chain.updated':
        return {
          ...state,
          ...validatedPayload,
          updatedAt: event.timestamp,
        }

      case 'chain.canvas_updated':
        return {
          ...state,
          canvasState: validatedPayload.canvasState,
          updatedAt: event.timestamp,
        }

      case 'document.created':
        return {
          id: event.streamId,
          title: validatedPayload.title,
          content: validatedPayload.content,
          version: 1,
          metadata: validatedPayload.metadata || {},
          createdAt: event.timestamp,
          updatedAt: event.timestamp,
        }

      case 'document.updated':
        return {
          ...state,
          ...validatedPayload,
          version: (state?.version || 0) + 1,
          updatedAt: event.timestamp,
        }

      case 'agent.created':
        return {
          id: event.streamId,
          name: validatedPayload.name,
          prompt: validatedPayload.prompt,
          model: validatedPayload.model,
          tools: validatedPayload.tools || [],
          metadata: validatedPayload.metadata || {},
          createdAt: event.timestamp,
          updatedAt: event.timestamp,
        }

      case 'agent.updated':
        return {
          ...state,
          ...validatedPayload,
          updatedAt: event.timestamp,
        }

      default:
        // For unknown events, just return the current state
        return state
    }
  }

  /**
   * Get event statistics
   */
  async getEventStats() {
    const [totalEvents, eventsByType, recentEvents] = await Promise.all([
      this.prisma.event.count(),
      this.prisma.event.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      this.prisma.event.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: { user: { select: { name: true, email: true } } },
      }),
    ])

    return {
      totalEvents,
      eventsByType,
      recentEvents,
    }
  }

  /**
   * Clean up old events (for maintenance)
   */
  async cleanupOldEvents(olderThan: Date) {
    return await this.prisma.event.deleteMany({
      where: {
        timestamp: {
          lt: olderThan,
        },
      },
    })
  }
} 