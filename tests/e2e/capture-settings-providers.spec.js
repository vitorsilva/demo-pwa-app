import { test, expect } from '@playwright/test';
import { setupAuthenticatedState, clearSessions } from './helpers.js';

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const SCREENSHOT_DIR = 'landing/images';

test.use({ viewport: MOBILE_VIEWPORT });

test.describe('Capture Settings Provider Screenshots', () => {

  test('Settings page with LLM Providers section', async ({ page }) => {
    await setupAuthenticatedState(page);
    await clearSessions(page);
    await page.reload();
    await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });

    // Navigate to Settings
    await page.goto('/#/settings');
    await page.waitForTimeout(500);

    // Scroll to LLM Providers section (ensure it's visible)
    const providerSection = page.locator('[data-testid="provider-section"]');
    if (await providerSection.count() > 0) {
      await providerSection.scrollIntoViewIfNeeded();
    }
    await page.waitForTimeout(300);

    // Capture screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/landing-06-settings-page.png`,
      fullPage: false
    });

    console.log('✓ Captured: Settings page with LLM Providers');
  });

});
