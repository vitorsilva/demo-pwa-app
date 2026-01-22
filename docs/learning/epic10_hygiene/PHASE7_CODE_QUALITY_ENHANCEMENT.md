# Phase 7: Code Quality Enhancement

**Status:** Complete
**Priority:** Medium
**Created:** 2026-01-21
**Phase 7.1:** ✅ Complete (2026-01-22)
**Phase 7.2:** ✅ Complete (2026-01-22)
**Phase 7.3:** ✅ Complete (2026-01-22)
**Phase 7.4:** ✅ Complete (2026-01-22)
**Phase 7.5:** ✅ Complete (2026-01-22)
**Phase 7.6:** ⏭️ Skipped (ESLint sufficient)
**Phase 7.7:** ✅ Complete (2026-01-22)
**Phase 7.8:** ✅ Complete (2026-01-22)
**Phase 7.9:** ✅ Complete (2026-01-22)

---

## Overview

This phase enhances the project's code quality infrastructure beyond the existing tools. While the project already has excellent coverage (ESLint, Vitest, Playwright, Stryker, dependency-cruiser, Knip), there are gaps in **automation**, **security scanning**, **formatting consistency**, and **complexity visibility**.

### Current State Assessment

| Category | Tool | Status |
|----------|------|--------|
| Linting | ESLint + SonarJS | Excellent |
| Unit Testing | Vitest | Excellent |
| E2E Testing | Playwright | Excellent |
| Mutation Testing | Stryker | Excellent (rare!) |
| Architecture | dependency-cruiser | Excellent |
| Dead Code | Knip | Good (can enhance) |
| Type Checking | TypeScript + JSDoc | Good |
| CI/CD | GitHub Actions | Good |
| **Formatting** | (none) | **Missing** |
| **Git Hooks** | (none) | **Missing** |
| **Security SAST** | (none) | **Missing** |
| **Commit Linting** | (none) | **Missing** |
| **Complexity Reports** | ESLint only | **Could enhance** |

### Goals

1. **Consistency** - Automated formatting ensures consistent code style
2. **Shift-left** - Catch issues before commits reach the repository
3. **Security** - Static analysis for common vulnerabilities
4. **Visibility** - Better complexity tracking and trend analysis
5. **Automation** - Reduce manual review burden

### Constraints

All tools must be:
- Open source
- Free (no paid tiers required)
- Local (no cloud services required)
- Well-maintained (active in 2024-2025)

---

## Implementation Phases

### Phase 7.1: Code Formatting (Prettier) - HIGH PRIORITY

**Why:** No auto-formatter exists. This causes inconsistent style and "noise" in diffs where formatting changes mix with logic changes.

**Tools:**
- [Prettier](https://prettier.io/) - Industry standard code formatter
- [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier) - Disables ESLint rules that conflict with Prettier

**Installation:**
```bash
npm install -D prettier eslint-config-prettier
```

**Configuration files:**

`.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

`.prettierignore`:
```
# Build outputs
dist/
dev-dist/

# Dependencies
node_modules/
php-api/vendor/

# Test artifacts
test-results/
playwright-report/
playwright/.cache/
coverage/
.playwright-mcp/
.stryker-tmp/

# Generated/logs
reports/
telemetry-logs/
package/

# Other
php-api/
public/
*.md
.maestro/
```

**ESLint integration** (`eslint.config.js`):
```js
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  sonarjs.configs.recommended,
  prettierConfig,  // Must be last to override conflicting rules
  // ... rest of config
];
```

**Package.json scripts:**
```json
{
  "format": "prettier --write src/",
  "format:check": "prettier --check src/"
}
```

**CI integration** (add to `.github/workflows/test.yml`):
```yaml
- name: Check formatting
  run: npm run format:check
