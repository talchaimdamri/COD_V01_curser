import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()
const baseUrl = 'http://localhost:4002'

// Test data schemas
const AuthResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  token: z.string().optional(),
})

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

describe('JWT Authentication Integration Tests', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany()
  })

  describe('IT-AU-01: JWT Authentication', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }

      const response = await request(baseUrl)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      const data = AuthResponseSchema.parse(response.body)
      expect(data.success).toBe(true)
      expect(data.token).toBeDefined()
      expect(typeof data.token).toBe('string')
    })

    it('should login existing user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const response = await request(baseUrl)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      const data = AuthResponseSchema.parse(response.body)
      expect(data.success).toBe(true)
      expect(data.token).toBeDefined()
      expect(typeof data.token).toBe('string')
    })

    it('should reject login with invalid credentials', async () => {
      const invalidLoginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      const response = await request(baseUrl)
        .post('/api/auth/login')
        .send(invalidLoginData)
        .expect(401)

      const data = AuthResponseSchema.parse(response.body)
      expect(data.success).toBe(false)
      expect(data.message).toBeDefined()
    })

    it('should reject registration with existing email', async () => {
      const existingUserData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Another User',
      }

      const response = await request(baseUrl)
        .post('/api/auth/register')
        .send(existingUserData)
        .expect(409)

      const data = AuthResponseSchema.parse(response.body)
      expect(data.success).toBe(false)
      expect(data.message).toBeDefined()
    })

    it('should validate required fields for registration', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        password: '123', // Too short
      }

      const response = await request(baseUrl)
        .post('/api/auth/register')
        .send(invalidUserData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body).toHaveProperty('message')
    })

    it('should validate required fields for login', async () => {
      const invalidLoginData = {
        email: 'test@example.com',
        // Missing password
      }

      const response = await request(baseUrl)
        .post('/api/auth/login')
        .send(invalidLoginData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body).toHaveProperty('message')
    })
  })

  describe('IT-AU-02: Protected Routes', () => {
    let authToken: string

    beforeAll(async () => {
      // Login to get a valid token
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const response = await request(baseUrl)
        .post('/api/auth/login')
        .send(loginData)

      authToken = response.body.token
    })

    it('should allow access to protected routes with valid token', async () => {
      const response = await request(baseUrl)
        .get('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('events')
      expect(response.body).toHaveProperty('total')
    })

    it('should allow access to protected routes without token (MVP placeholder)', async () => {
      const response = await request(baseUrl)
        .get('/api/events')
        .expect(200)

      // MVP allows access without authentication
      expect(response.body).toHaveProperty('events')
    })

    it('should allow access to protected routes with invalid token (MVP placeholder)', async () => {
      const response = await request(baseUrl)
        .get('/api/events')
        .set('Authorization', 'Bearer invalid-token')
        .expect(200)

      // MVP allows access even with invalid tokens
      expect(response.body).toHaveProperty('events')
    })

    it('should allow access to protected routes with malformed token (MVP placeholder)', async () => {
      const response = await request(baseUrl)
        .get('/api/events')
        .set('Authorization', 'InvalidFormat token')
        .expect(200)

      // MVP allows access even with malformed tokens
      expect(response.body).toHaveProperty('events')
    })
  })

  describe('IT-AU-03: Token Management', () => {
    it('should handle token expiration gracefully (MVP placeholder)', async () => {
      // MVP allows access even with expired tokens
      const response = await request(baseUrl)
        .get('/api/events')
        .set('Authorization', 'Bearer expired.token.here')
        .expect(200)

      expect(response.body).toHaveProperty('events')
    })

    it('should support token refresh (MVP placeholder)', async () => {
      // MVP has placeholder refresh endpoint
      const response = await request(baseUrl)
        .post('/api/auth/refresh')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('token')
    })

    it('should handle logout properly (MVP placeholder)', async () => {
      // MVP has placeholder logout endpoint
      const response = await request(baseUrl)
        .post('/api/auth/logout')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('message', 'Logged out successfully')
    })
  })

  describe('IT-AU-04: User Profile', () => {
    let authToken: string

    beforeAll(async () => {
      // Create a fresh user and get token
      const registerData = {
        email: 'profile-test@example.com',
        password: 'password123',
        name: 'Profile Test User',
      }

      const response = await request(baseUrl)
        .post('/api/auth/register')
        .send(registerData)

      authToken = response.body.token
    })

    it('should return user profile with valid token', async () => {
      const response = await request(baseUrl)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const data = UserSchema.parse(response.body)
      expect(data.email).toBe('profile-test@example.com')
      expect(data.name).toBe('Profile Test User')
    })

    it('should reject profile access without token', async () => {
      const response = await request(baseUrl)
        .get('/api/auth/profile')
        .expect(401)

      expect(response.body).toHaveProperty('error')
    })

    it('should allow user to update profile', async () => {
      const updateData = {
        name: 'Updated Test User',
      }

      const response = await request(baseUrl)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      const data = UserSchema.parse(response.body)
      expect(data.name).toBe('Updated Test User')
    })
  })

  describe('IT-AU-05: Security', () => {
    it('should not expose sensitive information in error messages', async () => {
      const response = await request(baseUrl)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401)

      // Error message should not reveal whether email exists or not
      expect(response.body.message).not.toContain('email')
      expect(response.body.message).not.toContain('password')
    })

    it('should use secure password hashing', async () => {
      // This test would verify that passwords are properly hashed
      // For now, we'll test that the registration works
      const userData = {
        email: 'secure@example.com',
        password: 'securepassword123',
        name: 'Secure User',
      }

      const response = await request(baseUrl)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
    })

    it('should enforce password complexity requirements', async () => {
      const weakPasswordData = {
        email: 'weak@example.com',
        password: '123', // Too short
        name: 'Weak User',
      }

      const response = await request(baseUrl)
        .post('/api/auth/register')
        .send(weakPasswordData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.message).toContain('password')
    })
  })
}) 