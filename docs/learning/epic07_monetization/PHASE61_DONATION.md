# Phase 61: Donation Support

**Status:** ✅ Complete
**Priority:** Medium (Supplemental Revenue)
**Estimated Effort:** 1-2 hours
**Created:** January 5, 2026
**Completed:** January 2026

## Session Log

| Date | Status | Notes |
|------|--------|-------|
| 2026-01-05 | **Plan Created** | Quick-win donation support for RevOps strategy |
| 2026-01-05 | **Updated** | Switched to Liberapay (EU-based, EUR-native, 0% fees) |

---

## Overview

Add a simple donation button to allow users to support Saberloop's development. This is a low-effort, no-infrastructure addition that complements ad revenue (Phase 60) and premium features (Phase 62) in the hybrid monetization strategy.

**Motivation:**
- Zero infrastructure needed (use existing donation platforms)
- Some users prefer to support directly rather than see ads
- Quick win (30 minutes to implement)
- Builds community goodwill and engagement
- Unpredictable but potentially valuable revenue stream

**Key Insight:** Educational/learning apps have supportive user bases. A tasteful "Support Development" option can generate €5-15/month from passionate users.

**Revenue Projection:**
- Optimistic: 2-3 donations/month × €5 = €10-15/month
- Realistic: 1 donation/month × €5 = €5/month
- Conservative: €2-5/month average

---

## What You'll Learn

### New Technologies & Concepts

1. **Donation Platforms** - Liberapay, EU payment processing, SEPA transfers
2. **Call-to-Action Design** - Non-intrusive support requests
3. **Attribution Tracking** - Understanding which users donate (optional)
4. **Community Building** - Engaging users beyond product usage

---

## Prerequisites

Before starting this phase, you should have:

- ✅ **Settings view** implemented
- ✅ **About/Help page** available
- ✅ Understanding of basic UI component integration
- ✅ Decision on which donation platform to use

---

## Platform Comparison

### Liberapay ⭐ (Recommended for EU)

| Feature | Details |
|---------|---------|
| **Based in** | France (EU) |
| **Currency** | EUR native (no conversion!) |
| **Fees** | 0% platform fee |
| **Setup time** | 5-10 minutes |
| **Payment methods** | SEPA transfer, credit card (Stripe) |
| **Minimum payout** | None |
| **Payout method** | SEPA transfer to EU bank (free!), PayPal, Stripe |
| **Features** | Recurring donations, one-time tips, open-source friendly |
| **Link format** | `https://liberapay.com/saberloop` |

**Pros:**
- **Zero fees** (completely free, funded by donations to Liberapay itself)
- **EUR-native** (no USD conversion or foreign exchange fees)
- **SEPA transfers** (cheap for EU users, free bank transfers)
- Weekly payouts
- Open-source, privacy-focused
- Supports both recurring and one-time donations

**Cons:**
- Less popular than Ko-fi (smaller user base)
- Requires EU bank account for SEPA payouts

---

### Alternative: Ko-fi (If you prefer popularity)

| Feature | Details |
|---------|---------|
| **Currency** | USD-based (conversion to EUR) |
| **Fees** | 0% for donations, 5% for memberships |
| **Payment methods** | PayPal, Stripe |
| **Link format** | `https://ko-fi.com/yourusername` |

**Cons for EU:** Processes in USD, then converts to EUR (FX fees)

---

### Alternative: GitHub Sponsors (If open-source)

| Feature | Details |
|---------|---------|
| **Fees** | 0% (GitHub covers fees) |
| **Currency** | USD-based |
| **Minimum payout** | $100 |

**Cons for EU:** USD conversion, high minimum payout

---

**Recommendation:** **Liberapay** for EU-based operation with EUR and zero fees.

---

## Implementation Plan

### 61.1 Create Liberapay Account

**Time:** 5-10 minutes

**Steps:**

1. **Go to https://liberapay.com**
2. **Sign up** with email or GitHub account
3. **Choose username:** `saberloop` (or similar)
4. **Set up receiving method:**
   - Add your Portuguese bank account (IBAN) for SEPA transfers
   - Or add PayPal/Stripe as alternative
   - **Recommended:** SEPA (free transfers, EUR-native)
