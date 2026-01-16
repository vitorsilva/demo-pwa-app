import { test, expect } from '@playwright/test';
import { setupAuthenticatedState, clearSessions } from './helpers.js';

test.describe('Usage Cost Display', () => {

  test('should display usage cost card on results page', async ({ page }) => {
    await setupAuthenticatedState(page);
    await clearSessions(page);
    await page.reload();
    await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });

    // Generate and complete a quiz
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Science');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Answer all questions
    for (let i = 0; i < 5; i++) {
      await page.locator('.option-btn').nth(1).click();
      await page.waitForTimeout(200);
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
    }

    // Should be on results page
    await expect(page).toHaveURL(/#\/results/);

    // Should display usage cost card
    const usageCard = page.getByTestId('usage-cost-card');
    await expect(usageCard).toBeVisible();

    // Card should contain usage info
    await expect(usageCard).toContainText('This quiz used');
    await expect(usageCard).toContainText('tokens');
  });

  test('should show free model indicator in usage card', async ({ page }) => {
    await setupAuthenticatedState(page);
    await clearSessions(page);
    await page.reload();
    await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });

    // Generate and complete a quiz
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'History');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Answer all questions
    for (let i = 0; i < 5; i++) {
      await page.locator('.option-btn').nth(1).click();
      await page.waitForTimeout(200);
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
    }

    await expect(page).toHaveURL(/#\/results/);

    // Usage card should show free model indicator
    const usageCard = page.getByTestId('usage-cost-card');
    await expect(usageCard).toBeVisible();
    await expect(usageCard).toContainText('Free');
  });

  test('should display cost in quiz history on Topics page', async ({ page }) => {
    await setupAuthenticatedState(page);
    await clearSessions(page);
    await page.reload();
    await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });

    // Generate and complete a quiz
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Geography');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Answer all questions
    for (let i = 0; i < 5; i++) {
      await page.locator('.option-btn').nth(1).click();
      await page.waitForTimeout(200);
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
    }

    await expect(page).toHaveURL(/#\/results/);

    // Navigate to Topics page
    await page.goto('/#/history');
    await expect(page.getByTestId('topics-title')).toBeVisible();

    // Quiz should appear with cost info
    const quizItem = page.locator('.quiz-item').first();
    await expect(quizItem).toBeVisible();

    // Should show cost (Free for mock API)
    await expect(quizItem).toContainText('Free');
  });

  test('should show credits balance in Settings when connected', async ({ page }) => {
    // Mock the credits API response
    await page.route('**/api/v1/auth/key', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { limit_remaining: 5.50 }
        })
      });
    });

    await setupAuthenticatedState(page);
    await page.goto('/#/settings');

    // Wait for Settings page to load
    await expect(page.getByTestId('settings-title')).toBeVisible();

    // Should show credits balance
    const creditsBalance = page.getByTestId('credits-balance');
    await expect(creditsBalance).toBeVisible();
    await expect(creditsBalance).toContainText('$5.50');
    await expect(creditsBalance).toContainText('remaining');
  });

  test('should link to OpenRouter activity page from credits card', async ({ page }) => {
    // Mock the credits API response
    await page.route('**/api/v1/auth/key', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { limit_remaining: 10.00 }
        })
      });
    });

    await setupAuthenticatedState(page);
    await page.goto('/#/settings');

    // Wait for Settings page to load
    await expect(page.getByTestId('settings-title')).toBeVisible();

    // Find the credits card link
    const creditsLink = page.locator('a[href="https://openrouter.ai/activity"]');
    await expect(creditsLink).toBeVisible();

    // Should have external link indicator
    await expect(creditsLink.locator('text=open_in_new')).toBeVisible();
  });

  test('should handle zero credits balance', async ({ page }) => {
    // Mock the credits API response with zero balance
    await page.route('**/api/v1/auth/key', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { limit_remaining: 0 }
        })
      });
    });

    await setupAuthenticatedState(page);
    await page.goto('/#/settings');

    // Wait for Settings page to load
    await expect(page.getByTestId('settings-title')).toBeVisible();

    // Should still show credits balance
    const creditsBalance = page.getByTestId('credits-balance');
    await expect(creditsBalance).toBeVisible();
    await expect(creditsBalance).toContainText('$0.00');
  });

  test('should show free tier fallback when credits API fails', async ({ page }) => {
    // Mock the credits API to fail
    await page.route('**/api/v1/auth/key', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' })
      });
    });

    await setupAuthenticatedState(page);
    await page.goto('/#/settings');

    // Wait for Settings page to load
    await expect(page.getByTestId('settings-title')).toBeVisible();

    // When API fails, should gracefully degrade to free tier status
    // The element should be visible showing free tier info, not specific credits
    const creditsBalance = page.getByTestId('credits-balance');
    await expect(creditsBalance).toBeVisible();
    // Should NOT contain a dollar amount (e.g., "$5.50 remaining")
    await expect(creditsBalance).not.toContainText(/\$\d+\.\d+/);
  });

});
