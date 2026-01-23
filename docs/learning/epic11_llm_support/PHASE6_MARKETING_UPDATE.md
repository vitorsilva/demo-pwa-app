# Phase 6: Marketing & Landing Page Update

**Status:** Planning
**Created:** 2026-01-23
**Epic:** 11 - Multi-Provider LLM Support
**Depends on:** Phase 5 (Polish) - Complete

---

## Overview

Update the landing page and marketing materials to highlight the new multi-provider LLM support feature. This differentiates Saberloop by giving users choice and control over their AI provider.

**Key Value Proposition:** "Choose your AI - Use OpenAI, Anthropic, Google, or xAI with your own API key"

> **Skill Available:** Use `/landing-page-marketing` to access the complete workflow, templates, and guidelines for this phase. The skill provides feature card templates, CSS reference, image specifications, and deployment commands.

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

#### Before (Current - 6 cards, 3x2 grid):
```
┌─────────────────────────────────────────────────────────────────────┐
│                        Why Saberloop?                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │       🧠        │  │       🌍        │  │       🎓        │      │
│  │  AI-Powered     │  │  Learn in Your  │  │  All Skill      │      │
│  │  Learning       │  │  Language       │  │  Levels         │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │       📱        │  │       🔒        │  │       🎉        │      │
│  │  Works Offline  │  │  Your Data,     │  │  Party Mode     │      │
│  │                 │  │  Your Control   │  │                 │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### After (7 cards, 3-3-1 grid with centered 7th card):
```
┌─────────────────────────────────────────────────────────────────────┐
│                        Why Saberloop?                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │       🧠        │  │       🌍        │  │       🎓        │      │
│  │  AI-Powered     │  │  Learn in Your  │  │  All Skill      │      │
│  │  Learning       │  │  Language       │  │  Levels         │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │       📱        │  │       🔒        │  │       🎉        │      │
│  │  Works Offline  │  │  Your Data,     │  │  Party Mode     │      │
│  │                 │  │  Your Control   │  │                 │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                      │
│                    ┌─────────────────┐                               │
│                    │       🤖        │  ← NEW                        │
│                    │  Choose Your AI │                               │
│                    │  OpenAI, Anthropic, Google, xAI                 │
│                    └─────────────────┘                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**New card HTML:**
```html
<div class="feature-card">
    <div class="feature-icon">🤖</div>
    <h3>Choose Your AI</h3>
    <p>Use your own API key from OpenAI, Anthropic, Google AI, or xAI. Lower costs, more control.</p>
</div>
```

**Grid change:** 6 cards → 7 cards (CSS grid auto-flows, 7th card centers naturally)

**Files to modify:**
- `landing/index.html` - Add feature card HTML after Party Mode card (line ~730)

**Verification:**
- [ ] Card displays correctly on desktop (1200px+) - centered below 2 rows
- [ ] Card displays correctly on tablet (768-1024px) - flows in 2-col grid
- [ ] Card displays correctly on mobile (<768px) - single column

---

### Subtask 6.2: Update "Unlimited Learning" CTA Section

**Location:** CTA section at bottom of landing page

