# Phase 2: Frontend Provider Router

**Epic:** 11 - Multi-Provider LLM Support
**Status:** Not Started
**Effort:** 2-3 days
**Prerequisites:** Phase 1 complete (backend proxy deployed)

---

## Goal

Create the frontend provider router that reads the active provider from settings and routes LLM calls appropriately - direct to OpenRouter or through the backend proxy for other providers.

---

## Branch & Commit Strategy

### Branch Naming

```
feature/epic11-phase2-provider-router
```

### Implementation Order

```
main (with Phase 1 merged)
  │
  └── feature/epic11-phase2-provider-router
        ├── commit: feat(llm): add feature flag MULTI_PROVIDER_LLM
        ├── commit: feat(llm): add providers config
        ├── commit: feat(llm): add provider settings service
        ├── commit: feat(llm): add provider router
        ├── commit: refactor(llm): update api.real.js to use router
        ├── commit: test(llm): add unit tests for provider router
        ├── commit: test(llm): add unit tests for providers config
        ├── commit: test(llm): add E2E tests for provider routing
        └── PR → merge to main
```

### Commit Message Format

```
feat(llm): add provider router

- Route OpenRouter calls directly (CORS supported)
- Route other providers through backend proxy
- Read active provider from settings
- Support configurable max_tokens and temperature

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Commit Prefixes

| Type | Scope | Example |
|------|-------|---------|
| Feature | `llm` | `feat(llm): add provider router` |
| Refactor | `llm` | `refactor(llm): update api.real.js to use router` |
| Test | `llm` | `test(llm): add unit tests for provider router` |

---

## Feature Flag

### Add Feature Flag

**File:** `src/core/features.js`

```javascript
export const FEATURE_FLAGS = {
  // ... existing flags ...

  MULTI_PROVIDER_LLM: {
    phase: 'DISABLED',  // Start disabled for safe deployment
    description: 'Allow users to configure and use multiple LLM providers'
  }
};
```

### Flag Lifecycle

| Phase | Behavior |
|-------|----------|
| `DISABLED` | New provider router code deployed but inactive. OpenRouter used directly (existing behavior). |
| `SETTINGS_ONLY` | Settings UI shows multi-provider options. Can configure but not use yet. |
| `ENABLED` | Full functionality. Provider selection active. |

### Usage in Code

```javascript
import { isFeatureEnabled } from '../core/features.js';

// In provider-router.js
export async function completion(messages, options = {}) {
  // If feature disabled, use OpenRouter directly (existing behavior)
  if (!isFeatureEnabled('MULTI_PROVIDER_LLM')) {
    return await callOpenRouterLegacy(messages, options);
  }

  // New multi-provider logic
  const providerId = await getActiveProvider();
  // ...
}
```

### Flag Documentation

Create `docs/learning/epic10_hygiene/FLAG_MULTI_PROVIDER_LLM.md` for future cleanup reference.

---

## Tasks

### 2.1 Create Provider Configuration

**File:** `src/api/providers-config.js`

```javascript
/**
 * Provider configuration
 * Defines supported providers and their properties
 */

