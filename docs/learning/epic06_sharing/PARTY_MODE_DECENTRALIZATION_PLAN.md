# Party Mode Decentralization Plan

**Status:** DRAFT - Awaiting Validation (v3 - Complete with Maestro, Staging, Feature Flags)
**Created:** 2026-01-13
**Updated:** 2026-01-13
**Parent:** [Epic 6 Plan](./EPIC6_SHARING_PLAN.md)

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Goals & Principles](#goals--principles)
3. [Architecture Overview](#architecture-overview)
4. [Branch & Commit Strategy](#branch--commit-strategy)
5. [Feature Flags Strategy](#feature-flags-strategy)
6. [Phase 0: AdSense Permission Fix](#phase-0-adsense-permission-fix)
7. [Phase A: P2P Foundation](#phase-a-p2p-foundation)
8. [Phase B: View Integration](#phase-b-view-integration)
9. [Phase C: Server Minimization](#phase-c-server-minimization)
10. [Phase D: STUN Testing & TURN Evaluation](#phase-d-stun-testing--turn-evaluation)
11. [Phase E: Testing & Validation](#phase-e-testing--validation)
12. [Phase F: Production Rollout](#phase-f-production-rollout)
13. [Fallback Strategy](#fallback-strategy)
14. [Privacy Comparison](#privacy-comparison)
15. [Risk Assessment](#risk-assessment)
16. [File Change Summary](#file-change-summary)
17. [Success Criteria](#success-criteria)

---

## Problem Statement

### Current Issues

1. **False Permission Prompt**: Chrome asks for "local network access" permission when joining a party - this is caused by **Google AdSense**, not party code.

2. **Centralized Architecture**: Current implementation uses HTTP polling where ALL data flows through the server:
   - Full quiz content stored in `party_rooms.quiz_data`
   - All participant names stored in `party_participants`
   - All answers stored in `party_answers`
   - Scores calculated and stored server-side

3. **Dead Code**: P2PService, SignalingClient, and PartySession were built for WebRTC P2P but are **not wired to views**. Views use `party-api.js` HTTP polling instead.

4. **Privacy Concerns**: Server stores more data than necessary for coordination.

### Data Currently Stored on Server

| Table | Columns | Privacy Risk |
|-------|---------|--------------|
| `party_rooms` | `quiz_data` (full JSON with questions/answers) | **HIGH** |
| `party_rooms` | `host_name`, `host_id` | Medium |
| `party_participants` | `name`, `participant_id`, `score` | Medium |
| `party_answers` | `answer_index`, `is_correct`, `points` | **HIGH** |
| `party_signaling` | WebRTC offer/answer/ICE (ephemeral) | Low |
| `party_rate_limits` | `ip_address` | Medium |

---

## Goals & Principles

### Primary Goals

1. **Fix the permission prompt** - Caused by AdSense, not party code
2. **Decentralize data flow** - Quiz content and answers via P2P, not server
3. **Minimize server storage** - Only store what's necessary for coordination
4. **Maintain reliability** - HTTP fallback when P2P fails

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Privacy by default** | No personal data on server |
| **P2P first, HTTP fallback** | Try WebRTC, fall back to HTTP if needed |
| **Coordinator model** | Host is source of truth (simple, no CRDT needed) |
| **Ephemeral data** | Server data auto-deleted after session |
| **No external dependencies** | Use free STUN servers, avoid paid services |
| **Graceful degradation** | HTTP fallback if P2P fails |

---

## Architecture Overview

### Target Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DECENTRALIZED PARTY MODE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    SERVER (Minimal Role)                     │   │
│  │                                                              │   │
│  │  Stores:                        Does NOT store:             │   │
│  │  ├─ Room code (6 chars)         ├─ Quiz content ❌          │   │
│  │  ├─ Participant count           ├─ Participant names ❌     │   │
│  │  ├─ Room status                 ├─ Answers ❌               │   │
│  │  ├─ Signaling (5 min TTL)       ├─ Scores ❌                │   │
│  │  └─ Created timestamp           └─ Host name ❌             │   │
│  │                                                              │   │
│  │  Auto-cleanup: Rooms deleted after 2 hours                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                    Signaling │ (WebRTC setup only)                  │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    P2P LAYER (WebRTC)                        │   │
│  │                                                              │   │
│  │         ┌──────────────────────────────────────┐            │   │
│  │         │              HOST                     │            │   │
│  │         │  • Has quiz data                     │            │   │
│  │         │  • Calculates scores                 │            │   │
│  │         │  • Broadcasts state                  │            │   │
│  │         └────────────┬─────────────────────────┘            │   │
│  │                      │ WebRTC Data Channels                 │   │
│  │         ┌────────────┼────────────┐                         │   │
│  │         ▼            ▼            ▼                         │   │
│  │    ┌────────┐   ┌────────┐   ┌────────┐                    │   │
│  │    │ Guest1 │   │ Guest2 │   │ Guest3 │                    │   │
│  │    └────────┘   └────────┘   └────────┘                    │   │
│  │                                                              │   │
│  │  Messages:                                                  │   │
│  │  • SESSION_INFO (host → guests): quiz, settings, names     │   │
│  │  • ANSWER (guest → host): questionIndex, answerIndex       │   │
│  │  • SCORE_UPDATE (host → guests): all scores                │   │
│  │  • QUIZ_START/END (host → guests): timing sync             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                    Fallback  │ (if P2P fails)                       │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  HTTP FALLBACK (Current MVP)                 │   │
│  │                                                              │   │
│  │  • Only activated if P2P connection fails                   │   │
│  │  • Uses existing party-api.js endpoints                     │   │
│  │  • Stores data on server (privacy trade-off for reliability)│   │
│  │  • Logged to telemetry for monitoring                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Connection Flow

```
1. Host creates room
   ├─ Server: Generate room code, store minimal metadata
   ├─ Host: Initialize P2PService, start signaling subscription
   └─ UI: Show room code, wait for guests

2. Guest joins room
   ├─ Server: Validate room exists, return host ID
   ├─ Guest: Connect to signaling, send WebRTC offer to host
   ├─ Host: Receive offer, send answer
   ├─ Both: Exchange ICE candidates
   └─ Result: P2P data channel established

3. P2P established
   ├─ Host: Send SESSION_INFO (quiz data, settings)
   ├─ Guest: Receive quiz, display lobby
   └─ Mode: P2P_MODE active

4. P2P fails (fallback)
   ├─ Detect: Connection timeout or repeated failures
   ├─ Switch: Activate HTTP polling mode
   ├─ Log: Track in telemetry
   └─ Mode: HTTP_FALLBACK active
```

---

## Branch & Commit Strategy

### Branch Naming

All work for this plan will be done on a feature branch from `main`:

```
feature/party-p2p-decentralization
```

### Commit Strategy

**Commit per logical unit** - Each commit should be self-contained and buildable:

| Phase | Commits |
|-------|---------|
| Phase 0 | 1-2 commits (AdSense loader + index.html removal) |
| Phase A | 2-3 commits (PartyConnectionManager + tests, P2P simplification) |
| Phase B | 1 commit per view (5-6 commits) |
| Phase C | 2-3 commits (API changes, migrations) |
| Phase D | 1 commit (STUN config + telemetry) |
| Phase E | 1-2 commits (test additions) |
| Phase F | 1 commit (feature flag enable) |

### Commit Message Format

Follow existing project convention:

```
type(scope): description

- Additional details if needed
- References to related files

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

**Examples:**
```
feat(party): add lazy-loaded AdSense loader utility
feat(party): create PartyConnectionManager for P2P orchestration
refactor(party): simplify p2p-service to use STUN-only
test(party): add E2E tests for P2P party flow
feat(party): enable PARTY_SESSION flag for production
```

### Merge Strategy

1. Complete each phase on the feature branch
2. Deploy to staging after each phase
3. Validate on staging before continuing
4. Squash merge to main only after Phase F validation
5. Delete feature branch after merge

---

## Feature Flags Strategy

### Existing Feature Flags

```javascript
// src/core/features.js
export const FEATURE_FLAGS = {
  SHOW_ADS: { phase: 'ENABLED' },           // Ads on ResultsView
  MODE_TOGGLE: { phase: 'ENABLED' },         // Learning/Party mode toggle
  PARTY_SESSION: {
    phase: getEnvironment() === 'production' ? 'DISABLED' : 'ENABLED',
  }
};
```

### How Feature Flags Will Be Used

| Phase | Flag Usage |
|-------|------------|
| Phase 0 | `SHOW_ADS` - Only load AdSense when this is enabled AND on ad page |
| Phase A-D | No flag changes - Work under existing `PARTY_SESSION` (staging only) |
| Phase E | Test with `PARTY_SESSION: ENABLED` on staging |
| Phase F | Change `PARTY_SESSION` to `ENABLED` for production |

### New Feature Flag (Optional)

Consider adding a P2P-specific flag for gradual rollout:

```javascript
PARTY_P2P: {
  phase: getEnvironment() === 'production' ? 'DISABLED' : 'ENABLED',
  description: 'Use P2P for party communication (vs HTTP polling)'
}
```

This allows:
- Deploy code to production with P2P disabled
- Enable HTTP-only party mode first
- Enable P2P mode separately

**Decision:** This is optional and can be added if we want more granular control.

### Rollback via Feature Flags

If P2P causes issues in production:

1. Set `PARTY_P2P: DISABLED` (if added) - Falls back to HTTP polling
2. Or set `PARTY_SESSION: DISABLED` - Disables party mode entirely
3. Redeploy

No code changes needed for rollback.

---

## Phase 0: AdSense Permission Fix

**Goal:** Stop Google AdSense from triggering Chrome's "local network access" permission prompt.

### Background

The permission prompt appears because **Google AdSense uses WebRTC** for:
- Device fingerprinting
- Network topology discovery
- Real-time bidding optimization

This happens on ALL pages, not just party pages.

### Solution: Lazy-Load AdSense

Only load AdSense script on pages where ads are actually shown.

### Tasks

#### 0.1: Identify Ad Placements

**Current state:**
- AdSense script loaded globally in `index.html`
- Ads shown on: ResultsView (after quiz completion)
- Ads NOT shown on: Party views, Quiz views, Home view

**Action:** Verify where ads are actually displayed.

#### 0.2: Create AdSense Loader Utility

**File:** `src/utils/adsense-loader.js`

```javascript
/**
 * AdSense Lazy Loader
 *
 * Loads Google AdSense script only when needed.
 * Prevents WebRTC permission prompts on non-ad pages.
 */

let adsenseLoaded = false;
let adsensePromise = null;

export async function loadAdSense() {
  if (adsenseLoaded) return true;

  if (adsensePromise) return adsensePromise;

  adsensePromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9849708569219157';
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      adsenseLoaded = true;
      resolve(true);
    };

    script.onerror = () => {
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return adsensePromise;
}

export function isAdSenseLoaded() {
  return adsenseLoaded;
}
```

#### 0.3: Remove Global AdSense from index.html

**File:** `index.html`

Remove lines 19-21:
```html
<!-- REMOVE THIS -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9849708569219157"
    crossorigin="anonymous"></script>
```

#### 0.4: Update Ad Components to Lazy-Load

**File:** `src/components/AdBanner.js` (or wherever ads are rendered)

```javascript
import { loadAdSense } from '../utils/adsense-loader.js';

async function showAd() {
  await loadAdSense();
  // ... existing ad display logic
}
```

#### 0.5: Update ResultsView

Load AdSense only when displaying results with ads.

### Tests

- [ ] Manual: Verify no permission prompt on party join
- [ ] Manual: Verify ads still work on ResultsView
- [ ] E2E: Party flow without permission prompt

### Deliverables

| File | Action |
|------|--------|
| `src/utils/adsense-loader.js` | CREATE |
| `index.html` | MODIFY (remove AdSense script) |
| `src/components/AdBanner.js` | MODIFY (lazy-load) |
| `src/views/ResultsView.js` | MODIFY (lazy-load) |

---

## Phase A: P2P Foundation

**Goal:** Create orchestration layer that coordinates P2PService, SignalingClient, and PartySession.

### Background

The following services exist but aren't connected:
- `SignalingClient.js` - HTTP polling for WebRTC signaling
- `P2PService.js` - WebRTC connection management
- `PartySession.js` - Quiz state management

Need a manager to orchestrate these and provide simple API for views.

### Tasks

#### A.1: Create PartyConnectionManager

**File:** `src/services/party-connection-manager.js`

This service will:
- Initialize SignalingClient with room code
- Create P2PService with SignalingClient
- Create PartySession with P2PService
- Handle connection lifecycle
- Manage fallback to HTTP mode
- Emit events for views

**Interface:**

```javascript
export class PartyConnectionManager {
  constructor(roomCode, participantId, isHost) { }

  // Lifecycle
  async connect()           // Start P2P connection process
  async disconnect()        // Clean shutdown
  destroy()                 // Cleanup all resources

  // State
  getMode()                 // 'connecting' | 'p2p' | 'http_fallback' | 'disconnected'
  getSession()              // Returns PartySession for quiz operations
  isConnected()             // Boolean

  // Events
  onModeChange(callback)    // Mode changed (p2p ↔ http)
  onPeerJoined(callback)    // New peer connected
  onPeerLeft(callback)      // Peer disconnected
  onError(callback)         // Connection error

  // Host-only
  getPeers()                // List of connected peer IDs

  // Guest-only
  getHostId()               // Host's peer ID
}
```

**State Machine:**

```
                    ┌─────────────┐
                    │   INITIAL   │
                    └──────┬──────┘
                           │ connect()
                           ▼
                    ┌─────────────┐
              ┌─────│ CONNECTING  │─────┐
              │     └─────────────┘     │
              │ P2P success      P2P fail (after retries)
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │    P2P      │          │HTTP_FALLBACK│
       └──────┬──────┘          └──────┬──────┘
              │ disconnect()            │ disconnect()
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │DISCONNECTED │          │DISCONNECTED │
       └─────────────┘          └─────────────┘
```

#### A.2: Create PartyConnectionManager Tests

**File:** `src/services/party-connection-manager.test.js`

Test cases:
- Successful P2P connection as host
- Successful P2P connection as guest
- Fallback to HTTP on P2P failure
- Reconnection attempts
- Clean disconnect
- Event callbacks

#### A.3: Simplify P2PService ICE Configuration

**File:** `src/services/p2p-service.js`

Update to use STUN-only (remove TURN complexity):

```javascript
/**
 * STUN servers (free, no external service needed).
 */
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * Get ICE servers. Currently STUN-only.
 * TURN can be added later if testing reveals connectivity issues.
 */
function getIceServers() {
  return ICE_SERVERS;
}
```

Remove:
- Async TURN credential fetching
- Metered.ca API calls
- `iceTransportPolicy: 'relay'`
- Cache for TURN credentials

#### A.4: Clean Up Environment Variables

**Files:** `.env.example`

Comment out or remove TURN-related variables:
```
# TURN Server (not needed with STUN-first approach)
# Only uncomment if STUN proves insufficient after testing
# VITE_METERED_API_KEY=your-api-key
# VITE_METERED_APP_NAME=saberloop
```

### Tests

- [ ] Unit: PartyConnectionManager state machine
- [ ] Unit: P2P connection success path
- [ ] Unit: HTTP fallback path
- [ ] Unit: Event callbacks

### Deliverables

| File | Action |
|------|--------|
| `src/services/party-connection-manager.js` | CREATE |
| `src/services/party-connection-manager.test.js` | CREATE |
| `src/services/p2p-service.js` | MODIFY (simplify to STUN-only) |
| `.env.example` | MODIFY (comment out TURN vars) |

---

## Phase B: View Integration

**Goal:** Update party views to use PartyConnectionManager instead of HTTP polling.

### Tasks

#### B.1: Update CreatePartyView

**File:** `src/views/CreatePartyView.js`

Changes:
1. After room creation, initialize PartyConnectionManager as host
2. Wait for signaling to be ready before showing room code
3. Show connection status (connecting/ready)
4. Pass session to lobby view

**Current flow:**
```
createRoom() → API creates room → navigate to lobby
```

**New flow:**
```
createRoom() → API creates room → init P2P manager → wait for ready → navigate to lobby
```

#### B.2: Update JoinPartyView

**File:** `src/views/JoinPartyView.js`

Changes:
1. After joining room, initialize PartyConnectionManager as guest
2. Attempt P2P connection to host
3. Show connection status
4. On success: navigate to lobby with session
5. On P2P fail: activate HTTP fallback, navigate to lobby

**Current flow:**
```
joinRoom() → API joins room → navigate to lobby
```

**New flow:**
```
joinRoom() → API joins room → init P2P manager → connect to host → navigate to lobby
```

#### B.3: Update PartyLobbyView

**File:** `src/views/PartyLobbyView.js`

Changes:
1. Receive PartyConnectionManager from previous view
2. Get participant list from P2P session (or HTTP fallback)
3. Listen for participant changes via P2P events
4. Remove HTTP polling (except in fallback mode)
5. Show connection mode indicator (P2P / HTTP)

**Current:** HTTP polling every 2 seconds
**New:** P2P events (instant) or HTTP polling (fallback only)

#### B.4: Update PartyQuizView

**File:** `src/views/PartyQuizView.js`

Changes:
1. Receive PartyConnectionManager from lobby
2. Get quiz data from P2P session
3. Submit answers via P2P (or HTTP fallback)
4. Receive score updates via P2P (or HTTP polling)
5. Remove redundant HTTP polling code

**Current:** Lines 157-160 check for session, else use HTTP polling
**New:** Always use PartyConnectionManager (handles mode internally)

#### B.5: Update PartyResultsView

**File:** `src/views/PartyResultsView.js`

Changes:
1. Get final standings from session
2. Clean up P2P connection
3. Load AdSense for ads (lazy-load)

#### B.6: Add Connection Mode Indicator Component

**File:** `src/components/ConnectionModeIndicator.js`

Small UI component showing connection mode:
- Green dot + "P2P" when in P2P mode
- Yellow dot + "Server" when in HTTP fallback mode

### Tests

- [ ] E2E: Full party flow with P2P
- [ ] E2E: Party flow with simulated P2P failure (HTTP fallback)
- [ ] Unit: Each view with mocked PartyConnectionManager

### Deliverables

| File | Action |
|------|--------|
| `src/views/CreatePartyView.js` | MODIFY |
| `src/views/JoinPartyView.js` | MODIFY |
| `src/views/PartyLobbyView.js` | MODIFY |
| `src/views/PartyQuizView.js` | MODIFY |
| `src/views/PartyResultsView.js` | MODIFY |
| `src/components/ConnectionModeIndicator.js` | CREATE |

---

## Phase C: Server Minimization

**Goal:** Remove unnecessary data from server storage.

### Tasks

#### C.1: Update Room Creation Endpoint

**File:** `php-api/party/endpoints/rooms.php`

Changes:
- Don't accept `quizData` in request body
- Don't store `quiz_data` in database
- Don't store `host_name` (only store anonymous `host_id`)

**Before:**
```php
$roomData = $roomManager->createRoom(
    $data['hostId'],
    $data['hostName'],
    $data['quizData'] ?? null,
    $data['secondsPerQuestion'] ?? 30
);
```

**After:**
```php
$roomData = $roomManager->createRoom(
    $data['hostId'],
    $data['secondsPerQuestion'] ?? 30
);
```

#### C.2: Update RoomManager

**File:** `php-api/party/RoomManager.php`

Changes:
- Remove `quiz_data` parameter from `createRoom()`
- Remove `host_name` parameter
- Add room expiry logic (2 hour TTL)
- Add cleanup method for expired rooms

#### C.3: Update Join Endpoint

**File:** `php-api/party/endpoints/rooms.php` (join action)

Changes:
- Don't store participant name in database
- Only increment anonymous participant counter
- Return host_id for P2P connection

#### C.4: Deprecate Answer Endpoint

**File:** `php-api/party/endpoints/rooms.php` (answer action)

Changes:
- Keep endpoint for HTTP fallback mode
- Add deprecation notice in response
- Log usage for monitoring fallback frequency

#### C.5: Add Database Cleanup

**File:** `php-api/party/cleanup.php`

Create a cleanup script (run via cron):
```php
// Delete rooms older than 2 hours
// Delete signaling messages older than 5 minutes
// Delete rate limit records older than 1 hour
```

#### C.6: Create Migration for Schema Changes

**File:** `php-api/party/migrations/003_minimize_data.sql`

```sql
-- Make quiz_data nullable (for backward compatibility)
ALTER TABLE party_rooms
  MODIFY COLUMN quiz_data JSON NULL;

-- Make host_name nullable
ALTER TABLE party_rooms
  MODIFY COLUMN host_name VARCHAR(50) NULL;

-- Add expires_at column for automatic cleanup
ALTER TABLE party_rooms
  ADD COLUMN expires_at TIMESTAMP NULL
  AFTER ended_at;

-- Set default expiry (2 hours from creation)
UPDATE party_rooms
  SET expires_at = DATE_ADD(created_at, INTERVAL 2 HOUR)
  WHERE expires_at IS NULL;
```

### Tests

- [ ] Integration: Room creation without quiz data
- [ ] Integration: Join without storing name
- [ ] Integration: Cleanup script works correctly

### Deliverables

| File | Action |
|------|--------|
| `php-api/party/endpoints/rooms.php` | MODIFY |
| `php-api/party/RoomManager.php` | MODIFY |
| `php-api/party/cleanup.php` | CREATE |
| `php-api/party/migrations/003_minimize_data.sql` | CREATE |

---

## Phase D: STUN Testing & TURN Evaluation

**Goal:** Test P2P with STUN-only (no external service). Add TURN only if needed.

### Background

**Why STUN-first:**
- No external service dependency (Google provides free STUN servers)
- Simpler architecture
- Works for most network configurations
- The current permission prompt is from AdSense, not WebRTC

**STUN vs TURN comparison:**

| Aspect | STUN | TURN |
|--------|------|------|
| External service | No (Google free) | Yes (Metered.ca) |
| Monthly cost | Free | Free tier 500GB |
| How it works | Discovers public IP | Relays all traffic |
| Permission prompt | Possible (gathers local IPs) | No with `relay` mode |
| Network compatibility | Most cases | All cases |
| Latency | Lower (direct) | Higher (relayed) |

### Approach

1. Start with STUN-only configuration
2. Test thoroughly on staging
3. Only add TURN if we encounter:
   - Permission prompts blocking PWA usage
   - Connection failures on certain networks
   - User complaints about connectivity

### Tasks

#### D.1: Configure STUN-Only

**File:** `src/services/p2p-service.js`

Update ICE configuration to use STUN only:

```javascript
/**
 * Default STUN servers (free, no service needed).
 */
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

/**
 * Get ICE servers configuration.
 * Currently STUN-only. TURN can be added later if needed.
 */
function getIceServers() {
  return ICE_SERVERS;
}
```

**Remove or comment out:**
- `iceTransportPolicy: 'relay'` (this requires TURN)
- TURN credential fetching from Metered.ca
- Metered.ca environment variables

#### D.2: Remove TURN Dependencies

**File:** `src/services/p2p-service.js`

Simplify `_createPeerConnection`:

```javascript
_createPeerConnection(peerId) {
  const connection = new RTCPeerConnection({
    iceServers: ICE_SERVERS,
    // No iceTransportPolicy - allow all candidate types
  });
  // ... rest of method
}
```

#### D.3: Add Connection Telemetry

**File:** `src/services/p2p-service.js`

Track connection metrics to evaluate if TURN is needed later:

```javascript
// Track ICE candidate types gathered
connection.onicecandidate = (event) => {
  if (event.candidate) {
    const candidateType = event.candidate.type; // 'host', 'srflx', 'relay'
    telemetry.track('p2p_ice_candidate', { type: candidateType });
    // ... send to peer
  }
};

// Track connection success/failure
connection.onconnectionstatechange = () => {
  telemetry.track('p2p_connection_state', {
    state: connection.connectionState,
    iceState: connection.iceConnectionState,
  });
};
```

#### D.4: Test on Staging

**Test matrix (after AdSense fix):**

| Scenario | Test | Expected | If Fails |
|----------|------|----------|----------|
| Same WiFi | 2 devices same network | P2P direct | Should work |
| Different networks | 2 devices on different WiFi | P2P via STUN | May need TURN |
| Mobile data | Phone on 4G, desktop on WiFi | P2P via STUN | May need TURN |
| PWA | Installed PWA joining party | P2P works | Check permission |

#### D.5: Document TURN Fallback Plan

If STUN proves insufficient, TURN can be added later:

1. Re-enable Metered.ca credential fetching
2. Add `iceTransportPolicy: 'relay'` for PWA context only
3. Keep STUN as primary for browser context

**Decision criteria for adding TURN:**
- [ ] PWA users report permission prompts (after AdSense fix)
- [ ] >10% connection failure rate in telemetry
- [ ] Users on mobile data can't connect

### Tests

- [ ] Manual: P2P works on same network (STUN)
- [ ] Manual: P2P works across networks (STUN)
- [ ] Manual: Check if permission prompt appears (after AdSense fix)
- [ ] Manual: Test in PWA context
- [ ] Telemetry: Monitor ICE candidate types and connection success rate

### Deliverables

| File | Action |
|------|--------|
| `src/services/p2p-service.js` | MODIFY (STUN-only config, telemetry) |
| `.env.example` | MODIFY (remove/comment TURN vars) |

### Future: Adding TURN (if needed)

**Only if testing reveals issues**, create a follow-up task:

1. Re-enable Metered.ca integration
2. Fetch TURN credentials dynamically
3. Use `iceTransportPolicy: 'relay'` for PWA
4. Keep STUN for regular browser (lower latency)

---

## Phase E: Testing & Validation

**Goal:** Comprehensive testing before production rollout.

### Deployment Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    STAGING-FIRST DEPLOYMENT                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Local Development                                           │
│     ├─ npm test (unit tests)                                   │
│     ├─ npm run build (verify builds)                           │
│     └─ npm run test:e2e (Playwright)                           │
│                           │                                     │
│                           ▼                                     │
│  2. Push to Feature Branch                                      │
│     ├─ GitHub Actions runs CI                                  │
│     │   ├─ Unit tests                                          │
│     │   ├─ E2E tests                                           │
│     │   └─ Build verification                                  │
│     └─ Wait for green checks                                   │
│                           │                                     │
│                           ▼                                     │
│  3. Deploy to Staging                                           │
│     ├─ npm run deploy -- --staging                             │
│     ├─ URL: https://saberloop.com/app-staging/                 │
│     └─ Verify deployment successful                            │
│                           │                                     │
│                           ▼                                     │
│  4. Staging Validation                                          │
│     ├─ Manual multi-device testing                             │
│     ├─ Maestro mobile E2E tests                                │
│     └─ Review telemetry data                                   │
│                           │                                     │
│                           ▼                                     │
│  5. Production Deploy (Phase F only)                            │
│     ├─ npm run deploy                                          │
│     ├─ URL: https://saberloop.com/app/                         │
│     └─ Monitor for issues                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tasks

#### E.1: Unit Test Coverage

Verify coverage for:
- [ ] `party-connection-manager.js` (new)
- [ ] `p2p-service.js` (existing + new telemetry)
- [ ] `party-session.js` (existing)
- [ ] `signaling-client.js` (existing)
- [ ] `adsense-loader.js` (new)

Target: 80%+ coverage on new code.

**Run:**
```bash
npm run test:coverage
```

#### E.2: E2E Test Updates (Playwright)

**File:** `tests/e2e/party-*.spec.js`

Update E2E tests:
- [ ] Create party (P2P mode)
- [ ] Join party (P2P mode)
- [ ] Full quiz flow (P2P mode)
- [ ] Fallback to HTTP (simulate P2P failure)
- [ ] No permission prompt (AdSense lazy-loaded)

**Run:**
```bash
npm run test:e2e
npm run test:e2e:ui  # Debug mode
```

#### E.3: Maestro Mobile E2E Tests

**Existing Maestro flows** (`.github/workflows/maestro.yml`):
- `01-first-visit.yaml` - Initial app load
- `02-home-return.yaml` - Home navigation
- `03-quiz-generation.yaml` - Quiz creation
- `04-quiz-flow.yaml` - Full quiz flow
- `05-empty-quiz.yaml` - Error handling
- `06-openrouter-settings.yaml` - Settings
- `09-quiz-history.yaml` - History view
- `10-quiz-detail.yaml` - Detail view
- `11-share-quiz-whatsapp.yaml` - WhatsApp sharing
- `12-share-quiz-copy.yaml` - Copy link
- `13-results-explanation.yaml` - Explanation feature
- `14-language-switcher.yaml` - i18n

**New Maestro flows to create:**

| Flow | Description | File |
|------|-------------|------|
| `15-party-create.yaml` | Host creates party room | NEW |
| `16-party-join.yaml` | Guest joins with code | NEW |
| `17-party-quiz-flow.yaml` | Full party quiz (needs 2 devices) | NEW |
| `18-party-results.yaml` | Party results display | NEW |

**Run Maestro tests:**
```bash
# Via GitHub Actions
# Add label 'maestro-test' to PR, or manual trigger

# Locally (requires Maestro installed + emulator)
maestro test tests/maestro/15-party-create.yaml
```

**Maestro test considerations:**
- Party mode requires 2 devices - may need separate host/guest flows
- Can test single-device flows (create, join validation)
- Full P2P testing requires manual multi-device testing

#### E.4: i18n Verification

Verify all party strings present in all 9 locales:
- [ ] `en` (English)
- [ ] `pt` (Portuguese)
- [ ] `es` (Spanish)
- [ ] `fr` (French)
- [ ] `de` (German)
- [ ] `it` (Italian)
- [ ] `nl` (Dutch)
- [ ] `pl` (Polish)
- [ ] `ru` (Russian)

**Run i18n check:**
```bash
npm run check:i18n  # If exists, or manual verification
```

#### E.5: Multi-Device Testing on Staging

**Staging URL:** `https://saberloop.com/app-staging/`

Test matrix:
| Host Device | Guest Device | Network | Expected |
|-------------|--------------|---------|----------|
| Desktop Chrome | Desktop Chrome | Same WiFi | P2P |
| Desktop Chrome | Mobile Chrome | Same WiFi | P2P |
| Desktop Chrome | Mobile Chrome | Different networks | P2P (STUN) |
| Android PWA | Android PWA | Same WiFi | P2P |
| Android PWA | Android PWA | Mobile data | P2P (STUN) or HTTP fallback |

**Test procedure:**
1. Deploy to staging: `npm run deploy -- --staging`
2. Open staging URL on both devices
3. Host creates party, guest joins with code
4. Complete quiz flow
5. Check connection mode indicator (P2P vs Server)
6. Review browser console for errors
7. Check telemetry dashboard for connection metrics

#### E.6: Edge Case Testing

- [ ] Host disconnects mid-quiz
- [ ] Guest disconnects mid-quiz
- [ ] Guest rejoins after disconnect
- [ ] 5+ participants (stress test)
- [ ] Slow network (STUN/HTTP fallback performance)

### Deliverables

| File | Action |
|------|--------|
| `tests/e2e/party-p2p.spec.js` | CREATE |
| `tests/e2e/party-fallback.spec.js` | CREATE |
| `tests/maestro/15-party-create.yaml` | CREATE |
| `tests/maestro/16-party-join.yaml` | CREATE |
| `tests/maestro/17-party-quiz-flow.yaml` | CREATE |
| `tests/maestro/18-party-results.yaml` | CREATE |
| Various test files | MODIFY |

### Staging Validation Checklist

Before proceeding to Phase F (Production):

- [ ] All unit tests pass (`npm test`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] Maestro tests pass (GitHub Actions)
- [ ] Manual multi-device testing on staging
- [ ] No permission prompts observed (AdSense fix verified)
- [ ] P2P connections successful on same network
- [ ] HTTP fallback works when P2P disabled
- [ ] i18n strings complete for all locales
- [ ] Telemetry showing connection metrics
- [ ] No console errors during party flow

---

## Phase F: Production Rollout

**Goal:** Enable Party Mode in production after staging validation.

### Prerequisites

- [ ] Phase E Staging Validation Checklist complete
- [ ] No critical issues identified on staging
- [ ] Rollback plan understood by team

### Tasks

#### F.1: Pre-Rollout Checklist

**Automated checks (must pass):**
- [ ] All unit tests pass (`npm test -- --run`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] Build succeeds (`npm run build`)
- [ ] GitHub Actions CI green

**Manual checks (staging):**
- [ ] Multi-device party session works on staging
- [ ] P2P mode connects (check indicator)
- [ ] HTTP fallback works when P2P blocked
- [ ] No permission prompts on party join
- [ ] Telemetry shows connection data
- [ ] No console errors during flow

#### F.2: Enable Feature Flag

**File:** `src/core/features.js`

Change PARTY_SESSION from DISABLED to ENABLED for production:

```javascript
// Before
PARTY_SESSION: {
  phase: getEnvironment() === 'production' ? 'DISABLED' : 'ENABLED',
}

// After
PARTY_SESSION: {
  phase: 'ENABLED',
}
```

**Commit:**
```bash
git add src/core/features.js
git commit -m "feat(party): enable PARTY_SESSION flag for production

- P2P decentralized party mode now available to all users
- HTTP fallback ensures reliability
- Staging validation complete

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

#### F.3: Final Staging Deploy & Verify

Before production, deploy feature flag change to staging:

```bash
# Build
npm run build

# Deploy to staging first
npm run deploy -- --staging

# Verify on staging
# URL: https://saberloop.com/app-staging/
# 1. Create party
# 2. Join from another device
# 3. Complete quiz
# 4. Verify no issues
```

#### F.4: Deploy to Production

```bash
# Deploy to production
npm run deploy

# URL: https://saberloop.com/app/
```

**Immediate smoke test (2-3 minutes):**
1. Open production URL on desktop
2. Open on mobile
3. Create party on desktop
4. Join from mobile
5. Verify lobby shows both participants
6. (Optional) Complete full quiz flow

#### F.5: Monitor Telemetry (First 24-48 hours)

**Key metrics to watch:**

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| P2P connection success | >80% | 60-80% | <60% |
| HTTP fallback usage | <20% | 20-40% | >40% |
| Party sessions created | Any | N/A | Zero |
| Error rate | <5% | 5-15% | >15% |

**Telemetry dashboard:**
- Check Grafana/Loki for error logs
- Review `p2p_connection_success` events
- Review `p2p_fallback_activated` events

#### F.6: Rollback Plan

**Trigger conditions for rollback:**
- Error rate >15% for 1+ hour
- P2P connection success <50%
- Critical bug reports from users
- Permission prompts appearing (AdSense fix failed)

**Rollback procedure (5 minutes):**

```bash
# 1. Revert feature flag
# In src/core/features.js, change back to:
PARTY_SESSION: {
  phase: getEnvironment() === 'production' ? 'DISABLED' : 'ENABLED',
}

# 2. Commit
git add src/core/features.js
git commit -m "fix(party): disable PARTY_SESSION in production (rollback)

- Issue: [describe issue]
- Will investigate on staging

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# 3. Build and deploy
npm run build
npm run deploy

# 4. Verify party mode is no longer accessible in production
# Party button should not appear in Mode toggle
```

**Post-rollback:**
1. Investigate issue on staging
2. Fix and re-validate
3. Re-deploy when fixed

### Deliverables

| File | Action |
|------|--------|
| `src/core/features.js` | MODIFY (enable flag) |
| Production deployment | EXECUTE |
| Telemetry monitoring | VERIFY |

### Post-Rollout Tasks

After successful production rollout:

1. **Merge feature branch to main:**
   ```bash
   git checkout main
   git pull
   git merge feature/party-p2p-decentralization
   git push
   ```

2. **Delete feature branch:**
   ```bash
   git branch -d feature/party-p2p-decentralization
   git push origin --delete feature/party-p2p-decentralization
   ```

3. **Update documentation:**
   - Mark this plan as COMPLETE
   - Update EPIC6_SHARING_PLAN.md status
   - Add learning notes for session

4. **Monitor for 1 week:**
   - Review telemetry daily
   - Address any user-reported issues
   - Consider TURN addition if connection issues reported

---

## Fallback Strategy

### When to Fallback

P2P → HTTP fallback triggers when:
1. WebRTC connection fails after 3 attempts
2. TURN server unreachable
3. Data channel fails to open
4. Timeout (30 seconds with no connection)

### Fallback Behavior

| Aspect | P2P Mode | HTTP Fallback Mode |
|--------|----------|-------------------|
| Quiz data | Host → Guests via WebRTC | Stored on server |
| Answers | Guest → Host via WebRTC | Submitted to server |
| Scores | Host → Guests via WebRTC | Polled from server |
| Latency | ~50-200ms | ~500-1000ms |
| Privacy | Maximum | Reduced |
| Reliability | Depends on network | High |

### User Experience

- Connection mode indicator shows current mode
- Seamless transition (user doesn't need to do anything)
- Telemetry tracks fallback frequency for monitoring

---

## Privacy Comparison

### Before (Current State)

| Data | On Server | Duration |
|------|-----------|----------|
| Quiz questions & answers | Yes | Until room ends |
| Participant names | Yes | Until room ends |
| All submitted answers | Yes | Until room ends |
| Scores | Yes | Until room ends |
| IP addresses | Yes | 1 hour |

### After (P2P Mode)

| Data | On Server | Duration |
|------|-----------|----------|
| Room code | Yes | 2 hours max |
| Anonymous participant count | Yes | 2 hours max |
| Signaling messages | Yes | 5 minutes max |
| Quiz content | **No** | N/A |
| Participant names | **No** | N/A |
| Answers | **No** | N/A |
| Scores | **No** | N/A |

### After (HTTP Fallback Mode)

Same as "Before" - full data on server (trade-off for reliability).

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| WebRTC compatibility issues | Low | Medium | HTTP fallback |
| STUN insufficient for some networks | Medium | Medium | Add TURN later if needed |
| Permission prompt in PWA (after AdSense fix) | Low | Medium | Monitor, add TURN if needed |
| Complex debugging | Medium | Medium | Comprehensive logging + telemetry |
| Timing sync issues | Low | Medium | Existing coordinator model |
| AdSense lazy-load breaks ads | Low | Medium | Test thoroughly |

---

## File Change Summary

### New Files

| File | Purpose |
|------|---------|
| `src/services/party-connection-manager.js` | P2P orchestration |
| `src/services/party-connection-manager.test.js` | Tests |
| `src/utils/adsense-loader.js` | Lazy-load AdSense |
| `src/components/ConnectionModeIndicator.js` | UI indicator |
| `php-api/party/cleanup.php` | Data cleanup script |
| `php-api/party/migrations/003_minimize_data.sql` | Schema migration |
| `tests/e2e/party-p2p.spec.js` | E2E tests |
| `tests/e2e/party-fallback.spec.js` | E2E tests |

### Modified Files

| File | Changes |
|------|---------|
| `index.html` | Remove global AdSense script |
| `src/views/CreatePartyView.js` | Add P2P initialization |
| `src/views/JoinPartyView.js` | Add P2P connection |
| `src/views/PartyLobbyView.js` | Use P2P events |
| `src/views/PartyQuizView.js` | Use P2P messages |
| `src/views/PartyResultsView.js` | Use session data |
| `src/services/p2p-service.js` | STUN-only config, remove TURN, add telemetry |
| `src/services/party-api.js` | Mark as fallback-only |
| `php-api/party/endpoints/rooms.php` | Remove quiz storage |
| `php-api/party/RoomManager.php` | Simplify room creation |
| `src/core/features.js` | Enable PARTY_SESSION |
| `.env.example` | Remove/comment TURN variables |

---

## Success Criteria

### Must Have

- [ ] No permission prompt when joining party (AdSense fix)
- [ ] P2P connection works between 2+ devices (STUN)
- [ ] Quiz data NOT stored on server (P2P mode)
- [ ] Answers NOT stored on server (P2P mode)
- [ ] HTTP fallback works when P2P fails
- [ ] All existing E2E tests pass
- [ ] Party Mode enabled in production

### Nice to Have

- [ ] Connection mode indicator in UI
- [ ] Telemetry for P2P vs HTTP usage
- [ ] Telemetry for ICE candidate types (to evaluate TURN need)
- [ ] Automatic server data cleanup

### Deferred (if needed based on testing)

- [ ] TURN server integration (only if STUN proves insufficient)

---

## Questions Resolved

| Question | Decision |
|----------|----------|
| HTTP Fallback? | **Yes** - Keep for reliability |
| Teaching vs Execution? | **Teaching** - Step by step |
| AdSense? | **Fix** - Lazy-load to prevent permission prompt |
| Participant IDs? | **Random per session** - Maximum privacy |
| Room codes? | **Server-generated** - Guarantees uniqueness |
| STUN vs TURN? | **STUN-first** - No external service; add TURN later only if needed |

---

## Next Steps

### Before Starting (User Validation Required)

1. **Review this plan** - Validate approach and scope
2. **Confirm branch strategy** - Feature branch from main
3. **Confirm teaching mode** - Step-by-step implementation

### Implementation Order

Once validated, work proceeds in this order:

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION ROADMAP                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 0: AdSense Fix                                           │
│  ├─ Create adsense-loader.js                                   │
│  ├─ Remove global script from index.html                       │
│  ├─ Update views to lazy-load                                  │
│  └─ ✓ Deploy to staging → Verify no permission prompt          │
│                                                                 │
│  Phase A: P2P Foundation                                        │
│  ├─ Create PartyConnectionManager                              │
│  ├─ Simplify P2PService (STUN-only)                            │
│  ├─ Add tests                                                  │
│  └─ ✓ Deploy to staging → Verify tests pass                    │
│                                                                 │
│  Phase B: View Integration                                      │
│  ├─ Update CreatePartyView                                     │
│  ├─ Update JoinPartyView                                       │
│  ├─ Update PartyLobbyView                                      │
│  ├─ Update PartyQuizView                                       │
│  ├─ Update PartyResultsView                                    │
│  └─ ✓ Deploy to staging → Verify party flow works              │
│                                                                 │
│  Phase C: Server Minimization                                   │
│  ├─ Update PHP endpoints                                       │
│  ├─ Run migrations                                             │
│  ├─ Add cleanup script                                         │
│  └─ ✓ Deploy to staging → Verify server data minimal           │
│                                                                 │
│  Phase D: STUN Testing                                          │
│  ├─ Configure STUN servers                                     │
│  ├─ Add telemetry for ICE candidates                           │
│  └─ ✓ Deploy to staging → Test multi-device P2P                │
│                                                                 │
│  Phase E: Testing & Validation                                  │
│  ├─ Run unit tests (npm test)                                  │
│  ├─ Run E2E tests (npm run test:e2e)                           │
│  ├─ Create Maestro flows                                       │
│  ├─ Multi-device manual testing                                │
│  └─ ✓ Complete staging validation checklist                    │
│                                                                 │
│  Phase F: Production Rollout                                    │
│  ├─ Enable feature flag                                        │
│  ├─ Deploy to staging first                                    │
│  ├─ Deploy to production                                       │
│  ├─ Monitor telemetry                                          │
│  └─ ✓ Merge to main, cleanup branch                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Commands Reference

```bash
# Create feature branch
git checkout main && git pull
git checkout -b feature/party-p2p-decentralization

# Local testing
npm test              # Unit tests
npm run test:e2e      # E2E tests
npm run build         # Build

# Staging deployment
npm run deploy -- --staging

# Production deployment (Phase F only)
npm run deploy

# Maestro tests (via GitHub Actions)
# Add 'maestro-test' label to PR
```

---

## Appendix: Existing Code Reference

### P2PService API (already implemented, needs simplification)

```javascript
// src/services/p2p-service.js

// Current: Has TURN fetching complexity
// After Phase A: Simplified to STUN-only

export class P2PService {
  constructor(signalingClient)
  async createConnection(peerId)     // Initiate connection to peer
  send(peerId, message)              // Send to specific peer
  broadcast(message)                 // Send to all peers
  onMessage(callback)                // Receive messages
  onPeerConnected(callback)          // Peer connected event
  onPeerDisconnected(callback)       // Peer disconnected event
  disconnect(peerId)                 // Disconnect from peer
  destroy()                          // Cleanup
}

// ICE Configuration (after simplification):
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];
// No TURN, no async credential fetching, no relay policy
```

### PartySession API (already implemented)

```javascript
// src/services/party-session.js
export class PartySession {
  constructor(p2pService, isHost)

  // Host methods
  createSession(quiz, roomCode, hostName, secondsPerQuestion)
  startQuiz()
  submitHostAnswer(questionIndex, answerIndex)

  // Guest methods
  joinSession(roomCode, name)
  submitAnswer(questionIndex, answerIndex)

  // Shared
  getCurrentQuestion()
  getTimeRemaining()
  getParticipants()
  getStandings()

  // Events
  onStateChange(callback)
  onParticipantsChange(callback)
  onQuestionChange(callback)
  onScoreUpdate(callback)
  onQuizEnd(callback)
}
```

### SignalingClient API (already implemented)

```javascript
// src/services/signaling-client.js
export class SignalingClient {
  constructor(baseUrl, roomCode, participantId)
  async sendOffer(toPeerId, offer)
  async sendAnswer(toPeerId, answer)
  async sendIceCandidate(toPeerId, candidate)
  startPolling(onMessage)
  stopPolling()
  destroy()
}
```
