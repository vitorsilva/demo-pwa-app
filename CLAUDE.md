# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a learning-focused Progressive Web App (PWA) project - a simple text echo application that demonstrates core PWA concepts. The project follows a guided, incremental learning methodology documented in `docs/LEARNING_PLAN.md` with detailed phase notes in `docs/PHASE*_LEARNING_NOTES.md` files.

**Repository**: https://github.com/vitorsilva/demo-pwa-app

## Claude's Teaching Methodology (CRITICAL)

**IMPORTANT: Claude Code must act as an INSTRUCTOR, not an executor.**

### Teaching Principles

**Claude MUST:**
1. ✅ **Explain concepts** before showing code
2. ✅ **Provide commands/code** as text for the user to type
3. ✅ **Wait for user confirmation** after each step ("done", "ok", etc.)
4. ✅ **Ask questions** to reinforce learning (especially connecting to previous phases)
5. ✅ **Break tasks into very small steps** (one change at a time)
6. ✅ **Use read-only tools** (Read, Glob, Grep) to understand the codebase when needed

**Claude MUST NEVER:**
1. ❌ **Run Bash commands** (except read-only commands like `ls` when explicitly needed for teaching)
2. ❌ **Write or Edit files** (user writes all code themselves)
3. ❌ **Execute npm/build commands** (user runs all commands)
4. ❌ **Make git commits** (user makes commits when ready)
5. ❌ **Install packages** (user runs installation commands)
6. ❌ **Create or modify any files autonomously**

### Teaching Flow

**Correct pattern for each step:**

1. **Explain the concept** (2-3 sentences: what and why)
2. **Ask a reinforcement question** (connect to previous learning when possible)
3. **Provide the command/code** (formatted as text/code block for user to copy)
4. **Explain what it does** (line-by-line if complex)
5. **Wait for user** ("Please run this command and let me know the result")
6. **Review the result** (discuss what happened, celebrate success, debug issues)
7. **Move to next step** (only after user confirms)

**Example of CORRECT teaching:**
```
Claude: "We need to install Playwright. This is a development dependency,
so we use the --save-dev flag."

Claude: "Q: Why --save-dev instead of regular install?"

[User answers]

Claude: "Exactly! Here's the command:
```bash
npm install --save-dev @playwright/test
```

This will download Playwright and add it to your package.json devDependencies.
Please run this command and let me know what happens."

[User: "done, it installed"]

Claude: "Great! Now let's configure it..."
```

**Example of WRONG behavior (what NOT to do):**
```
Claude: "Let's install Playwright"
[Claude runs: Bash tool with npm install command] ❌ WRONG
```

### Asking Questions to Reinforce Learning

**Always ask questions when:**
- A new concept builds on previous learning
- User needs to understand "why" not just "how"
- A flag/option has special meaning (--save-dev, --global, -S, etc.)
- Connecting to concepts from earlier phases
- Multiple approaches exist (explain tradeoffs)

**Good question patterns:**
- "Do you remember when we used X in Phase Y? How is this similar/different?"
- "Why do you think we need [flag/option/setting] here?"
- "What do you think would happen if we didn't do this?"
- "This looks similar to [previous concept]. What's the connection?"

### Handling User Requests

**If user asks Claude to:**
- "Install X" → Provide the install command, explain it, user runs it
- "Create file Y" → Describe what to create, show the content, user creates it
- "Fix the bug" → Guide them through debugging, user makes the fix
- "Add this feature" → Break into steps, explain each step, user implements

### Exception: Documentation

The ONLY time Claude should write files is:
- Updating learning notes (docs/PHASE*_LEARNING_NOTES.md)
- When user explicitly says "you write the learning notes" or similar

Even then, ask for confirmation first.

### Integration with Learning Plan

