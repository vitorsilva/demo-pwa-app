/**
 * Party Mode Demo Video Capture Script
 *
 * Captures screenshots and demo video of the Party Mode functionality.
 * Simulates the complete flow: mode switch, create party, join, gameplay, results.
 *
 * Run with:
 *   npx playwright test tests/e2e/capture-party-demo.spec.js --headed
 *
 * Output:
 *   Screenshots: docs/product-info/screenshots/party/
 *   Video: test-results/ (copy manually to docs/product-info/videos/)
 *
 * Storyboard:
 *   docs/learning/epic06_sharing/PARTY_MODE_DEMO_VIDEO.md
 */

import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './helpers.js';

const MOBILE_VIEWPORT = { width: 390, height: 844 }; // iPhone 14 Pro
const SCREENSHOT_DIR = 'docs/product-info/screenshots/party';

// Set viewport AND video size to match
test.use({
  viewport: MOBILE_VIEWPORT,
  video: {
    mode: 'on',
    size: MOBILE_VIEWPORT,
  },
});

// Test data for mock displays
const PARTICIPANTS = [
  { id: 'host-001', name: 'You', isHost: true },
  { id: 'guest-001', name: 'Alex', isHost: false },
  { id: 'guest-002', name: 'Sam', isHost: false }
];

