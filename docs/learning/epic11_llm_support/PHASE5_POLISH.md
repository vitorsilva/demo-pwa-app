# Phase 5: Polish & Error Handling

**Epic:** 11 - Multi-Provider LLM Support
**Status:** Not Started
**Effort:** 2-3 days
**Prerequisites:** Phase 4 complete (Settings UI working)

---

## Goal

Final polish including comprehensive error handling, edge case management, status indicators in quiz view, and user-facing documentation.

---

## Tasks

### 5.1 Enhanced Error Handling

**File:** `src/services/llm-error-handler.js`

```javascript
/**
 * LLM Error Handler
 * Centralized error handling for all LLM operations
 */

import { i18n } from '../i18n/index.js';
import { logger } from '../utils/logger.js';

export const LLM_ERROR_CODES = {
  // Authentication errors
  INVALID_API_KEY: 'invalid_api_key',
  EXPIRED_API_KEY: 'expired_api_key',
  INSUFFICIENT_CREDITS: 'insufficient_credits',

  // Rate limiting
  RATE_LIMITED: 'rate_limited',
  QUOTA_EXCEEDED: 'quota_exceeded',

  // Network errors
  NETWORK_ERROR: 'network_error',
  TIMEOUT: 'timeout',
  PROXY_ERROR: 'proxy_error',

  // Provider errors
  PROVIDER_ERROR: 'provider_error',
  MODEL_NOT_AVAILABLE: 'model_not_available',
  CONTENT_FILTERED: 'content_filtered',

  // General
  UNKNOWN: 'unknown'
};

/**
 * Parse error from provider response
 */
export function parseProviderError(providerId, error, response) {
  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: LLM_ERROR_CODES.NETWORK_ERROR,
      message: i18n.t('errors.providerNetworkError'),
      retryable: true
    };
  }

  // Handle HTTP status codes
  if (response) {
    const status = response.status;

    if (status === 401) {
      return {
        code: LLM_ERROR_CODES.INVALID_API_KEY,
        message: i18n.t('errors.providerInvalidKey', { provider: providerId }),
        retryable: false
      };
    }

    if (status === 429) {
      const retryAfter = response.headers?.get('retry-after');
      return {
        code: LLM_ERROR_CODES.RATE_LIMITED,
        message: i18n.t('errors.providerRateLimited'),
        retryable: true,
        retryAfter: retryAfter ? parseInt(retryAfter, 10) : 60
      };
    }

    if (status === 402) {
      return {
        code: LLM_ERROR_CODES.INSUFFICIENT_CREDITS,
        message: i18n.t('errors.providerInsufficientCredits', { provider: providerId }),
        retryable: false
      };
    }

    if (status >= 500) {
      return {
        code: LLM_ERROR_CODES.PROVIDER_ERROR,
        message: i18n.t('errors.providerServerError'),
        retryable: true
      };
    }
  }

  // Parse error body if available
  if (error?.error?.type === 'invalid_request_error') {
    return {
      code: LLM_ERROR_CODES.PROVIDER_ERROR,
      message: error.error.message || i18n.t('errors.providerRequestError'),
      retryable: false
    };
  }

  // Default unknown error
  return {
    code: LLM_ERROR_CODES.UNKNOWN,
    message: i18n.t('errors.providerUnknownError'),
    retryable: false
  };
}

/**
 * Handle error with user-friendly messaging
 */
export function handleLLMError(error, context = {}) {
  const { providerId, operation } = context;

  logger.error('LLM operation failed', {
    providerId,
    operation,
    error: error.message || error
  });

  // Parse and return structured error
  const parsed = parseProviderError(providerId, error, error.response);

  return {
    ...parsed,
    providerId,
    operation,
    timestamp: Date.now()
  };
}

/**
 * Retry wrapper for LLM operations
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry = () => {}
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const parsed = parseProviderError(null, error, error.response);

      // Don't retry non-retryable errors
      if (!parsed.retryable || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );

      // Use retry-after header if available
      const actualDelay = parsed.retryAfter
        ? parsed.retryAfter * 1000
        : delay;

      onRetry({ attempt: attempt + 1, delay: actualDelay, error });

      await new Promise(resolve => setTimeout(resolve, actualDelay));
    }
  }

  throw lastError;
}
```

---

### 5.2 Provider Status Indicator in Quiz View

Show which provider is being used during quiz.

**File:** `src/components/ProviderIndicator.js`

