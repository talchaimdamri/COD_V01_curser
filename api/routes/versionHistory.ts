import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { VersionHistoryService } from '../services/versionHistory'
import { PrismaClient } from '@prisma/client'
import { optionalAuth } from '../middleware/auth'

const prisma = new PrismaClient()
const versionHistoryService = new VersionHistoryService(prisma)

// Request/Response schemas
const CreateVersionSchema = z.object({
  documentId: z.string(),
  content: z.string(),
  description: z.string(),
  isAutoSaved: z.boolean().optional().default(false),
  parentVersionId: z.string().optional(),
})

const GetVersionsQuerySchema = z.object({
  documentId: z.string(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
})

const GetVersionSchema = z.object({
  versionId: z.string(),
})

const RestoreVersionSchema = z.object({
  documentId: z.string(),
  versionId: z.string(),
  description: z.string().optional(),
})

const DeleteVersionSchema = z.object({
  versionId: z.string(),
})

const GetVersionDiffSchema = z.object({
  versionId1: z.string(),
  versionId2: z.string(),
})

const CreateBranchSchema = z.object({
  documentId: z.string(),
  baseVersionId: z.string(),
  branchName: z.string(),
})

const MergeBranchSchema = z.object({
  mainDocumentId: z.string(),
  branchDocumentId: z.string(),
  mergeStrategy: z.enum(['theirs', 'ours', 'manual']).default('manual'),
})

export default async function versionHistoryRoutes(fastify: FastifyInstance) {
  // Create a new version
  fastify.post('/versions', {
    preHandler: optionalAuth,
    schema: {
      body: {
        type: 'object',
        properties: {
          documentId: { type: 'string' },
          content: { type: 'string' },
          description: { type: 'string' },
          isAutoSaved: { type: 'boolean' },
          parentVersionId: { type: 'string' },
        },
        required: ['documentId', 'content', 'description'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            version: { type: 'object' },
          },
          required: ['success', 'version'],
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const body = CreateVersionSchema.parse(request.body)
        const userId = request.user?.id || 'anonymous'

        const version = await versionHistoryService.createVersion(
          body.documentId,
          body.content,
          body.description,
          userId,
          body.isAutoSaved,
          body.parentVersionId
        )

        return reply.send({
          success: true,
          version,
        })
      } catch (error) {
        fastify.log.error('Error creating version:', error)
        return reply.status(500).send({
          success: false,
          error: 'Failed to create version',
        })
      }
    },
  })

  // Get versions for a document
  fastify.get('/versions', {
    preHandler: optionalAuth,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          documentId: { type: 'string' },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'number', minimum: 0, default: 0 },
        },
        required: ['documentId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            versions: { type: 'array' },
            total: { type: 'number' },
            limit: { type: 'number' },
            offset: { type: 'number' },
          },
          required: ['success', 'versions', 'total', 'limit', 'offset'],
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const query = GetVersionsQuerySchema.parse(request.query)

        const result = await versionHistoryService.getVersionHistory(
          query.documentId,
          query.limit,
          query.offset
        )

        return reply.send({
          success: true,
          versions: result.versions,
          total: result.total,
          limit: query.limit,
          offset: query.offset,
        })
      } catch (error) {
        fastify.log.error('Error getting versions:', error)
        return reply.status(500).send({
          success: false,
          error: 'Failed to get versions',
        })
      }
    },
  })

  // Get a specific version
  fastify.get('/versions/:versionId', {
    preHandler: optionalAuth,
    schema: {
      params: {
        type: 'object',
        properties: {
          versionId: { type: 'string' },
        },
        required: ['versionId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            version: { type: 'object' },
          },
          required: ['success', 'version'],
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const params = GetVersionSchema.parse(request.params)

        const version = await versionHistoryService.getVersion(params.versionId)

        if (!version) {
          return reply.status(404).send({
            success: false,
            error: 'Version not found',
          })
        }

        return reply.send({
          success: true,
          version,
        })
      } catch (error) {
        fastify.log.error('Error getting version:', error)
        return reply.status(500).send({
          success: false,
          error: 'Failed to get version',
        })
      }
    },
  })

  // Get latest version for a document
  fastify.get('/documents/:documentId/latest-version', {
    preHandler: optionalAuth,
    schema: {
      params: {
        type: 'object',
        properties: {
          documentId: { type: 'string' },
        },
        required: ['documentId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            version: { type: 'object' },
          },
          required: ['success', 'version'],
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { documentId } = request.params as { documentId: string }

        const version = await versionHistoryService.getLatestVersion(documentId)

        if (!version) {
          return reply.status(404).send({
            success: false,
            error: 'No versions found for document',
          })
        }

        return reply.send({
          success: true,
          version,
        })
      } catch (error) {
        fastify.log.error('Error getting latest version:', error)
        return reply.status(500).send({
          success: false,
          error: 'Failed to get latest version',
        })
      }
    },
  })

  // Restore document to a specific version
  fastify.post('/versions/restore', {
    preHandler: optionalAuth,
    schema: {
      body: {
        type: 'object',
        properties: {
          documentId: { type: 'string' },
          versionId: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['documentId', 'versionId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            newVersionId: { type: 'string' },
            conflicts: { type: 'array', items: { type: 'string' } },
          },
          required: ['success'],
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const body = RestoreVersionSchema.parse(request.body)
        const userId = request.user?.id || 'anonymous'

        const result = await versionHistoryService.restoreVersion(
          body.documentId,
          body.versionId,
          userId,
          body.description
        )

        if (!result.success) {
          return reply.status(400).send({
            success: false,
            conflicts: result.conflicts,
            error: 'Failed to restore version',
          })
        }

        return reply.send({
          success: true,
          newVersionId: result.newVersionId,
        })
      } catch (error) {
        fastify.log.error('Error restoring version:', error)
        return reply.status(500).send({
          success: false,
          error: 'Failed to restore version',
        })
      }
    },
  })

  // Get diff between two versions
  fastify.get('/versions/diff', {
    preHandler: optionalAuth,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          versionId1: { type: 'string' },
          versionId2: { type: 'string' },
        },
        required: ['versionId1', 'versionId2'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            diff: { type: 'object' },
          },
          required: ['success', 'diff'],
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const query = GetVersionDiffSchema.parse(request.query)

        const diff = await versionHistoryService.getVersionDiff(
          query.versionId1,
          query.versionId2
        )

        return reply.send({
          success: true,
          diff,
        })
      } catch (error) {
        fastify.log.error('Error getting version diff:', error)
        return reply.status(500).send({
          success: false,
          error: 'Failed to get version diff',
        })
      }
    },
  })

  // Delete a version (soft delete)
  fastify.delete('/versions/:versionId', {
    preHandler: optionalAuth,
    schema: {
      params: {
        type: 'object',
        properties: {
          versionId: { type: 'string' },
        },
        required: ['versionId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
          required: ['success'],
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const params = DeleteVersionSchema.parse(request.params)
        const userId = request.user?.id || 'anonymous'

        const success = await versionHistoryService.deleteVersion(
          params.versionId,
          userId
        )

        if (!success) {
          return reply.status(404).send({
            success: false,
            error: 'Version not found',
          })
        }

        return reply.send({
          success: true,
        })
      } catch (error) {
        fastify.log.error('Error deleting version:', error)
        return reply.status(500).send({
          success: false,
          error: 'Failed to delete version',
        })
      }
    },
  })

  // Create a branch from a version
  fastify.post('/versions/branch', {
    preHandler: optionalAuth,
    schema: {
      body: {
        type: 'object',
        properties: {
          documentId: { type: 'string' },
          baseVersionId: { type: 'string' },
          branchName: { type: 'string' },
        },
        required: ['documentId', 'baseVersionId', 'branchName'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            version: { type: 'object' },
          },
          required: ['success', 'version'],
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const body = CreateBranchSchema.parse(request.body)
        const userId = request.user?.id || 'anonymous'

        const version = await versionHistoryService.createBranch(
          body.documentId,
          body.baseVersionId,
          body.branchName,
          userId
        )

        return reply.send({
          success: true,
          version,
        })
      } catch (error) {
        fastify.log.error('Error creating branch:', error)
        return reply.status(500).send({
          success: false,
          error: 'Failed to create branch',
        })
      }
    },
  })

  // Merge a branch
  fastify.post('/versions/merge', {
    preHandler: optionalAuth,
    schema: {
      body: {
        type: 'object',
        properties: {
          mainDocumentId: { type: 'string' },
          branchDocumentId: { type: 'string' },
          mergeStrategy: { type: 'string', enum: ['theirs', 'ours', 'manual'] },
        },
        required: ['mainDocumentId', 'branchDocumentId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            newVersionId: { type: 'string' },
          },
          required: ['success'],
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const body = MergeBranchSchema.parse(request.body)
        const userId = request.user?.id || 'anonymous'

        const result = await versionHistoryService.mergeBranch(
          body.mainDocumentId,
          body.branchDocumentId,
          userId,
          body.mergeStrategy
        )

        if (!result.success) {
          return reply.status(400).send({
            success: false,
            error: 'Failed to merge branch',
          })
        }

        return reply.send({
          success: true,
          newVersionId: result.newVersionId,
        })
      } catch (error) {
        fastify.log.error('Error merging branch:', error)
        return reply.status(500).send({
          success: false,
          error: 'Failed to merge branch',
        })
      }
    },
  })
} 