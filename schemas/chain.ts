import { z } from 'zod'

// Canvas Node Schema
export const CanvasNodeSchema = z.object({
  id: z.string().cuid(),
  type: z.enum(['document', 'agent']),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
})

// Canvas Edge Schema
export const CanvasEdgeSchema = z.object({
  id: z.string().cuid(),
  source: z.string().cuid(),
  target: z.string().cuid(),
  type: z.string(),
  label: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

// Canvas State Schema
export const CanvasStateSchema = z.object({
  nodes: z.array(CanvasNodeSchema),
  edges: z.array(CanvasEdgeSchema),
  viewport: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number().min(0.1).max(3),
  }),
  selection: z.array(z.string()).optional(),
})

// Chain Schema
export const ChainSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  canvasState: CanvasStateSchema,
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Chain Create Schema
export const ChainCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  canvasState: CanvasStateSchema.optional(),
  metadata: z.record(z.any()).optional(),
})

// Chain Update Schema
export const ChainUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  canvasState: CanvasStateSchema.optional(),
  metadata: z.record(z.any()).optional(),
})

// Chain List Schema
export const ChainListSchema = z.object({
  chains: z.array(ChainSchema),
  total: z.number().int().positive(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
})

// Chain Query Schema
export const ChainQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Type exports
export type CanvasNode = z.infer<typeof CanvasNodeSchema>
export type CanvasEdge = z.infer<typeof CanvasEdgeSchema>
export type CanvasState = z.infer<typeof CanvasStateSchema>
export type Chain = z.infer<typeof ChainSchema>
export type ChainCreate = z.infer<typeof ChainCreateSchema>
export type ChainUpdate = z.infer<typeof ChainUpdateSchema>
export type ChainList = z.infer<typeof ChainListSchema>
export type ChainQuery = z.infer<typeof ChainQuerySchema> 