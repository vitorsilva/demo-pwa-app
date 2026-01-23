# LLM Integration Evolution

This document traces the evolution of LLM (Large Language Model) integration in SaberLoop, from initial concepts through production implementation. It serves as a reference for understanding architectural decisions and as a foundation for future implementations.

---

## Executive Summary

SaberLoop's LLM integration evolved through **five distinct iterations**:

| Iteration | Approach | Status | Key Insight |
|-----------|----------|--------|-------------|
| 0. Mock API | Simulated responses | Development only | Enabled frontend development without API costs |
| 1. Direct Anthropic | Browser → Anthropic API | ❌ Blocked by CORS | Anthropic does not support browser requests |
| 2. Backend Proxy | Browser → Server → Anthropic | ✅ Worked but costly | Developer pays for all usage |
| 3. OpenRouter | Browser → OpenRouter (OAuth) | ✅ Default option | Zero cost for developer, CORS supported |
| 4. Multi-Provider | Browser → LLM Proxy → Any Provider | ✅ **Current** | User choice: OpenAI, Anthropic, Google AI, xAI |

**Current Architecture:** Multi-provider support with OpenRouter as default, plus LLM Proxy for direct provider access.

---

## Timeline Overview

```
Epic 02 (Phase 3)     Epic 03 (Phase 1)      Epic 03 (Phase 3.6)    Epic 04 (Phase 10)
      |                     |                       |                      |
Mock API +           Netlify Functions     OpenRouter OAuth      UX Improvements
Direct Anthropic     PHP Backend             Integration           Onboarding
 (Design Phase)         Proxy
      |                     |                       |                      |
   Concept           Nov 22-24, 2025         Dec 1-2, 2024          Dec 2024+
```

---

## Iteration 0: Mock API (Development Foundation)

**Epic:** 02 - QuizMaster V1
**Purpose:** Enable rapid frontend development without API costs

### Architecture

```
Browser (Frontend) → api.mock.js → Hardcoded quiz data
```

### Key File

**`src/api/api.mock.js`** (~7KB)

```javascript
// Simulates LLM responses with predefined quiz data
export async function generateQuestions(topic, gradeLevel) {
  // Return fake questions for development/testing
  await sleep(500); // Simulate API latency
  return [
    { question: "Mock question about " + topic, ... }
  ];
}
```

### Purpose

- Frontend development without API dependency
- Testing UI flows end-to-end
- E2E tests can run without real API calls
- Zero cost during development

### Still Used Today

The mock API remains in the codebase for:
- Development mode (`VITE_USE_REAL_API=false`)
- E2E testing with predictable responses
- Offline development

---

## Iteration 1: Direct Anthropic API (Design Phase)

**Epic:** 02 - QuizMaster V1 (Phase 3)
**Status:** Designed but never fully implemented (CORS blocked)

### Intended Architecture

```
Browser (Frontend)
    ↓ Fetch with API key
Anthropic API (https://api.anthropic.com/v1/messages)
```

### The Plan

```javascript
// Conceptual design from Epic 02 Phase 3
async function callClaude(messages, options = {}) {
  const apiKey = await getSetting('apiKey');  // User's own key

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: messages
    })
  });

  return data.content[0].text;
}
```

### Why It Failed

| Problem | Impact |
|---------|--------|
| **CORS Blocking** | Anthropic API does not allow browser-origin requests |
| **API Key Exposure** | User keys visible in browser DevTools |
| **Security Risk** | Violates Anthropic's Terms of Service for key handling |

### Key Learning

> **Anthropic does not support CORS.** Any Anthropic integration requires a server-side component to proxy requests.

**Documentation:** `docs/learning/epic02_quizmaster_v1/PHASE3_API_INTEGRATION.md`

---

## Iteration 2: Backend Proxy (Production v1)

**Epic:** 03 - QuizMaster V2 (Phase 1)
**Completed:** November 22-24, 2025 (4 sessions, ~6.5 hours)
**Status:** ✅ Complete, then superseded by OpenRouter

### Architecture

```
Browser (Frontend)
    ↓ HTTPS POST /.netlify/functions/generate-questions
Netlify Functions (Node.js)
    ├── Validates input
    ├── Gets API key from environment variables
    ├── Calls Anthropic API
    └── Returns parsed response
    ↓ HTTPS POST https://api.anthropic.com/v1/messages
Anthropic API
```

