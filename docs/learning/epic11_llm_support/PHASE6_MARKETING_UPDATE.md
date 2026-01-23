# Phase 6: Marketing & Landing Page Update

**Status:** Planning
**Created:** 2026-01-23
**Epic:** 11 - Multi-Provider LLM Support
**Depends on:** Phase 5 (Polish) - Complete

---

## Overview

Update the landing page and marketing materials to highlight the new multi-provider LLM support feature. This differentiates Saberloop by giving users choice and control over their AI provider.

**Key Value Proposition:** "Choose your AI - Use OpenAI, Anthropic, Google, or xAI with your own API key"

---

## Current Landing Page Analysis

| Section | Current Content | Multi-Provider Impact |
|---------|-----------------|----------------------|
| Hero | Video demo, mentions Party Mode | No change needed |
| Features | 6 cards (AI, Language, Levels, Offline, Privacy, Party) | **Add "Choose Your AI" card** |
| "Unlimited Learning" CTA | Mentions OpenRouter only | **Update to mention all providers** |
| Screenshots | 6 screenshots (includes settings) | **Update settings screenshot to show providers** |
| Structured Data | Basic app info | **Add supported AI providers** |

---

## Implementation Plan

### Subtask 6.1: Add Multi-Provider Feature Card

**Location:** Features grid (currently 6 cards)

**New card to add:**
```html
<div class="feature-card">
    <div class="feature-icon">🤖</div>
    <h3>Choose Your AI</h3>
    <p>Use your own API key from OpenAI, Anthropic, Google AI, or xAI. Lower costs, more control.</p>
</div>
```

**Grid change:** 6 cards → 7 cards

**CSS adjustment needed:**
```css
/* 7 cards: 3-4 layout on desktop, 2-2-2-1 on tablet, 1 column on mobile */
.features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
}

/* First row: 3 cards, Second row: 4 cards centered */
/* Alternative: Keep 3-col grid, 7th card centered below */
```

**Recommendation:** Add as 7th card. The grid will naturally flow 3-3-1 on desktop with the last card centered, or adjust to 4-3 layout.

**Files to modify:**
- `landing/index.html` - Add feature card HTML

**Verification:**
- [ ] Card displays correctly on desktop (1200px+)
- [ ] Card displays correctly on tablet (768-1024px)
- [ ] Card displays correctly on mobile (<768px)

---

### Subtask 6.2: Update "Unlimited Learning" CTA Section

**Current text (lines 835-844):**
```html
<div class="cta-column">
    <h3>Unlimited Learning</h3>
    <ul>
        <li>Connect your OpenRouter account</li>
        <li>Choose your AI model</li>
        <li>Generate unlimited quizzes</li>
        <li>See token usage costs</li>
    </ul>
    ...
</div>
```

**Updated text:**
```html
<div class="cta-column">
    <h3>Unlimited Learning</h3>
    <ul>
        <li>Use OpenRouter, OpenAI, Anthropic, Google AI, or xAI</li>
        <li>Bring your own API key for lower costs</li>
        <li>Choose from multiple AI models</li>
        <li>See token usage and costs</li>
    </ul>
    ...
</div>
```

**Files to modify:**
- `landing/index.html` - Update CTA section text

**Verification:**
- [ ] Text displays correctly
- [ ] List items fit within card width on mobile

---

### Subtask 6.3: Capture New Settings Screenshot

**Current screenshot:** `landing/images/landing-06-settings-page.png` - Shows basic settings

**New screenshot needed:** Settings page showing LLM Providers section with:
- Provider dropdown visible
- Multiple providers configured (at least 2)
- Model selection visible

**Screenshot capture process:**
1. Open app in Playwright/browser
2. Navigate to Settings
3. Configure at least 2 providers (e.g., OpenRouter + OpenAI)
4. Capture screenshot at mobile dimensions (360x640 viewport → 304x584 output)

**Processing:**
```bash
# Use Sharp to resize/crop to match other landing page images
node scripts/process-screenshot.js settings-providers.png landing-06-settings-page.png
```

**Files to modify:**
- `landing/images/landing-06-settings-page.png` - Replace with new screenshot
- Or add new: `landing/images/landing-providers-settings.png`

**Verification:**
- [ ] Screenshot shows provider selection UI
- [ ] Image dimensions match other screenshots (304x584)
- [ ] Image file size is optimized (<50KB)

---

### Subtask 6.4: Update Structured Data

**Current structured data (lines 52-70):**
```json
{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Saberloop",
    ...
}
```

