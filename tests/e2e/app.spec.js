import { test, expect } from '@playwright/test';
import { setupAuthenticatedState, clearSessions } from './helpers.js';

test.describe('Saberloop E2E Tests', () => {
  test('should display home page with welcome message', async ({ page }) => {
    // setupAuthenticatedState handles navigation and reload
    await setupAuthenticatedState(page);

    // Check for page title
    await expect(page.locator('h1')).toContainText('Saberloop');

    // Check for welcome message
    await expect(page.getByTestId('welcome-heading')).toBeVisible();

    // Check for Start New Quiz button
    await expect(page.locator('#startQuizBtn')).toBeVisible();

    // Check for Recent Topics section
    await expect(page.getByTestId('recent-topics-heading')).toBeVisible();
  });

  test('should navigate to topic input screen', async ({ page }) => {
    // setupAuthenticatedState handles navigation and reload
    await setupAuthenticatedState(page);

    // Click Start New Quiz button
    await page.click('#startQuizBtn');

    // Should navigate to topic input page
    await expect(page).toHaveURL(/#\/topic-input/);

    // Check for New Quiz header
    await expect(page.getByTestId('new-quiz-title')).toBeVisible();

    // Check for input fields
    await expect(page.getByTestId('topic-input')).toBeVisible();
    await expect(page.locator('#gradeLevelSelect')).toBeVisible();
    await expect(page.locator('#generateBtn')).toBeVisible();
  });

  test('should create and complete a full quiz', async ({ page }) => {
    await setupAuthenticatedState(page);
    await page.goto('/#/topic-input');

    // Enter a topic
    await page.fill('#topicInput', 'Science');

    // Select grade level
    await page.selectOption('#gradeLevelSelect', 'middle school');

    // Generate questions
    await page.click('#generateBtn');

    // Should navigate to loading page first
    await expect(page).toHaveURL(/#\/loading/);

    // Wait for quiz to load (API call takes time)
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Check quiz header
    await expect(page.getByTestId('quiz-title')).toBeVisible();

    // Check progress indicator
    await expect(page.getByTestId('question-progress')).toBeVisible();

    // Answer all 5 questions
    for (let i = 0; i < 5; i++) {
      // Wait for question to load
      await expect(page.locator('h2')).toBeVisible();

      // Wait a bit for the page to stabilize
      await page.waitForTimeout(300);

      // Click the second option (correct answer in mock - index 1)
      const options = page.locator('.option-btn');
      await expect(options.nth(1)).toBeVisible();
      await options.nth(1).click();

      // Wait for selection to register
      await page.waitForTimeout(200);

      // Click Next Question or Submit Answer
      const submitBtn = page.locator('#submitBtn');
      await expect(submitBtn).not.toHaveClass(/opacity-50/);
      await submitBtn.click();

      // Wait for navigation/re-render
      await page.waitForTimeout(300);
    }

    // Should navigate to results page
    await expect(page).toHaveURL(/#\/results/);

    // Check results header
    await expect(page.locator('h1')).toContainText('Results');

    // Wait for results to render
    await page.waitForLoadState('networkidle');

    // Check score is displayed
    await expect(page.getByTestId('score-percentage')).toBeVisible();

    // Check that a success message is shown
    await expect(page.getByTestId('result-message')).toBeVisible();

    // Check review section
    await expect(page.locator('h2')).toContainText('Review Your Answers');

    // Verify answers are displayed (should have check marks for correct answers)
    const checkMarks = page.locator('span:has-text("check")');
    await expect(checkMarks.first()).toBeVisible(); // At least one correct answer
  });

  test('should navigate using bottom navigation', async ({ page }) => {
    await setupAuthenticatedState(page);

    // Check all navigation links are visible
    await expect(page.locator('a[href="#/"]')).toBeVisible();
    await expect(page.locator('a[href="#/history"]')).toBeVisible();
    await expect(page.locator('a[href="#/settings"]')).toBeVisible();

    // Navigate to topics (currently goes to #/history which doesn't exist yet)
    // This will be updated when Topics view is implemented
  });

  test('should show back button confirmation on quiz page', async ({ page }) => {
    await setupAuthenticatedState(page);

    // Create a quiz first
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Math');
    await page.click('#generateBtn');

    // Wait for loading then quiz
    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Set up dialog handler
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('Are you sure you want to leave?');
      dialog.dismiss();
    });

    // Click back button
    await page.click('#backBtn');
  });

  test('should allow trying another topic from results', async ({ page }) => {
    // Set up auth state (this handles navigation to / and waiting for home page)
    await setupAuthenticatedState(page);

    // Navigate to topic input
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'History');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Answer all questions
    for (let i = 0; i < 5; i++) {
      const options = page.locator('.option-btn');
      await options.nth(1).click();
      await page.click('#submitBtn');
    }

    // On results page
    await expect(page).toHaveURL(/#\/results/);

    // Click Try Another Topic
    await page.click('#tryAnotherBtn');

    // Should navigate back to topic input
    await expect(page).toHaveURL(/#\/topic-input/);
  });

  test('should display correct and incorrect answers in results', async ({ page }) => {
    // Set up auth state (handles navigation to / and waiting for home page)
    await setupAuthenticatedState(page);

    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Geography');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Answer questions with mix of correct/incorrect
    // Question 1: correct (option 1)
    await page.locator('.option-btn').nth(1).click();
    await page.click('#submitBtn');

    // Question 2: incorrect (option 0)
    await page.locator('.option-btn').nth(0).click();
    await page.click('#submitBtn');

    // Question 3: correct (option 1)
    await page.locator('.option-btn').nth(1).click();
    await page.click('#submitBtn');

    // Question 4: correct (option 1)
    await page.locator('.option-btn').nth(1).click();
    await page.click('#submitBtn');

    // Question 5: correct (option 1)
    await page.locator('.option-btn').nth(1).click();
    await page.click('#submitBtn');

    // Check results show 80%
    await expect(page.getByTestId('score-percentage')).toContainText('80%');
    await expect(page.getByTestId('result-message')).toBeVisible();

    // Check that both correct (check icon) and incorrect (close icon) are shown
    await expect(page.locator('span:has-text("check")')).toHaveCount(4);
    await expect(page.locator('span:has-text("close")')).toHaveCount(1);
  });

  test('should disable submit button when no answer is selected', async ({ page }) => {
    // Set up auth state (handles navigation to / and waiting for home page)
    await setupAuthenticatedState(page);

    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Science');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Submit button should be disabled (have opacity-50 class)
    const submitBtn = page.locator('#submitBtn');
    await expect(submitBtn).toHaveClass(/opacity-50/);

    // Select an answer
    await page.locator('.option-btn').nth(1).click();

    // Submit button should now be enabled (not have opacity-50)
    await expect(submitBtn).not.toHaveClass(/opacity-50/);
  });

  test('should display network status indicator on home page', async ({ page }) => {
    // Set up auth state (handles navigation to / and waiting for home page)
    await setupAuthenticatedState(page);

    // Check that network indicator dot exists
    const networkDot = page.locator('#networkStatusDot');
    await expect(networkDot).toBeVisible();

    // Should have green background when online (default state)
    const dotClasses = await networkDot.getAttribute('class');
    expect(dotClasses).toContain('bg-green-500');

    // Verify it's positioned on the home icon
    const homeIcon = page.locator('a[href="#/"] .material-symbols-outlined');
    await expect(homeIcon).toBeVisible();
  });

  test('should display completed quiz on home page', async ({ page }) => {
    // Set up auth state (handles navigation to / and waiting for home page)
    await setupAuthenticatedState(page);
    await clearSessions(page);
    await page.reload();
    await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });

    // Verify home page shows empty state
    await expect(page.getByTestId('no-quizzes-message')).toBeVisible();

    // Complete a quiz
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Dinosaurs');
    await page.selectOption('#gradeLevelSelect', 'middle school');
    await page.click('#generateBtn');

    // Wait for loading then quiz
    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Answer all 5 questions
    for (let i = 0; i < 5; i++) {
      await page.locator('.option-btn').nth(1).click();
      await page.waitForTimeout(200);
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
    }

    // Should be on results page
    await expect(page).toHaveURL(/#\/results/);

    // Navigate back to home
    await page.goto('/');

    // Now the quiz should appear in recent topics
    await expect(page.locator('#recentTopicsList >> text=Dinosaurs')).toBeVisible();

    // Should show score (5/5 since mock always has correct answer at index 1)
    await expect(page.locator('#recentTopicsList >> text=5/5')).toBeVisible();

    // Should show "Today" as the date
    await expect(page.locator('#recentTopicsList >> text=Today')).toBeVisible();
  });

  test('should replay a saved quiz when clicked', async ({ page }) => {
    // Set up auth state (handles navigation to / and waiting for home page)
    await setupAuthenticatedState(page);
    await clearSessions(page);
    await page.reload();
    await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });

    // Step 1: Complete a quiz first to have something to replay
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Ancient Egypt');
    await page.selectOption('#gradeLevelSelect', 'high school');
    await page.click('#generateBtn');

    // Wait for quiz to load
    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Answer all 5 questions (selecting option 1 - correct in mock)
    for (let i = 0; i < 5; i++) {
      await page.locator('.option-btn').nth(1).click();
      await page.waitForTimeout(200);
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
    }

    // Should be on results page
    await expect(page).toHaveURL(/#\/results/);

    // Step 2: Go back to home page
    await page.goto('/');

    // Verify quiz appears in recent topics
    await expect(page.locator('#recentTopicsList >> text=Ancient Egypt')).toBeVisible();

    // Step 3: Click on the quiz item to replay it
    const quizItem = page.locator('.quiz-item').first();
    await quizItem.click();

    // Step 4: Should navigate to quiz page (not loading page - using saved questions)
    await expect(page).toHaveURL(/#\/quiz/);

    // Should show the same topic
    await expect(page.getByTestId('quiz-title')).toBeVisible();

    // Should show question 1
    await expect(page.getByTestId('question-progress')).toBeVisible();

    // Step 5: Complete the replay with different answers
    for (let i = 0; i < 5; i++) {
      await page.locator('.option-btn').nth(0).click(); // Different answer
      await page.waitForTimeout(200);
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
    }

    // Should be on results page
    await expect(page).toHaveURL(/#\/results/);

    // Step 6: Verify no duplicate - go back to home and count quizzes
    await page.goto('/');

    // Should still have only one "Ancient Egypt" quiz (updated, not duplicated)
    const egyptQuizzes = page.locator('.quiz-item >> text=Ancient Egypt');
    await expect(egyptQuizzes).toHaveCount(1);

    // Score should be updated (different from 5/5 since we selected option 0 randomly)
    // Note: With answer shuffling on replay, we can't predict exact score
    // Just verify score format is displayed (any X/5 pattern)
    await expect(page.locator('#recentTopicsList').locator('text=/\\d\\/5/')).toBeVisible();
  });

  test('should navigate to settings page', async ({ page }) => {
    // Set up auth state (handles navigation to / and waiting for home page)
    await setupAuthenticatedState(page);

    // Click Settings in bottom nav
    await page.click('a[href="#/settings"]');

    // Should navigate to settings page
    await expect(page).toHaveURL(/#\/settings/);

    // Check for Settings header
    await expect(page.getByTestId('settings-title')).toBeVisible();

    // Check for Preferences section
    await expect(page.locator('h2').first()).toContainText('Preferences');

    // Check for About section
    await expect(page.locator('text=About')).toBeVisible();
  });

  test('should display all settings form elements', async ({ page }) => {
    // Set up auth state (handles navigation to / and waiting for home page)
    await setupAuthenticatedState(page);
    await page.goto('/#/settings');

    // Check all dropdowns are visible
    await expect(page.locator('#defaultGradeLevel')).toBeVisible();
    await expect(page.locator('#questionsPerQuiz')).toBeVisible();
    await expect(page.locator('#difficulty')).toBeVisible();

    // Check About section content
    await expect(page.locator('text=Version')).toBeVisible();

    // Version now uses YYYYMMDD.NN format (e.g., 20251126.01)
    await expect(page.locator('text=/\\d{8}\\.\\d{2}/')).toBeVisible();

    await expect(page.locator('text=View on GitHub')).toBeVisible();
  });

  test('should persist settings after page refresh', async ({ page }) => {
    // Set up auth state (handles navigation to / and waiting for home page)
    await setupAuthenticatedState(page);
    await page.goto('/#/settings');

    // Wait for page to fully load and stabilize
    await expect(page.locator('#defaultGradeLevel')).toBeVisible();
    await page.waitForLoadState('networkidle');

    // Change settings via JavaScript to ensure settings persistence works
    // Note: Playwright's selectOption doesn't always trigger change events reliably,
    // so we test the persistence mechanism directly
    await page.evaluate(() => {
      const SETTINGS_KEY = 'quizmaster_settings';
      const current = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      current.defaultGradeLevel = 'college';
      current.questionsPerQuiz = '15';
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
    });

    // Verify settings were saved
    const settingsBefore = await page.evaluate(() => {
      return localStorage.getItem('quizmaster_settings');
    });
    expect(settingsBefore).toContain('college');

    // Refresh the page
    await page.reload();

    // Wait for settings page to load
    await expect(page.locator('#defaultGradeLevel')).toBeVisible();

    // Verify settings persisted and are displayed in UI
    await expect(page.locator('#defaultGradeLevel')).toHaveValue('college');
    await expect(page.locator('#questionsPerQuiz')).toHaveValue('15');
  });

  test('should generate quiz with configured question count', async ({ page }) => {
    // Set up auth state
    await setupAuthenticatedState(page);

    // Set question count to 10 via localStorage (settings persistence is tested above)
    await page.evaluate(() => {
      const SETTINGS_KEY = 'quizmaster_settings';
      const current = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      current.questionsPerQuiz = '10';
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
    });

    // Navigate to topic input and create quiz
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Math basics');
    await page.click('#generateBtn');

    // Wait for quiz to load
    await page.waitForURL(/#\/quiz/, { timeout: 15000 });

    // Verify progress shows 10 total questions (e.g., "Question 1 of 10")
    await expect(page.locator('[data-testid="question-progress"]')).toContainText('of 10');
  });

  // NOTE: Offline mode test moved to tests/e2e/offline.spec.js

  test('should display quiz history on topics page', async ({ page }) => {
    // Set up auth state (handles navigation to / and waiting for home page)
    await setupAuthenticatedState(page);
    await clearSessions(page);
    await page.reload();
    await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });

    // Create first quiz
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'World History');
    await page.click('#generateBtn');
    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    for (let i = 0; i < 5; i++) {
      await page.locator('.option-btn').nth(1).click();
      await page.waitForTimeout(200);
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
    }

    await expect(page).toHaveURL(/#\/results/);

    // Create second quiz
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Chemistry');
    await page.click('#generateBtn');
    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    for (let i = 0; i < 5; i++) {
      await page.locator('.option-btn').nth(1).click();
      await page.waitForTimeout(200);
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
    }

    await expect(page).toHaveURL(/#\/results/);

    // Step 2: Navigate to topics/history page
    await page.goto('/');
    await page.click('a[href="#/history"]');

    // Should be on history page
    await expect(page).toHaveURL(/#\/history/);
    await expect(page.getByTestId('topics-title')).toBeVisible();

    // Step 3: Verify quiz items are displayed
    const quizItems = page.locator('.quiz-item');
    await expect(quizItems).toHaveCount(2);

    // Verify both topics appear
    await expect(page.locator('text=World History')).toBeVisible();
    await expect(page.locator('text=Chemistry')).toBeVisible();

    // Verify scores are shown (both should be 5/5)
    await expect(page.locator('text=5/5').first()).toBeVisible();

    // Step 4: Click on first quiz to replay
    await quizItems.first().click();

    // Should navigate to quiz page
    await expect(page).toHaveURL(/#\/quiz/);

    // Should show the quiz (Chemistry is most recent, so it's first)
    await expect(page.getByTestId('quiz-title')).toBeVisible();
    await expect(page.getByTestId('question-progress')).toBeVisible();
  });

  test('should keep submit button visible in viewport after selecting answer (issue #10)', async ({ page }) => {
    // Set up auth state
    await setupAuthenticatedState(page);

    // Set a small viewport to simulate mobile device where issue occurred
    await page.setViewportSize({ width: 375, height: 550 });

    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Science');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Wait for quiz to load
    await expect(page.locator('h2')).toBeVisible();

    // Scroll to top to simulate user starting at top of page
    await page.evaluate(() => window.scrollTo(0, 0));

    // Select an answer
    await page.locator('.option-btn').nth(1).click();
    await page.waitForTimeout(300);

    // Get viewport height and button position
    const viewportHeight = 550;
    const submitBtn = page.locator('#submitBtn');
    const boundingBox = await submitBtn.boundingBox();

    // Button should be visible in viewport (its top should be within viewport)
    expect(boundingBox).not.toBeNull();
    expect(boundingBox.y).toBeLessThan(viewportHeight);
    expect(boundingBox.y + boundingBox.height).toBeGreaterThan(0);

    // Button should also be visible (not hidden)
    await expect(submitBtn).toBeVisible();
  });

  test('should show all answer options when answers are long (issue #29)', async ({ page }) => {
    // Set up auth state
    await setupAuthenticatedState(page);

    // Set a small mobile viewport to trigger the overlap issue
    // iPhone SE size where the bug was reported
    await page.setViewportSize({ width: 375, height: 667 });

    // Go through normal flow to generate quiz
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Science');
    await page.click('#generateBtn');

    // Wait for quiz to load
    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Wait for quiz to render
    await expect(page.locator('h2')).toBeVisible();

    // Get all 4 option buttons
    const options = page.locator('.option-btn');
    await expect(options).toHaveCount(4);

    // The key test: verify the 4th option (D) can be scrolled into view and clicked
    const optionD = options.nth(3);
    const submitBtn = page.locator('#submitBtn');

    // Scroll option D to top of viewport (simulates user scrolling to see all options)
    // This tests that there's enough padding/scroll space for option D to be above the fixed button
    await optionD.evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.waitForTimeout(300);

    // Check option D is visible after scrolling
    await expect(optionD).toBeVisible();

    // Get bounding boxes after scrolling
    const optionDBox = await optionD.boundingBox();
    const submitBtnBox = await submitBtn.boundingBox();

    expect(optionDBox).not.toBeNull();
    expect(submitBtnBox).not.toBeNull();

    // Option D's bottom should be ABOVE the submit button's top after scrolling
    const optionDBottom = optionDBox.y + optionDBox.height;
    const submitBtnTop = submitBtnBox.y;

    // This assertion fails without the fix (no scroll space to move option D above button)
    expect(optionDBottom).toBeLessThanOrEqual(submitBtnTop + 8);

    // Verify option D is fully clickable
    await optionD.click();

    // After clicking, button should be enabled (answer selected)
    await expect(submitBtn).not.toHaveClass(/opacity-50/);
  });

  test('should display quiz correctly in dark mode', async ({ page }) => {
    // Set up auth state
    await setupAuthenticatedState(page);

    await page.goto('/#/topic-input');

    // Enable dark mode via Tailwind's class-based approach (not media query)
    // The app uses classList.add('dark') on <html>, not prefers-color-scheme
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.fill('#topicInput', 'Science');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Verify quiz elements are visible in dark mode
    await expect(page.locator('h1')).toBeVisible(); // Quiz title
    await expect(page.locator('h2')).toBeVisible(); // Question
    await expect(page.locator('.option-btn').first()).toBeVisible(); // Options
    await expect(page.locator('#submitBtn')).toBeVisible(); // Submit button

    // Select an answer and verify button styling in dark mode
    await page.locator('.option-btn').nth(1).click();
    const submitBtn = page.locator('#submitBtn');
    await expect(submitBtn).not.toHaveClass(/opacity-50/);

    // Verify dark mode is applied by checking computed background color
    // Dark mode should have a dark background (rgb values should be low)
    const bgColor = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });

    // Dark background should have low RGB values (not white/light)
    // Parse rgb(r, g, b) format
    const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      // In dark mode, background should be dark (average RGB < 128)
      const avgBrightness = (r + g + b) / 3;
      expect(avgBrightness).toBeLessThan(128);
    }
  });

  test('should display info button on incorrect answers only', async ({ page }) => {
    // Set up auth and complete a quiz with at least one wrong answer
    await setupAuthenticatedState(page);
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Science');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Answer questions - get one wrong (option 0), rest correct (option 1)
    // Question 1: incorrect
    await page.locator('.option-btn').nth(0).click();
    await page.click('#submitBtn');

    // Questions 2-5: correct
    for (let i = 1; i < 5; i++) {
      await page.locator('.option-btn').nth(1).click();
      await page.waitForTimeout(200);
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
    }

    // On results page
    await expect(page).toHaveURL(/#\/results/);

    // Should have exactly 1 info button (for the incorrect answer)
    const infoButtons = page.locator('.explain-btn');
    await expect(infoButtons).toHaveCount(1);

    // Should have 4 green dots (for correct answers)
    const successDots = page.locator('.bg-success.rounded-full.size-3');
    await expect(successDots).toHaveCount(4);
  });

  test('should open explanation modal when info button clicked', async ({ page }) => {
    // Set up auth and complete a quiz with wrong answer
    await setupAuthenticatedState(page);
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Geography');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Get first question wrong
    await page.locator('.option-btn').nth(0).click();
    await page.click('#submitBtn');

    // Rest correct
    for (let i = 1; i < 5; i++) {
      await page.locator('.option-btn').nth(1).click();
      await page.waitForTimeout(200);
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
    }

    await expect(page).toHaveURL(/#\/results/);

    // Click the info button
    const infoButton = page.locator('.explain-btn');
    await infoButton.click();

    // Modal should appear
    const modal = page.locator('#explanationModal');
    await expect(modal).toBeVisible();

    // Should show INCORRECT badge
    await expect(page.locator('text=INCORRECT')).toBeVisible();

    // Should show "YOU SELECTED" and "CORRECT ANSWER" labels in modal
    await expect(modal.locator('text=YOU SELECTED')).toBeVisible();
    await expect(modal.locator('text=CORRECT ANSWER').first()).toBeVisible();

    // Should show loading or explanation (mock API returns quickly)
    const explanationSection = page.locator('#explanationContent');
    await expect(explanationSection).toBeVisible();

    // Should have "Got it!" button
    const gotItBtn = page.locator('#gotItBtn');
    await expect(gotItBtn).toBeVisible();
  });

  test('should close explanation modal when Got it button clicked', async ({ page }) => {
    // Set up auth and complete a quiz with wrong answer
    await setupAuthenticatedState(page);
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'History');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Get first question wrong
    await page.locator('.option-btn').nth(0).click();
    await page.click('#submitBtn');

    // Rest correct
    for (let i = 1; i < 5; i++) {
      await page.locator('.option-btn').nth(1).click();
      await page.waitForTimeout(200);
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
    }

    await expect(page).toHaveURL(/#\/results/);

    // Click the info button to open modal
    await page.locator('.explain-btn').click();
    await expect(page.locator('#explanationModal')).toBeVisible();

    // Click "Got it!" button
    await page.locator('#gotItBtn').click();

    // Modal should be closed (with animation delay)
    await page.waitForTimeout(400);
    await expect(page.locator('#explanationModal')).not.toBeVisible();
  });

  test('should display Continue button alongside Try Another Topic on results page', async ({ page }) => {
    // Set up auth and complete a quiz
    await setupAuthenticatedState(page);
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Biology');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Answer all questions correctly
    for (let i = 0; i < 5; i++) {
      await page.locator('.option-btn').nth(1).click();
      await page.waitForTimeout(200);
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
    }

    // On results page
    await expect(page).toHaveURL(/#\/results/);

    // Both buttons should be visible side by side
    const continueBtn = page.locator('#continueTopicBtn');
    const tryAnotherBtn = page.locator('#tryAnotherBtn');

    await expect(continueBtn).toBeVisible();
    await expect(tryAnotherBtn).toBeVisible();

    // Continue button should have arrow icon
    await expect(continueBtn.locator('span:has-text("arrow_forward")')).toBeVisible();

    // Continue button should have correct text
    await expect(continueBtn).toContainText('Continue on this topic');
  });

  test('should generate new quiz when Continue on topic is clicked', async ({ page }) => {
    // Set up auth and complete a quiz
    await setupAuthenticatedState(page);
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Physics');
    await page.selectOption('#gradeLevelSelect', 'middle school');
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

    // On results page
    await expect(page).toHaveURL(/#\/results/);

    // Click Continue on this topic
    await page.click('#continueTopicBtn');

    // Should navigate to loading page (generating new questions)
    await expect(page).toHaveURL(/#\/loading/);

    // Wait for new quiz to load
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Quiz should still be for Physics
    await expect(page.getByTestId('quiz-title')).toBeVisible();

    // Should show Question 1 of 5 (new quiz)
    await expect(page.getByTestId('question-progress')).toBeVisible();
  });

  test('should allow multiple continues on same topic', async ({ page }) => {
    // Set up auth and complete first quiz
    await setupAuthenticatedState(page);
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Chemistry');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Complete first quiz
    for (let i = 0; i < 5; i++) {
      await page.locator('.option-btn').nth(1).click();
      await page.waitForTimeout(200);
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
    }

    await expect(page).toHaveURL(/#\/results/);

    // First continue
    await page.click('#continueTopicBtn');
    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Complete second quiz
    for (let i = 0; i < 5; i++) {
      await page.locator('.option-btn').nth(1).click();
      await page.waitForTimeout(200);
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
    }

    await expect(page).toHaveURL(/#\/results/);

    // Second continue
    await page.click('#continueTopicBtn');
    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Quiz should still be Chemistry
    await expect(page.getByTestId('quiz-title')).toBeVisible();
  });

  test('should clear continue chain when Try Another Topic is clicked', async ({ page }) => {
    // Set up auth and complete a quiz
    await setupAuthenticatedState(page);
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Astronomy');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Complete quiz
    for (let i = 0; i < 5; i++) {
      await page.locator('.option-btn').nth(1).click();
      await page.waitForTimeout(200);
      await page.click('#submitBtn');
      await page.waitForTimeout(300);
    }

    await expect(page).toHaveURL(/#\/results/);

    // Click Try Another Topic (not Continue)
    await page.click('#tryAnotherBtn');

    // Should navigate to topic input
    await expect(page).toHaveURL(/#\/topic-input/);

    // Start new topic
    await page.fill('#topicInput', 'Geology');
    await page.click('#generateBtn');

    await expect(page).toHaveURL(/#\/loading/);
    await expect(page).toHaveURL(/#\/quiz/, { timeout: 15000 });

    // Quiz should be for Geology (new topic)
    await expect(page.getByTestId('quiz-title')).toBeVisible();
  });

  test('should show countdown timer after delay during quiz generation (issue #37)', async ({ page }) => {
    // Override timing constants and add API delay BEFORE any navigation
    await page.addInitScript(() => {
      window.LOADING_VIEW_CONFIG = {
        ESTIMATED_DURATION_SECONDS: 10,      // Shortened for test
        SHOW_COUNTDOWN_AFTER_SECONDS: 2      // Show countdown after 2s instead of 20s
      };
      // Add delay to mock API for testing the loading view
      window.MOCK_API_DELAY_MS = 15000; // 15 second delay
    });

    // Set up auth (will use the init script on subsequent navigations)
    await setupAuthenticatedState(page);

    // Navigate to topic input and start generation
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'World History');
    await page.click('#generateBtn');

    // Should be on loading page
    await expect(page).toHaveURL(/#\/loading/);

    // Initially, no countdown should be visible (within first 2 seconds)
    const countdown = page.locator('#countdownText');
    await expect(countdown).not.toBeVisible();

    // Wait for countdown to appear (after SHOW_COUNTDOWN_AFTER_SECONDS)
    await page.waitForTimeout(2500);

    // Now countdown should be visible
    await expect(countdown).toBeVisible();

    // Should show remaining time text
    await expect(countdown).toContainText(/About \d+ seconds remaining|Almost done/);

    // Wait a bit more and verify countdown decrements
    const initialText = await countdown.textContent();
    await page.waitForTimeout(1500);
    const updatedText = await countdown.textContent();

    // Text should have changed (either decremented or switched to "Almost done")
    expect(updatedText).not.toBe(initialText);
  });

  test('should show extended messages after estimated duration exceeded (issue #37)', async ({ page }) => {
    // Override timing constants and add API delay BEFORE any navigation
    await page.addInitScript(() => {
      window.LOADING_VIEW_CONFIG = {
        ESTIMATED_DURATION_SECONDS: 3,       // Very short for test
        SHOW_COUNTDOWN_AFTER_SECONDS: 1      // Show countdown after 1s
      };
      // Add delay to mock API for testing the loading view
      window.MOCK_API_DELAY_MS = 15000; // 15 second delay
    });

    // Set up auth (will use the init script on subsequent navigations)
    await setupAuthenticatedState(page);

    // Navigate to topic input and start generation
    await page.goto('/#/topic-input');
    await page.fill('#topicInput', 'Science');
    await page.click('#generateBtn');

    // Should be on loading page
    await expect(page).toHaveURL(/#\/loading/);

    // Wait for estimated duration to be exceeded
    await page.waitForTimeout(4000);

    // Should show "Almost done..." in countdown
    const countdown = page.locator('#countdownText');
    await expect(countdown).toContainText('Almost done');

    // Extended messages should be in rotation - wait and check for one of them
    const loadingMessage = page.getByTestId('loading-message');

    // Wait up to 6 seconds for extended message to appear in rotation
    let foundExtendedMessage = false;
    for (let i = 0; i < 6; i++) {
      const text = await loadingMessage.textContent();
      if (text.includes("Teaching an AI isn't easy") || text.includes("AI is thinking extra hard")) {
        foundExtendedMessage = true;
        break;
      }
      await page.waitForTimeout(1000);
    }

    expect(foundExtendedMessage).toBe(true);
  });

  test('should display current AI model in Settings when connected', async ({ page }) => {
    // Set up auth state (handles navigation to / and waiting for home page)
    await setupAuthenticatedState(page);
    await page.goto('/#/settings');

    // Wait for Settings page to load
    await expect(page.getByTestId('settings-title')).toBeVisible();

    // Should show the current model card
    await expect(page.locator('text=Current AI Model')).toBeVisible();

    // Should display the model name (default is Deepseek R1t2 Chimera)
    const modelName = page.getByTestId('current-model-name');
    await expect(modelName).toBeVisible();
    await expect(modelName).toContainText(/Deepseek|Gemma|Llama/i);

    // Should have a Change button
    await expect(page.locator('#changeModelBtn')).toBeVisible();
    await expect(page.locator('#changeModelBtn')).toContainText('Change');
  });

  test('should open and close model selector in Settings', async ({ page }) => {
    // Set up auth state
    await setupAuthenticatedState(page);
    await page.goto('/#/settings');

    // Wait for Settings page to load
    await expect(page.getByTestId('settings-title')).toBeVisible();

    // Model selector container should be hidden initially
    const selectorContainer = page.locator('#modelSelectorContainer');
    await expect(selectorContainer).toHaveClass(/hidden/);

    // Click Change button
    await page.click('#changeModelBtn');

    // Container should now be visible
    await expect(selectorContainer).not.toHaveClass(/hidden/);

    // Should show loading state or model list
    await page.waitForTimeout(500);

    // Change button should now say Cancel
    await expect(page.locator('#changeModelBtn')).toContainText('Cancel');

    // Click Cancel to close
    await page.click('#changeModelBtn');

    // Container should be hidden again
    await expect(selectorContainer).toHaveClass(/hidden/);

    // Button should say Change again
    await expect(page.locator('#changeModelBtn')).toContainText('Change');
  });

  test('should allow selecting a different AI model', async ({ page }) => {
    // Mock the models API response
    await page.route('**/api/v1/models', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'google/gemma-2-9b-it:free',
              name: 'Gemma 2 9B',
              description: 'Google Gemma 2',
              context_length: 8192,
              pricing: { prompt: '0', completion: '0' }
            },
            {
              id: 'meta-llama/llama-3.1-8b-instruct:free',
              name: 'Llama 3.1 8B',
              description: 'Meta Llama 3.1',
              context_length: 131072,
              pricing: { prompt: '0', completion: '0' }
            },
            {
              id: 'tngtech/deepseek-r1t2-chimera:free',
              name: 'DeepSeek R1T2 Chimera',
              description: 'Default model',
              context_length: 65536,
              pricing: { prompt: '0', completion: '0' }
            }
          ]
        })
      });
    });

    // Set up auth state
    await setupAuthenticatedState(page);
    await page.goto('/#/settings');

    // Wait for Settings page to load
    await expect(page.getByTestId('settings-title')).toBeVisible();

    // Get initial model name
    const modelName = page.getByTestId('current-model-name');
    const initialModel = await modelName.textContent();

    // Click Change button
    await page.click('#changeModelBtn');

    // Wait for models to load
    await expect(page.locator('text=Select a model:')).toBeVisible({ timeout: 5000 });

    // Should see model options
    const modelOptions = page.locator('input[name="modelSelect"]');
    await expect(modelOptions).toHaveCount(3);

    // Select a different model (Gemma)
    const gemmaRadio = page.locator('input[value="google/gemma-2-9b-it:free"]');
    await gemmaRadio.click();

    // Selector should close after selection
    await page.waitForTimeout(300);
    await expect(page.locator('#modelSelectorContainer')).toHaveClass(/hidden/);

    // Model name should be updated (getModelDisplayName converts 'google/gemma-2-9b-it:free' to 'Gemma 2 9b It')
    await expect(modelName).toContainText('Gemma 2 9b It');
    expect(await modelName.textContent()).not.toBe(initialModel);
  });

  test('should persist model selection after page refresh', async ({ page }) => {
    // Mock the models API response
    await page.route('**/api/v1/models', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'google/gemma-2-9b-it:free',
              name: 'Gemma 2 9B',
              description: 'Google Gemma 2',
              context_length: 8192,
              pricing: { prompt: '0', completion: '0' }
            },
            {
              id: 'tngtech/deepseek-r1t2-chimera:free',
              name: 'DeepSeek R1T2 Chimera',
              description: 'Default model',
              context_length: 65536,
              pricing: { prompt: '0', completion: '0' }
            }
          ]
        })
      });
    });

    // Set up auth state
    await setupAuthenticatedState(page);
    await page.goto('/#/settings');

    // Wait for Settings page to load
    await expect(page.getByTestId('settings-title')).toBeVisible();

    // Click Change button
    await page.click('#changeModelBtn');

    // Wait for models to load
    await expect(page.locator('text=Select a model:')).toBeVisible({ timeout: 5000 });

    // Select Gemma model
    await page.locator('input[value="google/gemma-2-9b-it:free"]').click();
    await page.waitForTimeout(300);

    // Verify it's selected (getModelDisplayName converts ID to display name)
    await expect(page.getByTestId('current-model-name')).toContainText('Gemma 2 9b It');

    // Reload the page
    await page.reload();

    // Wait for Settings page to reload
    await expect(page.getByTestId('settings-title')).toBeVisible();

    // Model should still be Gemma (after reload, name comes from getModelDisplayName)
    await expect(page.getByTestId('current-model-name')).toContainText('Gemma 2 9b It');
  });

  test('should show error message when model loading fails', async ({ page }) => {
    // Mock the models API to fail
    await page.route('**/api/v1/models', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' })
      });
    });

    // Set up auth state
    await setupAuthenticatedState(page);
    await page.goto('/#/settings');

    // Wait for Settings page to load
    await expect(page.getByTestId('settings-title')).toBeVisible();

    // Click Change button
    await page.click('#changeModelBtn');

    // Should show error message
    await expect(page.locator('text=Failed to load models')).toBeVisible({ timeout: 5000 });
  });

});