```javascript
/**
 * Provider Indicator Component
 * Shows current LLM provider in quiz view
 */

import { getActiveProvider } from '../services/provider-settings-service.js';
import { getProvider } from '../api/providers-config.js';
import { i18n } from '../i18n/index.js';

export function createProviderIndicator() {
  const container = document.createElement('div');
  container.className = 'provider-indicator';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-label', i18n.t('quiz.providerIndicator.ariaLabel'));

  updateIndicator(container);

  return container;
}

export async function updateIndicator(container) {
  const activeProviderId = await getActiveProvider();
  const provider = getProvider(activeProviderId);

  if (!provider) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <span class="provider-indicator__icon" aria-hidden="true">${provider.icon || '🤖'}</span>
    <span class="provider-indicator__text">
      ${i18n.t('quiz.providerIndicator.poweredBy', { provider: provider.name })}
    </span>
  `;
}
```

**CSS additions to `src/styles/quiz.css`:**

```css
/* Provider Indicator */
.provider-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  opacity: 0.8;
}

.provider-indicator__icon {
  font-size: 0.875rem;
}

.provider-indicator__text {
  white-space: nowrap;
}

/* Position in quiz header */
.quiz-header .provider-indicator {
  margin-left: auto;
}
```

---

### 5.3 Integration with Quiz View

**File:** `src/views/QuizView.js` (update header section)

```javascript
import { createProviderIndicator } from '../components/ProviderIndicator.js';

// In render method, add to quiz header:
function renderQuizHeader() {
  const header = document.createElement('div');
  header.className = 'quiz-header';

  // Question counter
  const counter = document.createElement('span');
  counter.className = 'quiz-header__counter';
  counter.textContent = `${i18n.t('quiz.questionCounter', {
    current: currentQuestion + 1,
    total: totalQuestions
  })}`;

  // Provider indicator
  const providerIndicator = createProviderIndicator();

  header.appendChild(counter);
  header.appendChild(providerIndicator);

  return header;
}
```

---

### 5.4 Edge Case Handling

**File:** `src/services/provider-edge-cases.js`

```javascript
/**
 * Provider Edge Cases
 * Handle special scenarios and edge cases
 */

import { getActiveProvider, getActiveModel } from './provider-settings-service.js';
import { getProviderKey, getKeyStatus, KEY_STATUS } from './api-keys-service.js';
import { logger } from '../utils/logger.js';

/**
 * Check if provider is ready to use
 * Returns { ready: boolean, reason?: string }
 */
export async function checkProviderReady() {
  const providerId = await getActiveProvider();

  // OpenRouter uses OAuth, not API key
  if (providerId === 'openrouter') {
    const hasToken = await checkOpenRouterToken();
    if (!hasToken) {
      return {
        ready: false,
        reason: 'openrouter_not_connected',
        action: 'connect_openrouter'
      };
    }
    return { ready: true };
  }

  // Other providers need API key
  const apiKey = await getProviderKey(providerId);
  if (!apiKey) {
    return {
      ready: false,
      reason: 'no_api_key',
      action: 'add_api_key'
    };
  }

  const status = await getKeyStatus(providerId);
  if (status === KEY_STATUS.INVALID) {
    return {
      ready: false,
      reason: 'invalid_api_key',
      action: 'update_api_key'
    };
  }

  // Key is validating - allow but warn
  if (status === KEY_STATUS.VALIDATING) {
    logger.info('Provider key still validating, proceeding anyway');
  }

  return { ready: true };
}

/**
 * Check OpenRouter OAuth token
 */
async function checkOpenRouterToken() {
  // Implementation depends on existing OAuth flow
  const token = localStorage.getItem('openrouter_token');
  return !!token;
}

/**
 * Handle provider switch mid-session
 * (Prevented by UI, but handle gracefully if it happens)
 */
export function validateProviderConsistency(quizProviderId, currentProviderId) {
  if (quizProviderId !== currentProviderId) {
    logger.warn('Provider changed during quiz session', {
      quizProviderId,
      currentProviderId
    });
    // Continue with original provider for consistency
    return quizProviderId;
  }
  return currentProviderId;
}

/**
 * Get fallback provider if primary fails
 */
export async function getFallbackProvider(failedProviderId) {
  // OpenRouter is the recommended fallback
  if (failedProviderId !== 'openrouter') {
    const hasOpenRouter = await checkOpenRouterToken();
    if (hasOpenRouter) {
      return 'openrouter';
    }
  }

  // No fallback available
  return null;
}
```

---

### 5.5 i18n Strings - Error Messages

**File:** `src/i18n/en.json` (add to errors section)

```json
{
  "errors": {
    "providerNetworkError": "Unable to connect. Please check your internet connection.",
    "providerInvalidKey": "Your {provider} API key is invalid. Please update it in Settings.",
    "providerRateLimited": "Too many requests. Please wait a moment and try again.",
    "providerInsufficientCredits": "Insufficient credits on your {provider} account.",
    "providerServerError": "The AI provider is temporarily unavailable. Please try again.",
    "providerRequestError": "Unable to process your request. Please try again.",
    "providerUnknownError": "Something went wrong. Please try again.",
    "providerNotConfigured": "Please configure an LLM provider in Settings to generate questions.",
    "providerKeyRequired": "Please add your {provider} API key in Settings."
  }
}
```

---

### 5.6 Cost Tracking Integration

**File:** `src/services/cost-tracker.js` (update for multi-provider)

```javascript
/**
 * Cost Tracker
 * Track LLM costs across all providers
 */

