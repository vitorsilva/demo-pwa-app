// @ts-check
/**
 * Party Mode Answered Count Tests (Issue #120)
 *
 * Tests verify that the "Answered: X/Y questions" count is correct on results page.
 * Bug: Count shows 0/5 for all participants even when they answered questions.
 *
 * Requires Docker stack:
 *   docker-compose -f docker-compose.php.yml up -d php-api mysql
 *   VITE_PARTY_API_URL=http://localhost:8080/party
 */
import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './helpers.js';

// Skip Docker-dependent tests unless VITE_PARTY_API_URL is explicitly set
// (meaning Docker backend is intentionally configured for testing)
const isDockerConfigured = Boolean(process.env.VITE_PARTY_API_URL);

/**
 * Helper to switch to party mode.
 * @param {import('@playwright/test').Page} page
 */
async function enablePartyMode(page) {
  const partyButton = page.locator('[data-mode="party"]');
  await partyButton.click();
  await expect(partyButton).toHaveAttribute('aria-selected', 'true');
}

/**
 * Helper to create a room and get the room code.
 * Returns the room code for guests to join.
 * @param {import('@playwright/test').Page} page
 * @param {string} hostName
 * @returns {Promise<string>} Room code
 */
async function createPartyRoom(page, hostName) {
  await page.goto('/#/party/create');
  await page.waitForLoadState('networkidle');

  // Enter host name
  const nameInput = page.getByTestId('host-name-input');
  await nameInput.fill(hostName);

  // Select first quiz
  const quizItem = page.locator('.quiz-select-item').first();
  if (await quizItem.isVisible()) {
    await quizItem.click();
  }

  // Create room
  const createBtn = page.locator('#createRoomBtn');
  await createBtn.click();

  // Wait for lobby view with room code
  await page.waitForURL(/#\/party\/lobby/);

  // Extract room code from display
  const roomCodeElement = page.locator('[data-testid="room-code"]');
  await expect(roomCodeElement).toBeVisible({ timeout: 10000 });
  const roomCode = await roomCodeElement.textContent();

  return roomCode?.trim() || '';
}

/**
 * Helper to join a party room.
 * @param {import('@playwright/test').Page} page
 * @param {string} roomCode
 * @param {string} guestName
 */
async function joinPartyRoom(page, roomCode, guestName) {
  await page.goto('/#/party/join');
  await page.waitForLoadState('networkidle');

  // Enter room code
  const roomCodeInput = page.getByTestId('room-code-input');
  await roomCodeInput.fill(roomCode);

  // Enter name
  const nameInput = page.getByTestId('player-name-input');
  await nameInput.fill(guestName);

  // Join room
  const joinBtn = page.locator('#joinRoomBtn');
  await joinBtn.click();

  // Wait for lobby
  await page.waitForURL(/#\/party\/lobby/);
}

/**
 * Helper to start the quiz (host only).
 * @param {import('@playwright/test').Page} page
 */
async function startQuiz(page) {
  const startBtn = page.locator('#startQuizBtn');
  await expect(startBtn).toBeEnabled({ timeout: 10000 });
  await startBtn.click();

  // Wait for quiz view
  await page.waitForURL(/#\/party\/quiz/);
}

/**
 * Helper to answer a question.
 * @param {import('@playwright/test').Page} page
 * @param {number} optionIndex - 0-3
 */
async function answerQuestion(page, optionIndex = 0) {
  const optionBtn = page.getByTestId(`option-${optionIndex}`);
  await expect(optionBtn).toBeVisible({ timeout: 10000 });
  await optionBtn.click();
}

/**
 * Helper to advance to next question (host only, after all answered).
 * @param {import('@playwright/test').Page} page
 */
async function advanceQuestion(page) {
  const nextBtn = page.getByTestId('next-question-btn');

  // Wait for button to be visible and enabled
  await expect(nextBtn).toBeVisible({ timeout: 15000 });
  await expect(nextBtn).toBeEnabled({ timeout: 10000 });
  await nextBtn.click();
}

/**
 * Helper to wait for results page.
 * @param {import('@playwright/test').Page} page
 */
async function waitForResults(page) {
  await page.waitForURL(/#\/party\/results/, { timeout: 60000 });
}

/**
 * Get answered count text for a participant.
 * @param {import('@playwright/test').Page} page
 * @param {string} participantName
 * @returns {Promise<string>} e.g., "5/5" or "3/5"
 */
async function getAnsweredCount(page, participantName) {
  // Find the participant card containing the name
  const participantCard = page.locator(`.rounded-xl:has-text("${participantName}")`);
  await expect(participantCard).toBeVisible({ timeout: 5000 });

  // Get the answered count text (e.g., "Respondidas: 5/5 perguntas")
  const answeredText = await participantCard.locator('text=/\\d+\\/\\d+/').textContent();

  // Extract just the X/Y part
  const match = answeredText?.match(/(\d+\/\d+)/);
  return match ? match[1] : '0/0';
}

test.describe('Party Mode Answered Count (Issue #120)', () => {
  // These tests require the Docker backend
  test.describe.configure({ mode: 'serial' });

  test.describe('Results page answered count display', () => {
    // Skip these tests in CI - they require Docker backend with real WebRTC signaling
    test.beforeEach(() => {
      test.skip(!isDockerConfigured, 'Requires Docker backend (set VITE_PARTY_API_URL=http://localhost:8080/party)');
    });

    test('should show correct answered count for host who answered all questions', async ({ browser }) => {
      // Create isolated browser contexts for host and guest
      const hostContext = await browser.newContext();
      const guestContext = await browser.newContext();

      try {
        const hostPage = await hostContext.newPage();
        const guestPage = await guestContext.newPage();

        // Set up both with authenticated state
        await setupAuthenticatedState(hostPage);
        await setupAuthenticatedState(guestPage);

        // Enable party mode for both
        await enablePartyMode(hostPage);
        await enablePartyMode(guestPage);

        // Host creates room
        const roomCode = await createPartyRoom(hostPage, 'Host120');
        expect(roomCode).toBeTruthy();

        // Guest joins
        await joinPartyRoom(guestPage, roomCode, 'Guest120');

        // Host starts quiz
        await startQuiz(hostPage);

        // Wait for guest to see quiz
        await guestPage.waitForURL(/#\/party\/quiz/, { timeout: 15000 });

        // Both answer all questions (assuming 5 questions)
        const totalQuestions = 5;
        for (let q = 0; q < totalQuestions; q++) {
          // Host answers
          await answerQuestion(hostPage, 0);

          // Guest answers
          await answerQuestion(guestPage, 0);

          // Host advances (wait for both to answer)
          if (q < totalQuestions - 1) {
            await advanceQuestion(hostPage);
            // Wait for new question to load for both
            await hostPage.waitForTimeout(500);
          }
        }

        // Wait for results
        await waitForResults(hostPage);
        await waitForResults(guestPage);

        // Verify host's answered count shows 5/5 (not 0/5)
        const hostAnswered = await getAnsweredCount(hostPage, 'Host120');
        expect(hostAnswered).toBe(`${totalQuestions}/${totalQuestions}`);

      } finally {
        await hostContext.close();
        await guestContext.close();
      }
    });

    test('should show correct answered count for guest who answered all questions', async ({ browser }) => {
      const hostContext = await browser.newContext();
      const guestContext = await browser.newContext();

      try {
        const hostPage = await hostContext.newPage();
        const guestPage = await guestContext.newPage();

        await setupAuthenticatedState(hostPage);
        await setupAuthenticatedState(guestPage);

        await enablePartyMode(hostPage);
        await enablePartyMode(guestPage);

        const roomCode = await createPartyRoom(hostPage, 'Host121');
        await joinPartyRoom(guestPage, roomCode, 'Guest121');

        await startQuiz(hostPage);
        await guestPage.waitForURL(/#\/party\/quiz/, { timeout: 15000 });

        const totalQuestions = 5;
        for (let q = 0; q < totalQuestions; q++) {
          await answerQuestion(hostPage, 0);
          await answerQuestion(guestPage, 0);

          if (q < totalQuestions - 1) {
            await advanceQuestion(hostPage);
            await hostPage.waitForTimeout(500);
          }
        }

        await waitForResults(hostPage);
        await waitForResults(guestPage);

        // Verify guest's answered count on guest's screen
        const guestAnswered = await getAnsweredCount(guestPage, 'Guest121');
        expect(guestAnswered).toBe(`${totalQuestions}/${totalQuestions}`);

      } finally {
        await hostContext.close();
        await guestContext.close();
      }
    });

    test('should show partial answered count when guest skips questions', async ({ browser }) => {
      const hostContext = await browser.newContext();
      const guestContext = await browser.newContext();

      try {
        const hostPage = await hostContext.newPage();
        const guestPage = await guestContext.newPage();

        await setupAuthenticatedState(hostPage);
        await setupAuthenticatedState(guestPage);

        await enablePartyMode(hostPage);
        await enablePartyMode(guestPage);

        const roomCode = await createPartyRoom(hostPage, 'Host122');
        await joinPartyRoom(guestPage, roomCode, 'Guest122');

        await startQuiz(hostPage);
        await guestPage.waitForURL(/#\/party\/quiz/, { timeout: 15000 });

        // Answer only 3 out of 5 questions
        const totalQuestions = 5;
        const guestAnswersCount = 3;

        for (let q = 0; q < totalQuestions; q++) {
          // Host always answers
          await answerQuestion(hostPage, 0);

          // Guest only answers first 3 questions
          if (q < guestAnswersCount) {
            await answerQuestion(guestPage, 0);
          }
          // For questions 4-5, guest doesn't answer - timer runs out

          // Host advances after a delay to let timer handle non-answers
          if (q < totalQuestions - 1) {
            // Wait longer for timeout if guest didn't answer
            const waitTime = q >= guestAnswersCount ? 2000 : 500;
            await hostPage.waitForTimeout(waitTime);
            await advanceQuestion(hostPage);
          }
        }

        await waitForResults(hostPage);
        await waitForResults(guestPage);

        // Verify guest's partial answered count
        const guestAnswered = await getAnsweredCount(guestPage, 'Guest122');
        expect(guestAnswered).toBe(`${guestAnswersCount}/${totalQuestions}`);

        // Verify host still has full count
        const hostAnswered = await getAnsweredCount(guestPage, 'Host122');
        expect(hostAnswered).toBe(`${totalQuestions}/${totalQuestions}`);

      } finally {
        await hostContext.close();
        await guestContext.close();
      }
    });
  });

  test.describe('Unit-level verification (mocked data)', () => {
    // These tests verify the UI rendering with mocked data, useful when Docker isn't available
    test('should render answered count from participant.answers array', async ({ page }) => {
      await setupAuthenticatedState(page);
      await enablePartyMode(page);

      // Set up mock session state
      await page.evaluate(() => {
        sessionStorage.setItem('partyIsHost', 'false');
        sessionStorage.setItem('partyParticipantId', 'test-participant-1');
        sessionStorage.setItem('partyRoomCode', 'TEST120');
      });

      // Navigate to results
      await page.goto('/#/party/results/TEST120');
      await page.waitForLoadState('networkidle');

      // Inject mock standings with answers array
      await page.evaluate(() => {
        if (window.__router && window.__router.currentView) {
          const view = window.__router.currentView;
          view.quiz = {
            topic: 'Test Quiz',
            questions: [
              { question: 'Q1', options: ['A', 'B', 'C', 'D'], correct: 0 },
              { question: 'Q2', options: ['A', 'B', 'C', 'D'], correct: 1 },
              { question: 'Q3', options: ['A', 'B', 'C', 'D'], correct: 2 },
              { question: 'Q4', options: ['A', 'B', 'C', 'D'], correct: 3 },
              { question: 'Q5', options: ['A', 'B', 'C', 'D'], correct: 0 },
            ],
          };
          view.standings = [
            {
              id: 'host-1',
              name: 'TestHost',
              score: 50,
              answers: [0, 1, 2, 3, 0], // All 5 answered
              isYou: false,
            },
            {
              id: 'test-participant-1',
              name: 'TestGuest',
              score: 30,
              answers: [0, 1, undefined, 3, undefined], // Only 3 answered
              isYou: true,
            },
          ];
          // Re-render to show the standings
          view.render();
        }
      });

      // Wait for re-render
      await page.waitForTimeout(500);

      // Check that answered counts are correct
      const pageContent = await page.content();

      // Host should show 5/5
      expect(pageContent).toContain('5/5');

      // Guest should show 3/5
      expect(pageContent).toContain('3/5');
    });
  });
});
