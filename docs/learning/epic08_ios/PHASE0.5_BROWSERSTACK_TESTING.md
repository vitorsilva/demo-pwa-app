# Phase 0.5: BrowserStack iOS Testing

**Epic:** 08 - iOS
**Time:** 1-2 hours
**Mac Required:** No (this is the point!)
**Prerequisites:** None - can be done from Windows

---

## Overview

BrowserStack provides access to real iOS devices and simulators through your browser. This phase lets you:

- Test Saberloop on real iOS Safari before investing in Mac setup
- Identify iOS-specific issues early
- Validate PWA behavior on iOS
- Get familiar with iOS UI/UX without needing Apple hardware

**Why do this first:**
- Free trial available (100 minutes)
- Find iOS issues before spending time on Mac setup
- Validate that your PWA works well on iOS Safari
- No commitment required

---

## 0.5.1 Create BrowserStack Account

1. Go to https://www.browserstack.com
2. Click "Start Free Trial" (no credit card required)
3. Sign up with email or GitHub
4. Verify your email

**Free tier includes:**
- 100 minutes of live testing
- Access to real iOS devices
- Access to iOS simulators
- Desktop browsers too

---

## 0.5.2 Test Saberloop on iOS Safari

### Start a Live Session

1. Log into BrowserStack
2. Go to **Live** → **Mobile**
3. Select **iOS** tab
4. Choose a device:
   - **iPhone 15 Pro** (latest)
   - **iPhone 14** (popular)
   - **iPhone SE** (smaller screen)
5. Select iOS version (latest recommended)
6. Click **Start Session**

### Navigate to Saberloop

1. Wait for device to load (30-60 seconds)
2. Safari opens automatically
3. Navigate to: `https://saberloop.com/app/`
4. Allow location/notifications if prompted

---

## 0.5.3 Testing Checklist

### Basic Functionality

- [ ] App loads correctly
- [ ] Home screen displays properly
- [ ] Can enter a quiz topic
- [ ] Can select difficulty and question count
- [ ] Quiz generates successfully
- [ ] Questions display correctly
- [ ] Can select answers
- [ ] Results screen shows properly
- [ ] Can view explanations

### iOS-Specific Behaviors

- [ ] Touch targets are large enough (44pt minimum)
- [ ] No horizontal scroll issues
- [ ] Text is readable without zooming
- [ ] Keyboard doesn't obscure input fields
- [ ] Safe area (notch) is respected
- [ ] Dark mode works (if supported)

### PWA Features

- [ ] "Add to Home Screen" prompt works
- [ ] App icon appears correctly
- [ ] Splash screen displays
- [ ] Standalone mode works (no Safari UI)
- [ ] Offline mode works (disconnect network in BrowserStack)

### Party Mode (if testing multiplayer)

- [ ] Can create a party room
- [ ] Room code displays
- [ ] Can join from another device
- [ ] Real-time sync works

---

## 0.5.4 Common iOS Safari Issues to Watch For

| Issue | What to Look For | Solution |
|-------|------------------|----------|
| **100vh bug** | Footer hidden behind Safari toolbar | Use `min-height: -webkit-fill-available` |
| **Touch delay** | 300ms delay on taps | Add `touch-action: manipulation` |
| **Input zoom** | Page zooms when focusing inputs | Set font-size to 16px+ on inputs |
| **Overscroll** | Rubber-band effect causes layout issues | Use `overscroll-behavior: none` |
| **Safe area** | Content hidden by notch | Use `env(safe-area-inset-*)` |

---

## 0.5.5 BrowserStack Features to Explore

### Device Settings

- **Rotate device** - Test landscape mode
- **Network throttling** - Test slow connections
- **Geolocation** - Test location features
- **Switch device** - Quickly test on different iPhones

### Developer Tools

- Click **DevTools** button to see:
  - Console logs
  - Network requests
  - Local storage
  - (Similar to Chrome DevTools)

### Screenshots

- Click **camera icon** to capture screenshots
- Useful for documenting issues
- Can download for bug reports

---

## 0.5.6 Testing on Multiple iOS Versions

Test on at least:

| Device | iOS Version | Why |
|--------|-------------|-----|
| iPhone 15 Pro | iOS 17 | Latest features |
| iPhone 13 | iOS 16 | Previous major version |
| iPhone SE | iOS 15 | Older devices, smaller screen |

**Note:** BrowserStack has real devices, so behavior matches actual iPhones.

---

## 0.5.7 Document Any Issues Found

Create notes for any iOS-specific issues:

```markdown
## iOS Issues Found

### Issue 1: [Description]
- **Device:** iPhone 15 Pro, iOS 17
- **Steps to reproduce:** ...
- **Expected:** ...
- **Actual:** ...
- **Screenshot:** [if captured]

### Issue 2: ...
```

Save these notes - they'll be useful when:
- Fixing issues before Mac build
- Testing fixes on BrowserStack
- Validating on real device later

---

## 0.5.8 Alternative: Sauce Labs (If BrowserStack Doesn't Work)

If you prefer another option:

1. Go to https://saucelabs.com
2. Sign up for free trial
3. Similar process - select iOS device, start session
4. Navigate to Saberloop and test

---

## 0.5.9 Checklist: Phase 0.5 Complete

- [ ] BrowserStack account created
- [ ] Tested on iPhone 15 Pro (or latest)
- [ ] Tested on at least one older iPhone
- [ ] Basic functionality verified
- [ ] PWA features tested
- [ ] Any iOS-specific issues documented
- [ ] Screenshots captured (optional)

---

## What You've Learned

After this phase, you should know:

1. **How Saberloop looks/works on real iOS Safari**
2. **Any iOS-specific bugs to fix** before the App Store build
3. **How iOS Safari differs from Chrome** (if any issues found)
4. **Confidence that the PWA works** on iOS

---

## Next Phase

If everything looks good on iOS Safari, proceed to:
- **[Phase 0: Mac Setup](./PHASE0_MAC_SETUP.md)** - When you have Mac access

If you found issues:
- Fix them on Windows first
- Re-test on BrowserStack
- Then proceed to Phase 0

---

## Tips for Conserving Free Minutes

- **Plan your tests** before starting a session
- **Use device switching** (faster than starting new sessions)
- **Take screenshots** to review issues after session ends
- **Close session** when taking breaks
- **100 minutes** is plenty for initial testing

---

**Last Updated:** 2026-01-23
