# Epic 7: Monetization - Revenue Streams

**Status:** In Progress
**Created:** 2026-01-06
**Updated:** 2026-01-15

---

## Executive Summary

Implement a hybrid monetization strategy for Saberloop to achieve break-even revenue of ~€31.25/month. The strategy combines three complementary approaches:

1. **AdSense** - Passive revenue from free-tier users
2. **Donations** - Community support from engaged users
3. **Premium License** - Primary revenue driver with no-backend implementation

**Key insight**: All three monetization methods require ZERO backend infrastructure, keeping operational costs minimal while maximizing revenue potential.

---

## MVP Scope

### What's IN

| Phase | Feature | Priority | Revenue Target | Status | Document |
|-------|---------|----------|----------------|--------|----------|
| **60** | AdSense Integration | High | €1-5/month | Planning | [PHASE60_ADSENSE_MONETIZATION.md](./PHASE60_ADSENSE_MONETIZATION.md) |
| **61** | Donation Support | Medium | €2-15/month | ✅ Complete | [PHASE61_DONATION.md](./PHASE61_DONATION.md) |
| **62** | License Key Premium | High | €20-80/month | Planning | [PHASE62_LICENSE_KEY_PREMIUM.md](./PHASE62_LICENSE_KEY_PREMIUM.md) |

### Reference Documentation

- **PHASE60_MONETIZATION_REFERENCE.md**: Detailed code reference for AdSense implementation

### What's OUT (Post-MVP)

- Subscription-based recurring payments
- Server-side license validation
- Multiple premium tiers
- Affiliate/referral programs
- Sponsorship integrations

---

## Revenue Strategy

### Break-Even Target

**Monthly operating cost:** ~€31.25/month
- Hosting/infrastructure: €10/month
- Development tools: €15/month
- Domain/SSL: €6.25/month

### Revenue Mix (Target)

| Source | Conservative | Realistic | Optimistic |
|--------|-------------|-----------|------------|
| AdSense | €1/month | €3/month | €5/month |
| Donations | €2/month | €5/month | €15/month |
| Premium Licenses | €20/month | €50/month | €80/month |
| **Total** | €23/month | €58/month | €100/month |

**Target:** Achieve realistic scenario (€58/month) to cover costs with buffer.

---

## Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Ad Network | Google AdSense | Industry standard, good RPM, easy integration |
| Donation Platform | Liberapay | EU-based, EUR-native, 0% platform fees |
| Payment Processor | Paddle | Handles EU VAT, EUR-native, MoR model |
| License Validation | Client-side | No backend needed at small scale |
| Premium Features | Ad-free + extras | Clear value proposition |

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Monthly revenue | ≥€31.25 | Payment platforms + AdSense dashboard |
| Ad revenue RPM | >€1 | AdSense dashboard |
| Premium conversion | 10-15% | Licenses sold / MAU |
| Donation rate | 1-2/month | Liberapay dashboard |
| User churn (after ads) | <5% | Telemetry: MAU comparison |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| AdSense rejection | Ensure quality content, clear privacy policy, no policy violations |
| Ads hurting UX | Only show during loading screens (natural wait times) |
| Low premium conversion | A/B test pricing and feature set |
| License key sharing | Acceptable at small scale; monitor and reassess |
| GDPR compliance | Cookie consent banner, clear privacy policy |

---

## Implementation Order

**Sequence:**

1. ~~**Phase 61 (Donations)**~~ ✅ Complete
   - Liberapay integration live

2. **Phase 60 (AdSense)** - 4-5 days + approval wait ← **Next**
   - Passive revenue during LLM loading screens
   - Requires Google approval (1-7 days)

3. **Phase 62 (Premium)** - 2-3 days
   - Primary revenue driver
   - Requires payment processor setup

**Remaining effort:** 6-8 days (excluding approval waits)

---

## Development Standards

These standards apply to ALL phases in this epic.

### Testing Requirements

**Per Phase Checklist:**

| Requirement | Phase 60 | Phase 61 | Phase 62 |
|-------------|----------|----------|----------|
| Unit tests for new services | ✅ | ✅ | ✅ |
| E2E tests for user flows | ✅ | ✅ | ✅ |
| Coverage ≥80% on new code | ✅ | ✅ | ✅ |
| JSDoc on public functions | ✅ | ✅ | ✅ |
| Architecture tests | ✅ | ✅ | ✅ |
| Deploy to staging + test | ✅ | ✅ | ✅ |
| Deploy to production | ✅ | ✅ | ✅ |

### Privacy & Compliance

**Required for all monetization:**

- [ ] Cookie consent banner for ads
- [ ] Privacy policy updated with ad/payment info
- [ ] GDPR-compliant data handling
- [ ] Clear disclosure of paid features
- [ ] Refund policy for premium purchases

### Branch & Commit Strategy

**Branch Naming:**
```
feature/phase60-adsense
feature/phase61-donations
feature/phase62-premium-license
```

**Commit Prefixes:**
- `feat(monetization)`: New monetization feature
- `fix(monetization)`: Bug fix
- `docs(monetization)`: Documentation
- `test(monetization)`: Tests only

### Learning Notes & Status Updates

**Learning Notes Location:**
```
docs/learning/epic07_monetization/
├── EPIC7_MONETIZATION_PLAN.md
├── PHASE60_ADSENSE_MONETIZATION.md
├── PHASE60_LEARNING_NOTES.md
├── PHASE61_DONATION.md
├── PHASE61_LEARNING_NOTES.md
├── PHASE62_LICENSE_KEY_PREMIUM.md
└── PHASE62_LEARNING_NOTES.md
```

---

## Next Steps

1. Review this plan
2. Decide implementation order (recommended: 61 → 60 → 62)
3. Begin with chosen phase

---

**Last Updated:** 2026-01-06
