import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration with two projects:
 * - tests: Functional tests (run regularly, video off)
 * - capture: Content capture scripts (run on-demand, video on)
 *
 * Commands:
 *   npm run test:e2e          - Run functional tests only
 *   npm run test:e2e:capture  - Run capture scripts only
 *   npm run test:e2e:all      - Run all tests
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  retries: 1,

  // Shared settings for all projects
  use: {
    baseURL: 'http://localhost:3000',
    ...devices['Desktop Chrome'],
  },

  // Web server configuration
  webServer: {
    command: 'npx cross-env VITE_USE_REAL_API=false vite --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  projects: [
    {
      name: 'tests',
      testIgnore: '**/capture-*.spec.js',
      use: {
        screenshot: 'only-on-failure',
        video: 'off',
      },
    },
    {
      name: 'capture',
      testMatch: '**/capture-*.spec.js',
      use: {
        screenshot: 'on',
        video: 'on',
      },
    },
  ],
});
