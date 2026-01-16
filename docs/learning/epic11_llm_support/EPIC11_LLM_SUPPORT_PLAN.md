# Epic 11: Multi-Provider LLM Support

**Status:** Planning
**Created:** January 2026
**Prerequisites:** Epic 06 Complete, OpenRouter integration working

---

## Overview

### Problem Statement

Currently, SaberLoop uses OpenRouter exclusively for LLM access. While OpenRouter provides excellent CORS support and multi-model access, some users may prefer:

1. **Lower costs** - Direct provider APIs avoid OpenRouter's ~10-20% markup
2. **Privacy** - Direct connection without intermediary
3. **Specific features** - Provider-specific capabilities not exposed via OpenRouter
4. **Existing accounts** - Users with existing API credits at specific providers

### Solution

Add optional support for users to configure their own API keys from:
- OpenAI
- Anthropic
- Google Gemini
- xAI Grok

OpenRouter remains the default and recommended option (CORS support, OAuth flow).

### Success Criteria

- [ ] Users can add/remove API keys for each supported provider
- [ ] Users can select which provider to use for quiz generation
- [ ] Backend proxy correctly routes requests to each provider
- [ ] All existing functionality continues to work
- [ ] Clear UI indication of which provider is active
- [ ] Cost tracking works for all providers

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ IndexedDB: Provider Keys                                      │   │
│  │  - openrouter_key: "sk-or-..."                               │   │
│  │  - openai_key: "sk-..."         (optional)                   │   │
│  │  - anthropic_key: "sk-ant-..."  (optional)                   │   │
│  │  - google_key: "AIza..."        (optional)                   │   │
│  │  - xai_key: "xai-..."           (optional)                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Provider Router (src/api/provider-router.js)                  │   │
│  │  - Checks selected provider                                   │   │
│  │  - Routes to direct API (OpenRouter) or proxy (others)       │   │
│  └─────────────────────┬────────────────────────────────────────┘   │
│                        │                                             │
└────────────────────────┼─────────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼ (CORS ✅)                     ▼ (CORS ❌)
┌─────────────────┐           ┌──────────────────────────────────┐
│   OpenRouter    │           │   VPS: saberloop.com/llm/        │
│   (direct)      │           │                                  │
└─────────────────┘           │   ┌──────────────────────────┐   │
                              │   │ LLM Proxy (PHP)          │   │
                              │   │ - Validates request      │   │
                              │   │ - Routes to provider     │   │
                              │   │ - Normalizes response    │   │
                              │   │ - Does NOT store keys    │   │
                              │   └───────────┬──────────────┘   │
                              │               │                  │
                              └───────────────┼──────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
             ┌───────────┐             ┌───────────┐             ┌───────────┐
             │  OpenAI   │             │ Anthropic │             │  Google   │
             │  xAI      │             │           │             │           │
             └───────────┘             └───────────┘             └───────────┘
```

### Deployment Architecture

```
saberloop.com/
├── app/              # Frontend (existing)
├── party/            # Party Mode signaling (existing)
├── telemetry/        # Telemetry endpoints (existing)
└── llm/              # NEW: LLM proxy endpoints
    ├── completion.php
    └── health.php