export const PROVIDERS = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access multiple AI models via OpenRouter',
    cors: true,  // Can call directly from browser
    keyPrefix: 'sk-or-',
    keyPattern: /^sk-or-v1-[a-zA-Z0-9]+$/,
    docsUrl: 'https://openrouter.ai/keys',
    models: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', inputPrice: 3.00, outputPrice: 15.00 },
      { id: 'openai/gpt-4o', name: 'GPT-4o', inputPrice: 2.50, outputPrice: 10.00 },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', inputPrice: 0.15, outputPrice: 0.60 },
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', inputPrice: 0, outputPrice: 0 },
      { id: 'meta-llama/llama-3.1-70b-instruct:free', name: 'Llama 3.1 70B (Free)', inputPrice: 0, outputPrice: 0 }
    ],
    defaultModel: 'anthropic/claude-3.5-sonnet'
  },

  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'Direct access to GPT models',
    cors: false,  // Requires backend proxy
    keyPrefix: 'sk-',
    keyPattern: /^sk-[a-zA-Z0-9]+$/,
    docsUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', inputPrice: 2.50, outputPrice: 10.00 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', inputPrice: 0.15, outputPrice: 0.60 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', inputPrice: 10.00, outputPrice: 30.00 },
      { id: 'o1-preview', name: 'O1 Preview', inputPrice: 15.00, outputPrice: 60.00 }
    ],
    defaultModel: 'gpt-4o-mini'
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Direct access to Claude models',
    cors: false,
    keyPrefix: 'sk-ant-',
    keyPattern: /^sk-ant-[a-zA-Z0-9-]+$/,
    docsUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', inputPrice: 3.00, outputPrice: 15.00 },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', inputPrice: 3.00, outputPrice: 15.00 },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', inputPrice: 15.00, outputPrice: 75.00 },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', inputPrice: 0.25, outputPrice: 1.25 }
    ],
    defaultModel: 'claude-sonnet-4-20250514'
  },

  google: {
    id: 'google',
    name: 'Google AI',
    description: 'Direct access to Gemini models',
    cors: false,
    keyPrefix: 'AIza',
    keyPattern: /^AIza[a-zA-Z0-9_-]+$/,
    docsUrl: 'https://aistudio.google.com/apikey',
    freeTier: true,
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', inputPrice: 0.075, outputPrice: 0.30 },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', inputPrice: 1.25, outputPrice: 5.00 },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', inputPrice: 0.075, outputPrice: 0.30 }
    ],
    defaultModel: 'gemini-2.5-flash'
  },

  xai: {
    id: 'xai',
    name: 'xAI',
    description: 'Direct access to Grok models',
    cors: false,
    keyPrefix: 'xai-',
    keyPattern: /^xai-[a-zA-Z0-9]+$/,
    docsUrl: 'https://console.x.ai',
    models: [
      { id: 'grok-4-fast', name: 'Grok 4 Fast', inputPrice: 0.20, outputPrice: 0.50 },
      { id: 'grok-3', name: 'Grok 3', inputPrice: 3.00, outputPrice: 15.00 }
    ],
    defaultModel: 'grok-4-fast'
  }
};

/**
 * Get provider by ID
 */
export function getProvider(providerId) {
  return PROVIDERS[providerId] || null;
}

/**
 * Get all providers
 */
export function getAllProviders() {
  return Object.values(PROVIDERS);
}

/**
 * Check if provider supports direct browser calls
 */
export function supportsCors(providerId) {
  const provider = getProvider(providerId);
  return provider?.cors ?? false;
}

/**
 * Validate API key format
 */
export function validateKeyFormat(providerId, key) {
  const provider = getProvider(providerId);
  if (!provider) return false;
  return provider.keyPattern.test(key);
}

/**
 * Calculate estimated cost for a request
 */
export function estimateCost(providerId, modelId, inputTokens, outputTokens) {
  const provider = getProvider(providerId);
  if (!provider) return null;

  const model = provider.models.find(m => m.id === modelId);
  if (!model) return null;

  const inputCost = (inputTokens / 1_000_000) * model.inputPrice;
  const outputCost = (outputTokens / 1_000_000) * model.outputPrice;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost
  };
}
```

---

### 2.2 Create Provider Router

**File:** `src/api/provider-router.js`

```javascript
/**
 * Provider Router
 * Routes LLM calls to appropriate provider (direct or via proxy)
 */

import { callOpenRouter } from './openrouter-client.js';
import { getProvider, supportsCors } from './providers-config.js';
import { getActiveProvider, getActiveModel, getProviderKey } from '../services/provider-settings-service.js';
import { logger } from '../utils/logger.js';

const LLM_PROXY_URL = 'https://saberloop.com/llm/completion.php';

/**
 * Make an LLM completion request using the active provider
 */
export async function completion(messages, options = {}) {
  const providerId = await getActiveProvider();
  const modelId = await getActiveModel();
  const apiKey = await getProviderKey(providerId);

  if (!apiKey) {
    throw new Error(`No API key configured for ${providerId}`);
  }

  logger.debug(`LLM request via ${providerId} (${modelId})`);

  if (supportsCors(providerId)) {
    // Direct call (OpenRouter)
    return await callDirect(providerId, apiKey, messages, modelId, options);
  } else {
    // Via backend proxy
    return await callViaProxy(providerId, apiKey, messages, modelId, options);
  }
}

/**
 * Direct call to provider (OpenRouter only)
 */
