# Phase 4.3 Learning Notes: Unit Testing (Vitest)

## Overview
This document captures all the concepts, questions, and explanations from Phase 4.3 - setting up unit testing with Vitest for automated testing of your PWA code.

---


## Phase 4.3: Unit Testing Setup

### What is Unit Testing?

**Definition:**
Unit testing is the practice of writing automated tests that verify individual functions or "units" of code work correctly in isolation.

**Real-World Analogy:**
Building a car:
- **Manual testing**: Start entire car, drive it, see if everything works together
- **Unit testing**: Test each component separately (brakes, engine, lights) before assembly

**Unit** = smallest testable part of code (usually a function)

---

### Why Write Tests?

#### The Manual Testing Problem

**Without automated tests:**
```
1. Write function
2. Open browser
3. Manually test (type, click, check)
4. Change code
5. Repeat steps 2-3... forever
```

**Problems:**
- Slow (minutes per test cycle)
- Tedious (same steps repeatedly)
- Error-prone (forget to test something)
- Doesn't scale (100 functions = hours of testing)
- No safety net when refactoring

---

#### The Automated Testing Solution

**With automated tests:**
```javascript
test('function works correctly', () => {
  // Test runs in milliseconds
  // Re-runs automatically on code changes
  // Never forgets to check something
});
```

**Run:** `npm test`
**Result:** All tests execute in seconds ✅

---

### Benefits of Automated Testing

**1. Catch Bugs Early**
- Find issues before users do
- Fail fast during development
- Cheaper to fix early

**2. Confidence When Refactoring**
```javascript
// Refactor code
// Run tests
// All pass? Safe to deploy! ✅
// Any fail? Fix before deploying! ❌
```

**3. Living Documentation**
```javascript
test('shows placeholder when input is empty', () => {
  // This test documents expected behavior
  // Shows how the function should work
  // Better than comments (tests can't lie - they pass or fail)
});
```

**4. Faster Development**
- No manual testing every change
- Instant feedback
- Focus on writing code, not testing

**5. Professional Skill**
- Expected in all serious projects
- Required for team collaboration
- Part of CI/CD pipelines

---

### Testing Frameworks: Vitest vs Jest

#### Popular JavaScript Testing Frameworks

**1. Jest**
- Most popular (by Facebook/Meta)
- Huge ecosystem and community
- Works with any project type
- Mature and battle-tested

**2. Vitest**
- Built specifically for Vite (2021)
- Jest-compatible API (~95% same)
- Much faster
- Native Vite integration
- Test HMR (instant re-runs)

**3. Others**
- Mocha + Chai (older, modular)
- AVA (minimal, concurrent)
- Jasmine (behavior-driven)

---

#### Why Vitest for Vite Projects?

**1. Native Integration**
- Uses existing `vite.config.js`
- No duplicate configuration
- Same transforms as your app

**2. Speed**
- Reuses Vite's fast transformations
- Watch mode is instant (like HMR)
- On-demand processing

**3. Jest-Compatible API**

**Jest:**
```javascript
import { describe, it, expect } from '@jest/globals';

describe('my function', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });
});
```

**Vitest:**
```javascript
import { describe, it, expect } from 'vitest';

describe('my function', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });
});
```

**Almost identical!** Just import from `vitest` instead.

**4. Test HMR**
- Change a test file
- Only affected tests re-run
- Instant feedback (no full re-run)

---

#### Comparison Table

| Feature | Jest | Vitest |
|---------|------|--------|
| **Maturity** | Very mature | Newer (2021+) |
| **Speed** | Good | Very fast |
| **Vite Integration** | Requires setup | Native |
| **Configuration** | Separate config | Uses vite.config.js |
| **Watch Mode** | Full re-runs | HMR-like |
| **API** | Jest API | Jest-compatible |
| **Ecosystem** | Huge | Growing |
| **Learning Curve** | Well-documented | Easy if you know Jest |

**Decision:** Chose Vitest for native Vite integration and speed

---

### Test Structure and Syntax

#### Core Functions

**From Vitest:**
```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
```

**`describe(name, callback)`**
- Groups related tests together
- Organizes test suites
- Can be nested

```javascript
describe('Calculator', () => {
  describe('addition', () => {
    // Tests for addition
  });

  describe('subtraction', () => {
    // Tests for subtraction
  });
});
```

**`it(name, callback)` or `test(name, callback)`**
- Defines a single test case
- `it` and `test` are aliases (same thing)
- Contains test logic

```javascript
it('adds two numbers correctly', () => {
  // Test code here
});

test('adds two numbers correctly', () => {
  // Identical to above
});
```