### Implementation

**Two parallel implementations were created:**

#### A. Netlify Functions (Serverless)

**Location:** `netlify/functions/` (now removed, see Phase 3.6)

```javascript
// netlify/functions/generate-questions.js
exports.handler = async (event, context) => {
  // Get API key from environment (secure server-side storage)
  const API_KEY = process.env.ANTHROPIC_API_KEY;

  // Call Anthropic API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify({ questions: JSON.parse(data.content[0].text) })
  };
};
```

#### B. PHP Backend (VPS)

**Location:** `php-api/src/AnthropicClient.php` (93 lines)

```php
class AnthropicClient {
    private $apiKey;
    private $baseUrl = 'https://api.anthropic.com/v1';
    private $model = 'claude-sonnet-4-20250514';

    public function sendMessage($systemPrompt, $userMessage, $maxTokens = 1024) {
        $url = $this->baseUrl . '/messages';
        $payload = [
            'model' => $this->model,
            'max_tokens' => $maxTokens,
            'system' => $systemPrompt,
            'messages' => [['role' => 'user', 'content' => $userMessage]]
        ];

        $headers = [
            'Content-Type: application/json',
            'x-api-key: ' . $this->apiKey,
            'anthropic-version: 2023-06-01'
        ];

        return $this->makeRequest($url, $payload, $headers);
    }
}
```

### Problems Solved

| Problem | Solution |
|---------|----------|
| CORS Blocking | Server proxy bypasses browser restrictions |
| API Key Security | Keys stored server-side in environment variables |
| Input Validation | Server validates before calling Anthropic |
| Error Handling | Graceful error responses to client |

### Limitations That Led to Next Iteration

| Limitation | Impact |
|------------|--------|
| **Developer Bears Cost** | Every quiz generation costs developer money |
| **Not Scalable** | Free users don't help offset costs |
| **Server Infrastructure** | Requires Netlify or VPS maintenance |
| **Deployment Complexity** | Environment variable management across environments |

### Cost Model

```
User creates quiz → API call → Developer pays $0.01-0.02
50 quizzes/month = $0.50-$1.00 developer cost
500 quizzes/month = $5.00-$10.00 developer cost
```

**Documentation:** `docs/learning/epic03_quizmaster_v2/PHASE1_BACKEND.md`

---

## Iteration 3: OpenRouter Client-Side (Current Production)

**Epic:** 03 - QuizMaster V2 (Phase 3.6), Epic 04 (Phase 10)
**Completed:** December 1-2, 2024 (6 sessions)
**Status:** ✅ **Live in Production**

### Key Discovery

> **OpenRouter supports CORS.** Unlike Anthropic, OpenRouter allows direct browser-to-API calls, eliminating the need for a server proxy.

### Architecture

```
Browser (Frontend)
    │
    ├── OAuth PKCE Flow
    │   └── User redirected to openrouter.ai/auth
    │       └── User authorizes SaberLoop
    │           └── OpenRouter redirects back with code
    │               └── Code exchanged for API key
    │                   └── Key stored in IndexedDB
    │
    └── Quiz Generation (Direct API Call)
        ├── Read API key from IndexedDB
        └── HTTPS POST https://openrouter.ai/api/v1/chat/completions
            (CORS-enabled, user's API key in Authorization header)
```

### Implementation Files

#### A. OAuth PKCE Authentication

**File:** `src/api/openrouter-auth.js` (~140 lines)

```javascript
// OAuth PKCE Flow
const OPENROUTER_AUTH_URL = 'https://openrouter.ai/auth';

// Step 1: Generate PKCE pair
export function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Step 2: Start OAuth flow
export async function startAuth() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  sessionStorage.setItem('openrouter_code_verifier', codeVerifier);

  const authUrl = new URL(OPENROUTER_AUTH_URL);
  authUrl.searchParams.set('callback_url', window.location.origin + '/app/auth/callback');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  window.location.href = authUrl.toString();
}

// Step 3: Exchange code for API key
export async function handleCallback() {
  const code = new URLSearchParams(window.location.search).get('code');
  const codeVerifier = sessionStorage.getItem('openrouter_code_verifier');

  const response = await fetch('https://openrouter.ai/api/v1/auth/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: codeVerifier })
  });

  const data = await response.json();
  return data.key; // User's API key
}
```