```

**Rationale:** Separate `/llm/` path for:
- Clear separation of concerns
- Independent scaling if needed
- Easier monitoring/logging
- Can be rate-limited separately

---

## Phases

### Phase 1: Backend Proxy (P0)

**Goal:** Create the LLM proxy that routes requests to different providers.

#### Tasks

1. **Create LLM proxy handler**
   - `php-api/src/handlers/LLMCompletion.php`
   - Support OpenAI, Anthropic, Google, xAI
   - Normalize request/response formats
   - Error handling per provider

2. **Create endpoint**
   - `php-api/llm/completion.php`
   - CORS headers
   - Input validation

3. **Create health check**
   - `php-api/llm/health.php`
   - Verify proxy is running

4. **Deploy to VPS**
   - Create `/llm/` directory
   - Configure Apache/Nginx
   - Test endpoints

#### Acceptance Criteria

- [ ] POST `/llm/completion` accepts provider, api_key, messages, model
- [ ] Returns normalized response format
- [ ] Handles errors gracefully
- [ ] Does not log API keys

---

### Phase 2: Frontend Provider Router (P0)

**Goal:** Smart routing between direct OpenRouter calls and proxy calls.

#### Tasks

1. **Create provider configuration**
   - `src/api/providers-config.js`
   - Provider metadata (CORS support, key format, etc.)

2. **Create provider router**
   - `src/api/provider-router.js`
   - Route based on selected provider
   - Handle both direct and proxy calls

3. **Update api.real.js**
   - Use provider router instead of direct OpenRouter calls
   - Maintain backward compatibility

#### Acceptance Criteria

- [ ] OpenRouter calls go direct (no change from current)
- [ ] Other provider calls go through proxy
- [ ] Response format is consistent regardless of provider

---

### Phase 3: Key Management (P1)

**Goal:** Allow users to add/remove API keys for each provider.

#### Tasks

1. **Create key storage service**
   - `src/services/api-keys-service.js`
   - Store/retrieve keys from IndexedDB
   - Validate key format

2. **Create settings UI component**
   - `src/components/ProviderSettings.js`
   - Add/edit/remove keys
   - Show key status (valid/invalid/not set)

3. **Update SettingsView**
   - Add provider settings section
   - Integrate with existing settings

#### Acceptance Criteria

- [ ] Users can add API keys for each provider
- [ ] Keys are stored securely in IndexedDB
- [ ] Invalid key formats are rejected
- [ ] Keys can be removed

---

### Phase 4: Provider Selection UI (P1)

**Goal:** Allow users to choose which provider to use.

#### Tasks

1. **Add provider selector**
   - In quiz creation flow
   - Show only providers with configured keys
   - Remember last selection

2. **Show active provider indicator**
   - In quiz view
   - In results view

3. **Update cost tracking**
   - Show costs for selected provider
   - Different pricing per provider

#### Acceptance Criteria

- [ ] Users can select provider before generating quiz
- [ ] Provider selection persists across sessions
- [ ] Cost estimates adjust based on provider

---

### Phase 5: Testing & Polish (P2)

**Goal:** Comprehensive testing and UX improvements.

#### Tasks

1. Unit tests for proxy
2. Unit tests for provider router
3. E2E tests for full flow
4. Maestro tests for mobile UI
5. Error handling improvements
6. Loading states
7. i18n strings

---

## UI Design

### Wireframes

#### Settings View - Provider Configuration

```
┌─────────────────────────────────────────────────────────────┐
│  ← Settings                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ LLM Providers                                           ││
│  ├─────────────────────────────────────────────────────────┤│
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ OpenRouter                        ✅ Connected   │   ││
│  │  │ Current default • OAuth connected               │   ││
│  │  │                              [Disconnect]       │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ OpenAI                            ✅ Valid       │   ││
│  │  │ GPT-4o, GPT-4o-mini • sk-...7x2Q               │   ││
│  │  │                     [Change Key] [Remove]      │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ Anthropic                      🔄 Validating... │   ││
│  │  │ Claude 3.5 Sonnet, Claude 3 Opus               │   ││
│  │  │                     [Change Key] [Remove]      │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ Google AI                         ○ Not configured││
│  │  │ Gemini 2.5 Flash, Gemini 2.5 Pro • Free tier    │   ││
│  │  │                              [Add API Key]      │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ xAI                               ○ Not configured││
│  │  │ Grok 4 Fast, Grok 3                             │   ││
│  │  │                              [Add API Key]      │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ℹ️ OpenRouter is recommended for easiest setup.         ││
│  │    Add direct provider keys for lower costs or          ││
│  │    specific model access.                               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Add API Key Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Add OpenAI API Key                                    [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Enter your OpenAI API key. You can get one from:           │
│  https://platform.openai.com/api-keys                       │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ sk-...                                                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ⚠️ Your API key is stored locally on your device.          │
│     It is sent to our server only when making LLM calls.    │
│     We never store your key on our servers.                 │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Available Models:                                      ││
│  │  • gpt-4o ($2.50/1M in, $10/1M out)                    ││
│  │  • gpt-4o-mini ($0.15/1M in, $0.60/1M out)             ││
│  │  • gpt-4-turbo ($10/1M in, $30/1M out)                 ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│                              [Cancel]  [Save Key]            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Provider Selector (Quiz Creation)

```
┌─────────────────────────────────────────────────────────────┐
│  Create Quiz                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Topic: [World War II                              ]        │
│                                                              │
│  Grade Level: [8th Grade                          ▼]        │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ LLM Provider                                            ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ ○ OpenRouter (default)                              │ ││
│  │ │   Model: [claude-3.5-sonnet              ▼]         │ ││
│  │ │   ~$0.015/quiz                                      │ ││
│  │ ├─────────────────────────────────────────────────────┤ ││
│  │ │ ○ OpenAI                                            │ ││
│  │ │   Model: [gpt-4o-mini                    ▼]         │ ││
│  │ │   ~$0.0006/quiz                                     │ ││
│  │ ├─────────────────────────────────────────────────────┤ ││
│  │ │ ● Google AI                                         │ ││
│  │ │   Model: [gemini-2.5-flash               ▼]         │ ││
│  │ │   ~$0.0003/quiz (free tier)                         │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│                              [Generate Quiz]                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Provider Selector (Expanded Model Dropdown)

```
┌─────────────────────────────────────────────────────────────┐
│  │ ● Google AI                                         │    │
│  │   Model: [gemini-2.5-flash               ▼]         │    │
│  │          ┌─────────────────────────────────┐        │    │
│  │          │ gemini-2.5-flash    $0.075/1M  │◀──────│    │
│  │          │ gemini-2.5-pro      $1.25/1M   │        │    │
│  │          │ gemini-flash-lite   $0.075/1M  │        │    │
│  │          └─────────────────────────────────┘        │    │
│  │   ~$0.0003/quiz (free tier)                         │    │
└─────────────────────────────────────────────────────────────┘
```

#### Provider Indicator (Quiz View)

```
┌─────────────────────────────────────────────────────────────┐
│  Question 3 of 5                          [Google AI] 🤖    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  What was the primary cause of World War II?                │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ A) The assassination of Archduke Franz Ferdinand        ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ B) Germany's invasion of Poland                         ││
│  └─────────────────────────────────────────────────────────┘│
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## i18n Strings