**`expect(value)`**
- Creates an assertion
- Checks if something is true
- Fails test if assertion fails

```javascript
expect(2 + 2).toBe(4);              // Passes ✅
expect('hello').toBe('world');      // Fails ❌
```

**`beforeEach(callback)`**
- Runs before each test in the describe block
- Sets up test environment
- Ensures clean state

```javascript
beforeEach(() => {
  // Create fresh DOM for each test
  document.body.innerHTML = `<div id="test"></div>`;
});
```

**`afterEach(callback)`**
- Runs after each test
- Cleans up resources
- Resets state

---

#### Common Matchers (Assertions)

**Equality:**
```javascript
expect(value).toBe(expected)           // Strict equality (===)
expect(value).toEqual(expected)        // Deep equality (for objects/arrays)
expect(value).not.toBe(unexpected)     // Negation
```

**Truthiness:**
```javascript
expect(value).toBeTruthy()             // Truthy (not false, 0, '', null, undefined)
expect(value).toBeFalsy()              // Falsy
expect(value).toBeNull()               // Exactly null
expect(value).toBeUndefined()          // Exactly undefined
expect(value).toBeDefined()            // Not undefined
```

**Numbers:**
```javascript
expect(value).toBeGreaterThan(3)
expect(value).toBeLessThan(10)
expect(value).toBeCloseTo(0.3)         // Float comparison (avoids rounding issues)
```

**Strings:**
```javascript
expect(string).toContain('substring')
expect(string).toMatch(/regex/)
```

**Arrays:**
```javascript
expect(array).toContain(item)
expect(array).toHaveLength(3)
```

**Functions:**
```javascript
expect(fn).toThrow()                   // Function throws error
expect(fn).toHaveBeenCalled()          // Mock function was called
```

---

### The AAA Pattern

**AAA = Arrange, Act, Assert**

Industry-standard structure for writing clear tests.

**Structure:**
```javascript
it('test description', () => {
  // Arrange: Set up test data and environment
  const input = 'test data';
  const expected = 'expected result';

  // Act: Perform the action being tested
  const result = functionUnderTest(input);

  // Assert: Verify the result
  expect(result).toBe(expected);
});
```

---

#### Our PWA Example

**Testing `updateOutput` function:**

```javascript
it('should display input text in output div', () => {
  // Arrange: Set up test environment
  const input = document.getElementById('textInput');
  const output = document.getElementById('textOutput');

  // Act: Simulate user typing
  input.value = 'Hello World';
  updateOutput();

  // Assert: Check result
  expect(output.textContent).toBe('Hello World');
});
```

**Why AAA?**
- ✅ Clear structure
- ✅ Easy to read
- ✅ Separates concerns
- ✅ Industry standard
- ✅ Self-documenting

---

### Test Environments: jsdom

#### The Browser Environment Problem

**Your code uses browser APIs:**
```javascript
document.getElementById('textInput')
document.body.innerHTML
navigator.onLine
window.addEventListener
```

**Tests run in Node.js:**
- No browser
- No `document` object
- No `window` object
- No DOM

**Result:** Your code crashes in tests! ❌

---

#### Solution: jsdom

**What is jsdom?**
A JavaScript implementation of web standards that runs in Node.js.

**What it provides:**
- `document` object
- `window` object
- DOM manipulation methods
- HTML parsing
- Events
- Navigator APIs

**What it simulates:**
- Browser environment in Node.js
- Just enough to test DOM manipulation
- Not a real browser (no rendering, no layout)

---

#### Using jsdom with Vitest

**vitest.config.js:**
```javascript
export default defineConfig({
  test: {
    environment: 'jsdom'  // ← Enables browser simulation
  }
});
```

**Now in tests:**
```javascript
// This works! jsdom provides document
document.body.innerHTML = '<div id="test"></div>';
const div = document.getElementById('test');
expect(div).toBeDefined();
```

---

#### Creating Fake DOM in Tests

**Problem:**
jsdom starts with empty document.

**Solution:**
Create the DOM structure your code expects.

**In beforeEach:**
```javascript
beforeEach(() => {
  document.body.innerHTML = `
    <input type="text" id="textInput" value="">
    <div id="textOutput"></div>
  `;
});
```

**Why beforeEach?**
- Runs before each test
- Each test gets fresh, clean DOM
- Tests don't affect each other
- Prevents test pollution

**Example of test pollution:**
```javascript
// Without beforeEach
test('first test', () => {
  document.getElementById('input').value = 'hello';
  // Test passes
});

test('second test', () => {
  // Expects empty input
  // But still has 'hello' from first test! ❌
});
```

