import { z } from 'zod'

// User Schema
export const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role: z.enum(['user', 'admin']).default('user'),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// User Create Schema
export const UserCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password: z.string().min(8),
  role: z.enum(['user', 'admin']).default('user'),
  metadata: z.record(z.any()).optional(),
})

// User Update Schema
export const UserUpdateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(255).optional(),
  role: z.enum(['user', 'admin']).optional(),
  metadata: z.record(z.any()).optional(),
})

// User Login Schema
export const UserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// User Register Schema
export const UserRegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Session Schema
export const SessionSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  token: z.string(),
  expiresAt: z.date(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
})

// User List Schema
export const UserListSchema = z.object({
  users: z.array(UserSchema),
  total: z.number().int().positive(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
})

// User Query Schema
export const UserQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
  sortBy: z.enum(['name', 'email', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Type exports
export type User = z.infer<typeof UserSchema>
export type UserCreate = z.infer<typeof UserCreateSchema>
export type UserUpdate = z.infer<typeof UserUpdateSchema>
export type UserLogin = z.infer<typeof UserLoginSchema>
export type UserRegister = z.infer<typeof UserRegisterSchema>
export type Session = z.infer<typeof SessionSchema>
export type UserList = z.infer<typeof UserListSchema>
export type UserQuery = z.infer<typeof UserQuerySchema> 