// @ts-check
import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './helpers.js';

/**
 * E2E tests for the Screen Name setting feature (Issue #112)
 *
 * Tests cover:
 * - Setting screen name in Settings view
 * - Pre-filling name in party host flow
 * - Pre-filling name in party guest flow
 * - Auto-save behavior for first-time users
 */

/**
 * Helper to set screenName in localStorage
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
async function setScreenNameSetting(page, name) {
  await page.evaluate((screenName) => {
    const settings = JSON.parse(localStorage.getItem('quizmaster_settings') || '{}');
    settings.screenName = screenName;
    localStorage.setItem('quizmaster_settings', JSON.stringify(settings));
  }, name);
}

/**
 * Helper to get screenName from localStorage
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string|undefined>}
 */
async function getScreenNameSetting(page) {
  return page.evaluate(() => {
    const settings = JSON.parse(localStorage.getItem('quizmaster_settings') || '{}');
    return settings.screenName;
  });
}

/**
 * Helper to clear screenName from localStorage
 * @param {import('@playwright/test').Page} page
 */
async function clearScreenNameSetting(page) {
  await page.evaluate(() => {
    const settings = JSON.parse(localStorage.getItem('quizmaster_settings') || '{}');
    delete settings.screenName;
    localStorage.setItem('quizmaster_settings', JSON.stringify(settings));
    // Also clear legacy storage
    localStorage.removeItem('partyPlayerName');
  });
}

test.describe('Screen Name Setting Feature', () => {

  test('should render screen name input in settings', async ({ page }) => {
    await setupAuthenticatedState(page);

    // Navigate to settings
    await page.click('a[href="#/settings"]');
    await expect(page.getByTestId('settings-title')).toBeVisible();

    // Screen name input should be visible
    const screenNameInput = page.getByTestId('screen-name-input');
    await expect(screenNameInput).toBeVisible();
  });

  test('should display screen name from settings', async ({ page }) => {
    await setupAuthenticatedState(page);

    // Set screen name via localStorage
    await setScreenNameSetting(page, 'TestPlayer');

    // Navigate to settings
    await page.click('a[href="#/settings"]');
    await expect(page.getByTestId('settings-title')).toBeVisible();

    // Verify the input shows the saved value
    const screenNameInput = page.getByTestId('screen-name-input');
    await expect(screenNameInput).toHaveValue('TestPlayer');
  });

  test('should prefill party host name from screen name setting', async ({ page }) => {
    await setupAuthenticatedState(page);

    // Set screen name via localStorage
    await setScreenNameSetting(page, 'PartyHost');

    // Navigate to home (reload to pick up the setting)
    await page.goto('/#/');
    await expect(page.getByTestId('welcome-heading')).toBeVisible();

    // Switch to party mode
    const partyButton = page.locator('[data-mode="party"]');
    await partyButton.click();

    // Click Create Party
    await page.click('[data-testid="create-party-btn"]');

    // Wait for the create party view
    await page.waitForSelector('[data-testid="host-name-input"]', { timeout: 10000 });

    // Verify name is pre-filled
    const hostNameInput = page.getByTestId('host-name-input');
    await expect(hostNameInput).toHaveValue('PartyHost');
  });

  test('should prefill party guest name from screen name setting', async ({ page }) => {
    await setupAuthenticatedState(page);

    // Set screen name via localStorage
    await setScreenNameSetting(page, 'PartyGuest');

    // Navigate to home (reload to pick up the setting)
    await page.goto('/#/');
    await expect(page.getByTestId('welcome-heading')).toBeVisible();

    // Switch to party mode
    const partyButton = page.locator('[data-mode="party"]');
    await partyButton.click();

    // Click Join Party
    await page.click('[data-testid="join-party-btn"]');

    // Wait for the join party view
    await page.waitForSelector('[data-testid="player-name-input"]', { timeout: 10000 });

    // Verify name is pre-filled
    const playerNameInput = page.getByTestId('player-name-input');
    await expect(playerNameInput).toHaveValue('PartyGuest');
  });

  test('should auto-save first-time name entry to setting and show feedback', async ({ page }) => {
    await setupAuthenticatedState(page);

    // Clear any existing screen name
    await clearScreenNameSetting(page);

    // Navigate to home
    await page.goto('/#/');
    await expect(page.getByTestId('welcome-heading')).toBeVisible();

    // Switch to party mode
    const partyButton = page.locator('[data-mode="party"]');
    await partyButton.click();

    // Click Create Party
    await page.click('[data-testid="create-party-btn"]');
    await page.waitForSelector('[data-testid="host-name-input"]', { timeout: 10000 });

    // Name field should be empty
    const hostNameInput = page.getByTestId('host-name-input');
    await expect(hostNameInput).toHaveValue('');

    // Type a name
    await hostNameInput.fill('FirstTimeUser');

    // Feedback should appear
    const feedback = page.locator('#nameSavedFeedback');
    await expect(feedback).toBeVisible();

    // Verify the setting was saved
    const savedScreenName = await getScreenNameSetting(page);
    expect(savedScreenName).toBe('FirstTimeUser');
  });

  test('overriding prefilled name should not change setting', async ({ page }) => {
    await setupAuthenticatedState(page);

    // Set screen name via localStorage
    await setScreenNameSetting(page, 'OriginalName');

    // Navigate to party mode
    await page.goto('/#/');
    await expect(page.getByTestId('welcome-heading')).toBeVisible();

    const partyButton = page.locator('[data-mode="party"]');
    await partyButton.click();

    await page.click('[data-testid="create-party-btn"]');
    await page.waitForSelector('[data-testid="host-name-input"]', { timeout: 10000 });

    // Verify pre-filled
    const hostNameInput = page.getByTestId('host-name-input');
    await expect(hostNameInput).toHaveValue('OriginalName');

    // Change the name for this session
    await hostNameInput.fill('SessionOverride');

    // Feedback should NOT appear (screenName was not empty)
    const feedback = page.locator('#nameSavedFeedback');
    await expect(feedback).not.toBeVisible();

    // The setting should still be the original
    const savedScreenName = await getScreenNameSetting(page);
    expect(savedScreenName).toBe('OriginalName');
  });

});
