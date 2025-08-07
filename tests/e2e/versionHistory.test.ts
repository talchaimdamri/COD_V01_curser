import { test, expect } from '@playwright/test'

test.describe('Document Version History E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the document editor
    await page.goto('/')
    // Open document editor modal (assuming there's a way to trigger this)
    await page.click('[data-testid="open-document-editor"]')
  })

  test.describe('E2E-VS-01: Version List UI Interactions', () => {
    test('should display version history panel when opened', async ({ page }) => {
      // Open version history panel
      await page.click('[data-testid="version-history-button"]')
      
      // Verify version history panel is visible
      await expect(page.locator('[data-testid="version-history-panel"]')).toBeVisible()
      
      // Verify version list is displayed
      await expect(page.locator('[data-testid="version-list"]')).toBeVisible()
    })

    test('should show version timestamps and descriptions', async ({ page }) => {
      // Open version history panel
      await page.click('[data-testid="version-history-button"]')
      
      // Verify version items have timestamps
      await expect(page.locator('[data-testid="version-timestamp"]')).toBeVisible()
      
      // Verify version items have descriptions
      await expect(page.locator('[data-testid="version-description"]')).toBeVisible()
    })

    test('should allow selecting different versions', async ({ page }) => {
      // Open version history panel
      await page.click('[data-testid="version-history-button"]')
      
      // Click on a version item
      await page.click('[data-testid="version-item"]:first-child')
      
      // Verify version is selected
      await expect(page.locator('[data-testid="version-item"]:first-child')).toHaveClass(/selected/)
    })

    test('should show diff preview when version is selected', async ({ page }) => {
      // Open version history panel
      await page.click('[data-testid="version-history-button"]')
      
      // Click on a version item
      await page.click('[data-testid="version-item"]:first-child')
      
      // Verify diff preview is shown
      await expect(page.locator('[data-testid="diff-preview"]')).toBeVisible()
    })

    test('should support version comparison mode', async ({ page }) => {
      // Open version history panel
      await page.click('[data-testid="version-history-button"]')
      
      // Enable comparison mode
      await page.click('[data-testid="compare-versions-button"]')
      
      // Select two versions to compare
      await page.click('[data-testid="version-item"]:nth-child(1)')
      await page.click('[data-testid="version-item"]:nth-child(2)')
      
      // Verify comparison view is shown
      await expect(page.locator('[data-testid="version-comparison"]')).toBeVisible()
    })
  })

  test.describe('E2E-VS-02: Full Version History Workflow', () => {
    test('should create new version when content is saved', async ({ page }) => {
      // Edit document content
      await page.fill('[data-testid="tiptap-editor"]', 'New document content')
      
      // Save version
      await page.click('[data-testid="save-version-button"]')
      
      // Open version history
      await page.click('[data-testid="version-history-button"]')
      
      // Verify new version appears in history
      await expect(page.locator('[data-testid="version-item"]')).toHaveCount(1)
    })

    test('should restore document to previous version', async ({ page }) => {
      // Create initial content
      await page.fill('[data-testid="tiptap-editor"]', 'Initial content')
      await page.click('[data-testid="save-version-button"]')
      
      // Edit content
      await page.fill('[data-testid="tiptap-editor"]', 'Modified content')
      
      // Open version history and restore to previous version
      await page.click('[data-testid="version-history-button"]')
      await page.click('[data-testid="restore-version-button"]')
      
      // Verify content is restored
      await expect(page.locator('[data-testid="tiptap-editor"]')).toContainText('Initial content')
    })

    test('should maintain version history after restoration', async ({ page }) => {
      // Create multiple versions
      await page.fill('[data-testid="tiptap-editor"]', 'Version 1')
      await page.click('[data-testid="save-version-button"]')
      
      await page.fill('[data-testid="tiptap-editor"]', 'Version 2')
      await page.click('[data-testid="save-version-button"]')
      
      // Restore to first version
      await page.click('[data-testid="version-history-button"]')
      await page.click('[data-testid="restore-version-button"]')
      
      // Verify version history is maintained
      await expect(page.locator('[data-testid="version-item"]')).toHaveCount(3) // Original + 2 saved + 1 restored
    })

    test('should handle undo/redo with version history', async ({ page }) => {
      // Create initial content
      await page.fill('[data-testid="tiptap-editor"]', 'Initial content')
      await page.click('[data-testid="save-version-button"]')
      
      // Make changes
      await page.fill('[data-testid="tiptap-editor"]', 'Modified content')
      
      // Undo changes
      await page.click('[data-testid="undo-button"]')
      
      // Verify content is restored
      await expect(page.locator('[data-testid="tiptap-editor"]')).toContainText('Initial content')
      
      // Redo changes
      await page.click('[data-testid="redo-button"]')
      
      // Verify content is restored
      await expect(page.locator('[data-testid="tiptap-editor"]')).toContainText('Modified content')
    })

    test('should show diff between versions', async ({ page }) => {
      // Create initial content
      await page.fill('[data-testid="tiptap-editor"]', 'Original content')
      await page.click('[data-testid="save-version-button"]')
      
      // Modify content
      await page.fill('[data-testid="tiptap-editor"]', 'Modified content with changes')
      await page.click('[data-testid="save-version-button"]')
      
      // Open version history and view diff
      await page.click('[data-testid="version-history-button"]')
      await page.click('[data-testid="view-diff-button"]')
      
      // Verify diff is displayed
      await expect(page.locator('[data-testid="diff-view"]')).toBeVisible()
      await expect(page.locator('[data-testid="diff-added"]')).toBeVisible()
      await expect(page.locator('[data-testid="diff-removed"]')).toBeVisible()
    })

    test('should handle large version histories efficiently', async ({ page }) => {
      // Create many versions (simulate by creating 10 versions)
      for (let i = 1; i <= 10; i++) {
        await page.fill('[data-testid="tiptap-editor"]', `Version ${i}`)
        await page.click('[data-testid="save-version-button"]')
      }
      
      // Open version history
      await page.click('[data-testid="version-history-button"]')
      
      // Verify all versions are displayed
      await expect(page.locator('[data-testid="version-item"]')).toHaveCount(10)
      
      // Verify scrolling works for large lists
      await page.locator('[data-testid="version-list"]').scrollIntoViewIfNeeded()
    })

    test('should support version branching', async ({ page }) => {
      // Create initial version
      await page.fill('[data-testid="tiptap-editor"]', 'Base version')
      await page.click('[data-testid="save-version-button"]')
      
      // Create branch from this version
      await page.click('[data-testid="version-history-button"]')
      await page.click('[data-testid="create-branch-button"]')
      
      // Modify content in branch
      await page.fill('[data-testid="tiptap-editor"]', 'Branch version')
      await page.click('[data-testid="save-version-button"]')
      
      // Verify branch is created
      await expect(page.locator('[data-testid="version-branch"]')).toBeVisible()
    })

    test('should handle version conflicts gracefully', async ({ page }) => {
      // Create initial version
      await page.fill('[data-testid="tiptap-editor"]', 'Initial content')
      await page.click('[data-testid="save-version-button"]')
      
      // Simulate concurrent editing (this would be handled by the backend)
      // For now, we'll test the UI response to conflicts
      
      // Try to restore to a version that has conflicts
      await page.click('[data-testid="version-history-button"]')
      await page.click('[data-testid="restore-version-button"]')
      
      // Verify conflict resolution dialog appears
      await expect(page.locator('[data-testid="conflict-resolution-dialog"]')).toBeVisible()
    })
  })

  test.describe('Integration with Document Editor', () => {
    test('should integrate with TipTap editor undo/redo', async ({ page }) => {
      // Type some content
      await page.fill('[data-testid="tiptap-editor"]', 'Some content')
      
      // Use TipTap undo
      await page.keyboard.press('Control+Z')
      
      // Verify content is undone
      await expect(page.locator('[data-testid="tiptap-editor"]')).not.toContainText('Some content')
      
      // Use TipTap redo
      await page.keyboard.press('Control+Y')
      
      // Verify content is redone
      await expect(page.locator('[data-testid="tiptap-editor"]')).toContainText('Some content')
    })

    test('should save versions automatically on significant changes', async ({ page }) => {
      // Enable auto-save
      await page.click('[data-testid="auto-save-toggle"]')
      
      // Make significant changes
      await page.fill('[data-testid="tiptap-editor"]', 'Auto-saved content')
      
      // Wait for auto-save to trigger
      await page.waitForTimeout(2000)
      
      // Verify version was auto-saved
      await page.click('[data-testid="version-history-button"]')
      await expect(page.locator('[data-testid="auto-saved-version"]')).toBeVisible()
    })

    test('should restore editor state from version history', async ({ page }) => {
      // Create content with formatting
      await page.fill('[data-testid="tiptap-editor"]', 'Formatted content')
      await page.click('[data-testid="bold-button"]')
      await page.click('[data-testid="save-version-button"]')
      
      // Clear content
      await page.fill('[data-testid="tiptap-editor"]', '')
      
      // Restore from version history
      await page.click('[data-testid="version-history-button"]')
      await page.click('[data-testid="restore-version-button"]')
      
      // Verify content and formatting are restored
      await expect(page.locator('[data-testid="tiptap-editor"]')).toContainText('Formatted content')
      // Note: Formatting verification would require checking HTML content
    })
  })
}) 