async function callDirect(providerId, apiKey, messages, modelId, options) {
  if (providerId !== 'openrouter') {
    throw new Error(`Direct calls not supported for ${providerId}`);
  }

  const result = await callOpenRouter(apiKey, messages, {
    model: modelId,
    maxTokens: options.maxTokens || 2048,
    temperature: options.temperature || 0.7
  });

  return {
    text: result.text,
    model: result.model,
    provider: 'openrouter',
    usage: result.usage
  };
}

/**
 * Call via backend proxy (OpenAI, Anthropic, Google, xAI)
 */
async function callViaProxy(providerId, apiKey, messages, modelId, options) {
  const response = await fetch(LLM_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider: providerId,
      api_key: apiKey,
      model: modelId,
      messages: messages,
      options: {
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7
      }
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Provider error: ${response.status}`);
  }

  const result = await response.json();

  return {
    text: result.text,
    model: result.model,
    provider: result.provider,
    usage: result.usage
  };
}
```

---

### 2.3 Create Provider Settings Service

**File:** `src/services/provider-settings-service.js`

```javascript
/**
 * Provider Settings Service
 * Manages active provider selection and API keys
 */

import { db } from '../core/db.js';

const SETTINGS_KEYS = {
  ACTIVE_PROVIDER: 'llm_active_provider',
  ACTIVE_MODEL: 'llm_active_model',
  PROVIDER_KEY_PREFIX: 'llm_key_'
};

const DEFAULT_PROVIDER = 'openrouter';

/**
 * Get active provider ID
 */
export async function getActiveProvider() {
  const setting = await db.settings.get(SETTINGS_KEYS.ACTIVE_PROVIDER);
  return setting?.value || DEFAULT_PROVIDER;
}

/**
 * Set active provider
 */
export async function setActiveProvider(providerId) {
  await db.settings.put({
    key: SETTINGS_KEYS.ACTIVE_PROVIDER,
    value: providerId
  });
}

/**
 * Get active model for current provider
 */
export async function getActiveModel() {
  const setting = await db.settings.get(SETTINGS_KEYS.ACTIVE_MODEL);
  return setting?.value || null;
}

/**
 * Set active model
 */
export async function setActiveModel(modelId) {
  await db.settings.put({
    key: SETTINGS_KEYS.ACTIVE_MODEL,
    value: modelId
  });
}

/**
 * Get API key for a provider
 */
export async function getProviderKey(providerId) {
  const key = SETTINGS_KEYS.PROVIDER_KEY_PREFIX + providerId;
  const setting = await db.settings.get(key);
  return setting?.value || null;
}

/**
 * Set API key for a provider
 */
export async function setProviderKey(providerId, apiKey) {
  const key = SETTINGS_KEYS.PROVIDER_KEY_PREFIX + providerId;
  await db.settings.put({
    key: key,
    value: apiKey
  });
}

/**
 * Remove API key for a provider
 */
export async function removeProviderKey(providerId) {
  const key = SETTINGS_KEYS.PROVIDER_KEY_PREFIX + providerId;
  await db.settings.delete(key);
}

/**
 * Check if a provider has a key configured
 */
export async function hasProviderKey(providerId) {
  const key = await getProviderKey(providerId);
  return !!key;
}

/**
 * Get list of configured providers (with keys)
 */
export async function getConfiguredProviders() {
  const allSettings = await db.settings.toArray();
  const keyPrefix = SETTINGS_KEYS.PROVIDER_KEY_PREFIX;

  return allSettings
    .filter(s => s.key.startsWith(keyPrefix) && s.value)
    .map(s => s.key.replace(keyPrefix, ''));
}
```

---

### 2.4 Update api.real.js to Use Router

**File:** `src/api/api.real.js` (modifications)

```javascript
// Add import at top
import { completion } from './provider-router.js';

// Update generateQuestions function
export async function generateQuestions(topic, gradeLevel, apiKey, options = {}) {
  const { previousQuestions = [], language = 'en', questionCount = 5 } = options;

  const prompt = buildQuestionPrompt(topic, gradeLevel, previousQuestions, language, questionCount);

  const messages = [
    { role: 'user', content: prompt }
  ];

  // Use provider router instead of direct OpenRouter call
  const result = await completion(messages, {
    maxTokens: 2048,
    temperature: 0.7
  });

  const data = extractJSON(result.text);

  return {
    language: data.language || 'EN-US',
    questions: data.questions,
    model: result.model,
    provider: result.provider,
    usage: result.usage
  };
}

// Update generateExplanation function similarly
export async function generateExplanation(question, userAnswer, correctAnswer, gradeLevel) {
  const prompt = buildExplanationPrompt(question, userAnswer, correctAnswer, gradeLevel);

  const messages = [
    { role: 'user', content: prompt }
  ];

  const result = await completion(messages, {
    maxTokens: 512,
    temperature: 0.7
  });

  return {
    explanation: result.text,
    model: result.model,
    provider: result.provider,
    usage: result.usage
  };
}
```

---

## Testing

### Unit Tests

**File:** `tests/unit/provider-router.test.js`

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { completion } from '../../src/api/provider-router.js';
import * as providerSettings from '../../src/services/provider-settings-service.js';
import * as openrouterClient from '../../src/api/openrouter-client.js';

// Mock modules
vi.mock('../../src/services/provider-settings-service.js');
vi.mock('../../src/api/openrouter-client.js');

describe('Provider Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('OpenRouter (direct)', () => {
    it('should call OpenRouter directly when selected', async () => {
      providerSettings.getActiveProvider.mockResolvedValue('openrouter');
      providerSettings.getActiveModel.mockResolvedValue('anthropic/claude-3.5-sonnet');
      providerSettings.getProviderKey.mockResolvedValue('sk-or-test-key');

      openrouterClient.callOpenRouter.mockResolvedValue({
        text: 'Hello!',
        model: 'anthropic/claude-3.5-sonnet',
        usage: { prompt_tokens: 10, completion_tokens: 5 }
      });

      const result = await completion([{ role: 'user', content: 'Hi' }]);

      expect(openrouterClient.callOpenRouter).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.provider).toBe('openrouter');
    });
  });

  describe('Other providers (via proxy)', () => {
    it('should call backend proxy for OpenAI', async () => {
      providerSettings.getActiveProvider.mockResolvedValue('openai');
      providerSettings.getActiveModel.mockResolvedValue('gpt-4o-mini');
      providerSettings.getProviderKey.mockResolvedValue('sk-test-key');

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          text: 'Hello!',
          model: 'gpt-4o-mini',
          provider: 'openai',
          usage: { prompt_tokens: 10, completion_tokens: 5 }
        })
      });

      const result = await completion([{ role: 'user', content: 'Hi' }]);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/llm/completion.php'),
        expect.objectContaining({
          method: 'POST'
        })
      );
      expect(openrouterClient.callOpenRouter).not.toHaveBeenCalled();
      expect(result.provider).toBe('openai');
    });
  });

  describe('Error handling', () => {
    it('should throw error when no API key configured', async () => {
      providerSettings.getActiveProvider.mockResolvedValue('openai');
      providerSettings.getProviderKey.mockResolvedValue(null);

      await expect(completion([{ role: 'user', content: 'Hi' }]))
        .rejects.toThrow('No API key configured');
    });

    it('should throw error when proxy returns error', async () => {
      providerSettings.getActiveProvider.mockResolvedValue('anthropic');
      providerSettings.getActiveModel.mockResolvedValue('claude-3.5-sonnet');
      providerSettings.getProviderKey.mockResolvedValue('sk-ant-test');

      global.fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid API key' })
      });

      await expect(completion([{ role: 'user', content: 'Hi' }]))
        .rejects.toThrow('Invalid API key');
    });
  });
});
```

**File:** `tests/unit/providers-config.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import {
  getProvider,
  supportsCors,
  validateKeyFormat,
  estimateCost
} from '../../src/api/providers-config.js';

