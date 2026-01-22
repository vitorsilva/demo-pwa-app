# Task: MSW + Playwright API Integration Testing

**Epic:** 10 - Project Hygiene
**Status:** Planned
**Priority:** Low (Enhancement)
**Created:** January 22, 2026
**Context:** Identified during Epic 11 Phase 2 implementation

---

## Problem Statement

Current testing has a gap between unit tests (everything mocked) and E2E tests (full UI):

```
Unit Tests              ???                 E2E Tests
(all mocked)        (the gap)              (full UI)
     │                  │                      │
     ▼                  ▼                      ▼
┌─────────┐       ┌───────────┐         ┌──────────┐
│ router  │       │  router   │         │  User    │
│ (mock   │       │     +     │         │  clicks  │
│  fetch) │       │  backend  │         │   UI     │
└─────────┘       └───────────┘         └──────────┘
```

**The gap:** We don't have tests that:
- Call `completion()` from provider-router with realistic behavior
- Test frontend code against realistic API responses
- Verify error handling paths with controlled failures
- Run fast without hitting real APIs or requiring backend

---

## Proposed Solution

Two complementary approaches:

### 1. MSW (Mock Service Worker) for Vitest Integration Tests

Test frontend modules with realistic network behavior, mocked at the fetch level.

**Why MSW:**
- Intercepts at network level - code runs exactly as production
- Works in Node (Vitest) and browser
- No special test builds needed
- Industry standard in 2025/2026

### 2. Playwright API Tests for Backend Contract

Test backend endpoints directly without browser, verify response shapes.

**Why Playwright API:**
- Already using Playwright for E2E
- `request` context for pure API testing
- Can run against local Docker or staging
- We already have `llm-proxy.spec.js` as starting point

---

## Implementation Plan

### Phase A: Add MSW to Vitest (Frontend Integration)

#### A.1 Install MSW

```bash
npm install --save-dev msw
```

#### A.2 Create MSW Handlers

**File:** `src/mocks/handlers.js`

```javascript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // LLM Proxy - Success response
  http.post('https://saberloop.com/llm/completion.php', async ({ request }) => {
    const body = await request.json();

    // Simulate different providers
    const responses = {
      openai: {
        text: 'Mock response from OpenAI',
        model: body.model || 'gpt-4o-mini',
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
      },
      anthropic: {
        text: 'Mock response from Anthropic',
        model: body.model || 'claude-3-5-sonnet-20241022',
        usage: { prompt_tokens: 15, completion_tokens: 25, total_tokens: 40 }
      },
      google: {
        text: 'Mock response from Google',
        model: body.model || 'gemini-2.0-flash',
        usage: { prompt_tokens: 12, completion_tokens: 18, total_tokens: 30 }
      },
      xai: {
        text: 'Mock response from xAI',
        model: body.model || 'grok-2-latest',
        usage: { prompt_tokens: 8, completion_tokens: 22, total_tokens: 30 }
      }
    };

    return HttpResponse.json(responses[body.provider] || responses.openai);
  }),

  // LLM Proxy - Error responses
  http.post('https://saberloop.com/llm/completion.php', async ({ request }) => {
    const body = await request.json();

    // Simulate invalid API key
    if (body.api_key === 'invalid-key') {
      return HttpResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Simulate rate limit
    if (body.api_key === 'rate-limited-key') {
      return HttpResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
  }),

  // OpenRouter direct (CORS supported)
  http.post('https://openrouter.ai/api/v1/chat/completions', async ({ request }) => {
    return HttpResponse.json({
      choices: [{ message: { content: 'Mock OpenRouter response' } }],
      model: 'anthropic/claude-3.5-sonnet',
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
    });
  }),

  // OpenRouter key validation
  http.get('https://openrouter.ai/api/v1/auth/key', async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (auth?.includes('valid')) {
      return HttpResponse.json({ valid: true });
    }
    return HttpResponse.json({ error: 'Invalid key' }, { status: 401 });
  }),
];
```

#### A.3 Create MSW Server Setup

**File:** `src/mocks/server.js`

```javascript
import { setupServer } from 'msw/node';
import { handlers } from './handlers.js';

export const server = setupServer(...handlers);
```

#### A.4 Configure Vitest Setup

**File:** `vitest.setup.js` (update)

```javascript
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './src/mocks/server.js';

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
```

