// @ts-check
import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './helpers.js';

/**
 * Helper to set up state with MODE_TOGGLE feature enabled.
 * Uses localStorage override that features.js checks.
 * @param {import('@playwright/test').Page} page
 */
async function setupWithModeToggleEnabled(page) {
  // First set up authenticated state
  await setupAuthenticatedState(page);

  // Enable the MODE_TOGGLE feature flag via localStorage override
  await page.evaluate(() => {
    localStorage.setItem('__test_feature_MODE_TOGGLE', 'ENABLED');
  });

  // Reload to apply the flag (views read flag at render time)
  await page.reload();
  await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });
}

test.describe('Mode Toggle Feature', () => {
  test.describe('when feature flag is disabled via override', () => {
    test('should NOT show mode toggle when disabled via localStorage', async ({ page }) => {
      await setupAuthenticatedState(page);

      // Disable MODE_TOGGLE via localStorage override (for rollback testing)
      await page.evaluate(() => {
        localStorage.setItem('__test_feature_MODE_TOGGLE', 'DISABLED');
      });
      await page.reload();
      await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });

      // Mode buttons should not be visible when flag is disabled
      const learnButton = page.locator('[data-mode="learning"]');
      const partyButton = page.locator('[data-mode="party"]');

      await expect(learnButton).not.toBeVisible();
      await expect(partyButton).not.toBeVisible();
    });
  });

  test.describe('when feature flag is enabled', () => {
    test('should show mode toggle on home page', async ({ page }) => {
      await setupWithModeToggleEnabled(page);

      const learnButton = page.locator('[data-mode="learning"]');
      const partyButton = page.locator('[data-mode="party"]');

      await expect(learnButton).toBeVisible();
      await expect(partyButton).toBeVisible();
    });

    test('should default to learning mode', async ({ page }) => {
      await setupWithModeToggleEnabled(page);

      const learnButton = page.locator('[data-mode="learning"]');

      // Learning button should be selected by default
      await expect(learnButton).toHaveAttribute('aria-selected', 'true');
    });

    test('should switch to party mode when clicking party button', async ({ page }) => {
      await setupWithModeToggleEnabled(page);

      const partyButton = page.locator('[data-mode="party"]');
      const learnButton = page.locator('[data-mode="learning"]');

      // Click party button
      await partyButton.click();

      // Party should now be selected
      await expect(partyButton).toHaveAttribute('aria-selected', 'true');
      await expect(learnButton).toHaveAttribute('aria-selected', 'false');

      // Document should have party-mode class
      const hasPartyClass = await page.evaluate(() => {
        return document.documentElement.classList.contains('party-mode');
      });
      expect(hasPartyClass).toBe(true);
    });

    test('should switch back to learning mode', async ({ page }) => {
      await setupWithModeToggleEnabled(page);

      const partyButton = page.locator('[data-mode="party"]');
      const learnButton = page.locator('[data-mode="learning"]');

      // First switch to party
      await partyButton.click();
      await expect(partyButton).toHaveAttribute('aria-selected', 'true');

      // Then switch back to learning
      await learnButton.click();
      await expect(learnButton).toHaveAttribute('aria-selected', 'true');
      await expect(partyButton).toHaveAttribute('aria-selected', 'false');

      // Document should not have party-mode class
      const hasPartyClass = await page.evaluate(() => {
        return document.documentElement.classList.contains('party-mode');
      });
      expect(hasPartyClass).toBe(false);
    });

    test('should persist mode across page navigation', async ({ page }) => {
      await setupWithModeToggleEnabled(page);

      const partyButton = page.locator('[data-mode="party"]');

      // Switch to party mode
      await partyButton.click();

      // Navigate to settings
      await page.click('a[href="#/settings"]');
      await expect(page.getByTestId('settings-title')).toBeVisible();

      // Party should still be selected in settings view
      const settingsPartyButton = page.locator('[data-mode="party"]');
      await expect(settingsPartyButton).toHaveAttribute('aria-selected', 'true');
    });

    test('should persist mode across page refresh', async ({ page }) => {
      await setupWithModeToggleEnabled(page);

      const partyButton = page.locator('[data-mode="party"]');

      // Switch to party mode
      await partyButton.click();
      await expect(partyButton).toHaveAttribute('aria-selected', 'true');

      // Reload the page (keep feature flag enabled)
      await page.evaluate(() => {
        localStorage.setItem('__test_feature_MODE_TOGGLE', 'ENABLED');
      });
      await page.reload();
      await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });

      // Party should still be selected after refresh
      const refreshedPartyButton = page.locator('[data-mode="party"]');
      await expect(refreshedPartyButton).toHaveAttribute('aria-selected', 'true');

      // Document should have party-mode class
      const hasPartyClass = await page.evaluate(() => {
        return document.documentElement.classList.contains('party-mode');
      });
      expect(hasPartyClass).toBe(true);
    });

    test('should show toggle on Topics view', async ({ page }) => {
      await setupWithModeToggleEnabled(page);

      // Navigate to history/topics
      await page.click('a[href="#/history"]');
      await expect(page.getByTestId('topics-title')).toBeVisible();

      // Toggle should be visible
      const learnButton = page.locator('[data-mode="learning"]');
      await expect(learnButton).toBeVisible();
    });

    test('should show toggle on Settings view', async ({ page }) => {
      await setupWithModeToggleEnabled(page);

      // Navigate to settings
      await page.click('a[href="#/settings"]');
      await expect(page.getByTestId('settings-title')).toBeVisible();

      // Toggle should be visible
      const learnButton = page.locator('[data-mode="learning"]');
      await expect(learnButton).toBeVisible();
    });

    test('should apply dark theme colors in party mode', async ({ page }) => {
      await setupWithModeToggleEnabled(page);

      const partyButton = page.locator('[data-mode="party"]');

      // Switch to party mode
      await partyButton.click();

      // Check that dark class is applied (party mode uses dark theme)
      const hasDarkClass = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark');
      });
      expect(hasDarkClass).toBe(true);
    });
  });
});
