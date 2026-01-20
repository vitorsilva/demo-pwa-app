// @ts-check
import { test, expect } from '@playwright/test';

// Helper to set up authenticated state (copied from app.spec.js)
async function setupAuthenticatedState(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.evaluate(async () => {
    const dbName = 'quizmaster';
    const dbVersion = 1;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, dbVersion);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
          sessionStore.createIndex('byTopicId', 'topicId');
          sessionStore.createIndex('byTimestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains('topics')) {
          const topicStore = db.createObjectStore('topics', { keyPath: 'id' });
          topicStore.createIndex('byName', 'name');
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');

        store.put({
          key: 'openrouter_api_key',
          value: {
            key: 'sk-or-v1-test-key-for-e2e',
            storedAt: new Date().toISOString()
          }
        });

        store.put({
          key: 'welcomeScreenVersion',
          value: '999.0.0'
        });

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  });

  await page.goto('/#/');
  await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 15000 });
}

test.describe('Quiz Leave Confirmation', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedState(page);
    // Wait for sample quizzes to load
    await page.waitForSelector('.quiz-item', { timeout: 10000 });
  });

  test('should show confirmation when clicking Home during quiz', async ({ page }) => {
    // Start a quiz by clicking on the first quiz item
    await page.locator('.quiz-item').first().click();
    await page.waitForURL('**/quiz');

    // Click Home in bottom navigation
    await page.locator('a[href="#/"]').click();

    // Custom confirm modal should appear
    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible();

    // Cancel to stay on quiz
    await page.click('[data-testid="confirm-cancel-btn"]');

    // Should still be on quiz page (user cancelled)
    await expect(page).toHaveURL(/.*\/quiz/);
  });

  test('should navigate away when confirming leave during quiz', async ({ page }) => {
    // Start a quiz by clicking on the first quiz item
    await page.locator('.quiz-item').first().click();
    await page.waitForURL('**/quiz');

    // Click Home in bottom navigation
    await page.locator('a[href="#/"]').click();

    // Custom confirm modal should appear
    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible();

    // Confirm to leave
    await page.click('[data-testid="confirm-ok-btn"]');

    // Should navigate to home (user confirmed)
    await expect(page).toHaveURL(/.*#\/$/);
  });

  test('should show confirmation when clicking Topics during quiz', async ({ page }) => {
    // Start a quiz by clicking on the first quiz item
    await page.locator('.quiz-item').first().click();
    await page.waitForURL('**/quiz');

    // Click Topics in bottom navigation
    await page.locator('a[href="#/history"]').click();

    // Custom confirm modal should appear
    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible();

    // Cancel to stay on quiz
    await page.click('[data-testid="confirm-cancel-btn"]');

    // Should still be on quiz page
    await expect(page).toHaveURL(/.*\/quiz/);
  });

  test('should show confirmation when clicking Settings during quiz', async ({ page }) => {
    // Start a quiz by clicking on the first quiz item
    await page.locator('.quiz-item').first().click();
    await page.waitForURL('**/quiz');

    // Click Settings in bottom navigation
    await page.locator('a[href="#/settings"]').click();

    // Custom confirm modal should appear
    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible();

    // Cancel to stay on quiz
    await page.click('[data-testid="confirm-cancel-btn"]');

    // Should still be on quiz page
    await expect(page).toHaveURL(/.*\/quiz/);
  });
});