#### Before (Current):
```
┌─────────────────────────────────────────────────────────────────────┐
│                     Ready to Start Learning?                         │
│                        (Orange gradient background)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────┐  ┌────────────────────────────┐     │
│  │        Try Free            │  │    Unlimited Learning      │     │
│  │                            │  │                            │     │
│  │  ✓ Sample quizzes          │  │  ✓ Connect your OpenRouter │     │
│  │    available immediately   │  │    account                 │     │
│  │  ✓ No account needed       │  │  ✓ Choose your AI model    │     │
│  │  ✓ Works in your browser   │  │  ✓ Generate unlimited      │     │
│  │                            │  │    quizzes                 │     │
│  │  [Try in Browser]          │  │  ✓ See token usage costs   │     │
│  │                            │  │                            │     │
│  │                            │  │  [Get on Google Play]      │     │
│  └────────────────────────────┘  └────────────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### After (Updated copy):
```
┌─────────────────────────────────────────────────────────────────────┐
│                     Ready to Start Learning?                         │
│                        (Orange gradient background)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────┐  ┌────────────────────────────┐     │
│  │        Try Free            │  │    Unlimited Learning      │     │
│  │                            │  │                            │     │
│  │  ✓ Sample quizzes          │  │  ✓ Use OpenRouter, OpenAI, │     │
│  │    available immediately   │  │    Anthropic, Google, xAI  │ ← CHANGED
│  │  ✓ No account needed       │  │  ✓ Bring your own API key  │ ← CHANGED
│  │  ✓ Works in your browser   │  │    for lower costs         │     │
│  │                            │  │  ✓ Choose from multiple    │ ← CHANGED
│  │  [Try in Browser]          │  │    AI models               │     │
│  │                            │  │  ✓ See token usage & costs │ ← CHANGED
│  │                            │  │                            │     │
│  │                            │  │  Google Play: Coming Soon  │ ← CHANGED
│  │                            │  │  [Try in Browser]          │ ← CHANGED
│  └────────────────────────────┘  └────────────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Updated HTML (lines 835-844):**
```html
<div class="cta-column">
    <h3>Unlimited Learning</h3>
    <ul>
        <li>Use OpenRouter, OpenAI, Anthropic, Google AI, or xAI</li>
        <li>Bring your own API key for lower costs</li>
        <li>Choose from multiple AI models</li>
        <li>See token usage and costs</li>
    </ul>
    <p style="color: rgba(255,255,255,0.7); font-size: 0.9rem; margin-bottom: 16px;">Google Play: Coming Soon</p>
    <a href="/app/" class="btn btn-secondary" data-track="web_app_cta_unlimited">Try in Browser</a>
</div>
```

**Files to modify:**
- `landing/index.html` - Update CTA section text (lines 835-844)

**Verification:**
- [ ] Text displays correctly on desktop
- [ ] List items fit within card width on mobile (may need shorter text)
- [ ] No text overflow or wrapping issues
- [ ] "Coming Soon" text is visible and styled appropriately

---

### Subtask 6.2b: Update Hero Section Google Play Button

**Location:** Hero section (lines 675-678)

#### Before:
```
┌─────────────────────────────────────────────────────────────────────┐
│  Learn Anything, Practice Anything                                   │
│                                                                      │
│  AI-powered quizzes on any topic...                                  │
│                                                                      │
│  [▶ Get on Google Play]  [↓ Download APK]                           │
│                                                                      │
│  Or try in your browser                                              │
└─────────────────────────────────────────────────────────────────────┘
```

#### After:
```
┌─────────────────────────────────────────────────────────────────────┐
│  Learn Anything, Practice Anything                                   │
│                                                                      │
│  AI-powered quizzes on any topic...                                  │
│                                                                      │
│  [🌐 Try in Browser]  [↓ Download APK]                              │ ← CHANGED
│                                                                      │
│  Google Play: Coming Soon                                            │ ← CHANGED
└─────────────────────────────────────────────────────────────────────┘
```

**Updated HTML (lines 674-685):**
```html
<div class="hero-buttons">
    <a href="/app/" class="btn btn-primary" data-track="web_app_hero">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
        Try in Browser
    </a>
    <a href="/downloads/saberloop-v1.0.0.apk" class="btn btn-secondary" download data-track="apk_download_hero">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 16l-6-6h4V4h4v6h4l-6 6zm-6 2h12v2H6v-2z"/></svg>
        Download APK
    </a>
</div>
<p class="web-link">Google Play: Coming Soon</p>
```

**Files to modify:**
- `landing/index.html` - Update hero buttons section (lines 674-685)

**Verification:**
- [ ] "Try in Browser" is now primary CTA
- [ ] "Coming Soon" text displays below buttons
- [ ] APK download still works

---

### Subtask 6.3: Capture Screenshots

**Purpose:** Capture all screenshots needed for landing page updates.

