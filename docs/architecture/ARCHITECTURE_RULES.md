# Architecture Rules

## Overview

Saberloop uses **dependency-cruiser** to enforce architectural rules and prevent violations. This document describes the current architecture and the rules that enforce layer boundaries.

## Running Architecture Checks

```bash
# Run architecture validation
npm run arch:test

# Generate dependency graph (DOT format)
npm run arch:graph
```

## Current Architecture

The architecture uses a **services layer** to achieve low coupling:

```
                    main.js (entry point)
                        │
                        ▼
    ┌─────────────────────────────────────────┐
    │              views/                      │
    │         (UI / Presentation)              │
    │                                          │
    │  Only knows about: services, components  │
    └─────────────────┬───────────────────────┘
                      │
                      ▼
    ┌─────────────────────────────────────────┐
    │            services/                     │
    │       (Business Logic Layer)             │
    │                                          │
    │  Coordinates: api, db, state             │
    └─────────────────┬───────────────────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
       api/        core/       core/
    (external)    state.js     db.js
```

### Services Layer

The services layer (`src/services/`) provides a clean abstraction between UI and data:

| Service | Purpose | Wraps |
|---------|---------|-------|
| `quiz-service.js` | Quiz business logic | db.js, api/index.js |
| `auth-service.js` | Authentication operations | db.js, openrouter-auth.js |
| `model-service.js` | AI model selection | settings.js, OpenRouter API |
| `cost-service.js` | LLM usage cost tracking | settings.js |
| `data-service.js` | User data export/deletion | db.js |
| `quiz-import.js` | Import quizzes from URLs | quiz-serializer.js, db.js |
| `quiz-serializer.js` | Serialize/deserialize quizzes | - |
| `quiz-share.js` | Quiz sharing functionality | quiz-serializer.js |
| `theme-manager.js` | Learning/Party mode theming | settings.js |
| `party-api.js` | Party signaling server API | - |
| `party-session.js` | Party session state | state.js |
| `signaling-client.js` | WebRTC signaling | party-api.js |
| `p2p-service.js` | Peer-to-peer connections | signaling-client.js |
| `party-connection-manager.js` | WebRTC lifecycle | p2p-service.js |
| `party-connection-store.js` | Connection state | - |

### Allowed Dependencies

| From | Can Import | Reasoning |
|------|------------|-----------|
| `main.js` | All layers | Entry point orchestration |
| `views/` | services, components, utils, state, features, i18n | UI only knows about services |
| `components/` | utils, i18n only | Pure presentational, no side effects |
| `services/` | api, db, state, settings, utils | Coordinates all business logic |
| `api/` | utils only | Receives credentials as params |
| `core/db.js` | utils, external libs | Pure data layer |
| `core/state.js` | Nothing | Pure singleton |
| `core/i18n.js` | external libs only | Translation framework |
| `core/features.js` | Nothing | Feature flag definitions |
| `core/settings.js` | utils only | localStorage wrapper |

---

## Rule Definitions

### All Rules (Enforced as Errors)

All architecture rules are enforced and will fail the build if violated:

| Rule | Description |
|------|-------------|
| `no-circular` | No circular dependencies (A → B → A) |
| `no-view-to-view` | Views cannot import other views (except BaseView) |
| `not-to-dev-dep` | Production code cannot import devDependencies |
| `not-to-unresolvable` | Cannot import non-existent modules |
| `views-should-not-import-db` | Views must use services layer, not direct db access |
| `views-should-not-import-api` | Views must use services layer, not direct api access |
| `components-should-not-import-api` | Components must be presentational (callbacks as props) |
| `api-should-not-import-db` | API must receive credentials as params, not fetch them |

---

## Common Patterns

### Views Using Services

Views import from the services layer, not directly from db or api:

```javascript
// src/views/HomeView.js
import { getQuizHistory } from '../services/quiz-service.js';
import { isConnected, startAuth } from '../services/auth-service.js';

// In the view
const sessions = await getQuizHistory();
const connected = await isConnected();
```

### Presentational Components

Components receive behavior via callbacks, no direct API access:

```javascript
// src/components/ConnectModal.js
export function showConnectModal(onConnect) {
  // ...
  button.onclick = () => onConnect();  // Callback from parent
}

// Parent view provides the callback
import { startAuth } from '../services/auth-service.js';
showConnectModal(() => startAuth());
```

### Stateless API Layer

API functions receive credentials as parameters:

```javascript
// src/api/api.real.js
export async function generateQuestions(topic, gradeLevel, apiKey) {
  // apiKey passed in, not fetched from db
}
```

---

## Configuration

Architecture rules are defined in `.dependency-cruiser.cjs`. Example:

```javascript
// Layer boundary rules (all enforced as errors)
{
  name: 'views-should-not-import-db',
  severity: 'error',
  comment: 'Views must use services layer instead of direct db access',
  from: { path: '^src/views/' },
  to: { path: '^src/core/db\\.js$' }
},
{
  name: 'views-should-not-import-api',
  severity: 'error',
  comment: 'Views must use services layer instead of direct api access',
  from: { path: '^src/views/' },
  to: { path: '^src/api/' }
}
```

### Severity Levels

| Level | Behavior | Use For |
|-------|----------|---------|
| `error` | Fails the check | All enforced rules |
| `warn` | Reports but passes | Transition (not currently used) |
| `info` | Informational | Documentation only |

---

## CI Integration

Architecture checks run in GitHub Actions as part of the test workflow:

```yaml
- name: Check architecture rules
  run: npm run arch:test
```

All violations will fail the build.

---

## Related Documentation

- [System Overview](./SYSTEM_OVERVIEW.md)
- [API Design](./API_DESIGN.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Phase 20 Plan](../learning/epic04_saberloop_v1/PHASE20_ARCH_TESTING.md)
