# Phase 4 Architecture Documentation

This document provides visual representations of all technologies and frameworks used during Phase 4, showing how they relate and interact.

---

## 1. Complete Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 4 TECHNOLOGY STACK                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  DEVELOPMENT ENVIRONMENT                                        │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │   Local HTTPS    │  │     Docker       │                    │
│  │                  │  │                  │                    │
│  │  mkcert (4.1a)   │  │  Container (4.1b)│                    │
│  │  http-server     │  │  nginx           │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  BUILD TOOLS                                                    │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                    Vite (4.2)                        │      │
│  │  • Dev server with HMR                               │      │
│  │  • Production bundler                                │      │
│  │  • Minification & optimization                       │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TESTING TOOLS                                                  │
│  ┌─────────────────────┐  ┌──────────────────────┐            │
│  │   Vitest (4.3)      │  │  Playwright (4.4)    │            │
│  │                     │  │                      │            │
│  │  • Unit tests       │  │  • E2E tests         │            │
│  │  • jsdom            │  │  • Real browsers     │            │
│  │  • Fast execution   │  │  • Visual debugging  │            │
│  └─────────────────────┘  └──────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CI/CD AUTOMATION                                               │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              GitHub Actions (4.5)                    │      │
│  │  • test.yml - Automated testing                      │      │
│  │  • deploy.yml - Automated deployment                 │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Development Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                      DEVELOPMENT WORKFLOW                        │
└──────────────────────────────────────────────────────────────────┘

    YOU WRITE CODE
         │
         ├─── Local Dev Server ──────────────────┐
         │    (npm run dev)                      │
         │                                       │
         │    ┌─────────────────────┐           │
         │    │   Vite Dev Server   │           │
         │    │   localhost:3000    │           │
         │    │   • Hot reload      │           │
         │    │   • Fast refresh    │           │
         │    └─────────────────────┘           │
         │                                       │
         ├─── Test Locally ──────────────────────┤
         │                                       │
         │    ┌──────────────┐  ┌─────────────┐ │
         │    │   Vitest     │  │ Playwright  │ │
         │    │ (Unit tests) │  │ (E2E tests) │ │
         │    └──────────────┘  └─────────────┘ │
         │                                       │
         ├─── Local HTTPS Testing ───────────────┤
         │                                       │
         │    Option A:            Option B:     │
         │    ┌──────────────┐    ┌──────────┐  │
         │    │   mkcert     │    │  Docker  │  │
         │    │ http-server  │    │  nginx   │  │
         │    └──────────────┘    └──────────┘  │
         │                                       │
         └───────────────────────────────────────┘
              │
              │ git push
              ▼
    ┌──────────────────────┐
    │   GitHub Actions     │ (Automated CI/CD)
    │   Runs in cloud      │
    └──────────────────────┘
```

---

## 3. CI/CD Pipeline (GitHub Actions)

```
┌────────────────────────────────────────────────────────────────┐
│                    CI/CD PIPELINE FLOW                         │
└────────────────────────────────────────────────────────────────┘

    git push
       │
       ▼
   ┌─────────────────────────────────────────────────────────┐
   │              GITHUB ACTIONS TRIGGERS                    │
   └─────────────────────────────────────────────────────────┘
       │
       ├────────────────────────┬────────────────────────────┐
       │                        │                            │
       ▼                        ▼                            ▼
   ┌─────────┐            ┌─────────┐                  ┌─────────┐
   │ test.yml│            │test.yml │                  │deploy.yml│
   │ (Any    │            │ (Any    │                  │ (Main   │
   │ branch) │            │ branch) │                  │  only)  │
   └─────────┘            └─────────┘                  └─────────┘
       │                        │                            │
       │                        │                            │
       ▼                        ▼                            ▼
   ┌──────────┐           ┌──────────┐                ┌──────────┐
   │  Ubuntu  │           │  Ubuntu  │                │  Ubuntu  │
   │  Server  │           │  Server  │                │  Server  │
   └──────────┘           └──────────┘                └──────────┘
       │                        │                            │
       │                        │                            │
   ┌───┴────────────┐      ┌────┴──────────┐          ┌──────┴──────┐
   │                │      │               │          │             │
   │ npm ci         │      │ npm ci        │          │  npm ci     │
   │ npm test       │      │ playwright    │          │  npm build  │
   │ --run          │      │ install       │          │             │
   │                │      │ npm run       │          │             │
   │ ┌───────────┐  │      │ test:e2e      │          │ ┌─────────┐ │
   │ │  Vitest   │  │      │               │          │ │  Vite   │ │
   │ │ Unit Tests│  │      │ ┌───────────┐ │          │ │ Build   │ │
   │ └───────────┘  │      │ │Playwright │ │          │ └─────────┘ │
   │                │      │ │ E2E Tests │ │          │             │
   │                │      │ └───────────┘ │          │             │
   └────────────────┘      └───────────────┘          └─────────────┘
       │                        │                            │
       │                        │                            │
       ▼                        ▼                            ▼
    ✅ Pass                  ✅ Pass                      ✅ Pass
    ❌ Fail                  ❌ Fail                          │
                                                             │
                                                             ▼
                                                    ┌────────────────┐
                                                    │ GitHub Pages   │
                                                    │ Deployment     │
                                                    └────────────────┘
                                                             │
                                                             ▼
                                                      🌐 LIVE SITE
                                            vitorsilva.github.io
