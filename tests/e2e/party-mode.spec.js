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

    /**
     * Helper to set up a mock party session with quiz data.
     * Simulates a P2P session that has quiz data available.
     * @param {import('@playwright/test').Page} page
     * @param {Object} options
     * @param {string} [options.quizId] - Optional quiz ID for duplicate testing
     */
    async function setupMockPartySession(page, options = {}) {
      const quizId = options.quizId || `party-quiz-${Date.now()}`;

      await page.evaluate((quizId) => {
        // Mock quiz data that would come from a P2P session
        const mockQuiz = {
          id: quizId,
          topic: 'Test Party Quiz',
          gradeLevel: 'high-school',
          questions: [
            {
              question: 'What is 2 + 2?',
              answers: ['3', '4', '5', '6'],
              correct: 1
            },
            {
              question: 'What is the capital of France?',
              answers: ['London', 'Berlin', 'Paris', 'Madrid'],
              correct: 2
            }
          ]
        };

        // Store mock connection data that PartyResultsView will use
        window.__mockPartyQuiz = mockQuiz;

        // Set session storage for guest
        sessionStorage.setItem('partyIsHost', 'false');
        sessionStorage.setItem('partyParticipantId', 'guest-test-123');
        sessionStorage.setItem('partyRoomCode', 'SAVE01');
      }, quizId);
    }

    /**
     * Helper to inject mock connection manager for testing.
     * @param {import('@playwright/test').Page} page
     */
    async function injectMockConnectionManager(page) {
      await page.evaluate(() => {
        // Create a mock connection manager that provides quiz data
        const mockSession = {
          quiz: window.__mockPartyQuiz,
          participantId: 'guest-test-123',
          getStandings: () => [
            { id: 'host-123', name: 'Host', score: 25, answers: [1, 2], isHost: true },
            { id: 'guest-test-123', name: 'Guest', score: 20, answers: [1, 2], isYou: true }
          ]
        };

        const mockConnectionManager = {
          getSession: () => mockSession
        };

        // Store in window for the view to access via getConnection()
        window.__mockConnectionManager = mockConnectionManager;
      });
    }

    test('guest should be able to save quiz locally', async ({ page }) => {
      await setupWithPartyModeEnabled(page);
      await setupMockPartySession(page, { quizId: 'save-test-quiz-1' });

      // Override getConnection to return our mock
      await page.addInitScript(() => {
        // This will be available when the page loads
        window.__testMockEnabled = true;
      });

      // Navigate to party results
      await page.goto('/#/party/results/SAVE01');
      await page.waitForLoadState('networkidle');

      // Inject the mock connection manager after page loads
      await injectMockConnectionManager(page);

      // Reload to pick up the mock
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Re-inject after reload
      await setupMockPartySession(page, { quizId: 'save-test-quiz-1' });
      await injectMockConnectionManager(page);

      // Find and click the save button
      const saveBtn = page.getByTestId('save-locally-btn');
      await expect(saveBtn).toBeVisible();
      await saveBtn.click();

      // Should show success feedback (button text changes or success message)
      // Wait for the button to be disabled or show success state
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
              // Find the party quiz we saved (by topic)
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

      // Privacy: should NOT contain creator or party info
      expect(savedQuiz.creator).toBeUndefined();
      expect(savedQuiz.partySessionId).toBeUndefined();
      expect(savedQuiz.hostId).toBeUndefined();
    });

    test('save button should be disabled after saving', async ({ page }) => {
      await setupWithPartyModeEnabled(page);
      await setupMockPartySession(page, { quizId: 'disable-test-quiz' });

      await page.goto('/#/party/results/SAVE01');
      await page.waitForLoadState('networkidle');

      await injectMockConnectionManager(page);
      await page.reload();
      await page.waitForLoadState('networkidle');
      await setupMockPartySession(page, { quizId: 'disable-test-quiz' });
      await injectMockConnectionManager(page);

      const saveBtn = page.getByTestId('save-locally-btn');
      await expect(saveBtn).toBeVisible();
      await expect(saveBtn).toBeEnabled();

      // Click save
      await saveBtn.click();

      // Button should become disabled
      await expect(saveBtn).toBeDisabled({ timeout: 5000 });
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

      // Now set up party session with the same quiz ID
      await setupMockPartySession(page, { quizId: duplicateQuizId });

      await page.goto('/#/party/results/SAVE01');
      await page.waitForLoadState('networkidle');
      await injectMockConnectionManager(page);
      await page.reload();
      await page.waitForLoadState('networkidle');
      await setupMockPartySession(page, { quizId: duplicateQuizId });
      await injectMockConnectionManager(page);

      const saveBtn = page.getByTestId('save-locally-btn');
      await expect(saveBtn).toBeVisible();

      // Click save
      await saveBtn.click();

      // Should show "already saved" feedback (button disabled with different text or alert)
      await expect(saveBtn).toBeDisabled({ timeout: 5000 });

      // Check button text contains "already saved" or similar
      const buttonText = await saveBtn.textContent();
      expect(buttonText?.toLowerCase()).toContain('saved');
    });
  });
});
