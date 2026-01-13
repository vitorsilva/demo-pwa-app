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

### Commits (Environment Config)

```
8da7a92 chore: add .env.local to gitignore and fix signaling test
a793299 chore: add adsbygoogle words to spell checker
686f280 docs: add staging deployment and env config to learning notes
17748fa fix: use .env.development.local for dev-only env vars
1d2436c docs: correct env file documentation (.env.development.local)
```

### Status

- ✅ Phase 0: Complete (AdSense lazy-loading)
- ✅ Environment configuration: Fixed and documented
- ✅ All tests passing (730)
- ✅ Staging deployed and verified
- 🔜 Phase A: P2P Foundation (next)

---

## Next Steps (When Resuming)

1. **Start Phase A: P2P Foundation**
   - Task A.3: Simplify P2PService to STUN-only (remove Metered.ca TURN code)
   - Task A.4: Clean up environment variables (remove `VITE_METERED_*` from `.env`)
   - Task A.1: Create PartyConnectionManager
   - Task A.2: Create PartyConnectionManager tests

2. **Branch:** Continue on `feature/party-p2p-decentralization`

3. **Verification after each task:**
   - Run tests: `npm test -- --run`
   - Build staging: `npm run build:staging`
   - Check for localhost: `Select-String -Path "dist\assets\*.js" -Pattern "localhost"`

---

## Session: 2026-01-13 (Phase A: P2P Foundation)

### Task A.3: Simplify P2PService to STUN-only

**Goal:** Remove TURN server complexity (Metered.ca) and use free Google STUN servers.

**Branch:** `feature/party-p2p-decentralization`

### Progress

- [x] Task A.3: Simplify P2PService to STUN-only
- [x] Task A.4: Clean up environment variables (remove `VITE_METERED_*`)
- [x] Task A.1: Create PartyConnectionManager
- [x] Task A.2: Create PartyConnectionManager tests
- [x] Mutation testing: Improved score from 45% → 63%

### Key Changes to `src/services/p2p-service.js`

**Before:** 619 lines with async TURN credential fetching from Metered.ca
**After:** 561 lines with static STUN-only configuration

**ICE Servers (new):**
```javascript
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];
```

### Learnings

- **STUN** = Session Traversal Utilities for NAT - helps discover public IP when behind router
- **ICE candidate types:**
  - `host` - local IP, works on same LAN only
  - `srflx` (server reflexive) - public IP via STUN, works across internet
  - `relay` - traffic routed through TURN server, always works but slower
- **`iceTransportPolicy: 'relay'`** forces TURN-only connections. Without TURN servers, connections would ALWAYS fail. Must be removed for STUN to work.
- Google provides free public STUN servers - no API keys needed

### Removed Code

| Removed | Lines | Purpose |
|---------|-------|---------|
| TURN cache variables | 6 | Cached credentials to avoid API calls |
| `getIceServers()` function | 48 | Async fetch from Metered.ca |
| `iceTransportPolicy: 'relay'` | 1 | Forced TURN-only (breaks without TURN) |
| `await getIceServers()` calls | 2 | In `createConnection()` and `_handleOffer()` |

### PartyConnectionManager (`src/services/party-connection-manager.js`)

New orchestration class that coordinates:
- `SignalingClient` - HTTP polling for WebRTC signaling
- `P2PService` - WebRTC peer connections
- `PartySession` - Quiz game state

**Key features:**
- Connection timeout pattern (30s) with 3 retries
- Automatic HTTP fallback when P2P fails
- Mode states: `CONNECTING`, `P2P`, `HTTP_FALLBACK`, `DISCONNECTED`
- Event callbacks: `onModeChange`, `onPeerJoined`, `onPeerLeft`, `onError`

**Connection flow:**
1. Set mode to CONNECTING
2. Create SignalingClient, P2PService, PartySession
3. Start connection timeout
4. If guest: get peers via signaling, initiate P2P connection to host
5. On P2P success: clear timeout, set mode to P2P
6. On timeout/failure: retry up to 3 times, then fall back to HTTP

### Difficulties & Solutions

**Problem:** TypeScript error `Type 'Timeout' is not assignable to type 'number'`
**Cause:** `setTimeout` returns different types in browser (number) vs Node.js (Timeout object)
**Fix:** Changed `setTimeout` to `window.setTimeout` to explicitly use browser API

**Problem:** Vitest mock error with class constructors
**Cause:** Class mocks need proper function syntax
**Fix:** Changed `vi.fn().mockImplementation(() => {...})` to `vi.fn().mockImplementation(function () {...})`

### Mutation Testing

Ran Stryker mutation testing to verify test quality:

| Metric | Initial | After Improvements |
|--------|---------|-------------------|
| Tests | 30 | 31 |
| Mutation Score | 45.19% | 62.69% |
| Mutants Killed | 56 | 84 |
| No Coverage | 6 | 2 |

**Key improvements:**
- Added error handling test for `connect()` catch block
- Added P2P event callback tests (onPeerConnected, onPeerDisconnected)
- Used captured callbacks pattern to simulate P2P events in tests