### New Translation Keys

```javascript
// src/i18n/en.json (additions)
{
  "settings": {
    "llmProviders": {
      "title": "LLM Providers",
      "description": "Configure AI providers for quiz generation",
      "openrouterRecommended": "OpenRouter is recommended for easiest setup. Add direct provider keys for lower costs or specific model access.",
      "connected": "Connected",
      "notConfigured": "Not configured",
      "addApiKey": "Add API Key",
      "changeKey": "Change Key",
      "removeKey": "Remove",
      "disconnect": "Disconnect",
      "currentDefault": "Current default",
      "freeTier": "Free tier available",
      "keyStatus": {
        "valid": "Valid",
        "invalid": "Invalid",
        "validating": "Validating...",
        "notSet": "Not configured"
      },
      "keyMasked": "{{prefix}}...{{suffix}}"
    },
    "addKeyModal": {
      "title": "Add {{provider}} API Key",
      "titleChange": "Change {{provider}} API Key",
      "enterKey": "Enter your {{provider}} API key. You can get one from:",
      "securityNote": "Your API key is stored locally on your device. It is sent to our server only when making LLM calls. We never store your key on our servers.",
      "availableModels": "Available Models",
      "cancel": "Cancel",
      "saveKey": "Save Key",
      "invalidFormat": "Invalid API key format. {{provider}} keys should start with '{{prefix}}'.",
      "keyUpdated": "API key updated. Validating...",
      "validationSuccess": "API key is valid!",
      "validationFailed": "API key validation failed: {{error}}"
    },
    "removeKeyModal": {
      "title": "Remove {{provider}} API Key",
      "confirm": "Are you sure you want to remove your {{provider}} API key?",
      "cancel": "Cancel",
      "remove": "Remove Key"
    }
  },
  "quiz": {
    "providerSelector": {
      "title": "LLM Provider",
      "selectModel": "Model",
      "default": "default",
      "costPerQuiz": "~{{cost}}/quiz",
      "costPerMillion": "{{cost}}/1M",
      "freeTierAvailable": "free tier"
    },
    "providerIndicator": {
      "poweredBy": "Powered by {{provider}}",
      "model": "Model: {{model}}"
    }
  },
  "errors": {
    "providerError": "Error from {{provider}}: {{message}}",
    "proxyError": "Could not connect to LLM service. Please try again.",
    "invalidApiKey": "Invalid API key for {{provider}}. Please check your key in Settings.",
    "rateLimited": "Rate limit exceeded for {{provider}}. Please wait and try again.",
    "quotaExceeded": "API quota exceeded for {{provider}}. Check your account balance."
  }
}
```

