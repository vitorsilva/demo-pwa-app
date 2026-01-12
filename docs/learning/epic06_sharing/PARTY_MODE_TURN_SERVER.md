# Party Mode: TURN Server Integration

**Status:** Complete
**Created:** 2026-01-12
**Parent:** [Epic 6 Plan](./EPIC6_SHARING_PLAN.md)
**Related:** [Phase 3 Party Session](./PHASE3_PARTY_SESSION.md)

---

## Problem

When joining a party session, Chrome asks for local network permission:
> "saberloop.com quer: Procurar e fazer ligacao a qualquer dispositivo na sua rede local"

In installed PWAs, this fails silently because PWAs have stricter permission models.

**Root cause:** WebRTC ICE gathering exposes local IP addresses, triggering Chrome's privacy protection (added in Chrome 94+).

**Impact:** Party Mode doesn't work in installed PWA version.

---

## Solution

Use Metered.ca hosted TURN service with `iceTransportPolicy: 'relay'`.

This forces all WebRTC traffic through TURN relay servers, eliminating local IP exposure and the permission prompt.

---

## Why Metered.ca?

| Feature | Benefit |
|---------|---------|
| 500GB/month free | More than enough for quiz app |
| No server setup | Works with shared hosting |
| Frontend-safe API key | No backend proxy needed |
| Global servers | Low latency worldwide |
| Simple integration | Just one API call |

---

## Architecture

```
+----------------+   GET credentials   +-----------------+
|   Frontend     | ------------------> |  Metered.ca API |
| (p2p-service)  |                     |  (free tier)    |
+-------+--------+                     +--------+--------+
        |                                       |
        | WebRTC Relay                          | ICE Servers
        v                                       v
+-----------------------------------------------------+
|              Metered.ca TURN Servers                 |
|         (Global, Europe, US, Asia, etc.)             |
+-----------------------------------------------------+
```

---

## Implementation Steps

### Step 1: Create Metered.ca Account

1. Go to https://www.metered.ca/signup
2. Create a free account
3. Create a new **TURN Credential** in the dashboard
4. Copy the **API Key** (safe for frontend use)
5. Note your **App Name** (e.g., `myapp` -> endpoint is `myapp.metered.live`)

### Step 2: Add Environment Variables

Edit `.env` and `.env.example`:

```ini
# Metered.ca TURN Server (Party Mode WebRTC)
VITE_METERED_API_KEY=your-api-key-here
VITE_METERED_APP_NAME=your-app-name
```

### Step 3: Update p2p-service.js

**File:** `src/services/p2p-service.js`

Replace the static `ICE_SERVERS` constant with dynamic credential fetching:

```javascript
/**
 * Fallback STUN servers if TURN fetch fails.
 */
const FALLBACK_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
];

let cachedIceServers = null;
let cacheExpiry = 0;
const CACHE_TTL = 3600000; // 1 hour

async function getIceServers() {
  if (cachedIceServers && Date.now() < cacheExpiry) {
    return cachedIceServers;
  }

  const apiKey = import.meta.env.VITE_METERED_API_KEY;
  const appName = import.meta.env.VITE_METERED_APP_NAME;

  if (!apiKey || !appName) {
    return FALLBACK_ICE_SERVERS;
  }

  try {
    const response = await fetch(
      `https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const iceServers = await response.json();
    cachedIceServers = iceServers;
    cacheExpiry = Date.now() + CACHE_TTL;
    return iceServers;
  } catch (error) {
    return FALLBACK_ICE_SERVERS;
  }
}
```

Update `_createPeerConnection` to use relay-only mode:

```javascript
const connection = new RTCPeerConnection({
  iceServers: iceServers,
  iceTransportPolicy: 'relay',  // Force TURN relay only
});
```

Update `createConnection` and `_handleOffer` to fetch credentials:

```javascript
const iceServers = await getIceServers();
const peerConnection = this._createPeerConnection(peerId, iceServers);
```

---

## Files Modified

| File | Change |
|------|--------|
| `.env` | Add Metered.ca API key and app name |
| `.env.example` | Document new environment variables |
| `src/services/p2p-service.js` | Add TURN credential fetching, relay-only mode |

---

## Verification

1. **Test credentials API** in browser console:
   ```javascript
   const resp = await fetch('https://YOUR_APP.metered.live/api/v1/turn/credentials?apiKey=YOUR_KEY');
   console.log(await resp.json());
   ```

2. **Test with Trickle ICE** (https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)
   - Should see "relay" candidates only

3. **Test party session** between two devices
   - Check `chrome://webrtc-internals/` -> verify relay candidates

4. **Test installed PWA** - should work without permission prompt

---

## Cost Estimate

| Usage | Data | Monthly Cost |
|-------|------|--------------|
| 100 sessions/month | ~1GB | Free |
| 1000 sessions/month | ~10GB | Free |
| 10000 sessions/month | ~100GB | Free |

Quiz data is tiny (~1KB per question). 500GB free tier is massive overkill.

---

## Security Notes

- Metered.ca API key is **credential-scoped** (safe for frontend)
- Credentials are time-limited (handled by Metered.ca)
- No secrets in codebase - `.env` is gitignored

---

## Rollback Plan

If issues arise:
1. Remove `iceTransportPolicy: 'relay'` line
2. Party Mode continues working on web (with permission prompt)

---

## Learning Notes

### Session: 2026-01-12

#### Investigation

**Problem identified:** Chrome's WebRTC ICE gathering exposes local IP addresses (192.168.x.x, etc.), triggering a privacy permission prompt. PWAs have stricter permission models and fail silently.

**Solution selected:** Metered.ca hosted TURN service

- Free tier: 500GB/month
- Frontend-safe API key
- No server setup required (important: user has shared hosting without SSH)

#### Key Learnings

1. **WebRTC ICE candidate types:**
   - `host` - Local IP addresses (triggers permission)
   - `srflx` - Server-reflexive (public IP via STUN)
   - `relay` - TURN relay (goes through server)

2. **`iceTransportPolicy: 'relay'`** forces WebRTC to only use TURN relay candidates, eliminating local IP exposure.

3. **PWA permission model** is stricter than browser - permission prompts may not appear or be auto-rejected.

4. **TURN credentials** should be time-limited for security. Metered.ca handles this automatically.

#### Implementation Completed

- [x] Created Metered.ca account (app name: `saberloop`)
- [x] Added `VITE_METERED_API_KEY` and `VITE_METERED_APP_NAME` to `.env`
- [x] Updated `src/services/p2p-service.js`:
  - Added `getIceServers()` async function to fetch TURN credentials
  - Added credential caching (1 hour TTL)
  - Updated `_createPeerConnection()` to accept iceServers parameter
  - Added `iceTransportPolicy: 'relay'` to force TURN-only connections
  - Updated `createConnection()` and `_handleOffer()` to fetch credentials

#### Test Results

- Unit tests: 729/730 passed (1 pre-existing failure unrelated to TURN)
- P2P service tests: 26/26 passed

#### Next Steps

1. Deploy to staging and test Party Mode between two devices
2. Verify no permission prompt appears
3. Test on installed PWA (Android)
4. Re-enable `PARTY_SESSION` feature flag in production

---

## References

- [Metered.ca TURN REST API](https://www.metered.ca/docs/turn-rest-api/)
- [WebRTC ICE Transport Policy](https://developer.mozilla.org/en-US/docs/Web/API/RTCConfiguration/iceTransportPolicy)
- [Chrome Local Network Access Permission](https://developer.chrome.com/blog/pwa-local-network-access/)
