# API Design

## Overview

Saberloop uses a **multi-provider LLM architecture** for AI-powered question generation. Users can choose their preferred AI provider:

- **OpenRouter** (default) - Direct browser calls via OAuth, free tier available
- **OpenAI, Anthropic, Google AI, xAI** - Via LLM Proxy for CORS bypass

All providers use the user's own API key, stored securely in IndexedDB.

## Architecture

| Component | Description |
|-----------|-------------|
| Provider Router | Routes requests to active provider |
| OpenRouter (Direct) | OAuth authentication, CORS-enabled |
| LLM Proxy | PHP backend for providers without CORS support |
| IndexedDB | Stores API keys securely in user's browser |

### Provider Support

| Provider | Connection Method | Key Format | CORS |
|----------|-------------------|------------|------|
| OpenRouter | Direct (browser) | OAuth PKCE | ✅ |
| OpenAI | LLM Proxy | `sk-...` | ❌ |
| Anthropic | LLM Proxy | `sk-ant-...` | ❌ |
| Google AI | LLM Proxy | `AIza...` | ❌ |
| xAI | LLM Proxy | `xai-...` | ❌ |

## OpenRouter Integration

### Base URL

```
https://openrouter.ai/api/v1/chat/completions
```

### Authentication

API key is obtained via OAuth and stored in IndexedDB:

```javascript
// src/api/openrouter-client.js
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': window.location.origin,
    'X-Title': 'SaberLoop'
  },
  body: JSON.stringify({
    model: 'tngtech/deepseek-r1t2-chimera:free',  // Default free model
    messages: [{ role: 'user', content: prompt }]
  })
});
```

---

## LLM Proxy (Multi-Provider)

For providers that don't support CORS (OpenAI, Anthropic, Google AI, xAI), requests are routed through the LLM Proxy.

### Base URL

```
https://saberloop.com/llm/
```

### Endpoints

#### Health Check

```
GET /llm/health.php
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-23T12:00:00Z"
}
```

#### Completion Request

```
POST /llm/completion.php
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | string | Yes | Provider ID: `openai`, `anthropic`, `google`, `xai` |
| `api_key` | string | Yes | User's API key for the provider |
| `model` | string | Yes | Model ID (e.g., `gpt-4`, `claude-3-5-sonnet-20241022`) |
| `messages` | array | Yes | Chat messages array |
| `max_tokens` | number | No | Maximum response tokens (default: 2048) |
| `temperature` | number | No | Sampling temperature (default: 0.7) |

**Request Example:**
```javascript
const response = await fetch('https://saberloop.com/llm/completion.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'openai',
    api_key: 'sk-...',
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Generate a quiz about space' }],
    max_tokens: 2048
  })
});
```

**Response:**
```json
{
  "text": "Here are quiz questions about space...",
  "model": "gpt-4o",
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 500,
    "total_tokens": 550
  }
}
```

**Error Response:**
```json
{
  "error": "Invalid API key",
  "provider": "openai"
}
```

### Provider-Specific Notes

| Provider | Model Examples | Notes |
|----------|---------------|-------|
| OpenAI | `gpt-4o`, `gpt-4-turbo`, `o1-preview` | Uses OpenAI chat completions API |
| Anthropic | `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229` | Converts to Anthropic messages API format |
| Google AI | `gemini-1.5-pro`, `gemini-1.5-flash` | Uses Gemini generateContent API |
| xAI | `grok-2`, `grok-2-mini` | Uses xAI chat completions API |

---

## API Functions

### Generate Questions

Generate quiz questions for a given topic.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `topic` | string | Yes | Quiz topic (2-200 characters) |
| `gradeLevel` | string | No | Target audience level (default: "middle school") |
| `apiKey` | string | Yes | User's OpenRouter API key |
| `options.language` | string | No | Language code for content (e.g., 'en', 'pt-PT') |
| `options.questionCount` | number | No | Number of questions (default: 5) |
| `options.previousQuestions` | array | No | Questions to exclude (for "Continue" feature) |

**Response:**
```json
{
  "language": "EN-US",
  "questions": [
    {
      "question": "Which planet is known as the Red Planet?",
      "options": [
        "A) Venus",
        "B) Mars",
        "C) Jupiter",
        "D) Saturn"
      ],
      "correct": 1,
      "difficulty": "easy"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `language` | string | Detected language code (e.g., "EN-US", "PT-PT") |
| `questions` | array | Array of 5 question objects |
| `questions[].question` | string | Question text |
| `questions[].options` | array | 4 answer options prefixed with A), B), C), D) |
| `questions[].correct` | number | Index of correct answer (0-3) |
| `questions[].difficulty` | string | "easy", "medium", or "hard" |

---

### Generate Explanation

Generate an explanation for why an answer was incorrect.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | Yes | The question text |
| `userAnswer` | string | Yes | User's incorrect answer |
| `correctAnswer` | string | Yes | The correct answer |
| `gradeLevel` | string | Yes | Education level for appropriate explanation |
| `apiKey` | string | Yes | User's OpenRouter API key |
| `language` | string | No | Language code for the explanation (default: 'en') |

**Response:**
```json
{
  "rightAnswerExplanation": "Mercury is the closest planet to the Sun, orbiting at an average distance of about 58 million kilometers.",
  "wrongAnswerExplanation": "Venus is actually the second planet from the Sun, not the first."
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error description",
  "message": "Additional context"
}
```

**Common Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Not connected to OpenRouter" | No API key stored | Connect via Settings |
| "Invalid API key" | Key expired or invalid | Reconnect to OpenRouter |
| "Rate limited" | Too many requests | Wait and retry |

---

## Frontend API Client

The frontend uses an abstraction layer to switch between mock and real APIs:

```javascript
// src/api/index.js
import { generateQuestions as realGenerate } from './api.real.js';
import { generateQuestions as mockGenerate } from './api.mock.js';

const useRealApi = import.meta.env.VITE_USE_REAL_API === 'true';

export const generateQuestions = useRealApi ? realGenerate : mockGenerate;
```

**Environment Variables:**

| Variable | Values | Description |
|----------|--------|-------------|
| `VITE_USE_REAL_API` | `true` / `false` | Use real API vs mock |

---

## Rate Limiting

Rate limiting is handled by OpenRouter based on the user's account tier.

---

## Model Selection

### Get Available Models

Fetches available free models from OpenRouter (cached for 24 hours).

**Endpoint:**
```
GET https://openrouter.ai/api/v1/models
```

**Client Code:**
```javascript
// src/services/model-service.js
import { getAvailableModels, getSelectedModel, saveSelectedModel } from '../services/model-service.js';

// Fetch free models (cached)
const models = await getAvailableModels(apiKey);

// Get currently selected model
const modelId = getSelectedModel();  // Returns default if none selected

// Save user's model selection
saveSelectedModel('anthropic/claude-3-haiku');
```

**Response (filtered for free models):**
```json
[
  {
    "id": "tngtech/deepseek-r1t2-chimera:free",
    "name": "DeepSeek R1T2 Chimera",
    "description": "...",
    "contextLength": 32768
  }
]
```

**Default Model:** `tngtech/deepseek-r1t2-chimera:free`

---

## Related Documentation

- [System Overview](./SYSTEM_OVERVIEW.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Deployment](./DEPLOYMENT.md)
- [LLM Integration Evolution](./LLM_INTEGRATION_EVOLUTION.md)
