# Phase 2: Prerequisites

**Epic:** 08 - iOS
**Time:** 1 session (~1-2 hours)
**Mac Required:** Yes (for Xcode configuration)
**Prerequisites:** Phase 1 complete (Xcode installed)

---

## 2.1 Apple Developer Account

**Cost:** $99/year (recurring)

**Steps:**
1. Go to https://developer.apple.com/programs/
2. Click "Enroll"
3. Sign in with your Apple ID (or create one)
4. Choose enrollment type:
   - **Individual** - For personal apps (simpler)
   - **Organization** - For company apps (requires D-U-N-S number)
5. Pay $99 fee
6. Wait for approval (usually instant for individuals, 24-48h for organizations)

**After enrollment, you have access to:**
- App Store Connect (for publishing)
- TestFlight (for beta testing)
- Certificates & Provisioning Profiles
- Developer documentation

---

## 2.2 Xcode Installation Verification

**Why Xcode?**
- Required to build iOS apps
- Required to sign apps for distribution
- Required to upload to App Store

**Verify installation (should be done in Phase 1):**
```bash
xcode-select --version
# Should show version info

xcodebuild -version
# Should show: Xcode 15.x (or later)
```

If not installed, see [Phase 1: Mac Setup](./PHASE1_MAC_SETUP.md).

---

## 2.3 Apple Developer Account in Xcode

**Steps:**
1. Open Xcode
2. Menu: Xcode → Settings (or Preferences)
3. Click "Accounts" tab
4. Click "+" to add account
5. Sign in with your Apple Developer account
6. Xcode will download your certificates and provisioning profiles

---

## 2.4 Understand App Store Review Guidelines

**Before building, read these key sections:**
- https://developer.apple.com/app-store/review/guidelines/

**Key guidelines for PWA wrappers:**
- **4.2 Minimum Functionality**: Apps should provide value beyond a website
- **4.2.3 Web Clipping**: Apps that are simply web pages bundled as apps may be rejected

**What this means:**
- Apple MAY reject a pure PWA wrapper
- Having offline functionality helps (you have this)
- Native features (sharing, haptics) increase approval chances

---

## 2.5 Checklist: Phase 2 Complete

- [ ] Apple Developer Account enrolled ($99 paid)
- [ ] Enrollment approved by Apple
- [ ] Apple ID added to Xcode Accounts
- [ ] Certificates downloaded automatically
- [ ] Read App Store Review Guidelines (especially 4.2)

---

## Next Phase

Once prerequisites are complete, proceed to:
- **[Phase 3: PWABuilder](./PHASE3_PWABUILDER.md)** - Generate iOS package

---

**Last Updated:** 2026-01-23
