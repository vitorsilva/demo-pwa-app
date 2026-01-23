# Epic 11: Multi-Provider LLM Support

**Status:** Complete (All Phases Done)
**Created:** January 2026
**Prerequisites:** Epic 06 Complete, OpenRouter integration working

---

## Overview

### Problem Statement

Currently, SaberLoop uses OpenRouter exclusively for LLM access. While OpenRouter provides excellent CORS support and multi-model access, some users may prefer:

1. **Lower costs** - Direct provider APIs avoid OpenRouter's ~10-20% markup
2. **Privacy** - Direct connection without intermediary
3. **Specific features** - Provider-specific capabilities not exposed via OpenRouter
4. **Existing accounts** - Users with existing API credits at specific providers

### Solution

Add optional support for users to configure their own API keys from:
- OpenAI
- Anthropic
- Google Gemini
- xAI Grok

OpenRouter remains the default and recommended option (CORS support, OAuth flow).

**Key Design Decision:** Provider selection happens at the **Settings level only**, not during quiz creation. This simplifies the UX and ensures consistency across all LLM operations (questions, explanations).

### LLM Operations Affected

All LLM calls will use the selected provider:
- **Quiz Generation** - Generate questions for a topic
- **Explanation Generation** - Explain why an answer is correct/incorrect
- **Future operations** - Any new LLM features will use the same provider

### Success Criteria

- [x] Users can add/remove API keys for each supported provider in Settings
- [x] Users can select active provider and model in Settings
- [x] Backend proxy correctly routes requests to each provider
- [x] All LLM operations use the selected provider
- [x] Clear UI indication of active provider in Settings
- [x] Cost tracking works for all providers
- [x] Deployment script for VPS `/llm/` endpoint
- [x] Landing page updated to showcase multi-provider feature (Phase 6)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ IndexedDB: Provider Settings                                  │   │
│  │  - active_provider: "openrouter" | "openai" | ...            │   │
│  │  - active_model: "gpt-4o-mini" | "claude-3.5-sonnet" | ...   │   │
│  │  - openrouter_key: "sk-or-..."                               │   │
│  │  - openai_key: "sk-..."         (optional)                   │   │
│  │  - anthropic_key: "sk-ant-..."  (optional)                   │   │
│  │  - google_key: "AIza..."        (optional)                   │   │
│  │  - xai_key: "xai-..."           (optional)                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Provider Router (src/api/provider-router.js)                  │   │
│  │  - Reads active provider from settings                        │   │
│  │  - Routes to direct API (OpenRouter) or proxy (others)       │   │
│  │  - Used by: quiz generation, explanation generation           │   │
│  └─────────────────────┬────────────────────────────────────────┘   │
│                        │                                             │
└────────────────────────┼─────────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼ (CORS ✅)                     ▼ (CORS ❌)
┌─────────────────┐           ┌──────────────────────────────────┐
│   OpenRouter    │           │   VPS: saberloop.com/llm/        │
│   (direct)      │           │                                  │
└─────────────────┘           │   ┌──────────────────────────┐   │
                              │   │ LLM Proxy (PHP)          │   │
                              │   │ - Validates request      │   │
                              │   │ - Routes to provider     │   │
                              │   │ - Normalizes response    │   │
                              │   │ - Does NOT store keys    │   │
                              │   └───────────┬──────────────┘   │
                              │               │                  │
                              └───────────────┼──────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
             ┌───────────┐             ┌───────────┐             ┌───────────┐
             │  OpenAI   │             │ Anthropic │             │  Google   │
             │  xAI      │             │           │             │           │
             └───────────┘             └───────────┘             └───────────┘
```

### Deployment Architecture

```
saberloop.com/
├── app/              # Frontend (existing)
├── party/            # Party Mode signaling (existing)
├── telemetry/        # Telemetry endpoints (existing)
└── llm/              # NEW: LLM proxy endpoints
    ├── completion.php
    ├── health.php
    └── src/
        └── handlers/
            └── LLMCompletion.php
