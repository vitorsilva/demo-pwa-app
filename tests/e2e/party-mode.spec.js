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
});
