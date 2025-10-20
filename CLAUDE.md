# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a learning-focused Progressive Web App (PWA) project - a simple text echo application that demonstrates core PWA concepts. The project follows a guided, incremental learning methodology documented in `LEARNING_PLAN.md` with detailed phase notes in `PHASE*_LEARNING_NOTES.md` files.

**Repository**: https://github.com/vitorsilva/demo-pwa-app

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

**Note**: PWA features like `beforeinstallprompt` require HTTPS. For local HTTPS testing, see LEARNING_PLAN.md Phase 4.1.

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

- **LEARNING_PLAN.md**: Complete 4-phase learning guide from PWA basics to advanced features
- **PHASE1_LEARNING_NOTES.md**: Questions and explanations from Phase 1 (understanding the pieces)
- **PHASE2_LEARNING_NOTES.md**: Questions and explanations from Phase 2 (offline functionality)
- **PHASE3_LEARNING_NOTES.md**: Questions and explanations from Phase 3 (advanced features)

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

**Note**: iOS has more limited PWA support than Android (see PHASE3_LEARNING_NOTES.md for details)

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
