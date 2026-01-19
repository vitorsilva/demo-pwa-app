# Parking Lot - Ideas to Explore

This folder contains **optional and experimental phases** that are interesting to explore but not required for the core QuizMaster V2 functionality.

---

## What is the Parking Lot?

The "parking lot" is a place to document ideas, experimental features, and optional enhancements that:
- ✅ Are well-defined and documented
- ✅ Could be implemented in the future
- ⚠️ Are not critical for core functionality
- ⚠️ May have uncertain feasibility
- ⚠️ Add significant complexity

**Think of this as:** "Nice to have" features we might revisit when relevant.

---

## Current Ideas

### [Phase 7: Azure Functions Migration](./PHASE7_AZURE_MIGRATION.md) ⭐ **Optional**

**Status:** Ready to implement (if desired)

**What it is:**
- Migrate serverless backend from Netlify Functions to Azure Functions
- Dual backend support (switch between Netlify/Azure via config)
- Application Insights monitoring

**Why it's optional:**
- ✅ Netlify Functions work perfectly (free tier: 125K requests/month)
- ✅ Current setup is simple and reliable
- ⚠️ Azure adds complexity without critical benefits

**Why you might want it:**
- 🎓 Learn Azure cloud platform
- 📈 Higher free tier (1M requests/month vs 125K)
- 🏢 Enterprise features (VNet, Azure AD, etc.)
- 💼 Resume value (Azure experience)
- 🔄 Platform portability

**When to revisit:**
- You want Azure experience
- Need higher request limits
- Building enterprise features

---

### [Architecture Testing (JS ArchUnit)](./ARCH_TESTING_JS_ARCHUNIT.md) ⭐ **Ready to Implement**

**Status:** Planning Complete

**What it is:**
- Architecture testing using dependency-cruiser
- Layer dependency rules (views, api, db, state, utils)
- Naming convention enforcement
- Circular dependency detection
- Integrated with Vitest and CI

**Why it's optional:**
- ✅ Project works fine without it
- ⚠️ Adds development overhead
- ⚠️ Rules need maintenance

**Why you might want it:**
- 🏗️ **Prevent architectural drift** as codebase grows
- 🔒 **Enforce boundaries** between layers
- 📚 **Executable documentation** of architecture
- 🎓 **Learn architecture testing** patterns
- ✅ **Catch violations early** in CI

**When to revisit:**
- Before Phase 5 (structure changes)
- When adding new modules
- When onboarding contributors

---

### [Phase 8: OAuth Integration](./PHASE8_OAUTH.md) ⭐ **Optional/Experimental**

**Status:** Experimental - OAuth availability unconfirmed

**What it is:**
- OAuth 2.0 authentication flow with Claude API
- PKCE implementation for security
- Token storage in IndexedDB
- Automatic token refresh logic

**Why it's optional:**
- ✅ API keys work perfectly (simpler)
- ⚠️ OAuth may not be publicly available yet
- ⚠️ Significantly more complex
- ⚠️ Requires backend token handling

**Why you might want it:**
- 🎓 Learn industry-standard OAuth patterns
- 🔒 More secure than storing API keys
- 👥 Foundation for multi-user support
- 🔄 Automatic token rotation
- 💼 Enterprise authentication experience

**When to revisit:**
- Anthropic announces public OAuth support
- Building multi-user features
- Want to eliminate static API keys

---

### [Phase 9: OpenRouter Migration](./PHASE9_OPENROUTE_MIGRATION.md) ⭐ **Optional**

**Status:** Ready to implement (if desired)

**What it is:**
- Migrate from direct Claude API to OpenRouter
- Multi-model support (Claude, GPT-4, etc.)
- Unified API interface

**Why it's optional:**
- ✅ Direct Claude API works perfectly
- ⚠️ Adds abstraction layer
- ⚠️ Additional service dependency

**Why you might want it:**
- 🔄 Model flexibility
- 💰 Potential cost savings
- 🎓 Learn API aggregation patterns

**When to revisit:**
- Want to support multiple AI models
- Need model fallback capability
- Exploring different AI providers

---

### [Phase 10: PHP VPS Migration](./PHASE10_PHP_MIGRATION.md) ⭐ **Optional**

**Status:** Ready to implement (if you have a VPS)

**What it is:**
- Migrate serverless backend from Netlify Functions to PHP on VPS
- Traditional server architecture (Apache/Nginx + PHP)
- REST API with three endpoints (questions, explanations, health)
- Environment-based configuration with .env files

**Why it's optional:**
- ✅ Netlify Functions work perfectly (simpler)
- ✅ Serverless is easier (no server maintenance)
- ⚠️ Requires VPS and server management skills
- ⚠️ More complex deployment

**Why you might want it:**
- 💰 **Zero additional cost** (if you already have a VPS)
- 🚀 **No cold starts** (always-warm server, faster response)
- 🎓 **Learn PHP backend development** and VPS management
- 🔧 **Full server control** (custom caching, rate limiting)
- 📊 **Server-side analytics** and detailed logging
- 💼 **Resume value** (PHP + VPS experience)

