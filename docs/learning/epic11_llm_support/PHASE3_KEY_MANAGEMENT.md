# Phase 3: API Key Management

**Epic:** 11 - Multi-Provider LLM Support
**Status:** Not Started
**Effort:** 2-3 days
**Prerequisites:** Phase 2 complete (provider router working)

---

## Goal

Implement API key storage, validation, and management. Include hybrid validation approach (format check on save, async validation in background).

---

## ⚠️ Context Management Reminder

**At ~75% context: STOP, update progress marker in EPIC11_LLM_SUPPORT_PLAN.md, commit, then /clear**

See [LLM Context Management Protocol](./EPIC11_LLM_SUPPORT_PLAN.md#llm-context-management-protocol) for full details.

---

## Branch & Commit Strategy

### Branch Naming

```
feature/epic11-phase3-key-management
```

### Implementation Order

```
main (with Phase 2 merged)
  │
  └── feature/epic11-phase3-key-management
        ├── commit: feat(llm): add api-keys-service with storage and format validation
        ├── commit: feat(llm): add async key validation
        ├── commit: feat(llm): add OpenRouter key migration
        ├── commit: test(llm): add unit tests for api-keys-service
        ├── commit: test(llm): add E2E tests for key management
        ├── commit: test(llm): add Maestro tests for key management
        └── PR → merge to main
```

### Commit Message Format

```
feat(llm): add api-keys-service with storage and format validation

- Implement saveProviderKey with format check
- Add KEY_STATUS enum (NOT_SET, VALIDATING, VALID, INVALID)
- Store keys in IndexedDB with llm_key_ prefix
- Add masked key display utility

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Tasks

### 3.1 Create API Keys Service

**File:** `src/services/api-keys-service.js`

```javascript
/**
 * API Keys Service
 * Handles key storage, validation, and status tracking
 */

import { db } from '../core/db.js';
import { getProvider, validateKeyFormat } from '../api/providers-config.js';
import { logger } from '../utils/logger.js';

const KEY_STATUS = {
  NOT_SET: 'not_set',
  VALIDATING: 'validating',
  VALID: 'valid',
  INVALID: 'invalid'
};

const SETTINGS_KEYS = {
  KEY_PREFIX: 'llm_key_',
  STATUS_PREFIX: 'llm_key_status_'
};

/**
 * Save API key for a provider
 * Validates format, saves key, triggers async validation
 */
export async function saveProviderKey(providerId, apiKey) {
  const provider = getProvider(providerId);
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  // Format validation (sync)
  if (!validateKeyFormat(providerId, apiKey)) {
    throw new Error(`Invalid key format. ${provider.name} keys should start with '${provider.keyPrefix}'`);
  }

  // Save key
  await db.settings.put({
    key: SETTINGS_KEYS.KEY_PREFIX + providerId,
    value: apiKey
  });

  // Set status to validating
  await setKeyStatus(providerId, KEY_STATUS.VALIDATING);

  // Trigger async validation
  validateKeyAsync(providerId, apiKey);

  return { status: KEY_STATUS.VALIDATING };
}

/**
 * Get API key for a provider
 */
export async function getProviderKey(providerId) {
  const setting = await db.settings.get(SETTINGS_KEYS.KEY_PREFIX + providerId);
  return setting?.value || null;
}

/**
 * Remove API key for a provider
 */
export async function removeProviderKey(providerId) {
  await db.settings.delete(SETTINGS_KEYS.KEY_PREFIX + providerId);
  await db.settings.delete(SETTINGS_KEYS.STATUS_PREFIX + providerId);
}

/**
 * Get key status
 */
export async function getKeyStatus(providerId) {
  const setting = await db.settings.get(SETTINGS_KEYS.STATUS_PREFIX + providerId);
  return setting?.value || KEY_STATUS.NOT_SET;
}

/**
 * Set key status
 */
async function setKeyStatus(providerId, status) {
  await db.settings.put({
    key: SETTINGS_KEYS.STATUS_PREFIX + providerId,
    value: status
  });
}

/**
 * Get masked key for display (sk-...7x2Q)
 */
export function getMaskedKey(apiKey) {
  if (!apiKey || apiKey.length < 8) return '***';
  const prefix = apiKey.substring(0, 5);
  const suffix = apiKey.substring(apiKey.length - 4);
  return `${prefix}...${suffix}`;
}

/**
 * Async validation - makes test call to provider
 */
async function validateKeyAsync(providerId, apiKey) {
  try {
    logger.debug(`Validating ${providerId} key...`);

    // Small test request
    const isValid = await testProviderKey(providerId, apiKey);

    if (isValid) {
      await setKeyStatus(providerId, KEY_STATUS.VALID);
      logger.info(`${providerId} key validated successfully`);
    } else {
      await setKeyStatus(providerId, KEY_STATUS.INVALID);
      logger.warn(`${providerId} key validation failed`);
    }
  } catch (error) {
    logger.error(`${providerId} key validation error:`, error);
    await setKeyStatus(providerId, KEY_STATUS.INVALID);
  }
}

/**
 * Test provider key with minimal request
 */
async function testProviderKey(providerId, apiKey) {
  const provider = getProvider(providerId);

  if (provider.cors) {
    // OpenRouter - direct test
    return await testOpenRouterKey(apiKey);
  } else {
    // Other providers - test via proxy
    return await testViaProxy(providerId, apiKey);
  }
}

/**
 * Test OpenRouter key directly
 */
async function testOpenRouterKey(apiKey) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Test other provider keys via proxy
 */
async function testViaProxy(providerId, apiKey) {
  try {
    const response = await fetch('https://saberloop.com/llm/completion.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: providerId,
        api_key: apiKey,
        model: getProvider(providerId).defaultModel,
        messages: [{ role: 'user', content: 'Hi' }],
        options: { max_tokens: 5 }
      })
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Re-validate a key (manual trigger)
 */
export async function revalidateKey(providerId) {
  const apiKey = await getProviderKey(providerId);
  if (!apiKey) {
    throw new Error('No key configured');
  }

  await setKeyStatus(providerId, KEY_STATUS.VALIDATING);
  validateKeyAsync(providerId, apiKey);
}

/**
 * Get all provider statuses
 */
export async function getAllProviderStatuses() {
  const providers = ['openrouter', 'openai', 'anthropic', 'google', 'xai'];
  const statuses = {};

  for (const providerId of providers) {
    const key = await getProviderKey(providerId);
    const status = await getKeyStatus(providerId);

    statuses[providerId] = {
      hasKey: !!key,
      maskedKey: key ? getMaskedKey(key) : null,
      status: key ? status : KEY_STATUS.NOT_SET
    };
  }

  return statuses;
}

export { KEY_STATUS };
```

---

### 3.2 Migrate OpenRouter Key

Handle migration of existing OpenRouter key to new storage format.

**File:** `src/services/api-keys-migration.js`

```javascript
/**
 * API Keys Migration
 * Migrates existing OpenRouter key to new format
 */

import { db } from '../core/db.js';
import { saveProviderKey, getProviderKey } from './api-keys-service.js';
import { logger } from '../utils/logger.js';

const MIGRATION_FLAG = 'llm_keys_migrated_v1';

/**
 * Run migration if needed
 */
export async function migrateApiKeys() {
  const migrated = await db.settings.get(MIGRATION_FLAG);
  if (migrated) {
    return; // Already migrated
  }

  logger.info('Migrating API keys...');

  try {
    // Check for existing OpenRouter key in old location
    const oldKey = await getOldOpenRouterKey();

    if (oldKey) {
      // Check if already in new location
      const newKey = await getProviderKey('openrouter');

      if (!newKey) {
        await saveProviderKey('openrouter', oldKey);
        logger.info('OpenRouter key migrated to new storage');
      }
    }

    // Mark migration complete
    await db.settings.put({
      key: MIGRATION_FLAG,
      value: true
    });

    logger.info('API key migration complete');
  } catch (error) {
    logger.error('API key migration failed:', error);
    // Don't fail - user can re-add key manually
  }
}

/**
 * Get OpenRouter key from old storage location
 */
async function getOldOpenRouterKey() {
  // Check IndexedDB settings
  const setting = await db.settings.get('openrouter_api_key');
  if (setting?.value) {
    return setting.value;
  }

  // Check localStorage (legacy)
  const localStorageKey = localStorage.getItem('openrouter_api_key');
  if (localStorageKey) {
    return localStorageKey;
  }

  return null;
}
```

---

### 3.3 Update Main Entry Point

Add migration call to app initialization.

**File:** `src/main.js` (add to initialization)

```javascript
import { migrateApiKeys } from './services/api-keys-migration.js';

// In initialization function
async function initializeApp() {
  // ... existing initialization ...

  // Migrate API keys (if needed)
  await migrateApiKeys();

  // ... rest of initialization ...
}
```

---

## Testing

### Unit Tests

**File:** `tests/unit/api-keys-service.test.js`

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  saveProviderKey,
  getProviderKey,
  removeProviderKey,
  getKeyStatus,
  getMaskedKey,
  KEY_STATUS
} from '../../src/services/api-keys-service.js';
import { db } from '../../src/core/db.js';

// Mock db
vi.mock('../../src/core/db.js', () => ({
  db: {
    settings: {
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn()
    }
  }
}));

// Mock fetch for validation
global.fetch = vi.fn();

describe('API Keys Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveProviderKey', () => {
    it('should reject invalid key format', async () => {
      await expect(saveProviderKey('openai', 'invalid-key'))
        .rejects.toThrow('Invalid key format');
    });

    it('should save valid key and trigger validation', async () => {
      db.settings.put.mockResolvedValue();
      global.fetch.mockResolvedValue({ ok: true });

      const result = await saveProviderKey('openai', 'sk-validkey123');

      expect(db.settings.put).toHaveBeenCalled();
      expect(result.status).toBe(KEY_STATUS.VALIDATING);
    });
  });

  describe('getMaskedKey', () => {
    it('should mask key correctly', () => {
      expect(getMaskedKey('sk-1234567890abcdef')).toBe('sk-12...cdef');
    });

    it('should handle short keys', () => {
      expect(getMaskedKey('short')).toBe('***');
    });

    it('should handle null/undefined', () => {
      expect(getMaskedKey(null)).toBe('***');
      expect(getMaskedKey(undefined)).toBe('***');
    });
  });

  describe('removeProviderKey', () => {
    it('should remove key and status', async () => {
      db.settings.delete.mockResolvedValue();

      await removeProviderKey('openai');

      expect(db.settings.delete).toHaveBeenCalledTimes(2);
    });
  });
});
```

### E2E Tests

**File:** `tests/e2e/api-keys.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('API Key Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/');
  });

  test('should store and retrieve API key', async ({ page }) => {
    // Navigate to settings
    await page.click('[data-testid="settings-button"]');

    // Add OpenAI key
    await page.click('[data-testid="add-key-openai"]');
    await page.fill('[data-testid="api-key-input"]', 'sk-test123456789');
    await page.click('[data-testid="save-key-button"]');

    // Verify key is masked
    await expect(page.locator('[data-testid="openai-masked-key"]'))
      .toContainText('sk-te...6789');

    // Verify status shows validating or valid
    await expect(page.locator('[data-testid="openai-status"]'))
      .toHaveText(/Validating|Valid|Invalid/);
  });

  test('should reject invalid key format', async ({ page }) => {
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="add-key-openai"]');
    await page.fill('[data-testid="api-key-input"]', 'invalid-format');
    await page.click('[data-testid="save-key-button"]');

    // Should show format error
    await expect(page.locator('[data-testid="key-error"]'))
      .toContainText('Invalid key format');
  });

  test('should remove API key', async ({ page }) => {
    // First add a key
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="add-key-openai"]');
    await page.fill('[data-testid="api-key-input"]', 'sk-test123456789');
    await page.click('[data-testid="save-key-button"]');

    // Now remove it
    await page.click('[data-testid="remove-key-openai"]');
    await page.click('[data-testid="confirm-remove"]');

    // Verify key is removed
    await expect(page.locator('[data-testid="openai-status"]'))
      .toContainText('Not configured');
  });
});
```

### Maestro Tests

**File:** `tests/maestro/api_key_management.yaml`

```yaml
appId: com.saberloop.app
---
- launchApp

# Navigate to settings
- tapOn:
    id: "settings-button"

# Scroll to LLM Providers section
- scrollUntilVisible:
    element: "LLM Providers"
    direction: DOWN

# Add OpenAI key
- tapOn:
    id: "add-key-openai"

# Enter API key
- inputText:
    id: "api-key-input"
    text: "sk-test123456789"

# Save
- tapOn:
    id: "save-key-button"

# Verify key appears masked
- assertVisible:
    text: "sk-te...6789"

# Verify status indicator
- assertVisible:
    text: "Validating|Valid|Invalid"
    regex: true
```

---

## Acceptance Criteria

- [ ] Keys stored securely in IndexedDB
- [ ] Format validation rejects invalid keys
- [ ] Async validation updates status
- [ ] Masked key display works correctly
- [ ] Key removal works
- [ ] Migration runs for existing OpenRouter keys
- [ ] All unit tests pass
- [ ] E2E tests pass
- [ ] Maestro tests pass

---

## Notes

- Keys are stored in IndexedDB, encrypted at rest by browser
- Validation is async to avoid blocking UI
- Status updates via polling or event system (decide in Phase 4)
- Test requests use minimal tokens to reduce cost

---

## Local Testing

### 1. Run Unit Tests

```bash
# Run all unit tests
npm test

# Run specific key management tests
npm test -- api-keys-service
```

### 2. Test with Dev Server

```bash
# Start development server
npm run dev

# Enable feature flag in browser console
localStorage.setItem('__test_feature_MULTI_PROVIDER_LLM', 'ENABLED');
location.reload();

# Test key operations via browser console:
# - Import and call saveProviderKey()
# - Verify key is stored in IndexedDB
# - Check status changes (validating → valid/invalid)
```

### 3. Test Migration

```bash
# If you have an existing OpenRouter OAuth token, test migration:
# 1. Clear IndexedDB
# 2. Add OpenRouter token to localStorage (as done currently)
# 3. Run migration
# 4. Verify key appears in IndexedDB with status
```

---

## Deployment Workflow

### Step 1: Local Testing (Required)

Complete all local testing steps above. Verify:
- [ ] Unit tests pass
- [ ] Key storage works in IndexedDB
- [ ] Format validation rejects invalid keys
- [ ] Async validation updates status
- [ ] Migration works for existing OpenRouter keys

### Step 2: Deploy to Staging

```bash
npm run build:staging && npm run deploy:staging
```

### Step 3: Test Staging with Feature Flag ENABLED

```bash
# Visit https://saberloop.com/app-staging/
# Enable feature flag in console:
localStorage.setItem('__test_feature_MULTI_PROVIDER_LLM', 'ENABLED');
location.reload();
```

**Staging Verification Checklist:**
- [ ] Key storage works correctly
- [ ] Validation updates status
- [ ] Migration works if OpenRouter token exists
- [ ] No errors in console

### Step 4: Run E2E and Maestro Tests on Staging

```bash
# E2E tests
PLAYWRIGHT_BASE_URL=https://saberloop.com/app-staging/ npm run test:e2e

# Maestro tests (on device/emulator)
maestro test tests/maestro/key_management.yaml
```

### Step 5: Deploy to Production (keep SETTINGS_ONLY)

```bash
npm run build && npm run deploy
```

**Production Verification:**
- [ ] Feature flag remains `SETTINGS_ONLY`
- [ ] No user-visible changes yet
- [ ] Background services ready for Phase 4 UI

---

## Related Documentation

### Developer Guides
- [Staging Deployment](../../developer-guide/STAGING_DEPLOYMENT.md) - Staging workflow reference
- [E2E Testing](../../developer-guide/E2E_TESTING.md) - Playwright testing patterns
- [Unit Testing](../../developer-guide/UNIT_TESTING.md) - Vitest testing patterns
- [Maestro Testing](../../developer-guide/MAESTRO_TESTING.md) - Mobile testing patterns

### Architecture
- [Database Schema](../../architecture/DATABASE_SCHEMA.md) - IndexedDB structure
- [LLM Integration Evolution](../../architecture/LLM_INTEGRATION_EVOLUTION.md) - Historical context

### Epic 11 Documents
- [EPIC11_LLM_SUPPORT_PLAN.md](./EPIC11_LLM_SUPPORT_PLAN.md) - Main plan overview
- [PHASE2_FRONTEND_ROUTER.md](./PHASE2_FRONTEND_ROUTER.md) - Provider router (prerequisite)

---

*Previous: [PHASE2_FRONTEND_ROUTER.md](./PHASE2_FRONTEND_ROUTER.md)*
*Next: [PHASE4_SETTINGS_UI.md](./PHASE4_SETTINGS_UI.md)*
