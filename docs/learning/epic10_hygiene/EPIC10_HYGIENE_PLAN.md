# Epic 10: Project Hygiene

**Status:** Ongoing
**Created:** 2026-01-09

---

## Overview

Unlike other epics, Epic 10 is an **ongoing container** for project hygiene tasks. Individual tasks within this epic will be completed, but the epic itself is never "done" - it represents continuous maintenance and technical debt management.

### Purpose

1. **Reduce technical debt** - Clean up code that served its purpose but is no longer needed
2. **Maintain code quality** - Keep the codebase simple and understandable
3. **Document learnings** - Capture patterns and processes for future maintenance
4. **Prevent debt accumulation** - Establish processes to avoid future buildup

---

## Active Tasks

| Task | Priority | Status | Document |
|------|----------|--------|----------|
| Code Quality Enhancement | Medium | 7.1 ✅ 7.2 ✅ 7.3 ✅ | [PHASE7_CODE_QUALITY_ENHANCEMENT.md](./PHASE7_CODE_QUALITY_ENHANCEMENT.md) |

## Completed Tasks

| Task | Completed | Document |
|------|-----------|----------|
| Test Maintenance | 2026-01-21 | [PHASE6_TEST_MAINTENANCE.md](./PHASE6_TEST_MAINTENANCE.md) |
| ESLint Warnings Cleanup | 2026-01-21 | [PHASE5_ESLINT_WARNINGS.md](./PHASE5_ESLINT_WARNINGS.md) |
| ESLint Code Quality Cleanup | 2026-01-21 | [PHASE4_ESLINT_CLEANUP.md](./PHASE4_ESLINT_CLEANUP.md) |
| E2E Test Separation (Tests vs Capture) | 2026-01-15 | [PHASE3_E2E_TEST_SEPARATION.md](./PHASE3_E2E_TEST_SEPARATION.md) |
| Feature Flag Cleanup (Wave 2) | 2026-01-15 | [PHASE2_FEATURE_FLAG_CLEANUP.md](./PHASE2_FEATURE_FLAG_CLEANUP.md) |
| Feature Flag Cleanup (Wave 1) | 2026-01-09 | [PHASE1_FEATURE_FLAG_CLEANUP.md](./PHASE1_FEATURE_FLAG_CLEANUP.md) |

## Backlog

| Task | Priority | Notes |
|------|----------|-------|
| Feature flag lifecycle process | Medium | Document when to remove flags |
| ESLint complexity warnings | Low | Address ~86 warnings gradually when touching files |
| Complexity hotspot refactoring | Low | PartyQuizView, party-session, SettingsView - see Phase 7 |

### Future Flag Cleanup (When Ready)

These flags are intentionally kept but have removal plans documented:

| Flag | Status | Remove When | Document |
|------|--------|-------------|----------|
| `SHOW_ADS` | ENABLED | Epic 07 premium tier implemented | [FLAG_SHOW_ADS.md](./FLAG_SHOW_ADS.md) |

### Removed in Wave 2 (2026-01-15)

| Flag | Status | Document |
|------|--------|----------|
| `MODE_TOGGLE` | ✅ Removed | [PHASE2_FEATURE_FLAG_CLEANUP.md](./PHASE2_FEATURE_FLAG_CLEANUP.md) |
| `PARTY_SESSION` | ✅ Removed | [PHASE2_FEATURE_FLAG_CLEANUP.md](./PHASE2_FEATURE_FLAG_CLEANUP.md) |

---

## Development Standards

These standards apply to ALL hygiene tasks.

### Git Worktree Practice

**Always use a separate worktree for hygiene tasks.** This keeps your main development environment clean and allows parallel work.

**Why worktrees?**
- Main worktree stays on `main` for feature work or urgent fixes
- Hygiene work happens in isolated directory
- No stashing, no context switching headaches
- Can run tests in both worktrees simultaneously

