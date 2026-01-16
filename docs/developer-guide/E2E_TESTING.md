# E2E Testing Guide

## Overview

Saberloop uses **Playwright** for end-to-end browser testing.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Dev Server │────▶│  Playwright │────▶│   Results   │
│ (localhost) │     │  (Browser)  │     │ + Artifacts │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Quick Start

```bash
# Run functional E2E tests (fast)
npm run test:e2e

# Run capture scripts only (screenshots/videos for docs)
npm run test:e2e:capture

# Run all E2E tests including capture scripts
npm run test:e2e:all

# Run with visual UI (development)
npm run test:e2e:ui
```

## Running Specific Tests

```bash
# Run a single test file
npx playwright test tests/e2e/app.spec.js

# Run tests matching a pattern
npx playwright test --grep "quiz flow"

# Run a single test by name
npx playwright test --grep "should display results after completing quiz"

# Run specific file with visible browser
npx playwright test tests/e2e/app.spec.js --headed

# Run specific file in UI mode
npx playwright test tests/e2e/app.spec.js --ui
```

## Test Projects

Playwright is configured with **two projects** for different purposes:

| Project | Command | Purpose | Video |
|---------|---------|---------|-------|
| `tests` | `npm run test:e2e` | Functional testing (CI, development) | Off |
| `capture` | `npm run test:e2e:capture` | Screenshots/videos for docs & marketing | On |

### File Naming Convention

- **Functional tests**: `*.spec.js` (e.g., `app.spec.js`, `offline.spec.js`)
- **Capture scripts**: `capture-*.spec.js` (e.g., `capture-demo.spec.js`)

The `tests` project ignores `capture-*.spec.js` files, so capture scripts don't run during regular testing.

## Test File Location

```
tests/e2e/
├── helpers.js                  # Shared test helpers
├── app.spec.js                 # Core app functionality
├── offline.spec.js             # Offline mode tests
├── share.spec.js               # Share feature tests
├── party-mode.spec.js          # Party mode tests
├── quiz-leave-confirmation.spec.js  # Navigation guards
└── capture-*.spec.js           # Capture scripts (docs/marketing)
```

## Writing Tests

### Basic Structure

```javascript
import { test, expect } from '@playwright/test';

test('should echo text from input to output', async ({ page }) => {
  await page.goto('/');

  // Type into input
  await page.fill('#textInput', 'Hello Playwright!');

  // Verify output
  const outputText = await page.textContent('#textOutput');
  expect(outputText).toBe('Hello Playwright!');
});
```

### Common Actions

```javascript
// Navigation
await page.goto('/');
await page.goto('/settings');
await page.reload();

// Clicking
await page.click('#submit-btn');
await page.click('text=Start Quiz');
await page.click('[data-testid="next-question"]');

// Typing
await page.fill('#topic-input', 'Solar System');
await page.type('#search', 'planets', { delay: 100 });

// Getting content
const text = await page.textContent('#output');
const value = await page.inputValue('#input');
const isVisible = await page.isVisible('#modal');

// Waiting
await page.waitForSelector('#results');
await page.waitForTimeout(1000);  // Avoid if possible
await page.waitForLoadState('networkidle');
```

### Testing Offline Mode

```javascript
test('should work offline', async ({ page, context }) => {
  // Load page online first
  await page.goto('/');
  await page.waitForTimeout(2000);  // Let service worker cache

  // Go offline
  await context.setOffline(true);

  // Reload and verify app still works
  await page.reload();
  await page.fill('#textInput', 'Works offline!');
  expect(await page.textContent('#textOutput')).toBe('Works offline!');
});
```

### Using Test Fixtures

```javascript
// Setup authenticated state
test.beforeEach(async ({ page }) => {
  // Navigate and setup common state
  await page.goto('/');
  await page.click('text=Skip Welcome');
});

// Multiple fixtures available
test('test name', async ({ page, context, browser }) => {
  // page = browser tab
  // context = browser context (isolated cookies/storage)
  // browser = browser instance
});
```

### Test Helpers

Shared helpers are in `tests/e2e/helpers.js`:

```javascript
import { setupAuthenticatedState, clearSessions } from './helpers.js';

test.beforeEach(async ({ page }) => {
  // Skip welcome screen and set up fake API key
  await setupAuthenticatedState(page);
});

test('should start with clean state', async ({ page }) => {
  // Clear all quiz sessions before test
  await clearSessions(page);
  // ...
});
```

