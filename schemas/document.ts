import { z } from 'zod'

// Document Schema
export const DocumentSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(255),
  content: z.string(),
  version: z.number().int().positive(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Document Create Schema
export const DocumentCreateSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
})

// Document Update Schema
export const DocumentUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string(),
  changeDescription: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

// Document Version Schema
export const DocumentVersionSchema = z.object({
  id: z.string().cuid(),
  documentId: z.string().cuid(),
  content: z.string(),
  version: z.number().int().positive(),
  changeDescription: z.string().optional(),
  createdBy: z.string().cuid().optional(),
  createdAt: z.date(),
})

// Document Version Create Schema
export const DocumentVersionCreateSchema = z.object({
  documentId: z.string().cuid(),
  content: z.string(),
  version: z.number().int().positive(),
  changeDescription: z.string().optional(),
  createdBy: z.string().cuid().optional(),
})

// Document List Schema
export const DocumentListSchema = z.object({
  documents: z.array(DocumentSchema),
  total: z.number().int().positive(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
})

// Document Query Schema
export const DocumentQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Document Version List Schema
export const DocumentVersionListSchema = z.object({
  versions: z.array(DocumentVersionSchema),
  total: z.number().int().positive(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
})

// Document Version Query Schema
export const DocumentVersionQuerySchema = z.object({
  documentId: z.string().cuid(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['version', 'createdAt']).default('version'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Type exports
export type Document = z.infer<typeof DocumentSchema>
export type DocumentCreate = z.infer<typeof DocumentCreateSchema>
export type DocumentUpdate = z.infer<typeof DocumentUpdateSchema>
export type DocumentVersion = z.infer<typeof DocumentVersionSchema>
export type DocumentVersionCreate = z.infer<typeof DocumentVersionCreateSchema>
export type DocumentList = z.infer<typeof DocumentListSchema>
export type DocumentQuery = z.infer<typeof DocumentQuerySchema>
export type DocumentVersionList = z.infer<typeof DocumentVersionListSchema>
export type DocumentVersionQuery = z.infer<typeof DocumentVersionQuerySchema> 