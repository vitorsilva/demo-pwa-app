# Phase 4: ESLint Code Quality Cleanup

**Status:** Not Started
**Priority:** Medium
**Created:** 2026-01-20

---

## Overview

ESLint with SonarJS plugin was added to the project and found 145 issues (59 errors, 86 warnings). This phase addresses the **errors** which represent actual bugs, dead code, and code quality issues that should be fixed.

The **warnings** (complexity metrics) are informational and can be addressed gradually when touching those files.

---

## Current State

### Summary

| Category | Count | Priority |
|----------|-------|----------|
| **Errors** | 59 | Fix in this phase |
| **Warnings** | 86 | Address gradually |

### Error Categories

| Category | Count | Examples | Fix Strategy |
|----------|-------|----------|--------------|
| Unused variables/imports | ~15 | `BUILD_DATE`, `standings`, `quizData` | Remove or use |
| Dead stores | ~5 | Useless assignments | Remove assignment |
| Nested ternaries | ~8 | Hard-to-read conditionals | Refactor to if/else |
| Empty catch blocks | ~4 | Silent error swallowing | Add error handling/logging |
| Logic bugs | ~2 | Duplicated branches, missing braces | Fix logic |

### Warning Categories (For Reference)

| Category | Count | Threshold |
|----------|-------|-----------|
| Functions over 50 lines | ~20 | Consider splitting when touching |
| Cyclomatic complexity > 10 | ~15 | Simplify when refactoring |
| Cognitive complexity > 15 | ~25 | Improve readability when touching |
| Too many parameters (> 4) | ~10 | Use options object pattern |

---

## Implementation Plan

### Wave 1: Unused Variables/Imports (Quick Wins)

These are safe to remove with no behavior change.

```bash
npm run lint 2>&1 | grep "no-unused-vars\|@typescript-eslint/no-unused-vars"
```

**Approach:**
1. Run lint to get list
2. Remove each unused variable/import
3. Run tests after each file
4. Commit per file or logical group

### Wave 2: Dead Stores

Variables assigned but never used after assignment.

```bash
npm run lint 2>&1 | grep "sonarjs/no-useless-assignment"
```

**Approach:**
1. Identify assignment
2. Determine if it's truly dead or a bug (missing usage)
3. Remove if dead, fix if bug
4. Test after each fix

### Wave 3: Nested Ternaries

Hard-to-read conditional expressions.

```bash
npm run lint 2>&1 | grep "no-nested-ternary"
```

**Approach:**
1. Refactor to if/else or early returns
2. Maintain exact same logic
3. Test thoroughly (these are logic changes)

### Wave 4: Empty Catch Blocks

Silent error swallowing can hide bugs.

```bash
npm run lint 2>&1 | grep "sonarjs/no-ignored-exceptions"
```

**Approach:**
1. Identify each empty catch
2. Determine appropriate handling:
   - Log error (most cases)
   - Re-throw if unrecoverable
   - Comment if intentionally ignored
3. Test error paths

### Wave 5: Logic Bugs

Duplicated branches, missing braces, etc.

```bash
npm run lint 2>&1 | grep "sonarjs/no-duplicated-branches\|curly"
```

**Approach:**
1. Identify the issue
2. Understand intended behavior
3. Fix the logic
4. Add tests if missing

---

## Validation Checklist

### Per-Wave

- [ ] All errors of that category resolved
- [ ] All existing tests pass
- [ ] No behavior changes (unless fixing bugs)
- [ ] Committed with clear message

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