5. **Customize profile:**
   - Display name: "Saberloop"
   - Description: "Support the development of Saberloop, a free AI-powered quiz app"
   - Add logo/avatar (use Saberloop icon)
   - Set currency: **EUR**
6. **Configure donation options:**
   - Enable both recurring and one-time donations
   - Suggested amounts: €1, €3, €5, €10 per week/month
7. **Get your donation link:** `https://liberapay.com/saberloop`

**Why SEPA?**
- Free bank transfers within EU
- EUR-native (no conversion)
- Weekly payouts
- No PayPal fees

**No commit needed** (external platform)

---

### 61.2 Add Donation Button to Settings

**Time:** 15-30 minutes

**File:** `src/views/SettingsView.js`

**Changes:**

Add a new section at the bottom of settings:

```javascript
// In renderSettingsView()

<div class="settings-section">
  <h2 class="settings-section-title">
    ${t('settings.support.title')}
  </h2>

  <div class="support-card">
    <p class="support-message">
      ${t('settings.support.message')}
    </p>

    <a
      href="https://liberapay.com/saberloop"
      target="_blank"
      rel="noopener noreferrer"
      class="btn btn-support"
      data-testid="donation-link"
    >
      <span class="btn-icon">💝</span>
      ${t('settings.support.button')}
    </a>

    <p class="support-note">
      ${t('settings.support.note')}
    </p>
  </div>
</div>
```

**Styling notes:**
- Use subtle styling (not flashy/aggressive)
- Place at bottom of settings (non-intrusive)
- Clear but gentle call-to-action

**Commit:** `feat(monetization): add donation support link`

---

### 61.3 Add i18n Translations

**Time:** 15 minutes

**Files:** `public/locales/*/translation.json`

**English (en):**
```json
{
  "settings": {
    "support": {
      "title": "Support Development",
      "message": "Saberloop is free and open to all. If you find it helpful, consider supporting its development.",
      "button": "Support on Liberapay",
      "note": "Your support helps cover hosting and development costs. Thank you! ❤️"
    }
  }
}
```

**Portuguese (pt):**
```json
{
  "settings": {
    "support": {
      "title": "Apoiar o Desenvolvimento",
      "message": "O Saberloop é gratuito e aberto a todos. Se achar útil, considere apoiar o seu desenvolvimento.",
      "button": "Apoiar no Liberapay",
      "note": "O seu apoio ajuda a cobrir custos de hospedagem e desenvolvimento. Obrigado! ❤️"
    }
  }
}
```

**Commit:** `feat(i18n): add donation support translations`

---

### 61.4 Add Donation Styles

**Time:** 15 minutes

**File:** `src/styles/components/support.css` (new)

```css
/* Support Section */
.support-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.support-message {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1.25rem;
}

.btn-support {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-support:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-icon {
  font-size: 1.2em;
}

.support-note {
  color: var(--text-tertiary);
  font-size: 0.85rem;
  margin-top: 1rem;
  font-style: italic;
}

/* Responsive */
@media (max-width: 640px) {
  .support-card {
    padding: 1rem;
  }

  .btn-support {
    width: 100%;
    justify-content: center;
  }
}
```

**Commit:** `style(monetization): add donation support styles`

---

### 61.5 Optional: Add to About/Help Page

**Time:** 10 minutes

**File:** `src/views/HelpView.js` or `src/views/AboutView.js`

Add a small mention at the bottom:

```javascript
<footer class="help-footer">
  <p>
    Enjoying Saberloop?
    <a href="https://liberapay.com/saberloop" target="_blank" rel="noopener">
      Support development 💝
    </a>
  </p>
</footer>
```

**Commit:** `feat(monetization): add donation link to help page`

---

### 61.6 Testing

**Time:** 15 minutes

**Manual Testing:**
- [ ] Donation button visible in Settings
- [ ] Link opens Ko-fi page in new tab
- [ ] Button styling looks good on mobile
- [ ] Translations work in all languages
- [ ] Link uses `rel="noopener noreferrer"` for security

**E2E Test (Optional):**

File: `tests/e2e/donation.spec.js`