### Languages to Update

- `src/i18n/en.json` - English (primary)
- `src/i18n/pt.json` - Portuguese
- `src/i18n/es.json` - Spanish
- (other languages as applicable)

---

## Testing Strategy

### Unit Tests

#### Backend (PHP)

```
tests/php/
├── LLMCompletionTest.php
│   ├── test_validates_required_fields
│   ├── test_rejects_unsupported_provider
│   ├── test_builds_openai_payload_correctly
│   ├── test_builds_anthropic_payload_correctly
│   ├── test_builds_google_payload_correctly
│   ├── test_builds_xai_payload_correctly
│   ├── test_normalizes_openai_response
│   ├── test_normalizes_anthropic_response
│   ├── test_normalizes_google_response
│   ├── test_handles_provider_errors
│   └── test_does_not_log_api_keys
```

#### Frontend (Vitest)

```
tests/unit/
├── provider-router.test.js
│   ├── routes OpenRouter calls directly
│   ├── routes other providers through proxy
│   ├── handles missing API key
│   └── returns normalized response format
├── api-keys-service.test.js
│   ├── stores key in IndexedDB
│   ├── retrieves key from IndexedDB
│   ├── validates key format
│   ├── deletes key
│   └── lists configured providers
└── providers-config.test.js
    ├── returns correct CORS status
    ├── returns correct key prefix
    └── returns correct endpoint
```

### E2E Tests (Playwright)

```
tests/e2e/
├── provider-settings.spec.js
│   ├── displays all providers in settings
│   ├── shows OpenRouter as connected
│   ├── can add API key for provider
│   ├── validates key format
│   ├── can remove API key
│   └── persists keys across sessions
├── provider-selection.spec.js
│   ├── shows only configured providers
│   ├── can select different provider
│   ├── shows cost estimate per provider
│   └── remembers provider selection
└── provider-quiz-flow.spec.js (with mocked proxy)
    ├── generates quiz via OpenRouter (direct)
    ├── generates quiz via OpenAI (proxy)
    ├── generates quiz via Anthropic (proxy)
    ├── handles provider error gracefully
    └── shows provider indicator during quiz
```

### Maestro Tests (Mobile)

```
tests/maestro/
├── provider_settings_flow.yaml
│   ├── navigate to settings
│   ├── scroll to LLM providers section
│   ├── tap add API key
│   ├── enter key
│   ├── verify key saved
│   └── verify provider shows as configured
├── provider_selection_flow.yaml
│   ├── navigate to quiz creation
│   ├── expand provider selector
│   ├── select different provider
│   ├── verify selection persisted
│   └── generate quiz with selected provider
└── provider_error_handling.yaml
    ├── configure invalid key
    ├── attempt to generate quiz
    └── verify error message displayed
```

### Test Data / Mocking Strategy

1. **E2E tests:** Mock the `/llm/completion` endpoint to return predictable responses
2. **Unit tests:** Mock fetch/HTTP calls
3. **Integration tests:** Can optionally use real providers with test keys (manual, not CI)

---

## Deployment Strategy

### Backend Deployment

#### Directory Structure on VPS

```
/var/www/saberloop.com/
├── app/              # Frontend (existing)
├── party/            # Party Mode (existing)
│   ├── endpoints/
│   ├── Database.php
│   └── ...
├── telemetry/        # Telemetry (existing)
│   └── ...
└── llm/              # NEW
    ├── completion.php
    ├── health.php
    └── src/
        └── handlers/
            └── LLMCompletion.php
```