```

**Rationale:** Separate `/llm/` path for:
- Clear separation of concerns
- Independent scaling if needed
- Easier monitoring/logging
- Can be rate-limited separately

---

## LLM Context Management Protocol

### Problem

When executing long implementation sessions, LLM quality degrades significantly when:
1. **Auto-compact triggers** (~80% context) - summarization loses important details
2. **Session ends** - new session starts without prior context
3. **Learning notes deferred** - context about difficulties/solutions lost

### Solution: Two-Level Checkpointing

#### Level 1: Checkpoint After Each Subtask (MANDATORY)

**Rule:** After completing ANY subtask (e.g., 1.1, 1.2, etc.), STOP and checkpoint before starting the next.

**Subtask Completion Checklist:**
```
□ Update Progress Marker in phase document
□ Update LEARNING_NOTES.md with difficulties/solutions/learnings
□ Commit all changes with descriptive message
□ Force new session (/clear or /compact)
□ ONLY THEN start next subtask
```

**Why this works:**
- Learning notes captured while context is fresh
- Git history has logical, atomic commits
- Each subtask starts with clean context
- No risk of losing implementation details

#### Level 2: Emergency Checkpoint at 75% Context

**Rule:** If you reach ~75% context DURING a subtask, checkpoint immediately.

**Emergency Checkpoint:**
- Mark partial progress in Progress Marker
- Note exactly where you stopped
- Commit work-in-progress
- Start fresh session to continue same subtask

### Execution Cycle

```
┌─────────────────────────────────────────────────────────────┐
│  1. READ phase doc → find next pending subtask (marked ⬚)   │
│  2. EXECUTE subtask (all context is in the subtask section) │
│  3. COMPLETE subtask:                                       │
│     a. MARK subtask complete (⬚ → ✅)                        │
│     b. UPDATE Progress Marker                               │
│     c. UPDATE LEARNING_NOTES.md                             │
│     d. COMMIT all changes                                   │
│     e. START NEW SESSION (/clear)                           │
│  4. NEW SESSION reads phase doc → continues from step 1     │
└─────────────────────────────────────────────────────────────┘
```

### Progress Marker

Update this section after EVERY subtask completion:

```
**Last checkpoint:** [Phase X, Subtask Y.Z] - [What was completed]
**Next action:** [Exact next subtask to start]
**Blockers:** [Any issues discovered]
**Session:** [Date/time of checkpoint]
```

**Current Progress:**
- **Last checkpoint:** Phase 6 COMPLETE - Landing page updated with multi-provider messaging
- **Next action:** Epic 11 Complete - All phases done
- **Blockers:** None
- **Session:** January 23, 2026

### Self-Contained Subtask Requirements

Each subtask in the phase documents MUST include:
- ✅ **What to do** - Clear, actionable steps
- ✅ **Full code** - Complete code blocks, not snippets
- ✅ **File paths** - Exact locations for all files
- ✅ **Dependencies** - What must exist before this subtask
- ✅ **Verification** - How to confirm subtask is complete
- ✅ **Checkpoint marker** - Clear boundary showing where to stop

A fresh LLM session should be able to execute ANY subtask by reading only that subtask's section.

---

## Phases Overview

Each phase has its own detailed document with implementation steps, testing, and acceptance criteria.

| Phase | Document | Goal | Effort |
|-------|----------|------|--------|
| 1 | [PHASE1_BACKEND_PROXY.md](./PHASE1_BACKEND_PROXY.md) | Backend proxy + deployment script | 3-4 days |
| 2 | [PHASE2_FRONTEND_ROUTER.md](./PHASE2_FRONTEND_ROUTER.md) | Frontend provider routing | 2-3 days |
| 3 | [PHASE3_KEY_MANAGEMENT.md](./PHASE3_KEY_MANAGEMENT.md) | API key storage and management | 2-3 days |
| 4 | [PHASE4_SETTINGS_UI.md](./PHASE4_SETTINGS_UI.md) | Settings UI for provider selection | 3-4 days |
| 5 | [PHASE5_POLISH.md](./PHASE5_POLISH.md) | Error handling, edge cases, final polish | 2-3 days |
| 6 | [PHASE6_MARKETING_UPDATE.md](./PHASE6_MARKETING_UPDATE.md) | Landing page & marketing updates | 0.5 day |

**Total Estimate:** ~13-18 days

### Testing Strategy

**Testing is integrated into each phase, not a separate phase.**

Each phase includes:
- Unit tests for new code
- Integration tests where applicable
- E2E tests for user-facing features
- Maestro tests for mobile UI (Phases 3-5)

Tests must pass before moving to the next phase.

---

## Design Decisions (Resolved)

1. **Provider selection location:** ✅ **Settings only**
   - Provider is selected in Settings, not during quiz creation
   - Simplifies UX - one place to configure
   - All LLM operations (questions, explanations) use same provider
   - Change applies to next LLM call, not mid-operation

2. **Model selection per provider:** ✅ **Allow specific model selection**
   - Users can select specific models for each provider
   - Show available models with pricing in the UI
   - Remember last selected model per provider

3. **Key validation:** ✅ **Hybrid approach**
   - On save: Format validation only (instant feedback, works offline)
   - After save: Async background validation when online
   - Update status indicator: "Validating..." → "Valid" / "Invalid"
   - Benefits: Fast UX, eventual confirmation, works offline

4. **Cost tracking:** ✅ **Yes, display costs for all providers**
   - Use token counts from API responses
   - Multiply by known pricing per model
   - Show in results view same as OpenRouter

5. **Offline keys:** ✅ **No special handling needed**
   - Store locally in IndexedDB
   - Validate on first actual use
   - Same pattern as current OpenRouter implementation

6. **Mid-operation provider switch:** ✅ **Not allowed**
   - Provider is locked for duration of quiz
   - Cannot change while quiz in progress
   - Selection only applies to next quiz creation

---

## UI Design Summary

### Settings View - LLM Providers Section

```
┌─────────────────────────────────────────────────────────────┐
│  ← Settings                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ LLM Providers                                           ││
│  ├─────────────────────────────────────────────────────────┤│
│  │                                                         ││
│  │  Active Provider: [OpenRouter                    ▼]     ││
│  │  Active Model:    [claude-3.5-sonnet             ▼]     ││
│  │  Estimated cost:  ~$0.015/quiz                          ││
│  │                                                         ││
│  │  ─────────────────────────────────────────────────────  ││
│  │                                                         ││
│  │  Configured Providers:                                  ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ ● OpenRouter                      ✅ Connected   │   ││
│  │  │   OAuth connected                              │   ││
│  │  │                              [Disconnect]       │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ ○ OpenAI                          ✅ Valid       │   ││
│  │  │   sk-...7x2Q                                    │   ││
│  │  │                     [Change Key] [Remove]      │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ ○ Anthropic                    🔄 Validating... │   ││
│  │  │   sk-ant-...                                    │   ││
│  │  │                     [Change Key] [Remove]      │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ ○ Google AI                    ○ Not configured │   ││
│  │  │   Gemini models • Free tier available          │   ││
│  │  │                              [Add API Key]      │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ ○ xAI                          ○ Not configured │   ││
│  │  │   Grok models                                   │   ││
│  │  │                              [Add API Key]      │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ℹ️ OpenRouter is recommended for easiest setup.         ││
│  │    Add direct provider keys for lower costs.            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Active Provider Indicator (Quiz View)

