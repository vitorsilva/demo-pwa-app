# Phase 3: API Key Management

**Epic:** 11 - Multi-Provider LLM Support
**Status:** Complete
**Effort:** 2-3 days
**Prerequisites:** Phase 2 complete (provider router working)

---

## Goal

Extend the existing `provider-settings-service.js` (from Phase 2) with key status tracking and async validation. Include hybrid validation approach (format check on save, async validation in background).

**Important:** Phase 2 already created key storage functions in `provider-settings-service.js`. This phase EXTENDS that service rather than creating a new one to avoid duplication.

---

## Context Management Protocol

See [LLM Context Management Protocol](./EPIC11_LLM_SUPPORT_PLAN.md#llm-context-management-protocol) for full details.

### Subtask Completion Checklist

After completing **ANY** subtask (3.1, 3.2, etc.), STOP and complete this checklist:

```
□ Mark subtask complete in this document (⬚ → ✅)
□ Update Progress Marker below
□ Update PHASE3_LEARNING_NOTES.md with difficulties/solutions/learnings
□ Commit all changes with descriptive message
□ Force new session (/clear or /compact)
□ ONLY THEN start next subtask
```

### Progress Marker

- **Last checkpoint:** Phase 3 COMPLETE - All subtasks finished
- **Current task:** —
- **Completed:** 3.1, 3.2, 3.3, 3.4
- **Next action:** Create PR and merge to main, then begin Phase 4
- **Blockers:** None
- **Session:** January 22, 2026

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
        ├── commit: feat(llm): add key status tracking to provider-settings-service
        ├── commit: feat(llm): add async key validation
        ├── commit: feat(llm): add OpenRouter key migration
        ├── commit: test(llm): add unit tests for key status and validation
        └── PR → merge to main
```

**Note:** E2E and Maestro tests for key management UI will be added in Phase 4 when the Settings UI is implemented. This phase runs all existing tests for regression testing.

### Commit Message Format

```
feat(llm): add key status tracking to provider-settings-service

- Add KEY_STATUS enum (NOT_SET, VALIDATING, VALID, INVALID)
- Add key status tracking with llm_key_status_ prefix
- Add getMaskedKey() utility for display
- Add getAllProviderStatuses() for UI consumption

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

---

## Tasks

### ✅ 3.1 Add Key Status and Validation to provider-settings-service.js

**File:** `src/services/provider-settings-service.js` (EXTEND existing file from Phase 2)

Phase 2 already created this service with:
- `getProviderKey(providerId)` - Get API key
- `setProviderKey(providerId, key)` - Save API key
- `removeProviderKey(providerId)` - Remove API key
- `hasProviderKey(providerId)` - Check if key exists
- `getConfiguredProviders()` - List providers with keys

**Add these new exports to the existing file:**

```javascript
// Add imports at top of file
import { getProvider, validateKeyFormat, getAllProviders } from '../api/providers-config.js';
import { logger } from '../utils/logger.js';

// Add KEY_STATUS enum
export const KEY_STATUS = {
  NOT_SET: 'not_set',
  VALIDATING: 'validating',
  VALID: 'valid',
  INVALID: 'invalid'
};

// Add to SETTINGS_KEYS
const SETTINGS_KEYS = {
  ACTIVE_PROVIDER: 'llm_active_provider',
  ACTIVE_MODEL: 'llm_active_model',
  PROVIDER_KEY_PREFIX: 'llm_key_',
  KEY_STATUS_PREFIX: 'llm_key_status_'  // NEW
};

/**
 * Save API key with format validation and async validation trigger
 * Enhanced version of setProviderKey with validation
 */
export async function saveProviderKeyWithValidation(providerId, apiKey) {
  const provider = getProvider(providerId);
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  // Format validation (sync)
  if (!validateKeyFormat(providerId, apiKey)) {
    throw new Error(`Invalid key format. ${provider.name} keys should start with '${provider.keyPrefix}'`);
  }

  // Save key using existing function
  await setProviderKey(providerId, apiKey);

  // Set status to validating
  await setKeyStatus(providerId, KEY_STATUS.VALIDATING);

  // Trigger async validation (fire and forget)
  validateKeyAsync(providerId, apiKey);

  return { status: KEY_STATUS.VALIDATING };
}

/**
 * Get key status for a provider
 */
export async function getKeyStatus(providerId) {
  const status = await getSetting(SETTINGS_KEYS.KEY_STATUS_PREFIX + providerId);
  return status || KEY_STATUS.NOT_SET;
}

/**
 * Set key status (internal helper)
 */
async function setKeyStatus(providerId, status) {
  await saveSetting(SETTINGS_KEYS.KEY_STATUS_PREFIX + providerId, status);
}

/**
 * Clear key status when removing a key
 * Update existing removeProviderKey to also clear status
 */
export async function removeProviderKeyWithStatus(providerId) {
  await removeProviderKey(providerId);
  await saveSetting(SETTINGS_KEYS.KEY_STATUS_PREFIX + providerId, null);
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
 * Get all provider statuses for UI display
 */
export async function getAllProviderStatuses() {
  const providers = getAllProviders();
  const statuses = {};

  for (const provider of providers) {
    const key = await getProviderKey(provider.id);
    const status = await getKeyStatus(provider.id);

    statuses[provider.id] = {
      hasKey: !!key,
      maskedKey: key ? getMaskedKey(key) : null,
      status: key ? status : KEY_STATUS.NOT_SET
    };
  }

  return statuses;
}

/**
 * Re-validate a key (manual trigger from UI)
 */
export async function revalidateKey(providerId) {
  const apiKey = await getProviderKey(providerId);
  if (!apiKey) {
    throw new Error('No key configured');
  }

  await setKeyStatus(providerId, KEY_STATUS.VALIDATING);
  validateKeyAsync(providerId, apiKey);
}
```

**Verification:**
- Run new unit tests for key status and validation
- Run ALL existing unit tests (1262+) for regression
- Verify key status tracking works

---

#### 🛑 CHECKPOINT: After completing 3.1

Before starting 3.2, complete the [Subtask Completion Checklist](#subtask-completion-checklist).

---

### ✅ 3.2 Add Async Key Validation Functions

**File:** `src/services/provider-settings-service.js` (continue extending)

Add async validation functions that test keys against providers:

```javascript
import { supportsCors } from '../api/providers-config.js';

/**
 * Async validation - makes test call to provider
 * Called after key is saved, updates status when complete
 */
async function validateKeyAsync(providerId, apiKey) {
  try {
    logger.debug(`Validating ${providerId} key...`);

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
  if (supportsCors(providerId)) {
    // OpenRouter - direct test via auth endpoint
    return await testOpenRouterKey(apiKey);
  } else {
    // Other providers - test via proxy with minimal request
    return await testViaProxy(providerId, apiKey);
  }
}

/**
 * Test OpenRouter key directly (CORS supported)
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
 * Test other provider keys via backend proxy
 */
async function testViaProxy(providerId, apiKey) {
  try {
    const provider = getProvider(providerId);
    const response = await fetch('https://saberloop.com/llm/completion.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: providerId,
        api_key: apiKey,
        model: provider.defaultModel,
        messages: [{ role: 'user', content: 'Hi' }],
        options: { max_tokens: 5 }
      })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

**Verification:**
- Run new unit tests for async validation
- Run ALL existing unit tests for regression
- Test validation with a real key (manual verification)

---

#### 🛑 CHECKPOINT: After completing 3.2

Before starting 3.3, complete the [Subtask Completion Checklist](#subtask-completion-checklist).

---

### ✅ 3.3 Migrate OpenRouter Key

Handle migration of existing OpenRouter key to trigger validation status.

**Important Context:** Phase 2's `provider-settings-service.js` already uses the existing `getOpenRouterKey()` and `storeOpenRouterKey()` from `db.js` for backward compatibility. The "migration" here is mainly to:
1. Set initial key status for existing OpenRouter keys
2. Handle any legacy localStorage keys

**File:** `src/services/api-keys-migration.js`

```javascript
/**
 * API Keys Migration
 * Sets up initial key status for existing OpenRouter keys
 */

import { getSetting, saveSetting } from '../core/db.js';
import { getOpenRouterKey } from '../core/db.js';
import { getKeyStatus, KEY_STATUS } from './provider-settings-service.js';
import { logger } from '../utils/logger.js';

const MIGRATION_FLAG = 'llm_keys_migrated_v1';

/**
 * Run migration if needed
 */
export async function migrateApiKeys() {
  const migrated = await getSetting(MIGRATION_FLAG);
  if (migrated) {
    return; // Already migrated
  }

  logger.info('Migrating API keys...');

  try {
    // Check for existing OpenRouter key (uses existing db.js mechanism)
    const existingKey = await getOpenRouterKey();

    if (existingKey) {
      // Check if status already set
      const status = await getKeyStatus('openrouter');

      if (status === KEY_STATUS.NOT_SET) {
        // Set initial status - mark as valid since it was working
        // (User can revalidate if needed)
        await saveSetting('llm_key_status_openrouter', KEY_STATUS.VALID);
        logger.info('OpenRouter key status initialized');
      }
    }

    // Check localStorage for legacy keys (from very old versions)
    const legacyKey = localStorage.getItem('openrouter_api_key');
    if (legacyKey && !existingKey) {
      // Import legacy key to IndexedDB
      const { storeOpenRouterKey } = await import('../core/db.js');
      await storeOpenRouterKey(legacyKey);
      await saveSetting('llm_key_status_openrouter', KEY_STATUS.VALID);
      localStorage.removeItem('openrouter_api_key');
      logger.info('Legacy OpenRouter key migrated from localStorage');
    }

    // Mark migration complete
    await saveSetting(MIGRATION_FLAG, true);

    logger.info('API key migration complete');
  } catch (error) {
    logger.error('API key migration failed:', error);
    // Don't fail app startup - user can re-add key manually
  }
}
```

**Verification:**
- Run migration with existing OpenRouter key, verify status is set
- Run ALL existing tests for regression

---

#### 🛑 CHECKPOINT: After completing 3.3

Before starting 3.4, complete the [Subtask Completion Checklist](#subtask-completion-checklist).

---

### ✅ 3.4 Update Main Entry Point

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

**Verification:**
- Run app initialization, verify migration runs without errors and only once
- Run ALL existing unit tests (1262+) for regression
- Run ALL existing E2E tests (178) for regression

---

#### 🛑 CHECKPOINT: After completing 3.4

Phase 3 complete! Complete the [Subtask Completion Checklist](#subtask-completion-checklist), then proceed to Phase 4.

---

## Testing

### Unit Tests (New)

**File:** `src/services/provider-settings-service.test.js` (extend existing test file)

Add tests for the new key status and validation functionality:

```javascript
// Add to existing provider-settings-service.test.js

import {
  // ... existing imports ...
  getKeyStatus,
  getMaskedKey,
  getAllProviderStatuses,
  saveProviderKeyWithValidation,
  removeProviderKeyWithStatus,
  revalidateKey,
  KEY_STATUS,
} from './provider-settings-service.js';

// Mock fetch for validation tests
global.fetch = vi.fn();

describe('Key Status and Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockReset();
  });

  describe('getKeyStatus', () => {
    it('should return NOT_SET when no status stored', async () => {
      getSetting.mockResolvedValue(null);
      const status = await getKeyStatus('openai');
      expect(status).toBe(KEY_STATUS.NOT_SET);
    });

    it('should return stored status', async () => {
      getSetting.mockResolvedValue(KEY_STATUS.VALID);
      const status = await getKeyStatus('openai');
      expect(status).toBe(KEY_STATUS.VALID);
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

  describe('saveProviderKeyWithValidation', () => {
    it('should reject invalid key format', async () => {
      await expect(saveProviderKeyWithValidation('openai', 'invalid-key'))
        .rejects.toThrow('Invalid key format');
    });

    it('should save valid key and return validating status', async () => {
      getSetting.mockResolvedValue(null);
      saveSetting.mockResolvedValue();
      global.fetch.mockResolvedValue({ ok: true });

      const result = await saveProviderKeyWithValidation('openai', 'sk-validkey123456789');

      expect(saveSetting).toHaveBeenCalled();
      expect(result.status).toBe(KEY_STATUS.VALIDATING);
    });
  });

  describe('removeProviderKeyWithStatus', () => {
    it('should remove key and clear status', async () => {
      saveSetting.mockResolvedValue();

      await removeProviderKeyWithStatus('openai');

      // Should call saveSetting to clear status
      expect(saveSetting).toHaveBeenCalledWith('llm_key_status_openai', null);
    });
  });

  describe('getAllProviderStatuses', () => {
    it('should return status for all providers', async () => {
      getSetting.mockResolvedValue(null);
      getOpenRouterKey.mockResolvedValue(null);

      const statuses = await getAllProviderStatuses();

      expect(statuses).toHaveProperty('openrouter');
      expect(statuses).toHaveProperty('openai');
      expect(statuses).toHaveProperty('anthropic');
      expect(statuses).toHaveProperty('google');
      expect(statuses).toHaveProperty('xai');
    });
  });
});
```

### Regression Testing (Existing Tests)

After completing Phase 3, run ALL existing tests to ensure no regressions:

```bash
# Run all unit tests (should be 1262+ tests)
npm test -- --run

# Run all E2E tests (should be 178 tests)
npm run test:e2e
```

**Note:** E2E and Maestro tests for the key management **UI** will be added in Phase 4 when the Settings UI is implemented. The tests above verify the service layer only.

---

## Acceptance Criteria

- [ ] Key status tracking works (NOT_SET, VALIDATING, VALID, INVALID)
- [ ] Format validation rejects invalid keys
- [ ] Async validation updates status correctly
- [ ] Masked key display works correctly (`getMaskedKey()`)
- [ ] Key removal clears status (`removeProviderKeyWithStatus()`)
- [ ] `getAllProviderStatuses()` returns correct data for UI
- [ ] Migration sets initial status for existing OpenRouter keys
- [ ] All NEW unit tests pass
- [ ] All EXISTING unit tests pass (1262+ - regression)
- [ ] All EXISTING E2E tests pass (178 - regression)

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
# Run all unit tests (including new ones)
npm test -- --run

# Run specific provider settings tests
npm test -- provider-settings-service
```

### 2. Test with Dev Server

```bash
# Start development server
npm run dev

# Test key status operations via browser console:
import {
  saveProviderKeyWithValidation,
  getKeyStatus,
  getMaskedKey,
  getAllProviderStatuses,
  KEY_STATUS
} from './src/services/provider-settings-service.js';

# Test saving a key with validation
await saveProviderKeyWithValidation('openai', 'sk-test123456789012345');

# Check status (should be VALIDATING initially)
await getKeyStatus('openai');

# Test masking
getMaskedKey('sk-test123456789012345'); // 'sk-te...2345'

# Get all statuses for UI
await getAllProviderStatuses();
```

### 3. Test Migration

```bash
# If you have an existing OpenRouter OAuth token:
# 1. Refresh the app
# 2. Migration should run automatically
# 3. Check that llm_key_status_openrouter is set to 'valid'
```

---

## Deployment Workflow

### Step 1: Local Testing (Required)

Complete all local testing steps above. Verify:
- [ ] All new unit tests pass
- [ ] All existing unit tests pass (1262+ - regression)
- [ ] All existing E2E tests pass (178 - regression)
- [ ] Key status tracking works correctly
- [ ] Migration runs successfully for existing OpenRouter keys

### Step 2: Merge to Main

```bash
# Create PR from feature/epic11-phase3-key-management
gh pr create --title "feat(llm): Phase 3 - Key status tracking and validation" --body "..."

# After review, merge to main
```

### Step 3: Deploy to Production

```bash
npm run build && npm run deploy
```

**Production Verification:**
- [ ] Feature flag remains `DISABLED` or `SETTINGS_ONLY`
- [ ] No user-visible changes (no UI yet)
- [ ] Migration runs silently for existing users
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