```

---

## 4. File Flow Through Build Process

```
┌────────────────────────────────────────────────────────────────┐
│                  FILE FLOW: SOURCE → PRODUCTION                │
└────────────────────────────────────────────────────────────────┘

SOURCE FILES (Your Code)
┌───────────────────────────────────────────────────────┐
│  index.html                                           │
│  app.js                                               │
│  styles.css                                           │
│  public/                                              │
│    ├─ manifest.json                                   │
│    ├─ sw.js                                           │
│    └─ icons/                                          │
└───────────────────────────────────────────────────────┘
         │
         │ npm run dev
         ▼
┌───────────────────────────────────────────────────────┐
│              VITE DEV SERVER (Development)            │
│  • Serves files as-is                                 │
│  • Hot Module Replacement                             │
│  • Fast refresh on changes                            │
│  localhost:3000/demo-pwa-app/                         │
└───────────────────────────────────────────────────────┘
         │
         │ npm run build
         ▼
┌───────────────────────────────────────────────────────┐
│              VITE BUILD (Production)                  │
│                                                       │
│  ┌─────────────────┐         ┌──────────────────┐   │
│  │  JS Processing  │         │  CSS Processing  │   │
│  │  • Bundle       │         │  • Bundle        │   │
│  │  • Minify       │         │  • Minify        │   │
│  │  • Hash names   │         │  • Hash names    │   │
│  └─────────────────┘         └──────────────────┘   │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │     public/ files copied as-is              │    │
│  │     (manifest, sw, icons)                   │    │
│  └─────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────┘
         │
         ▼
PRODUCTION BUILD (dist/)
┌───────────────────────────────────────────────────────┐
│  index.html                                           │
│  assets/                                              │
│    ├─ main-BahivuGj.js    ← Hashed, minified        │
│    └─ main-C2fTfVz3.css   ← Hashed, minified        │
│  manifest.json             ← Copied as-is            │
│  sw.js                     ← Copied as-is            │
│  icons/                    ← Copied as-is            │
│                                                       │
│  📊 Size reduction: ~50KB → ~15KB                    │
└───────────────────────────────────────────────────────┘
         │
         │ GitHub Actions deploy.yml
         ▼
┌───────────────────────────────────────────────────────┐
│              GITHUB PAGES (Live Site)                 │
│  https://vitorsilva.github.io/demo-pwa-app/          │
│                                                       │
│  Serves optimized dist/ files to users               │
└───────────────────────────────────────────────────────┘
```

---

## 5. Testing Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     TESTING ARCHITECTURE                       │
└────────────────────────────────────────────────────────────────┘

SOURCE CODE
    │
    ├────────────────────────┬────────────────────────────┐
    │                        │                            │
    ▼                        ▼                            ▼
┌─────────┐            ┌──────────┐               ┌──────────────┐
│ app.js  │            │ app.js   │               │ Full App     │
└─────────┘            └──────────┘               └──────────────┘
    │                        │                            │
    │                        │                            │
    ▼                        ▼                            ▼
┌──────────────┐       ┌──────────────┐          ┌──────────────┐
│  UNIT TESTS  │       │  UNIT TESTS  │          │  E2E TESTS   │
│  (Vitest)    │       │  (Vitest)    │          │ (Playwright) │
└──────────────┘       └──────────────┘          └──────────────┘
    │                        │                            │
    │                        │                            │
┌───┴────────────┐     ┌─────┴────────┐          ┌──────┴────────┐
│                │     │              │          │               │
│ Environment:   │     │ Tests:       │          │ Environment:  │
│ • Node.js      │     │ • Individual │          │ • Real browser│
│ • jsdom        │     │   functions  │          │ • Chromium    │
│ • Simulated    │     │ • Fast (ms)  │          │ • Full DOM    │
│   browser      │     │ • Isolated   │          │               │
│                │     │              │          │ Tests:        │
│ Example:       │     │ Files:       │          │ • User flows  │
│ updateOutput() │     │ *.test.js    │          │ • Slow (secs) │
│ function       │     │              │          │ • Integrated  │
│                │     │              │          │               │
│                │     │              │          │ Files:        │
│                │     │              │          │ *.spec.js     │
│                │     │              │          │               │
└────────────────┘     └──────────────┘          └───────────────┘
    │                        │                            │
    │                        │                            │
    ▼                        ▼                            ▼
 ✅ Pass                  ✅ Pass                      ✅ Pass
 ❌ Fail                  ❌ Fail                      ❌ Fail
                                                    (+ screenshots
                                                     + videos)
```

