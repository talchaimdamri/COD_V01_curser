import { beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect()

  // Clean up test data
  // Delete dependents first to satisfy FK constraints
  await prisma.documentVersion.deleteMany()
  await prisma.chainSnapshot.deleteMany()
  await prisma.documentSnapshot.deleteMany()
  await prisma.agentSnapshot.deleteMany()
  await prisma.event.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  // Clean up test data
  await prisma.documentVersion.deleteMany()
  await prisma.chainSnapshot.deleteMany()
  await prisma.documentSnapshot.deleteMany()
  await prisma.agentSnapshot.deleteMany()
  await prisma.event.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  // Disconnect from database
  await prisma.$disconnect()
})
