import { test, expect } from '@playwright/test';

/**
 * Navigate to history page with basic setup
 */
async function navigateToHistory(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.goto('/#/history');
  await page.waitForLoadState('networkidle');
}

test.describe('Quiz Deletion Feature', () => {
  test('should display delete button on quiz cards', async ({ page }) => {
    await navigateToHistory(page);

    // Wait for history page to load
    await expect(page.getByTestId('topics-title')).toBeVisible();

    // Check for at least one quiz item (sample quizzes should be available)
    const quizItems = page.locator('.quiz-item');
    await expect(quizItems.first()).toBeVisible();

    // Check for delete button on the first quiz
    const deleteBtn = quizItems.first().locator('.delete-quiz-btn');
    await expect(deleteBtn).toBeVisible();
  });

  test('should show confirmation modal when clicking delete button', async ({ page }) => {
    await navigateToHistory(page);

    // Wait for quiz items to load
    const quizItems = page.locator('.quiz-item');
    await expect(quizItems.first()).toBeVisible();

    // Click delete button on first quiz
    await quizItems.first().locator('.delete-quiz-btn').click();

    // Check modal is visible
    await expect(page.getByTestId('delete-quiz-modal')).toBeVisible();
    await expect(page.getByText('Delete this quiz?')).toBeVisible();

    // Check for cancel and confirm buttons
    await expect(page.locator('#cancelDeleteQuizBtn')).toBeVisible();
    await expect(page.getByTestId('confirm-delete-btn')).toBeVisible();
  });

  test('should close modal when clicking cancel', async ({ page }) => {
    await navigateToHistory(page);

    // Wait for quiz items to load
    const quizItems = page.locator('.quiz-item');
    await expect(quizItems.first()).toBeVisible();

    // Open modal
    await quizItems.first().locator('.delete-quiz-btn').click();
    await expect(page.getByTestId('delete-quiz-modal')).toBeVisible();

    // Click cancel
    await page.locator('#cancelDeleteQuizBtn').click();

    // Modal should be closed
    await expect(page.getByTestId('delete-quiz-modal')).not.toBeVisible();

    // History page should still be visible
    await expect(page.getByTestId('topics-title')).toBeVisible();
  });

  test('should close modal when clicking backdrop', async ({ page }) => {
    await navigateToHistory(page);

    // Wait for quiz items to load
    const quizItems = page.locator('.quiz-item');
    await expect(quizItems.first()).toBeVisible();

    // Open modal
    await quizItems.first().locator('.delete-quiz-btn').click();
    await expect(page.getByTestId('delete-quiz-modal')).toBeVisible();

    // Click backdrop (outside the modal content)
    await page.locator('#deleteQuizModal').click({ position: { x: 10, y: 10 } });

    // Modal should be closed
    await expect(page.getByTestId('delete-quiz-modal')).not.toBeVisible();
  });

  test('should close modal when pressing Escape key', async ({ page }) => {
    await navigateToHistory(page);

    // Wait for quiz items to load
    const quizItems = page.locator('.quiz-item');
    await expect(quizItems.first()).toBeVisible();

    // Open modal
    await quizItems.first().locator('.delete-quiz-btn').click();
    await expect(page.getByTestId('delete-quiz-modal')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Modal should be closed
    await expect(page.getByTestId('delete-quiz-modal')).not.toBeVisible();
  });

  test('should delete quiz and show success toast when confirming', async ({ page }) => {
    await navigateToHistory(page);

    // Wait for quiz items to load
    const quizItems = page.locator('.quiz-item');
    await expect(quizItems.first()).toBeVisible();

    // Get initial quiz count
    const initialCount = await quizItems.count();
    expect(initialCount).toBeGreaterThan(0);

    // Open modal and confirm deletion
    await quizItems.first().locator('.delete-quiz-btn').click();
    await expect(page.getByTestId('delete-quiz-modal')).toBeVisible();
    await page.getByTestId('confirm-delete-btn').click();

    // Modal should close
    await expect(page.getByTestId('delete-quiz-modal')).not.toBeVisible({ timeout: 5000 });

    // Check for success toast
    await expect(page.locator('.fixed.bottom-24').filter({ hasText: /deleted|apagado/i })).toBeVisible();

    // Quiz count should be reduced by 1
    await expect(quizItems).toHaveCount(initialCount - 1);
  });

  test('delete button should not trigger quiz replay', async ({ page }) => {
    await navigateToHistory(page);

    // Wait for quiz items to load
    const quizItems = page.locator('.quiz-item');
    await expect(quizItems.first()).toBeVisible();

    // Click delete button
    await quizItems.first().locator('.delete-quiz-btn').click();

    // Modal should open (not navigate to quiz)
    await expect(page.getByTestId('delete-quiz-modal')).toBeVisible();

    // Should still be on history page
    expect(page.url()).toContain('#/history');
  });
});
