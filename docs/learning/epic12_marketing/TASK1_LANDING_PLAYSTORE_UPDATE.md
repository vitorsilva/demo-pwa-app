# Task 1: Landing Page & Play Store Update for Party Mode

**Created:** January 19, 2026
**Status:** Planning
**Priority:** High
**Depends on:** Party Mode live in production (Epic 6 Complete)

---

## Executive Summary

Update both the landing page and Google Play Store listing to showcase Party Mode - the major new feature that transforms Saberloop from a solo learning tool into a social quiz platform.

**Current State:** Party Mode is live in production but not marketed
**Goal:** Update all marketing materials to highlight multiplayer capabilities

---

## Gap Analysis

### Features Live But Not Marketed

| Feature | Live Since | Marketing Impact |
|---------|------------|------------------|
| Party Mode (real-time multiplayer) | Epic 6 | **Major** - Key differentiator |
| Learning/Party Mode toggle | Epic 6 | Medium - Visual distinction |
| Quiz sharing via URL | Epic 6 | Medium - Social enabler |
| Room codes for friends | Epic 6 | Medium - Easy to join |
| Live leaderboards | Epic 6 | Medium - Competitive element |
| WebRTC P2P communication | Epic 6 | Low - Technical detail |

---

## Landing Page Updates

### 1. Hero Section

**Current Subtitle:**
> "AI-powered quizzes on any topic, in 5 languages, with explanations that help you truly understand. Free to try, works offline."

**Proposed Subtitle:**
> "AI-powered quizzes on any topic, in 5 languages. Learn solo or challenge friends in real-time Party Mode. Free to try, works offline."

**File:** `landing/index.html`

---

### 2. Feature Cards (6 -> 7 Cards)

**Current Cards:**
1. AI-Powered Learning
2. Learn in Your Language
3. Adaptive Difficulty
4. All Skill Levels
5. Works Offline
6. Your Data, Your Control

**Add New Card:**
```html
<div class="feature-card">
    <div class="feature-icon">🎉</div>
    <h3>Party Mode</h3>
    <p>Challenge friends in real-time quiz battles. Create a room, share the code, compete live!</p>
</div>
```

**CSS Consideration:** Grid changes from 6 cards (3x2) to 7 cards. Options:
- **A)** 7 cards with adjusted grid (4-3 or 3-4 layout)
- **B)** Replace one card (merge similar features)
- **C)** Keep 6 cards, make Party Mode a dedicated section

**Recommendation:** Option A - Keep all 7 cards. Party Mode deserves feature card prominence.

---

### 3. Screenshots Section (5 -> 6 Screenshots)

**Current Screenshots:**
1. Quiz in action
2. Explanation modal
3. Share results
4. Usage cost
5. Settings

**Add Party Mode Screenshot:**
- **Best candidate:** `06-party-quiz-gameplay.png` from `docs/product-info/screenshots/party/`
- Shows live quiz with scoreboard - most visually compelling

**Processing Required:**
1. Copy from `docs/product-info/screenshots/party/06-party-quiz-gameplay.png`
2. Process with `scripts/process-screenshots.cjs` using `landing` preset
3. Save to `landing/images/`

---

### 4. Meta Tags Update

**Current meta description:**
> "Saberloop - AI-powered quizzes on any topic in 5 languages. Get explanations for wrong answers, adaptive difficulty, and works offline."

**Proposed:**
> "Saberloop - AI quizzes on any topic in 5 languages. Learn solo or challenge friends in Party Mode. Works offline."

**Files to update:**
- `landing/index.html` - `<meta name="description">`
- `landing/index.html` - `<meta property="og:description">`
- `landing/index.html` - `<meta name="twitter:description">`

---

### 5. Optional: Dedicated Party Mode Section

If analytics show high interest, consider adding a dedicated section below features:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Challenge Your Friends                        │
│  ┌───────────────────────┐  ┌─────────────────────────────────┐ │
│  │                       │  │  🎉 Party Mode                  │ │
│  │   [Party Screenshot]  │  │                                 │ │
│  │                       │  │  Create a quiz room, share the  │ │
│  │                       │  │  code with friends, and compete │ │
│  │                       │  │  in real-time!                  │ │
│  │                       │  │                                 │ │
│  │                       │  │  • Real-time multiplayer        │ │
│  │                       │  │  • Live leaderboard             │ │
│  │                       │  │  • No accounts needed           │ │
│  └───────────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Recommendation:** Start simple (feature card + screenshot). Expand later if metrics justify.

---

## Play Store Updates

### 1. Short Description (80 char max)

**Current:**
> "Learn any topic in 5 languages with AI quizzes. Free, offline, privacy-first."

**Proposed Options:**

**A - Multiplayer Focus (79 chars):**
```
AI quizzes on any topic. Learn solo or challenge friends in real-time battles!
```

**B - Feature Balance (80 chars):**
```
AI quizzes in 5 languages. Learn solo or with friends. Free, offline, private.
```

**C - Party Highlight (78 chars):**
```
Quiz with friends in real-time! AI-powered, 5 languages, works offline. Free.
```

**Recommendation:** Option A - Leads with multiplayer as differentiator.

---

### 2. Full Description Update

**Add to existing description (after "SHARE YOUR PROGRESS" section):**

```
🎉 PARTY MODE
Challenge friends in real-time quiz battles! Create a room, share the code, and compete with live scores. No accounts needed - just share and play.
```