| Helper | Purpose |
|--------|---------|
| `setupAuthenticatedState(page)` | Sets fake API key in IndexedDB, skips welcome screen, navigates to home |
| `clearSessions(page)` | Clears all quiz sessions for clean test state |

## Debugging Failed Tests

### View Screenshots and Videos

When tests fail, Playwright saves artifacts to `test-results/`:

```bash
# Screenshots
test-results/test-name-chromium/test-failed-1.png

# Videos (retained on failure)
test-results/test-name-chromium/video.webm
```

### UI Mode for Interactive Debugging

```bash
npm run test:e2e:ui
```

Features:
- Visual test timeline
- Step-by-step execution
- DOM inspector at each step
- Pick locator tool

### Headed Mode

Run with visible browser:

```bash
npx playwright test --headed
```

## Configuration

Tests are configured in `playwright.config.js`:

```javascript
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  retries: 1,

  use: {
    baseURL: 'http://localhost:3000',
    ...devices['Desktop Chrome'],
  },

  webServer: {
    command: 'npx cross-env VITE_USE_REAL_API=false vite --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    {
      name: 'tests',
      testIgnore: '**/capture-*.spec.js',  // Skip capture scripts
      use: {
        screenshot: 'only-on-failure',
        video: 'off',
      },
    },
    {
      name: 'capture',
      testMatch: '**/capture-*.spec.js',   // Only capture scripts
      use: {
        screenshot: 'on',
        video: 'on',
      },
    },
  ],
});
```

## Running in CI

E2E tests run automatically in GitHub Actions:

```yaml
# .github/workflows/test.yml
- run: npx playwright install --with-deps
- run: npm run test:e2e
```

## CSS Selectors

```javascript
// By ID
await page.click('#submit-btn');

// By class
await page.click('.quiz-card');

// By text content
await page.click('text=Start Quiz');

// By data attribute
await page.click('[data-testid="next-question"]');

// By role (accessibility)
await page.click('role=button[name="Submit"]');
```

## Troubleshooting

### Selector Timeout (Element Not Found)

```
Error: page.fill: Test timeout of 45000ms exceeded.
Call log:
  - waiting for locator('#text-input')
```

**Cause:** Selector doesn't match any element on the page

**Fix:** Verify selector matches the actual HTML element. Use DevTools to inspect and copy the correct selector.

---

### Wrong Selector Case

```javascript
// ❌ Test uses kebab-case
await page.fill('#text-input', 'Hello');

// ✅ HTML uses camelCase
// <input id="textInput">
await page.fill('#textInput', 'Hello');
```

**Cause:** CSS selectors are case-sensitive for IDs

**Fix:** Copy selectors directly from HTML or browser DevTools

---

### Whitespace in textContent

```
- Expected: "Your text will appear here..."
+ Received: "\n               Your text will appear here...\n"
```

**Cause:** `page.textContent()` captures whitespace from HTML formatting

**Fix:** Use `.trim()` on the result:
```javascript
const text = await page.textContent('#output');
expect(text.trim()).toBe('Your text will appear here...');
```

---

### Strict Mode Violation (Multiple Elements)

```
Error: strict mode violation - 2 elements found
```

**Cause:** Selector matches multiple elements but Playwright expects one

**Fix:** Scope selector to a specific container or use more specific selector:
```javascript
// ❌ Matches multiple elements
await page.locator('text=Science').click();

// ✅ Scoped to specific container
await page.locator('#recentTopicsList p:has-text("Science")').click();

// ✅ Or use .first() / .nth()
await page.locator('text=Science').first().click();
```

---

### Timing Issues (Fast Clicks Skipped)

**Problem:** Rapid clicks cause some actions to be skipped

```javascript
// ❌ Too fast - some clicks get lost
for (let i = 0; i < 5; i++) {
  await page.click('.option-btn');
  await page.click('#submitBtn');
}
```

**Fix:** Wait for elements to be ready between actions:
```javascript
// ✅ Wait for stability
for (let i = 0; i < 5; i++) {
  await expect(page.locator('h2')).toBeVisible();
  await page.click('.option-btn');
  await page.click('#submitBtn');
}
```

---

