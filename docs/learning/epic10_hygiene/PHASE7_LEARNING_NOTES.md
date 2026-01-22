# Phase 7: Code Quality Enhancement - Learning Notes

**Phase:** 7 (Code Quality Enhancement)
**Started:** 2026-01-22

---

## Phase 7.1: Prettier (2026-01-22) ✅

### What was implemented

- Installed `prettier` and `eslint-config-prettier`
- Created `.prettierrc` with project-specific configuration
- Created comprehensive `.prettierignore` (mirrors .gitignore patterns)
- Updated `eslint.config.js` to include `prettierConfig` (must be last in config array)
- Added `format` and `format:check` npm scripts
- Formatted 124 source files
- Added `.stryker-tmp` to `vitest.config.js` exclude list

### Key Learnings

1. **Prettier is opinionated** - It enforces style decisions with minimal configuration. The philosophy is "less options = less arguments about style."

2. **trailingComma: "es5"** - Adds trailing commas where ES5 allows (arrays, objects) but not in function parameters (which is ES2017+). This gives cleaner diffs when adding items.

3. **eslint-config-prettier must be last** - It disables ESLint rules that conflict with Prettier's formatting. If it's not last, other configs might re-enable conflicting rules.

4. **prettierignore should mirror gitignore** - Any generated/build/temp directories that are gitignored should also be ignored by Prettier to avoid wasted processing.

### Difficulties & Solutions

**Problem:** After running Prettier, Vitest started picking up test files from `.stryker-tmp/sandbox-*/node_modules/`.

**Cause:** Stryker creates temporary sandbox directories that can persist after mutation testing runs.

**Fix:** Added `.stryker-tmp` to the `exclude` array in `vitest.config.js`.

**Learning:** When adding new ignore patterns, check if test runners also need to be updated.

### Files Changed

- **New:** `.prettierrc`, `.prettierignore`
- **Modified:** `eslint.config.js`, `package.json`, `vitest.config.js`
- **Formatted:** 124 source files in `src/`

### Commits

1. Config files: `.prettierrc`, `.prettierignore`, `eslint.config.js`, `package.json`
2. Formatted files: 124 files in `src/`
3. Vitest fix: Added `.stryker-tmp` to exclude

---

## Phase 7.2: Husky + lint-staged (2026-01-22) ✅

### What was implemented

- Installed `husky` and `lint-staged`
- Initialized Husky with `npx husky init`
- Configured `.husky/pre-commit` to run `npx lint-staged`
- Added `lint-staged` configuration to `package.json`

### Key Learnings

1. **npx in hooks** - Using `npx lint-staged` ensures the command runs from the project's local `node_modules`, not a global installation. This guarantees everyone uses the same version.

2. **lint-staged runs only on staged files** - This keeps pre-commit hooks fast. Since we have a clean baseline from Prettier, we only validate changes.

3. **ESLint before Prettier** - The order matters:
   - ESLint `--fix` might add/remove code (unused imports, etc.)
   - Prettier then formats the result
   - Reversed order would mess up formatting

4. **Empty commit prevention** - lint-staged prevents empty commits if auto-fixes result in no actual changes. This is expected behavior.

### Configuration

`.husky/pre-commit`:
```bash
npx lint-staged
```

`package.json`:
```json
"lint-staged": {
  "src/**/*.js": [
    "eslint --fix",
    "prettier --write"
  ]
}
```

### Files Changed

- **New:** `.husky/pre-commit`
- **Modified:** `package.json`, `package-lock.json`

---

## Next Steps

- Phase 7.3: commitlint (commit message linting)