import { db } from '../core/db.js';
import { getProvider } from '../api/providers-config.js';
import { logger } from '../utils/logger.js';

// Pricing per 1M tokens (as of Jan 2026)
const PRICING = {
  openrouter: {
    // OpenRouter adds ~10-20% markup, handled in their response
    markup: true
  },
  openai: {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 }
  },
  anthropic: {
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
    'claude-3-opus-20240229': { input: 15.00, output: 75.00 }
  },
  google: {
    'gemini-2.0-flash-exp': { input: 0.00, output: 0.00 }, // Free tier
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    'gemini-1.5-flash': { input: 0.075, output: 0.30 }
  },
  xai: {
    'grok-2': { input: 2.00, output: 10.00 },
    'grok-2-mini': { input: 0.20, output: 1.00 }
  }
};

/**
 * Calculate cost from token usage
 */
export function calculateCost(providerId, model, usage) {
  const { prompt_tokens, completion_tokens } = usage;

  // OpenRouter includes cost in response
  if (providerId === 'openrouter' && usage.cost) {
    return usage.cost;
  }

  const providerPricing = PRICING[providerId];
  if (!providerPricing) {
    logger.warn(`No pricing info for provider: ${providerId}`);
    return null;
  }

  const modelPricing = providerPricing[model];
  if (!modelPricing) {
    logger.warn(`No pricing info for model: ${model}`);
    return null;
  }

  const inputCost = (prompt_tokens / 1_000_000) * modelPricing.input;
  const outputCost = (completion_tokens / 1_000_000) * modelPricing.output;

  return inputCost + outputCost;
}

/**
 * Record LLM usage
 */
export async function recordUsage(data) {
  const { providerId, model, usage, operation, quizId } = data;

  const cost = calculateCost(providerId, model, usage);

  const record = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    providerId,
    model,
    operation,
    quizId,
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    cost
  };

  await db.llmUsage.add(record);

  logger.debug('LLM usage recorded', record);

  return record;
}

/**
 * Get total cost for a quiz
 */
export async function getQuizCost(quizId) {
  const records = await db.llmUsage
    .where('quizId')
    .equals(quizId)
    .toArray();

  return records.reduce((total, r) => total + (r.cost || 0), 0);
}

/**
 * Get usage summary
 */
export async function getUsageSummary(options = {}) {
  const { days = 30, providerId } = options;
  const since = Date.now() - (days * 24 * 60 * 60 * 1000);

  let query = db.llmUsage.where('timestamp').above(since);

  const records = await query.toArray();

  const summary = {
    totalCost: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    byProvider: {},
    byOperation: {}
  };

  for (const record of records) {
    summary.totalCost += record.cost || 0;
    summary.totalPromptTokens += record.promptTokens || 0;
    summary.totalCompletionTokens += record.completionTokens || 0;

    // By provider
    if (!summary.byProvider[record.providerId]) {
      summary.byProvider[record.providerId] = { cost: 0, requests: 0 };
    }
    summary.byProvider[record.providerId].cost += record.cost || 0;
    summary.byProvider[record.providerId].requests += 1;

    // By operation
    if (!summary.byOperation[record.operation]) {
      summary.byOperation[record.operation] = { cost: 0, requests: 0 };
    }
    summary.byOperation[record.operation].cost += record.cost || 0;
    summary.byOperation[record.operation].requests += 1;
  }

  return summary;
}
```

---

## Testing

### Unit Tests

**File:** `tests/unit/llm-error-handler.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import {
  parseProviderError,
  LLM_ERROR_CODES,
  withRetry
} from '../../src/services/llm-error-handler.js';

