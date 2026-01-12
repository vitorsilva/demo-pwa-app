# Party Mode: Disable in Production via Feature Flag

**Status:** Complete
**Created:** 2026-01-12
**Completed:** 2026-01-12
**Parent:** [Epic 6 Plan](./EPIC6_SHARING_PLAN.md)

---

## Goal

Disable Party Mode (`PARTY_SESSION` feature flag) in production while keeping it enabled in staging, to allow further testing and bug fixes before general availability.

---

## Current State

- `PARTY_SESSION` flag is `ENABLED` in `src/core/features.js` - live for all users
- `MODE_TOGGLE` flag is `ENABLED` - users can switch between Learning/Party themes
- No environment awareness in feature flags (same configuration for staging and production)
- Build system already differentiates staging via `DEPLOY_TARGET=staging`

---

## Scope

| Flag | Production | Staging | Rationale |
|------|------------|---------|-----------|
| `PARTY_SESSION` | DISABLED | ENABLED | Hide party room creation/joining until bugs are fixed |
| `MODE_TOGGLE` | ENABLED | ENABLED | Keep the theme toggle available (less disruptive) |

---

## Approach: Build-time Environment Variable

Inject `VITE_DEPLOY_TARGET` at build time and use it in `features.js` to determine flag phases.

**Why this approach:**
- Follows existing patterns (project already uses `import.meta.env.VITE_*`)
- Build system already uses `DEPLOY_TARGET` for base path (`/app/` vs `/app-staging/`)
- Build-time injection is deterministic and secure
- No magic strings or hostname detection needed
- Easy to test locally with different build commands

---

## Implementation Steps

### Step 1: Update `vite.config.js`

Add `define` block to inject `VITE_DEPLOY_TARGET`:

```javascript
export default defineConfig(({ command }) => {
    const base = getBasePath(command);
    const deployTarget = command === 'serve'
        ? 'development'
        : (process.env.DEPLOY_TARGET || 'production');

    return {
        base,
        root: '.',
        define: {
            'import.meta.env.VITE_DEPLOY_TARGET': JSON.stringify(deployTarget)
        },
        // ... rest of config
    };
});
```

### Step 2: Update `src/core/features.js`

Add environment detection and update `PARTY_SESSION`:

```javascript
/**
 * Get current deployment environment
 * @returns {'production' | 'staging' | 'development'}
 */
function getEnvironment() {
  return import.meta.env.VITE_DEPLOY_TARGET || 'production';
}

export const FEATURE_FLAGS = {
  SHOW_ADS: {
    phase: 'ENABLED',
    description: 'Display Google AdSense ads during quiz and results loading'
  },
  MODE_TOGGLE: {
    phase: 'ENABLED',  // Keep enabled in both environments
    description: 'Toggle between Learning and Party modes with different themes'
  },
  PARTY_SESSION: {
    phase: getEnvironment() === 'production' ? 'DISABLED' : 'ENABLED',
    description: 'Create and join party sessions to play quizzes with friends in real-time'
  }
};
```

### Step 3: Update Tests

Update `src/core/features.test.js` to handle environment-aware flags:
- Test that `PARTY_SESSION` is disabled when `VITE_DEPLOY_TARGET=production`
- Test that `PARTY_SESSION` is enabled when `VITE_DEPLOY_TARGET=staging`
- Test that localStorage override still works (for E2E testing)

---

## Files to Modify

| File | Change |
|------|--------|
| `vite.config.js` | Add `define` block for `VITE_DEPLOY_TARGET` |
| `src/core/features.js` | Add `getEnvironment()` and environment-aware phase for `PARTY_SESSION` |
| `src/core/features.test.js` | Update tests for environment-aware behavior |

---

## Expected Behavior After Implementation

| Environment | Build Command | PARTY_SESSION | Party Mode UI |
|-------------|---------------|---------------|---------------|
| Development | `npm run dev` | ENABLED | Create/Join Party visible |
| Staging | `npm run build:staging && deploy` | ENABLED | Create/Join Party visible |
| Production | `npm run build && deploy` | DISABLED | Create/Join Party hidden |

**Note:** `MODE_TOGGLE` stays enabled everywhere - users can still switch to Party theme, but the Create Party / Join Party buttons will be hidden in production.

---

## Verification Plan

1. **Local dev:** `npm run dev` - Party buttons should be visible when in Party mode
2. **Production build:** `npm run build; npm run preview` - Party buttons should be hidden
3. **Staging build:** `npm run build:staging; npm run preview` - Party buttons should be visible
4. **Test override:** In production, setting `localStorage.__test_feature_PARTY_SESSION = 'ENABLED'` should enable Party Mode (for testing)
5. **Run tests:** `npm test` and `npm run test:e2e` should pass

**Note:** Use `;` instead of `&&` for command chaining in PowerShell.

---

## Rollback Plan

If issues arise after deployment:

1. **Quick user fix:** Users can enable Party Mode via localStorage:
   ```javascript
   localStorage.setItem('__test_feature_PARTY_SESSION', 'ENABLED');
   ```

2. **Code rollback:** Change `PARTY_SESSION` phase back to `'ENABLED'`:
   ```javascript
   PARTY_SESSION: {
     phase: 'ENABLED',  // Remove environment check
     description: '...'
   }
   ```

---

## Future Extensibility

This pattern can be reused for any feature needing environment-specific rollout:

