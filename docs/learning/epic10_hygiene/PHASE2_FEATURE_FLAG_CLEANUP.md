# Phase 2: Feature Flag Cleanup (Wave 2 - Party Mode)

**Status:** Planning
**Created:** 2026-01-15
**Target:** After 2 weeks stable in production (~Jan 23)

---

## Objective

Remove `MODE_TOGGLE` and `PARTY_SESSION` feature flags that are now permanently ENABLED in production. Party Mode was released and P2P decentralization is complete - these flags no longer serve their gradual rollout purpose.

---

## Summary

| Flags to Remove | 2 |
|-----------------|---|
| Source Files Affected | 4 |
| Unit Test Files | 1 |
| E2E Test Files | 3 |
| Maestro Test Files | 2 |
| Risk Level | Low |

---

## Validation Checklist

Before proceeding with removal, verify:

- [x] `MODE_TOGGLE` is `ENABLED` in `src/core/features.js`
- [x] `PARTY_SESSION` is `ENABLED` in `src/core/features.js`
- [x] Party Mode is live in production
- [x] P2P decentralization complete (git commit: `322c808`)
- [ ] 2 weeks stable in production (target: ~Jan 23, 2026)
- [ ] No user-reported issues with Party Mode
- [ ] Telemetry shows healthy P2P success rate (>85%)

---

## Branching & Commit Strategy

### Branch

```
hygiene/feature-flag-cleanup-wave2
```

Create from `main`:
```bash
git checkout main
git pull origin main
git checkout -b hygiene/feature-flag-cleanup-wave2
```

### Commit Plan

Execute in this order, one commit per logical change:

| # | Commit Message | Files Changed |
|---|----------------|---------------|
| 1 | `refactor(hygiene): remove MODE_TOGGLE flag checks from views` | `HomeView.js`, `SettingsView.js`, `TopicsView.js` |
| 2 | `refactor(hygiene): remove PARTY_SESSION flag check from HomeView` | `HomeView.js` |
| 3 | `refactor(hygiene): remove MODE_TOGGLE and PARTY_SESSION from FEATURE_FLAGS` | `features.js` |
| 4 | `refactor(hygiene): clean up unused isFeatureEnabled imports` | Views that no longer need the import |
| 5 | `test(hygiene): remove MODE_TOGGLE and PARTY_SESSION unit tests` | `features.test.js` |
| 6 | `test(hygiene): remove feature flag overrides from E2E tests` | `mode-toggle.spec.js`, `party-mode.spec.js`, `capture-party-demo.spec.js` |
| 7 | `test(hygiene): update Maestro test comments` | `15-mode-toggle.yaml` |
| 8 | `docs(hygiene): mark MODE_TOGGLE and PARTY_SESSION flags as removed` | `FLAG_MODE_TOGGLE.md`, `FLAG_PARTY_SESSION.md` |

### PR Template

```bash
gh pr create --title "refactor(hygiene): remove MODE_TOGGLE and PARTY_SESSION feature flags" --body "$(cat <<'EOF'
## Summary

Remove feature flags that are permanently ENABLED after Party Mode production release.

### Removed Flags
- `MODE_TOGGLE` - Learning/Party mode toggle (always on)
- `PARTY_SESSION` - Party session creation (always on)

### Remaining Flags
- `SHOW_ADS` - Future premium tier (Epic 07)

## Changes
- Remove `isFeatureEnabled()` checks for both flags from views
- Remove flags from `FEATURE_FLAGS` object
- Clean up unused imports
- Update unit tests (remove flag-specific tests)
- Update E2E tests (remove localStorage overrides)
- Update Maestro test comments

## Test Plan
- [x] All unit tests pass
- [x] All E2E tests pass
- [x] Maestro tests pass
- [x] Manual smoke test: mode toggle works
- [x] Manual smoke test: party creation works
- [x] No behavior changes

---
Part of Epic 10: Project Hygiene (Wave 2)
EOF
)"
```

---

## Flags to Remove

### 1. MODE_TOGGLE

| Property | Value |
|----------|-------|
| Current Phase | `ENABLED` |
| Description | Toggle between Learning and Party modes with different themes |
| Source Usages | 4 |
| Test Usages | 4 |

**Source Files:**
| File | Line | Usage |
|------|------|-------|
| `src/views/HomeView.js` | 120 | Mode-specific UI rendering |
| `src/views/HomeView.js` | 226 | Party session button condition |
| `src/views/SettingsView.js` | 254 | Mode toggle setting |
| `src/views/TopicsView.js` | 70 | Mode indicator display |

