# Phase 3: PWABuilder iOS Package

**Epic:** 08 - iOS
**Time:** 1 session (~1-2 hours)
**Mac Required:** Yes (for Xcode build)
**Prerequisites:** Phase 2 complete (Apple Developer Account)

---

## 3.1 Generate iOS Package with PWABuilder

**Steps:**

1. **Navigate to PWABuilder**
   - Go to https://www.pwabuilder.com
   - Enter: `https://saberloop.com/app/`
   - Click "Start"

2. **Review PWA Score**
   - PWABuilder analyzes your PWA
   - You should score well (you already passed for Android)

3. **Select iOS Platform**
   - Click "Build My PWA"
   - Select **iOS** platform
   - Review the options

4. **Configure iOS Settings**

```
Bundle ID:         com.saberloop.app
App Name:          Saberloop
Display Name:      Saberloop
Version:           1.0.0
Status Bar Style:  default
Splash Screen:     Use manifest colors
```

5. **Download Package**
   - Click "Download"
   - Save the ZIP file

---

## 3.2 Understand the Package Contents

**PWABuilder generates:**
```
iOS-Package/
├── src/                    # Xcode project source
│   ├── Saberloop.xcodeproj # Xcode project file
│   ├── Saberloop/          # App source code
│   │   ├── Info.plist      # App configuration
│   │   ├── Assets.xcassets # App icons
│   │   └── ...
│   └── ...
├── docs/                   # PWABuilder documentation
└── next-steps.md           # Instructions
```

---

## 3.3 Open in Xcode

**Steps:**

1. **Extract the ZIP file**

2. **Open Xcode project**
   - Double-click `Saberloop.xcodeproj`
   - Or: Open Xcode → File → Open → select project

3. **Configure Signing**
   - Select the project in the navigator (left sidebar)
   - Select "Saberloop" target
   - Go to "Signing & Capabilities" tab
   - Team: Select your Apple Developer account
   - Bundle Identifier: `com.saberloop.app`
   - Check "Automatically manage signing"

4. **Resolve any signing issues**
   - If errors appear, Xcode will guide you
   - May need to create App ID in developer portal

---

## 3.4 Configure App Icons

**PWABuilder should import icons from your manifest, but verify:**

1. In Xcode, expand Assets.xcassets
2. Click "AppIcon"
3. Verify all icon sizes are filled:
   - 20pt, 29pt, 40pt, 60pt, 76pt, 83.5pt
   - Each at 1x, 2x, 3x scales

**If missing icons:**
- Use https://appicon.co/ to generate all sizes
- Drag into appropriate slots in Xcode

---

## 3.5 Build for Testing

**Steps:**

1. **Select target device**
   - Top toolbar: Select "Any iOS Device (arm64)"
   - Or connect your iPhone via USB

2. **Build the app**
   - Press Cmd+B (or Product → Build)
   - Wait for build to complete
   - Fix any errors that appear

3. **Common build errors:**

| Error | Solution |
|-------|----------|
| "Signing requires a development team" | Select team in Signing & Capabilities |
| "No provisioning profile" | Check "Automatically manage signing" |
| "Minimum deployment target" | Update iOS version in project settings |

---

## 3.6 Checklist: Phase 3 Complete

- [ ] PWABuilder iOS package downloaded
- [ ] Package extracted and opened in Xcode
- [ ] Signing configured with Apple Developer account
- [ ] Bundle ID set to `com.saberloop.app`
- [ ] App icons verified
- [ ] Build succeeds without errors

---

## Troubleshooting

### Xcode Signing Errors

**"No signing certificate"**
- Solution: Xcode → Settings → Accounts → Manage Certificates → Add

**"Provisioning profile doesn't match"**
- Solution: Check "Automatically manage signing" in target settings

**"Bundle ID already exists"**
- Solution: Use unique bundle ID or claim existing one in developer portal

### Build Errors

**"Minimum deployment target"**
- Solution: Set iOS Deployment Target to 14.0 or higher in project settings

**"Module not found"**
- Solution: Clean build folder (Cmd+Shift+K), then build again

---

## Next Phase

Once the app builds successfully, proceed to:
- **[Phase 4: Test & Submit](./PHASE4_TEST_SUBMIT.md)** - TestFlight and App Store submission

---

**Last Updated:** 2026-01-23
