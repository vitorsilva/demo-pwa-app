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

## References

- [PARTY_MODE_TURN_SERVER.md](./PARTY_MODE_TURN_SERVER.md) - Previous TURN implementation (not used)
- [EPIC6_SHARING_PLAN.md](./EPIC6_SHARING_PLAN.md) - Parent epic plan
- [PHASE3_PARTY_SESSION.md](./PHASE3_PARTY_SESSION.md) - Original party session design