#### B. OpenRouter API Client

**File:** `src/api/openrouter-client.js` (~208 lines)

```javascript
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function callOpenRouter(apiKey, prompt, options = {}) {
  const { model = getSelectedModel(), maxTokens = 2048, temperature = 0.7 } = options;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'SaberLoop'
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }],
      usage: { include: true }
    })
  });

  const data = await response.json();

  return {
    text: data.choices[0].message.content,
    model: data.model,
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
      costUsd: data.usage?.cost_usd || 0
    }
  };
}
```

#### C. Real API Integration

**File:** `src/api/api.real.js` (~267 lines)

```javascript
import { callOpenRouter } from './openrouter-client.js';

export async function generateQuestions(topic, gradeLevel, apiKey, options = {}) {
  const { previousQuestions = [], language = 'en', questionCount = 5 } = options;

  const prompt = `You are an expert educational content creator...`;

  const result = await callOpenRouter(apiKey, prompt, {
    maxTokens: 2048,
    temperature: 0.7
  });

  const data = extractJSON(result.text);

  return {
    language: data.language || 'EN-US',
    questions: data.questions,
    model: result.model,
    usage: result.usage
  };
}
```

### Why OpenRouter?

| Feature | Anthropic | OpenRouter |
|---------|-----------|-----------|
| CORS Support | ❌ Blocks browser | ✅ Allows browser calls |
| Free Tier | ❌ None | ✅ 50 requests/day |
| Multi-Model Access | Single vendor | ✅ Claude, GPT-4, Llama, etc. |
| User Cost Model | App pays | ✅ User pays (or uses free) |
| Key Distribution | Manual API keys | ✅ OAuth PKCE flow |

### Cost Model (Current)

```
Developer cost: $0 (user brings their own key)
User (free tier): $0 (50 requests/day)
User (power user): $10 one-time for 1000 requests/day
```

### Free Models Available

| Model | Notes |
|-------|-------|
| `deepseek/deepseek-chat-v3-0324:free` | Excellent for structured JSON |
| `meta-llama/llama-4-maverick:free` | Good general purpose |
| `google/gemini-2.0-flash-exp:free` | Fast, good for simple quizzes |

**Note:** Free models require opting-in to data training.

### Documentation

- **Phase 3.6 (Main):** `docs/learning/epic03_quizmaster_v2/PHASE3.6_OPENROUTER.md`
- **Phase 10 (UX):** `docs/learning/epic04_saberloop_v1/PHASE10_OPENROUTER_ONBOARDING_UX.md`

---

## Iteration 4: Multi-Provider Support (Current Production)

**Epic:** 11 - Multi-Provider LLM Support
**Completed:** January 2026
**Status:** ✅ **Live in Production**

### Key Insight

> **Users want choice.** While OpenRouter works well, power users prefer direct API access to their provider of choice for cost control, privacy, or model-specific features.

### Architecture

```
Browser (Frontend)
    │
    ├── Provider Router (src/api/provider-router.js)
    │   ├── Determines active provider from settings
    │   └── Routes request to appropriate client
    │
    ├── OpenRouter (Direct - CORS ✓)
    │   └── HTTPS POST https://openrouter.ai/api/v1/chat/completions
    │
    └── LLM Proxy (saberloop.com/llm/)
        ├── HTTPS POST /llm/completion.php
        │   ├── Validates request
        │   ├── Routes to target provider
        │   └── Returns response
        │
        └── Supported Providers:
            ├── OpenAI (api.openai.com)
            ├── Anthropic (api.anthropic.com)
            ├── Google AI (generativelanguage.googleapis.com)
            └── xAI (api.x.ai)
```

### Implementation Files

#### A. Provider Router

**File:** `src/api/provider-router.js`

```javascript
// Routes requests to the active provider
export async function routeToProvider(prompt, options = {}) {
  const activeProvider = await getActiveProvider();

  switch (activeProvider) {
    case 'openrouter':
      return callOpenRouter(apiKey, prompt, options);
    case 'openai':
    case 'anthropic':
    case 'google':
    case 'xai':
      return callViaProxy(activeProvider, apiKey, prompt, options);
    default:
      throw new Error(`Unknown provider: ${activeProvider}`);
  }
}
```