---

### Making Code Testable

#### The Import Problem

**Initial problem:**
```javascript
// app.js
const textInput = document.getElementById('textInput');

function updateOutput() {
  textInput.value = ...;
}

// When file is imported, getElementById runs
// But elements don't exist in tests!
// Result: textInput is null ❌
```

---

#### Solution 1: Export Functions

**Before:**
```javascript
function updateOutput() {
  // ...
}
```

**After:**
```javascript
export function updateOutput() {
  // ...
}
```

**Why?**
- Makes function available to tests
- Tests can import: `import { updateOutput } from './app.js'`
- Required for testing

---

#### Solution 2: Functions Get Their Own Elements

**Before (global variables):**
```javascript
const textInput = document.getElementById('textInput');  // Runs on import!
const textOutput = document.getElementById('textOutput'); // Null in tests!

export function updateOutput() {
  textInput.value = ...;  // Crashes because textInput is null
}
```

**After (self-contained):**
```javascript
export function updateOutput() {
  // Get elements inside function
  const textInput = document.getElementById('textInput');
  const textOutput = document.getElementById('textOutput');

  // Safety check
  if (!textInput || !textOutput) return;

  // Use elements
  textInput.value = ...;
}
```

**Benefits:**
- ✅ Works in tests (elements created in beforeEach)
- ✅ Works in browser (elements exist)
- ✅ Self-contained (no global state)
- ✅ Safer (checks before using)

---

#### Solution 3: Separate Initialization from Logic

**Pattern:**
```javascript
// Pure functions (testable)
export function updateOutput() { ... }
export function updateOnlineStatus() { ... }

// Initialization (runs only in browser)
if (typeof document !== 'undefined' && document.getElementById('textInput')) {
  // Event listeners
  textInput.addEventListener('input', updateOutput);

  // Service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }

  // Install button
  installBtn.addEventListener('click', ...);
}
```

**Why this check?**
```javascript
typeof document !== 'undefined'  // Are we in a browser?
document.getElementById('textInput')  // Do elements exist?
```

**Result:**
- In browser: Initialization runs ✅
- In tests: Initialization skipped ✅
- Functions still exported and testable ✅

---

### Common Testing Pitfalls (That We Encountered!)

#### Pitfall 1: Element Not Found

**Error:**
```
TypeError: Cannot read properties of null (reading 'addEventListener')
```

**Cause:**
```javascript
const textInput = document.getElementById('textInput');
textInput.addEventListener(...);  // textInput is null!
```

**Solution:**
Wrap initialization in conditional check.

---

#### Pitfall 2: Forgetting to Export

**Error:**
```
TypeError: updateOutput is not a function
```

**Cause:**
```javascript
function updateOutput() { ... }  // No export!
```

**Solution:**
```javascript
export function updateOutput() { ... }
```

---

#### Pitfall 3: Wrong Element IDs

**Error:**
```
AssertionError: expected undefined to be 'Hello World'
```

**Cause:**
```javascript
// Test uses 'textInput'
document.body.innerHTML = `<input id="textInput">`;

// But app.js looks for 'text-input'
const input = document.getElementById('text-input');  // null!
```

**Solution:**
Match IDs exactly between test and app.

---

#### Pitfall 4: Tests Affecting Each Other

**Problem:**
```javascript
test('sets input to "hello"', () => {
  input.value = 'hello';
  // Test passes
});

test('expects empty input', () => {
  expect(input.value).toBe('');  // Fails! Still has 'hello'
});
```

**Solution:**
Use `beforeEach` to reset state.

---

### Test Coverage

#### What is Code Coverage?

**Definition:**
Measurement of how much of your code is executed during tests.

**Metrics:**

**Statements (%)**
- Percentage of code statements executed
- Most basic metric

**Branches (%)**
- Percentage of if/else paths tested
- Example: Testing both true and false cases

**Functions (%)**
- Percentage of functions called
- Shows untested functions

**Lines (%)**
- Percentage of code lines executed
- Similar to statements

---

#### Our PWA Coverage Example

**Results:**
```
File    | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
app.js  |   20.51 |     37.5 |   14.28 |   21.05 | 18-61, 67-73
```

**What this means:**

**20.51% Statements**
- Only 1 out of ~5 statements tested
- 79% of code never ran in tests

**37.5% Branches**
- Tested 3 out of 8 if/else paths
- We tested empty and non-empty input (2 branches) ✅
- Didn't test online/offline branches ❌

**14.28% Functions**
- Tested 1 out of 7 functions
- Only tested `updateOutput`
- Didn't test `updateOnlineStatus`, service worker, install handler

