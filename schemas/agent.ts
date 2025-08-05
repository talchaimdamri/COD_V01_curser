import { z } from 'zod'

// Agent Tool Schema
export const AgentToolSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['function', 'api', 'file']),
  config: z.record(z.any()),
})

// Agent Schema
export const AgentSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(255),
  prompt: z.string().min(1),
  model: z.string().min(1),
  tools: z.array(AgentToolSchema).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Agent Create Schema
export const AgentCreateSchema = z.object({
  name: z.string().min(1).max(255),
  prompt: z.string().min(1),
  model: z.string().min(1),
  tools: z.array(AgentToolSchema).optional(),
  metadata: z.record(z.any()).optional(),
})

// Agent Update Schema
export const AgentUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  prompt: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  tools: z.array(AgentToolSchema).optional(),
  metadata: z.record(z.any()).optional(),
})

// Agent Execution Schema
export const AgentExecutionSchema = z.object({
  agentId: z.string().cuid(),
  input: z.string(),
  metadata: z.record(z.any()).optional(),
})

// Agent Execution Result Schema
export const AgentExecutionResultSchema = z.object({
  id: z.string().cuid(),
  agentId: z.string().cuid(),
  input: z.string(),
  output: z.string(),
  duration: z.number().positive(),
  tokens: z.number().int().positive(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
})

// Agent List Schema
export const AgentListSchema = z.object({
  agents: z.array(AgentSchema),
  total: z.number().int().positive(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
})

// Agent Query Schema
export const AgentQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  model: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Supported Models Schema
export const SupportedModelsSchema = z.object({
  openai: z.array(z.string()),
  anthropic: z.array(z.string()),
  local: z.array(z.string()),
})

// Type exports
export type AgentTool = z.infer<typeof AgentToolSchema>
export type Agent = z.infer<typeof AgentSchema>
export type AgentCreate = z.infer<typeof AgentCreateSchema>
export type AgentUpdate = z.infer<typeof AgentUpdateSchema>
export type AgentExecution = z.infer<typeof AgentExecutionSchema>
export type AgentExecutionResult = z.infer<typeof AgentExecutionResultSchema>
export type AgentList = z.infer<typeof AgentListSchema>
export type AgentQuery = z.infer<typeof AgentQuerySchema>
export type SupportedModels = z.infer<typeof SupportedModelsSchema> 