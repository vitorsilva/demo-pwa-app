# Phase 5: ESLint Warnings Cleanup

**Status:** Planned
**Priority:** Low
**Created:** 2026-01-21

---

## Overview

Phase 4 resolved all 59 ESLint **errors**. This phase addresses the **warnings** which are complexity metrics. Unlike errors, warnings are informational - they don't indicate bugs but suggest areas where code could be simpler or more maintainable.

**Philosophy:** Focus on high-value refactoring. Most warnings are for render functions (HTML templates) where splitting would hurt readability. We'll adjust thresholds to realistic values and fix only what provides real benefit.

---

## Warning Analysis

**Starting point:** 91 warnings

| Rule | Count | Current Threshold |
|------|-------|-------------------|
| `max-lines-per-function` | 54 | > 50 lines |
| `complexity` | 18 | > 10 |
| `max-params` | 10 | > 4 params |
| `sonarjs/pseudo-random` | 5 | any Math.random |
| `sonarjs/cognitive-complexity` | 4 | > 15 |

### Key Insight: Most Warnings Are HTML Templates

Analysis of the 54 `max-lines-per-function` warnings:

| Line Range | Count | Nature |
|------------|-------|--------|
| 51-75 | 28 | Borderline, mostly templates |
| 76-100 | 16 | Templates, some logic |
| >100 | 9 | **8 HTML templates, 1 actual logic** |

The 9 functions over 100 lines:
- `SettingsView.js` render (241) - HTML template
- `ExplanationModal.js` modal (237) - HTML template
- `ResultsView.js` render (184) - HTML template
- `ShareModal.js` showShareModal (172) - HTML template
- `PartyQuizView.js` render (141) - HTML template
- `PartyResultsView.js` render (123) - HTML template
- **`api.real.js` generateQuestions (121) - Actual logic** ⚡
- `HomeView.js` render (100) - HTML template

**Splitting HTML templates hurts readability.** These are fine as-is.

### Actual Logic Worth Refactoring

Only 2 functions have genuine complexity worth addressing:

| File | Function | Lines | Complexity | Why Refactor |
|------|----------|-------|------------|--------------|
| `api/api.real.js` | `generateQuestions` | 121 | 19 | Core API logic, high complexity |
| `utils/json-extractor.js` | `extractJSON` | 58 | 16 | Parsing logic, multiple branches |

---

## Proposed Approach

### Wave 0: Config Cleanup (removes ~75 warnings)

**Part A: Disable noisy SonarJS rules**

```javascript
// Add to eslint.config.js rules section:
'sonarjs/pseudo-random': 'off',        // Math.random is fine for non-crypto uses
'sonarjs/cognitive-complexity': 'off', // Standard complexity rule is sufficient
```

**Part B: Adjust thresholds to realistic values**

```javascript
// Update existing thresholds:
'complexity': ['warn', 15],                    // was 10
'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],  // was 50
```

**Rationale:**
- `pseudo-random`: All Math.random uses are safe (shuffling, session IDs, delays)
- `cognitive-complexity`: Redundant with the standard `complexity` rule
- `complexity` 10→15: Industry standard is 10-20; 15 is reasonable
- `max-lines-per-function` 50→100: Most long functions are HTML templates; 100 catches only egregious cases

**Impact:**

| Rule | Before | After | Remaining |
|------|--------|-------|-----------|
| `sonarjs/pseudo-random` | 5 | disabled | 0 |
| `sonarjs/cognitive-complexity` | 4 | disabled | 0 |
| `max-lines-per-function` | 54 | threshold 100 | ~9 |
| `complexity` | 18 | threshold 15 | ~6 |
| `max-params` | 10 | unchanged | 10 |
| **Total** | **91** | | **~25** |

Of the ~25 remaining, most are HTML templates (acceptable). Only actual logic issues remain visible.

---

### Wave 1: Parameter Object Pattern (10 warnings)

**Target:** `max-params` warnings - functions with 5-6 parameters.

**Pattern:**
```javascript
// Before (6 params)
function generateExplanation(topic, question, options, correctAnswer, explanationText, isCorrect) { }

// After (options object)
function generateExplanation(topic, question, answerOptions, explanationOptions) {
  const { correctAnswer, explanationText, isCorrect } = explanationOptions;
}
```

