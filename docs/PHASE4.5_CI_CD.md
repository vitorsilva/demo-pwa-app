# Phase 4.5 Learning Notes: CI/CD Pipeline (GitHub Actions)

## Overview
This document captures all the concepts, questions, and explanations from Phase 4.5 - setting up automated CI/CD pipelines with GitHub Actions for continuous integration and deployment.

---

## Phase 4.5: CI/CD Pipeline with GitHub Actions

### What is CI/CD?

**Definition:**
CI/CD stands for Continuous Integration and Continuous Deployment (or Continuous Delivery). It's a practice of automating code testing and deployment so that every code change is automatically validated and deployed to production.

**Real-World Analogy:**
- **Without CI/CD**: Like manually checking every bolt on a car before driving
- **With CI/CD**: Like having an automated inspection system that runs every time

---

### The Problems CI/CD Solves

**Before CI/CD (Manual Process):**
```
1. Developer writes code
2. Developer manually runs tests locally
3. Developer commits code
4. Another developer pulls code
5. Code breaks on their machine! 😱
6. Hours wasted debugging "works on my machine" issues
7. Manual deployment process
8. Human errors during deployment
```

**With CI/CD (Automated Process):**
```
1. Developer writes code
2. Developer commits and pushes
3. CI/CD automatically:
   ✓ Runs all tests
   ✓ Builds production version
   ✓ Deploys if tests pass
   ✓ Notifies if anything fails
4. All automatic, no human errors
5. Confidence that deployed code works
```

---

### Continuous Integration (CI)

**What it is:**
Automatically testing every code change as soon as it's pushed to the repository.

**What CI does:**
1. **Triggered**: Every push or pull request
2. **Fresh environment**: Spins up clean server
3. **Install**: Installs exact dependencies from package-lock.json
4. **Test**: Runs unit tests, E2E tests, builds
5. **Report**: Shows ✅ pass or ❌ fail

**Why valuable:**

**Scenario 1: Environment Differences**
- ✅ Your local: Windows, Node 18, cached packages
- ✅ CI server: Linux, Node 20, fresh install
- ✅ Catches: Platform-specific bugs, dependency issues

**Scenario 2: Incomplete Commits**
- ✅ You: Have uncommitted local files
- ✅ Tests pass locally (using uncommitted code)
- ❌ CI fails (missing files in repo)
- ✅ Catches: Forgotten commits immediately

**Scenario 3: Broke Someone Else's Code**
- ✅ You: Only tested your new feature
- ❌ Forgot: To run all tests
- ✅ CI: Runs ALL tests
- ✅ Catches: Breaking changes before merge

---

### Continuous Deployment (CD)

**What it is:**
Automatically deploying code to production when tests pass.

**What CD does:**
1. **Triggered**: Tests pass on main branch
2. **Build**: Creates optimized production build
3. **Deploy**: Automatically uploads to hosting
4. **Live**: Site updates within minutes

**Benefits:**
- ⚡ Fast: From commit to live in minutes
- 🎯 Consistent: Same process every time
- 🛡️ Safe: Only deploys if tests pass
- 📦 Optimized: Production builds are minified

---

### What is GitHub Actions?

**Definition:**
GitHub Actions is GitHub's built-in CI/CD platform that runs automated workflows in response to repository events.

**How it works:**
```
You push code
    ↓
GitHub detects push event
    ↓
Reads .github/workflows/*.yml files
    ↓
Spins up virtual machines in cloud
    ↓
Executes workflow steps
    ↓
Reports success/failure
```

**Key components:**

**Workflows:**
- YAML files in `.github/workflows/`
- Define what to do when events happen
- Can have multiple workflows

**Events:**
- `push`: When code is pushed
- `pull_request`: When PR is opened
- `schedule`: Run on a schedule (cron)
- Many others

**Jobs:**
- Units of work within a workflow
- Run on virtual machines (Ubuntu, Windows, macOS)
- Can run in parallel or sequence

**Steps:**
- Individual commands within a job
- Can run shell commands or actions
- Execute sequentially

**Actions:**
- Reusable pieces of code
- Like importing a library
- Example: `actions/checkout@v4` (checks out your code)

---

### What is YAML?

**YAML** = YAML Ain't Markup Language (recursive acronym!)

**A human-readable data format for configuration files.**

**Compared to JSON:**

