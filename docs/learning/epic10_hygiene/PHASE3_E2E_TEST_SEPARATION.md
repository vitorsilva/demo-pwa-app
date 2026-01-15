# Phase 3: E2E Test Separation (Tests vs Content Capture)

**Status:** ✅ Complete
**Created:** 2026-01-15
**Completed:** 2026-01-15
**PR:** [#TBD](https://github.com/vitorsilva/saberloop/pull/TBD)
**Priority:** Medium (Developer Experience)

---

## Overview

Separate E2E tests into two categories:
1. **Functional Tests** - Run on every test cycle (CI, pre-commit, development)
2. **Content Capture** - Run on-demand to produce screenshots/videos for marketing

Currently all 16 test files run together with `npm run test:e2e`, including 3 capture scripts that are slow and only needed occasionally.

---

## Problem Statement

### Current State

| Category | Files | Purpose | Should Run |
|----------|-------|---------|------------|
| Functional Tests | 13 | Verify app behavior | Every test run |
| Content Capture | 3 | Produce screenshots/videos | On-demand only |

**Capture scripts:**
- `capture-landing-assets.spec.js` - Landing page screenshots
- `capture-playstore-screenshots.spec.js` - Play Store listing images
- `capture-party-demo.spec.js` - Party Mode demo video

**Issues:**
1. `npm run test:e2e` runs everything (slow)
2. Video recording is `'on'` for all tests (wastes disk space)
3. No way to run only functional tests quickly
4. Capture scripts have artificial delays for animation timing (slow by design)

### Desired State

```bash
# Run only functional tests (fast, used regularly)
npm run test:e2e

# Run only capture scripts (slow, used occasionally)
npm run test:e2e:capture
```

---

## Technical Options

### Option A: Playwright Projects (Recommended)

Use Playwright's project feature to create separate test configurations.

**Pros:**
- Clean separation with different configs (video on/off)
- Standard Playwright pattern
- Can run projects independently or together

**Cons:**
- Requires restructuring playwright.config.js

**Implementation:**
```javascript
// playwright.config.js
export default defineConfig({
  projects: [
    {
      name: 'tests',
      testDir: './tests/e2e',
      testIgnore: '**/capture-*.spec.js',
      use: {
        video: 'off',
        screenshot: 'only-on-failure',
      },
    },
    {
      name: 'capture',
      testDir: './tests/e2e',
      testMatch: '**/capture-*.spec.js',
      use: {
        video: 'on',
        screenshot: 'on',
      },
    },
  ],
});
```

**Commands:**
```bash
npx playwright test --project=tests    # Functional tests only
npx playwright test --project=capture  # Capture scripts only
npx playwright test                    # Both (all projects)
```

---

### Option B: Directory Separation

Move capture scripts to a separate directory.

**Pros:**
- Clear physical separation
- Easy to understand

**Cons:**
- May break existing paths in capture scripts
- Need to update imports

**Structure:**
```
tests/
├── e2e/           # Functional tests
│   ├── app.spec.js
│   ├── quiz-sharing.spec.js
│   └── ...
└── capture/       # Content capture scripts
    ├── landing-assets.spec.js
    ├── playstore-screenshots.spec.js
    └── party-demo.spec.js
```

---

### Option C: Tag-Based Filtering

Use Playwright's grep feature with naming conventions.

**Pros:**
- Minimal config changes
- Files stay in place

**Cons:**
- Relies on naming conventions
- Less explicit separation

**Implementation:**
```bash
# Run only tests (exclude capture)
npx playwright test --grep-invert "capture"

# Run only capture scripts
npx playwright test --grep "capture"
```

---

## Recommendation

**Option A (Playwright Projects)** is recommended because:
1. Standard Playwright pattern
2. Different video/screenshot settings per project
3. Clear `--project=tests` vs `--project=capture` commands
4. Can still run all tests when needed

---

## Implementation Plan

### 3.1 Update playwright.config.js

**Time:** 30 minutes

1. Create two projects: `tests` and `capture`
2. Set `video: 'off'` for tests project
3. Set `video: 'on'` for capture project
4. Use `testIgnore` and `testMatch` patterns

### 3.2 Update npm scripts

**Time:** 15 minutes

Add scripts to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test --project=tests",
    "test:e2e:capture": "playwright test --project=capture",
    "test:e2e:all": "playwright test"
  }
}
```

### 3.3 Update CI pipeline

**Time:** 15 minutes

Update `.github/workflows/test.yml` to run only `test:e2e` (not capture scripts).

### 3.4 Update documentation

**Time:** 15 minutes

- Update CLAUDE.md with new commands
- Add comments to capture scripts explaining how to run them

### 3.5 Verification

**Time:** 30 minutes

1. Run `npm run test:e2e` - should skip capture scripts
2. Run `npm run test:e2e:capture` - should only run capture scripts
3. Run `npm run test:e2e:all` - should run everything
4. Verify CI passes

---

## Success Criteria

- [x] `npm run test:e2e` runs only functional tests (fast)
- [x] `npm run test:e2e:capture` runs only capture scripts
- [x] Video recording disabled for functional tests (saves disk space)
- [x] CI runs only functional tests
- [x] All existing tests still pass (102 passed)
- [x] Documentation updated (CLAUDE.md)

---

## File Inventory

### Functional Tests (13 files)

| File | Tests | Description |
|------|-------|-------------|
| `app.spec.js` | Core app functionality |
| `ads.spec.js` | Ad container behavior |
| `data-deletion.spec.js` | Data deletion feature |
| `donation.spec.js` | Donation button |
| `mode-toggle.spec.js` | Learning/Party mode toggle |
| `offline.spec.js` | Offline functionality |
| `openrouter-guide.spec.js` | OpenRouter setup flow |
| `party-mode.spec.js` | Party Mode features |
| `quiz-leave-confirmation.spec.js` | Leave quiz confirmation |
| `quiz-replay-labels.spec.js` | Quiz replay UI |
| `quiz-sharing.spec.js` | Quiz sharing feature |
| `share.spec.js` | Share functionality |
| `usage-cost.spec.js` | Usage cost tracking |

### Capture Scripts (3 files)

| File | Purpose | Output |
|------|---------|--------|
| `capture-landing-assets.spec.js` | Landing page screenshots | `docs/product-info/screenshots/` |
| `capture-playstore-screenshots.spec.js` | Play Store images | `docs/product-info/screenshots/playstore/` |
| `capture-party-demo.spec.js` | Party Mode demo video | `docs/product-info/videos/` |

---

## Risk Assessment

**Risk Level:** Low

- No behavior changes to the app
- Tests remain the same, just organized differently
- Easy to rollback (revert playwright.config.js changes)

---

## Related

- [Epic 10 Hygiene Plan](./EPIC10_HYGIENE_PLAN.md)
- [E2E Testing Phase](../epic01_infrastructure/PHASE4.4_E2E_TESTING.md)

---

## Learning Notes

### Session: 2026-01-15

#### Completed

- Created two Playwright projects: `tests` (functional) and `capture` (content production)
- Updated npm scripts with new commands
- Updated CI workflow to clarify capture scripts are excluded
- Updated CLAUDE.md with new test commands
- All 102 functional tests passing

#### Implementation Details

**Key changes to playwright.config.js:**
- `testIgnore: '**/capture-*.spec.js'` for tests project
- `testMatch: '**/capture-*.spec.js'` for capture project
- `video: 'off'` for tests project (saves disk space)
- `video: 'on'` for capture project (needed for content)

**Commits:**
1. `refactor(hygiene): separate E2E tests into projects` - playwright.config.js
2. `chore(hygiene): add npm scripts for test separation` - package.json
3. `docs(ci): clarify E2E tests exclude capture scripts` - test.yml
4. `docs: update E2E test commands in CLAUDE.md` - CLAUDE.md

#### Key Learnings

1. **Playwright Projects Pattern**: Using `testIgnore` and `testMatch` is cleaner than moving files to separate directories. Files stay in place, imports don't break, and configuration is centralized.

2. **Video Recording Cost**: Disabling video for functional tests reduces test artifacts significantly. Videos are only needed for debugging failures (screenshot suffices) or intentional capture.

3. **Naming Convention Value**: The `capture-*.spec.js` naming convention made separation trivial. Good naming patterns pay off when organizing tests later.

4. **CI Implicit Change**: The npm script change automatically affected CI without requiring workflow file changes. However, adding a clarifying comment documents intent.

#### Test Results

```
Tests project: 107 tests (102 passed, 3 skipped, 2 flaky)
Capture project: 15 tests in 3 files (not run in CI)
```

---

**Last Updated:** 2026-01-15
