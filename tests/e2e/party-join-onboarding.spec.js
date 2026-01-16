// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Tests for Issue #128: Party join links redirect new users to onboarding instead of join screen
 *
 * When a new user clicks a party join link (e.g., /app/#/party/join/5MD343), they should
 * go directly to the Join Party screen, NOT the onboarding/welcome screen.
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

test.describe('Party Join - Onboarding Bypass (Issue #128)', () => {
  test('new user with party join link should bypass onboarding and see join screen', async ({
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
    // The join party view has a room-code-input
    const roomCodeInput = page.getByTestId('room-code-input');
    await expect(roomCodeInput).toBeVisible({ timeout: 5000 });

    // Welcome screen should NOT be visible
    const welcomeTitle = page.getByTestId('welcome-title');
    await expect(welcomeTitle).not.toBeVisible();

    // Room code should be pre-filled from the URL
    await expect(roomCodeInput).toHaveValue('TEST123');
  });

  test('new user with party join link should see Join Party header', async ({
    page,
    context,
  }) => {
    // First navigate to app to establish origin, then clear storage
    await context.clearCookies();
    await page.goto('/');
    await clearAllStorageForNewUser(page);

    // Navigate directly to party join URL
    await page.goto('/#/party/join/ABC789');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Should see "Join Party" in the header (the h1 in JoinPartyView)
    const header = page.locator('h1');
    await expect(header).toContainText(/join/i, { timeout: 5000 });
  });

  test('new user accessing app directly (no party link) should still see onboarding', async ({
    page,
    context,
  }) => {
    // First navigate to app to establish origin, then clear storage
    await context.clearCookies();
    await page.goto('/');
    await clearAllStorageForNewUser(page);

    // Navigate to app root (NOT a party join link)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Give app time to initialize
    await page.waitForTimeout(1000);

    // New users should see the welcome/onboarding screen
    const welcomeTitle = page.getByTestId('welcome-title');
    await expect(welcomeTitle).toBeVisible({ timeout: 5000 });
  });

  test('existing user with party join link should go directly to join screen', async ({
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
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
      });
    });

    // Now navigate to party join link
    await page.goto('/#/party/join/XYZ456');
    await page.waitForLoadState('networkidle');

    // Should be on join party screen
    const roomCodeInput = page.getByTestId('room-code-input');
    await expect(roomCodeInput).toBeVisible({ timeout: 5000 });

    // Room code should be pre-filled
    await expect(roomCodeInput).toHaveValue('XYZ456');
  });

  test('only /party/join/ routes bypass onboarding (other party routes do not)', async ({
    page,
    context,
  }) => {
    // First navigate to app to establish origin, then clear storage
    await context.clearCookies();
    await page.goto('/');
    await clearAllStorageForNewUser(page);

    // Navigate to party/create (not a join link - should NOT bypass onboarding)
    await page.goto('/#/party/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // New user going to /party/create should see onboarding
    // (because only /party/join/:code should bypass)
    const welcomeTitle = page.getByTestId('welcome-title');
    await expect(welcomeTitle).toBeVisible({ timeout: 5000 });
  });
});