describe('Providers Config', () => {
  describe('getProvider', () => {
    it('returns provider by ID', () => {
      const provider = getProvider('openai');
      expect(provider.name).toBe('OpenAI');
    });

    it('returns null for unknown provider', () => {
      expect(getProvider('unknown')).toBeNull();
    });
  });

  describe('supportsCors', () => {
    it('returns true for OpenRouter', () => {
      expect(supportsCors('openrouter')).toBe(true);
    });

    it('returns false for other providers', () => {
      expect(supportsCors('openai')).toBe(false);
      expect(supportsCors('anthropic')).toBe(false);
      expect(supportsCors('google')).toBe(false);
      expect(supportsCors('xai')).toBe(false);
    });
  });

  describe('validateKeyFormat', () => {
    it('validates OpenRouter key format', () => {
      expect(validateKeyFormat('openrouter', 'sk-or-v1-abc123')).toBe(true);
      expect(validateKeyFormat('openrouter', 'invalid')).toBe(false);
    });

    it('validates OpenAI key format', () => {
      expect(validateKeyFormat('openai', 'sk-abc123')).toBe(true);
      expect(validateKeyFormat('openai', 'invalid')).toBe(false);
    });
  });

  describe('estimateCost', () => {
    it('calculates cost correctly', () => {
      const cost = estimateCost('openai', 'gpt-4o-mini', 1000, 500);
      expect(cost.inputCost).toBeCloseTo(0.00015);
      expect(cost.outputCost).toBeCloseTo(0.0003);
    });
  });
});
```

**File:** `tests/unit/provider-settings-service.test.js`

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getActiveProvider,
  setActiveProvider,
  getProviderKey,
  setProviderKey,
  hasProviderKey,
  getConfiguredProviders
} from '../../src/services/provider-settings-service.js';
import { db } from '../../src/core/db.js';

vi.mock('../../src/core/db.js');

describe('Provider Settings Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActiveProvider', () => {
    it('returns default provider when not set', async () => {
      db.settings.get.mockResolvedValue(null);
      const provider = await getActiveProvider();
      expect(provider).toBe('openrouter');
    });

    it('returns stored provider', async () => {
      db.settings.get.mockResolvedValue({ value: 'openai' });
      const provider = await getActiveProvider();
      expect(provider).toBe('openai');
    });
  });

  describe('setActiveProvider', () => {
    it('stores provider in db', async () => {
      await setActiveProvider('anthropic');
      expect(db.settings.put).toHaveBeenCalledWith({
        key: 'llm_active_provider',
        value: 'anthropic'
      });
    });
  });

  describe('getProviderKey', () => {
    it('returns null when no key stored', async () => {
      db.settings.get.mockResolvedValue(null);
      const key = await getProviderKey('openai');
      expect(key).toBeNull();
    });

    it('returns stored key', async () => {
      db.settings.get.mockResolvedValue({ value: 'sk-test-key' });
      const key = await getProviderKey('openai');
      expect(key).toBe('sk-test-key');
    });
  });

  describe('hasProviderKey', () => {
    it('returns false when no key', async () => {
      db.settings.get.mockResolvedValue(null);
      expect(await hasProviderKey('openai')).toBe(false);
    });

    it('returns true when key exists', async () => {
      db.settings.get.mockResolvedValue({ value: 'sk-key' });
      expect(await hasProviderKey('openai')).toBe(true);
    });
  });

  describe('getConfiguredProviders', () => {
    it('returns list of providers with keys', async () => {
      db.settings.toArray.mockResolvedValue([
        { key: 'llm_key_openai', value: 'sk-key1' },
        { key: 'llm_key_anthropic', value: 'sk-key2' },
        { key: 'other_setting', value: 'foo' }
      ]);

      const providers = await getConfiguredProviders();
      expect(providers).toEqual(['openai', 'anthropic']);
    });
  });
});
```

