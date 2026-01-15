# Flag: MODE_TOGGLE

**Status:** ✅ Removed (Wave 2)
**Removed:** 2026-01-15
**PR:** TBD

---

## Flag Details

| Property | Value |
|----------|-------|
| Flag Name | `MODE_TOGGLE` |
| Current Phase | `DISABLED` |
| Description | Toggle between Learning and Party modes with different themes |
| Usages | 4 |
| Files Affected | 3 |

---

## Why Keep

This flag guards **unreleased functionality** from Epic 06 Phase 2 (Mode Toggle).

The feature is implemented but not yet enabled for users. The flag allows:
- Deploying code without exposing the feature
- Testing in production with flag override
- Gradual rollout when ready

---

## Current Usages

### `src/views/TopicsView.js`
**Line 70:**
```javascript
if (isFeatureEnabled('MODE_TOGGLE')) {
  // Show mode indicator
}
```

### `src/views/SettingsView.js`
**Line 254:**
```javascript
if (isFeatureEnabled('MODE_TOGGLE')) {
  // Show mode toggle setting
}
```

### `src/views/HomeView.js`
**Line 120:**
```javascript
if (isFeatureEnabled('MODE_TOGGLE')) {
  // Show mode-specific UI
}
```

**Line 226:**
```javascript
isFeatureEnabled('PARTY_SESSION') &&
isFeatureEnabled('MODE_TOGGLE') &&
// ...
```

---

## Removal Criteria

Remove this flag when ALL conditions are met:

- [ ] Feature flag changed to `ENABLED`
- [ ] Feature released to production
- [ ] Stable in production for 2+ weeks
- [ ] No plans to disable it
- [ ] Telemetry confirms healthy usage

---

## Rollout Plan

1. **Enable for internal testing** - Set to `ENABLED`, test internally
2. **Enable for 10% users** - Monitor telemetry
3. **Enable for 100% users** - Full rollout
4. **Remove flag** - After 2 weeks stable, add to hygiene backlog

---

## Dependencies

- `PARTY_SESSION` flag depends on `MODE_TOGGLE` being enabled
- Must enable `MODE_TOGGLE` before `PARTY_SESSION`

---

## Related

- [Epic 06: Sharing Features](../../epic06_sharing/EPIC6_SHARING_PLAN.md)
- [Phase 2: Mode Toggle](../../epic06_sharing/PHASE2_MODE_TOGGLE.md)
- [FLAG_PARTY_SESSION.md](./FLAG_PARTY_SESSION.md) - Dependent flag

---

**Last Updated:** 2026-01-09