test.describe('Capture Party Mode Demo', () => {

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test('Party Mode Complete Flow', async ({ page }) => {
    // ========================================
    // SETUP: Enable feature flags
    // ========================================
    await setupAuthenticatedState(page);

    // Enable party mode features
    await page.evaluate(() => {
      localStorage.setItem('__test_feature_MODE_TOGGLE', 'ENABLED');
      localStorage.setItem('__test_feature_PARTY_SESSION', 'ENABLED');
    });

    await page.reload();
    await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });

    // ========================================
    // ACT 1: Introduction - Learning Mode
    // ========================================
    console.log('🎬 Act 1: Mode Switch');

    await page.waitForTimeout(1000);

    // Screenshot: Learning mode home
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-home-learning-mode.png`,
      fullPage: false
    });
    console.log('✓ 01: Home in Learning mode');

    // Switch to Party mode
    const partyModeBtn = page.locator('[data-mode="party"]');
    await partyModeBtn.click();
    await page.waitForTimeout(800);

    // Wait for party buttons to appear
    await page.waitForSelector('[data-testid="create-party-btn"]');
    await page.waitForTimeout(1000);

    // Screenshot: Party mode home
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-home-party-mode.png`,
      fullPage: false
    });
    console.log('✓ 02: Home in Party mode');

    // ========================================
    // ACT 2: Host Creates Party
    // ========================================
    console.log('🎬 Act 2: Create Party');

    await page.click('[data-testid="create-party-btn"]');
    await page.waitForURL(/#\/party\/create/);
    await page.waitForTimeout(1000);

    // Screenshot: Create party - quiz selection
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-create-party-select-quiz.png`,
      fullPage: false
    });
    console.log('✓ 03: Quiz selection');

    // Select a quiz (first one in list)
    const quizItem = page.locator('.quiz-select-item').first();
    if (await quizItem.count() > 0) {
      await quizItem.click();
      await page.waitForTimeout(500);

      // Click Create Party button
      const createBtn = page.locator('#createRoomBtn');
      await createBtn.click();
      await page.waitForTimeout(2000);

      // Screenshot: Room code displayed
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/04-room-code-created.png`,
        fullPage: false
      });
      console.log('✓ 04: Room code created');

      // ========================================
      // ACT 3-4: Simulate Participants
      // ========================================
      console.log('🎬 Act 3-4: Simulated participants');

      // Inject mock participants
      await page.evaluate((participants) => {
        const container = document.querySelector('#participantContainer');
        if (container) {
          const html = participants.map(p => `
            <div class="flex items-center gap-3 p-3 bg-card-light dark:bg-card-dark rounded-xl">
              <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span class="text-primary font-bold">${p.name.charAt(0)}</span>
              </div>
              <div class="flex-1">
                <p class="text-text-light dark:text-text-dark font-medium">
                  ${p.name}${p.isHost ? ' (Host)' : ''}
                </p>
                <p class="text-green-500 text-sm">Connected</p>
              </div>
              ${p.isHost ? '<span class="material-symbols-outlined text-yellow-500">star</span>' : ''}
            </div>
          `).join('');

          container.innerHTML = `
            <h3 class="text-text-light dark:text-text-dark text-lg font-bold mb-3">
              Participants (${participants.length})
            </h3>
            <div class="flex flex-col gap-2">${html}</div>
          `;
        }

        // Enable start button
        const startBtn = document.querySelector('#startQuizBtn');
        if (startBtn) startBtn.removeAttribute('disabled');

        const minMsg = document.querySelector('#minPlayersMsg');
        if (minMsg) minMsg.classList.add('hidden');
      }, PARTICIPANTS);

      await page.waitForTimeout(1500);

      // Screenshot: Lobby with participants
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/05-party-lobby-participants.png`,
        fullPage: false
      });
      console.log('✓ 05: Party lobby');
    }

    // ========================================
    // ACT 5: Gameplay (Simulated)
    // ========================================
    console.log('🎬 Act 5: Gameplay');

    // Navigate to mock quiz view
    await page.goto('/#/party/quiz/DEMO01');
    await page.waitForTimeout(500);

    // Inject mock quiz UI
    await page.evaluate(() => {
      const app = document.querySelector('#app');
      if (app) {
        app.innerHTML = `
          <div class="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark p-4">
            <div class="h-2 bg-gray-700 rounded-full mb-4 overflow-hidden">
              <div class="h-full bg-primary rounded-full" style="width: 75%"></div>
            </div>
            <div class="flex justify-between items-center mb-4">
              <span class="text-subtext-light dark:text-subtext-dark">Question 1 of 5</span>
              <span class="text-primary font-bold text-xl">22s</span>
            </div>
            <h2 class="text-text-light dark:text-text-dark text-xl font-bold mb-6">
              Who developed the theory of relativity?
            </h2>
            <div class="flex flex-col gap-3 mb-6">
              <button class="p-4 rounded-xl bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark text-left font-medium">
                A) Isaac Newton
              </button>
              <button class="p-4 rounded-xl bg-primary text-white text-left font-medium">
                B) Albert Einstein
              </button>
              <button class="p-4 rounded-xl bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark text-left font-medium">
                C) Galileo Galilei
              </button>
              <button class="p-4 rounded-xl bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark text-left font-medium">
                D) Stephen Hawking
              </button>
            </div>
            <div class="mt-auto bg-card-light dark:bg-card-dark rounded-xl p-4">
              <h3 class="text-text-light dark:text-text-dark font-bold mb-3">Live Scores</h3>
              <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-2">
                    <span class="text-yellow-500">1.</span>
                    <span class="text-text-light dark:text-text-dark font-medium">You</span>
                  </div>
                  <span class="text-primary font-bold">15 pts</span>
                </div>
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-2">
                    <span class="text-gray-400">2.</span>
                    <span class="text-subtext-light dark:text-subtext-dark">Sam</span>
                  </div>
                  <span class="text-subtext-light dark:text-subtext-dark">12 pts</span>
                </div>
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-2">
                    <span class="text-gray-400">3.</span>
                    <span class="text-subtext-light dark:text-subtext-dark">Alex</span>
                  </div>
                  <span class="text-subtext-light dark:text-subtext-dark">10 pts</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    });

    await page.waitForTimeout(2000);

    // Screenshot: Quiz gameplay
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-party-quiz-gameplay.png`,
      fullPage: false
    });
    console.log('✓ 06: Quiz gameplay');

    // ========================================
    // ACT 6: Results
    // ========================================
    console.log('🎬 Act 6: Results');

    await page.goto('/#/party/results/DEMO01');
    await page.waitForTimeout(500);

    // Inject mock results
    await page.evaluate(() => {
      const app = document.querySelector('#app');
      if (app) {
        app.innerHTML = `
          <div class="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark p-4">
            <h1 class="text-text-light dark:text-text-dark text-2xl font-bold text-center mb-6">
              Party Results
            </h1>
            <div class="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 mb-6 text-center">
              <span class="text-5xl mb-2 block">🏆</span>
              <h2 class="text-white text-2xl font-bold">You Won!</h2>
              <p class="text-white/80 text-lg">45 points</p>
            </div>
            <div class="bg-card-light dark:bg-card-dark rounded-xl p-4 mb-6">
              <h3 class="text-text-light dark:text-text-dark font-bold mb-4">Final Standings</h3>
              <div class="flex items-center gap-3 p-3 bg-yellow-500/20 rounded-xl mb-2">
                <span class="text-2xl">🥇</span>
                <span class="text-text-light dark:text-text-dark font-bold flex-1">You</span>
                <span class="text-primary font-bold">45 pts</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-gray-500/10 rounded-xl mb-2">
                <span class="text-2xl">🥈</span>
                <span class="text-text-light dark:text-text-dark flex-1">Sam</span>
                <span class="text-subtext-light dark:text-subtext-dark font-bold">38 pts</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-orange-500/10 rounded-xl">
                <span class="text-2xl">🥉</span>
                <span class="text-text-light dark:text-text-dark flex-1">Alex</span>
                <span class="text-subtext-light dark:text-subtext-dark font-bold">32 pts</span>
              </div>
            </div>
            <div class="flex gap-3 mt-auto">
              <button class="flex-1 py-4 rounded-xl bg-primary text-white font-bold text-lg">
                Play Again
              </button>
              <button class="flex-1 py-4 rounded-xl border-2 border-primary text-primary font-bold text-lg">
                Share
              </button>
            </div>
          </div>
        `;
      }
    });

    await page.waitForTimeout(2000);

    // Screenshot: Final results
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-party-results.png`,
      fullPage: false
    });
    console.log('✓ 07: Party results');

    // Final pause
    await page.waitForTimeout(1500);

    console.log('🎬 Capture complete! Video saved to test-results/');
  });

  // Skip in CI - requires Docker backend running locally
  test.skip('Real Multi-User - Host and Guest in Lobby', async ({ browser }) => {
    // Create two isolated browser contexts (separate sessions)
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    // Capture console errors from both pages for debugging
    hostPage.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`HOST ERROR: ${msg.text()}`);
      }
    });
    guestPage.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`GUEST ERROR: ${msg.text()}`);
      }
    });

    try {
      // Setup both users
      await setupAuthenticatedState(hostPage);
      await setupAuthenticatedState(guestPage);

      // Enable party features for both
      for (const page of [hostPage, guestPage]) {
        await page.evaluate(() => {
          localStorage.setItem('__test_feature_MODE_TOGGLE', 'ENABLED');
          localStorage.setItem('__test_feature_PARTY_SESSION', 'ENABLED');
        });
        await page.reload();
        await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });
      }

      // HOST: Switch to Party mode and create room
      const hostPartyBtn = hostPage.locator('[data-mode="party"]');
      await hostPartyBtn.click();
      await hostPage.waitForSelector('[data-testid="create-party-btn"]');
      await hostPage.click('[data-testid="create-party-btn"]');
      await hostPage.waitForURL(/#\/party\/create/);

      // HOST: Select quiz and create room
      const quizItem = hostPage.locator('.quiz-select-item').first();
      await quizItem.click();
      await hostPage.click('#createRoomBtn');

      // HOST: Get room code (strip spaces and dashes from display)
      await hostPage.waitForSelector('[data-testid="room-code"]', { timeout: 10000 });
      const roomCodeRaw = await hostPage.locator('[data-testid="room-code"]').textContent();
      const roomCode = roomCodeRaw.replace(/[\s-]/g, ''); // Remove spaces and dashes
      console.log(`Room created: ${roomCode}`);

      // GUEST: Switch to Party mode
      const guestPartyBtn = guestPage.locator('[data-mode="party"]');
      await guestPartyBtn.click();
      await guestPage.waitForSelector('[data-testid="join-party-btn"]');

      // GUEST: Join room
      await guestPage.click('[data-testid="join-party-btn"]');
      await guestPage.fill('[data-testid="room-code-input"]', roomCode);
      await guestPage.fill('[data-testid="player-name-input"]', 'TestGuest');
      await guestPage.click('#joinBtn');

      // VERIFY: Guest appears in host's lobby (wait for participant count to update)
      await expect(hostPage.locator('text=Participants (2)')).toBeVisible({ timeout: 15000 });
      console.log('✅ Host sees 2 participants');

      // VERIFY: Guest is in lobby
      await expect(guestPage.locator('text=Waiting for host to start')).toBeVisible({ timeout: 10000 });
      console.log('✅ Guest in lobby waiting');

      // HOST: Start the quiz
      const startBtn = hostPage.locator('#startQuizBtn');
      await expect(startBtn).toBeEnabled({ timeout: 5000 });
      await startBtn.click();
      console.log('✅ Host clicked Start Quiz');

      // VERIFY: Both users navigate to PartyQuizView
      await hostPage.waitForURL(/#\/party\/quiz\//, { timeout: 10000 });
      console.log('✅ Host navigated to quiz view');

      // Guest should also see quiz view (via polling in lobby)
      await guestPage.waitForURL(/#\/party\/quiz\//, { timeout: 15000 });
      console.log('✅ Guest navigated to quiz view');

      // VERIFY: Both see the question
      await expect(hostPage.locator('#questionText')).toBeVisible({ timeout: 10000 });
      await expect(guestPage.locator('#questionText')).toBeVisible({ timeout: 10000 });
      console.log('✅ Both users see the question');

      // VERIFY: Timer is running
      await expect(hostPage.locator('#timerText')).toBeVisible();
      console.log('✅ Timer is visible');

      // HOST: Answer a question
      const hostOption = hostPage.locator('[data-testid="option-0"]');
      await hostOption.click();
      console.log('✅ Host clicked an answer');

      // VERIFY: Host sees feedback (either correct or incorrect styling)
      await expect(hostPage.locator('#statusText')).not.toHaveText('Waiting for host to start...');
      console.log('✅ Host sees answer feedback');

      // GUEST: Answer a question
      const guestOption = guestPage.locator('[data-testid="option-1"]');
      await guestOption.click();
      console.log('✅ Guest clicked an answer');

      // VERIFY: Guest sees feedback
      await expect(guestPage.locator('#statusText')).not.toHaveText('Waiting for host to start...');
      console.log('✅ Guest sees answer feedback');

      // Wait a bit for scores to update via polling
      await hostPage.waitForTimeout(3000);

      console.log('✅ Real multi-user quiz test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  /**
   * Real Multi-User Demo Video - Full Party Flow
   *
   * Captures a demo video showing real multi-user party mode with the local Docker backend.
   * This test goes through the complete flow: create, join, play all questions, and results.
   *
   * Prerequisites:
   *   - Docker containers running: docker-compose -f docker-compose.php.yml up -d
   *   - VITE_PARTY_API_URL=http://localhost:8080/party in .env
   *
   * Run with:
   *   npx playwright test capture-party-demo --grep "Real Multi-User Demo Video" --headed --project=chromium
   */
  // Skip in CI - requires Docker backend running locally
  // Run manually with: npx playwright test capture-party-demo --grep "Real Multi-User Demo Video" --headed
  test.skip('Real Multi-User Demo Video - Full Party Flow', async ({ browser }) => {
    // Increase timeout for full demo
    test.setTimeout(180000); // 3 minutes

    // Create contexts with video recording
    const hostContext = await browser.newContext({
      viewport: MOBILE_VIEWPORT,
      recordVideo: {
        dir: 'test-results/party-demo-videos/',
        size: MOBILE_VIEWPORT,
      },
    });
    const guestContext = await browser.newContext({
      viewport: MOBILE_VIEWPORT,
      recordVideo: {
        dir: 'test-results/party-demo-videos/',
        size: MOBILE_VIEWPORT,
      },
    });

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    // Log errors for debugging
    hostPage.on('console', msg => {
      if (msg.type() === 'error') console.log(`HOST: ${msg.text()}`);
    });
    guestPage.on('console', msg => {
      if (msg.type() === 'error') console.log(`GUEST: ${msg.text()}`);
    });

    try {
      console.log('🎬 Starting Real Multi-User Demo Video Capture');
      console.log('📍 Using local Docker backend at localhost:8080');

      // ========================================
      // SETUP: Both users authenticated
      // ========================================
      await setupAuthenticatedState(hostPage);
      await setupAuthenticatedState(guestPage);

      for (const page of [hostPage, guestPage]) {
        await page.evaluate(() => {
          localStorage.setItem('__test_feature_MODE_TOGGLE', 'ENABLED');
          localStorage.setItem('__test_feature_PARTY_SESSION', 'ENABLED');
        });
        await page.reload();
        await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });
      }

      // ========================================
      // ACT 1: Host creates party
      // ========================================
      console.log('🎬 Act 1: Host Creates Party');

      // Host switches to party mode
      await hostPage.locator('[data-mode="party"]').click();
      await hostPage.waitForSelector('[data-testid="create-party-btn"]');
      await hostPage.waitForTimeout(500);

      // Host creates party
      await hostPage.click('[data-testid="create-party-btn"]');
      await hostPage.waitForURL(/#\/party\/create/);
      await hostPage.waitForTimeout(800);

      // Select first quiz
      const quizItem = hostPage.locator('.quiz-select-item').first();
      await quizItem.click();
      await hostPage.waitForTimeout(500);

      // Create room
      await hostPage.click('#createRoomBtn');
      await hostPage.waitForSelector('[data-testid="room-code"]', { timeout: 15000 });
      await hostPage.waitForTimeout(1000);

      // Get room code
      const roomCodeRaw = await hostPage.locator('[data-testid="room-code"]').textContent();
      const roomCode = roomCodeRaw.replace(/[\s-]/g, '');
      console.log(`✅ Room created: ${roomCode}`);

      // ========================================
      // ACT 2: Guest joins party
      // ========================================
      console.log('🎬 Act 2: Guest Joins Party');

      // Guest switches to party mode
      await guestPage.locator('[data-mode="party"]').click();
      await guestPage.waitForSelector('[data-testid="join-party-btn"]');
      await guestPage.waitForTimeout(500);

      // Guest joins
      await guestPage.click('[data-testid="join-party-btn"]');
      await guestPage.waitForTimeout(500);
      await guestPage.fill('[data-testid="room-code-input"]', roomCode);
      await guestPage.fill('[data-testid="player-name-input"]', 'Alex');
      await guestPage.waitForTimeout(300);
      await guestPage.click('#joinBtn');

      // Wait for both to be in lobby
      await expect(hostPage.locator('text=Participants (2)')).toBeVisible({ timeout: 15000 });
      await expect(guestPage.locator('text=Waiting for host to start')).toBeVisible({ timeout: 10000 });
      console.log('✅ Both in lobby');
      await hostPage.waitForTimeout(1500);

      // ========================================
      // ACT 3: Quiz gameplay
      // ========================================
      console.log('🎬 Act 3: Quiz Gameplay');

      // Host starts quiz
      await hostPage.click('#startQuizBtn');
      console.log('✅ Quiz started');

      // Both navigate to quiz view
      await hostPage.waitForURL(/#\/party\/quiz\//, { timeout: 10000 });
      await guestPage.waitForURL(/#\/party\/quiz\//, { timeout: 15000 });
      console.log('✅ Both in quiz view');

      // Play through questions (up to 3 questions or until quiz ends)
      for (let q = 0; q < 3; q++) {
        console.log(`📝 Question ${q + 1}`);

        // Wait for question to be visible
        await expect(hostPage.locator('#questionText')).toBeVisible({ timeout: 10000 });
        await expect(guestPage.locator('#questionText')).toBeVisible({ timeout: 10000 });
        await hostPage.waitForTimeout(1000);

        // Both answer (different options for variety)
        const hostOption = hostPage.locator(`[data-testid="option-${q % 4}"]`);
        const guestOption = guestPage.locator(`[data-testid="option-${(q + 1) % 4}"]`);

        if (await hostOption.isVisible()) {
          await hostOption.click();
          console.log('  ✅ Host answered');
        }

        await hostPage.waitForTimeout(500);

        if (await guestOption.isVisible()) {
          await guestOption.click();
          console.log('  ✅ Guest answered');
        }

        // Wait for timer to expire and next question (or quiz end)
        // The host advances after timer expires
        await hostPage.waitForTimeout(3000);

        // Check if we're still in quiz or moved to results
        const currentUrl = hostPage.url();
        if (currentUrl.includes('/party/results/')) {
          console.log('✅ Quiz ended - moved to results');
          break;
        }

        // Wait for potential question change
        await hostPage.waitForTimeout(2000);
      }

      // ========================================
      // ACT 4: Results
      // ========================================
      console.log('🎬 Act 4: Results');

      // Wait for results view (either already there or wait for quiz to complete)
      try {
        await hostPage.waitForURL(/#\/party\/results\//, { timeout: 60000 });
        console.log('✅ Host at results');
      } catch {
        console.log('⏳ Waiting for quiz to finish...');
        // Quiz might still be going - wait longer
        await hostPage.waitForURL(/#\/party\/results\//, { timeout: 120000 });
      }

      // Guest should also be at results (via polling)
      await guestPage.waitForURL(/#\/party\/results\//, { timeout: 30000 });
      console.log('✅ Guest at results');

      // Let results be visible for video
      await hostPage.waitForTimeout(3000);

      console.log('🎬 Demo video capture complete!');

    } finally {
      // Close contexts to save videos
      await hostContext.close();
      await guestContext.close();
      console.log('📹 Videos saved to test-results/party-demo-videos/');
    }
  });
});