**JSON:**
```json
{
  "name": "demo-pwa-app",
  "version": "1.0.0",
  "scripts": {
    "test": "vitest"
  }
}
```

**YAML (same data):**
```yaml
name: demo-pwa-app
version: 1.0.0
scripts:
  test: vitest
```

**Key YAML Rules:**

1. **Indentation matters** (like Python)
   - Use **2 spaces** (not tabs!)
   - Indentation shows hierarchy

2. **Colons separate keys and values**
   ```yaml
   key: value
   ```

3. **Hyphens create lists**
   ```yaml
   items:
     - item1
     - item2
     - item3
   ```

4. **No commas or brackets needed**
   - More readable than JSON
   - Less punctuation

**Example:**
```yaml
name: Test
on:
  push:
    branches: ['main']
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
```

---

### GitHub Actions Architecture

**Before GitHub Actions (Your Setup):**
```
GitHub Repository (stores code)
    ↓
GitHub Pages (serves files from main branch)
    ↓
Users access site
```

**With GitHub Actions:**
```
GitHub Repository (stores code)
    ↓
GitHub Actions (builds and tests)
    ↓
GitHub Pages (serves built artifacts)
    ↓
Users access optimized site
```

**Two Separate Systems:**

**1. GitHub Repository (Git storage)**
- Stores source code
- Version control (commits, branches)
- You see: `index.html`, `app.js`, `styles.css`
- URL: github.com/vitorsilva/demo-pwa-app

**2. GitHub Pages (Web server)**
- Serves static files over HTTP/HTTPS
- Acts like nginx/Apache
- Users see: Your live site
- URL: vitorsilva.github.io/demo-pwa-app/

**3. GitHub Actions (CI/CD runner) - NEW!**
- Builds `dist/` folder
- Runs tests
- Uploads artifacts to Pages
- Not visible in repo tree

---

### Creating Workflow Files

#### Folder Structure

**GitHub Actions looks for:**
```
.github/workflows/
```

**Why this specific path?**
- `.github/` = Special folder for GitHub configuration
- `.github/workflows/` = Where workflow YAML files live
- GitHub automatically discovers and runs these files

**Dot-prefixed folders:**
- Configuration/tooling folders (not source code)
- Hidden by default on Mac/Linux
- Examples: `.git/`, `.github/`, `.gitignore`, `.dockerignore`

---

### Workflow 1: test.yml (Continuous Integration)

**Purpose**: Run tests on every push to ensure code quality.

**Complete file:**
```yaml
name: Test

on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test -- --run

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Build production bundle
        run: npm run build

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            test-results/
            playwright-report/
          retention-days: 7
```

---

#### Breaking Down test.yml

**Header:**
```yaml
name: Test
```
- Display name shown in GitHub's Actions tab

**Trigger:**
```yaml
on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']
```
- `on: push` - Runs when you push code
- `branches: ['**']` - On ANY branch (main, feature branches)
- `pull_request` - Also runs when someone opens a PR

**Q: Why run tests on EVERY branch, not just main?**

**A:** To catch bugs in feature branches BEFORE they merge to main. Much easier to fix!

**Job definition:**
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
```
- `jobs:` - A workflow can have multiple jobs
- `test:` - Name of this job
- `runs-on: ubuntu-latest` - Runs on Ubuntu Linux in GitHub's cloud

**Q: We're developing on Windows. Why run tests on Ubuntu Linux?**

**A:** Cross-platform testing! Most production servers run Linux. Catches Windows vs Linux issues.

---

**Step: Checkout code**
```yaml
- name: Checkout code
  uses: actions/checkout@v4
```
- `uses:` - Uses a pre-built action (like importing a library)
- `actions/checkout@v4` - Official GitHub action to download your repo
- `@v4` - Version 4 of the action
- Without this: Server would be empty, no code to test!

**Step: Setup Node.js**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```
- Installs Node.js version 20
- `with:` - Parameters for the action
- `cache: 'npm'` - Caches node_modules for faster future runs

**Q: Why specify Node.js version 20?**

**A:** Consistency! Everyone (local dev, CI, other developers) uses the same version. Avoids "works on my Node.js version" issues.

---

**Step: Install dependencies**
```yaml
- name: Install dependencies
  run: npm ci
```
- `run:` - Executes a shell command
- `npm ci` - "Clean Install"

**Q: What's the difference between `npm ci` and `npm install`?**

