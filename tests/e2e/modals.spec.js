// @ts-check
import { test, expect } from '@playwright/test';

// Helper to set up authenticated state
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

test.describe('Custom Alert and Confirm Modals', () => {
  test.describe('AlertModal', () => {
    test('should show alert when submitting empty topic', async ({ page }) => {
      await setupAuthenticatedState(page);

      // Navigate directly to topic input
      await page.goto('/#/topic-input');
      await page.waitForSelector('#topicInput', { timeout: 10000 });

      // Click generate without entering topic
      await page.click('[data-testid="generate-quiz-btn"]');

      // Alert modal should appear
      const alertModal = page.locator('[data-testid="alert-modal"]');
      await expect(alertModal).toBeVisible();

      // Should have warning icon (for validation)
      const warningIcon = alertModal.locator('.material-symbols-outlined');
      await expect(warningIcon).toContainText('warning');

      // Click OK to dismiss
      await page.click('[data-testid="alert-ok-btn"]');

      // Modal should be gone
      await expect(alertModal).not.toBeVisible();

      // Should still be on topic input page
      await expect(page).toHaveURL(/.*\/topic-input/);
    });

    test('should close alert on backdrop click', async ({ page }) => {
      await setupAuthenticatedState(page);

      // Navigate directly to topic input
      await page.goto('/#/topic-input');
      await page.waitForSelector('#topicInput', { timeout: 10000 });

      // Trigger alert by clicking generate without topic
      await page.click('[data-testid="generate-quiz-btn"]');

      // Alert should be visible
      const alertModal = page.locator('[data-testid="alert-modal"]');
      await expect(alertModal).toBeVisible();

      // Click on backdrop (the outer container)
      await page.locator('#alertModal').click({ position: { x: 10, y: 10 } });

      // Modal should close
      await expect(alertModal).not.toBeVisible();
    });

    test('should close alert on Escape key', async ({ page }) => {
      await setupAuthenticatedState(page);

      // Navigate directly to topic input
      await page.goto('/#/topic-input');
      await page.waitForSelector('#topicInput', { timeout: 10000 });

      // Trigger alert
      await page.click('[data-testid="generate-quiz-btn"]');

      // Alert should be visible
      const alertModal = page.locator('[data-testid="alert-modal"]');
      await expect(alertModal).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');

      // Modal should close
      await expect(alertModal).not.toBeVisible();
    });
  });

  test.describe('ConfirmModal', () => {
    test('should show confirm modal when leaving quiz', async ({ page }) => {
      await setupAuthenticatedState(page);

      // Wait for sample quizzes and start one
      await page.waitForSelector('.quiz-item', { timeout: 10000 });
      await page.locator('.quiz-item').first().click();
      await page.waitForURL('**/quiz');

      // Click back button (or home link)
      await page.click('#backBtn');

      // Confirm modal should appear
      const confirmModal = page.locator('[data-testid="confirm-modal"]');
      await expect(confirmModal).toBeVisible();

      // Should have warning icon
      const warningIcon = confirmModal.locator('.material-symbols-outlined');
      await expect(warningIcon).toContainText('warning');
    });

    test('should stay on quiz when cancel clicked', async ({ page }) => {
      await setupAuthenticatedState(page);

      // Wait for sample quizzes and start one
      await page.waitForSelector('.quiz-item', { timeout: 10000 });
      await page.locator('.quiz-item').first().click();
      await page.waitForURL('**/quiz');

      // Click back button
      await page.click('#backBtn');

      // Confirm modal should appear
      const confirmModal = page.locator('[data-testid="confirm-modal"]');
      await expect(confirmModal).toBeVisible();

      // Click cancel
      await page.click('[data-testid="confirm-cancel-btn"]');

      // Modal should close
      await expect(confirmModal).not.toBeVisible();

      // Should still be on quiz page
      await expect(page).toHaveURL(/.*\/quiz/);
    });

    test('should navigate away when confirm clicked', async ({ page }) => {
      await setupAuthenticatedState(page);

      // Wait for sample quizzes and start one
      await page.waitForSelector('.quiz-item', { timeout: 10000 });
      await page.locator('.quiz-item').first().click();
      await page.waitForURL('**/quiz');

      // Click back button
      await page.click('#backBtn');

      // Confirm modal should appear
      const confirmModal = page.locator('[data-testid="confirm-modal"]');
      await expect(confirmModal).toBeVisible();

      // Click confirm (Leave)
      await page.click('[data-testid="confirm-ok-btn"]');

      // Should navigate to home
      await expect(page).toHaveURL(/.*#\/$/);
    });

    test('should close confirm modal on Escape key (as cancel)', async ({ page }) => {
      await setupAuthenticatedState(page);

      // Wait for sample quizzes and start one
      await page.waitForSelector('.quiz-item', { timeout: 10000 });
      await page.locator('.quiz-item').first().click();
      await page.waitForURL('**/quiz');

      // Click back button
      await page.click('#backBtn');

      // Confirm modal should appear
      const confirmModal = page.locator('[data-testid="confirm-modal"]');
      await expect(confirmModal).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');

      // Modal should close
      await expect(confirmModal).not.toBeVisible();

      // Should still be on quiz page (Escape = cancel)
      await expect(page).toHaveURL(/.*\/quiz/);
    });

    test('should close confirm modal on backdrop click (as cancel)', async ({ page }) => {
      await setupAuthenticatedState(page);

      // Wait for sample quizzes and start one
      await page.waitForSelector('.quiz-item', { timeout: 10000 });
      await page.locator('.quiz-item').first().click();
      await page.waitForURL('**/quiz');

      // Click back button
      await page.click('#backBtn');

      // Confirm modal should appear
      const confirmModal = page.locator('[data-testid="confirm-modal"]');
      await expect(confirmModal).toBeVisible();

      // Click on backdrop
      await page.locator('#confirmModal').click({ position: { x: 10, y: 10 } });

      // Modal should close
      await expect(confirmModal).not.toBeVisible();

      // Should still be on quiz page
      await expect(page).toHaveURL(/.*\/quiz/);
    });

    test('should show confirm modal when clicking nav links during quiz', async ({ page }) => {
      await setupAuthenticatedState(page);

      // Wait for sample quizzes and start one
      await page.waitForSelector('.quiz-item', { timeout: 10000 });
      await page.locator('.quiz-item').first().click();
      await page.waitForURL('**/quiz');

      // Click Home in bottom navigation
      await page.locator('a[href="#/"]').click();

      // Confirm modal should appear
      const confirmModal = page.locator('[data-testid="confirm-modal"]');
      await expect(confirmModal).toBeVisible();

      // Cancel to stay on quiz
      await page.click('[data-testid="confirm-cancel-btn"]');
      await expect(page).toHaveURL(/.*\/quiz/);
    });
  });
});
