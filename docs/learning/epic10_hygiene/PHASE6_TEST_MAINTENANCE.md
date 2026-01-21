# Phase 6: Test Maintenance

**Status:** Planned
**Priority:** Medium
**Created:** 2026-01-21

---

## Overview

This phase addresses test maintenance tasks identified during Phase 5 (ESLint Warnings Cleanup):

1. **E2E Test Failures** - 3 pre-existing failures in `preserve-topic-input.spec.js`
2. **Unit Test Coverage** - Review coverage for new helper functions added in Phase 5

---

## Task 1: Fix E2E Test Failures

### Failing Tests

All 3 failures are in `tests/e2e/preserve-topic-input.spec.js`:

| Test | Line | Issue |
|------|------|-------|
| should preserve topic text when generation fails | 23 | Page stuck at `/#/loading` instead of `/#/topic-input` |
| should preserve topic when user cancels during loading | 67 | Same issue |
| should prioritize deep link prefill over saved topic | 130 | Same issue |

### Root Cause Analysis

The tests expect the app to return to `/#/topic-input` after a generation failure, but the page stays on `/#/loading`. This could be:

1. **Navigation issue** - The error handling doesn't navigate back correctly
2. **Test timing issue** - The test doesn't wait long enough
3. **Mock API issue** - The mock isn't triggering the expected error flow

### Investigation Steps

1. [ ] Run the failing tests with `--headed` to observe behavior
2. [ ] Check error handling in quiz generation flow
3. [ ] Review mock API error simulation
4. [ ] Fix root cause or update tests if behavior changed intentionally

---

## Task 2: Review Unit Test Coverage

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

1. [ ] Run `npm run test:coverage` to check current coverage
2. [ ] Identify any coverage gaps in new functions
3. [ ] Add unit tests for uncovered branches if needed
4. [ ] Ensure mutation testing still passes

---

## Validation Checklist

### E2E Fixes
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] All 3 tests passing
- [ ] No regressions in other E2E tests

### Coverage Review
- [ ] Coverage report generated
- [ ] New functions have adequate coverage
- [ ] Any new tests added pass
- [ ] Mutation testing passes

---

## Related Documentation

- [Phase 5: ESLint Warnings Cleanup](./PHASE5_ESLINT_WARNINGS.md) - Previous phase
- [Epic 10 Standards](./EPIC10_HYGIENE_PLAN.md) - Hygiene development standards

---

**Last Updated:** 2026-01-21