**Setup (one-time per task):**
```bash
# From your main repo directory
git worktree add ../saberloop-hygiene hygiene/feature-flag-cleanup-wave1

# Or create new branch at the same time
git worktree add -b hygiene/feature-flag-cleanup-wave1 ../saberloop-hygiene main
```

**Directory structure:**
```
source/repos/
├── demo-pwa-app/              # Main worktree (main branch)
└── saberloop-hygiene/         # Hygiene worktree (hygiene branch)
```

**Working in the hygiene worktree:**
```bash
cd ../saberloop-hygiene
npm install                     # Install dependencies
npm test                        # Run tests
# ... make changes, commit ...
```

**Cleanup after merge:**
```bash
# From main repo
git worktree remove ../saberloop-hygiene
git branch -d hygiene/feature-flag-cleanup-wave1  # If merged
```

**Benefits:**
- IDE can have both open side-by-side
- Run build/tests in hygiene without affecting main
- Easy to abandon if needed (just remove worktree)

---

### Guiding Principles

1. **No behavior changes** - Hygiene tasks should not change application behavior
2. **Tests validate equivalence** - Existing tests must pass without modification (unless testing the removed code itself)
3. **Small commits** - One logical change per commit for easy revert
4. **Document everything** - Capture problems, fixes, and learnings

### Testing Requirements

| Requirement | Required |
|-------------|----------|
| All existing tests pass | Yes |
| Remove tests for removed code | Yes |
| No new tests needed (unless gap found) | - |
| Mutation testing passes | Yes |

### Branch & Commit Strategy

**Branch Naming:**
```
hygiene/feature-flag-cleanup-wave1
hygiene/dead-code-removal
hygiene/[description]
```

**Commit Message Format:**
```
refactor(hygiene): remove FEATURE_NAME feature flag

- Remove isFeatureEnabled() checks for FEATURE_NAME
- Simplify conditional logic in [files]
- Remove flag from FEATURE_FLAGS object
- Update/remove related tests
```

**Commit Prefixes for Hygiene:**
- `refactor(hygiene)`: Removing dead code, simplifying logic
- `test(hygiene)`: Removing/updating tests for removed code
- `docs(hygiene)`: Updating documentation
- `chore(hygiene)`: Build, config changes

### Pre-Merge Checklist

Before merging any hygiene task:

- [ ] All existing tests pass
- [ ] No behavior changes (verified manually)
- [ ] Removed code was truly unused
- [ ] Documentation updated (CLAUDE.md if needed)
- [ ] Learning notes captured
- [ ] Clean commit history

### Learning Notes

Each hygiene task should have learning notes capturing:

1. **What was removed** - Inventory of removed code
2. **Why it was safe** - Reasoning for removal
3. **Problems encountered** - Issues during cleanup
4. **Process improvements** - How to do it better next time

**Location:** `docs/learning/epic10_hygiene/PHASE*_LEARNING_NOTES.md`

---

## Feature Flag Lifecycle (Reference)

This section documents the intended lifecycle for feature flags to prevent future debt accumulation.

### Flag States

```
DISABLED → SETTINGS_ONLY → ENABLED → (REMOVED)
```

### When to Create a Flag

- New feature that needs gradual rollout
- Risky change that might need quick rollback
- Feature that will be A/B tested

### When to Remove a Flag

A flag should be removed when ALL of these are true:

1. **Stable in production** - No issues for 2+ weeks
2. **Always enabled** - No plan to disable it
3. **Not user-configurable** - Not a preference toggle
4. **Not tied to future feature** - Not needed for premium tier, etc.

### Flags That Should NOT Be Removed

- User preferences (dark mode, notifications, etc.)
- Subscription/premium gates
- A/B test flags (until test concludes)
- Emergency kill switches for external services

---

## Related Documentation

- [CLAUDE.md](../../../CLAUDE.md) - Project overview and current status
- [Epic 06 Feature Flag Strategy](../epic06_sharing/EPIC6_SHARING_PLAN.md#feature-flag-strategy) - Original flag strategy

---

**Last Updated:** 2026-01-22
