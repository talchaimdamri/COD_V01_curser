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

    // Create or update snapshot via event store helper (ensures lastEvent fields are consistent)
    const existing = await this.prisma.chainSnapshot.findUnique({ where: { id: chainId } })
    const snapshotData = {
      name: name || existing?.name || 'Untitled Chain',
      canvasState,
      metadata: existing?.metadata || {},
    }

    const snapshot = await this.eventStore.createSnapshot(chainId, snapshotData, 'chain')
    return snapshot
  }
}