**Update KEY FEATURES section:**
```
✨ KEY FEATURES
• AI-powered question generation (multiple AI models available)
• 🆕 Party Mode - real-time multiplayer quiz battles
• 5 languages: English, Portuguese, Spanish, French, German
• Adaptive difficulty with "Continue on Topic" feature
• Detailed explanations for wrong answers
• Share results to social media
• Customizable quiz length (5, 10, or 15 questions)
• Progress tracking and full quiz history
• Works completely offline
• No ads, no tracking, no accounts
```

**Update PERFECT FOR section:**
```
🎯 PERFECT FOR
• Students preparing for exams
• Language learners practicing vocabulary
• 🆕 Friends competing in quiz nights
• Parents helping kids learn
• Lifelong learners exploring new topics
• Anyone wanting to test and expand their knowledge
```

---

### 3. Screenshots Update

**Current Order (8 screenshots):**
1. Quiz question
2. Explanation modal
3. Results + Continue
4. Settings
5. Home history
6. Share results
7. Topic input
8. Portuguese quiz

**Proposed Order (keep 8, replace 1-2):**
1. **Party quiz gameplay** (NEW - shows live multiplayer)
2. Quiz question
3. Explanation modal
4. **Party lobby** (NEW - shows room code)
5. Results + Continue
6. Share results
7. Settings
8. Home with Party Mode toggle

**Screenshots to Capture:**
- Party quiz gameplay (exists: `docs/product-info/screenshots/party/06-party-quiz-gameplay.png`)
- Party lobby (exists: `docs/product-info/screenshots/party/05-party-lobby-participants.png`)
- Home with Party toggle (exists: `docs/product-info/screenshots/party/02-home-party-mode.png`)

**Processing Required:**
1. Use existing Party screenshots from `docs/product-info/screenshots/party/`
2. Process with `scripts/process-screenshots.cjs` using `playstore` preset
3. Upload to Play Console in new order

---

### 4. What's New Text

```
🎉 NEW: Party Mode!
Challenge friends in real-time quiz battles:
• Create a room and share the code
• Compete with live scores
• See final leaderboard
• No accounts needed!

Also: Bug fixes and performance improvements.
```

---

## Implementation Checklist

### Phase 1: Asset Preparation

- [ ] Process Party Mode screenshot for landing page (304x584)
- [ ] Process 3 Party Mode screenshots for Play Store (1080x1920)
- [ ] Verify all images display correctly locally

### Phase 2: Landing Page Updates

- [ ] Update hero subtitle to mention Party Mode
- [ ] Add Party Mode feature card
- [ ] Adjust CSS grid for 7 cards
- [ ] Add Party Mode screenshot to gallery
- [ ] Update meta description
- [ ] Update OG description
- [ ] Update Twitter description

### Phase 3: Testing Landing Page

- [ ] Test responsive layout (mobile, tablet, desktop)
- [ ] Verify all images load correctly
- [ ] Run Lighthouse for performance check
- [ ] Deploy to staging and verify

### Phase 4: Play Store Updates (Manual)

- [ ] Update short description
- [ ] Update full description with Party Mode section
- [ ] Update KEY FEATURES section
- [ ] Update PERFECT FOR section
- [ ] Delete old screenshots
- [ ] Upload new screenshots in correct order
- [ ] Add What's New text
- [ ] Save and preview

### Phase 5: Deploy & Verify

- [ ] Deploy landing page to production
- [ ] Submit Play Store changes
- [ ] Verify live landing page
- [ ] Verify Play Store listing (may take hours)
- [ ] Update `docs/product-info/playstore-listing-update.md` with new copy

---

## Files to Modify

| File | Changes |
|------|---------|
| `landing/index.html` | Hero subtitle, feature card, CSS grid, screenshot, meta tags |
| `landing/images/` | Add `landing-party-gameplay.png` |
| `docs/product-info/playstore-listing-update.md` | Update all copy |
| `docs/product-info/screenshots/playstore/` | Add processed Party screenshots |

---

## Reusable Assets

### Existing Party Screenshots
**Location:** `docs/product-info/screenshots/party/`

| File | Content | Use For |
|------|---------|---------|
| `02-home-party-mode.png` | Home with Party buttons | Play Store |
| `05-party-lobby-participants.png` | Lobby with room code | Play Store |
| `06-party-quiz-gameplay.png` | Live quiz with scoreboard | Landing + Play Store |
| `07-party-results.png` | Final leaderboard | Optional |

### Existing Processing Tools
- `scripts/process-screenshots.cjs` - Resize and optimize
- `tests/e2e/capture-party-demo.spec.js` - Recapture if needed

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Landing page bounce rate | Decrease 5% | Google Analytics |
| Play Store impressions | Increase 10% | Play Console |
| Party Mode usage | 50 sessions/month | Telemetry |
| App installs from Play Store | Increase 10% | Play Console |

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| [LANDING_PAGE_PARTY_UPDATE.md](../epic06_sharing/LANDING_PAGE_PARTY_UPDATE.md) | Original Epic 6 plan (not implemented) |
| [PHASE52_LANDING_PAGE.md](../epic05/PHASE52_LANDING_PAGE.md) | Previous landing page implementation |
| [PHASE53_PLAY_STORE_UPDATE.md](../epic05/PHASE53_PLAY_STORE_UPDATE.md) | Previous Play Store implementation |
| [playstore-listing-update.md](../../product-info/playstore-listing-update.md) | Current Play Store copy |
| [README.md](../../product-info/README.md) | Asset index |

---

## Notes

- Keep changes focused on Party Mode addition, not a full redesign
- Follow existing visual style (dark background, orange accents)
- Test on mobile first - majority of traffic is mobile
- Party Mode screenshots already exist - minimal capture work needed
- Play Store changes typically go live within hours (no full review)

---

**Last Updated:** January 19, 2026