### E2E Tests

**File:** `tests/e2e/provider-routing.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Provider Routing', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/app/');
  });

  test('uses OpenRouter by default (feature flag disabled)', async ({ page }) => {
    // Feature flag is DISABLED by default, should use existing OpenRouter behavior
    // Set up mock OpenRouter token
    await page.evaluate(() => {
      localStorage.setItem('openrouter_token', 'test-token');
    });

    await page.reload();

    // Create a quiz and verify it works
    await page.click('[data-testid="create-quiz-button"]');
    await page.fill('[data-testid="topic-input"]', 'Test Topic');

    // Should not show provider selector when feature is disabled
    await expect(page.locator('[data-testid="provider-selector"]')).not.toBeVisible();
  });

  test('shows provider options when feature flag enabled', async ({ page }) => {
    // Enable feature flag via localStorage override
    await page.evaluate(() => {
      localStorage.setItem('__test_feature_MULTI_PROVIDER_LLM', 'ENABLED');
    });

    await page.reload();

    // Navigate to settings
    await page.click('[data-testid="settings-button"]');

    // Should see LLM Providers section
    await expect(page.locator('text=LLM Providers')).toBeVisible();
  });

  test('feature flag can be overridden for testing', async ({ page }) => {
    // Test the localStorage override mechanism
    await page.evaluate(() => {
      localStorage.setItem('__test_feature_MULTI_PROVIDER_LLM', 'ENABLED');
    });

    const isEnabled = await page.evaluate(() => {
      // This would be imported in real app
      const override = localStorage.getItem('__test_feature_MULTI_PROVIDER_LLM');
      return override === 'ENABLED';
    });

    expect(isEnabled).toBe(true);
  });

});

test.describe('Provider Routing Integration @integration', () => {

  // These tests require the backend proxy to be deployed
  // Run with: npm run test:e2e -- --grep @integration

  test.skip(({ }, testInfo) => !process.env.RUN_INTEGRATION_TESTS, 'Requires RUN_INTEGRATION_TESTS=true');

  test('routes to OpenRouter directly', async ({ page, request }) => {
    // Enable feature and set OpenRouter as active
    await page.evaluate(() => {
      localStorage.setItem('__test_feature_MULTI_PROVIDER_LLM', 'ENABLED');
      localStorage.setItem('openrouter_token', process.env.TEST_OPENROUTER_KEY || 'test');
    });

    // Intercept network request to verify routing
    const routePromise = page.waitForRequest(req =>
      req.url().includes('openrouter.ai')
    );

    // Trigger an LLM call (e.g., generate quiz)
    // ... test implementation depends on UI
  });

  test('routes to proxy for non-CORS providers', async ({ page }) => {
    // Enable feature and set OpenAI as active
    await page.evaluate(async () => {
      localStorage.setItem('__test_feature_MULTI_PROVIDER_LLM', 'ENABLED');

      // Set up IndexedDB with OpenAI provider
      const request = indexedDB.open('saberloop');
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('settings', 'readwrite');
        tx.objectStore('settings').put({ key: 'llm_active_provider', value: 'openai' });
        tx.objectStore('settings').put({ key: 'llm_key_openai', value: 'sk-test' });
      };
    });

    // Intercept network request to verify proxy routing
    const routePromise = page.waitForRequest(req =>
      req.url().includes('saberloop.com/llm/completion.php')
    );

    // Trigger an LLM call
    // ... test implementation depends on UI
  });

});
```

