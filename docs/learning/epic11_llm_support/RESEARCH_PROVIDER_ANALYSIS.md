# LLM Provider Analysis

**Epic:** 11 - Multi-Provider LLM Support
**Document Type:** Research & Analysis
**Date:** January 2026
**Status:** Complete

---

## Executive Summary

This document captures the research conducted to evaluate LLM providers for potential direct integration in SaberLoop. The goal is to allow users to use their own API keys from multiple providers, in addition to the existing OpenRouter integration.

### Key Finding

**OpenRouter remains the recommended default** due to CORS support and OAuth PKCE. However, adding direct provider support gives users flexibility and potentially lower costs.

| Provider | CORS | Free Tier | Viable for Direct Integration |
|----------|------|-----------|-------------------------------|
| OpenRouter | ✅ Yes | ✅ 50 RPD | ✅ Current (browser-direct) |
| OpenAI | ❌ No | ❌ None | ✅ Via backend proxy |
| Anthropic | ❌ No | ❌ None | ✅ Via backend proxy |
| Google Gemini | ❌ No | ✅ Limited | ✅ Via backend proxy |
| xAI Grok | ❌ No | ❌ None | ✅ Via backend proxy |

---

## Provider Deep Dive

### 1. OpenRouter (Current Implementation)

**Status:** ✅ Implemented and in production

#### Technical Details

| Aspect | Value |
|--------|-------|
| API Endpoint | `https://openrouter.ai/api/v1/chat/completions` |
| CORS Support | ✅ Yes - browser-direct calls work |
| Authentication | OAuth PKCE or API key |
| Free Tier | 50 requests/day |
| Credit Card Required | No |

#### Why It Works for Browser-Direct

OpenRouter explicitly designed their API for client-side use:
- Sends proper `Access-Control-Allow-Origin` headers
- OAuth PKCE flow for secure browser-based authentication
- API keys can be safely stored client-side (user's own key)

#### Models Available

Access to 100+ models from multiple providers:
- Anthropic Claude (claude-3.5-sonnet, claude-3-opus, etc.)
- OpenAI GPT (gpt-4o, gpt-4-turbo, etc.)
- Google (gemini-2.0-flash, gemini-2.5-pro)
- xAI (grok-4-fast, grok-3)
- Meta Llama, Mistral, DeepSeek, and more

#### Pricing Model

- Markup over base provider prices (~10-20%)
- User pays directly to OpenRouter
- Free tier available with data training opt-in

#### Current Implementation Files

- `src/api/openrouter-client.js` - API wrapper
- `src/api/openrouter-auth.js` - OAuth PKCE flow
- `src/api/api.real.js` - Business logic using OpenRouter

---

### 2. OpenAI

**Status:** Requires backend proxy for integration

#### Technical Details

| Aspect | Value |
|--------|-------|
| API Endpoint | `https://api.openai.com/v1/chat/completions` |
| CORS Support | ❌ No - blocks browser requests |
| Authentication | API key in `Authorization: Bearer` header |
| Free Tier | ❌ None (discontinued late 2025) |
| Credit Card Required | Yes |
| Minimum Prepay | $5 |

#### CORS Behavior

When calling from browser:
```
Access to fetch at 'https://api.openai.com/v1/chat/completions'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin'
header is present on the requested resource.
```

#### API Format

OpenAI-compatible format (used by many providers):

```json
{
  "model": "gpt-4o",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "max_tokens": 2048,
  "temperature": 0.7
}
```

#### Response Format

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "model": "gpt-4o",
  "choices": [{
    "index": 0,
    "message": {"role": "assistant", "content": "Hello! How can I help?"},
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  }
}
```

#### Pricing (January 2026)

| Model | Input (per 1M) | Output (per 1M) |
|-------|----------------|-----------------|
| gpt-4o | $2.50 | $10.00 |
| gpt-4o-mini | $0.15 | $0.60 |
| gpt-4-turbo | $10.00 | $30.00 |
| o1-preview | $15.00 | $60.00 |

#### Integration Requirements

- Backend proxy endpoint
- API key passed from client to proxy
- Proxy forwards to OpenAI with key in header

---

### 3. Anthropic

**Status:** Requires backend proxy for integration

#### Technical Details

| Aspect | Value |
|--------|-------|
| API Endpoint | `https://api.anthropic.com/v1/messages` |
| CORS Support | ❌ No - blocks browser requests |
| Authentication | `x-api-key` header + `anthropic-version` header |
| Free Tier | ❌ None |
| Credit Card Required | Yes |

#### CORS Behavior

Same as OpenAI - no `Access-Control-Allow-Origin` header.

#### API Format (Different from OpenAI)

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 2048,
  "messages": [
    {"role": "user", "content": "Hello!"}
  ]
}
```

Required headers:
```
x-api-key: sk-ant-...
anthropic-version: 2023-06-01
Content-Type: application/json
```

#### Response Format

```json
{
  "id": "msg_123",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-4-20250514",
  "content": [{"type": "text", "text": "Hello! How can I help?"}],
  "usage": {
    "input_tokens": 10,
    "output_tokens": 15
  }
}
```

#### Pricing (January 2026)

| Model | Input (per 1M) | Output (per 1M) |
|-------|----------------|-----------------|
| claude-3.5-sonnet | $3.00 | $15.00 |
| claude-3-opus | $15.00 | $75.00 |
| claude-3-haiku | $0.25 | $1.25 |

#### Integration Requirements

- Backend proxy endpoint
- Different request/response format than OpenAI
- Requires `anthropic-version` header

#### Existing Code Reference

`php-api/src/AnthropicClient.php` - Already implemented for previous backend architecture.

---

### 4. Google Gemini

**Status:** Requires backend proxy for integration

#### Technical Details

| Aspect | Value |
|--------|-------|
| API Endpoint | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` |
| CORS Support | ❌ No - blocks browser requests |
| Authentication | API key as query parameter `?key=API_KEY` |
| Free Tier | ✅ Yes (limited, reduced Dec 2025) |
| Credit Card Required | No |