**A:**
- `npm install` - Installs packages, can update package-lock.json
- `npm ci` - Installs EXACTLY what's in package-lock.json, faster, designed for CI
- Use `npm ci` in CI/CD, `npm install` locally

**Step: Run unit tests**
```yaml
- name: Run unit tests
  run: npm test -- --run
```
- Runs Vitest tests
- `-- --run` - Pass `--run` flag to Vitest
- Tells Vitest to run once and exit (not watch mode)

---

**Step: Install Playwright browsers**
```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps
```
- Downloads Chromium, Firefox, WebKit to CI server
- `--with-deps` - Also installs system dependencies (fonts, libraries) needed on Linux

**Q: We already ran `npx playwright install` locally. Why again in CI?**

**A:** CI server starts fresh every time! No browsers pre-installed.

**Step: Run E2E tests**
```yaml
- name: Run E2E tests
  run: npm run test:e2e
```
- Runs Playwright tests
- `playwright.config.js` `webServer` section starts dev server automatically

**Step: Build production bundle**
```yaml
- name: Build production bundle
  run: npm run build
```
- Runs Vite build
- Ensures production build works
- Catches issues like missing dependencies, import errors

---

**Step: Upload test artifacts**
```yaml
- name: Upload test artifacts
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: |
      test-results/
      playwright-report/
    retention-days: 7
```
- `if: failure()` - Only runs if previous step failed
- Uploads Playwright screenshots, videos, reports
- Keeps them for 7 days
- Can download from GitHub to debug failures!

---

### Workflow 2: deploy.yml (Continuous Deployment)

**Purpose**: Deploy optimized production build to GitHub Pages when tests pass on main branch.

**Complete file:**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build production bundle
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

#### Key Differences from test.yml

**1. Trigger - Main branch only**
```yaml
on:
  push:
    branches: ['main']
```
- Only runs on `main` branch pushes
- Feature branches don't deploy

**Q: Why should deploy.yml only run on the main branch?**

**A:** Main branch = production code that should be live. Feature branches are works-in-progress. Could also have staging branches deploy to staging environments!

**2. Permissions**
```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```
- Gives workflow permission to deploy to GitHub Pages
- `contents: read` - Read your code
- `pages: write` - Write to GitHub Pages
- `id-token: write` - Security token for deployment

**Q: Why does deploy.yml need special permissions but test.yml doesn't?**

**A:** test.yml only reads code and runs tests. deploy.yml needs to WRITE to GitHub Pages - that requires special permissions for security.

---

**3. Environment**
```yaml
environment:
  name: github-pages
  url: ${{ steps.deployment.outputs.page_url }}
```
- Declares this is a deployment job
- Tracks deployment history in GitHub
- Shows URL of deployed site

**4. What Gets Deployed**
```yaml
- name: Upload artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: './dist'
```
- Uploads the `dist/` folder (Vite build output)
- NOT the source files!

**Q: Currently, GitHub Pages deploys your source files directly. What's the advantage of deploying the dist/ folder instead?**

**A: Benefits of deploying `dist/`:**
1. ✅ **Minified** - Smaller files, faster downloads
2. ✅ **Bundled** - Fewer HTTP requests
3. ✅ **Hashed filenames** - Cache busting (`main-abc123.js`)
4. ✅ **Optimized** - Vite applies production optimizations

Users get a faster app! 🚀

---

### Issues Encountered and Fixed

#### Issue 1: Permissions Error

**Error:**
```
Ensure GITHUB_TOKEN has permission "id-token: write"
```

**Cause:**
- GitHub Actions defaults to read-only permissions for security
- deploy.yml needs write permissions

**Fix:**
1. Go to: Settings → Actions → Workflow permissions
2. Change from "Read repository contents permission" to "Read and write permissions"
3. Save

**Why needed:** Explicitly allows workflows to deploy (write) to Pages.

---

#### Issue 2: CommonJS vs ES Modules

**Error:**
```
Playwright Test did not expect test() to be called here
```

**Cause:**
- `package.json` had `"type": "commonjs"`
- But config files used ES modules (`import`/`export`)
- Mismatch confused Playwright

**Fix:**
Changed `package.json`:
```json
"type": "module"
```