#### B. LLM Proxy (PHP Backend)

**File:** `php-api/llm/completion.php`

```php
// Route completion requests to provider APIs
$provider = $_POST['provider'];
$apiKey = $_POST['api_key'];
$messages = $_POST['messages'];

switch ($provider) {
    case 'openai':
        $url = 'https://api.openai.com/v1/chat/completions';
        break;
    case 'anthropic':
        $url = 'https://api.anthropic.com/v1/messages';
        break;
    case 'google':
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent';
        break;
    case 'xai':
        $url = 'https://api.x.ai/v1/chat/completions';
        break;
}
// Forward request with user's API key
```

#### C. Provider Key Storage

**File:** `src/core/db.js`

```javascript
// IndexedDB settings store keys:
// - openrouter_api_key  (OAuth)
// - openai_api_key      (manual entry)
// - anthropic_api_key   (manual entry)
// - google_api_key      (manual entry)
// - xai_api_key         (manual entry)
// - active_provider     (which provider to use)
// - active_model        (model ID for current provider)
```

### Supported Providers

| Provider | Connection | Key Format | CORS | Notes |
|----------|------------|------------|------|-------|
| OpenRouter | Direct | OAuth PKCE | ✅ | Default, free tier available |
| OpenAI | LLM Proxy | `sk-...` | ❌ | GPT-4, GPT-4o, o1 models |
| Anthropic | LLM Proxy | `sk-ant-...` | ❌ | Claude 3.5/4 models |
| Google AI | LLM Proxy | `AIza...` | ❌ | Gemini models |
| xAI | LLM Proxy | `xai-...` | ❌ | Grok models |

### Why LLM Proxy?

| Problem | Solution |
|---------|----------|
| CORS Blocking | PHP proxy bypasses browser CORS restrictions |
| Provider Differences | Normalize request/response formats |
| Key Validation | Validate key format before attempting API call |
| Error Handling | Consistent error format across providers |

### Cost Model

```
OpenRouter (default):
- User pays OpenRouter (or uses free tier)
- Developer cost: $0

Direct Providers (via LLM Proxy):
- User pays provider directly
- Developer cost: $0 (only VPS hosting)
- User benefits: Better pricing, no middleman markup
```

### Documentation

- **Epic 11 Plan:** `docs/learning/epic11_llm_support/EPIC11_LLM_SUPPORT_PLAN.md`
- **Phase 1 (Provider Router):** `docs/learning/epic11_llm_support/PHASE1_PROVIDER_ROUTER.md`
- **Phase 2 (LLM Proxy):** `docs/learning/epic11_llm_support/PHASE2_LLM_PROXY.md`
- **Phase 3 (Key Management):** `docs/learning/epic11_llm_support/PHASE3_KEY_MANAGEMENT.md`
- **Phase 4 (Settings UI):** `docs/learning/epic11_llm_support/PHASE4_SETTINGS_UI.md`
- **Phase 5 (Polish):** `docs/learning/epic11_llm_support/PHASE5_POLISH.md`

---

## Comparison Matrix

| Aspect | Direct Anthropic | Backend Proxy | OpenRouter | Multi-Provider |
|--------|------------------|---------------|------------|----------------|
| **CORS** | ❌ Blocked | ✅ Proxy bypasses | ✅ Native support | ✅ LLM Proxy |
| **API Key Location** | Browser (exposed) | Server (secure) | Browser (user's own) | Browser (user's own) |
| **Auth Flow** | Manual key entry | Env variable | OAuth PKCE | Manual entry |
| **Developer Cost** | Per usage | Per usage | ❌ None | ❌ None |
| **User Cost** | Hidden in app | Hidden in app | ✅ Transparent | ✅ Transparent |
| **Free Tier** | ❌ None | ❌ None | ✅ 50 req/day | Depends on provider |
| **Multi-Model** | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Server Required** | No (but blocked) | ✅ Yes | ❌ No | ✅ LLM Proxy |
| **Provider Choice** | ❌ Single | ❌ Single | ✅ Many via OR | ✅ Direct to any |
| **Implementation** | ~50 lines | ~300 lines + server | ~350 lines | ~500 lines + proxy |

---

## Key Learnings

### 1. CORS is a Hard Boundary

