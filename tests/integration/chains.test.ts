import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const baseUrl = 'http://localhost:4002'

describe('Chains API Integration', () => {
  const chainId = 'chain_test_1'

  beforeAll(async () => {
    // Clean chain events and snapshot
    await prisma.event.deleteMany({ where: { streamId: chainId } })
    await prisma.chainSnapshot.deleteMany({ where: { id: chainId } })
  })

  afterAll(async () => {
    await prisma.chainSnapshot.deleteMany({ where: { id: chainId } })
    await prisma.event.deleteMany({ where: { streamId: chainId } })
  })

  it('POST /api/chains/:id/canvas upserts snapshot and returns chain', async () => {
    const payload = {
      name: 'Test Chain',
      canvasState: {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        selection: [],
      },
    }

    const res = await request(baseUrl)
      .post(`/api/chains/${chainId}/canvas`)
      .send(payload)
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.chain).toBeTruthy()
    expect(res.body.chain.id).toBe(chainId)
  })

  it('GET /api/chains/:id returns snapshot', async () => {
    const res = await request(baseUrl)
      .get(`/api/chains/${chainId}`)
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.chain.id).toBe(chainId)
    expect(res.body.chain.canvasState).toBeTruthy()
  })
})


