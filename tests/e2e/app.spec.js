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