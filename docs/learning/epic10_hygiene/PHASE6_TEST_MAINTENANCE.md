# Phase 6: Test Maintenance

**Status:** Complete
**Priority:** Medium
**Created:** 2026-01-21

---

## Overview

This phase addresses test maintenance tasks identified during Phase 5 (ESLint Warnings Cleanup):

1. **E2E Test Failures** - 3 pre-existing failures in `preserve-topic-input.spec.js`
2. **Unit Test Coverage** - Review coverage for new helper functions added in Phase 5

---

## Task 1: Fix E2E Test Failures ✅ Complete

### Failing Tests (Fixed)

All 3 failures were in `tests/e2e/preserve-topic-input.spec.js`:

| Test | Line | Status |
|------|------|--------|
| should preserve topic text when generation fails | 23 | ✅ Fixed |
| should preserve topic when user cancels during loading | 67 | ✅ Fixed |
| should prioritize deep link prefill over saved topic | 130 | ✅ Fixed |

### Root Cause

The tests were using `page.on('dialog', ...)` which handles **native browser dialogs** (`window.alert`, `window.confirm`). However, the app uses **custom modal components** (`AlertModal`, `ConfirmModal`) that require direct button clicks.

### Fix Applied

Replaced native dialog handlers with custom modal interactions:
- `await page.click('[data-testid="alert-ok-btn"]')` for AlertModal
- `await page.click('[data-testid="confirm-ok-btn"]')` for ConfirmModal

**Commit:** `80564db` - fix(tests): use custom modal selectors instead of native dialog handlers

---

## Task 2: Review Unit Test Coverage ✅ Complete

### New Functions Added in Phase 5

Phase 5 extracted several helper functions that should have unit test coverage:

#### ExplanationModal.js
- `getExplanationElements(backdrop)` - DOM element collection
- `updateExplanationUI(result, elements)` - Success case UI updates
- `showExplanationError(error, elements, options)` - Error case UI updates

#### PartyQuizView.js
- `_loadRoomData()` - API fetch with error handling
- `_setupConnectionAndPolling()` - Connection manager setup

#### PartyLobbyView.js
- `_setupConnectionHandlers()` - P2P event handler setup
- `_loadRoomData()` - API fetch with error handling

### Coverage Review Steps

1. [x] Run `npm run test:coverage` to check current coverage
2. [x] Identify any coverage gaps in new functions
3. [x] Add unit tests for uncovered branches if needed
4. [x] Ensure mutation testing still passes

### Coverage Results

- **Overall:** 93.41% statement coverage
- **ExplanationModal.js:** 92.38% coverage - helper functions well tested
- **Views (PartyQuizView, PartyLobbyView):** Covered by E2E tests, not unit tests

### Uncovered Lines (Acceptable)

| File | Lines | Reason |
|------|-------|--------|
| ExplanationModal.js | 280-281 | Offline without cache error path (edge case) |
| ExplanationModal.js | 298-299 | Settings redirect callback in error handler |

These are edge cases that are difficult to unit test but are covered by manual QA and E2E scenarios.

### Mutation Testing Results

Core mutation score: **80%** (meets threshold)
- All critical logic is well-tested
- Surviving mutants are mostly initial state values (not critical)

---

## Validation Checklist

### E2E Fixes ✅
- [x] Root cause identified (native dialog handlers vs custom modals)
- [x] Fix implemented (commit `80564db`)
- [x] All 3 tests passing
- [x] No regressions in other E2E tests (172 passed)

### Coverage Review ✅
- [x] Coverage report generated (93.41% overall)
- [x] New functions have adequate coverage (ExplanationModal 92.38%)
- [x] Any new tests added pass (no new tests needed)
- [x] Mutation testing passes (80% score)

---

## Related Documentation

- [Phase 5: ESLint Warnings Cleanup](./PHASE5_ESLINT_WARNINGS.md) - Previous phase
- [Epic 10 Standards](./EPIC10_HYGIENE_PLAN.md) - Hygiene development standards

---

**Last Updated:** 2026-01-21
