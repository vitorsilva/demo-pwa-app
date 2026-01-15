# Flag: PARTY_SESSION

**Status:** ✅ Removed (Wave 2)
**Removed:** 2026-01-15
**PR:** TBD

---

## Flag Details

| Property | Value |
|----------|-------|
| Flag Name | `PARTY_SESSION` |
| Current Phase | `DISABLED` |
| Description | Create and join party sessions to play quizzes with friends in real-time |
| Usages | 1 |
| Files Affected | 1 |

---

## Why Keep

This flag guards **unreleased functionality** from Epic 06 Phase 3 (Party Session).

The feature is implemented but not yet enabled for users. The flag allows:
- Deploying code without exposing the feature
- Testing in production with flag override
- Gradual rollout when ready

---

## Current Usages

### `src/views/HomeView.js`
**Lines 225-226:**
```javascript
isFeatureEnabled('PARTY_SESSION') &&
isFeatureEnabled('MODE_TOGGLE') &&
// Show party session UI
```

---

## Removal Criteria

Remove this flag when ALL conditions are met:

- [ ] `MODE_TOGGLE` flag is enabled first (dependency)
- [ ] Feature flag changed to `ENABLED`
- [ ] Feature released to production
- [ ] Stable in production for 2+ weeks
- [ ] No plans to disable it
- [ ] Telemetry confirms healthy usage
- [ ] P2P connection success rate is acceptable (>85%)

---

## Rollout Plan

1. **Ensure `MODE_TOGGLE` is enabled** - Prerequisite
2. **Enable for internal testing** - Set to `ENABLED`, test internally
3. **Enable for 10% users** - Monitor telemetry, especially P2P success rates
4. **Enable for 100% users** - Full rollout
5. **Remove flag** - After 2 weeks stable, add to hygiene backlog

---

## Dependencies

- **Requires:** `MODE_TOGGLE` must be enabled first
- Party mode UI only appears when both flags are enabled

---

## Special Considerations

This feature involves **WebRTC P2P connections** which may have reliability issues:
- Monitor telemetry for connection failures
- May need to keep flag longer if P2P issues arise
- Fallback plan: VPS relay if P2P success rate is low

---

## Related

- [Epic 06: Sharing Features](../../epic06_sharing/EPIC6_SHARING_PLAN.md)
- [Phase 3: Party Session](../../epic06_sharing/PHASE3_PARTY_SESSION.md)
- [FLAG_MODE_TOGGLE.md](./FLAG_MODE_TOGGLE.md) - Required dependency

---

**Last Updated:** 2026-01-09