Small indicator showing which provider is being used:

```
┌─────────────────────────────────────────────────────────────┐
│  Question 3 of 5                     Powered by OpenRouter  │
├─────────────────────────────────────────────────────────────┤
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

Full wireframes are in each phase document.

---

## i18n Strings

See [PHASE4_SETTINGS_UI.md](./PHASE4_SETTINGS_UI.md) for complete i18n string definitions.

Summary of new string namespaces:
- `settings.llmProviders.*` - Provider settings UI
- `settings.addKeyModal.*` - Add/change key modal
- `settings.removeKeyModal.*` - Remove key confirmation
- `quiz.providerIndicator.*` - Active provider display
- `errors.provider*` - Provider-specific errors

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Key in request body | HTTPS encrypts entire body |
| Key in server logs | Don't log request bodies with keys |
| Key validation | Validate key format before forwarding |
| Rate limiting | Add per-IP rate limits to proxy endpoint |
| Abuse | Consider adding CAPTCHA for heavy usage |

---

## References

### Internal Documentation

- `docs/learning/epic11_llm_support/RESEARCH_PROVIDER_ANALYSIS.md` - Provider research
- `docs/architecture/LLM_INTEGRATION_EVOLUTION.md` - Historical context
- `docs/learning/epic03_quizmaster_v2/PHASE3.6_OPENROUTER.md` - Current OpenRouter implementation
- `php-api/src/AnthropicClient.php` - Existing Anthropic client (reference)

### Deployment Reference

- `scripts/deploy-party.sh` - Party Mode deployment script (reference)
- `php-api/party/` - Party Mode structure (reference)

---

*Last Updated: January 2026*