### Feature Flag Tests

**File:** `tests/unit/features-multi-provider.test.js`

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isFeatureEnabled, FEATURE_FLAGS } from '../../src/core/features.js';

describe('MULTI_PROVIDER_LLM Feature Flag', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('flag exists in FEATURE_FLAGS', () => {
    expect(FEATURE_FLAGS.MULTI_PROVIDER_LLM).toBeDefined();
    expect(FEATURE_FLAGS.MULTI_PROVIDER_LLM.description).toContain('LLM provider');
  });

  it('returns false when DISABLED', () => {
    // Assuming default phase is DISABLED
    expect(isFeatureEnabled('MULTI_PROVIDER_LLM')).toBe(false);
  });

  it('can be overridden via localStorage for testing', () => {
    localStorage.setItem('__test_feature_MULTI_PROVIDER_LLM', 'ENABLED');
    expect(isFeatureEnabled('MULTI_PROVIDER_LLM')).toBe(true);
  });

  it('localStorage override takes precedence', () => {
    localStorage.setItem('__test_feature_MULTI_PROVIDER_LLM', 'DISABLED');
    expect(isFeatureEnabled('MULTI_PROVIDER_LLM')).toBe(false);

    localStorage.setItem('__test_feature_MULTI_PROVIDER_LLM', 'ENABLED');
    expect(isFeatureEnabled('MULTI_PROVIDER_LLM')).toBe(true);
  });
});
```

---

## Local Testing

### 1. Run Unit Tests

```bash
# Run all unit tests including new provider tests
npm test

# Run specific provider tests
npm test -- provider-router
npm test -- providers-config
npm test -- provider-settings-service
npm test -- features-multi-provider
```

### 2. Test with Dev Server

```bash
# Start development server
npm run dev

# In browser console, enable feature flag for testing
localStorage.setItem('__test_feature_MULTI_PROVIDER_LLM', 'ENABLED');
location.reload();

# Verify:
# - Provider router falls back to OpenRouter when flag DISABLED
# - Provider router uses settings when flag ENABLED
# - OpenRouter calls go directly (check Network tab)
# - Other providers route through /llm/completion.php
```

### 3. Test with Backend Proxy

```bash
# Start Docker containers (Phase 1 must be complete)
docker-compose -f docker-compose.php.yml up -d php-api mysql

