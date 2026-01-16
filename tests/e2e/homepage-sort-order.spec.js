/**
 * E2E tests for homepage quiz sort order
 * Issue #140: Homepage quizzes not sorted by date
 */
import { test, expect } from '@playwright/test';
import { setupAuthenticatedState, clearSessions } from './helpers.js';

test.describe('Homepage quiz sort order', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedState(page);
    await clearSessions(page);
  });

  test('displays quizzes sorted by most recent first', async ({ page }) => {
    const now = Date.now();

    // Seed database with sessions having different timestamps
    await page.evaluate((data) => {
      const dbName = 'quizmaster';
      const request = indexedDB.open(dbName);
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sessions'], 'readwrite');
          const store = transaction.objectStore('sessions');

          // Add sessions with different timestamps
          store.add({
            topic: 'Old Quiz',
            timestamp: data.now - 86400000 * 7, // 7 days ago
            totalQuestions: 5,
            score: 3,
            questions: []
          });
          store.add({
            topic: 'Today Quiz',
            timestamp: data.now,
            totalQuestions: 5,
            score: 4,
            questions: []
          });
          store.add({
            topic: 'Yesterday Quiz',
            timestamp: data.now - 86400000, // 1 day ago
            totalQuestions: 5,
            score: 5,
            questions: []
          });

          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
        };
      });
    }, { now });

    // Reload to show seeded data
    await page.reload();
    await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });

    // Get quiz topics in order
    const quizItems = page.locator('#recentTopicsList .quiz-item');
    await expect(quizItems).toHaveCount(3);

    // Verify sort order (newest first)
    await expect(quizItems.nth(0)).toContainText('Today Quiz');
    await expect(quizItems.nth(1)).toContainText('Yesterday Quiz');
    await expect(quizItems.nth(2)).toContainText('Old Quiz');
  });

  test('sorts imported quizzes (string timestamps) correctly with played quizzes', async ({ page }) => {
    const now = Date.now();
    const lastWeekISO = new Date(now - 86400000 * 7).toISOString();

    // Seed database with mixed timestamp types
    await page.evaluate((data) => {
      const dbName = 'quizmaster';
      const request = indexedDB.open(dbName);
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sessions'], 'readwrite');
          const store = transaction.objectStore('sessions');

          // Imported quiz with STRING timestamp (legacy/bug scenario)
          store.add({
            topic: 'Imported Last Week',
            timestamp: data.lastWeekISO, // String timestamp (ISO)
            totalQuestions: 5,
            score: 0,
            isImported: true,
            questions: []
          });

          // Played quiz with NUMBER timestamp (normal scenario)
          store.add({
            topic: 'Played Today',
            timestamp: data.now, // Number timestamp
            totalQuestions: 5,
            score: 5,
            questions: []
          });

          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
        };
      });
    }, { now, lastWeekISO });

    // Reload to show seeded data
    await page.reload();
    await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });

    // Get quiz topics in order
    const quizItems = page.locator('#recentTopicsList .quiz-item');
    await expect(quizItems).toHaveCount(2);

    // Verify sort order: newer quiz (today) should be first, even though
    // the older imported quiz has a string timestamp
    await expect(quizItems.nth(0)).toContainText('Played Today');
    await expect(quizItems.nth(1)).toContainText('Imported Last Week');
  });

  test('handles sessions with zero/null timestamps at the end', async ({ page }) => {
    const now = Date.now();

    // Seed database with a zero timestamp (sample quiz scenario)
    await page.evaluate((data) => {
      const dbName = 'quizmaster';
      const request = indexedDB.open(dbName);
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sessions'], 'readwrite');
          const store = transaction.objectStore('sessions');

          // Session with zero timestamp (unplayed sample)
          store.add({
            topic: 'Sample Quiz',
            timestamp: 0,
            totalQuestions: 5,
            score: 0,
            isSample: true,
            questions: []
          });

          // Session with recent timestamp
          store.add({
            topic: 'Recent Quiz',
            timestamp: data.now,
            totalQuestions: 5,
            score: 4,
            questions: []
          });

          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
        };
      });
    }, { now });

    // Reload to show seeded data
    await page.reload();
    await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });

    // Get quiz topics in order
    const quizItems = page.locator('#recentTopicsList .quiz-item');
    await expect(quizItems).toHaveCount(2);

    // Recent quiz should be first, zero-timestamp sample should be last
    await expect(quizItems.nth(0)).toContainText('Recent Quiz');
    await expect(quizItems.nth(1)).toContainText('Sample Quiz');
  });
});