### Dev Server Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Cause:** Dev server isn't running or port is in use

**Fix:**
- The `webServer` config auto-starts the server, but check if port 3000 is available
- Kill any process using the port: `npx kill-port 3000`
- Or start manually in a separate terminal: `npm run dev`

## Multi-User Testing (Party Mode)

Party Mode requires testing multiple users interacting simultaneously. This uses **Docker** for the PHP backend and **Playwright multi-context** for isolated browser sessions.

### Docker Setup

```bash
# Start PHP + MySQL stack
docker-compose -f docker-compose.php.yml up -d php-api mysql

# Verify containers are running
docker-compose -f docker-compose.php.yml ps

# Run database migrations (first time only)
docker-compose -f docker-compose.php.yml exec php-api php /var/www/html/party/migrate.php
```

### Environment Configuration

Add to `.env` for local Party Mode testing:

```bash
VITE_PARTY_API_URL=http://localhost:8080/party
```

### Multi-Context Pattern

Playwright multi-context creates isolated browser sessions (separate cookies, storage):

```javascript
import { test, expect } from '@playwright/test';
import { setupAuthenticatedState } from './helpers.js';

test('host and guest complete party quiz', async ({ browser }) => {
  // Create isolated browser contexts
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();

  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  // Initialize both with authenticated state
  await setupAuthenticatedState(hostPage);
  await setupAuthenticatedState(guestPage);

  // Host creates room
  await hostPage.goto('/#/party/create');
  // ... host creates quiz and gets room code

  // Guest joins room
  await guestPage.goto('/#/party/join');
  // ... guest enters room code and joins

  // Both play through quiz
  // ... answer questions, verify scores

  // Cleanup
  await hostContext.close();
  await guestContext.close();
});
```

### What Multi-Context Tests

| Scenario | How It Works |
|----------|--------------|
| Real HTTP polling | Both contexts communicate through Docker backend |
| Score synchronization | Verify both see same scores after answers |
| Question progression | Host advances, guest sees new question |
| Results display | Both see correct final standings |

### What It Doesn't Test

| Scenario | Why | Alternative |
|----------|-----|-------------|
| WebRTC P2P | Docker uses HTTP polling mode | Manual testing if P2P enabled |
| 3+ players | Complex setup, diminishing returns | Test with 2 players |
| Network failures | Unreliable to simulate | Manual disconnect testing |

### Running Party Mode Tests

```bash
# Ensure Docker is running first!
docker-compose -f docker-compose.php.yml up -d php-api mysql

# Run party mode tests
npx playwright test tests/e2e/party-mode.spec.js --headed

# Run with UI for debugging
npx playwright test tests/e2e/party-mode.spec.js --ui
```

### Troubleshooting Docker Tests

**CORS errors:**
Add test server origin to `php-api/party/config.local.php`:
```php
'allowed_origins' => [
    'http://localhost:8888',
    'http://localhost:3000',  // Playwright test server
],
```

**Database connection errors:**
Ensure `config.local.php` uses Docker service name:
```php
'db' => [
    'host' => 'mysql',  // Docker service name, NOT localhost
    // ...
],
```

**Old server caching:**
Kill existing dev servers before running tests:
```bash
npx kill-port 3000
```

For detailed setup and troubleshooting, see [Phase 4: Multi-User Testing](../learning/epic06_sharing/PHASE4_MULTI_USER_TESTING.md).

## Best Practices

1. **Use meaningful selectors** - `data-testid` over CSS classes
2. **Avoid fixed waits** - Use `waitForSelector` instead of `waitForTimeout`
3. **Test user workflows** - Complete flows, not isolated clicks
4. **Clean up state** - Use `beforeEach` for consistent starting point
5. **Keep tests independent** - Each test should work in isolation
6. **Use multi-context for multi-user** - Don't mock when Docker can provide real backend

## Related Documentation

- [Unit Testing](./UNIT_TESTING.md) - Vitest unit tests
- [Maestro Testing](./MAESTRO_TESTING.md) - Mobile app tests
- [Phase 4.4 Learning Notes](../learning/epic01_infrastructure/PHASE4.4_E2E_TESTING.md) - Detailed concepts
- [Phase 4: Multi-User Testing](../learning/epic06_sharing/PHASE4_MULTI_USER_TESTING.md) - Party Mode testing setup
