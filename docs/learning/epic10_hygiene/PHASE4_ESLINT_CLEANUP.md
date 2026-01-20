# Phase 4: ESLint Code Quality Cleanup

**Status:** In Progress
**Priority:** Medium
**Created:** 2026-01-20

---

## Overview

ESLint with SonarJS plugin was added to the project and found 145 issues (59 errors, 86 warnings). This phase addresses the **errors** which represent actual bugs, dead code, and code quality issues that should be fixed.

The **warnings** (complexity metrics) are informational and can be addressed gradually when touching those files.

---

## Progress

### Wave 1: Unused Variables ✅ Complete (2026-01-20)

Fixed 38 unused variable errors across 14 files:

| File | Fix |
|------|-----|
| `eslint.config.js` | Configure `_` prefix pattern |
| `features.js` | Remove `getEnvironment()` |
| `party-session.js` | Remove dead `participants` assignment |
| `quiz-serializer.js` | Remove `QUIZ_KEY_REVERSE`, `QUESTION_KEY_REVERSE` |
| `json-extractor.js` | Remove 4 unused catch error params |
| `ShareQuizModal.js` | Remove `shareCheck` + `canShareQuiz` import |
| `HelpView.js` | Remove unused `e` event param |
| `HomeView.js` | Remove `startAuth`, `showConnectModal` imports |
| `ImportView.js` | Rename `errorMessage` → `_errorMessage` |
| `JoinPartyView.js` | Remove `CONNECTION_MODES` import |
| `PartyQuizView.js` | Rename `standings` → `_standings` |
| `SettingsView.js` | Remove `BUILD_DATE` import + catch error params |
| `LoadingView.js` | Remove dead `config` assignment |
| `PartyLobbyView.js` | Rename `quizData` → `_quizData` |

**Commits:**
- `e682e61` - chore(eslint): ignore _ prefixed unused vars
- `3216819` - refactor(hygiene): fix unused variable errors (Wave 1)

---

## Current State

### Summary

| Category | Original | Current | Change |
|----------|----------|---------|--------|
| **Errors** | 59 | 21 | -38 |
| **Warnings** | 86 | 91 | +5 |

### Remaining Errors (21)

| Category | Count | Files | Rule |
|----------|-------|-------|------|
| Nested ternaries | 10 | ExplanationModal, LiveScoreboard, JoinPartyView, QuizView, ResultsView | `sonarjs/no-nested-conditional` |
| Slow regex (ReDoS risk) | 3 | json-extractor.js | `sonarjs/slow-regex` |
| Control chars in regex | 3 | json-extractor.js | `no-control-regex` |
| Dead store | 1 | TopicInputView.js | `sonarjs/no-dead-store` |
| Duplicated branches | 1 | openrouter-client.js | `sonarjs/no-all-duplicated-branches` |
| Unenclosed multiline | 1 | app.js | `sonarjs/no-unenclosed-multiline-block` |
| Async promise executor | 1 | ShareQuizModal.js | `no-async-promise-executor` |
| Nested assignment | 1 | adManager.js | `sonarjs/no-nested-assignment` |
| hasOwnProperty | 1 | adManager.js | `no-prototype-builtins` |

---

## Remaining Waves

### Wave 2: Nested Ternaries (10 errors)

Refactor to if/else for readability:

```bash
npx eslint src/ 2>&1 | grep "sonarjs/no-nested-conditional"
```

### Wave 3: Regex Issues (6 errors)

Fix control characters and ReDoS vulnerabilities in `json-extractor.js`:

```bash
npx eslint src/ 2>&1 | grep "regex"
```

### Wave 4: Logic/Style Issues (5 errors)

- Dead store in TopicInputView
- Duplicated branches in openrouter-client
- Unenclosed multiline in app.js
- Async promise executor in ShareQuizModal
- Nested assignment + hasOwnProperty in adManager

---

## Validation Checklist

### Wave 1 ✅

- [x] All unused variable errors resolved
- [x] All existing tests pass (1192 unit, 33 E2E)
- [x] No behavior changes
- [x] Committed with clear messages

### Final

- [ ] `npm run lint` shows 0 errors
- [ ] All tests pass
- [ ] Mutation testing passes
- [ ] E2E tests pass

---

## Useful Commands

```bash
# Run full lint
npm run lint

# Count errors only
npm run lint 2>&1 | grep "error" | wc -l

# Filter by rule
npm run lint 2>&1 | grep "no-unused-vars"

# Lint single file
npx eslint src/views/SettingsView.js

# Auto-fix what can be auto-fixed (use with caution)
npx eslint --fix src/
```

---

## Notes

- **Warnings are OK** - Complexity warnings are informational. Fix them when you refactor those files, not as a dedicated effort.
- **No behavior changes** - Except for fixing actual bugs found
- **Test after each change** - These touch core logic
- **Small commits** - One logical change per commit

---

## Related Documentation

- [ESLint Config](../../../eslint.config.js) - ESLint configuration
- [Epic 10 Standards](./EPIC10_HYGIENE_PLAN.md) - Hygiene development standards

---

**Last Updated:** 2026-01-20