# Test routing to proxy (requires feature flag enabled)
# Set up a non-OpenRouter provider in IndexedDB
# Verify requests go to localhost:8080/llm/completion.php
```

---

## Deployment Workflow

### Step 1: Local Testing (Required)

Complete all local testing steps above. Verify:
- [ ] Unit tests pass
- [ ] Feature flag correctly controls behavior
- [ ] OpenRouter routing works (direct)
- [ ] Proxy routing works (via localhost:8080/llm/)

### Step 2: Deploy to Staging

```bash
# Build for staging
npm run build:staging

# Deploy to staging
npm run deploy:staging
```

### Step 3: Test Staging with Feature Flag ENABLED

```bash
# Visit staging
# https://saberloop.com/app-staging/

# In browser console, enable feature flag
localStorage.setItem('__test_feature_MULTI_PROVIDER_LLM', 'ENABLED');
location.reload();
```

**Staging Verification Checklist:**
- [ ] Feature flag override works
- [ ] OpenRouter (default) still works
- [ ] Provider settings are stored/retrieved correctly
- [ ] Existing quiz generation works unchanged when flag DISABLED

### Step 4: Run E2E Tests on Staging

```bash
# Run E2E tests against staging
PLAYWRIGHT_BASE_URL=https://saberloop.com/app-staging/ npm run test:e2e
```

### Step 5: Deploy to Production (with SETTINGS_ONLY)

After staging verification passes:

```bash
# Update features.js to SETTINGS_ONLY (not ENABLED yet)
# This allows testing settings UI in production without affecting quiz generation

# Build for production
npm run build

# Deploy to production
npm run deploy
```

**Production Verification:**
- [ ] Feature flag is `SETTINGS_ONLY`
- [ ] Settings UI NOT visible yet (Phase 4)
- [ ] Existing OpenRouter quiz generation works unchanged
- [ ] No errors in telemetry

### Rollback (if needed)

If issues in production:
1. Set feature flag back to `DISABLED` in `features.js`
2. Rebuild and redeploy
3. Existing OpenRouter behavior is preserved

---

## Acceptance Criteria

- [ ] Feature flag `MULTI_PROVIDER_LLM` added to `features.js`
- [ ] Feature flag documentation created in `epic10_hygiene/FLAG_MULTI_PROVIDER_LLM.md`
- [ ] Provider router created and working
- [ ] OpenRouter calls go direct (no proxy)
- [ ] Other providers route through backend proxy
- [ ] Provider settings service stores/retrieves settings
- [ ] api.real.js uses provider router
- [ ] Feature flag controls new vs legacy behavior
- [ ] All unit tests pass (provider router, providers config, settings service, feature flag)
- [ ] All E2E tests pass (provider routing, feature flag override)
- [ ] Existing functionality still works with OpenRouter when flag DISABLED

---

## Notes

- Provider router is stateless - reads settings on each call
- Backend proxy URL is hardcoded for now
- OpenRouter key migration handled in Phase 3

---

## Related Documentation

### Developer Guides
- [Staging Deployment](../../developer-guide/STAGING_DEPLOYMENT.md) - Staging workflow reference
- [E2E Testing](../../developer-guide/E2E_TESTING.md) - Playwright testing patterns
- [Unit Testing](../../developer-guide/UNIT_TESTING.md) - Vitest testing patterns
- [Configuration](../../developer-guide/CONFIGURATION.md) - Environment variables

### Architecture
- [LLM Integration Evolution](../../architecture/LLM_INTEGRATION_EVOLUTION.md) - Historical context
- [API Design](../../architecture/API_DESIGN.md) - API patterns

### Epic 11 Documents
- [EPIC11_LLM_SUPPORT_PLAN.md](./EPIC11_LLM_SUPPORT_PLAN.md) - Main plan overview
- [PHASE1_BACKEND_PROXY.md](./PHASE1_BACKEND_PROXY.md) - Backend proxy (prerequisite)

---

*Previous: [PHASE1_BACKEND_PROXY.md](./PHASE1_BACKEND_PROXY.md)*
*Next: [PHASE3_KEY_MANAGEMENT.md](./PHASE3_KEY_MANAGEMENT.md)*
