# Phase 4: ESLint Cleanup - Learning Notes

## Session: 2026-01-21

### Completed

**Waves 2-4 of ESLint cleanup:**

- **Wave 2**: Fixed 10 nested ternary errors by extracting helper functions
- **Wave 3**: Fixed 6 regex issues (control chars + ReDoS vulnerabilities)
- **Wave 4**: Fixed 6 logic/style issues (async executor, dead store, etc.)

**Final result**: 59 errors → 0 errors

### Difficulties & Solutions

**Problem**: Unicode escapes `\u0000-\u001F` still flagged by ESLint
- **Cause**: ESLint evaluates regex at parse time, sees actual control characters regardless of notation
- **Fix**: Used `eslint-disable-next-line` with comment explaining intentional use
- **Learning**: Some lint rules can't be satisfied by syntax changes alone; disabling with justification is acceptable

**Problem**: Slow regex patterns vulnerable to ReDoS
- **Cause**: `[\s\S]*` patterns can cause exponential backtracking
- **Fix**: Replaced with `indexOf`/`lastIndexOf` string operations
- **Learning**: For simple delimiter matching, string methods are safer and often clearer than regex

**Problem**: Async promise executor anti-pattern
- **Cause**: `new Promise(async (resolve) => {...})` swallows errors
- **Fix**: Made outer function async, moved await before Promise constructor
- **Learning**: Async work should happen before/outside Promise constructor, not inside

### Patterns Discovered

1. **Helper function extraction** - Effective for nested ternaries, improves readability
2. **indexOf/lastIndexOf** - Preferred over greedy regex for simple delimiter matching
3. **Object.hasOwn()** - Modern replacement for `obj.hasOwnProperty(key)`

### Gotchas for Future Reference

- ESLint SonarJS counts ternaries inside template literals as "nested" if the template itself is in a ternary
- Complexity warnings (+5) are expected when extracting helper functions (more functions = more to count)
- `no-control-regex` rule flags intentional control character handling - disable with justification

### What's Next

Epic 10 has no active tasks. Options:
- Pick up backlog items (feature flag lifecycle process, ESLint complexity warnings)
- Continue with Epic 7 (Monetization - Phase 60 AdSense)
- Start new hygiene tasks as they arise
