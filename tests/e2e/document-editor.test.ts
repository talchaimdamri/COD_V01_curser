import { test, expect } from '@playwright/test'

describe('E2E-DV-01: Document Editor Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto('http://localhost:4000')
  })

  describe('Modal Opening and Closing', () => {
    test('should open document editor modal when triggered', async ({ page }) => {
      // This test will fail initially since the modal doesn't exist
      await page.click('[data-testid="open-document-editor"]')
      
      const modal = page.locator('[data-testid="document-editor-modal"]')
      await expect(modal).toBeVisible()
    })

    test('should close modal when clicking close button', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const modal = page.locator('[data-testid="document-editor-modal"]')
      await expect(modal).toBeVisible()
      
      await page.click('[data-testid="close-modal"]')
      await expect(modal).not.toBeVisible()
    })

    test('should close modal when clicking outside', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const modal = page.locator('[data-testid="document-editor-modal"]')
      await expect(modal).toBeVisible()
      
      // Click outside the modal
      await page.click('[data-testid="modal-overlay"]')
      await expect(modal).not.toBeVisible()
    })

    test('should maximize/minimize modal when toggle button is clicked', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const modal = page.locator('[data-testid="document-editor-modal"]')
      await expect(modal).toBeVisible()
      
      // Check initial state (not maximized)
      await expect(modal).not.toHaveClass(/maximized/)
      
      // Click maximize button
      await page.click('[data-testid="maximize-modal"]')
      await expect(modal).toHaveClass(/maximized/)
      
      // Click minimize button
      await page.click('[data-testid="minimize-modal"]')
      await expect(modal).not.toHaveClass(/maximized/)
    })
  })

  describe('TipTap Editor Functionality', () => {
    test('should render TipTap editor with basic content', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const editor = page.locator('[data-testid="tiptap-editor"]')
      await expect(editor).toBeVisible()
      
      // Check that editor is editable
      await editor.click()
      await editor.type('Hello, this is a test document!')
      
      const content = await editor.textContent()
      expect(content).toContain('Hello, this is a test document!')
    })

    test('should apply bold formatting when toolbar button is clicked', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const editor = page.locator('[data-testid="tiptap-editor"]')
      await editor.click()
      await editor.type('Bold text')
      
      // Select text and apply bold
      await editor.press('Control+a')
      await page.click('[data-testid="bold-button"]')
      
      // Check that text is bold
      const boldElement = editor.locator('strong')
      await expect(boldElement).toBeVisible()
      await expect(boldElement).toHaveText('Bold text')
    })

    test('should apply italic formatting when toolbar button is clicked', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const editor = page.locator('[data-testid="tiptap-editor"]')
      await editor.click()
      await editor.type('Italic text')
      
      // Select text and apply italic
      await editor.press('Control+a')
      await page.click('[data-testid="italic-button"]')
      
      // Check that text is italic
      const italicElement = editor.locator('em')
      await expect(italicElement).toBeVisible()
      await expect(italicElement).toHaveText('Italic text')
    })

    test('should create headings when heading buttons are clicked', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const editor = page.locator('[data-testid="tiptap-editor"]')
      await editor.click()
      await editor.type('Heading text')
      
      // Select text and apply heading
      await editor.press('Control+a')
      await page.click('[data-testid="heading-1-button"]')
      
      // Check that text is a heading
      const headingElement = editor.locator('h1')
      await expect(headingElement).toBeVisible()
      await expect(headingElement).toHaveText('Heading text')
    })

    test('should create bullet lists when bullet list button is clicked', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const editor = page.locator('[data-testid="tiptap-editor"]')
      await editor.click()
      await editor.type('List item 1')
      await editor.press('Enter')
      await editor.type('List item 2')
      
      // Select all text and apply bullet list
      await editor.press('Control+a')
      await page.click('[data-testid="bullet-list-button"]')
      
      // Check that text is in a bullet list
      const listElement = editor.locator('ul')
      await expect(listElement).toBeVisible()
      
      const listItems = listElement.locator('li')
      await expect(listItems).toHaveCount(2)
      await expect(listItems.nth(0)).toHaveText('List item 1')
      await expect(listItems.nth(1)).toHaveText('List item 2')
    })

    test('should create ordered lists when ordered list button is clicked', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const editor = page.locator('[data-testid="tiptap-editor"]')
      await editor.click()
      await editor.type('Ordered item 1')
      await editor.press('Enter')
      await editor.type('Ordered item 2')
      
      // Select all text and apply ordered list
      await editor.press('Control+a')
      await page.click('[data-testid="ordered-list-button"]')
      
      // Check that text is in an ordered list
      const listElement = editor.locator('ol')
      await expect(listElement).toBeVisible()
      
      const listItems = listElement.locator('li')
      await expect(listItems).toHaveCount(2)
      await expect(listItems.nth(0)).toHaveText('Ordered item 1')
      await expect(listItems.nth(1)).toHaveText('Ordered item 2')
    })

    test('should create code blocks when code block button is clicked', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const editor = page.locator('[data-testid="tiptap-editor"]')
      await editor.click()
      await editor.type('const test = "code";')
      
      // Select text and apply code block
      await editor.press('Control+a')
      await page.click('[data-testid="code-block-button"]')
      
      // Check that text is in a code block
      const codeElement = editor.locator('pre code')
      await expect(codeElement).toBeVisible()
      await expect(codeElement).toHaveText('const test = "code";')
    })
  })

  describe('Undo/Redo Functionality', () => {
    test('should undo changes when undo button is clicked', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const editor = page.locator('[data-testid="tiptap-editor"]')
      await editor.click()
      await editor.type('Original text')
      
      // Make a change
      await editor.press('Control+a')
      await editor.type('Changed text')
      
      // Undo the change
      await page.click('[data-testid="undo-button"]')
      
      // Check that original text is restored
      await expect(editor).toHaveText('Original text')
    })

    test('should redo changes when redo button is clicked', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const editor = page.locator('[data-testid="tiptap-editor"]')
      await editor.click()
      await editor.type('Original text')
      
      // Make a change
      await editor.press('Control+a')
      await editor.type('Changed text')
      
      // Undo the change
      await page.click('[data-testid="undo-button"]')
      await expect(editor).toHaveText('Original text')
      
      // Redo the change
      await page.click('[data-testid="redo-button"]')
      await expect(editor).toHaveText('Changed text')
    })

    test('should support keyboard shortcuts for undo/redo', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const editor = page.locator('[data-testid="tiptap-editor"]')
      await editor.click()
      await editor.type('Original text')
      
      // Make a change
      await editor.press('Control+a')
      await editor.type('Changed text')
      
      // Undo with keyboard shortcut
      await editor.press('Control+z')
      await expect(editor).toHaveText('Original text')
      
      // Redo with keyboard shortcut
      await editor.press('Control+Shift+z')
      await expect(editor).toHaveText('Changed text')
    })
  })

  describe('Save Version Functionality', () => {
    test('should save version when save version button is clicked', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const editor = page.locator('[data-testid="tiptap-editor"]')
      await editor.click()
      await editor.type('Test document content')
      
      // Save version
      await page.click('[data-testid="save-version-button"]')
      
      // Check that save confirmation is shown
      const saveConfirmation = page.locator('[data-testid="save-confirmation"]')
      await expect(saveConfirmation).toBeVisible()
    })

    test('should show version history after saving', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const editor = page.locator('[data-testid="tiptap-editor"]')
      await editor.click()
      await editor.type('Initial content')
      
      // Save first version
      await page.click('[data-testid="save-version-button"]')
      
      // Make changes and save second version
      await editor.press('Control+a')
      await editor.type('Updated content')
      await page.click('[data-testid="save-version-button"]')
      
      // Check version history
      const versionHistory = page.locator('[data-testid="version-history"]')
      await expect(versionHistory).toBeVisible()
      
      const versionItems = versionHistory.locator('[data-testid="version-item"]')
      await expect(versionItems).toHaveCount(2)
    })
  })

  describe('Ask Agent Functionality', () => {
    test('should open agent prompt when ask agent button is clicked', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      // Click ask agent button
      await page.click('[data-testid="ask-agent-button"]')
      
      // Check that agent prompt modal is shown
      const agentPrompt = page.locator('[data-testid="agent-prompt-modal"]')
      await expect(agentPrompt).toBeVisible()
    })

    test('should send document content to agent when prompt is submitted', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const editor = page.locator('[data-testid="tiptap-editor"]')
      await editor.click()
      await editor.type('Document content for agent analysis')
      
      // Open agent prompt
      await page.click('[data-testid="ask-agent-button"]')
      
      const agentPrompt = page.locator('[data-testid="agent-prompt-modal"]')
      await expect(agentPrompt).toBeVisible()
      
      // Submit prompt
      const promptInput = page.locator('[data-testid="agent-prompt-input"]')
      await promptInput.fill('Analyze this document')
      await page.click('[data-testid="submit-agent-prompt"]')
      
      // Check that agent response is shown
      const agentResponse = page.locator('[data-testid="agent-response"]')
      await expect(agentResponse).toBeVisible()
    })
  })

  describe('Document Rails', () => {
    test('should display document rails showing connections', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      // Check that document rails are visible
      const documentRails = page.locator('[data-testid="document-rails"]')
      await expect(documentRails).toBeVisible()
      
      // Check upstream connections
      const upstreamConnections = page.locator('[data-testid="upstream-connections"]')
      await expect(upstreamConnections).toBeVisible()
      
      // Check downstream connections
      const downstreamConnections = page.locator('[data-testid="downstream-connections"]')
      await expect(downstreamConnections).toBeVisible()
    })

    test('should navigate to connected documents when clicked', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      // Click on a connected document
      const connectedDocument = page.locator('[data-testid="connected-document"]').first()
      await connectedDocument.click()
      
      // Check that the connected document is now open
      const editor = page.locator('[data-testid="tiptap-editor"]')
      await expect(editor).toBeVisible()
      
      // Check that the document title reflects the connected document
      const documentTitle = page.locator('[data-testid="document-title"]')
      await expect(documentTitle).not.toHaveText('Untitled Document')
    })
  })

  describe('Event Sourcing Integration', () => {
    test('should track document changes as events', async ({ page }) => {
      await page.click('[data-testid="open-document-editor"]')
      
      const editor = page.locator('[data-testid="tiptap-editor"]')
      await editor.click()
      await editor.type('Test content')
      
      // Check that events are being tracked
      // This would typically involve checking the backend API or local storage
      const eventsIndicator = page.locator('[data-testid="events-tracked"]')
      await expect(eventsIndicator).toBeVisible()
    })

    test('should restore document state from events on load', async ({ page }) => {
      // This test would verify that document state is properly restored
      // from the event sourcing system when the editor is opened
      await page.click('[data-testid="open-document-editor"]')
      
      const editor = page.locator('[data-testid="tiptap-editor"]')
      await expect(editor).toBeVisible()
      
      // Check that previous content is restored
      const restoredContent = await editor.textContent()
      expect(restoredContent).toBeTruthy()
    })
  })
}) 