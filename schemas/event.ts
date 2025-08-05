import { z } from 'zod'

// Base Event Schema
export const EventSchema = z.object({
  id: z.string().cuid(),
  type: z.string(),
  payload: z.record(z.any()),
  timestamp: z.date(),
  userId: z.string().cuid().optional(),
  streamId: z.string(),
  version: z.number().int().positive(),
})

// Event Type Schemas
export const ChainCreatedEventSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export const ChainUpdatedEventSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export const ChainCanvasUpdatedEventSchema = z.object({
  canvasState: z.object({
    nodes: z.array(z.record(z.any())),
    edges: z.array(z.record(z.any())),
    viewport: z.object({
      x: z.number(),
      y: z.number(),
      zoom: z.number(),
    }),
  }),
  viewport: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
  }).optional(),
})

export const DocumentCreatedEventSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
})

export const DocumentUpdatedEventSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string(),
  changeDescription: z.string().optional(),
})

export const DocumentDeletedEventSchema = z.object({
  reason: z.string().optional(),
})

export const AgentCreatedEventSchema = z.object({
  name: z.string().min(1).max(255),
  prompt: z.string().min(1),
  model: z.string().min(1),
  tools: z.array(z.record(z.any())).optional(),
  metadata: z.record(z.any()).optional(),
})

export const AgentUpdatedEventSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  prompt: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  tools: z.array(z.record(z.any())).optional(),
  metadata: z.record(z.any()).optional(),
})

export const AgentExecutedEventSchema = z.object({
  input: z.string(),
  output: z.string(),
  duration: z.number().positive(),
  tokens: z.number().int().positive(),
  metadata: z.record(z.any()).optional(),
})

export const EdgeCreatedEventSchema = z.object({
  sourceId: z.string().cuid(),
  targetId: z.string().cuid(),
  type: z.string().min(1),
  metadata: z.record(z.any()).optional(),
})

export const EdgeUpdatedEventSchema = z.object({
  metadata: z.record(z.any()),
})

export const EdgeDeletedEventSchema = z.object({
  reason: z.string().optional(),
})

// Generic test event schema for MVP
export const TestEventSchema = z.object({
  name: z.string().optional(),
  data: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
})

// System event schema for MVP
export const SystemEventSchema = z.object({
  version: z.string().optional(),
  data: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
})

// Event Type Registry
export const EventTypeSchemas = {
  'chain.created': ChainCreatedEventSchema,
  'chain.updated': ChainUpdatedEventSchema,
  'chain.canvas_updated': ChainCanvasUpdatedEventSchema,
  'document.created': DocumentCreatedEventSchema,
  'document.updated': DocumentUpdatedEventSchema,
  'document.deleted': DocumentDeletedEventSchema,
  'agent.created': AgentCreatedEventSchema,
  'agent.updated': AgentUpdatedEventSchema,
  'agent.executed': AgentExecutedEventSchema,
  'edge.created': EdgeCreatedEventSchema,
  'edge.updated': EdgeUpdatedEventSchema,
  'edge.deleted': EdgeDeletedEventSchema,
  'test.created': TestEventSchema,
  'test.updated': TestEventSchema,
  'test.deleted': TestEventSchema,
  'system.initialized': SystemEventSchema,
} as const

export type EventType = keyof typeof EventTypeSchemas

// Type-safe event payload validation
export function validateEventPayload(type: EventType, payload: any) {
  const schema = EventTypeSchemas[type]
  if (!schema) {
    throw new Error(`Unknown event type: ${type}`)
  }
  return schema.parse(payload)
}

// Event creation helper
export function createEvent(
  type: EventType,
  payload: any,
  streamId: string,
  version: number,
  userId?: string
) {
  const validatedPayload = validateEventPayload(type, payload)
  
  return {
    id: crypto.randomUUID(),
    type,
    payload: validatedPayload,
    timestamp: new Date(),
    userId,
    streamId,
    version,
  }
}

// Type exports
export type ChainCreatedEvent = z.infer<typeof ChainCreatedEventSchema>
export type ChainUpdatedEvent = z.infer<typeof ChainUpdatedEventSchema>
export type ChainCanvasUpdatedEvent = z.infer<typeof ChainCanvasUpdatedEventSchema>
export type DocumentCreatedEvent = z.infer<typeof DocumentCreatedEventSchema>
export type DocumentUpdatedEvent = z.infer<typeof DocumentUpdatedEventSchema>
export type DocumentDeletedEvent = z.infer<typeof DocumentDeletedEventSchema>
export type AgentCreatedEvent = z.infer<typeof AgentCreatedEventSchema>
export type AgentUpdatedEvent = z.infer<typeof AgentUpdatedEventSchema>
export type AgentExecutedEvent = z.infer<typeof AgentExecutedEventSchema>
export type EdgeCreatedEvent = z.infer<typeof EdgeCreatedEventSchema>
export type EdgeUpdatedEvent = z.infer<typeof EdgeUpdatedEventSchema>
export type EdgeDeletedEvent = z.infer<typeof EdgeDeletedEventSchema> 