**Impact assessment:**
- ✅ Config files already using ES modules
- ✅ `app.js` already using `export`
- ✅ `sw.js` runs in browser (doesn't care about package.json)
- ✅ Safe change - fixes mismatch

---

#### Issue 3: Vitest Running Playwright Tests

**Error:**
```
Vitest trying to run tests/e2e/app.spec.js
Error: Playwright Test did not expect test() to be called here
```

**Cause:**
- `npm test` runs Vitest
- Vitest found `tests/e2e/app.spec.js` and tried to run it
- But that's a Playwright test file!

**Fix:**
Updated `vitest.config.js` to exclude E2E tests:
```javascript
test: {
  include: ['**/*.test.js'],
  exclude: ['node_modules', 'dist', 'tests/e2e/**'],
  coverage: {
    exclude: [
      'node_modules/',
      'dist/',
      '*.config.js',
      'sw.js',
      'tests/e2e/**'
    ]
  }
}
```

**Why needed:** Separate test runners for different test types. Vitest = unit tests, Playwright = E2E tests.

---

#### Issue 4: Path Resolution (404 Errors)

**Error:**
```
GET /assets/main-abc123.js 404 (Not Found)
GET /assets/main-xyz789.css 404 (Not Found)
GET /manifest.json 404 (Not Found)
```

**Cause:**
- Vite generated absolute paths: `/assets/main-abc123.js`
- But site deployed to subfolder: `/demo-pwa-app/`
- Should be: `/demo-pwa-app/assets/main-abc123.js`

**Fix:**
Added `base` to `vite.config.js`:
```javascript
export default defineConfig({
  base: '/demo-pwa-app/',  // Prepend to all asset paths
  // ... rest of config
});
```

**How it works:**
- Development (`npm run dev`): Serves at `http://localhost:3000/demo-pwa-app/`
- Production build: Paths become `/demo-pwa-app/assets/...`
- Works in both environments!

**Q: Won't this break local development?**

**A:** No! Vite dev server is smart - it still works fine. We tested it first to be sure.

---

#### Issue 5: Static Assets in Build

**Problem:**
Icons and manifest had 404 errors after deployment because Vite was processing them (hashing filenames).

**Understanding Vite's `public/` Folder:**

**Without `public/`:**
```
icons/icon-192x192.png
    ↓ Vite build
assets/icon-192x192-abc123.png  ← Hashed!
```
- manifest.json says: `"src": "icons/icon-192x192.png"`
- After build: File doesn't exist at that path anymore!

**With `public/`:**
```
public/icons/icon-192x192.png
    ↓ Vite build
icons/icon-192x192.png  ← Same path!
```
- Files copied as-is, no processing
- Paths stay exactly the same

**Fix:**
1. Created `public/` folder
2. Moved `icons/` → `public/icons/`
3. Moved `manifest.json` → `public/manifest.json`
4. Moved `sw.js` → `public/sw.js`

**When to use `public/`:**
- ✅ Files referenced by exact path
- ✅ Icons, manifests, robots.txt
- ✅ Files that must keep exact name
- ❌ JavaScript/CSS imported in code (let Vite process these)

---

#### Issue 6: Service Worker and Hashed Filenames

**Problem:**
Service worker can't know hashed filenames (`main-abc123.js` changes every build).

**Our solution (Simple):**
- Move `sw.js` to `public/` (not minified)
- Only cache static files from public/
- Let browser HTTP cache handle hashed JS/CSS files

**Updated `public/sw.js`:**
```javascript
const CACHE_NAME = 'pwa-text-echo-v7';
const FILES_TO_CACHE = [
    '/demo-pwa-app/',
    '/demo-pwa-app/index.html',
    '/demo-pwa-app/manifest.json',
    '/demo-pwa-app/icons/icon-192x192.png',
    '/demo-pwa-app/icons/icon-512x512.png'
];
// No app.js or styles.css - they have hashed names!
```

**Why absolute paths now?**
`sw.js` is at `/demo-pwa-app/sw.js`, needs to cache files relative to site root.

**Tradeoff:**
- ✅ Simple to manage
- ✅ Reliable
- ❌ sw.js not minified (~1-2KB larger)

**Professional solution (for future):**
- Vite PWA Plugin automatically generates SW
- Knows all hashed filenames
- Minifies SW code
- More complex but production-ready

---

### GitHub Repository vs GitHub Pages

**Two Separate Systems:**

**1. GitHub Repository**
- URL: github.com/vitorsilva/demo-pwa-app
- Stores: Source code (`index.html`, `app.js`, etc.)
- Visible: All files in repo tree

**2. GitHub Pages**
- URL: vitorsilva.github.io/demo-pwa-app/
- Serves: Build artifacts from `dist/`
- Visible: Only by downloading artifacts from Actions

**Can you see the web server files?**

**Old method (Deploy from branch):**
- Pages served files directly from main branch
- What you see in repo = what Pages serves

**New method (GitHub Actions):**
- Actions builds `dist/`, uploads as artifact
- `dist/` not in repo (gitignored)
- Can download artifact from Actions tab to see what was deployed

**Q: Why not commit `dist/` to the repo?**

**A: Problems with committing build files:**
1. ❌ Local build ≠ CI build (different environments)
2. ❌ Merge conflicts every build (hash changes)
3. ❌ Repository bloat (thousands of build commits)
4. ❌ Noise in git history (hard to see real changes)
5. ❌ Multiple sources of truth (who's the authoritative builder?)

**General rule:** Never commit generated/build files. Commit source code only.

---

### Professional Workflow Achieved

**Before CI/CD:**
```
1. Write code locally
2. Manually run tests (maybe forget some)
3. Push to GitHub
4. GitHub Pages serves source files
5. Hope nothing breaks
```

**After CI/CD:**
```
1. Write code locally
2. Push to GitHub
3. GitHub Actions automatically:
   ✓ Runs ALL unit tests (Vitest)
   ✓ Runs ALL E2E tests (Playwright)
   ✓ Builds production bundle (Vite)
   ✓ Deploys optimized build (if main branch)
4. Confidence that deployed code works
5. Users get minified, optimized files
```

**All automatic. No human errors.**

---

### Key Takeaways

**Conceptual Understanding:**

1. **CI/CD Automates Quality Assurance**
   - Every commit tested automatically
   - Catches bugs before they reach production
   - Provides confidence in code changes

2. **Multiple Environments Catch Different Issues**
   - Your Windows machine ≠ CI Linux server
   - CI has fresh install every time
   - Cross-platform testing is valuable

3. **Deployment Should Be Automated**
   - Manual deployment is error-prone
   - Automated deployment is consistent
   - Only deploy if tests pass

4. **Production Builds Are Optimized**
   - Source code ≠ production code
   - Minification, bundling, optimization
   - Users download less, site loads faster

5. **Static Assets Need Special Handling**
   - Files with fixed paths go in `public/`
   - Processed assets get hashed names
   - Service workers cache differently

**Technical Skills Gained:**

1. **GitHub Actions**
   - Creating workflow YAML files
   - Understanding events, jobs, steps
   - Using pre-built actions
   - Configuring permissions

2. **YAML Syntax**
   - Indentation-based structure
   - Key-value pairs
   - Lists with hyphens
   - Multi-line strings

3. **CI/CD Concepts**
   - Continuous Integration
   - Continuous Deployment
   - Automated testing
   - Build artifacts

4. **Vite Configuration**
   - `base` for subfolder deployment
   - `public/` folder for static assets
   - Understanding build output

5. **Debugging Workflows**
   - Reading GitHub Actions logs
   - Understanding permission errors
   - Fixing path issues
   - Module system conflicts

**Commands Mastered:**

**Git:**
```bash
git add .
git commit -m "message"
git push
```

**NPM:**
```bash
npm ci                    # Clean install (CI)
npm install               # Regular install (local)
npm test -- --run         # Run tests once
npm run build             # Production build
```

**GitHub Actions:**
- Workflows run automatically on push
- View at: github.com/[user]/[repo]/actions
- Download artifacts for debugging
- Re-run failed workflows

---

### Files and Folders Created

**Workflow Files:**
- `.github/workflows/test.yml` - CI workflow (run tests)
- `.github/workflows/deploy.yml` - CD workflow (deploy to Pages)

**Updated Configuration:**
- `package.json` - Changed `"type": "module"`
- `vite.config.js` - Added `base: '/demo-pwa-app/'`
- `vitest.config.js` - Excluded E2E tests
- `playwright.config.js` - Added `webServer` section

**Reorganized Structure:**
- `public/icons/` - App icons (copied as-is)
- `public/manifest.json` - PWA manifest (copied as-is)
- `public/sw.js` - Service worker (copied as-is)

---

### Comparison: Before vs After

| Aspect | Before CI/CD | After CI/CD |
|--------|-------------|-------------|
| **Testing** | Manual, local only | Automatic, every push |
| **Deployment** | Source files | Optimized build |
| **File sizes** | ~50KB total | ~15KB total (minified) |
| **Consistency** | Varies by developer | Same every time |
| **Confidence** | Hope it works | Know it works |
| **Speed** | Manual steps | Automatic, minutes |
| **Team** | Each person different | Everyone same process |

---

### What You've Accomplished

**Phase 4.5 Complete! 🎉**

You now have:
- ✅ **Professional CI/CD pipeline**
- ✅ **Automated testing** on every push
- ✅ **Automated deployment** to production
- ✅ **Optimized production builds**
- ✅ **Industry-standard workflow**

**This is how professional teams work!**

Your PWA now has:
- Unit tests (Vitest)
- E2E tests (Playwright)
- Automated CI (test.yml)
- Automated CD (deploy.yml)
- Production optimization (Vite)
- Deployed automatically (GitHub Pages)

**You've learned the complete modern development workflow!**

---

## Session Notes - 2025-10-28

### Session Summary

**Work Completed:**
- ✅ Completed Phase 4.5: CI/CD Pipeline with GitHub Actions
  - Created `.github/workflows/` folder structure
  - Created `test.yml` workflow for continuous integration
  - Created `deploy.yml` workflow for continuous deployment
  - Configured GitHub Pages to use GitHub Actions
  - Fixed CommonJS vs ES modules issue in package.json
  - Fixed Vitest running Playwright tests issue
  - Added `base` path to vite.config.js for subfolder deployment
  - Reorganized project structure with `public/` folder
  - Moved icons, manifest, and service worker to `public/`
  - Updated service worker caching strategy for hashed filenames
  - Successfully deployed optimized build to GitHub Pages
  - All workflows passing with green checkmarks

**Issues Debugged:**
1. Permission errors - Fixed GitHub Actions workflow permissions
2. Module system conflicts - Changed to ES modules
3. Test runner conflicts - Separated Vitest and Playwright
4. Path resolution - Added base URL for GitHub Pages subfolder
5. Static asset handling - Used public/ folder for non-processed files
6. Service worker caching - Adapted to work with hashed build files

**Current Status:**
- Completed through Phase 4.5 (CI/CD Pipeline)
- Project has complete professional development setup:
  - Local HTTPS development (mkcert + http-server)
  - Containerized deployment (Docker + nginx)
  - Build process with optimization (Vite)
  - Unit testing (Vitest + jsdom)
  - E2E testing (Playwright)
  - Continuous Integration (GitHub Actions test.yml)
  - Continuous Deployment (GitHub Actions deploy.yml)
- Live site: https://vitorsilva.github.io/demo-pwa-app/
- Serving minified, optimized production build
- All Phase 4.5 learnings fully documented

**What's Next When You Resume:**
According to LEARNING_PLAN.md, the remaining optional step in Phase 4 is:

1. **Phase 4.6: Advanced Containerization - Optional**
   - Multi-stage Docker builds
   - Dev containers in VS Code
   - Production optimization
   - Smaller, more efficient Docker images

**Or you could:**
- Consider Phase 4 complete (comprehensive professional setup achieved)
- Explore future topics like Vite PWA Plugin for automated SW generation
- Add more PWA features (push notifications, background sync)
- Build a new project with your skills
- Share your PWA with others

**Recommendation:**
Phase 4.5 completes the professional development workflow. You now have everything a production team would use: local development, testing, CI/CD, and deployment. Phase 4.6 would add Docker mastery, but you've already achieved the core learning objectives for modern web development!

**Congratulations on completing Phase 4.5! You now have a complete, professional-grade development and deployment pipeline!** 🎉

---

## What's Next in Phase 4

**Completed:**
- ✅ Phase 4.1: Local HTTPS (mkcert + Docker/nginx)
- ✅ Phase 4.2: Build Process Setup (Vite)
- ✅ Phase 4.3: Unit Testing Setup (Vitest)
- ✅ Phase 4.4: End-to-End Testing (Playwright)
- ✅ Phase 4.5: CI/CD Pipeline (GitHub Actions)

**Still Available:**
- Phase 4.6: Advanced Containerization (Multi-stage builds) - Optional
