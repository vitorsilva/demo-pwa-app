# Phase 88: Knip Configuration Enhancements

## Overview

Enhance Knip (dead code detection) configuration to leverage more of its capabilities, improving CI feedback, developer experience, and code quality enforcement.

**Status:** ✅ Complete (January 20, 2026)
**Priority:** Low (Developer Experience)
**Actual Effort:** ~15 minutes

---

## What Was Implemented

### 1. Fixed All Warnings (Zero False Positives)

**Updated knip.json:**
- Added `src/types.js` to ignore (JSDoc typedef file, not runtime code)
- Added `ffmpeg-static` to ignoreDependencies (manual video processing tool)

**Removed unused packages:**
- `@ffmpeg/ffmpeg` - never used in codebase
- `@ffmpeg/util` - never used in codebase

### 2. Enforced in CI (No Longer Warning-Only)

**Before:**
```yaml
- name: Check for dead code (warning)
  run: npm run lint:dead-code || true
```

**After:**
```yaml
- name: Check for dead code
  run: npx knip --reporter github-actions
```

**Benefits:**
- CI now **fails** if dead code is introduced
- **Inline annotations** appear on PR diffs showing exact locations

---

## What Was Skipped (And Why)

| Feature | Decision | Justification |
|---------|----------|---------------|
| **Caching (`--cache`)** | Skipped | Knip already runs in <2 seconds. Caching adds complexity for minimal benefit. |
| **Production mode (`--production`)** | Skipped | Overkill for this project. Default mode catches issues effectively. |
| **New npm scripts** (`lint:dead-code:prod`, `lint:dead-code:ci`) | Skipped | Single `lint:dead-code` script is sufficient. CI uses npx directly with reporter flag. |
| **Watch mode documentation** | Skipped | Developers can run `npx knip --watch` if needed. Not worth documenting. |

---

## Final Configuration

### knip.json
```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": ["src/main.js"],
  "project": ["src/**/*.js"],
  "ignore": [
    "**/*.test.js",
    "**/*.spec.js",
    "src/api/api.mock.js",
    "src/api/api.real.js",
    "src/types.js"
  ],
  "ignoreDependencies": ["ffmpeg-static"],
  "ignoreBinaries": ["docker-compose", "start"],
  "ignoreExportsUsedInFile": true,
  "vite": true
}
```

### CI Workflow (.github/workflows/test.yml)
```yaml
- name: Check for dead code
  run: npx knip --reporter github-actions
```

---

## Validation Results

- [x] `npm run lint:dead-code` returns 0 exit code (no issues)
- [x] CI workflow passes with new configuration
- [x] GitHub Actions reporter produces inline annotations on PRs

---

## Commits

1. `5017a6b` - chore: clean up unused dependencies and fix Knip warnings
2. `4179f3a` - ci: enforce dead code check with GitHub Actions reporter

---

**Completed:** January 20, 2026
