# Party P2P Decentralization - Learning Notes

**Parent Plan:** [PARTY_MODE_DECENTRALIZATION_PLAN.md](./PARTY_MODE_DECENTRALIZATION_PLAN.md)

---

## Session: 2026-01-13

### Context

User reported Chrome was still asking for "local network access" permission when joining party sessions, despite having implemented TURN server integration per `PARTY_MODE_TURN_SERVER.md`.

### Investigation & Discoveries

1. **Permission prompt root cause identified:**
   - NOT caused by WebRTC/party code
   - Caused by **Google AdSense script** in `index.html` (lines 19-21)
   - AdSense uses WebRTC for device fingerprinting, triggering the prompt

2. **Dead code discovered:**
   - `P2PService`, `SignalingClient`, `PartySession` exist but are NOT wired to views
   - All party views use HTTP polling via `party-api.js`
   - TURN server implementation was never actually used

3. **Server stores too much data:**
   - `party_rooms.quiz_data` - full quiz JSON
   - `party_participants` - names, scores
   - `party_answers` - all submitted answers

### Completed

- [x] Investigated permission prompt issue
- [x] Identified AdSense as root cause
- [x] Reviewed all Epic 6 documentation
- [x] Analyzed current party architecture
- [x] Created comprehensive decentralization plan (v3)
- [x] Added branch/commit strategy
- [x] Added feature flags strategy
- [x] Added Maestro testing section
- [x] Added staging-first deployment workflow
- [x] Plan validated by user

### Plan Overview (v3)

| Phase | Description | Key Deliverables |
|-------|-------------|------------------|
| 0 | AdSense Permission Fix | `adsense-loader.js`, remove global script |
| A | P2P Foundation | `PartyConnectionManager`, STUN-only config |
| B | View Integration | Update all party views to use P2P |
| C | Server Minimization | Remove quiz/answer storage from server |
| D | STUN Testing | Verify P2P works, add telemetry |
| E | Testing & Validation | Unit, E2E, Maestro, staging validation |
| F | Production Rollout | Enable feature flag, deploy, monitor |

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| STUN vs TURN | STUN-first | No external service dependency |
| HTTP Fallback | Keep | Reliability when P2P fails |
| Teaching Mode | Yes | User implements step-by-step |
| Branch Strategy | Feature branch | `feature/party-p2p-decentralization` |
| Deployment | Staging-first | Validate before production |

### Next Steps (When Resuming)

1. Create feature branch: `git checkout -b feature/party-p2p-decentralization`
2. Start Phase 0: AdSense lazy-loading fix
3. Deploy to staging after each phase
4. Follow teaching mode (user writes code)

### Files Created/Modified This Session

| File | Action |
|------|--------|
| `docs/learning/epic06_sharing/PARTY_MODE_DECENTRALIZATION_PLAN.md` | CREATED (comprehensive plan) |
| `docs/learning/epic06_sharing/PARTY_P2P_DECENTRALIZATION_LEARNING_NOTES.md` | CREATED (this file) |

---

## Session: 2026-01-13 (Implementation)

### Starting Phase 0: AdSense Permission Fix

**Goal:** Lazy-load AdSense only on pages where ads are shown (ResultsView), eliminating the permission prompt on party pages.

**Branch:** `feature/party-p2p-decentralization` ✅ Created

### Progress

- [x] Task 0.2: Add lazy-loading to `src/utils/adManager.js` (revised - simpler than separate file)
- [x] Task 0.3: Remove global AdSense from `index.html`
- [x] Task 0.4: Test ads work and no permission prompt ✅

### Phase 0 Complete!

**Results:**
- No permission prompt when joining party (AdSense no longer loads globally)
- Ad placeholder displays correctly on LoadingView
- AdManager initializes and loads script on demand

### Approach Change

**Original plan:** Create separate `src/utils/adsense-loader.js`

**Revised approach:** Integrate lazy-loading into existing `adManager.js`

**Rationale:**
- `adManager.js` already handles all ad logic
- Adding lazy-loading there keeps ad code in one place
- Simpler than maintaining two separate ad utilities

### Difficulties & Solutions

**Problem:** TypeScript error `Property 'adsbygoogle' does not exist on type 'Window'`
**Cause:** Project has `checkJs: true` in `jsconfig.json`, enabling type checking for JS files
**Fix:** Added Window interface extension in `src/vite-env.d.ts`:
```typescript
interface Window {
  adsbygoogle: object[];
}
```
**Learning:** JSDoc `@typedef` (in `types.js`) creates new types but can't extend globals. Use `.d.ts` files for extending browser interfaces.

