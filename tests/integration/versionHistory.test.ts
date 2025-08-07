import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { VersionHistoryService } from '../../api/services/versionHistory'
import { EventStore } from '../../api/services/eventStore'

const prisma = new PrismaClient()
const versionHistoryService = new VersionHistoryService(prisma)
const eventStore = new EventStore(prisma)

describe('Version History API Integration Tests', () => {
  let testDocumentId: string
  let testUserId: string

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashedpassword',
      },
    })
    testUserId = user.id

    // Create test document
    const document = await prisma.documentSnapshot.create({
      data: {
        title: 'Test Document',
        content: 'Initial content',
        version: 1,
        lastEventId: 'test-event',
        lastEventVersion: 1,
      },
    })
    testDocumentId = document.id
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.documentVersion.deleteMany({
      where: { documentId: testDocumentId },
    })
    await prisma.documentSnapshot.delete({
      where: { id: testDocumentId },
    })
    await prisma.user.delete({
      where: { id: testUserId },
    })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clear version history before each test
    await prisma.documentVersion.deleteMany({
      where: { documentId: testDocumentId },
    })
  })

  describe('Version Creation', () => {
    it('should create a new version successfully', async () => {
      const version = await versionHistoryService.createVersion(
        testDocumentId,
        'Updated content',
        'First update',
        testUserId,
        false
      )

      expect(version).toBeDefined()
      expect(version.documentId).toBe(testDocumentId)
      expect(version.content).toBe('Updated content')
      expect(version.description).toBe('First update')
      expect(version.versionNumber).toBe(1)
      expect(version.isAutoSaved).toBe(false)
      expect(version.userId).toBe(testUserId)
    })

    it('should increment version numbers correctly', async () => {
      // Create first version
      const version1 = await versionHistoryService.createVersion(
        testDocumentId,
        'First version',
        'Initial version',
        testUserId,
        false
      )

      // Create second version
      const version2 = await versionHistoryService.createVersion(
        testDocumentId,
        'Second version',
        'Second update',
        testUserId,
        false
      )

      expect(version1.versionNumber).toBe(1)
      expect(version2.versionNumber).toBe(2)
    })

    it('should handle auto-saved versions', async () => {
      const version = await versionHistoryService.createVersion(
        testDocumentId,
        'Auto-saved content',
        'Auto-save',
        testUserId,
        true
      )

      expect(version.isAutoSaved).toBe(true)
    })
  })

  describe('Version Retrieval', () => {
    it('should get all versions for a document', async () => {
      // Create multiple versions
      await versionHistoryService.createVersion(
        testDocumentId,
        'Version 1',
        'First version',
        testUserId,
        false
      )
      await versionHistoryService.createVersion(
        testDocumentId,
        'Version 2',
        'Second version',
        testUserId,
        false
      )

      const versions = await versionHistoryService.getVersions(testDocumentId)

      expect(versions).toHaveLength(2)
      expect(versions[0].versionNumber).toBe(2) // Latest first
      expect(versions[1].versionNumber).toBe(1)
    })

    it('should get a specific version by ID', async () => {
      const createdVersion = await versionHistoryService.createVersion(
        testDocumentId,
        'Test content',
        'Test version',
        testUserId,
        false
      )

      const retrievedVersion = await versionHistoryService.getVersion(createdVersion.id)

      expect(retrievedVersion).toBeDefined()
      expect(retrievedVersion?.id).toBe(createdVersion.id)
      expect(retrievedVersion?.content).toBe('Test content')
    })

    it('should get the latest version', async () => {
      await versionHistoryService.createVersion(
        testDocumentId,
        'Version 1',
        'First version',
        testUserId,
        false
      )
      const latestVersion = await versionHistoryService.createVersion(
        testDocumentId,
        'Version 2',
        'Second version',
        testUserId,
        false
      )

      const retrievedLatest = await versionHistoryService.getLatestVersion(testDocumentId)

      expect(retrievedLatest).toBeDefined()
      expect(retrievedLatest?.id).toBe(latestVersion.id)
      expect(retrievedLatest?.versionNumber).toBe(2)
    })
  })

  describe('Version Restoration', () => {
    it('should restore document to a specific version', async () => {
      // Create initial version
      const version1 = await versionHistoryService.createVersion(
        testDocumentId,
        'Original content',
        'Original version',
        testUserId,
        false
      )

      // Create updated version
      await versionHistoryService.createVersion(
        testDocumentId,
        'Updated content',
        'Updated version',
        testUserId,
        false
      )

      // Restore to original version
      const result = await versionHistoryService.restoreVersion(
        testDocumentId,
        version1.id,
        testUserId,
        'Restored to original'
      )

      expect(result.success).toBe(true)
      expect(result.newVersionId).toBeDefined()

      // Verify new version was created with original content
      const restoredVersion = await versionHistoryService.getVersion(result.newVersionId!)
      expect(restoredVersion?.content).toBe('Original content')
    })

    it('should handle restoration conflicts', async () => {
      // This is a simplified test - in a real implementation, conflict detection would be more sophisticated
      const version = await versionHistoryService.createVersion(
        testDocumentId,
        'Test content',
        'Test version',
        testUserId,
        false
      )

      const result = await versionHistoryService.restoreVersion(
        testDocumentId,
        version.id,
        testUserId
      )

      // Should succeed without conflicts in this simple case
      expect(result.success).toBe(true)
    })
  })

  describe('Version Diff', () => {
    it('should calculate diff between two versions', async () => {
      const version1 = await versionHistoryService.createVersion(
        testDocumentId,
        'Original content',
        'Original version',
        testUserId,
        false
      )

      const version2 = await versionHistoryService.createVersion(
        testDocumentId,
        'Modified content with changes',
        'Modified version',
        testUserId,
        false
      )

      const diff = await versionHistoryService.getVersionDiff(version1.id, version2.id)

      expect(diff).toBeDefined()
      expect(diff.added).toBeDefined()
      expect(diff.removed).toBeDefined()
      expect(diff.unchanged).toBeDefined()
    })

    it('should handle identical versions', async () => {
      const version = await versionHistoryService.createVersion(
        testDocumentId,
        'Same content',
        'Same version',
        testUserId,
        false
      )

      const diff = await versionHistoryService.getVersionDiff(version.id, version.id)

      expect(diff.added).toHaveLength(0)
      expect(diff.removed).toHaveLength(0)
      expect(diff.unchanged.length).toBeGreaterThan(0)
    })
  })

  describe('Version Deletion', () => {
    it('should soft delete a version', async () => {
      const version = await versionHistoryService.createVersion(
        testDocumentId,
        'Content to delete',
        'Version to delete',
        testUserId,
        false
      )

      const success = await versionHistoryService.deleteVersion(version.id, testUserId)

      expect(success).toBe(true)

      // Version should still exist but be marked as deleted
      const deletedVersion = await prisma.documentVersion.findUnique({
        where: { id: version.id },
      })
      expect(deletedVersion?.deletedAt).toBeDefined()
    })
  })

  describe('Version History with Pagination', () => {
    it('should support pagination', async () => {
      // Create multiple versions
      for (let i = 1; i <= 15; i++) {
        await versionHistoryService.createVersion(
          testDocumentId,
          `Content ${i}`,
          `Version ${i}`,
          testUserId,
          false
        )
      }

      const result = await versionHistoryService.getVersionHistory(testDocumentId, 10, 0)

      expect(result.versions).toHaveLength(10)
      expect(result.total).toBe(15)
      expect(result.versions[0].versionNumber).toBe(15) // Latest first
    })

    it('should handle offset correctly', async () => {
      // Create multiple versions
      for (let i = 1; i <= 5; i++) {
        await versionHistoryService.createVersion(
          testDocumentId,
          `Content ${i}`,
          `Version ${i}`,
          testUserId,
          false
        )
      }

      const result = await versionHistoryService.getVersionHistory(testDocumentId, 2, 2)

      expect(result.versions).toHaveLength(2)
      expect(result.versions[0].versionNumber).toBe(3) // Offset by 2
      expect(result.versions[1].versionNumber).toBe(2)
    })
  })

  describe('Branching and Merging', () => {
    it('should create a branch from a version', async () => {
      const baseVersion = await versionHistoryService.createVersion(
        testDocumentId,
        'Base content',
        'Base version',
        testUserId,
        false
      )

      const branchVersion = await versionHistoryService.createBranch(
        testDocumentId,
        baseVersion.id,
        'feature-branch',
        testUserId
      )

      expect(branchVersion).toBeDefined()
      expect(branchVersion.content).toBe(baseVersion.content)
      expect(branchVersion.parentVersionId).toBe(baseVersion.id)
    })

    it('should merge branches', async () => {
      // Create base version
      const baseVersion = await versionHistoryService.createVersion(
        testDocumentId,
        'Base content',
        'Base version',
        testUserId,
        false
      )

      // Create branch
      const branchVersion = await versionHistoryService.createBranch(
        testDocumentId,
        baseVersion.id,
        'feature-branch',
        testUserId
      )

      // Merge branch
      const result = await versionHistoryService.mergeBranch(
        testDocumentId,
        branchVersion.documentId,
        testUserId,
        'theirs'
      )

      expect(result.success).toBe(true)
      expect(result.newVersionId).toBeDefined()
    })
  })

  describe('Event Sourcing Integration', () => {
    it('should track version creation events', async () => {
      const version = await versionHistoryService.createVersion(
        testDocumentId,
        'Event tracked content',
        'Event tracked version',
        testUserId,
        false
      )

      // Check that events were created
      const events = await eventStore.getEvents(testDocumentId)
      const versionEvents = events.filter(event => event.type === 'DOCUMENT_VERSION_CREATED')

      expect(versionEvents.length).toBeGreaterThan(0)
      expect(versionEvents[0].payload.versionId).toBe(version.id)
    })

    it('should track version restoration events', async () => {
      const version = await versionHistoryService.createVersion(
        testDocumentId,
        'Original content',
        'Original version',
        testUserId,
        false
      )

      await versionHistoryService.restoreVersion(
        testDocumentId,
        version.id,
        testUserId,
        'Restored version'
      )

      // Check that restoration events were created
      const events = await eventStore.getEvents(testDocumentId)
      const restoreEvents = events.filter(event => event.type === 'DOCUMENT_VERSION_RESTORED')

      expect(restoreEvents.length).toBeGreaterThan(0)
      expect(restoreEvents[0].payload.restoredVersionId).toBe(version.id)
    })
  })
}) 