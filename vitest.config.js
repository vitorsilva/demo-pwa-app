import { defineConfig } from 'vitest/config';

  export default defineConfig({
    test: {
      // Use jsdom to simulate browser environment
      environment: 'jsdom',

      // Enable global test functions (describe, it, expect)
      // So you don't need to import them in every test file
      globals: true,

      // Only include unit test files, exclude E2E tests
      include: ['**/*.test.js'],
      exclude: ['node_modules', 'dist', 'tests/e2e/**'],

      // Coverage configuration
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        exclude: [
          'node_modules/',
          'dist/',
          '*.config.js',
          'sw.js',  // Service worker is hard to test in unit tests
          'tests/e2e/**'  // Also exclude E2E from coverage
        ]
      }
    }
});