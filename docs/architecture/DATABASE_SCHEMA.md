# Database Schema

Saberloop uses **dual client-side storage**:
- **IndexedDB** - Quiz data, sessions, API keys (via `src/core/db.js`)
- **localStorage** - User preferences, settings, caches (via `src/core/settings.js`)

---

## IndexedDB (Primary Data Store)

### Configuration

| Property | Value |
|----------|-------|
| Database Name | `quizmaster` |
| Version | `1` |
| Library | `idb` (Promise-based wrapper) |

## Object Stores

### 1. `topics`

Stores topic metadata for quiz categorization.

**Key Path:** `id`

**Indexes:**
| Index | Key Path | Description |
|-------|----------|-------------|
| `byName` | `name` | Find topics by name |

**Schema:**
```typescript
interface Topic {
  id: string;           // Unique identifier
  name: string;         // Topic display name
  description?: string; // Optional description
}
```

---

### 2. `sessions`

Stores quiz session data including scores and metadata.

**Key Path:** `id` (auto-increment)

**Indexes:**
| Index | Key Path | Description |
|-------|----------|-------------|
| `byTopicId` | `topicId` | Filter sessions by topic |
| `byTimestamp` | `timestamp` | Sort by date (recent sessions) |

**Schema:**
```typescript
interface Session {
  id: number;              // Auto-incremented
  topicId?: string;        // Reference to topic (optional)
  topic: string;           // Topic name (denormalized)
  gradeLevel: string;      // e.g., "middle school"
  questionCount: number;   // Total questions in quiz
  score: number;           // Number of correct answers
  timestamp: string;       // ISO timestamp of creation
  completedAt?: string;    // ISO timestamp of completion
  isSample?: boolean;      // True for pre-loaded sample quizzes
  questions: Question[];   // Embedded questions array
}
```

**Question Schema (embedded in Session):**
```typescript
interface Question {
  id: string;                        // Unique question ID
  question: string;                  // Question text
  options: string[];                 // Answer options ["A) ...", "B) ...", ...]
  correct: number;                   // Index of correct answer (0-3)
  userAnswer?: string;               // User's selected answer
  isCorrect?: boolean;               // Whether user answered correctly
  difficulty: string;                // "easy", "medium", "hard"
  rightAnswerExplanation?: string;   // Why the correct answer is right
  wrongAnswerExplanation?: string;   // Why the user's answer was wrong
}
```

---

### 3. `settings` (IndexedDB)

Stores application state and sensitive data (API keys).

**Key Path:** `key`

**Schema:**
```typescript
interface Setting {
  key: string;    // Setting identifier
  value: any;     // Setting value (can be any type)
}
```

**Known Settings (IndexedDB):**

| Key | Value Type | Description |
|-----|------------|-------------|
| `openrouter_api_key` | `{ key: string, storedAt: string }` | OpenRouter API key (secure) |
| `welcome_seen` | `boolean` | Whether welcome screen was shown |
| `samples_loaded` | `{ version: string }` | Sample data version tracking |

---

## Common Operations

### Session Operations

```javascript
// Create new session
const sessionId = await saveSession({
  topic: 'Mathematics',
  gradeLevel: 'middle school',
  questionCount: 5,
  score: 0,
  timestamp: new Date().toISOString(),
  questions: []
});

// Get session by ID
const session = await getSession(sessionId);

// Get recent sessions (for home page)
const recent = await getRecentSessions(10);

// Update session (e.g., increment score)
await updateSession(sessionId, { score: 4, completedAt: new Date().toISOString() });
```

### Settings Operations

```javascript
// Save a setting
await saveSetting('gradeLevel', 'high school');

// Get a setting
const gradeLevel = await getSetting('gradeLevel');
```

### OpenRouter Key Operations

```javascript
// Store API key
await storeOpenRouterKey('sk-or-...');

// Get API key
const apiKey = await getOpenRouterKey();

// Check connection status
const isConnected = await isOpenRouterConnected();

// Remove API key (disconnect)
await removeOpenRouterKey();
```

---

## Data Migration

When schema changes are needed:

1. Increment `DB_VERSION` in `src/core/db.js`
2. Add migration logic in the `upgrade` callback
3. Handle both new installs and upgrades

**Example Migration:**
```javascript
upgrade(db, oldVersion, newVersion) {
  if (oldVersion < 1) {
    // Create initial stores
    db.createObjectStore('topics', { keyPath: 'id' });
  }

  if (oldVersion < 2) {
    // Add new index to existing store
    const sessionStore = db.transaction.objectStore('sessions');
    sessionStore.createIndex('byScore', 'score');
  }
}
```

---

## localStorage (User Preferences)

User preferences and caches are stored in localStorage via `src/core/settings.js`.

### Storage Key

| Property | Value |
|----------|-------|
| Key | `quizmaster_settings` |
| Format | JSON object |

### User Preferences

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `defaultGradeLevel` | string | `"middle school"` | Default education level |
| `questionsPerQuiz` | string | `"5"` | Questions per quiz |
| `difficulty` | string | `"mixed"` | Difficulty preference |
| `selectedModel` | string | `"tngtech/deepseek-r1t2-chimera:free"` | AI model selection |
| `appMode` | string | `"learning"` | App mode (learning or party) |

### Operations

```javascript
// src/core/settings.js
import { getSetting, saveSetting, getSettings } from '../core/settings.js';

// Get single setting (with default fallback)
const level = getSetting('defaultGradeLevel');  // "middle school"

// Save single setting
saveSetting('selectedModel', 'anthropic/claude-3-haiku');

// Get all settings
const allSettings = getSettings();
```

### Other localStorage Keys

| Key | Purpose | Module |
|-----|---------|--------|
| `i18nextLng` | Language preference | `src/core/i18n.js` |
| `openrouter_models_cache` | Cached free model list (24h TTL) | `src/services/model-service.js` |
| `openrouter_pricing_cache` | Cached model pricing data (24h TTL) | `src/services/model-service.js` |
| `saberloop_telemetry_queue` | Offline telemetry events | `src/utils/telemetry.js` |

---

## Related Documentation

- [System Overview](./SYSTEM_OVERVIEW.md)
- [API Design](./API_DESIGN.md)
