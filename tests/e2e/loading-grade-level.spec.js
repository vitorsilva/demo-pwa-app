import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './helpers.js';

test.describe('Loading screen grade level translation', () => {
  /**
   * Helper to set language via i18nextLng localStorage key.
   * Must be called before page reload to take effect.
   */
  async function setLanguage(page, language) {
    await page.evaluate((lang) => {
      // i18n module uses 'i18nextLng' key in localStorage
      localStorage.setItem('i18nextLng', lang);
    }, language);
  }

  test('Portuguese: shows "Nível Ensino Básico" for middle school', async ({ page }) => {
    await setupAuthenticatedState(page);
    await setLanguage(page, 'pt-PT');
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Test topic');
    await page.selectOption('#gradeLevelSelect', 'middle school');
    await page.click('#generateBtn');

    // Should be on loading page
    await expect(page).toHaveURL(/#\/loading/);

    // Should show translated grade level, NOT raw English value
    // Bug: shows "Nível middle school" instead of "Nível Ensino Básico"
    await expect(page.locator('text=Nível Ensino Básico')).toBeVisible({ timeout: 5000 });
  });

  test('Portuguese: shows "Nível Ensino Secundário" for high school', async ({ page }) => {
    await setupAuthenticatedState(page);
    await setLanguage(page, 'pt-PT');
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Test topic');
    await page.selectOption('#gradeLevelSelect', 'high school');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page.locator('text=Nível Ensino Secundário')).toBeVisible({ timeout: 5000 });
  });

  test('Portuguese: shows "Nível Universidade" for college', async ({ page }) => {
    await setupAuthenticatedState(page);
    await setLanguage(page, 'pt-PT');
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Test topic');
    await page.selectOption('#gradeLevelSelect', 'college');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page.locator('text=Nível Universidade')).toBeVisible({ timeout: 5000 });
  });

  test('Spanish: shows "Nivel Secundaria" for middle school', async ({ page }) => {
    await setupAuthenticatedState(page);
    await setLanguage(page, 'es');
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Test topic');
    await page.selectOption('#gradeLevelSelect', 'middle school');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page.locator('text=Nivel Secundaria')).toBeVisible({ timeout: 5000 });
  });

  test('English: shows "Middle School Level" for middle school', async ({ page }) => {
    await setupAuthenticatedState(page);
    await setLanguage(page, 'en');
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Test topic');
    await page.selectOption('#gradeLevelSelect', 'middle school');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page.locator('text=Middle School Level')).toBeVisible({ timeout: 5000 });
  });

  test('defaults to translated middle school when no level selected', async ({ page }) => {
    await setupAuthenticatedState(page);
    await setLanguage(page, 'pt-PT');
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Test topic');
    // Don't select grade level - should default to middle school
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    // Should show translated default, not "Nível middle school"
    await expect(page.locator('text=Nível Ensino Básico')).toBeVisible({ timeout: 5000 });
  });
});
