import { test, expect } from '@playwright/test';

test('should echo text from input to output', async ({ page }) => {
    await page.goto('/');

    // Type into the input
    await page.fill('#textInput', 'Hello Playwright!');

    // Get the output text
    const outputText = await page.textContent('#textOutput');

    // Assert the output matches
    expect(outputText).toBe('Hello Playwright!');    
});

test('should show placeholder text when input is empty', async ({ page }) => {
    await page.goto('/');

    // Output should show placeholder initially
    const initialText = await page.textContent('#textOutput');
    expect(initialText.trim()).toBe('Your text will appear here...');
  });

 test('should work offline after initial load', async ({ page, context }) => {
    // First, load the page online to let service worker cache everything
    await page.goto('/');

    // Wait a bit for service worker to install and cache files
    await page.waitForTimeout(2000);

    // Now simulate going offline
    await context.setOffline(true);

    // Reload the page (should load from cache)
    await page.reload();

    // Test that app still works offline
    await page.fill('#textInput', 'Works offline!');
    const outputText = await page.textContent('#textOutput');
    expect(outputText.trim()).toBe('Works offline!');
  }); 