```

**Validation:**
- [x] Prettier installed and configured
- [x] ESLint + Prettier don't conflict
- [x] All source files formatted consistently
- [ ] CI checks formatting (deferred - can add later)

**Estimated effort:** 1-2 hours
**Actual effort:** ~45 minutes

---

### Phase 7.2: Git Hooks (Husky + lint-staged) - HIGH PRIORITY

**Why:** Quality checks only run in CI, meaning developers discover issues late. Git hooks catch problems before commits.

**Tools:**
- [Husky](https://typicode.github.io/husky/) - Modern Git hooks manager
- [lint-staged](https://github.com/lint-staged/lint-staged) - Run linters on staged files only (fast)

**Installation:**
```bash
npm install -D husky lint-staged
npx husky init
```

**Configuration:**

`.husky/pre-commit`:
```bash
npx lint-staged
```

`package.json` (add lint-staged config):
```json
{
  "lint-staged": {
    "src/**/*.js": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

**Benefits:**
- Runs only on staged files (fast, even in large repos)
- Auto-fixes what can be auto-fixed
- Prevents commits with lint errors
- Formats code automatically before commit

**Validation:**
- [x] Husky installed and initialized
- [x] Pre-commit hook runs lint-staged
- [x] Commits with lint errors are blocked
- [x] Auto-formatting works on commit

**Estimated effort:** 30 minutes
**Actual effort:** ~15 minutes

---

### Phase 7.3: Commit Message Linting (commitlint) - MEDIUM PRIORITY

**Why:** Inconsistent commit messages make history hard to navigate and prevent automated changelog generation.

**Tools:**
- [commitlint](https://commitlint.js.org/) - Lint commit messages
- [@commitlint/config-conventional](https://www.npmjs.com/package/@commitlint/config-conventional) - Conventional Commits rules

**Installation:**
```bash
npm install -D @commitlint/cli @commitlint/config-conventional
```

**Configuration:**

`commitlint.config.js`:
```js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat',     // New feature
      'fix',      // Bug fix
      'docs',     // Documentation
      'style',    // Formatting (no code change)
      'refactor', // Code change (no feature/fix)
      'perf',     // Performance improvement
      'test',     // Adding tests
      'chore',    // Build, config, etc.
      'revert',   // Revert previous commit
    ]],
    'scope-enum': [1, 'always', [
      'hygiene',  // Cleanup tasks
      'core',     // Core infrastructure
      'api',      // API layer
      'views',    // UI views
      'services', // Business logic
      'utils',    // Utilities
      'tests',    // Test infrastructure
      'ci',       // CI/CD
      'deps',     // Dependencies
    ]],
  },
};
```

`.husky/commit-msg`:
```bash
npx --no -- commitlint --edit "$1"
```

**Valid commit examples:**
```
feat(views): add dark mode toggle
fix(api): handle network timeout gracefully
refactor(hygiene): remove unused imports
docs: update README with setup instructions
chore(deps): upgrade vitest to 3.0
```

**Benefits:**
- Consistent commit history
- Easy to generate changelogs
- Clear communication of change intent
- Follows [Conventional Commits](https://www.conventionalcommits.org/) standard

**Validation:**
- [x] commitlint installed and configured
- [x] commit-msg hook installed
- [x] Invalid commits are rejected
- [x] Valid commits pass

**Estimated effort:** 30 minutes
**Actual effort:** ~10 minutes

---

### Phase 7.4: Security Static Analysis (Semgrep) - MEDIUM PRIORITY

**Why:** No security-focused static analysis. Could miss XSS, injection, or other OWASP Top 10 vulnerabilities.

**Tools:**
- [Semgrep](https://github.com/semgrep/semgrep) - Fast, open-source SAST with community rules

**Installation:**
```bash
# Via pip (recommended)
pip install semgrep

# Or via Homebrew (macOS)
brew install semgrep

# Or via npm (wrapper)
npm install -D @semgrep/semgrep
```

**Usage:**
```bash
# Scan with auto-detected rules
semgrep scan --config auto src/

# Scan with specific rulesets
semgrep scan --config p/javascript src/
semgrep scan --config p/security-audit src/

# Output as JSON for CI
semgrep scan --config auto --json --output reports/security.json src/
```

**Package.json scripts:**
```json
{
  "security:scan": "semgrep scan --config auto src/",
  "security:scan:ci": "semgrep scan --config auto --error src/"
}
```

**CI integration** (add to `.github/workflows/test.yml`):
```yaml
- name: Install Semgrep
  run: pip install semgrep

- name: Security scan
  run: npm run security:scan:ci
  continue-on-error: true  # Start as warning, promote to error later
```

**Alternative: npm audit** (already available):
```json
{
  "security:deps": "npm audit --audit-level=moderate"
}
```

**What Semgrep catches:**
- XSS vulnerabilities (innerHTML, document.write)
- SQL injection patterns
- Hardcoded secrets
- Insecure crypto usage
- Path traversal
- Command injection

**Validation:**
- [x] Semgrep installed (via pip)
- [x] Scan runs without errors
- [x] Findings reviewed - false positives identified, real concerns added to backlog
- [ ] CI integration (deferred - requires Python in CI)

**Estimated effort:** 1 hour
**Actual effort:** ~30 minutes

**Note:** Windows requires `PYTHONUTF8=1` environment variable for Semgrep to work.

---

### Phase 7.5: Enhanced Knip Configuration - MEDIUM PRIORITY

**Why:** Current Knip config is basic. Enhanced configuration provides better detection and reporting.

**Current config:**
```json
{
  "entry": ["src/main.js"],
  "project": ["src/**/*.js"],
  "ignore": ["**/*.test.js", "**/*.spec.js", "src/api/api.mock.js", "src/api/api.real.js", "src/types.js"],
  "ignoreDependencies": ["ffmpeg-static"],
  "ignoreBinaries": ["docker-compose", "start"],
  "ignoreExportsUsedInFile": true,
  "vite": true
}
```

**Enhanced config:**
```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": [
    "src/main.js",
    "public/sw.js"
  ],
  "project": [
    "src/**/*.js"
  ],
  "ignore": [
    "**/*.test.js",
    "**/*.spec.js",
    "src/api/api.mock.js",
    "src/api/api.real.js",
    "src/types.js"
  ],
  "ignoreDependencies": [
    "ffmpeg-static"
  ],
  "ignoreBinaries": [
    "docker-compose",
    "start"
  ],
  "ignoreExportsUsedInFile": true,
  "includeEntryExports": true,
  "rules": {
    "files": "error",
    "dependencies": "error",
    "unlisted": "error",
    "unresolved": "error",
    "exports": "warn",
    "classMembers": "warn",
    "duplicates": "warn",
    "types": "off"
  },
  "vite": true,
  "vitest": true,
  "playwright": true,
  "eslint": true
}
```

**New features enabled:**

| Feature | Purpose |
|---------|---------|
| `includeEntryExports` | Report unused exports in entry files |
| `rules` | Control severity (error vs warn) per issue type |
| `classMembers` | Detect unused class methods/properties |
| Plugin configs | Better detection for Vitest, Playwright, ESLint |

**New scripts:**
```json
{
  "lint:dead-code": "knip",
  "lint:dead-code:fix": "knip --fix",
  "lint:dead-code:prod": "knip --production",
  "lint:dead-code:strict": "knip --include files,dependencies,unlisted,exports,classMembers"
}
```

**Validation:**
- [ ] Enhanced config applied
- [ ] `classMembers` detection working
- [ ] Severity levels working correctly
- [ ] Production mode working

**Estimated effort:** 30 minutes

---

### Phase 7.6: Complexity Analysis & Reporting - LOW PRIORITY

**Why:** ESLint warns about complexity but doesn't provide trends or reports. Dedicated tools offer better visibility.

**Tools (choose one):**

**Option A: Plato** (historical reports)
```bash
npm install -D plato
npx plato -r -d reports/complexity src/
```

Generates HTML report with:
- Maintainability index per file
- Cyclomatic complexity trends
- Lines of code metrics
- Historical charts

**Option B: Lizard** (fast CLI analysis)
```bash
pip install lizard
lizard src/ --CCN 15 --warnings_only
```

Outputs warnings for functions exceeding thresholds.

**Option C: escomplex-js** (programmatic)
```bash
npm install -D escomplex
```

Use in custom scripts for JSON output.

**Package.json scripts:**
```json
{
  "complexity:report": "plato -r -d reports/complexity src/",
  "complexity:check": "lizard src/ --CCN 15 --warnings_only"
}
```

**Integration with existing ESLint rules:**

Current ESLint complexity thresholds:
- `complexity`: 10 (cyclomatic)
- `max-depth`: 4
- `max-lines-per-function`: 50
- `max-params`: 4
- `sonarjs/cognitive-complexity`: 15

These are already configured as warnings. Dedicated tools add:
- Historical tracking
- Visual reports
- Trend analysis

**Validation:**
- [ ] Tool installed
- [ ] Report generates successfully
- [ ] Reports directory added to .gitignore
- [ ] Baseline metrics documented

**Estimated effort:** 1 hour

---

### Phase 7.7: Bundle Size Analysis - LOW PRIORITY

**Why:** PWA performance depends on bundle size. No visibility into what's contributing to bundle bloat.

**Tools:**

**Option A: rollup-plugin-visualizer** (integrated with Vite)
```bash
npm install -D rollup-plugin-visualizer
```

`vite.config.js`:
```js
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    // ... existing plugins
    visualizer({
      filename: 'reports/bundle-stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
};
```

**Option B: source-map-explorer** (post-build analysis)
```bash
npm install -D source-map-explorer
npx source-map-explorer dist/assets/*.js
```

**Package.json scripts:**
```json
{
  "build:analyze": "npm run build && source-map-explorer dist/assets/*.js"
}
```

**What it shows:**
- Size contribution per module
- Dependency sizes
- Tree-shaking effectiveness
- Gzipped vs raw sizes

**Validation:**
- [ ] Tool installed
- [ ] Report generates on build
- [ ] Baseline bundle size documented
- [ ] reports/ directory in .gitignore

**Estimated effort:** 30 minutes

---

### Phase 7.8: Duplicate Code Detection - LOW PRIORITY

**Why:** Copy-paste programming leads to maintenance burden. No automated detection currently.

**Tool:**
- [jscpd](https://github.com/kucherenko/jscpd) - Copy/paste detector

**Installation:**
```bash
npm install -D jscpd
```

**Configuration:**

`.jscpd.json`:
```json
{
  "threshold": 0.5,
  "reporters": ["html", "console"],
  "ignore": [
    "**/*.test.js",
    "**/*.spec.js",
    "node_modules/**",
    "dist/**"
  ],
  "format": ["javascript"],
  "output": "reports/duplicates"
}
```

**Package.json scripts:**
```json
{
  "lint:duplicates": "jscpd src/",
  "lint:duplicates:report": "jscpd src/ --reporters html --output reports/duplicates"
}
```

**What it catches:**
- Duplicated code blocks (>5 lines by default)
- Similar patterns across files
- Copy-paste without abstraction

**Validation:**
- [ ] jscpd installed
- [ ] Scan runs without errors
- [ ] Baseline duplicate % documented
- [ ] Major duplicates identified

**Estimated effort:** 30 minutes

---

### Phase 7.9: Enhanced ESLint Plugins - LOW PRIORITY

**Why:** Additional plugins catch more issues without much configuration overhead.

**Plugin: eslint-plugin-import**

Catches import/export issues:
```bash
npm install -D eslint-plugin-import
```

`eslint.config.js`:
```js
import importPlugin from 'eslint-plugin-import';

// Add to rules:
'import/no-cycle': 'error',           // Circular imports
'import/no-unresolved': 'error',      // Broken imports
'import/no-duplicates': 'warn',       // Duplicate imports
'import/order': ['warn', {            // Import ordering
  'newlines-between': 'always',
  'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index']
}]
```

**Note:** Some of this overlaps with dependency-cruiser. Evaluate overlap before adding.

**Plugin: eslint-plugin-unicorn**

Modern JS best practices:
```bash
npm install -D eslint-plugin-unicorn
```

Useful rules:
- `unicorn/prefer-modern-dom-apis` - Use modern DOM methods
- `unicorn/no-array-for-each` - Prefer for...of
- `unicorn/prefer-at` - Use Array.at()
- `unicorn/prefer-string-replace-all` - Use replaceAll()

**Validation:**
- [ ] Plugins installed
- [ ] Rules configured
- [ ] No conflicts with existing rules
- [ ] All tests still pass

**Estimated effort:** 1 hour

---

## Priority Summary

| Phase | Priority | Effort | Impact |
|-------|----------|--------|--------|
| 5.1 Prettier | HIGH | 1-2h | Consistency in all diffs |
| 5.2 Husky + lint-staged | HIGH | 30m | Catch issues before commit |
| 5.3 commitlint | MEDIUM | 30m | Clean commit history |
| 5.4 Semgrep | MEDIUM | 1h | Security visibility |
| 5.5 Enhanced Knip | MEDIUM | 30m | Better dead code detection |
| 5.6 Complexity reports | LOW | 1h | Visibility into hotspots |
| 5.7 Bundle analysis | LOW | 30m | Performance visibility |
| 5.8 jscpd | LOW | 30m | Duplicate detection |
| 5.9 ESLint plugins | LOW | 1h | Additional lint rules |

**Recommended order:**
1. Phase 7.1 + 5.2 together (Prettier + Husky) - Foundation
2. Phase 7.3 (commitlint) - While hooks are fresh
3. Phase 7.5 (Enhanced Knip) - Quick win
4. Phase 7.4 (Semgrep) - Security baseline
5. Remaining phases as time permits

---

## Updated Quality Scripts (Target State)

```json
{
  "scripts": {
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "lint:dead-code": "knip",
    "lint:dead-code:fix": "knip --fix",
    "lint:dead-code:prod": "knip --production",
    "lint:duplicates": "jscpd src/",
    "format": "prettier --write src/",
    "format:check": "prettier --check src/",
    "typecheck": "tsc -p jsconfig.json --noEmit",
    "arch:test": "depcruise src --config .dependency-cruiser.cjs",
    "security:scan": "semgrep scan --config auto src/",
    "complexity:report": "plato -r -d reports/complexity src/",
    "bundle:analyze": "npm run build && source-map-explorer dist/assets/*.js",
    "quality": "npm run format:check && npm run lint && npm run typecheck && npm run arch:test && npm run lint:dead-code",
    "quality:full": "npm run quality && npm run security:scan && npm run lint:duplicates"
  }
}
```

---

## Validation Checklist (Final)

After all phases complete:

- [ ] `npm run format:check` passes
- [ ] `npm run lint` shows 0 errors
- [ ] `npm run typecheck` passes
- [ ] `npm run arch:test` passes
- [ ] `npm run lint:dead-code` shows no critical issues
- [ ] `npm run security:scan` shows no critical vulnerabilities
- [ ] Pre-commit hooks working
- [ ] Commit message linting working
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] CI pipeline updated with new checks

---

## Complexity Hotspots (For Future Reference)

Based on ESLint warnings, these files have high complexity and should be prioritized for refactoring when touched:

| File | Lines | Issue |
|------|-------|-------|
| `PartyQuizView.js` | 1036 | Split into smaller components |
| `party-session.js` | 1033 | Separate Host/Guest into classes |
| `SettingsView.js` | 620 | Extract form sections |
| `quiz-service.js` | ~400 | Extract quiz state management |

These are **not blocking** - they work correctly. Address when making changes to those files.

---

## Related Documentation

- [ESLint Config](../../../eslint.config.js) - Current ESLint configuration
- [Knip Config](../../../knip.json) - Current Knip configuration
- [Phase 4: ESLint Cleanup](./PHASE4_ESLINT_CLEANUP.md) - Previous quality work
- [Epic 10 Standards](./EPIC10_HYGIENE_PLAN.md) - Development standards

---

## Research Sources

- [ESLint 2025 Year in Review](https://eslint.org/blog/2026/01/eslint-2025-year-review/)
- [Knip Configuration Reference](https://knip.dev/reference/configuration)
- [Knip Issue Types](https://knip.dev/reference/issue-types)
- [Semgrep Open Source](https://github.com/semgrep/semgrep)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky + lint-staged Guide](https://betterstack.com/community/guides/scaling-nodejs/husky-and-lint-staged/)
- [Static Analysis Tools](https://github.com/analysis-tools-dev/static-analysis)

---

**Last Updated:** 2026-01-22

**Learning Notes:** [PHASE7_LEARNING_NOTES.md](./PHASE7_LEARNING_NOTES.md)
