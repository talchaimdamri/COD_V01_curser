import { PrismaClient } from '@prisma/client'
import { EventStore } from './eventStore'

export class ChainService {
  private prisma: PrismaClient
  private eventStore: EventStore

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.eventStore = new EventStore(prisma)
  }

  async getChain(chainId: string) {
    const snapshot = await this.prisma.chainSnapshot.findUnique({ where: { id: chainId } })
    if (snapshot) return snapshot
    return null
  }

  async upsertChainCanvas(params: {
    chainId: string
    name?: string
    canvasState: any
    userId?: string | null
  }) {
    const { chainId, name, canvasState, userId } = params

    // Append event
    const latest = await this.eventStore.getLatestVersion(chainId)
    await this.eventStore.append([
      {
        type: 'chain.canvas_updated',
        payload: { canvasState },
        streamId: chainId,
        version: latest + 1,
        userId: userId || undefined,
      },
    ])

    // Create or update snapshot
    const snapshotData = {
      name: name || (await this.prisma.chainSnapshot.findUnique({ where: { id: chainId } }))?.name || 'Untitled Chain',
      canvasState,
      metadata: {},
    }

    const result = await this.prisma.chainSnapshot.upsert({
      where: { id: chainId },
      update: { ...snapshotData },
      create: { id: chainId, ...snapshotData, lastEventId: '', lastEventVersion: latest + 1 },
    })

    // Fix lastEvent fields via eventStore snapshot helper to keep consistency
    await this.eventStore.createSnapshot(chainId, snapshotData, 'chain')
    return result
  }
}