**Uncovered Lines: 18-61, 67-73**
- These lines never executed in tests
- Probably event listeners, service worker, initialization

---

#### Why Low Coverage?

**Our case:**
- Only wrote tests for one function
- Service worker code hard to test
- Event listener setup not tested
- Install prompt code not tested

**This is normal for learning projects!**

---

#### Is 100% Coverage Necessary?

**No!** Here's the reality:

**Worth Testing (Aim for 100%):**
- ✅ Business logic functions
- ✅ Data transformations
- ✅ Calculations
- ✅ Utility functions
- ✅ Validation logic

**Hard/Not Worth Testing:**
- Event listener setup (integration test territory)
- Service worker registration (requires special setup)
- Browser API calls (mock-heavy, limited value)
- Simple initialization code
- Third-party library code

**Professional Standards:**
- **70-80%** coverage considered good
- **80-90%** coverage considered excellent
- **100%** coverage rarely worth the effort

**Quality > Quantity:**
- Better to have good tests for critical code
- Than shallow tests just to boost percentage
- Focus on testing what matters

---

#### Viewing Coverage Reports

**HTML Report:**
```
coverage/index.html
```

**Features:**
- Visual code view
- Green = tested lines
- Red = untested lines
- Interactive navigation
- Click files to see details

**Terminal Report:**
```
npm run test:coverage
```

**Shows:**
- Summary table
- Per-file breakdown
- Uncovered line numbers
- Quick overview

---

### Test Organization

#### File Naming Conventions

**Test files should be named:**
- `<filename>.test.js`
- `<filename>.spec.js`

**Examples:**
- `app.js` → `app.test.js` ✅
- `utils.js` → `utils.test.js` ✅
- `math.js` → `math.spec.js` ✅

**Why?**
- Vitest auto-discovers `*.test.js` and `*.spec.js` files
- Clear what's a test vs source code
- Easy to find tests for a file

---

#### Test File Location

**Option 1: Next to source files**
```
src/
  app.js
  app.test.js
  utils.js
  utils.test.js
```

**Pros:**
- Tests next to code
- Easy to find
- Keeps related files together

---

**Option 2: Separate test directory**
```
src/
  app.js
  utils.js
tests/
  app.test.js
  utils.test.js
```

**Pros:**
- Cleaner src folder
- All tests in one place
- Mirrors src structure

**We used Option 1** (test next to source) for simplicity.

---

### Writing Good Tests

#### Test Naming

**Bad:**
```javascript
it('works', () => { ... });
it('test 1', () => { ... });
it('function', () => { ... });
```

**Good:**
```javascript
it('should display input text in output div', () => { ... });
it('should show placeholder when input is empty', () => { ... });
it('should update status to online when connection restored', () => { ... });
```

**Guidelines:**
- Start with "should"
- Describe expected behavior
- Be specific
- Anyone should understand what's being tested

---

#### One Assertion Per Test (Usually)

**Prefer:**
```javascript
it('displays input text', () => {
  input.value = 'hello';
  updateOutput();
  expect(output.textContent).toBe('hello');
});

it('shows placeholder when empty', () => {
  input.value = '';
  updateOutput();
  expect(output.textContent).toBe('Type something...');
});
```

**Over:**
```javascript
it('tests everything', () => {
  input.value = 'hello';
  updateOutput();
  expect(output.textContent).toBe('hello');

  input.value = '';
  updateOutput();
  expect(output.textContent).toBe('Type something...');

  // ... many more assertions
});
```

**Why?**
- Failures are clearer (know exactly what broke)
- Tests run independently
- Easier to maintain
- Better test names

---

#### Keep Tests Simple

**Tests should be:**
- Easy to read
- Obvious what they're testing
- Simple logic
- No complex setup

**If a test is complex:**
- Maybe function is doing too much
- Consider breaking function into smaller pieces
- Extract helper functions

---

### Key Takeaways

**Conceptual Understanding:**

1. **Automated Tests Save Time**
   - Write once, run forever
   - Faster than manual testing
   - Never forget to test something

2. **Tests Are Documentation**
   - Show how code should work
   - Examples of expected behavior
   - Can't lie (pass or fail)

3. **Tests Enable Refactoring**
   - Change code with confidence
   - Tests catch regressions
   - Safety net for improvements

4. **Not Everything Needs Tests**
   - Focus on business logic
   - Some code is hard to test
   - Quality over quantity

5. **Test Structure Matters**
   - AAA pattern (Arrange, Act, Assert)
   - One test, one concept
   - Clear naming

**Technical Skills Gained:**