### Learnings

- Singleton Promise pattern prevents duplicate script loading when multiple callers await simultaneously
- `resolve(false)` vs `reject()`: Use resolve for expected/graceful failures, reject for unexpected errors
- Making a function `async` changes return type - must update JSDoc from `@returns {boolean}` to `@returns {Promise<boolean>}`

### Commits (Phase 0)

```
329d937 chore: add Window.adsbygoogle type declaration
5004828 feat(ads): add lazy-loading for AdSense script
0d4d940 test(ads): update tests for async loadAd
7085ee7 fix(ads): remove global AdSense script from index.html
5bedb1c docs: update learning notes for Phase 0 completion
```

---

## Session: 2026-01-13 (Staging Deployment & Environment Config)

### Staging Deployment Issues

After deploying Phase 0 to staging, the permission prompt still appeared. Investigation revealed:

**Problem 1: Permission prompt still showing on staging**
- Initial hypothesis: AdSense still causing it - WRONG
- Used Chrome DevTools Network tab to investigate
- Found requests going to `localhost:8080` in staging build!

**Root Cause:**
- `.env` had `VITE_PARTY_API_URL=http://localhost:8080/party`
- This was being bundled into the staging build
- The `http://localhost` URL triggered Chrome's "local network access" permission

**Problem 2: After fixing URL, party API failed on VPS**
- Error: `Unknown MySQL server host 'mysql' (-2)`
- Cause: VPS `config.local.php` was configured for Docker (`host: 'mysql'`) instead of VPS (`host: 'localhost'`)

### Multi-Environment Configuration Solution

Implemented a proper multi-environment setup:

**Frontend (Vite):**

| File | Purpose | Committed | When Loaded |
|------|---------|-----------|-------------|
| `.env` | Base config, no `VITE_PARTY_API_URL` | ✅ Yes | All builds |
| `.env.development.local` | Dev-only overrides | ❌ No (gitignored) | **Only** `npm run dev` |

**⚠️ CRITICAL Learning:** `.env.local` loads for ALL builds (including staging/production). Use `.env.development.local` for dev-only variables!

**How it works:**
- Local dev (`npm run dev`): `.env.development.local` sets `VITE_PARTY_API_URL=http://localhost:8080/party`
- Staging/Prod builds: `.env.development.local` is NOT loaded → `VITE_PARTY_API_URL` is undefined → falls back to `https://saberloop.com/party` (in `signaling-client.js`)

**Backend (PHP):**

| Environment | `config.local.php` db_host |
|-------------|---------------------------|
| Docker (local) | `mysql` (container name) |
| VPS (staging/prod) | `localhost` |

**Files modified:**
- `.gitignore` - Added `.env.*.local` pattern
- `.env.development.local` - Created with `VITE_PARTY_API_URL=http://localhost:8080/party`
- `.env` - Removed/commented `VITE_PARTY_API_URL`
- VPS `config.local.php` - Updated with correct localhost credentials

### Learnings

- **Vite environment variable loading order**:
  | File | When Loaded |
  |------|-------------|
  | `.env` | All cases |
  | `.env.local` | All cases (⚠️ NOT dev-only!) |
  | `.env.[mode]` | Only in specified mode |
  | `.env.[mode].local` | Only in specified mode |

- **Use `.env.development.local`** for dev-only overrides, NOT `.env.local`
- **Debug network issues**: Chrome DevTools Network tab is essential for finding unexpected requests
- **Service Worker caching**: Can cause old bundles to be served even after deployment - use incognito or clear cache
- **Verify builds**: Always search for sensitive strings in dist folder after build (`Select-String -Path "dist\assets\*.js" -Pattern "localhost"`)

### Deployment Commands

```bash
# Staging
npm run build:staging
npm run deploy:staging

# Production
npm run build
npm run deploy
```

### Next Steps

1. Start Phase A: P2P Foundation
   - Task A.3: Simplify P2PService to STUN-only
   - Task A.4: Clean up environment variables (Metered.ca references)
   - Task A.1: Create PartyConnectionManager
   - Task A.2: Create tests

---

## References

- [PARTY_MODE_TURN_SERVER.md](./PARTY_MODE_TURN_SERVER.md) - Previous TURN implementation (not used)
- [EPIC6_SHARING_PLAN.md](./EPIC6_SHARING_PLAN.md) - Parent epic plan
- [PHASE3_PARTY_SESSION.md](./PHASE3_PARTY_SESSION.md) - Original party session design
