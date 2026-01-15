# System Architecture Overview

## High-Level Architecture

Saberloop is a **client-side PWA**. Core quiz functionality (AI calls) is made directly from the browser using OpenRouter (user-provided API keys). Party Mode uses a PHP signaling server for WebRTC coordination.

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                        (Frontend)                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │   SPA Router     │    │   IndexedDB      │               │
│  │   (Hash-based)   │    │   (Persistence)  │               │
│  └────────┬─────────┘    └──────────────────┘               │
│           │                      │                           │
│  ┌────────▼─────────────────────────────────┐               │
│  │              Views                        │               │
│  │  Home │ Quiz │ Results │ Settings │ Help  │               │
│  │  Topics │ Welcome │ Loading │ Import │    │               │
│  │  Party: Create │ Join │ Lobby │ Quiz │    │               │
│  └────────┬─────────────────────────────────┘               │
│           │                                                  │
│  ┌────────▼─────────────────────────────────┐               │
│  │           API Client Layer               │               │
│  │     (Mock API / OpenRouter Client)       │               │
│  └────────┬─────────────────────────────────┘               │
│           │                                                  │
└───────────┼──────────────────────────────────────────────────┘
            │ HTTPS (direct from browser)
            │
            ▼
┌───────────────────────────────────────────────────────────────┐
│                       OpenRouter API                          │
│              (User-provided API key in browser)               │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Supported Models:                                            │
│  - Claude (Anthropic)                                         │
│  - GPT-4 (OpenAI)                                             │
│  - Gemini (Google)                                            │
│  - Llama, Mistral, and more                                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Note:** Core quiz functionality requires no server-side backend - the app is fully static for solo play. Party Mode requires the PHP signaling server (`php-api/party/`) for WebRTC coordination.

## Components

### Frontend

| Component | Technology | Purpose |
|-----------|------------|---------|
| Build Tool | Vite | Fast development, optimized builds |
| Language | Vanilla JavaScript (ES6+) | No framework overhead |
| Routing | Hash-based SPA router | Client-side navigation |
| State | In-memory + IndexedDB | Persistence across sessions |
| Styling | Tailwind CSS (PostCSS) | Utility-first CSS |
| PWA | Vite PWA Plugin + Workbox | Offline support, installability |

### Application Layers

| Layer | Directory | Purpose |
|-------|-----------|---------|
| Views | `src/views/` | UI presentation, user interaction |
| Services | `src/services/` | Business logic, coordinates api/db |
| API | `src/api/` | External API calls (OpenRouter) |
| Core | `src/core/` | Database, state, router, settings, i18n, feature flags |
| Components | `src/components/` | Reusable presentational UI |
| Utils | `src/utils/` | Shared utilities (logger, network, telemetry, share, retry, JSON extraction, ads, formatters, storage, shuffle, errorHandler, performance) |
| Features | `src/features/` | Feature modules (onboarding, sample-loader) |
| Data | `src/data/` | Static data files (sample quizzes) |

### AI Integration (Client-Side)

| Component | Technology | Purpose |
|-----------|------------|---------|
| API Gateway | OpenRouter | Multi-model AI access |
| Key Storage | IndexedDB | Secure local storage |
| Default Model | DeepSeek R1T2 Chimera (free) | User-selectable, free tier default |

**Services Layer:**
- `quiz-service.js` - Quiz operations (history, sessions, generation)
- `auth-service.js` - Authentication (connection status, OAuth flow)
- `model-service.js` - AI model selection, free model discovery
- `cost-service.js` - LLM usage cost tracking and formatting
- `data-service.js` - User data management (export, deletion)
- `quiz-import.js` - Import quizzes from shared URLs
- `quiz-serializer.js` - Serialize/deserialize quizzes for sharing
- `quiz-share.js` - Quiz sharing functionality
- `theme-manager.js` - Learning/Party mode theming
- `party-api.js` - Party Mode signaling server API
- `party-session.js` - Party session state management
- `signaling-client.js` - WebRTC signaling client
- `p2p-service.js` - Peer-to-peer WebRTC connections
- `party-connection-manager.js` - WebRTC connection lifecycle
- `party-connection-store.js` - Connection state storage