1. **Vitest Testing Framework**
   - Installing and configuring
   - Writing tests with describe/it/expect
   - Running tests in watch mode
   - Generating coverage reports

2. **Test Environments**
   - Understanding jsdom
   - Simulating browser in Node.js
   - Creating fake DOM for tests

3. **Making Code Testable**
   - Exporting functions
   - Self-contained functions
   - Separating initialization from logic
   - Avoiding global state

4. **Test Organization**
   - File naming conventions
   - Test structure
   - beforeEach for setup
   - AAA pattern

5. **Debugging Tests**
   - Reading error messages
   - Identifying missing exports
   - Fixing element references
   - Understanding test failures

**Files Created:**

**Test Configuration:**
- `vitest.config.js` - Vitest configuration with jsdom
- Updated `package.json` - Added test scripts

**Test Files:**
- `app.test.js` - Tests for updateOutput function

**Coverage Reports:**
- `coverage/` - Generated coverage reports (gitignored)
  - `index.html` - Interactive HTML report
  - Various coverage data files

**Updated:**
- `app.js` - Exported functions, made testable
- `.gitignore` - Added coverage/ folder

---

### Commands Learned

**Running Tests:**
```bash
npm test                    # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
```

**Test Script Syntax:**
```json
"scripts": {
  "test": "vitest",                  # Watch mode (default)
  "test:coverage": "vitest --coverage"  # With coverage
}
```

**Installing Testing Dependencies:**
```bash
npm install --save-dev vitest jsdom
```

---

### What's Next

**Completed in Phase 4:**
- ✅ Phase 4.1a: Local HTTPS with mkcert + http-server
- ✅ Phase 4.1b: Docker + nginx containerization
- ✅ Phase 4.2: Build Process Setup (Vite)
- ✅ Phase 4.3: Unit Testing Setup (Vitest)

**Still Available in Phase 4:**
- Phase 4.4: End-to-End Testing (Playwright/Cypress)
- Phase 4.5: CI/CD Pipeline (GitHub Actions) - Optional
- Phase 4.6: Advanced Containerization (Multi-stage builds) - Optional

---

**Progress Update:** Phase 4.3 is complete! ✅

We successfully:
- Installed Vitest and jsdom for browser simulation
- Configured Vitest with test environment
- Refactored app.js to export testable functions
- Made functions self-contained (get their own elements)
- Created test file with proper structure
- Wrote tests using AAA pattern (Arrange, Act, Assert)
- Ran tests in watch mode
- Generated and understood coverage reports
- Learned about testable code patterns

You now know how to write automated tests for JavaScript functions!

---

## Session Notes - 2025-10-24

### Session Summary

**Work Completed:**
- Updated CLAUDE.md with workflow automation instructions
  - Added "Working with the Learning Plan" section
  - Configured behavior for "what's next" queries
  - Configured behavior for "that's a wrap" / pause requests
  - These instructions will persist across sessions

**Current Status:**
- Completed through Phase 4.3 (Unit Testing Setup)
- Project has professional development setup with:
  - Local HTTPS development (mkcert + http-server)
  - Containerized deployment (Docker + nginx)
  - Build process (Vite)
  - Automated testing (Vitest + jsdom)

**What's Next When You Resume:**
According to LEARNING_PLAN.md, the next available steps in Phase 4 are:

1. **Phase 4.4: End-to-End Testing (Playwright/Cypress)**
   - Browser automation for full user flow testing
   - Testing PWA-specific features (install, offline)
   - Visual regression testing
   - Most practical next step for comprehensive testing

2. **Phase 4.5: CI/CD Pipeline (GitHub Actions) - Optional**
   - Automated testing on every commit
   - Automated deployment
   - Professional workflow automation

3. **Phase 4.6: Advanced Containerization - Optional**
   - Multi-stage Docker builds
   - Dev containers in VS Code
   - Production optimization

**Recommendation:**
Phase 4.4 (E2E Testing) would be the natural next step to round out your testing knowledge before moving to optional advanced topics.

---

continues on PHASE4_LEARNING_NOTES_2.md
---

## What's Next in Phase 4

**Completed:**
- ✅ Phase 4.1: Local HTTPS (mkcert + Docker/nginx)
- ✅ Phase 4.2: Build Process Setup (Vite)
- ✅ Phase 4.3: Unit Testing Setup (Vitest)

**Still Available:**
- Phase 4.4: End-to-End Testing (Playwright/Cypress)
- Phase 4.5: CI/CD Pipeline (GitHub Actions) - Optional
- Phase 4.6: Advanced Containerization (Multi-stage builds) - Optional