#### CORS Behavior

```
Access to fetch at 'https://generativelanguage.googleapis.com/...'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin'
header is present on the requested resource.
```

#### Free Tier Details (Post-December 2025 Reduction)

| Model | RPM | RPD |
|-------|-----|-----|
| Gemini 2.5 Pro | 5 | 25 |
| Gemini 2.5 Flash | 15 | 20 |
| Gemini Flash-Lite | 15 | ~1000 |

**Note:** Free tier was reduced by 50-92% in December 2025.

#### API Format (Different from OpenAI)

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{"text": "Hello!"}]
    }
  ],
  "generationConfig": {
    "maxOutputTokens": 2048,
    "temperature": 0.7
  }
}
```

#### Response Format

```json
{
  "candidates": [{
    "content": {
      "parts": [{"text": "Hello! How can I help?"}],
      "role": "model"
    },
    "finishReason": "STOP"
  }],
  "usageMetadata": {
    "promptTokenCount": 10,
    "candidatesTokenCount": 15,
    "totalTokenCount": 25
  }
}
```

#### Pricing (January 2026)

| Model | Input (per 1M) | Output (per 1M) |
|-------|----------------|-----------------|
| Gemini 2.5 Flash | $0.075 | $0.30 |
| Gemini 2.5 Pro | $1.25 | $5.00 |
| Gemini Flash-Lite | $0.075 | $0.30 |

#### Integration Requirements

- Backend proxy endpoint
- Different request/response format
- API key in URL query parameter (not header)

---

### 5. xAI Grok

**Status:** Requires backend proxy for integration

#### Technical Details

| Aspect | Value |
|--------|-------|
| API Endpoint | `https://api.x.ai/v1/chat/completions` |
| CORS Support | ❌ No - blocks browser requests |
| Authentication | `Authorization: Bearer` header (OpenAI-compatible) |
| Free Tier | ❌ None (API) / ✅ Limited (consumer product) |
| Credit Card Required | Yes |

#### API Format

Uses OpenAI-compatible format:

```json
{
  "model": "grok-4-fast",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "max_tokens": 2048
}
```

#### Response Format

OpenAI-compatible response format.

#### Pricing (January 2026)

| Model | Input (per 1M) | Output (per 1M) |
|-------|----------------|-----------------|
| grok-4-fast | $0.20 | $0.50 |
| grok-4-fast (>128K) | $0.40 | $1.00 |
| grok-3 | $3.00 | $15.00 |

#### Special Feature: Ephemeral Tokens

xAI provides ephemeral tokens for their Realtime/Voice API:
- Short-lived tokens (5 minutes)
- Allows browser-side WebSocket connections
- Only for Voice Agent API, not chat completions

#### Integration Requirements

- Backend proxy endpoint
- OpenAI-compatible format (simpler integration)

---

## API Format Comparison

### Request Formats

| Provider | Message Format | Auth Location |
|----------|---------------|---------------|
| OpenAI | `messages: [{role, content}]` | Header: `Authorization` |
| Anthropic | `messages: [{role, content}]` | Header: `x-api-key` |
| Google | `contents: [{role, parts}]` | Query: `?key=` |
| xAI | `messages: [{role, content}]` | Header: `Authorization` |

### Response Normalization

All providers return different response structures. The backend proxy should normalize to a common format:

```json
{
  "text": "Response content here",
  "model": "model-name-used",
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  },
  "provider": "openai"
}
```

---

## Cost Comparison

For a typical quiz generation (5 questions):
- Estimated input: ~500 tokens
- Estimated output: ~800 tokens

| Provider | Model | Cost per Quiz |
|----------|-------|---------------|
| OpenRouter | claude-3.5-sonnet | ~$0.015 |
| OpenAI | gpt-4o-mini | ~$0.0006 |
| OpenAI | gpt-4o | ~$0.009 |
| Anthropic | claude-3.5-sonnet | ~$0.014 |
| Google | gemini-2.5-flash | ~$0.0003 |
| xAI | grok-4-fast | ~$0.0005 |

**Note:** OpenRouter adds ~10-20% markup but provides CORS support and unified API.

---

## Recommendation Matrix

| Use Case | Recommended Provider |
|----------|---------------------|
| Default (easiest setup) | OpenRouter |
| Lowest cost | Google Gemini (free tier) or gpt-4o-mini |
| Best quality | Anthropic Claude or OpenAI o1 |
| Longest context | Google Gemini (1M) or xAI Grok (2M) |
| Privacy conscious | Direct provider (no middleman) |

---

## References

### Documentation Links

- [OpenRouter API Docs](https://openrouter.ai/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Anthropic API Reference](https://docs.anthropic.com/en/api)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [xAI API Documentation](https://docs.x.ai/)

### Internal Documentation

- `docs/architecture/LLM_INTEGRATION_EVOLUTION.md` - Historical context
- `docs/learning/epic03_quizmaster_v2/PHASE3.6_OPENROUTER.md` - OpenRouter implementation

---

*Last Updated: January 2026*