**No Server Backend Required:**
- Users provide their own OpenRouter API key
- API calls made directly from browser to OpenRouter
- Keys stored securely in browser's IndexedDB

### Data Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| Client Storage | IndexedDB | Quiz sessions, questions, API keys |
| User Preferences | localStorage | Settings, language preference, model cache |
| Library | idb | Promise-based IndexedDB wrapper |

### Internationalization (i18n)

| Component | Technology | Purpose |
|-----------|------------|---------|
| Library | i18next | Translation framework |
| Detection | i18next-browser-languagedetector | Auto-detect user language |
| Storage | localStorage | Persist language preference |

**Supported Languages:**
- English (en) - Default
- Portuguese (pt-PT)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Dutch (nl)
- Norwegian (no)
- Russian (ru)

Translation files are loaded dynamically from `/locales/{lang}.json`.

### Feature Flags

The app uses a feature flag system (`src/core/features.js`) for gradual rollout:

| Phase | Behavior |
|-------|----------|
| DISABLED | Feature code exists but is not active |
| SETTINGS_ONLY | Only accessible via Settings page |
| ENABLED | Available everywhere |

**Current Feature Flags:**
- `SHOW_ADS` - Display Google AdSense ads during loading screens

### Telemetry

Self-hosted observability via `src/utils/telemetry.js`:

| Feature | Description |
|---------|-------------|
| Event Batching | Collects events, sends in batches |
| Offline Queue | localStorage fallback when offline |
| Privacy | Self-hosted VPS, no third-party services |

### PHP Backend (`php-api/`)

Server-side services deployed to VPS:

| Component | Path | Purpose |
|-----------|------|---------|
| Party Signaling | `php-api/party/` | WebRTC coordination for Party Mode |
| Telemetry | `php-api/telemetry/` | Event ingestion endpoint |

**Party Mode API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/party/rooms` | Create a new room |
| GET | `/party/rooms/{code}` | Get room info |
| POST | `/party/rooms/{code}/join` | Join a room |
| POST | `/party/rooms/{code}/leave` | Leave a room |
| POST | `/party/rooms/{code}/start` | Start quiz (host only) |
| POST | `/party/signal` | Send WebRTC signaling message |
| GET | `/party/signal/{code}/{id}` | Poll for signaling messages |

**PHP Classes:**
- `RoomManager.php` - Room CRUD, participant management, scoring
- `SignalingManager.php` - WebRTC offer/answer/ICE exchange
- `Database.php` - PDO connection singleton
- `ApiHelper.php` - CORS, JSON helpers, error handling

## Data Flow

### Quiz Generation Flow

```
User enters topic
       │
       ▼
┌──────────────┐
│ TopicView    │ ──── User input validation
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ API Client   │ ──── Call OpenRouter from browser
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ OpenRouter   │ ──── Route to Claude/GPT/etc.
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ AI Model     │ ──── Generate questions JSON
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ IndexedDB    │ ──── Store session + questions
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ QuizView     │ ──── Display first question
└──────────────┘
```

### Offline Strategy

1. **Static Assets** - Precached by service worker during install
2. **API Responses** - Network-first with stale-while-revalidate fallback
3. **Quiz Data** - Stored in IndexedDB, available offline
4. **Graceful Degradation** - Sample quizzes available when offline

## Security

### API Key Management

- User authenticates via OpenRouter OAuth
- API key stored securely in browser's IndexedDB
- Keys never sent to our servers - calls go directly to OpenRouter
- User controls their own API usage and billing

### Input Validation

- Topic input sanitized before API calls
- Grade level validated against allowed values
- Question count limited to reasonable range

## Performance

### Optimizations

- **Code Splitting** - Vite handles automatic chunking
- **Asset Caching** - Service worker caches with version hashing
- **Lazy Loading** - Views loaded on demand
- **Core Web Vitals** - Monitored via web-vitals library

### Metrics Tracked

- LCP (Largest Contentful Paint)
- INP (Interaction to Next Paint)
- CLS (Cumulative Layout Shift)

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md)
- [API Design](./API_DESIGN.md)
- [Architecture Rules](./ARCHITECTURE_RULES.md)
- [Deployment](./DEPLOYMENT.md)