#### A.5 Create Integration Tests

**File:** `src/api/provider-router.integration.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server.js';
import { completion } from './provider-router.js';
import { setActiveProvider, setActiveModel, setProviderKey } from '../services/provider-settings-service.js';

describe('Provider Router Integration (MSW)', () => {
  describe('OpenRouter (direct CORS)', () => {
    it('should call OpenRouter directly when selected', async () => {
      await setActiveProvider('openrouter');
      await setActiveModel('anthropic/claude-3.5-sonnet');
      await setProviderKey('openrouter', 'sk-or-valid-key');

      const result = await completion('Hello', { maxTokens: 100 });

      expect(result.text).toBe('Mock OpenRouter response');
      expect(result.model).toBe('anthropic/claude-3.5-sonnet');
    });
  });

  describe('OpenAI (via proxy)', () => {
    it('should route through proxy for non-CORS providers', async () => {
      await setActiveProvider('openai');
      await setActiveModel('gpt-4o-mini');
      await setProviderKey('openai', 'sk-valid-openai-key');

      const result = await completion('Hello', { maxTokens: 100 });

      expect(result.text).toBe('Mock response from OpenAI');
      expect(result.usage.total_tokens).toBe(30);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid API key error', async () => {
      await setActiveProvider('openai');
      await setProviderKey('openai', 'invalid-key');

      await expect(completion('Hello', {}))
        .rejects.toThrow(/Invalid API key/);
    });

    it('should handle rate limit error', async () => {
      await setActiveProvider('openai');
      await setProviderKey('openai', 'rate-limited-key');

      await expect(completion('Hello', {}))
        .rejects.toThrow(/Rate limit/);
    });

    it('should handle network failure', async () => {
      // Override handler for this test
      server.use(
        http.post('https://saberloop.com/llm/completion.php', () => {
          return HttpResponse.error();
        })
      );

      await setActiveProvider('openai');
      await setProviderKey('openai', 'sk-valid');

      await expect(completion('Hello', {}))
        .rejects.toThrow(/network|fetch/i);
    });
  });

  describe('All providers', () => {
    const providers = [
      { id: 'openai', model: 'gpt-4o-mini', keyPrefix: 'sk-' },
      { id: 'anthropic', model: 'claude-3-5-sonnet-20241022', keyPrefix: 'sk-ant-' },
      { id: 'google', model: 'gemini-2.0-flash', keyPrefix: 'AIza' },
      { id: 'xai', model: 'grok-2-latest', keyPrefix: 'xai-' },
    ];

    providers.forEach(({ id, model, keyPrefix }) => {
      it(`should handle ${id} provider correctly`, async () => {
        await setActiveProvider(id);
        await setActiveModel(model);
        await setProviderKey(id, `${keyPrefix}test-key-12345`);

        const result = await completion('Hello', { maxTokens: 50 });

        expect(result.text).toContain('Mock response');
        expect(result.usage).toBeDefined();
      });
    });
  });
});
```

### Phase B: Expand Playwright API Tests (Backend Contract)

#### B.1 Enhance Existing llm-proxy.spec.js

**File:** `tests/e2e/llm-proxy.spec.js` (expand)

