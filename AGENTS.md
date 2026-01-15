# AGENTS.md

This file contains guidelines and commands for agentic coding agents working in the Saberloop repository.

## Development Commands

### Build & Development
```bash
npm run dev              # Start development server on port 8888
npm run build           # Build for production
npm run preview         # Preview production build locally
```

### Testing
```bash
npm test                # Run unit tests (Vitest) in watch mode
npm test -- --run       # Run unit tests once and exit
npm run test:coverage   # Run with coverage report
npm run test:e2e        # Run E2E tests (Playwright)
npm run test:e2e:ui     # Run E2E tests with Playwright UI
```

**Running a single test:**
```bash
# Unit test (Vitest)
npm test -- src/core/features.test.js

# E2E test (Playwright)
npm run test:e2e -- tests/e2e/mode-toggle.spec.js
```

### Linting & Code Quality
```bash
npm run lint:dead-code          # Find unused code with Knip
npm run lint:dead-code:fix      # Auto-fix unused code
npm run typecheck               # TypeScript type checking
npm run arch:test               # Architecture validation with dependency-cruiser
```

### Deployment
```bash
npm run deploy                  # Deploy to production (FTP)
npm run deploy:staging          # Deploy to staging
npm run build:deploy            # Build and deploy to production
```

## Code Style Guidelines

### File Structure & Imports
- Use ES6 modules (`import`/`export`)
- Import external libraries first, then internal modules
- Use absolute imports with `@/` alias for src files: `import logger from '@/utils/logger.js'`
- Keep imports at the top of files, grouped by type

```javascript
// External libraries
import { openDB } from 'idb';
import log from 'loglevel';

// Internal modules
import { logger } from '@/utils/logger.js';
import { initDatabase } from '@/core/db.js';
```

### Naming Conventions
- **Files**: kebab-case for directories, PascalCase for class files (`BaseView.js`), camelCase otherwise
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Classes**: PascalCase
- **Private members**: prefix with underscore (`_privateMethod`)

### Code Formatting
- Use 2 spaces for indentation
- No trailing whitespace
- Maximum line length: 100 characters
- Use semicolons
- Prefer single quotes for strings

### Error Handling
- Use the centralized logger from `@/utils/logger.js`
- Always include context objects in logs: `logger.error('API call failed', { endpoint, error })`
- Use `handleApiError` from `@/utils/errorHandler.js` for API errors
- Never log sensitive data (API keys, passwords) - logger auto-redacts these

```javascript
import { logger } from '@/utils/logger.js';
import { handleApiError } from '@/utils/errorHandler.js';

try {
  const result = await apiCall();
  logger.info('API call successful', { endpoint });
  return result;
} catch (error) {
  logger.error('API call failed', { endpoint, error: error.message });
  throw new Error(handleApiError(error));
}
```

### Testing Patterns
- Unit tests: Use Vitest with jsdom environment
- Test files: `*.test.js` suffix, co-located with source files
- Use descriptive test names with `describe` and `it`
- Mock external dependencies using `vi.mock()`

```javascript
import { describe, it, expect, vi } from 'vitest';
import { isFeatureEnabled } from './features.js';

describe('Feature Flags', () => {
  it('should return true for enabled features', () => {
    expect(isFeatureEnabled('SHOW_ADS')).toBe(true);
  });
});
```

### Architecture Rules
The project enforces strict layer boundaries via dependency-cruiser:

**Views Layer (`src/views/`)**
- ✅ Can import: Components, Services, Core utilities, State
- ❌ Cannot import: Other Views (except BaseView), API layer, Database

**Components Layer (`src/components/`)**
- ✅ Can import: Core utilities, State
- ❌ Cannot import: API layer, Services (should be presentational)

**Services Layer (`src/services/`)**
- ✅ Can import: API layer, Database, Core utilities
- ❌ Cannot import: Views

**API Layer (`src/api/`)**
- ✅ Can import: Core utilities
- ❌ Cannot import: Database (should receive credentials as parameters)

### Feature Flags
Use the feature flag system for gradual rollouts:

```javascript
import { isFeatureEnabled } from '@/core/features.js';

if (isFeatureEnabled('SHOW_ADS', 'home')) {
  // Show ads on home page
}
```

Available phases: `DISABLED`, `SETTINGS_ONLY`, `ENABLED`

### State Management
- Use global state from `@/core/state.js` for app-wide state
- Use IndexedDB via `@/core/db.js` for persistent storage
- Keep component state local when possible

### Internationalization
- Use i18next for translations
- Import translation function: `import { t } from '@/core/i18n.js';`
- Wrap user-facing strings: `t('quiz.start_button')`

### Performance Guidelines
- Lazy load views and heavy modules
- Use performance monitoring: `logger.perf('operation_name', { duration })`
- Track user actions: `logger.action('button_clicked', { button: 'start' })`
- Optimize bundle size: avoid importing large libraries unnecessarily

### Security Best Practices
- Never expose API keys in client-side code
- Use `textContent` instead of `innerHTML` when possible
- Sanitize user input before storage/display
- Use HTTPS for all API calls

### Git Workflow
- Create feature branches from `main`
- Use descriptive commit messages
- Run tests before committing: `npm test && npm run typecheck`
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`

### Environment Configuration
- Development: Use mock API (`VITE_USE_REAL_API=false`)
- Production: Use real API (`VITE_USE_REAL_API=true`)
- Environment variables: Prefix with `VITE_` for client-side access

### Documentation
- Use JSDoc comments for public APIs
- Document complex algorithms with inline comments
- Update learning notes in `docs/learning/` when implementing features

## Testing Requirements

Before submitting changes:
1. Run unit tests: `npm test`
2. Run type checking: `npm run typecheck`
3. Run architecture validation: `npm run arch:test`
4. For UI changes: Run E2E tests: `npm run test:e2e`
5. Check for unused code: `npm run lint:dead-code`

All tests must pass before merging.