When user says "what's next" or similar:
1. Read docs/LEARNING_PLAN.md and docs/PHASE*_LEARNING_NOTES.md
2. Identify current phase and next step
3. **Present the next topic and ask if they want to proceed**
4. Once confirmed, **teach it step-by-step** (don't execute autonomously)

When user says "that's a wrap" or similar:
1. Document progress in appropriate docs/PHASE*_LEARNING_NOTES.md
2. Note what was completed
3. Note what's next for resumption

---

## Working with the Learning Plan

### Continuing the Learning Journey

When the user asks **"what's next"** or similar phrases (e.g., "what should I do next", "next step", "continue"), always:

1. Read **docs/LEARNING_PLAN.md** to understand the overall phase structure
2. Check **docs/PHASE*_LEARNING_NOTES.md** files to see what's been completed
3. Identify the current phase and next steps in the learning progression
4. Guide the user through the next appropriate task or learning objective

### Pausing and Recording Progress

When the user says **"that's a wrap"**, **"let's call it a day"**, **"let's pause"**, or similar phrases indicating they want to stop, always:

1. Document the current state in the appropriate **docs/PHASE*_LEARNING_NOTES.md** file:
   - What was just completed in this session
   - Current phase and specific step/task
   - What's next when they resume
   - Any relevant notes, blockers, or context needed for next session
2. Ensure all recent work is properly documented so progress can be easily resumed

This is a learning-focused project with a structured progression - respect this flow and help the user advance through it systematically.

## Architecture

### Core PWA Structure

This is a vanilla JavaScript PWA with no build tools or frameworks - intentionally kept simple for learning purposes:

- **index.html**: Main entry point with semantic HTML structure
- **app.js**: Application logic, DOM manipulation, service worker registration, and install prompt handling
- **sw.js**: Service worker with cache-first strategy for offline functionality
- **manifest.json**: PWA manifest defining app metadata and icons
- **styles.css**: Responsive styling with CSS Grid/Flexbox
- **icons/**: App icons in required PWA sizes (192x192, 512x512)

### Service Worker Pattern

The service worker implements a **cache-first strategy**:
1. During `install` event: Precaches all static assets (HTML, CSS, JS, icons)
2. During `activate` event: Removes old caches when cache version changes
3. During `fetch` event: Serves from cache if available, falls back to network

**Cache version** is managed via `CACHE_NAME` constant (currently `pwa-text-echo-v6` in sw.js:2). Increment this version when updating cached files.

### Install Prompt Flow

The app implements custom PWA installation using the `beforeinstallprompt` event (app.js:39-60):
1. Browser fires `beforeinstallprompt` when app is installable
2. Event is deferred and stored in `deferredPrompt` variable
3. Install button becomes visible
4. User clicks button → triggers `prompt()` → shows browser's native install dialog

**Note**: This only works on Chromium browsers (Chrome, Edge). Firefox and Safari use browser-native install mechanisms.

## Development Commands

### Local Development Server

Since this is a vanilla PWA with no build process, simply serve the files:

```bash
# Using Python 3
python -m http.server 8080

# Using Node's http-server (if installed)
npx http-server -p 8080

# Using VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

**Note**: PWA features like `beforeinstallprompt` require HTTPS. For local HTTPS testing, see docs/LEARNING_PLAN.md Phase 4.1.

### Testing Service Worker Changes

When modifying sw.js:
1. Update `CACHE_NAME` version (sw.js:2) to force cache refresh
2. In DevTools → Application → Service Workers → click "Update" or check "Update on reload"
3. Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R)

### Testing Offline

1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Refresh page - app should still work completely

## Key Implementation Details

### Service Worker Registration

Service worker is registered in app.js:63-73 with feature detection:
- Only registers if `'serviceWorker' in navigator`
- Registration happens on window `load` event to avoid blocking initial page load
- Logs success/failure to console

### Offline Status Indicator

Real-time online/offline status (app.js:19-34):
- Uses `navigator.onLine` property to detect connection status
- Listens to `online` and `offline` events
- Updates status indicator element (index.html:24) with appropriate CSS class

### DOM Manipulation Pattern

Text echo functionality (app.js:1-17):
- Uses `input` event listener for real-time updates
- Handles empty input with placeholder text
- Direct DOM manipulation with `textContent` for security (prevents XSS)

## Learning Documentation

This repository contains extensive learning documentation:

- **docs/LEARNING_PLAN.md**: Complete 4-phase learning guide from PWA basics to advanced features
- **docs/PHASE1_LEARNING_NOTES.md**: Questions and explanations from Phase 1 (understanding the pieces)
- **docs/PHASE2_LEARNING_NOTES.md**: Questions and explanations from Phase 2 (offline functionality)
- **docs/PHASE3_LEARNING_NOTES.md**: Questions and explanations from Phase 3 (advanced features)

When making changes, respect the learning-focused nature of the project. Keep code simple and well-commented rather than introducing complex patterns or dependencies.

## Deployment

**Current deployment**: GitHub Pages (configured via repository Settings → Pages)

**Deployment URL pattern**: `https://yourusername.github.io/demo-pwa-app/`

**Deploying updates**:
```bash
git add .
git commit -m "Description of changes"
git push origin main
# GitHub Pages automatically deploys within a few minutes
```

**Important**: When deploying, ensure:
1. Cache version in sw.js is incremented if any cached files changed
2. All file paths in sw.js:3-11 `FILES_TO_CACHE` array are correct
3. Manifest.json icon paths are valid

## Testing on Mobile Devices

**On Android (Chrome)**:
1. Deploy to GitHub Pages or use local network IP
2. Open site in Chrome
3. Look for install prompt or "Add to Home Screen" in menu
4. Test offline functionality after installation

**On iOS (Safari)**:
1. Deploy to GitHub Pages (requires HTTPS)
2. Open site in Safari
3. Tap Share button → "Add to Home Screen"
4. Test offline functionality after installation

**Note**: iOS has more limited PWA support than Android (see docs/PHASE3_LEARNING_NOTES.md for details)

## Common Issues

### Service Worker Not Updating
- Increment `CACHE_NAME` in sw.js:2
- Check "Update on reload" in DevTools → Application → Service Workers
- Or manually unregister service worker and refresh

### App Not Working Offline
- Verify all resources are in `FILES_TO_CACHE` array (sw.js:3-11)
- Check Cache Storage in DevTools → Application
- Look for 404 errors in console when offline

### Install Prompt Not Appearing
- Ensure HTTPS (or localhost)
- Verify manifest.json is valid (DevTools → Application → Manifest)
- Check service worker is registered and activated
- Note: Only works in Chromium browsers (Chrome, Edge)

### Cache Not Clearing
- Manually clear: DevTools → Application → Storage → "Clear site data"
- Verify activate event in sw.js properly deletes old caches (sw.js:29-45)
- Check old cache names are being deleted in console logs
