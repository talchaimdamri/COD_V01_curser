import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Request/Response schemas
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const UpdateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
})

export default async function authRoutes(fastify: FastifyInstance) {
  // Register new user
  fastify.post('/auth/register', {
    schema: {
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string' },
        },
        required: ['email', 'password'],
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
          required: ['success', 'token', 'user'],
        },
        409: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
          required: ['success', 'message'],
        },
      },
    },
    handler: async (request, reply) => {
      const { email, password, name } = request.body as z.infer<typeof RegisterSchema>

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return reply.code(409).send({
          success: false,
          message: 'User with this email already exists',
        })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          name: name || email.split('@')[0], // Use email prefix as default name
        },
      })

      // Generate JWT token
      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
      })

      return reply.code(201).send({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      })
    },
  })

  // Login user
  fastify.post('/auth/login', {
    schema: {
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
        required: ['email', 'password'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
          required: ['success', 'token', 'user'],
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
          required: ['success', 'message'],
        },
      },
    },
    handler: async (request, reply) => {
      const { email, password } = request.body as z.infer<typeof LoginSchema>

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        return reply.code(401).send({
          success: false,
          message: 'Invalid credentials',
        })
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash)

      if (!isValidPassword) {
        return reply.code(401).send({
          success: false,
          message: 'Invalid credentials',
        })
      }

      // Generate JWT token
      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
      })

      return reply.send({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      })
    },
  })

  // Get user profile
  fastify.get('/auth/profile', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
          required: ['id', 'email', 'name', 'createdAt', 'updatedAt'],
        },
      },
    },
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.send(err)
      }
    },
    handler: async (request, reply) => {
      const token = request.user as { userId: string; email: string }

      const user = await prisma.user.findUnique({
        where: { id: token.userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!user) {
        return reply.code(404).send({
          success: false,
          message: 'User not found',
        })
      }

      return reply.send(user)
    },
  })

  // Update user profile
  fastify.put('/auth/profile', {
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
          required: ['id', 'email', 'name', 'createdAt', 'updatedAt'],
        },
      },
    },
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.send(err)
      }
    },
    handler: async (request, reply) => {
      const token = request.user as { userId: string; email: string }
      const { name, email } = request.body as z.infer<typeof UpdateProfileSchema>

      const user = await prisma.user.update({
        where: { id: token.userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return reply.send(user)
    },
  })

  // Refresh token (placeholder)
  fastify.post('/auth/refresh', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string' },
          },
          required: ['success', 'token'],
        },
      },
    },
    handler: async (request, reply) => {
      // For MVP, just return a new token
      const token = fastify.jwt.sign({
        userId: 'placeholder-user-id',
        email: 'placeholder@example.com',
      })

      return reply.send({
        success: true,
        token,
      })
    },
  })

  // Logout (placeholder)
  fastify.post('/auth/logout', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
          required: ['success', 'message'],
        },
      },
    },
    handler: async (request, reply) => {
      // For MVP, just return success
      return reply.send({
        success: true,
        message: 'Logged out successfully',
      })
    },
  })
} 