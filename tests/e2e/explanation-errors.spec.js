import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './helpers.js';

/**
 * Tests for explanation error handling (Issue #147)
 *
 * These tests verify that specific error messages are shown for:
 * - Rate limit exceeded (429)
 * - Invalid API key (401)
 * - Generic errors (fallback)
 *
 * The tests use the mock API's error simulation feature:
 * window.__MOCK_EXPLANATION_ERROR__ = { message: '...', code: '...' }
 */
test.describe('Explanation Error Handling', () => {

  /**
   * Helper to complete a quiz with at least one wrong answer
   * so we can test the explanation feature
   */
  async function completeQuizWithWrongAnswer(page) {
    // Generate a quiz
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Test Topic');
    await page.click('#generateBtn');

    // Wait for quiz to load
    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Answer all questions - first one WRONG (option 0), rest correct (option 1)
    // Mock quiz always has correct answer at index 1
    for (let i = 0; i < 5; i++) {
      const optionIndex = i === 0 ? 0 : 1; // First answer wrong, rest correct
      await page.locator('.option-btn').nth(optionIndex).click();
      await page.waitForTimeout(200);
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
    }

    // Should be on results page
    await expect(page).toHaveURL(/#\/results/);
  }

  test('should show rate limit error message', async ({ page }) => {
    await setupAuthenticatedState(page);
    await completeQuizWithWrongAnswer(page);

    // Set up error simulation BEFORE clicking explain
    await page.evaluate(() => {
      /** @type {*} */ (window).__MOCK_EXPLANATION_ERROR__ = {
        message: 'Rate limit exceeded. Free tier allows 50 requests/day.',
        code: 'RATE_LIMIT'
      };
    });

    // Click the explain button for the first (wrong) answer
    const explainBtn = page.locator('.explain-btn').first();
    await expect(explainBtn).toBeVisible();
    await explainBtn.click();

    // Wait for explanation modal to appear
    const modal = page.locator('#explanationModal');
    await expect(modal).toBeVisible();

    // Should show rate limit specific message
    await expect(modal).toContainText('Daily limit reached');
    await expect(modal).toContainText('50 requests/day');
  });

  test('should show invalid API key error with Settings action', async ({ page }) => {
    await setupAuthenticatedState(page);
    await completeQuizWithWrongAnswer(page);

    // Set up error simulation
    await page.evaluate(() => {
      /** @type {*} */ (window).__MOCK_EXPLANATION_ERROR__ = {
        message: 'Invalid API key. Please reconnect with OpenRouter.',
        code: 'INVALID_API_KEY'
      };
    });

    // Click the explain button
    const explainBtn = page.locator('.explain-btn').first();
    await expect(explainBtn).toBeVisible();
    await explainBtn.click();

    // Wait for explanation modal
    const modal = page.locator('#explanationModal');
    await expect(modal).toBeVisible();

    // Should show invalid key message
    await expect(modal).toContainText('connection expired');

    // Should have Settings action button
    const settingsBtn = modal.locator('text=Settings');
    await expect(settingsBtn).toBeVisible();

    // Click Settings button should navigate to settings
    await settingsBtn.click();
    await expect(page).toHaveURL(/#\/settings/);
  });

  test('should show generic error for unknown errors', async ({ page }) => {
    await setupAuthenticatedState(page);
    await completeQuizWithWrongAnswer(page);

    // Set up error simulation with no specific code
    await page.evaluate(() => {
      /** @type {*} */ (window).__MOCK_EXPLANATION_ERROR__ = {
        message: 'Some unexpected error occurred'
        // No code - should fall back to generic error
      };
    });

    // Click the explain button
    const explainBtn = page.locator('.explain-btn').first();
    await expect(explainBtn).toBeVisible();
    await explainBtn.click();

    // Wait for explanation modal
    const modal = page.locator('#explanationModal');
    await expect(modal).toBeVisible();

    // Should show generic error message (existing behavior)
    await expect(modal).toContainText(/couldn.*load|failed/i);

    // Should have retry button
    const retryBtn = modal.locator('text=Try again');
    await expect(retryBtn).toBeVisible();
  });

  test('should work normally when no error occurs', async ({ page }) => {
    await setupAuthenticatedState(page);
    await completeQuizWithWrongAnswer(page);

    // No error simulation - should work normally

    // Click the explain button
    const explainBtn = page.locator('.explain-btn').first();
    await expect(explainBtn).toBeVisible();
    await explainBtn.click();

    // Wait for explanation modal
    const modal = page.locator('#explanationModal');
    await expect(modal).toBeVisible();

    // Should show the explanation (not error)
    await expect(modal).toContainText('correct answer');

    // Should NOT show error message
    await expect(modal).not.toContainText('Daily limit reached');
    await expect(modal).not.toContainText('connection expired');
  });

});