#### Apache/Nginx Configuration

Add to existing configuration:

```apache
# LLM Proxy endpoints
<Directory /var/www/saberloop.com/llm>
    AllowOverride All
    Require all granted
</Directory>

# Rate limiting for LLM proxy (optional)
<Location /llm/completion>
    SetEnvIf Request_URI "^/llm/completion" rate_limit
    # Limit to 60 requests per minute per IP
</Location>
```

#### Deployment Steps

1. Create `/llm/` directory on VPS
2. Upload PHP files
3. Test health endpoint: `curl https://saberloop.com/llm/health.php`
4. Test completion endpoint with test data
5. Monitor logs for errors

### Frontend Deployment

Standard deployment via existing FTP/CI process:
1. Build: `npm run build`
2. Deploy: `npm run deploy`

### Rollout Strategy

1. **Phase 1:** Deploy backend proxy (no frontend changes)
2. **Phase 2:** Deploy frontend with feature flag disabled
3. **Phase 3:** Enable feature flag for beta testers
4. **Phase 4:** Enable for all users
5. **Phase 5:** Remove feature flag

#### Feature Flag

```javascript
// src/core/feature-flags.js
export const FEATURES = {
  MULTI_PROVIDER_LLM: false  // Enable when ready
};
```

---

## Security Considerations

### API Key Handling

| Location | Storage | Notes |
|----------|---------|-------|
| Browser | IndexedDB | User's own keys, encrypted at rest by browser |
| In transit | HTTPS | All requests use TLS |
| Backend | Memory only | Keys read from request, never persisted |
| Logs | Excluded | Never log request bodies containing keys |

### Rate Limiting

Implement rate limiting on `/llm/completion` to prevent abuse:
- 60 requests per minute per IP
- Return 429 Too Many Requests when exceeded

### Input Validation

- Validate provider is in allowed list
- Validate API key format (prefix check)
- Validate messages array structure
- Sanitize any user content

### Error Messages

- Don't expose internal errors to client
- Don't include API keys in error responses
- Log detailed errors server-side only

---

## Design Decisions (Resolved)

1. **Model selection per provider:** ✅ **Allow specific model selection**
   - Users can select specific models for each provider
   - Show available models with pricing in the UI
   - Remember last selected model per provider

2. **Key validation:** ✅ **Hybrid approach (Option C)**
   - On save: Format validation only (instant feedback, works offline)
   - After save: Async background validation when online
   - Update status indicator: "Validating..." → "Valid" / "Invalid"
   - Benefits: Fast UX, eventual confirmation, works offline

3. **Cost tracking:** ✅ **Yes, display costs for all providers**
   - Use token counts from API responses
   - Multiply by known pricing per model
   - Show in results view same as OpenRouter

4. **Offline keys:** ✅ **No special handling needed**
   - Store locally in IndexedDB
   - Validate on first actual use
   - Same pattern as current OpenRouter implementation

5. **Mid-quiz provider switch:** ✅ **Not allowed**
   - Provider is locked for duration of quiz
   - Selection only applies to next quiz creation
   - Prevents inconsistent quiz data

---

## Timeline Estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Backend Proxy | 2-3 days | None |
| Phase 2: Frontend Router | 1-2 days | Phase 1 |
| Phase 3: Key Management | 2-3 days | Phase 2 |
| Phase 4: Provider Selection UI | 2-3 days | Phase 3 |
| Phase 5: Testing & Polish | 3-4 days | Phase 4 |

**Total:** ~10-15 days

---

## References

- `docs/learning/epic11_llm_support/RESEARCH_PROVIDER_ANALYSIS.md` - Provider research
- `docs/architecture/LLM_INTEGRATION_EVOLUTION.md` - Historical context
- `docs/learning/epic03_quizmaster_v2/PHASE3.6_OPENROUTER.md` - Current OpenRouter implementation
- `php-api/src/AnthropicClient.php` - Existing Anthropic client (reference)

---

*Last Updated: January 2026*
