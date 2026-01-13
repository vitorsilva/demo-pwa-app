# Epic 6: Learning & Party Modes - Sharing Features

**Status:** ✅ Complete (All Phases Merged)
**Created:** 2026-01-06
**Parent:** [Exploration Document](./EXPLORATION.md)

---

## Executive Summary

Transform Saberloop from a solo learning tool into a social quiz platform with two modes:
- **Learning Mode** (existing, enhanced)
- **Party Mode** (new)

**Core insight**: Collaborative content creation solves the LLM generation time problem. Each friend generates 1 quiz → group has multiple quizzes ready in parallel.

---

## MVP Scope

### What's IN

| Phase | Feature | Priority | Document |
|-------|---------|----------|----------|
| **1** | Share quiz via URL | P0 - Core enabler | [PHASE1_QUIZ_SHARING.md](./PHASE1_QUIZ_SHARING.md) |
| **2** | Mode toggle + theming | P1 - Visual identity | [PHASE2_MODE_TOGGLE.md](./PHASE2_MODE_TOGGLE.md) |
| **3** | Real-time party session | P2 - Synchronous play | [PHASE3_PARTY_SESSION.md](./PHASE3_PARTY_SESSION.md) |
| **4** | Multi-user testing | P3 - Quality assurance | [PHASE4_MULTI_USER_TESTING.md](./PHASE4_MULTI_USER_TESTING.md) |

### What's OUT (Post-MVP)

- Friend discovery + persistent groups
- Leaderboards
- Hypercore/true P2P
- Voice input/output
- Content mining from WhatsApp
- Community curation

---

## Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| P2P Transport | WebRTC (browser native) | Proven, works today |
| Signaling | PHP polling on VPS | Simple, uses existing stack |
| State Consensus | Coordinator model | Simple for MVP; host = source of truth |
| Time Sync | Coordinator broadcasts startTime | Simple, effective with 30s questions |
| TURN Server | Accept failures + telemetry | Start simple, measure, optimize later |
| Room Codes | Both short codes + crypto ID | Flexibility for different contexts |
| Hypercore | Defer to post-MVP | Experimental in browsers |

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Quiz shares | 100 shares in first month | Telemetry: `quiz_share_completed` |
| Share conversion | 30% of shares → imports | Ratio of import to share events |
| Party sessions | 20 sessions in first month | Telemetry: `party_session_created` |
| Session completion | 70% sessions complete | Ratio of ended to created |
| P2P success rate | >85% | Telemetry: success/attempt ratio |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Feature creep | Strict phase boundaries; ship Phase 1 before starting Phase 2 |
| P2P failures | Telemetry to measure; fallback plan ready (VPS relay) |
| Low adoption | Validate each phase with real users before next |
| Clock sync issues | Generous timing (30s); telemetry to detect problems |

---

## Timeline Philosophy

No time estimates provided. Work in phases:
1. Complete Phase 1, ship, measure
2. If successful, proceed to Phase 2
3. If successful, proceed to Phase 3

Each phase is independently valuable. Stop if metrics don't justify continuation.

---

## Development Standards

These standards apply to ALL phases in this epic.

### Testing Requirements

**Per Phase Checklist:**

| Requirement | Phase 1 | Phase 2 | Phase 3 |
|-------------|---------|---------|---------|
| Unit tests for new services | ✅ | ✅ | ✅ |
| E2E tests for user flows (Playwright) | ✅ | ✅ | ✅ |
| Maestro tests for mobile (parity) | ✅ | ✅ | ✅ |
| Coverage ≥80% on new code | ✅ | ✅ | ✅ |
| Mutation testing on new code | ✅ | ✅ | ✅ |
| JSDoc on public functions | ✅ | ✅ | ✅ |
| Architecture tests (dependency-cruiser) | ✅ | ✅ | ✅ |
| Deploy to staging + test | ✅ | ✅ | ✅ |
| Deploy to production | ✅ | ✅ | ✅ |

### Deployment Strategy

**Deployment follows existing Saberloop pattern:**

| Environment | URL | Purpose |
|-------------|-----|---------|
| Local | `http://localhost:8888` | Development |
| Staging | `https://saberloop.com/app-staging/` | Pre-production testing |
| Production | `https://saberloop.com/app/` | Live users |

**Per-Phase Deployment Process:**

```
1. Feature Development (local)
   └── npm run dev
   └── Run unit tests: npm test
   └── Run E2E tests: npm run test:e2e
   └── Run Maestro tests: maestro test tests/maestro/

2. Deploy to Staging
   └── npm run build:staging
   └── npm run deploy:staging
   └── Manual testing at https://saberloop.com/app-staging/
   └── Test on real devices (Android/iOS)
   └── Run Maestro tests on staging URL

3. Deploy to Production
   └── npm run build
   └── npm run deploy
   └── Verify feature flag is disabled
   └── Smoke test critical paths
   └── Enable feature flag for internal testing

4. Gradual Rollout
   └── Monitor telemetry
   └── Enable for 10% of users
   └── Monitor for issues
   └── Enable for 100% of users
   └── Remove feature flag (after stable)
```

**Pre-Deployment Checklist:**

- [ ] All tests passing (unit, E2E, Maestro)
- [ ] Coverage ≥80% on new code
- [ ] Mutation testing passed
- [ ] Feature flag configured (disabled by default)
- [ ] Telemetry events verified
- [ ] Staging tested manually
- [ ] Real device testing completed
- [ ] Rollback plan documented

### JSDoc Requirements

All new public functions must have JSDoc:

```javascript
/**
 * Serializes a quiz object to a URL-safe string.
 * Uses LZ-string compression and Base64 encoding.
 *
 * @param {Object} quiz - The quiz object to serialize
 * @param {string} quiz.id - Unique quiz identifier
 * @param {Array<Object>} quiz.questions - Array of question objects
 * @param {string} quiz.mode - Quiz mode: "learning" | "party" | "both"
 * @returns {string} URL-safe Base64 encoded string
 * @throws {Error} If quiz is invalid or too large
 *
 * @example
 * const encoded = serializeQuiz(myQuiz);
 * const url = `https://saberloop.com/app/quiz#${encoded}`;
 */
export function serializeQuiz(quiz) { ... }
```

### Architecture Tests (dependency-cruiser)

Add rules for new modules:

```javascript
// New rules for Phase 1-3
{
  name: "p2p-service-isolation",
  comment: "P2P service should not depend on UI components",
  from: { path: "^src/services/p2p" },
  to: { path: "^src/(views|components)" },
  severity: "error"
},
{
  name: "party-session-uses-p2p",
  comment: "Party session must use P2P service, not raw WebRTC",
  from: { path: "^src/services/party-session" },
  to: { path: "RTCPeerConnection" },
  severity: "error"
}
```

### Feature Flag Strategy

All new features behind flags for gradual rollout:

```javascript
// src/core/feature-flags.js

export const FEATURE_FLAGS = {
  // Phase 1
  QUIZ_SHARING: {
    key: 'quiz_sharing',
    default: false,
    description: 'Enable quiz sharing via URL',
  },

  // Phase 2
  MODE_TOGGLE: {
    key: 'mode_toggle',
    default: false,
    description: 'Enable Learning/Party mode toggle',
  },

  // Phase 3
  PARTY_SESSION: {
    key: 'party_session',
    default: false,
    description: 'Enable real-time party sessions',
  },
};

// Usage in code:
if (isFeatureEnabled(FEATURE_FLAGS.QUIZ_SHARING)) {
  showShareButton();
}
```

**Rollout Strategy:**
1. Feature ships disabled (flag = false)
2. Enable for internal testing
3. Enable for 10% of users
4. Monitor telemetry
5. Gradual rollout to 100%
6. Remove flag after stable

### Branch & Commit Strategy

**Branch Naming:**
```
feature/phase1-quiz-sharing
feature/phase2-mode-toggle
feature/phase3-party-session
```

**Sub-branches for large phases:**
```
feature/phase1-quiz-sharing
├── feature/phase1-serialization
├── feature/phase1-share-ui
├── feature/phase1-import-flow
└── feature/phase1-telemetry
```

**Commit Message Format:**
```
feat(sharing): add quiz serialization with LZ compression

- Implement serializeQuiz() and deserializeQuiz()
- Add LZ-string compression for smaller URLs
- Handle edge cases (empty quiz, max size)
- Add unit tests with 95% coverage
```

**Commit Prefixes:**
- `feat(scope)`: New feature
- `fix(scope)`: Bug fix
- `test(scope)`: Tests only
- `docs(scope)`: Documentation
- `refactor(scope)`: Code refactoring
- `style(scope)`: Formatting, CSS
- `chore(scope)`: Build, dependencies

### Learning Notes & Status Updates

**Learning Notes Location:**
```
docs/learning/epic06_sharing/
├── EPIC6_SHARING_PLAN.md
├── EXPLORATION.md
├── PHASE1_QUIZ_SHARING.md
├── PHASE1_LEARNING_NOTES.md
├── PHASE2_MODE_TOGGLE.md
├── PHASE2_LEARNING_NOTES.md
├── PHASE3_PARTY_SESSION.md
└── PHASE3_LEARNING_NOTES.md
```

**Status Update Cadence:**
- Update CLAUDE.md status after each phase completion
- Update learning notes after each session
- Track difficulties, errors, fixes, and learnings

**Learning Notes Template:**
```markdown
## Session: [Date]

### Completed
- [ ] Task 1
- [ ] Task 2

### Difficulties & Solutions
- **Problem**: Description
- **Cause**: Root cause
- **Fix**: How it was fixed
- **Learning**: Key takeaway

### Gotchas for Future Reference
- Important note 1
- Important note 2

### Next Steps
- [ ] Continue with...
```

### Test Organization

```
tests/
├── e2e/                    # Playwright (web)
│   ├── share-quiz.spec.js
│   ├── import-quiz.spec.js
│   ├── mode-toggle.spec.js
│   └── party-session.spec.js
└── maestro/                # Maestro (mobile)
    ├── share-quiz.yaml
    ├── import-quiz.yaml
    ├── mode-toggle.yaml
    └── party-session.yaml
```

---

## Post-MVP Enhancements

### Party Mode Decentralization (In Progress)

The original MVP uses HTTP polling for party sessions. A follow-up enhancement is underway to transition to true P2P WebRTC communication:

| Document | Description | Status |
|----------|-------------|--------|
| [PARTY_MODE_DECENTRALIZATION_PLAN.md](./PARTY_MODE_DECENTRALIZATION_PLAN.md) | Full plan for P2P transition | In Progress |
| [PARTY_P2P_DECENTRALIZATION_LEARNING_NOTES.md](./PARTY_P2P_DECENTRALIZATION_LEARNING_NOTES.md) | Implementation notes | Active |

**Current Progress:**
- ✅ Phase 0: AdSense lazy-loading fix
- ✅ Phase A: P2P Foundation (PartyConnectionManager, STUN-only)
- 🔄 Phase B: View Integration (B.1-B.3 complete, B.4-B.6 pending)
- ⏳ Phase C-F: Pending

---

**Last Updated:** 2026-01-13
