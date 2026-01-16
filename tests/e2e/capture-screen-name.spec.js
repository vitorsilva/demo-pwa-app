// @ts-check
import { test } from '@playwright/test';
import { setupAuthenticatedState } from './helpers.js';

/**
 * One-time capture script for Issue #112 screenshots
 * Run with: npm run test:e2e -- tests/e2e/capture-screen-name.spec.js
 */

test.describe('Capture Screen Name Screenshots', () => {

  test('capture settings view with screen name field', async ({ page }) => {
    await setupAuthenticatedState(page);

    // Navigate to settings
    await page.click('a[href="#/settings"]');
    await page.waitForSelector('[data-testid="screen-name-input"]', { timeout: 10000 });

    // Wait for any animations to settle
    await page.waitForTimeout(500);

    // Take screenshot of the settings page (viewport)
    await page.screenshot({
      path: 'docs/issues/112-settings-screen-name.png',
      fullPage: false
    });

    console.log('Screenshot saved to docs/issues/112-settings-screen-name.png');
  });

});