**When to revisit:**
- You already have a VPS (cost savings)
- Want to learn traditional backend architecture
- Need full infrastructure control
- Want to eliminate cold start latency

---

### [iOS App Store Publishing](./IOS_APP_STORE.md) ⭐ **Ready to Implement**

**Status:** Planning Complete

**What it is:**
- Publish Saberloop to Apple App Store
- Incremental approach: PWABuilder first, native features if rejected
- Native enhancements: Haptic feedback, Share extensions

**Why it's optional:**
- ✅ Android version covers majority of mobile users
- ✅ PWA works on iOS via Safari "Add to Home Screen"
- ⚠️ $99/year developer fee (vs Google's $25 one-time)
- ⚠️ Requires Mac for building (limited access)
- ⚠️ Apple's stricter review process

**Why you might want it:**
- 📱 **Reach iPhone users** through App Store
- 🎓 **Learn iOS ecosystem** (Xcode, TestFlight, Capacitor)
- 💼 **"Available on both stores"** credibility
- 🔗 **Share TO Saberloop** - create quizzes from any app

**When to revisit:**
- Ready to expand to iOS users
- Want to learn iOS development
- Need App Store credibility

---

### [OpenRouter Onboarding UX](./OPENROUTER_ONBOARDING_UX.md) ⭐ **Ready to Implement**

**Status:** Planning Complete

**What it is:**
- New "OpenRouter Free Account Guide" view with step-by-step visual instructions
- Multiple entry points (Welcome screen, Settings, Homepage prompts)
- "Connection Confirmed!" celebration screen after successful OAuth
- Feature flag system for gradual rollout during closed testing

**Why it's optional:**
- ✅ Current OAuth flow works (direct redirect to OpenRouter)
- ✅ Users can already connect successfully
- ⚠️ Adds UI complexity (new views)
- ⚠️ May not significantly improve conversion

**Why you might want it:**
- 🎯 **Reduce user anxiety** about external OAuth process
- 📚 **Educate about free tier** - users often think they need to pay
- ⚠️ **Highlight payment skip** - OpenRouter shows credits first, confuses users
- 🎉 **Celebrate connection** - confirmation screen feels rewarding
- 🔒 **Safe rollout** - Feature flags protect existing users

**When to revisit:**
- During closed testing (current phase)
- If user feedback indicates confusion
- Before public launch to improve conversion

---

### [Internationalization (i18n)](./I18N_INTERNATIONALIZATION.md) ⭐ **Ready to Implement**

**Status:** Planning Complete

**What it is:**
- Full internationalization using i18next library
- UI translation with ~65 extracted strings
- LLM content generation in user's preferred language
- Locale-aware date/number formatting (Intl API)
- Hybrid translation workflow (manual + API-assisted)

**Why it's optional:**
- ✅ App works fine in English only
- ⚠️ Significant effort (~7-10 sessions)
- ⚠️ Requires ongoing translation maintenance

**Why you might want it:**
- 🌍 **Global reach** - Accessible to users worldwide
- 🎓 **Learn i18n patterns** - Industry-standard practices
- 👥 **Expand user base** - Non-English speakers
- 📱 **Professional quality** - Expected in production apps
- 🔤 **AI content localization** - Quiz questions in any language

**When to revisit:**
- Targeting international markets
- Family members prefer other languages
- Preparing for wider distribution
- Want to learn i18n best practices

---

### [Dead Code Detection](./DEAD_CODE_DETECTION.md) ⭐ **Ready to Implement**

**Status:** Planning Complete

**What it is:**
- Static analysis using Knip to detect unused code
- Finds unused files, exports, and dependencies
- Gradual CI integration (warning → blocking)
- Configurable ignore list for intentional code

**Why it's optional:**
- ✅ App works fine without it
- ⚠️ Requires initial cleanup effort
- ⚠️ May flag false positives initially

**Why you might want it:**
- 🧹 **Cleaner codebase** - Remove clutter from learning phases
- 📦 **Smaller bundles** - Unused code may end up in builds
- 🔍 **Easier navigation** - Less noise when exploring code
- 🛡️ **Prevent regression** - CI catches new dead code
- 🎓 **Learn static analysis** - Industry-standard tooling

**When to revisit:**
- Before major refactoring
- When codebase feels cluttered
- Before onboarding contributors
- Want to establish code quality gates

---

### [Phase 88: Knip Configuration Enhancements](./PHASE88_KNIP_ENHANCEMENTS.md) ⭐ **Ready to Implement**

**Status:** Parked (moved from Epic 5 on 2026-01-06)

**What it is:**
- Fix false positives in Knip (src/types.js, start binary)
- Add CI integration with GitHub Actions annotations
- Enable caching for faster runs (10-40% improvement)
- Add production mode for stricter analysis

**Why it's optional:**
- ✅ Current Knip setup works (just has minor warnings)
- ⚠️ Low priority enhancement
- ⚠️ Not blocking any features

**Why you might want it:**
- 🔧 **Zero false positives** - Clean lint runs
- 🚀 **Faster CI** - Caching speeds up runs
- 📝 **Better PR feedback** - Inline GitHub annotations
- 🔒 **Stricter prod analysis** - Production mode

**When to revisit:**
- Want cleaner CI output
- Improving developer experience
- Before onboarding contributors

---

### [Alert to Modal Conversion](./ALERT_TO_MODAL_CONVERSION.md) ⭐ **Ready to Implement**

**Status:** Parked (added 2026-01-19)

**What it is:**
- Replace all native `alert()` and `confirm()` dialogs with custom modals
- Create generic `AlertModal` and `ConfirmModal` components
- Full testing coverage (unit, E2E, Maestro)
- Complete i18n support

**Scope:**
- 9 `alert()` calls across 6 files
- 5 `confirm()` calls across 4 files
- 10 files to modify + 7 new files

**Why it's optional:**
- ✅ Native dialogs work (just look inconsistent)
- ⚠️ UX polish, not functionality
- ⚠️ Medium effort (~4-6 hours)

**Why you might want it:**
- 🎨 **Consistent UX** - All dialogs match app design system
- 🌙 **Dark mode support** - Native dialogs don't respect theme
- ♿ **Better accessibility** - Custom focus management
- 📱 **Mobile polish** - Native dialogs feel jarring on mobile
- 🧪 **Testable** - E2E and Maestro can interact with custom modals

**When to revisit:**
- During UX polish phase
- Before major release
- When users complain about inconsistent dialogs

---

## How to Use This Folder

### If You're Planning Epic 3

1. **Focus on core phases first** (Phases 1-6 in Epic 3)
2. **Skip the parking lot** initially
3. **Return here** if you want extra challenges

### If You Want to Implement an Idea

1. **Read the phase document** thoroughly
2. **Verify prerequisites** are met (e.g., OAuth availability)
3. **Follow the implementation guide** in the phase doc
4. **Update Epic 3 plan** if you decide to include it

### If You Have a New Idea

1. **Document it** in a new markdown file here
2. **Explain why it's optional** (complexity, uncertainty, etc.)
3. **Provide implementation outline** (like existing phases)
4. **Update this README** to list the new idea

---

## Decision Framework

**Ask yourself:**

1. **Is it critical?** → No (otherwise it wouldn't be in parking lot)
2. **Do I want to learn this?** → Your choice!
3. **Does it add value?** → Depends on your goals
4. **Is it feasible right now?** → Check prerequisites

**If unsure:** Skip it! You can always come back later.

---

## Parking Lot vs Future Epics

**Parking Lot (this folder):**
- Optional enhancements to **Epic 3**
- Can be done anytime (before or after Epic 4)
- Well-defined, ready to implement
- Not blocking anything

**Future Epics (e.g., Epic 4, Epic 5):**
- Major new features (spaced repetition, multi-user, etc.)
- Build on completed Epic 3
- Significant scope (multiple phases)
- Planned roadmap

---

## Contributing Ideas

If you have ideas for optional features:

1. Create a phase document (like `PHASE7_AZURE_MIGRATION.md`)
2. Use this structure:
   - Overview
   - Why it's optional
   - Learning objectives
   - Implementation steps
   - Success criteria
   - Decision matrix
3. Add it to this README
4. Link from Epic 3 plan if relevant

---

## Summary

**The parking lot is for:**
- 🅿️ Ideas that are **interesting but not essential**
- 🅿️ Features that **might be revisited later**
- 🅿️ Experiments that **depend on external factors**

**Current count:** 11 ideas remaining (Azure Functions, Architecture Testing, OAuth, OpenRouter Migration, PHP VPS, iOS App Store, Internationalization, OpenRouter Onboarding UX, Dead Code Detection, Knip Enhancements, Alert to Modal Conversion)

**Status:** All documented and ready to implement when desired

---

## Recently Moved to Epic 5

The following items have been promoted from parking lot to **Epic 5: Growth & Excellence** ([see Epic 5 plan](../epic05/EPIC5_PLAN.md)):

- ✅ **Explanation Performance Improvement** → Epic 5
- ✅ **Data Deletion Feature** → Epic 5
- ✅ **Usage & Cost Tracking** (Phase 49) → Epic 5
- ✅ **Landing Page Improvements** → Epic 5
- ✅ **Google Play Store Update** → Epic 5
- ✅ **Mutation Testing Expansion** (Phases 86-87) → Epic 5

---

**Last Updated:** 2026-01-19
**Location:** `docs/parking_lot/`
**Related:**
- [Epic 3 Plan](../epic03_quizmaster_v2/EPIC3_QUIZMASTER_V2_PLAN.md)
- [Epic 5 Plan](../epic05/EPIC5_PLAN.md)
