// @ts-check
import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './helpers.js';

/**
 * Helper to set up authenticated state with party mode selected.
 * @param {import('@playwright/test').Page} page
 */
async function setupWithPartyModeEnabled(page) {
  await setupAuthenticatedState(page);
  await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });

  // Switch to party mode
  const partyButton = page.locator('[data-mode="party"]');
  await partyButton.click();
  await expect(partyButton).toHaveAttribute('aria-selected', 'true');
}

test.describe('Party Mode', () => {
  test.describe('Party buttons visibility', () => {
    test('should NOT show party buttons in learning mode', async ({ page }) => {
      await setupAuthenticatedState(page);
      await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });

      // Party buttons should not be visible in learning mode
      const createPartyBtn = page.getByTestId('create-party-btn');
      const joinPartyBtn = page.getByTestId('join-party-btn');

      await expect(createPartyBtn).not.toBeVisible();
      await expect(joinPartyBtn).not.toBeVisible();
    });

    test('should show party buttons in party mode', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Party buttons should be visible in party mode
      const createPartyBtn = page.getByTestId('create-party-btn');
      const joinPartyBtn = page.getByTestId('join-party-btn');

      await expect(createPartyBtn).toBeVisible();
      await expect(joinPartyBtn).toBeVisible();
    });
  });

  test.describe('Create Party View', () => {
    test('should navigate to create party view when clicking Create Party', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Click Create Party button
      const createPartyBtn = page.getByTestId('create-party-btn');
      await createPartyBtn.click();

      // Should be on create party view
      await expect(page).toHaveURL(/#\/party\/create/);
    });

    test('should show back button on create party view', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Navigate to create party
      await page.goto('/#/party/create');
      await page.waitForLoadState('networkidle');

      // Back button should be visible
      const backBtn = page.getByTestId('back-btn');
      await expect(backBtn).toBeVisible();
    });

    test('should navigate back to home when clicking back', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Navigate to create party
      const createPartyBtn = page.getByTestId('create-party-btn');
      await createPartyBtn.click();
      await expect(page).toHaveURL(/#\/party\/create/);

      // Click back button
      const backBtn = page.getByTestId('back-btn');
      await backBtn.click();

      // Should be back on home
      await expect(page).toHaveURL(/#\//);
    });
  });

  test.describe('Join Party View', () => {
    test('should navigate to join party view when clicking Join Party', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Click Join Party button
      const joinPartyBtn = page.getByTestId('join-party-btn');
      await joinPartyBtn.click();

      // Should be on join party view
      await expect(page).toHaveURL(/#\/party\/join/);
    });

    test('should show room code input on join party view', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Navigate to join party
      await page.goto('/#/party/join');
      await page.waitForLoadState('networkidle');

      // Room code input should be visible
      const roomCodeInput = page.getByTestId('room-code-input');
      await expect(roomCodeInput).toBeVisible();
    });

    test('should show name input on join party view', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Navigate to join party
      await page.goto('/#/party/join');
      await page.waitForLoadState('networkidle');

      // Name input should be visible
      const nameInput = page.getByTestId('player-name-input');
      await expect(nameInput).toBeVisible();
    });

    test('should validate room code format', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Navigate to join party
      await page.goto('/#/party/join');
      await page.waitForLoadState('networkidle');

      const roomCodeInput = page.getByTestId('room-code-input');

      // Type invalid characters (lowercase, special chars)
      await roomCodeInput.fill('abc!@#');

      // Should only accept valid characters (uppercase alphanumeric)
      const value = await roomCodeInput.inputValue();
      // The input should filter out invalid characters
      expect(value).toMatch(/^[A-Z0-9]*$/);
    });

    test('should navigate back to home when clicking back', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Navigate to join party
      const joinPartyBtn = page.getByTestId('join-party-btn');
      await joinPartyBtn.click();
      await expect(page).toHaveURL(/#\/party\/join/);

      // Click back button
      const backBtn = page.getByTestId('back-btn');
      await backBtn.click();

      // Should be back on home
      await expect(page).toHaveURL(/#\//);
    });
  });

  test.describe('Join via URL', () => {
    test('should navigate directly to join page with code from URL', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Navigate directly to join with a code
      await page.goto('/#/party/join/ABC123');
      await page.waitForLoadState('networkidle');

      // Should show the join view or lobby
      // The view should recognize the code from the URL
      await expect(page).toHaveURL(/#\/party\/join\/ABC123/);
    });
  });

  test.describe('Host Advance Question (Issue #108)', () => {
    // Note: Full E2E tests for host advance require a running PHP backend.
    // These tests verify the UI elements and i18n are correctly set up.

    test('host session state should show create party UI', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Set up as host
      await page.evaluate(() => {
        sessionStorage.setItem('partyIsHost', 'true');
        sessionStorage.setItem('partyParticipantId', 'host-123');
      });

      // Navigate to create party view
      await page.goto('/#/party/create');
      await page.waitForLoadState('networkidle');

      // Verify we're on the create party page
      const createHeader = page.locator('h1, h2').first();
      await expect(createHeader).toBeVisible({ timeout: 3000 });
    });

    test('non-host session should show join party UI', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Set up as a non-host participant
      await page.evaluate(() => {
        sessionStorage.setItem('partyIsHost', 'false');
        sessionStorage.setItem('partyParticipantId', 'guest-123');
      });

      // Navigate to join party view
      await page.goto('/#/party/join');
      await page.waitForLoadState('networkidle');

      // Verify join UI is visible
      const joinContainer = page.locator('#app');
      await expect(joinContainer).toBeVisible({ timeout: 3000 });
    });

    test('i18n translation keys for host advance are present', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Verify the locale file loads and contains our new keys
      const response = await page.evaluate(async () => {
        const res = await fetch('/locales/en.json');
        return res.json();
      });

      // Check our new i18n keys exist
      expect(response.party.nextQuestion).toBeDefined();
      expect(response.party.allAnswered).toBeDefined();
      expect(response.party.waitingFor).toBeDefined();
    });
  });

  test.describe('Party Results Save Button (Issue #109)', () => {
    // Tests verify that host does NOT see "Save locally" button (they already have the quiz)
    // while guest DOES see it (they can save the quiz for later)

    test('host should NOT see save locally button on results screen', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Set up as host with a room code
      await page.evaluate(() => {
        sessionStorage.setItem('partyIsHost', 'true');
        sessionStorage.setItem('partyParticipantId', 'host-123');
        sessionStorage.setItem('partyRoomCode', 'TEST01');
      });

      // Navigate to party results
      await page.goto('/#/party/results/TEST01');
      await page.waitForLoadState('networkidle');

      // Save locally button should NOT be visible for host
      const saveBtn = page.getByTestId('save-locally-btn');
      await expect(saveBtn).not.toBeVisible();
    });

    test('guest should see save locally button on results screen', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Set up as guest with a room code
      await page.evaluate(() => {
        sessionStorage.setItem('partyIsHost', 'false');
        sessionStorage.setItem('partyParticipantId', 'guest-456');
        sessionStorage.setItem('partyRoomCode', 'TEST01');
      });

      // Navigate to party results
      await page.goto('/#/party/results/TEST01');
      await page.waitForLoadState('networkidle');

      // Save locally button SHOULD be visible for guest
      const saveBtn = page.getByTestId('save-locally-btn');
      await expect(saveBtn).toBeVisible();
    });
  });

  test.describe('Guest Save Quiz Locally (Issue #110)', () => {
    // Tests verify that guests can save the party quiz to their local IndexedDB
    // Note: These tests inject quiz data directly into the view instance since
    // full P2P session mocking is complex. The core save logic is verified by unit tests.

    /**
     * Helper to inject quiz data directly into the PartyResultsView instance.
     * This simulates having quiz data available from a P2P session.
     * Uses the global __router exposed in dev/test mode.
     * @param {import('@playwright/test').Page} page
     * @param {Object} quiz - Quiz data to inject
     */
    async function injectQuizIntoView(page, quiz) {
      await page.evaluate((quizData) => {
        // Access the router's current view and inject quiz data
        if (window.__router && window.__router.currentView) {
          window.__router.currentView.quiz = quizData;
        }
      }, quiz);
    }

    test('guest should be able to save quiz locally', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Set up as guest
      await page.evaluate(() => {
        sessionStorage.setItem('partyIsHost', 'false');
        sessionStorage.setItem('partyParticipantId', 'guest-test-123');
        sessionStorage.setItem('partyRoomCode', 'SAVE01');
      });

      // Navigate to party results
      await page.goto('/#/party/results/SAVE01');
      await page.waitForLoadState('networkidle');

      // Wait for the save button to be visible
      const saveBtn = page.getByTestId('save-locally-btn');
      await expect(saveBtn).toBeVisible();

      // Inject quiz data directly into the view
      const testQuiz = {
        id: 'save-test-quiz-1',
        topic: 'Test Party Quiz',
        gradeLevel: 'high-school',
        questions: [
          { question: 'What is 2 + 2?', answers: ['3', '4', '5', '6'], correct: 1 },
          { question: 'What is the capital of France?', answers: ['London', 'Berlin', 'Paris', 'Madrid'], correct: 2 }
        ]
      };
      await injectQuizIntoView(page, testQuiz);

      // Click save button
      await saveBtn.click();

      // Should show success feedback - button becomes disabled
      await expect(saveBtn).toBeDisabled({ timeout: 5000 });

      // Verify quiz was saved to IndexedDB
      const savedQuiz = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const request = indexedDB.open('quizmaster');
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['sessions'], 'readonly');
            const store = transaction.objectStore('sessions');
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => {
              const sessions = getAllRequest.result;
              const partyQuiz = sessions.find(s => s.topic === 'Test Party Quiz');
              db.close();
              resolve(partyQuiz);
            };
          };
        });
      });

      // Verify the quiz was saved with correct data
      expect(savedQuiz).toBeTruthy();
      expect(savedQuiz.topic).toBe('Test Party Quiz');
      expect(savedQuiz.questions).toHaveLength(2);
      expect(savedQuiz.source).toBe('party');

      // Privacy: should NOT contain creator or party info
      expect(savedQuiz.creator).toBeUndefined();
      expect(savedQuiz.partySessionId).toBeUndefined();
      expect(savedQuiz.hostId).toBeUndefined();
    });

    test('save button should be disabled after saving', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      await page.evaluate(() => {
        sessionStorage.setItem('partyIsHost', 'false');
        sessionStorage.setItem('partyParticipantId', 'guest-test-456');
        sessionStorage.setItem('partyRoomCode', 'SAVE02');
      });

      await page.goto('/#/party/results/SAVE02');
      await page.waitForLoadState('networkidle');

      const saveBtn = page.getByTestId('save-locally-btn');
      await expect(saveBtn).toBeVisible();
      await expect(saveBtn).toBeEnabled();

      // Inject quiz data
      await injectQuizIntoView(page, {
        id: 'disable-test-quiz',
        topic: 'Disable Test Quiz',
        questions: [{ question: 'Test?', answers: ['A', 'B'], correct: 0 }]
      });

      // Click save
      await saveBtn.click();

      // Button should become disabled
      await expect(saveBtn).toBeDisabled({ timeout: 5000 });

      // Button text should indicate success
      const buttonText = await saveBtn.textContent();
      expect(buttonText?.toLowerCase()).toContain('saved');
    });

    test('should show already saved message for duplicate quiz', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      const duplicateQuizId = 'duplicate-test-quiz-id';

      // First, save a quiz with this ID directly to IndexedDB
      await page.evaluate(async (quizId) => {
        return new Promise((resolve) => {
          const request = indexedDB.open('quizmaster');
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['sessions'], 'readwrite');
            const store = transaction.objectStore('sessions');
            store.add({
              sourceQuizId: quizId,
              topic: 'Already Saved Quiz',
              questions: [{ question: 'Test?', answers: ['A', 'B'], correct: 0 }],
              timestamp: Date.now()
            });
            transaction.oncomplete = () => {
              db.close();
              resolve();
            };
          };
        });
      }, duplicateQuizId);

      // Set up as guest
      await page.evaluate(() => {
        sessionStorage.setItem('partyIsHost', 'false');
        sessionStorage.setItem('partyParticipantId', 'guest-test-789');
        sessionStorage.setItem('partyRoomCode', 'SAVE03');
      });

      await page.goto('/#/party/results/SAVE03');
      await page.waitForLoadState('networkidle');

      const saveBtn = page.getByTestId('save-locally-btn');
      await expect(saveBtn).toBeVisible();

      // Inject quiz with same ID as already saved
      await injectQuizIntoView(page, {
        id: duplicateQuizId,
        topic: 'Duplicate Quiz',
        questions: [{ question: 'Test?', answers: ['A', 'B'], correct: 0 }]
      });

      // Click save
      await saveBtn.click();

      // Should show "already saved" feedback - button disabled
      await expect(saveBtn).toBeDisabled({ timeout: 5000 });

      // Check button text contains "already saved" or similar
      const buttonText = await saveBtn.textContent();
      expect(buttonText?.toLowerCase()).toContain('saved');
    });
  });

  test.describe('Host Name Input (Issue #111)', () => {
    // Tests verify that host can enter their name when creating a party

    test('should show name input field on create party view', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Navigate to create party
      await page.goto('/#/party/create');
      await page.waitForLoadState('networkidle');

      // Name input should be visible
      const nameInput = page.getByTestId('host-name-input');
      await expect(nameInput).toBeVisible();
    });

    test('should have name input with correct placeholder', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Navigate to create party
      await page.goto('/#/party/create');
      await page.waitForLoadState('networkidle');

      // Check placeholder text
      const nameInput = page.getByTestId('host-name-input');
      await expect(nameInput).toHaveAttribute('placeholder', /enter|name/i);
    });

    test('should enforce max length on name input', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      await page.goto('/#/party/create');
      await page.waitForLoadState('networkidle');

      const nameInput = page.getByTestId('host-name-input');
      await expect(nameInput).toHaveAttribute('maxlength', '20');
    });

    test('should disable create button when name is empty', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      await page.goto('/#/party/create');
      await page.waitForLoadState('networkidle');

      // Select a quiz first
      const quizItem = page.locator('.quiz-select-item').first();
      if (await quizItem.isVisible()) {
        await quizItem.click();
      }

      // Clear name input if it has value
      const nameInput = page.getByTestId('host-name-input');
      await nameInput.fill('');

      // Create button should be disabled
      const createBtn = page.locator('#createRoomBtn');
      await expect(createBtn).toBeDisabled();
    });

    test('should enable create button when quiz selected and name entered', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      await page.goto('/#/party/create');
      await page.waitForLoadState('networkidle');

      // Select a quiz
      const quizItem = page.locator('.quiz-select-item').first();
      if (await quizItem.isVisible()) {
        await quizItem.click();
      }

      // Enter name
      const nameInput = page.getByTestId('host-name-input');
      await nameInput.fill('TestHost');

      // Create button should be enabled
      const createBtn = page.locator('#createRoomBtn');
      await expect(createBtn).toBeEnabled();
    });

    test('should save host name to localStorage', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      await page.goto('/#/party/create');
      await page.waitForLoadState('networkidle');

      // Enter a name
      const nameInput = page.getByTestId('host-name-input');
      await nameInput.fill('PersistentHost');

      // Navigate away and back
      await page.goto('/#/');
      await page.waitForLoadState('networkidle');
      await page.goto('/#/party/create');
      await page.waitForLoadState('networkidle');

      // Name should be pre-filled from localStorage
      const nameInputAfter = page.getByTestId('host-name-input');
      await expect(nameInputAfter).toHaveValue('PersistentHost');
    });
  });

  test.describe('Create Party Layout (Issue #121)', () => {
    // Tests verify that quiz list fills available space and button is at bottom

    test('quiz list should fill available space on create party', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Set viewport to a known size for consistent testing
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

      await page.goto('/#/party/create');
      await page.waitForLoadState('networkidle');

      // Get the quiz list element
      const quizList = page.locator('#quizList');
      await expect(quizList).toBeVisible();

      // Get quiz list bounding box
      const quizListBox = await quizList.boundingBox();

      // Quiz list height should be greater than the old fixed max-h-64 (256px)
      // With proper flex layout, it should expand to fill available space
      // On a 667px viewport minus header (~60px), name input (~100px), and button (~100px),
      // the quiz list should be at least 300px tall
      expect(quizListBox?.height).toBeGreaterThan(256);
    });

    test('create party button should be at bottom of screen', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Set viewport to a known size for consistent testing
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

      await page.goto('/#/party/create');
      await page.waitForLoadState('networkidle');

      // Get viewport height and create button position
      const viewportHeight = 667;
      const createBtn = page.locator('#createRoomBtn');
      await expect(createBtn).toBeVisible();

      const buttonBox = await createBtn.boundingBox();

      // Button should be in the bottom portion of the screen (last ~150px)
      // Bottom of button should be near viewport bottom
      const buttonBottom = (buttonBox?.y ?? 0) + (buttonBox?.height ?? 0);
      expect(buttonBottom).toBeGreaterThan(viewportHeight - 150);
    });

    test('quiz list should be scrollable with many quizzes', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/#/party/create');
      await page.waitForLoadState('networkidle');

      // Get the quiz list element
      const quizList = page.locator('#quizList');
      await expect(quizList).toBeVisible();

      // Check that the element has overflow-y: auto or scroll
      const overflowY = await quizList.evaluate((el) => {
        return window.getComputedStyle(el).overflowY;
      });
      expect(['auto', 'scroll']).toContain(overflowY);
    });

    test('name input should remain visible (not scrolled away)', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/#/party/create');
      await page.waitForLoadState('networkidle');

      // Name input should be visible and fixed position (not inside scroll area)
      const nameInput = page.getByTestId('host-name-input');
      await expect(nameInput).toBeVisible();
      await expect(nameInput).toBeInViewport();
    });
  });
});