```javascript
test('donation link is visible in settings', async ({ page }) => {
  await page.goto('/settings');

  const donationLink = page.locator('[data-testid="donation-link"]');
  await expect(donationLink).toBeVisible();
  await expect(donationLink).toHaveAttribute('href', /liberapay\.com/);
  await expect(donationLink).toHaveAttribute('target', '_blank');
});
```

**Commit:** `test(monetization): add donation link tests`

---

## Success Criteria

- [ ] Donation platform account created and configured
- [ ] Donation button visible in Settings page
- [ ] Link opens in new tab (security: `rel="noopener"`)
- [ ] Button styling is tasteful and non-intrusive
- [ ] Translations available in all supported languages
- [ ] Button works on mobile devices
- [ ] No console errors

---

## Best Practices

### Do's
✅ Keep messaging humble and appreciative
✅ Place in low-traffic areas (Settings, About)
✅ Make it optional and non-intrusive
✅ Thank donors publicly (with permission)
✅ Be transparent about what donations cover

### Don'ts
❌ Don't make it feel like begging
❌ Don't interrupt user flow with donation prompts
❌ Don't gate features behind donations
❌ Don't show donation prompts repeatedly
❌ Don't make users feel guilty for not donating

---

## Promoting Donations (Optional)

If you want to encourage donations without being pushy:

1. **Update landing page footer:**
   - Small text: "Support this project 💝"

2. **Add to GitHub README:**
   - "Like this project? [Support on Liberapay](https://liberapay.com/saberloop)"

3. **Celebrate milestones:**
   - "Thanks to 10 supporters, we've covered hosting costs this month!"

4. **Show impact:**
   - In Settings: "5 supporters this month → Hosting costs covered ✅"

5. **Add Liberapay badge to README:**
   ```markdown
   [![Liberapay](https://img.shields.io/liberapay/receives/saberloop.svg?logo=liberapay)](https://liberapay.com/saberloop/)
   ```

---

## Revenue Tracking

**How to track:**
1. Liberapay dashboard shows all donations
2. Weekly email summaries
3. Export data via Liberapay API (optional)
4. Add to RevOps spreadsheet manually

**SEPA Benefits:**
- No fees on EUR transfers
- Direct to Portuguese bank account
- Weekly payouts (Fridays)

**Expected performance:**
- Month 1-2: €0-5 (slow start)
- Month 3-6: €5-10 (as user base grows)
- Month 6+: €10-20 (with 50+ MAU)

---

## Integration with RevOps Strategy

This phase is **Part 2** of the hybrid monetization strategy:

1. **Phase 60**: AdSense → €1-5/month
2. **Phase 61 (This)**: Donations → €5-15/month ✅
3. **Phase 62**: License key premium → €30-50/month

**Combined target:** €36-70/month (exceeds €31.25 break-even)

---

## Common Questions

**Q: Will this annoy users?**
A: Not if done tastefully. Keep it in Settings/About only, never interrupt user flow.

**Q: Should I offer perks to donors?**
A: Not necessary. Premium features should be via license key (Phase 62). Donations are pure support.

**Q: How much should I suggest?**
A: Liberapay allows custom amounts. Suggest €1, €3, €5, €10 per week or month. Start with €3/month as default.

**Q: What if no one donates?**
A: That's OK! It's zero effort to maintain, and even €5/month helps. Focus on Phase 62 for reliable revenue.

---

## Future Enhancements (Out of Scope)

1. **Donor Recognition** - Optional "Supporters" page (Liberapay provides public supporter list)
2. **Progress Bar** - "€15/€31 monthly goal reached" (can embed Liberapay widget)
3. **Donation Tiers** - Liberapay supports different recurring amounts
4. **Team Account** - Share donations with contributors (if you add team members)

---

## References

- [Liberapay Documentation](https://liberapay.com/about/)
- [Liberapay for Teams](https://liberapay.com/about/teams)
- [SEPA Transfers Explained](https://www.europeanpaymentscouncil.eu/what-we-do/sepa-instant-credit-transfer)
- [Ethical Donation Requests](https://www.indiehackers.com/post/asking-for-donations-without-being-annoying)
- [Open Source Sustainability](https://opensource.guide/getting-paid/)

---

**Next Steps:** After completing Phase 61, proceed to Phase 62 (License Key Premium) for the primary revenue driver in the monetization strategy.