**Removal approach:** Remove `if (isFeatureEnabled('MODE_TOGGLE'))` wrappers, keep the inner code.

---

### 2. PARTY_SESSION

| Property | Value |
|----------|-------|
| Current Phase | `ENABLED` |
| Description | Create and join party sessions to play quizzes with friends |
| Source Usages | 1 |
| Test Usages | 3 |

**Source Files:**
| File | Line | Usage |
|------|------|-------|
| `src/views/HomeView.js` | 225 | Party session UI condition (combined with MODE_TOGGLE) |

**Removal approach:** Remove `isFeatureEnabled('PARTY_SESSION') &&` from combined condition.

---

## Execution Plan

### Step 1: Verify Stability (Before Starting)

```bash
# Check telemetry for Party Mode health
# - P2P connection success rate
# - User engagement metrics
# - Error rates
```

Confirm no blocking issues before proceeding.

---

### Step 2: Remove MODE_TOGGLE Flag

#### 2.1 HomeView.js (Line 120)

**Before:**
```javascript
if (isFeatureEnabled('MODE_TOGGLE')) {
  // Mode-specific UI code
}
```

**After:**
```javascript
// Mode-specific UI code (unwrapped)
```

#### 2.2 HomeView.js (Line 226)

**Before:**
```javascript
isFeatureEnabled('PARTY_SESSION') &&
isFeatureEnabled('MODE_TOGGLE') &&
// rest of condition
```

**After:**
```javascript
// rest of condition (both flags removed)
```

#### 2.3 SettingsView.js (Line 254)

**Before:**
```javascript
if (isFeatureEnabled('MODE_TOGGLE')) {
  // Mode toggle setting
}
```

**After:**
```javascript
// Mode toggle setting (unwrapped)
```

#### 2.4 TopicsView.js (Line 70)

**Before:**
```javascript
if (isFeatureEnabled('MODE_TOGGLE')) {
  // Mode indicator
}
```

**After:**
```javascript
// Mode indicator (unwrapped)
```

---

### Step 3: Remove PARTY_SESSION Flag

Already handled in Step 2.2 (combined condition in HomeView.js).

---

### Step 4: Update features.js

Remove both flags from `FEATURE_FLAGS` object:

**Before:**
```javascript
export const FEATURE_FLAGS = {
  SHOW_ADS: { ... },
  MODE_TOGGLE: { ... },  // Remove
  PARTY_SESSION: { ... } // Remove
};
```

**After:**
```javascript
export const FEATURE_FLAGS = {
  SHOW_ADS: { ... }
};
```

---

### Step 5: Clean Up Imports

Remove unused `isFeatureEnabled` imports from files that no longer need it:

```bash
# Check each modified file for remaining isFeatureEnabled calls
grep -n "isFeatureEnabled" src/views/TopicsView.js
grep -n "isFeatureEnabled" src/views/SettingsView.js
```

If a file has no remaining `isFeatureEnabled` calls, remove the import.

---

### Step 6: Update Tests

#### 6.1 Unit Tests (`src/core/features.test.js`)

| Line(s) | Current Code | Action |
|---------|--------------|--------|
| 9-10 | `localStorage.removeItem('__test_feature_MODE_TOGGLE')` | Remove these cleanup lines |
| 16-17 | `localStorage.removeItem('__test_feature_PARTY_SESSION')` | Remove these cleanup lines |
| 34-38 | Test: "should return true for MODE_TOGGLE" | **Remove entire test** |
| 44 | `expect(isFeatureEnabled('MODE_TOGGLE')).toBe(true)` | Remove this assertion |
| 50-51 | PARTY_SESSION localStorage override test | **Remove this test block** |
| 82, 84 | `expect(getFeaturePhase('MODE_TOGGLE')).toBe('ENABLED')` | Remove this assertion |
| 91-94 | Test: "PARTY_SESSION should be ENABLED" | **Remove entire test** |
| 97-100 | Test: "PARTY_SESSION can be disabled via localStorage" | **Remove entire test** |
| 109-110 | `expect(FEATURE_FLAGS).toHaveProperty('MODE_TOGGLE')` | Remove both assertions |

#### 6.2 E2E Tests (Playwright)

