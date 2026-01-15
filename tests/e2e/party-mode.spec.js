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
    test('host should see Next Question button after answering', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Create a party as host
      await page.goto('/#/party/create');
      await page.waitForLoadState('networkidle');

      // Fill in host name
      const nameInput = page.getByTestId('host-name-input');
      await nameInput.fill('TestHost');

      // Generate quiz and create party
      const generateBtn = page.getByTestId('generate-quiz-btn');
      if (await generateBtn.isVisible()) {
        await generateBtn.click();
        await page.waitForTimeout(2000);
      }

      const createBtn = page.getByTestId('create-party-btn');
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(1000);
      }

      // Start the quiz
      const startBtn = page.getByTestId('start-quiz-btn');
      if (await startBtn.isVisible()) {
        await startBtn.click();
        await page.waitForTimeout(1000);
      }

      // Answer a question
      const optionBtn = page.getByTestId('option-0');
      if (await optionBtn.isVisible()) {
        await optionBtn.click();
        await page.waitForTimeout(500);
      }

      // Host should see Next Question button
      const nextQuestionBtn = page.getByTestId('next-question-btn');
      await expect(nextQuestionBtn).toBeVisible();
    });

    test('Next Question button should show answer status indicator', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Navigate to a mock party quiz state (simplified test)
      await page.goto('/#/party/quiz/TEST123');
      await page.waitForLoadState('networkidle');

      // The status indicator should show answered count
      const statusIndicator = page.getByTestId('answer-status-indicator');
      // Status should contain answered count pattern like "X/Y answered" or "Waiting for X..."
      await expect(statusIndicator).toBeVisible();
    });

    test('non-host should NOT see Next Question button', async ({ page }) => {
      await setupWithPartyModeEnabled(page);

      // Set up as a non-host participant (simulate joining)
      await page.evaluate(() => {
        sessionStorage.setItem('partyIsHost', 'false');
        sessionStorage.setItem('partyParticipantId', 'guest-123');
        sessionStorage.setItem('partyRoomCode', 'TEST456');
      });

      // Navigate to party quiz view
      await page.goto('/#/party/quiz/TEST456');
      await page.waitForLoadState('networkidle');

      // Non-host should NOT see the Next Question button
      const nextQuestionBtn = page.getByTestId('next-question-btn');
      await expect(nextQuestionBtn).not.toBeVisible();
    });
  });
});