---

## 6. Technology Interaction Map

```
┌────────────────────────────────────────────────────────────────┐
│            HOW TECHNOLOGIES INTERACT IN PHASE 4                │
└────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │   YOUR CODE     │
                    │ (index.html,    │
                    │  app.js, etc.)  │
                    └────────┬────────┘
                             │
                 ┌───────────┼───────────┐
                 │           │           │
                 ▼           ▼           ▼
         ┌───────────┐ ┌─────────┐ ┌─────────┐
         │   Vite    │ │ Vitest  │ │Playwright│
         │  (Build)  │ │ (Test)  │ │  (Test) │
         └─────┬─────┘ └────┬────┘ └────┬────┘
               │            │           │
               │            │           │
    ┌──────────┼────────────┼───────────┼────────────┐
    │          │            │           │            │
    ▼          ▼            ▼           ▼            ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐
│ mkcert │ │ Docker │ │ jsdom  │ │Chromium│ │   GitHub   │
│http-srv│ │ nginx  │ │        │ │Firefox │ │   Actions  │
│        │ │        │ │        │ │WebKit  │ │            │
└───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └─────┬──────┘
    │          │          │          │            │
    │          │          │          │            │
    └──────────┴──────────┴──────────┴────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ GitHub Pages │
                  │  (Live Site) │
                  └──────────────┘
                         │
                         ▼
                    🌐 USERS


LEGEND:
━━━━  Processes your code
- - -  Tests your code
····  Serves your code
```

---

## 7. Complete Phase 4 Journey

```
┌────────────────────────────────────────────────────────────────┐
│                    YOUR PHASE 4 JOURNEY                        │
└────────────────────────────────────────────────────────────────┘

Phase 4.1a: Local HTTPS              Phase 4.1b: Containerization
┌─────────────────────┐               ┌─────────────────────┐
│   mkcert            │               │   Docker            │
│   http-server       │               │   nginx             │
│                     │               │                     │
│ ✓ PWA features work │               │ ✓ Isolated env      │
│ ✓ Test locally      │               │ ✓ Production-like   │
└─────────────────────┘               └─────────────────────┘
          │                                     │
          └──────────────┬──────────────────────┘
                         ▼
Phase 4.2: Build Process
┌──────────────────────────────────┐
│   Vite                           │
│                                  │
│ ✓ Dev server with HMR            │
│ ✓ Production bundling            │
│ ✓ Minification                   │
└────────────────┬─────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
Phase 4.3:          Phase 4.4:
Unit Testing        E2E Testing
┌─────────────┐     ┌─────────────┐
│  Vitest     │     │ Playwright  │
│  jsdom      │     │ Browsers    │
│             │     │             │
│ ✓ Fast      │     │ ✓ Real user │
│ ✓ Isolated  │     │ ✓ Visual    │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └────────┬──────────┘
                ▼
Phase 4.5: CI/CD
┌────────────────────────────────┐
│   GitHub Actions               │
│                                │
│ ✓ Auto test every push         │
│ ✓ Auto deploy on main          │
│ ✓ Production builds            │
└────────────────────────────────┘
                │
                ▼
        🎉 COMPLETE! 🎉
```

---

## Summary

This architecture documentation provides a comprehensive view of:

1. **Technology Stack** - All tools used in Phase 4
2. **Development Workflow** - How you develop locally
3. **CI/CD Pipeline** - How code gets tested and deployed automatically
4. **Build Process** - How source code becomes production code
5. **Testing Architecture** - Unit vs E2E testing setup
6. **Technology Interactions** - How all pieces work together
7. **Learning Journey** - Your progression through Phase 4

**Phase 4 Achievement:**
You've built a complete professional development environment with automated testing, deployment, and optimization - exactly how modern web development teams work in production!