Anthropic (and Google Gemini) block browser requests for security reasons. Any integration with these providers requires a server-side proxy. OpenRouter and OpenAI support CORS.

### 2. OAuth PKCE is Browser-Friendly

PKCE (Proof Key for Code Exchange) enables secure OAuth without exposing secrets in URLs or requiring a server-side callback handler. The code verifier never leaves the browser.

### 3. Free Tier Changes the Game

Having a free tier (50 requests/day with OpenRouter) makes the freemium model viable. Users can try before paying, reducing friction.

### 4. User-Provided Keys are Acceptable

Storing user's own API key in IndexedDB is acceptable because:
- It's the user's own key (not a shared secret)
- OpenRouter designed their OAuth flow for this pattern
- Same approach used by ChatGPT, Poe, etc.
- User can revoke on openrouter.ai anytime

### 5. Multi-Model Access is Valuable

OpenRouter's single API provides access to Claude, GPT-4, Llama, DeepSeek, Gemini via one integration. Users can choose their preferred model without app changes.

### 6. Incremental Evolution Works

Each iteration built on learnings from the previous:
- Mock API → understand the interface
- Direct API → learn about CORS limitations
- Backend Proxy → solve CORS, understand cost implications
- OpenRouter → solve cost model, simplify architecture

---

## Current File Structure

```
src/api/
├── index.js              # Smart loader (mock vs real based on env)
├── api.mock.js           # Mock API for development/testing
├── api.real.js           # Real API using provider router (~267 lines)
├── openrouter-auth.js    # OAuth PKCE flow (~140 lines)
├── openrouter-client.js  # OpenRouter API wrapper (~208 lines)
├── provider-router.js    # Multi-provider routing logic
├── llm-proxy-client.js   # Client for LLM proxy calls
└── prompts.js            # Prompt templates

src/services/
├── provider-service.js   # Provider management (active provider, keys)
└── model-service.js      # Model selection per provider

php-api/llm/
├── completion.php        # Main completion endpoint (routes to providers)
├── health.php            # Health check endpoint
├── providers/            # Provider-specific implementations
│   ├── openai.php
│   ├── anthropic.php
│   ├── google.php
│   └── xai.php
└── config.local.php      # Local configuration (gitignored)

php-api/party/            # Party Mode signaling (WebRTC coordination)
php-api/telemetry/        # Event ingestion
```

**Note:** The PHP backend now handles:
- **LLM Proxy** (`/llm/`) - CORS bypass for OpenAI, Anthropic, Google AI, xAI
- **Party Mode** (`/party/`) - WebRTC signaling for multiplayer
- **Telemetry** (`/telemetry/`) - Event ingestion

---

## Future Considerations

### Adding New LLM Providers

To add a new provider (e.g., Groq, Mistral):

1. Check CORS support (browser-direct vs server-required)
2. If CORS supported: Create new client similar to `openrouter-client.js`
3. If no CORS: Extend PHP backend or add Netlify function
4. Add to model selection in `model-service.js`

### Fallback Strategy

Current implementation doesn't have automatic fallback between providers. Consider:
- Primary: OpenRouter (user's preferred model)
- Fallback: Different model on OpenRouter
- Future: Secondary provider if OpenRouter unavailable

### Rate Limit Handling

Current: Show user-friendly error and suggest waiting.
Future: Could implement automatic retry with exponential backoff, or queue requests.

---

## References

### Internal Documentation

- Epic 02 Phase 3: `docs/learning/epic02_quizmaster_v1/PHASE3_API_INTEGRATION.md`
- Epic 03 Phase 1: `docs/learning/epic03_quizmaster_v2/PHASE1_BACKEND.md`
- Epic 03 Phase 3.6: `docs/learning/epic03_quizmaster_v2/PHASE3.6_OPENROUTER.md`
- Epic 04 Phase 10: `docs/learning/epic04_saberloop_v1/PHASE10_OPENROUTER_ONBOARDING_UX.md`

### External Resources

- [OpenRouter OAuth PKCE Documentation](https://openrouter.ai/docs/use-cases/oauth-pkce)
- [OpenRouter API Reference](https://openrouter.ai/docs/api-reference/overview)
- [OpenRouter Free Models](https://openrouter.ai/models?q=free)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Web Crypto API (for PKCE)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

*Last Updated: January 2026*
