// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Tests for Issue #143: Shared quiz links redirect new users to onboarding instead of quiz
 *
 * When a new user clicks a shared quiz link (e.g., /app/#/quiz/<encoded_data>), they should
 * go directly to the Import view to preview/import the quiz, NOT the onboarding/welcome screen.
 */

/**
 * Helper to clear all storage and simulate a fresh new user.
 * Must be called after navigating to the app origin.
 * @param {import('@playwright/test').Page} page
 */
async function clearAllStorageForNewUser(page) {
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    // Delete IndexedDB databases
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });
}

test.describe('Shared Quiz - Onboarding Bypass (Issue #143)', () => {
  test('new user with shared quiz link should bypass onboarding and see import screen', async ({
    page,
    context,
  }) => {
    // First navigate to app to establish origin, then clear storage
    await context.clearCookies();
    await page.goto('/');
    await clearAllStorageForNewUser(page);

    // Navigate directly to shared quiz URL with encoded data
    await page.goto('/#/quiz/TEST_ENCODED_DATA');
    await page.waitForLoadState('networkidle');

    // Give app time to initialize and potentially redirect
    await page.waitForTimeout(1000);

    // Should be on import screen, NOT welcome screen
    // The import view has a specific heading or element
    const importHeading = page.locator('h1');
    await expect(importHeading).toContainText(/import|shared|quiz/i, { timeout: 5000 });

    // Welcome screen should NOT be visible
    const welcomeTitle = page.getByTestId('welcome-title');
    await expect(welcomeTitle).not.toBeVisible();
  });

  test('new user accessing app directly (no shared link) should still see onboarding', async ({
    page,
    context,
  }) => {
    // First navigate to app to establish origin, then clear storage
    await context.clearCookies();
    await page.goto('/');
    await clearAllStorageForNewUser(page);

    // Navigate to app root (NOT a shared quiz link)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Give app time to initialize
    await page.waitForTimeout(1000);

    // New users should see the welcome/onboarding screen
    const welcomeTitle = page.getByTestId('welcome-title');
    await expect(welcomeTitle).toBeVisible({ timeout: 5000 });
  });

  test('existing user with shared quiz link should go directly to import screen', async ({
    page,
  }) => {
    // First, set up as an existing user (has completed onboarding)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Mark onboarding as complete by setting the welcome version
    await page.evaluate(async () => {
      const dbName = 'quizmaster';
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = (event) => {
          // @ts-ignore
          const db = event.target.result;
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
        };

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['settings'], 'readwrite');
          const store = transaction.objectStore('settings');

          // Mark welcome as seen with high version number
          store.put({
            key: 'welcomeScreenVersion',
            value: '999.0.0',
          });

          transaction.oncomplete = () => {
            db.close();
            resolve(undefined);
          };
          transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
      });
    });

    // Now navigate to shared quiz link
    await page.goto('/#/quiz/TEST_ENCODED_DATA');
    await page.waitForLoadState('networkidle');

    // Should be on import screen
    const importHeading = page.locator('h1');
    await expect(importHeading).toContainText(/import|shared|quiz/i, { timeout: 5000 });
  });

  test('party join links should still work (regression test for #128)', async ({
    page,
    context,
  }) => {
    // First navigate to app to establish origin, then clear storage
    await context.clearCookies();
    await page.goto('/');
    await clearAllStorageForNewUser(page);

    // Navigate directly to party join URL with a room code
    await page.goto('/#/party/join/TEST123');
    await page.waitForLoadState('networkidle');

    // Give app time to initialize and potentially redirect
    await page.waitForTimeout(1000);

    // Should be on join party screen, NOT welcome screen
    const roomCodeInput = page.getByTestId('room-code-input');
    await expect(roomCodeInput).toBeVisible({ timeout: 5000 });

    // Welcome screen should NOT be visible
    const welcomeTitle = page.getByTestId('welcome-title');
    await expect(welcomeTitle).not.toBeVisible();
  });
});
