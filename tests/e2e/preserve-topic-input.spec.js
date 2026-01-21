import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './helpers.js';

/**
 * Tests for preserving topic input when quiz generation fails (Issue #148)
 *
 * These tests verify that when returning to the topic input page after
 * a failed quiz generation, the user's original topic text and grade
 * level selection are preserved.
 *
 * Uses the mock API's error simulation feature:
 * window.__MOCK_GENERATION_ERROR__ = { message: '...' }
 */
test.describe('Preserve Topic Input on Generation Failure', () => {

  test.beforeEach(async ({ page }) => {
    // Speed up tests by reducing mock API delay
    await page.addInitScript(() => {
      /** @type {*} */ (window).MOCK_API_DELAY_MS = 100;
    });
  });

  test('should preserve topic text when generation fails', async ({ page }) => {
    await setupAuthenticatedState(page);

    // Navigate to topic input
    await page.goto('/#/topic-input');
    await expect(page.locator('#topicInput')).toBeVisible();

    // Enter a detailed topic
    const testTopic = 'Advanced quantum mechanics for beginners with real-world examples';
    await page.fill('#topicInput', testTopic);

    // Select a grade level
    await page.selectOption('#gradeLevelSelect', 'college');

    // Set up error simulation BEFORE clicking generate
    await page.evaluate(() => {
      /** @type {*} */ (window).__MOCK_GENERATION_ERROR__ = {
        message: 'Rate limit exceeded. Please try again later.'
      };
    });

    // Click generate
    await page.click('#generateBtn');

    // Should navigate to loading page first
    await expect(page).toHaveURL(/#\/loading/);

    // Wait for the custom AlertModal to appear and dismiss it
    const alertModal = page.locator('[data-testid="alert-modal"]');
    await expect(alertModal).toBeVisible({ timeout: 10000 });
    await page.click('[data-testid="alert-ok-btn"]');

    // Should return to topic input after dismissing error modal
    await expect(page).toHaveURL(/#\/topic-input/, { timeout: 5000 });

    // Topic text should be preserved
    const topicValue = await page.locator('#topicInput').inputValue();
    expect(topicValue).toBe(testTopic);

    // Grade level should be preserved
    const gradeValue = await page.locator('#gradeLevelSelect').inputValue();
    expect(gradeValue).toBe('college');
  });

  test('should preserve topic when user cancels during loading', async ({ page }) => {
    await setupAuthenticatedState(page);

    // Navigate to topic input
    await page.goto('/#/topic-input');

    // Enter a topic
    const testTopic = 'History of ancient civilizations';
    await page.fill('#topicInput', testTopic);
    await page.selectOption('#gradeLevelSelect', 'high school');

    // Make the API take longer so we can cancel
    await page.evaluate(() => {
      /** @type {*} */ (window).MOCK_API_DELAY_MS = 5000;
    });

    // Click generate
    await page.click('#generateBtn');

    // Should be on loading page
    await expect(page).toHaveURL(/#\/loading/);

    // Click cancel button (this triggers a ConfirmModal)
    await page.click('#cancelBtn');

    // Wait for the custom ConfirmModal to appear and confirm the cancel
    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible({ timeout: 5000 });
    await page.click('[data-testid="confirm-ok-btn"]');

    // Should return to topic input
    await expect(page).toHaveURL(/#\/topic-input/, { timeout: 5000 });

    // Topic text should be preserved
    const topicValue = await page.locator('#topicInput').inputValue();
    expect(topicValue).toBe(testTopic);

    // Grade level should be preserved
    const gradeValue = await page.locator('#gradeLevelSelect').inputValue();
    expect(gradeValue).toBe('high school');
  });

  test('should not affect successful quiz generation flow', async ({ page }) => {
    await setupAuthenticatedState(page);

    // Navigate to topic input
    await page.goto('/#/topic-input');

    // Enter a topic (no error simulation)
    await page.fill('#topicInput', 'Basic mathematics');
    await page.selectOption('#gradeLevelSelect', 'middle school');

    // Click generate
    await page.click('#generateBtn');

    // Should navigate through loading to quiz
    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Quiz should be displayed (use same selector as app.spec.js)
    await expect(page.getByTestId('quiz-title')).toBeVisible();
  });

  test('should prioritize deep link prefill over saved topic', async ({ page }) => {
    await setupAuthenticatedState(page);

    // First, set up a saved topic in state by starting a generation that fails
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Saved topic from previous attempt');

    // Set up error simulation
    await page.evaluate(() => {
      /** @type {*} */ (window).__MOCK_GENERATION_ERROR__ = {
        message: 'Error'
      };
    });

    await page.click('#generateBtn');

    // Wait for the custom AlertModal to appear and dismiss it
    const alertModal = page.locator('[data-testid="alert-modal"]');
    await expect(alertModal).toBeVisible({ timeout: 10000 });
    await page.click('[data-testid="alert-ok-btn"]');

    await expect(page).toHaveURL(/#\/topic-input/, { timeout: 5000 });

    // Clear the error for next test
    await page.evaluate(() => {
      delete /** @type {*} */ (window).__MOCK_GENERATION_ERROR__;
    });

    // Now navigate with a deep link topic - should override saved topic
    // Deep link uses query param on base URL (not hash route): /?topic=...
    const deepLinkTopic = 'Deep link topic override';
    await page.goto(`/?topic=${encodeURIComponent(deepLinkTopic)}`);

    // Should redirect to topic-input with the prefilled topic
    await expect(page).toHaveURL(/#\/topic-input/, { timeout: 10000 });

    // Deep link topic should take priority
    const topicValue = await page.locator('#topicInput').inputValue();
    expect(topicValue).toBe(deepLinkTopic);
  });
});