**Files:**
| File | Function | Params | Notes |
|------|----------|--------|-------|
| `api/api.mock.js` | `generateExplanation` | 6 | |
| `api/api.mock.js` | `generateWrongAnswerExplanation` | 6 | |
| `api/api.real.js` | `generateExplanation` | 6 | |
| `api/api.real.js` | `generateWrongAnswerExplanation` | 6 | |
| `services/quiz-service.js` | `generateExplanation` | 6 | Calls api layer |
| `services/quiz-service.js` | `generateWrongAnswerExplanation` | 6 | Calls api layer |
| `services/party-api.js` | `submitAnswer` | 5 | |
| `utils/share-image.js` | `drawRoundedRect` | 6 | Canvas helper |
| `utils/share-image.js` | `drawScore` | 6 | Canvas helper |
| `views/OpenRouterGuideView.js` | `renderStepCard` | 6 | UI helper |

**Approach:** Group related params into options objects. Update all call sites.

**Risk:** Medium - requires updating callers. Thorough testing needed.

---

### Wave 2: Refactor Complex Logic (2 functions)

**Target:** The only 2 functions with genuine complexity worth refactoring.

#### 2.1: `api/api.real.js` - `generateQuestions`

| Metric | Current | Target |
|--------|---------|--------|
| Lines | 121 | < 100 |
| Complexity | 19 | < 15 |

**Current responsibilities:**
- Build prompt from topic/settings
- Call OpenRouter API
- Parse JSON response
- Validate quiz schema
- Handle retries and errors
- Track usage/costs

**Refactoring strategy:**
1. Extract prompt building to `buildQuizPrompt(topic, settings)`
2. Extract response parsing to `parseQuizResponse(response)`
3. Use early returns for error cases
4. Validation already extracted (`validateQuizSchema`)

#### 2.2: `utils/json-extractor.js` - `extractJSON`

| Metric | Current | Target |
|--------|---------|--------|
| Lines | 58 | OK |
| Complexity | 16 | < 15 |

**Current responsibilities:**
- Try direct JSON.parse
- Find JSON boundaries with bracket matching
- Handle nested structures
- Multiple fallback strategies

**Refactoring strategy:**
1. Extract bracket-matching to helper function
2. Use early returns for successful parses
3. Simplify nested conditionals

**Risk:** Medium - these are core functions. Need comprehensive tests before refactoring.

---

## Implementation Order

| Wave | Target | Warnings Fixed | Effort | Risk |
|------|--------|----------------|--------|------|
| 0 | Config cleanup (disable rules + adjust thresholds) | ~66 | Very Low | None |
| 1 | Parameter object pattern | 10 | Medium | Medium |
| 2 | Refactor complex logic | 2 | Medium | Medium |

**Expected final state:** ~15 warnings remaining (all HTML templates - acceptable)

---

## Implementation Approach

**This phase follows the teaching methodology:**

1. **Explain before implementing** - Each change will be explained with rationale before any code is written
2. **One change at a time** - Small, focused changes that can be reviewed individually
3. **Questions welcome** - User may ask questions about any suggestion before approving
4. **Commit only after approval** - No changes are committed until the user confirms understanding and agreement

This ensures learning value from each refactoring decision, not just the end result.

---

## Validation Checklist

### Wave 0 (Config)
- [ ] Update `eslint.config.js` with new rules/thresholds
- [ ] Run `npm run lint` - verify warning count drops to ~25
- [ ] Commit config changes

### Wave 1 (Parameters)
- [ ] Refactor each function to use options objects
- [ ] Update all call sites
- [ ] All unit tests pass (1192)
- [ ] E2E tests pass (169 passing, 3 pre-existing failures)
- [ ] Commit with clear message

### Wave 2 (Complex Logic)
- [ ] Refactor `generateQuestions` - extract helpers
- [ ] Refactor `extractJSON` - simplify conditionals
- [ ] All unit tests pass
- [ ] No behavior changes
- [ ] Commit with clear message

### Final
- [ ] Run `npm run lint` - verify expected warning count
- [ ] Document any remaining warnings as acceptable

---

## Useful Commands

```bash
# Run full lint
npm run lint

# Count warnings by rule
npm run lint 2>&1 | grep -oP '\S+$' | sort | uniq -c | sort -rn

# Filter by specific rule
npm run lint 2>&1 | grep "max-lines-per-function"

# Lint specific file
npx eslint src/views/SettingsView.js
```

---

## Related Documentation

- [Phase 4: ESLint Errors Cleanup](./PHASE4_ESLINT_CLEANUP.md) - Previous phase
- [ESLint Config](../../../eslint.config.js) - Current configuration
- [Epic 10 Standards](./EPIC10_HYGIENE_PLAN.md) - Hygiene development standards

---

**Last Updated:** 2026-01-21