**Add AI provider information:**
```json
{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Saberloop",
    "operatingSystem": "Android",
    "applicationCategory": "EducationalApplication",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
    },
    "description": "AI-powered quiz app supporting multiple LLM providers. Generate unlimited quizzes using OpenAI, Anthropic, Google AI, xAI, or OpenRouter.",
    "featureList": [
        "AI-powered quiz generation",
        "Multiple LLM provider support (OpenAI, Anthropic, Google AI, xAI, OpenRouter)",
        "Multi-language support (English, Portuguese, Spanish, French, German)",
        "Offline mode",
        "Party Mode multiplayer",
        "Adaptive difficulty levels"
    ],
    "screenshot": "https://saberloop.com/app/icons/screenshot-mobile-1.png",
    "author": {
        "@type": "Person",
        "name": "Vitor Silva"
    }
}
```

**Files to modify:**
- `landing/index.html` - Update JSON-LD structured data

**Verification:**
- [ ] Structured data validates at https://validator.schema.org/
- [ ] Google Search Console shows no structured data errors

---

### Subtask 6.5: Update Meta Description (Optional)

**Current meta description (line 6):**
```html
<meta name="description" content="Saberloop - AI-powered quizzes on any topic in 5 languages. Learn solo or challenge friends in Party Mode. Works offline.">
```

**Consider updating to:**
```html
<meta name="description" content="Saberloop - AI-powered quizzes using OpenAI, Anthropic, Google AI or OpenRouter. Learn any topic in 5 languages. Party Mode multiplayer. Works offline.">
```

**Analysis:**
- Current description is strong and focused on user benefits
- Adding provider names may help SEO for users searching "OpenAI quiz app"
- Risk: May make description too technical/long

**Recommendation:** Keep current description. Provider choice is a power-user feature; landing page should focus on primary benefits. Structured data handles the SEO aspect.

**Decision:** Skip this subtask unless analytics show users searching for specific providers.

---

### Subtask 6.6: Create Provider Logos/Icons (Optional)

**Concept:** Add small provider logos in the "Choose Your AI" feature card or settings screenshot

**Considerations:**
- Logo usage requires permission from each provider
- OpenAI, Anthropic, Google have brand guidelines
- May add visual clutter

**Recommendation:** Skip for now. Text-based feature card is simpler and avoids trademark issues.

---

### Subtask 6.7: Deploy and Verify

**Deployment:**
```bash
npm run deploy:landing
```

**Verification checklist:**
- [ ] Landing page loads correctly
- [ ] New feature card displays properly
- [ ] CTA section text is updated
- [ ] Settings screenshot is updated (if captured)
- [ ] Structured data validates
- [ ] Mobile layout works correctly
- [ ] All tracking events fire correctly

---

## Implementation Checklist

### Phase 1: Content Updates (Required)
- [ ] 6.1: Add "Choose Your AI" feature card
- [ ] 6.2: Update "Unlimited Learning" CTA text
- [ ] 6.4: Update structured data with featureList

### Phase 2: Visual Updates (Recommended)
- [ ] 6.3: Capture and replace settings screenshot showing providers

### Phase 3: Deploy & Verify
- [ ] 6.7: Deploy to production
- [ ] 6.7: Verify all changes live
- [ ] Test on mobile devices

### Skipped (Not Recommended)
- [ ] ~~6.5: Update meta description~~ (keep current, focused on benefits)
- [ ] ~~6.6: Add provider logos~~ (trademark concerns)

---

## Files to Modify

| File | Changes |
|------|---------|
| `landing/index.html` | Feature card, CTA text, structured data |
| `landing/images/landing-06-settings-page.png` | Replace with provider settings screenshot (optional) |

---

## Success Metrics

Track in Google Analytics:
- Landing page → App conversion rate (existing)
- Scroll depth to Features section (existing)
- Click-through on "Unlimited Learning" CTA

**New tracking to add:**
- None needed - existing tracking covers the changes

---

## Rollback Plan

If issues arise:
1. Keep backup of current `landing/index.html`
2. Revert via git: `git checkout HEAD~1 landing/index.html`
3. Re-deploy: `npm run deploy:landing`

---

## Estimated Effort

| Subtask | Time |
|---------|------|
| 6.1 Feature card | 15 min |
| 6.2 CTA text | 10 min |
| 6.3 Screenshot | 30 min |
| 6.4 Structured data | 15 min |
| 6.7 Deploy & verify | 15 min |
| **Total** | **~1.5 hours** |

---

## Notes

- Keep changes minimal - Multi-provider is an addition, not a redesign
- Follow existing visual style (dark background, orange accents)
- Test on mobile first - most traffic is mobile
- The feature card emoji (🤖) matches the AI/tech theme

---

**Created:** 2026-01-23