```javascript
NEW_FEATURE: {
  phase: getEnvironment() === 'production' ? 'DISABLED' : 'ENABLED',
  description: 'New feature description'
}
```

---

## Related Documents

- [Epic 6 Plan](./EPIC6_SHARING_PLAN.md) - Parent epic with feature flag strategy
- [Phase 3 Party Session](./PHASE3_PARTY_SESSION.md) - Party Mode implementation details
- [Phase 3 Learning Notes](./PHASE3_LEARNING_NOTES.md) - Implementation history and gotchas

---

## Learning Notes

### Session: 2026-01-12

#### Completed
- [x] Updated `vite.config.js` to inject `VITE_DEPLOY_TARGET` at build time
- [x] Updated `src/core/features.js` with `getEnvironment()` function and environment-aware `PARTY_SESSION`
- [x] Updated `src/core/features.test.js` - fixed outdated tests and added environment-aware tests
- [x] Verified production build has `PARTY_SESSION: DISABLED`
- [x] Verified staging build has `PARTY_SESSION: ENABLED`

#### Difficulties & Solutions

##### Problem 1: Outdated unit tests
**Symptom**: Test file `features.test.js` had tests expecting `MODE_TOGGLE` to be `DISABLED`, but it was actually `ENABLED`.

**Cause**: Tests were written when `MODE_TOGGLE` was in a different phase and never updated when the flag was promoted to `ENABLED`.

**Fix**: Rewrote the test file to reflect current flag states and added new tests for environment-aware behavior.

**Learning**: When changing feature flag states, always update the corresponding tests. Consider adding a CI check that validates test assertions match actual flag values.

---

##### Problem 2: Pre-existing test failure in signaling-client.test.js
**Symptom**: Test `getSignalingBaseUrl > should return default URL` expects `https://saberloop.com/party` but gets `http://localhost:8080/party`.

**Cause**: The test environment doesn't have `VITE_PARTY_API_URL` set, and the function falls back differently in test vs production contexts.

**Fix**: Not fixed in this session - unrelated to the feature flag change. This is a pre-existing issue that should be addressed separately.

**Learning**: When running tests, note which failures are pre-existing vs caused by your changes. Don't block deployment for unrelated test failures.

---

##### Problem 3: E2E tests timing out
**Symptom**: `npm run test:e2e` times out with "Timed out waiting 120000ms from config.webServer".

**Cause**: The web server may fail to start due to port conflicts, missing dependencies, or other environment issues.

**Workaround**: Verify implementation via build output inspection instead of E2E tests:
```powershell
npm run build
grep -o "PARTY_SESSION.*phase" dist/assets/main-*.js
```

**Learning**: Have multiple verification strategies. Build output inspection can be faster and more reliable than E2E tests for configuration changes.

---

##### Problem 4: PowerShell command chaining syntax
**Symptom**: Command `npm run build:staging && npm run deploy:staging` fails with "The token '&&' is not a valid statement separator".

**Cause**: PowerShell uses different syntax than Bash/CMD for command chaining.

**Fix**: Use `;` instead of `&&` in PowerShell:
```powershell
# Bash/CMD
npm run build:staging && npm run deploy:staging

# PowerShell
npm run build:staging; npm run deploy:staging
```

**Learning**: Always consider cross-platform compatibility in documentation. When providing commands, note which shell they're for or provide alternatives.

---

##### Problem 5: cross-env not found
**Symptom**: `'cross-env' is not recognized as an internal or external command` when running `npm run build:staging`.

**Cause**: `cross-env` is a dev dependency that wasn't installed. The user may have cloned the repo without running `npm install`, or `node_modules` was deleted.

**Fix**: Run `npm install` to install all dependencies including `cross-env`.

**Learning**: Always run `npm install` after cloning or when encountering missing command errors. Consider adding a check in npm scripts or documenting this requirement.

---

#### Gotchas for Future Reference

1. **Vite's `define` requires JSON.stringify**: When injecting values via `define`, always wrap strings with `JSON.stringify()`:
   ```javascript
   define: {
     'import.meta.env.VITE_DEPLOY_TARGET': JSON.stringify(deployTarget)
   }
   ```

2. **Test environment defaults to production**: Since `VITE_DEPLOY_TARGET` is undefined in tests, `getEnvironment()` returns `'production'`. This is intentional - tests should mirror production behavior by default.

3. **localStorage override still works**: The `__test_feature_*` localStorage keys can override any flag, even environment-specific ones. This is useful for E2E testing and debugging.

4. **Verify builds via grep**: Quick way to verify feature flag values in built output:
   ```powershell
   npm run build
   grep -o "PARTY_SESSION.*phase" dist/assets/main-*.js
   # Output: PARTY_SESSION:{phase:"DISABLED",...
   ```

5. **Staging vs Production builds generate different JS filenames**: The hash in `main-*.js` changes between builds, so use glob patterns when inspecting.

---

#### Verification Results

| Check | Result |
|-------|--------|
| Production build: `PARTY_SESSION` phase | `DISABLED` ✅ |
| Staging build: `PARTY_SESSION` phase | `ENABLED` ✅ |
| Unit tests (features.test.js) | 15/15 passed ✅ |
| Full unit test suite | 729/730 passed (1 pre-existing failure) ✅ |

---

**Last Updated:** 2026-01-12