**Surviving mutants (acceptable):**
- Log message strings (don't affect behavior)
- Telemetry tracking strings (don't affect behavior)
- Some edge cases in fallback activation

### Commits (Phase A)

```
[A.3] feat(p2p): simplify to STUN-only configuration
[A.4] chore: remove Metered.ca TURN env variables
[A.1] feat(party): add PartyConnectionManager orchestration class
[A.2] test(party): add PartyConnectionManager unit tests
[bonus] test(party): add error handling and P2P event tests
```

### Phase A Complete! ✅

**Files created/modified:**
| File | Action |
|------|--------|
| `src/services/p2p-service.js` | Modified (STUN-only) |
| `src/services/party-connection-manager.js` | Created |
| `src/services/party-connection-manager.test.js` | Created |
| `.env.example` | Modified (removed TURN vars) |

---

## Session: 2026-01-13 (Phase B: View Integration)

### Progress

- [x] Task B.1: Update CreatePartyView
- [x] Task B.2: Update JoinPartyView + party-connection-store
- [x] Task B.3: Update PartyLobbyView
- [ ] Task B.4: Update PartyQuizView
- [ ] Task B.5: Update PartyResultsView
- [ ] Task B.6: Create ConnectionModeIndicator component

### Key Changes

**Task B.1: CreatePartyView**
- Import and initialize `PartyConnectionManager` as host after room creation
- Set up event handlers: `onModeChange`, `onPeerJoined`, `onPeerLeft`, `onError`
- Replace continuous HTTP polling with event-driven updates
- HTTP polling only starts in `HTTP_FALLBACK` mode
- Added `_updateConnectionStatus()` and `_pollParticipants()` helper methods

**Task B.2: JoinPartyView + party-connection-store**
- Created `party-connection-store.js` - simple module-level store to hold connection across view navigation
- Guest creates `PartyConnectionManager` after joining via API
- Connection stored in store before navigating to lobby
- P2P connection starts in background while navigating

**Task B.3: PartyLobbyView**
- Retrieve connection from store (set by JoinPartyView)
- Set up P2P event handlers for mode changes and peer events
- Add connection status bar with dynamic P2P/HTTP/Connecting states
- Only start HTTP polling in fallback mode or when no connection manager
- Clean up connection on view destroy via `clearConnection()`

### Design Decision: Connection Store

**Problem:** Views are destroyed on navigation, but P2P connection must survive JoinPartyView → PartyLobbyView transition.

**Solution:** Created `party-connection-store.js` - a module-level variable that holds the connection manager reference.

**Alternatives considered:**
- Option B: Create connection in LobbyView (simpler but worse UX - user waits twice)

**Why Option A (store) is better:**
- Earlier user feedback (connection status during join)
- Faster lobby load (already connecting)
- Better error handling (centralized in join view)
- Consistent pattern with host flow

### E2E Test Failures (To Fix at End of Phase B)

| Test | Error | Likely Cause |
|------|-------|--------------|
| `capture-party-demo.spec.js:322` | `Participants (2)` not visible | P2P/polling not updating participant list in E2E |
| `capture-party-demo.spec.js:459` | `Participants (2)` not visible | Same as above |
| `mode-toggle.spec.js:26` | Mode toggle visible when should be hidden | Feature flag config in test environment |
| `usage-cost.spec.js:181` (flaky) | Credits visible when API fails | Race condition or test isolation |

**P2P Errors in logs:**
- `Failed to execute 'addIceCandidate' on 'RTCPeerConnection': The remote description was null`
- CORS errors for telemetry (not critical)

### Commits (Phase B - In Progress)

```
feat(party): wire PartyConnectionManager to CreatePartyView
feat(party): wire PartyConnectionManager to JoinPartyView
fix(components): add proper return type to createRoomCodeInput
feat(party): wire PartyConnectionManager to PartyLobbyView
```

---

## Next Steps (When Resuming)

1. **Continue Phase B: View Integration**
   - Task B.4: Update PartyQuizView
   - Task B.5: Update PartyResultsView
   - Task B.6: Create ConnectionModeIndicator component
   - Fix E2E test failures (see table above)

2. **Branch:** Continue on `feature/party-p2p-decentralization`

3. **Verification:**
   - Run E2E tests: `npm run test:e2e`
   - Test party flow manually in browser
   - Deploy to staging after completion

---

## Status Summary

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | ✅ Complete | AdSense lazy-loading |
| A | ✅ Complete | P2P Foundation (PartyConnectionManager, STUN-only) |
| B | 🔄 In Progress | View Integration (B.1, B.2 done; B.3-B.6 pending) |
| C | ⏳ Pending | Server Minimization |
| D | ⏳ Pending | STUN Testing |
| E | ⏳ Pending | Testing & Validation |
| F | ⏳ Pending | Production Rollout |

---

## References

- [PARTY_MODE_TURN_SERVER.md](./PARTY_MODE_TURN_SERVER.md) - Previous TURN implementation (not used)
- [EPIC6_SHARING_PLAN.md](./EPIC6_SHARING_PLAN.md) - Parent epic plan
- [PHASE3_PARTY_SESSION.md](./PHASE3_PARTY_SESSION.md) - Original party session design