**`tests/e2e/mode-toggle.spec.js`**
| Line(s) | Current Code | Action |
|---------|--------------|--------|
| 6 | Comment about MODE_TOGGLE feature | Update comment |
| 14-16 | `localStorage.setItem('__test_feature_MODE_TOGGLE', 'ENABLED')` | **Remove** - no longer needed |
| 29-31 | Test for MODE_TOGGLE DISABLED rollback | **Remove entire test block** - rollback no longer possible |
| 135 | `localStorage.setItem('__test_feature_MODE_TOGGLE', 'ENABLED')` | **Remove** - no longer needed |

**`tests/e2e/party-mode.spec.js`**
| Line(s) | Current Code | Action |
|---------|--------------|--------|
| 6 | Comment about MODE_TOGGLE feature | Update comment |
| 13-16 | localStorage.setItem for both flags | **Remove** - no longer needed |
| 34-36 | `localStorage.setItem('__test_feature_MODE_TOGGLE', 'ENABLED')` | **Remove** - no longer needed |

**`tests/e2e/capture-party-demo.spec.js`**
| Line(s) | Current Code | Action |
|---------|--------------|--------|
| 54-55 | localStorage.setItem for both flags | **Remove** - no longer needed |
| 351-352 | localStorage.setItem for both flags | **Remove** - no longer needed |
| 505-506 | localStorage.setItem for both flags | **Remove** - no longer needed |

#### 6.3 Maestro Tests

**`.maestro/flows/15-mode-toggle.yaml`**
| Line | Current Code | Action |
|------|--------------|--------|
| 5 | `# NOTE: This test requires MODE_TOGGLE feature flag to be ENABLED` | **Remove comment** - always enabled now |

**`.maestro/flows/16-party-create.yaml`**
- No changes needed - tests the feature itself, not the flag

---

### Step 7: Verification

```bash
# Run unit tests
npm test -- --run

# Run E2E tests
npm run test:e2e

# Build
npm run build

# Manual smoke test
# - Toggle mode in settings
# - Start a party session
# - Verify UI appears correctly
```

---

### Step 8: Update Documentation

1. Update `FLAG_MODE_TOGGLE.md` → Mark as removed
2. Update `FLAG_PARTY_SESSION.md` → Mark as removed
3. Update `PHASE1_FEATURE_FLAG_CLEANUP.md` → Remove from "Flags to Keep" section

---

## After Removal

### Remaining Flags

After this cleanup, only **1 flag** should remain:

| Flag | Reason |
|------|--------|
| `SHOW_ADS` | Future premium/ad-free tier (Epic 07) |

---

## Success Criteria

### Source Code
- [ ] 2 flags removed from `src/core/features.js`
- [ ] All `isFeatureEnabled()` calls for removed flags eliminated
- [ ] Only `SHOW_ADS` flag remains
- [ ] Unused imports cleaned up

### Tests
- [ ] Unit tests updated (`features.test.js`) - ~10 assertions removed
- [ ] E2E tests updated - localStorage overrides removed from 3 files
- [ ] Maestro tests updated - comment removed from `15-mode-toggle.yaml`
- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] Maestro tests passing

### Verification
- [ ] No behavior changes
- [ ] Party Mode continues to work in production
- [ ] Mode toggle continues to work
- [ ] PR merged

---

## Risk Mitigation

**Risk:** Party Mode stops working after flag removal
**Mitigation:** The flags are already `ENABLED` - removing them just eliminates dead code paths

**Risk:** Tests fail unexpectedly
**Mitigation:** Review and update tests as part of the cleanup

**Risk:** Missing usages not found by grep
**Mitigation:** Run full test suite; any missed usages will cause runtime errors caught by E2E tests

---

## Related

- [PHASE1_FEATURE_FLAG_CLEANUP.md](./PHASE1_FEATURE_FLAG_CLEANUP.md) - Wave 1 (completed)
- [FLAG_MODE_TOGGLE.md](./FLAG_MODE_TOGGLE.md) - Original flag doc
- [FLAG_PARTY_SESSION.md](./FLAG_PARTY_SESSION.md) - Original flag doc
- [Epic 06 Phase 2](../epic06_sharing/PHASE2_MODE_TOGGLE.md) - Mode Toggle feature
- [Epic 06 Phase 3](../epic06_sharing/PHASE3_PARTY_SESSION.md) - Party Session feature

---

**Last Updated:** 2026-01-15
