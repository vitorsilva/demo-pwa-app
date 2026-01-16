# Unit Testing Guide

## Overview

Saberloop uses **Vitest** for unit testing with **jsdom** for browser simulation.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Source    │────▶│   Vitest    │────▶│   Results   │
│    Code     │     │   + jsdom   │     │  (Terminal) │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Quick Start

```bash
# Run tests in watch mode (development)
npm test

# Run tests once and exit (CI)
npm test -- --run

# Run tests with coverage report
npm run test:coverage
```

## Running Specific Tests

```bash
# Run a single test file
npm test src/services/quiz-service.test.js

# Run tests matching a pattern
npm test -- --grep "quiz"

# Run tests in a specific directory
npm test src/services/

# Run a single test by name
npm test -- --grep "should save quiz to IndexedDB"
```

## Test File Location

Tests are located next to source files:

```
src/
├── services/
│   ├── quiz-service.js
│   └── quiz-service.test.js    # Tests for quiz-service
├── core/
│   ├── router.js
│   └── router.test.js          # Tests for router
└── utils/
    ├── logger.js
    └── logger.test.js          # Tests for logger
```

## Writing Tests

### Basic Structure

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { myFunction } from './my-module.js';

describe('myFunction', () => {
  beforeEach(() => {
    // Reset state before each test
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test data';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Testing DOM Code

Vitest uses jsdom to simulate browser environment:

```javascript
beforeEach(() => {
  document.body.innerHTML = `
    <input type="text" id="textInput" value="">
    <div id="textOutput"></div>
  `;
});

it('should update output when input changes', () => {
  const input = document.getElementById('textInput');
  const output = document.getElementById('textOutput');

  input.value = 'Hello';
  updateOutput();

  expect(output.textContent).toBe('Hello');
});
```

## Common Matchers

```javascript
// Equality
expect(value).toBe(expected);           // Strict equality
expect(value).toEqual(expected);        // Deep equality
expect(value).not.toBe(unexpected);     // Negation

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(10);

// Strings
expect(string).toContain('substring');
expect(string).toMatch(/regex/);

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Functions
expect(fn).toThrow();
expect(mockFn).toHaveBeenCalled();
```

## Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
# Open coverage/index.html in browser
```

Coverage report shows:
- **Statements %** - Lines of code executed
- **Branches %** - If/else paths tested
- **Functions %** - Functions called
- **Uncovered Lines** - What needs more tests

## Configuration

Tests are configured in `vitest.config.js`:

```javascript
export default defineConfig({
  test: {
    environment: 'jsdom',    // Browser simulation
    globals: true,           // describe, it, expect without imports
    coverage: {
      reporter: ['text', 'html']
    }
  }
});
```

## Troubleshooting

### Element Not Found

```
TypeError: Cannot read properties of null (reading 'addEventListener')
```

**Cause:** Code tries to use an element that doesn't exist (returns null)

**Fix:** Ensure DOM is set up in `beforeEach` before tests run:
```javascript
beforeEach(() => {
  document.body.innerHTML = `<input id="textInput">`;
});
```

---

### Function Not Exported

```
TypeError: updateOutput is not a function
```

**Cause:** Function exists but wasn't exported from the module

**Fix:** Add `export` keyword to the function:
```javascript
export function updateOutput() { ... }
```

---

### Wrong Element IDs

```
AssertionError: expected undefined to be 'Hello World'
```

**Cause:** Selector in test doesn't match HTML (e.g., `#text-input` vs `#textInput`)

**Fix:** Ensure IDs match exactly between test and source code

---

### Tests Affecting Each Other

**Problem:** Test passes alone but fails when run with others

**Cause:** Previous test modified state that wasn't reset

**Fix:** Use `beforeEach` to reset DOM/state before each test:
```javascript
beforeEach(() => {
  document.body.innerHTML = `<div id="app"></div>`;
  // Reset any global state
});
```

## Best Practices

1. **One concept per test** - Each test verifies one behavior
2. **Use AAA pattern** - Arrange, Act, Assert
3. **Descriptive names** - `should display error when API fails`
4. **Clean state** - Use `beforeEach` to reset between tests
5. **Test behavior, not implementation** - Focus on what, not how

## Related Documentation

- [E2E Testing](./E2E_TESTING.md) - Playwright browser tests
- [Maestro Testing](./MAESTRO_TESTING.md) - Mobile app tests
- [Phase 4.3 Learning Notes](../learning/epic01_infrastructure/PHASE4.3_UNIT_TESTING.md) - Detailed concepts