describe('LLM Error Handler', () => {
  describe('parseProviderError', () => {
    it('should identify network errors', () => {
      const error = new TypeError('Failed to fetch');
      const result = parseProviderError('openai', error, null);

      expect(result.code).toBe(LLM_ERROR_CODES.NETWORK_ERROR);
      expect(result.retryable).toBe(true);
    });

    it('should identify invalid key (401)', () => {
      const response = { status: 401 };
      const result = parseProviderError('openai', {}, response);

      expect(result.code).toBe(LLM_ERROR_CODES.INVALID_API_KEY);
      expect(result.retryable).toBe(false);
    });

    it('should identify rate limiting (429)', () => {
      const response = {
        status: 429,
        headers: { get: () => '60' }
      };
      const result = parseProviderError('anthropic', {}, response);

      expect(result.code).toBe(LLM_ERROR_CODES.RATE_LIMITED);
      expect(result.retryable).toBe(true);
      expect(result.retryAfter).toBe(60);
    });

    it('should identify server errors (5xx)', () => {
      const response = { status: 503 };
      const result = parseProviderError('google', {}, response);

      expect(result.code).toBe(LLM_ERROR_CODES.PROVIDER_ERROR);
      expect(result.retryable).toBe(true);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValueOnce('success');

      const result = await withRetry(fn, { baseDelay: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable error', async () => {
      const fn = vi.fn()
        .mockRejectedValue({ response: { status: 401 } });

      await expect(withRetry(fn)).rejects.toEqual({ response: { status: 401 } });
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
```

**File:** `tests/unit/cost-tracker.test.js`

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateCost } from '../../src/services/cost-tracker.js';

describe('Cost Tracker', () => {
  describe('calculateCost', () => {
    it('should calculate OpenAI GPT-4o cost', () => {
      const usage = { prompt_tokens: 1000, completion_tokens: 500 };
      const cost = calculateCost('openai', 'gpt-4o', usage);

      // (1000/1M * 2.50) + (500/1M * 10.00) = 0.0025 + 0.005 = 0.0075
      expect(cost).toBeCloseTo(0.0075);
    });

    it('should calculate Anthropic Claude cost', () => {
      const usage = { prompt_tokens: 2000, completion_tokens: 1000 };
      const cost = calculateCost('anthropic', 'claude-3-5-sonnet-20241022', usage);

      // (2000/1M * 3.00) + (1000/1M * 15.00) = 0.006 + 0.015 = 0.021
      expect(cost).toBeCloseTo(0.021);
    });

    it('should return 0 for free tier models', () => {
      const usage = { prompt_tokens: 5000, completion_tokens: 2000 };
      const cost = calculateCost('google', 'gemini-2.0-flash-exp', usage);

      expect(cost).toBe(0);
    });

    it('should use OpenRouter cost from response', () => {
      const usage = { prompt_tokens: 1000, completion_tokens: 500, cost: 0.0123 };
      const cost = calculateCost('openrouter', 'any-model', usage);

      expect(cost).toBe(0.0123);
    });
  });
});
```

### E2E Tests

**File:** `tests/e2e/provider-errors.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Provider Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/');
  });

  test('should show error when provider not configured', async ({ page }) => {
    // Clear all provider keys
    await page.evaluate(() => {
      localStorage.clear();
      indexedDB.deleteDatabase('saberloop');
    });

    await page.reload();

    // Try to create quiz
    await page.click('[data-testid="create-quiz-button"]');
    await page.fill('[data-testid="topic-input"]', 'Test Topic');
    await page.click('[data-testid="generate-button"]');

    // Should show configuration needed message
    await expect(page.locator('[data-testid="provider-error"]'))
      .toContainText(/configure|Settings/i);
  });

  test('should show provider indicator during quiz', async ({ page }) => {
    // Setup: Configure OpenRouter
    await page.evaluate(() => {
      localStorage.setItem('openrouter_token', 'test-token');
    });

    await page.reload();

    // Start a quiz
    await page.click('[data-testid="start-quiz-button"]');

    // Provider indicator should be visible
    await expect(page.locator('.provider-indicator'))
      .toBeVisible();

    await expect(page.locator('.provider-indicator'))
      .toContainText(/Powered by/i);
  });
});
```

### Maestro Tests

**File:** `tests/maestro/provider_error_handling.yaml`

```yaml
appId: com.saberloop.app
---
- launchApp

# Clear app data to simulate no provider configured
- clearState

# Try to create quiz
- tapOn:
    id: "create-quiz-button"

- inputText:
    id: "topic-input"
    text: "History"

- tapOn:
    id: "generate-button"

# Should show error about configuration
- assertVisible:
    text: "Settings|configure"
    regex: true

# Navigate to settings
- tapOn:
    text: "Settings"

# Should see LLM Providers section
- assertVisible:
    text: "LLM Providers"
```

---

## Acceptance Criteria

- [ ] Comprehensive error handling for all provider errors
- [ ] User-friendly error messages for common issues
- [ ] Retry logic for transient failures
- [ ] Provider indicator visible during quiz
- [ ] Cost tracking works for all providers
- [ ] Edge cases handled gracefully
- [ ] All i18n strings added
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Maestro tests pass

---

## Notes

- Error messages should guide users to fix issues (not just report them)
- Provider indicator should be subtle, not distracting
- Cost tracking pricing should be updated periodically
- Consider adding usage statistics view in future iteration

---

*Previous: [PHASE4_SETTINGS_UI.md](./PHASE4_SETTINGS_UI.md)*
*Back to: [EPIC11_LLM_SUPPORT_PLAN.md](./EPIC11_LLM_SUPPORT_PLAN.md)*
