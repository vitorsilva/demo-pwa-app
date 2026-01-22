# Flag: MULTI_PROVIDER_LLM

**Status:** Active - In Development
**Review After:** Epic 11 Phase 5 (Polish) completion
**Risk Level:** N/A (new feature, not removing)

---

## Flag Details

| Property | Value |
|----------|-------|
| Flag Name | `MULTI_PROVIDER_LLM` |
| Current Phase | `DISABLED` |
| Description | Allow users to configure and use multiple LLM providers |
| Usages | TBD (Phase 2-4 will add usages) |
| Files Affected | TBD |

---

## Purpose

This flag controls the gradual rollout of multi-provider LLM support (Epic 11). When enabled, users can:
- Configure API keys for OpenAI, Anthropic, Google AI, xAI
- Select active provider and model in Settings
- Use direct provider APIs instead of OpenRouter

---

## Rollout Strategy

| Epic Phase | Production | Staging |
|------------|------------|---------|
| Phase 2 (Router) | `DISABLED` | `DISABLED` |
| Phase 3 (Keys) | `DISABLED` | `DISABLED` |
| Phase 4 (Settings UI) | `DISABLED` | `SETTINGS_ONLY` |
| Phase 5 (Polish) - during | `DISABLED` | `ENABLED` |
| Phase 5 (Polish) - final | `ENABLED` | `ENABLED` |

---

## Current Usages

### Phase 2 (will add)

- `src/api/provider-router.js` - Route LLM calls based on active provider
- `src/api/api.real.js` - Use provider router for quiz/explanation generation

### Phase 3 (will add)

- `src/services/provider-settings-service.js` - API key storage/retrieval

### Phase 4 (will add)

- `src/views/SettingsView.js` - Provider configuration UI
- Settings panel for adding/removing API keys

---

## Removal Criteria

Remove this flag when ALL conditions are met:

- [ ] Epic 11 is complete and stable in production
- [ ] Multi-provider feature has been active for at least 2 weeks
- [ ] No rollback has been needed
- [ ] Telemetry shows stable usage across all providers
- [ ] Decision made that feature is permanent (no A/B testing needed)

---

## Rollback Plan

If issues in production:
1. Set flag to `DISABLED` in `features.js`
2. Rebuild and redeploy
3. Existing OpenRouter behavior is preserved
4. User settings remain in IndexedDB for future re-enablement

---

## Related

- [Epic 11: Multi-Provider LLM Support](../../epic11_llm_support/EPIC11_LLM_SUPPORT_PLAN.md)
- [Phase 2: Frontend Provider Router](../../epic11_llm_support/PHASE2_FRONTEND_ROUTER.md)

---

**Last Updated:** 2026-01-22
