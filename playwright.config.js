import { defineConfig, devices } from '@playwright/test';

 export default defineConfig({
    // Configuration will go here

    testDir: './tests/e2e',
    timeout: 30000,
    retries: 1,
    use: {
      baseURL: 'http://localhost:3000',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
    },
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
    ],
  });