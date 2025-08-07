import { PrismaClient } from '@prisma/client'
import { EventStore } from './eventStore'
import DiffMatchPatch from 'diff-match-patch'

export interface Version {
  id: string
  documentId: string
  content: string
  timestamp: Date
  description: string
  versionNumber: number
  parentVersionId?: string
  isAutoSaved: boolean
}

export interface VersionDiff {
  added: string[]
  removed: string[]
  unchanged: string[]
}

export interface VersionRestoreResult {
  success: boolean
  newVersionId?: string
  conflicts?: string[]
}

export class VersionHistoryService {
  private prisma: PrismaClient
  private eventStore: EventStore
  private dmp: DiffMatchPatch

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.eventStore = new EventStore(prisma)
    this.dmp = new DiffMatchPatch()
  }

  /**
   * Create a new version of a document
   */
  async createVersion(
    documentId: string,
    content: string,
    description: string,
    userId: string,
    isAutoSaved: boolean = false,
    parentVersionId?: string
  ): Promise<Version> {
    // Get the latest version number for this document
    const latestVersion = await this.getLatestVersion(documentId)
    const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1

    // Create version record
    const version = await this.prisma.documentVersion.create({
      data: {
        documentId,
        content,
        description,
        versionNumber,
        parentVersionId,
        isAutoSaved,
        userId,
      },
    })

    // Track version creation event
    await this.eventStore.appendEvent('DOCUMENT_VERSION_CREATED', {
      documentId,
      versionId: version.id,
      content,
      description,
      versionNumber,
      parentVersionId,
      isAutoSaved,
      userId,
    })

    return {
      id: version.id,
      documentId: version.documentId,
      content: version.content,
      timestamp: version.createdAt,
      description: version.description,
      versionNumber: version.versionNumber,
      parentVersionId: version.parentVersionId || undefined,
      isAutoSaved: version.isAutoSaved,
    }
  }

  /**
   * Get all versions for a document
   */
  async getVersions(documentId: string): Promise<Version[]> {
    const versions = await this.prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
    })

    return versions.map(version => ({
      id: version.id,
      documentId: version.documentId,
      content: version.content,
      timestamp: version.createdAt,
      description: version.description,
      versionNumber: version.versionNumber,
      parentVersionId: version.parentVersionId || undefined,
      isAutoSaved: version.isAutoSaved,
    }))
  }

  /**
   * Get a specific version by ID
   */
  async getVersion(versionId: string): Promise<Version | null> {
    const version = await this.prisma.documentVersion.findUnique({
      where: { id: versionId },
    })

    if (!version) return null

    return {
      id: version.id,
      documentId: version.documentId,
      content: version.content,
      timestamp: version.createdAt,
      description: version.description,
      versionNumber: version.versionNumber,
      parentVersionId: version.parentVersionId || undefined,
      isAutoSaved: version.isAutoSaved,
    }
  }

  /**
   * Get the latest version of a document
   */
  async getLatestVersion(documentId: string): Promise<Version | null> {
    const version = await this.prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
    })

    if (!version) return null

    return {
      id: version.id,
      documentId: version.documentId,
      content: version.content,
      timestamp: version.createdAt,
      description: version.description,
      versionNumber: version.versionNumber,
      parentVersionId: version.parentVersionId || undefined,
      isAutoSaved: version.isAutoSaved,
    }
  }

  /**
   * Calculate diff between two versions
   */
  async getVersionDiff(versionId1: string, versionId2: string): Promise<VersionDiff> {
    const version1 = await this.getVersion(versionId1)
    const version2 = await this.getVersion(versionId2)

    if (!version1 || !version2) {
      throw new Error('One or both versions not found')
    }

    // Calculate diff using diff-match-patch
    const diffs = this.dmp.diff_main(version1.content, version2.content)
    this.dmp.diff_cleanupSemantic(diffs)

    const added: string[] = []
    const removed: string[] = []
    const unchanged: string[] = []

    diffs.forEach(([operation, text]) => {
      switch (operation) {
        case 1: // INSERT
          added.push(text)
          break
        case -1: // DELETE
          removed.push(text)
          break
        case 0: // EQUAL
          unchanged.push(text)
          break
      }
    })

    return { added, removed, unchanged }
  }

  /**
   * Restore document to a specific version
   */
  async restoreVersion(
    documentId: string,
    versionId: string,
    userId: string,
    description?: string
  ): Promise<VersionRestoreResult> {
    const targetVersion = await this.getVersion(versionId)
    if (!targetVersion) {
      return { success: false }
    }

    const currentVersion = await this.getLatestVersion(documentId)
    if (!currentVersion) {
      return { success: false }
    }

    // Check for conflicts (simplified - in a real implementation, this would be more sophisticated)
    const conflicts = await this.detectConflicts(documentId, versionId)
    if (conflicts.length > 0) {
      return { success: false, conflicts }
    }

    // Create new version with restored content
    const newVersion = await this.createVersion(
      documentId,
      targetVersion.content,
      description || `Restored to version ${targetVersion.versionNumber}`,
      userId,
      false,
      currentVersion.id
    )

    // Track restoration event
    await this.eventStore.appendEvent('DOCUMENT_VERSION_RESTORED', {
      documentId,
      restoredVersionId: versionId,
      newVersionId: newVersion.id,
      userId,
    })

    return { success: true, newVersionId: newVersion.id }
  }

  /**
   * Detect conflicts when restoring a version
   */
  private async detectConflicts(documentId: string, versionId: string): Promise<string[]> {
    // This is a simplified conflict detection
    // In a real implementation, this would check for concurrent modifications
    // and other potential conflicts
    
    const targetVersion = await this.getVersion(versionId)
    const currentVersion = await this.getLatestVersion(documentId)

    if (!targetVersion || !currentVersion) {
      return ['Version not found']
    }

    // Check if there are any unsaved changes or concurrent modifications
    // For now, we'll return an empty array (no conflicts)
    return []
  }

  /**
   * Delete a version (soft delete)
   */
  async deleteVersion(versionId: string, userId: string): Promise<boolean> {
    const version = await this.getVersion(versionId)
    if (!version) return false

    // Soft delete by marking as deleted
    await this.prisma.documentVersion.update({
      where: { id: versionId },
      data: { deletedAt: new Date() },
    })

    // Track deletion event
    await this.eventStore.appendEvent('DOCUMENT_VERSION_DELETED', {
      documentId: version.documentId,
      versionId,
      userId,
    })

    return true
  }

  /**
   * Get version history with pagination
   */
  async getVersionHistory(
    documentId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ versions: Version[]; total: number }> {
    const [versions, total] = await Promise.all([
      this.prisma.documentVersion.findMany({
        where: { 
          documentId,
          deletedAt: null, // Only non-deleted versions
        },
        orderBy: { versionNumber: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.documentVersion.count({
        where: { 
          documentId,
          deletedAt: null,
        },
      }),
    ])

    return {
      versions: versions.map(version => ({
        id: version.id,
        documentId: version.documentId,
        content: version.content,
        timestamp: version.createdAt,
        description: version.description,
        versionNumber: version.versionNumber,
        parentVersionId: version.parentVersionId || undefined,
        isAutoSaved: version.isAutoSaved,
      })),
      total,
    }
  }

  /**
   * Create a branch from a specific version
   */
  async createBranch(
    documentId: string,
    baseVersionId: string,
    branchName: string,
    userId: string
  ): Promise<Version> {
    const baseVersion = await this.getVersion(baseVersionId)
    if (!baseVersion) {
      throw new Error('Base version not found')
    }

    // Create new document for the branch
    const branchDocument = await this.prisma.document.create({
      data: {
        title: `${baseVersion.description} (${branchName})`,
        content: baseVersion.content,
        userId,
      },
    })

    // Create initial version for the branch
    const branchVersion = await this.createVersion(
      branchDocument.id,
      baseVersion.content,
      `Branch: ${branchName} from version ${baseVersion.versionNumber}`,
      userId,
      false,
      baseVersionId
    )

    // Track branch creation event
    await this.eventStore.appendEvent('DOCUMENT_BRANCH_CREATED', {
      originalDocumentId: documentId,
      branchDocumentId: branchDocument.id,
      baseVersionId,
      branchName,
      userId,
    })

    return branchVersion
  }

  /**
   * Merge a branch back to the main document
   */
  async mergeBranch(
    mainDocumentId: string,
    branchDocumentId: string,
    userId: string,
    mergeStrategy: 'theirs' | 'ours' | 'manual' = 'manual'
  ): Promise<VersionRestoreResult> {
    const branchLatest = await this.getLatestVersion(branchDocumentId)
    const mainLatest = await this.getLatestVersion(mainDocumentId)

    if (!branchLatest || !mainLatest) {
      return { success: false }
    }

    let mergedContent: string

    switch (mergeStrategy) {
      case 'theirs':
        mergedContent = branchLatest.content
        break
      case 'ours':
        mergedContent = mainLatest.content
        break
      case 'manual':
      default:
        // For manual merge, we'll create a version with conflict markers
        // In a real implementation, this would be more sophisticated
        mergedContent = `<<<<<<< HEAD\n${mainLatest.content}\n=======\n${branchLatest.content}\n>>>>>>> branch\n`
        break
    }

    const mergedVersion = await this.createVersion(
      mainDocumentId,
      mergedContent,
      `Merged branch ${branchDocumentId}`,
      userId,
      false,
      mainLatest.id
    )

    // Track merge event
    await this.eventStore.appendEvent('DOCUMENT_BRANCH_MERGED', {
      mainDocumentId,
      branchDocumentId,
      mergedVersionId: mergedVersion.id,
      mergeStrategy,
      userId,
    })

    return { success: true, newVersionId: mergedVersion.id }
  }
} 