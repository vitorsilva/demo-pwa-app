# Phase 3: Test & Submit

**Epic:** 08 - iOS
**Time:** 1-2 sessions
**Mac Required:** Yes
**Prerequisites:** Phase 2 complete (app builds successfully)

---

## 3.1 Test on Your iPhone

**Option A: Via USB (requires free Apple ID)**

1. Connect iPhone to Mac via USB
2. Trust the computer on iPhone if prompted
3. In Xcode, select your iPhone from device dropdown
4. Click Run (Play button) or Cmd+R
5. App installs and launches on device
6. Test all features

**Option B: Via TestFlight (requires Developer Account)**

Better for sharing with others - see section 3.2

---

## 3.2 TestFlight Distribution

**TestFlight** is Apple's official beta testing platform.

**Steps:**

1. **Archive the app**
   - In Xcode: Product → Archive
   - Wait for archive to complete
   - Organizer window opens automatically

2. **Upload to App Store Connect**
   - In Organizer, select your archive
   - Click "Distribute App"
   - Select "App Store Connect"
   - Choose "Upload"
   - Follow prompts (accept defaults)
   - Wait for upload (2-5 minutes)

3. **Configure in App Store Connect**
   - Go to https://appstoreconnect.apple.com
   - Select your app (create if needed - see 3.3)
   - Go to "TestFlight" tab
   - Your build appears (may take 10-30 minutes to process)
   - Add test information if prompted

4. **Add testers**
   - Internal Testing: Add up to 100 App Store Connect users
   - External Testing: Add up to 10,000 testers via email
   - External testing requires brief review (~24-48h)

5. **Test via TestFlight**
   - Testers receive email invitation
   - Install TestFlight app from App Store
   - Accept invitation and install beta

---

## 3.3 Create App in App Store Connect

**Steps:**

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: Saberloop
   - Primary Language: English
   - Bundle ID: com.saberloop.app (must match Xcode)
   - SKU: saberloop-001 (your internal ID)
   - User Access: Full Access

---

## 3.4 Prepare App Store Listing

**Required assets:**

| Asset | Specification |
|-------|---------------|
| App Icon | 1024x1024 PNG (no alpha) |
| Screenshots (iPhone 6.7") | 1290x2796 or 2796x1290 |
| Screenshots (iPhone 6.5") | 1242x2688 or 2688x1242 |
| Screenshots (iPhone 5.5") | 1242x2208 or 2208x1242 |
| Description | Up to 4000 characters |
| Keywords | Up to 100 characters |
| Support URL | Your website/contact |
| Privacy Policy URL | https://saberloop.com/privacy.html |

**Tip:** Reuse content from your Google Play listing (`docs/product-info/playstore-listing-update.md`)!

### App Store Description

```
Saberloop - Master Any Topic with AI-Powered Quizzes

🌍 LEARN IN YOUR LANGUAGE
Generate quizzes in English, Portuguese, Spanish, French, German, Italian, Dutch, Norwegian, or Russian. Questions and interface adapt to your preferred language.

📚 LEARN ANY TOPIC
From history and science to coding and languages — just type what you want to learn and get instant AI-generated questions tailored to your level.

🎉 PARTY MODE
Challenge friends in real-time quiz battles! Create a room, share the code, and compete with live scores. No accounts needed - just share and play.

🤖 CHOOSE YOUR AI
Use your preferred AI provider — OpenAI, Anthropic (Claude), Google AI (Gemini), xAI (Grok), or OpenRouter. Bring your own API key for lower costs and full control.

📈 ADAPTIVE LEARNING
Don't just take one quiz — continue on the same topic with increasing difficulty. Build true mastery through progressive challenges.

💡 LEARN FROM MISTAKES
Get detailed AI explanations for every wrong answer. Understand WHY the correct answer is right, not just what it is.

📱 WORKS OFFLINE
Review past quizzes and replay topics even without internet. Your learning never stops.

🔒 PRIVACY FIRST
All data stays on your device. No accounts required, no tracking, no ads. Your learning journey is yours alone.

✨ KEY FEATURES
• Multi-provider AI: OpenAI, Anthropic, Google AI, xAI, OpenRouter
• Party Mode - real-time multiplayer quiz battles
• 9 languages supported
• Adaptive difficulty with "Continue on Topic"
• Detailed explanations for wrong answers
• Share results and quiz links
• Customizable quiz length (5, 10, or 15 questions)
• Progress tracking and full quiz history
• Works completely offline
• No ads, no tracking, no accounts

Built with privacy in mind. Powered by AI. Free forever.
```

### Keywords (100 char max)

```
quiz,AI,learning,trivia,education,study,flashcards,multiplayer,party,knowledge,test,brain
```

---

## 3.5 Submit for Review

**Pre-submission checklist:**
- [ ] App builds without errors
- [ ] Tested on real device
- [ ] All screenshots uploaded
- [ ] Description complete
- [ ] Privacy policy URL valid
- [ ] Support URL valid
- [ ] Age rating configured
- [ ] Pricing set (Free)

**Submit:**
1. In App Store Connect, go to your app
2. Select the build you uploaded
3. Fill in "What's New" (for updates)
4. Click "Submit for Review"

**Review timeline:**
- First submission: 24-48 hours (can be longer)
- Average: 1-3 days
- May take longer if flagged for manual review

---

## 3.6 Checklist: Phase 3 Complete

- [ ] App tested on real iPhone
- [ ] Archive created in Xcode
- [ ] Build uploaded to App Store Connect
- [ ] App created in App Store Connect
- [ ] TestFlight configured and tested
- [ ] All App Store assets uploaded
- [ ] Description and keywords complete
- [ ] App submitted for review

---

## Troubleshooting

### TestFlight Issues

**"Build processing"**
- Wait 10-30 minutes for Apple to process

**"Missing compliance"**
- Answer export compliance questions in App Store Connect

### Upload Errors

**"Icon must not contain alpha channel"**
- Export icon as PNG without transparency

**"Missing required screenshots"**
- Need screenshots for all required device sizes

---

## Next Phase

After submitting, proceed to:
- **[Phase 4: Evaluate](./PHASE4_EVALUATE.md)** - Handle the review outcome

---

**Last Updated:** 2026-01-23