```javascript
import { test, expect } from '@playwright/test';

const LLM_PROXY_URL = 'https://saberloop.com/llm/completion.php';

test.describe('LLM Proxy API Contract', () => {

  test.describe('Response Shape Validation', () => {
    // These tests verify the backend returns expected shapes
    // Use test API keys or mock mode on backend

    test('successful response has required fields', async ({ request }) => {
      const response = await request.post(LLM_PROXY_URL, {
        data: {
          provider: 'openai',
          api_key: process.env.TEST_OPENAI_KEY || 'test-key',
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Say "test"' }],
          options: { max_tokens: 5 }
        }
      });

      // Even if key is invalid, verify error shape
      const body = await response.json();

      if (response.ok()) {
        expect(body).toHaveProperty('text');
        expect(body).toHaveProperty('model');
        expect(body).toHaveProperty('usage');
        expect(body.usage).toHaveProperty('prompt_tokens');
        expect(body.usage).toHaveProperty('completion_tokens');
        expect(body.usage).toHaveProperty('total_tokens');
      } else {
        expect(body).toHaveProperty('error');
      }
    });

    test('error response has error field', async ({ request }) => {
      const response = await request.post(LLM_PROXY_URL, {
        data: {
          provider: 'openai',
          api_key: 'definitely-invalid-key',
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hi' }],
          options: {}
        }
      });

      expect(response.ok()).toBeFalsy();
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    });
  });

  test.describe('Provider Validation', () => {
    const validProviders = ['openai', 'anthropic', 'google', 'xai'];

    validProviders.forEach(provider => {
      test(`accepts ${provider} as valid provider`, async ({ request }) => {
        const response = await request.post(LLM_PROXY_URL, {
          data: {
            provider,
            api_key: 'test-key',
            model: 'test-model',
            messages: [{ role: 'user', content: 'Hi' }],
            options: {}
          }
        });

        // Should not be 400 "invalid provider"
        const body = await response.json();
        if (!response.ok()) {
          expect(body.error).not.toMatch(/invalid provider/i);
        }
      });
    });

    test('rejects unknown provider', async ({ request }) => {
      const response = await request.post(LLM_PROXY_URL, {
        data: {
          provider: 'unknown-provider',
          api_key: 'test-key',
          model: 'test-model',
          messages: [{ role: 'user', content: 'Hi' }],
          options: {}
        }
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/invalid provider/i);
    });
  });

  test.describe('Request Validation', () => {
    test('requires provider field', async ({ request }) => {
      const response = await request.post(LLM_PROXY_URL, {
        data: {
          api_key: 'test',
          model: 'test',
          messages: [],
          options: {}
        }
      });

      expect(response.status()).toBe(400);
    });

    test('requires api_key field', async ({ request }) => {
      const response = await request.post(LLM_PROXY_URL, {
        data: {
          provider: 'openai',
          model: 'test',
          messages: [],
          options: {}
        }
      });

      expect(response.status()).toBe(400);
    });

    test('requires messages field', async ({ request }) => {
      const response = await request.post(LLM_PROXY_URL, {
        data: {
          provider: 'openai',
          api_key: 'test',
          model: 'test',
          options: {}
        }
      });

      expect(response.status()).toBe(400);
    });
  });
});
```

---

## File Summary

| File | Purpose |
|------|---------|
| `src/mocks/handlers.js` | MSW request handlers for all providers |
| `src/mocks/server.js` | MSW server setup for Node |
| `vitest.setup.js` | Configure MSW for all tests |
| `src/api/provider-router.integration.test.js` | Integration tests using MSW |
| `tests/e2e/llm-proxy.spec.js` | Backend contract tests (expand existing) |

---

## Testing Strategy After Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│                      Test Pyramid                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                         ▲                                       │
│                        /E\         E2E Tests (Playwright)       │
│                       /2E \        - Full user flows            │
│                      /Tests\       - Slow, comprehensive        │
│                     /───────\                                   │
│                    / API     \     API Contract Tests           │
│                   / Contract  \    - Backend shape validation   │
│                  /─────────────\   - Fast, no browser           │
│                 /  Integration  \  MSW Integration Tests        │
│                / (MSW + Vitest)  \ - Frontend logic + network   │
│               /───────────────────\- Fast, realistic            │
│              /     Unit Tests      \                            │
│             /   (Vitest + mocks)    \  - Isolated logic         │
│            /─────────────────────────\ - Fastest                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

- [ ] MSW installed and configured
- [ ] Handlers cover all 5 providers (OpenRouter, OpenAI, Anthropic, Google, xAI)
- [ ] Handlers cover success, auth error, rate limit, network error
- [ ] Integration tests verify provider-router behavior
- [ ] Playwright API tests verify backend contract
- [ ] All tests run in CI/CD
- [ ] Documentation updated

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| A. MSW Setup + Integration Tests | 1-2 days |
| B. Expand Playwright API Tests | 0.5-1 day |
| **Total** | **1.5-3 days** |

---

## Dependencies

- Epic 11 Phase 2 complete (provider-router exists)
- Backend proxy deployed (for Playwright API tests)

---

## References

- [MSW Documentation](https://mswjs.io/)
- [MSW with Vitest](https://mswjs.io/docs/integrations/node)
- [Playwright API Testing](https://playwright.dev/docs/api-testing)
- Current tests: `tests/e2e/llm-proxy.spec.js`

---

*Created: January 22, 2026*
*Last Updated: January 22, 2026*