**Reference:** Existing capture scripts in `tests/e2e/capture-*.spec.js`
- `capture-landing-assets.spec.js` - Pattern for landing page screenshots
- `capture-playstore-screenshots.spec.js` - Pattern for app store screenshots

#### Screenshots to Capture:

| Screenshot | Description | Dimensions | Output Path |
|------------|-------------|------------|-------------|
| Settings with Providers | Settings page showing LLM Providers section | 375x667 → 304x584 | `landing/images/landing-06-settings-page.png` |

#### Capture Script to Create: `tests/e2e/capture-settings-providers.spec.js`

```javascript
import { test, expect } from '@playwright/test';
import { setupAuthenticatedState, clearSessions } from './helpers.js';

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const SCREENSHOT_DIR = 'landing/images';

test.use({ viewport: MOBILE_VIEWPORT });

test.describe('Capture Settings Provider Screenshots', () => {

  test('Settings page with LLM Providers section', async ({ page }) => {
    await setupAuthenticatedState(page);
    await clearSessions(page);
    await page.reload();
    await page.waitForSelector('[data-testid="welcome-heading"]', { timeout: 10000 });

    // Navigate to Settings
    await page.goto('/#/settings');
    await page.waitForTimeout(500);

    // Scroll to LLM Providers section (ensure it's visible)
    const providerSection = page.locator('[data-testid="provider-section"]');
    if (await providerSection.isVisible()) {
      await providerSection.scrollIntoViewIfNeeded();
    }
    await page.waitForTimeout(300);

    // Capture screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/landing-06-settings-page.png`,
      fullPage: false
    });

    console.log('✓ Captured: Settings page with LLM Providers');
  });

});
```

#### Run Command:
```bash
npx playwright test tests/e2e/capture-settings-providers.spec.js --headed
```

#### Post-Processing (resize to match landing page dimensions):
```bash
# Current landing page images are 304x584
# Use Sharp or ImageMagick to resize
npx sharp-cli landing/images/landing-06-settings-page.png -o landing/images/landing-06-settings-page.png resize 304 584
```

---

#### Screenshot 1: Settings with Provider Selection

**Location:** Screenshots grid in "See It In Action" section

#### Before (Current Settings Screenshot):
```
┌───────────────────────┐
│  ← Settings           │
├───────────────────────┤
│                       │
│  Language             │
│  [English        ▼]   │
│                       │
│  Difficulty Level     │
│  [High School    ▼]   │
│                       │
│  Questions per Quiz   │
│  [5              ▼]   │
│                       │
│  Dark Mode            │
│  [Toggle: ON]         │
│                       │
│  ───────────────────  │
│  OpenRouter           │
│  ✅ Connected         │
│  [Disconnect]         │
│                       │
└───────────────────────┘
```

#### After (New Settings Screenshot - Shows Provider Selection):
```
┌───────────────────────┐
│  ← Settings           │
├───────────────────────┤
│                       │
│  LLM Providers        │  ← KEY SECTION TO SHOW
│  ─────────────────    │
│                       │
│  Active Provider      │
│  [OpenAI         ▼]   │  ← Dropdown visible
│                       │
│  Active Model         │
│  [gpt-4o-mini    ▼]   │
│                       │
│  Configured:          │
│  ┌─────────────────┐  │
│  │ ● OpenRouter ✅  │  │  ← Multiple providers
│  │ ● OpenAI     ✅  │  │    configured
│  │ ○ Anthropic  ○   │  │
│  │ ○ Google AI  ○   │  │
│  └─────────────────┘  │
│                       │
│  [+ Add Provider]     │
│                       │
└───────────────────────┘
```

**Screenshot capture process:**
1. Open app at https://saberloop.com/app/ or localhost
2. Navigate to Settings
3. Configure at least 2 providers (e.g., OpenRouter + OpenAI)
4. Scroll to show "LLM Providers" section prominently
5. Capture screenshot at mobile dimensions (360x640 viewport)

**Capture command (Playwright):**
```javascript
// In tests/e2e/capture-settings-providers.spec.js
await page.goto('/app/#settings');
await page.waitForSelector('[data-testid="provider-section"]');
await page.screenshot({
    path: 'landing/images/landing-06-settings-page.png',
    clip: { x: 0, y: 0, width: 360, height: 640 }
});
```

**Processing:**
```bash
# Resize to match other landing page images (304x584)
npx sharp-cli landing/images/landing-06-settings-page.png -o landing/images/landing-06-settings-page.png resize 304 584
```

**Files to modify:**
- `landing/images/landing-06-settings-page.png` - Replace with new screenshot

**Verification:**
- [ ] Screenshot shows LLM Providers section prominently
- [ ] At least 2 providers visible (one active, one configured)
- [ ] Provider/model dropdowns visible
- [ ] Image dimensions: 304x584 pixels
- [ ] Image file size optimized (<50KB)

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

### Phase 1: Screenshot Capture (Do First)
- [ ] 6.3: Capture settings screenshot showing LLM Providers section
- [ ] Process screenshot to 304x584 dimensions
- [ ] Verify image quality and file size

### Phase 2: Content Updates (Required)
- [ ] 6.1: Add "Choose Your AI" feature card to features grid
- [ ] 6.2: Update "Unlimited Learning" CTA text (multi-provider messaging)
- [ ] 6.2b: Update Hero section (Google Play → "Coming Soon", Try in Browser as primary)
- [ ] 6.4: Update structured data with featureList

### Phase 3: Deploy & Verify
- [ ] 6.7: Deploy landing page to production
- [ ] Verify feature card displays correctly (desktop/tablet/mobile)
- [ ] Verify CTA section text renders properly
- [ ] Verify hero buttons work correctly
- [ ] Verify new screenshot displays in grid
- [ ] Test on mobile devices (iOS Safari, Android Chrome)

### Skipped (Not Recommended)
- [ ] ~~6.5: Update meta description~~ (keep current, focused on benefits)
- [ ] ~~6.6: Add provider logos~~ (trademark concerns)

---

## Files to Modify

| File | Changes |
|------|---------|
| `landing/index.html` | Feature card, hero buttons, CTA text, structured data |
| `landing/images/landing-06-settings-page.png` | Replace with provider settings screenshot |

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

## References

### Skills
- **`/landing-page-marketing`** - Complete workflow for landing page updates including:
  - Screenshot capture with Playwright
  - Image processing specifications (304x584 for mobile)
  - Feature card HTML templates
  - CSS reference and color variables
  - Deployment commands and troubleshooting

### Developer Guides
- [E2E Testing Guide](../../developer-guide/E2E_TESTING.md) - Playwright setup, capture scripts, `npm run test:e2e:capture`
- [Deployment Guide](../../architecture/DEPLOYMENT.md) - Landing page deployment via `npm run deploy:landing`
- [Staging Deployment](../../developer-guide/STAGING_DEPLOYMENT.md) - Test changes on staging first

### Deployment Scripts
- `scripts/deploy-landing.cjs` - Landing page FTP deployment
- `scripts/deploy-ftp.cjs` - Main app deployment (with `--staging` flag for staging)

### Existing Capture Scripts (Reference Patterns)
- `tests/e2e/capture-landing-assets.spec.js` - Landing page screenshots and demo video
- `tests/e2e/capture-playstore-screenshots.spec.js` - App store screenshots
- `tests/e2e/capture-party-demo.spec.js` - Party mode demo video

### Previous Landing Page Updates
- [Epic 6: Landing Page Party Update](../epic06_sharing/LANDING_PAGE_PARTY_UPDATE.md) - Previous landing page changes
- [Epic 5: Landing Page Improvements](../epic05/PHASE52_LANDING_PAGE.md) - Earlier landing page work

### Architecture
- [LLM Integration Evolution](../../architecture/LLM_INTEGRATION_EVOLUTION.md) - History of LLM provider support

---

**Created:** 2026-01-23
