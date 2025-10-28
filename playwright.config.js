import { defineConfig, devices } from '@playwright/test';

 export default defineConfig({
    // Configuration will go here

    testDir: './tests/e2e',
    timeout: 45000,
    retries: 1,
    use: {
      baseURL: 'http://localhost:3000',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
    },
    // Add this section:
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },    
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
    ],
  });