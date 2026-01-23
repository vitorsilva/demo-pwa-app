# iOS App Store Publishing

**Epic:** 08 - iOS
**Status:** Optional / Future Enhancement
**Estimated Time:** 4-6 sessions (Mac required for ~2 sessions)
**Prerequisites:** Phase 9 (Google Play) complete, Mac access, iPhone for testing

---

## Overview

This phase covers publishing Saberloop to the Apple App Store. The approach is **incremental**: start with the simplest path (PWABuilder), and if Apple rejects it, enhance with native features.

**What you'll achieve:**
- Saberloop on the Apple App Store
- iOS users can discover and install via App Store
- "Available on iOS and Android" credibility
- Learn iOS development ecosystem

**Why this is optional:**
- ✅ Android version already covers majority of mobile users
- ✅ PWA works on iOS via Safari "Add to Home Screen"
- ⚠️ Apple has stricter review guidelines than Google
- ⚠️ Requires $99/year developer fee (vs Google's $25 one-time)
- ⚠️ Requires Mac for building and submitting

**Why you might want it:**
- 📱 Reach iPhone/iPad users through App Store
- 🎓 Learn iOS ecosystem (Xcode, TestFlight, App Store Connect)
- 💼 Professional credibility ("Available on both stores")
- 🔔 Potential for richer iOS integration (Share extensions, widgets)
- 📈 App Store SEO and discoverability

---

## Learning Objectives

By the end of this epic, you will:

**Phase 0 (Mac Setup):**
- ✅ Configure macOS for iOS development
- ✅ Install and configure Xcode
- ✅ Install essential developer tools (Homebrew, Node.js, Git)
- ✅ Clone and set up project on Mac

**Phase 1-3 (PWABuilder path):**
- ✅ Understand Apple Developer Program requirements
- ✅ Navigate App Store Connect
- ✅ Use PWABuilder to generate iOS package
- ✅ Build iOS app in Xcode
- ✅ Distribute via TestFlight for testing
- ✅ Submit to App Store review
- ✅ Understand App Store Review Guidelines

**Phase 5 (Native Enhancement - if needed):**
- ✅ Understand Capacitor framework
- ✅ Migrate from PWABuilder to Capacitor
- ✅ Implement iOS Share Extension ("Share TO" Saberloop)
- ✅ Add haptic feedback for iOS
- ✅ Understand native vs hybrid app tradeoffs

---

## Current State vs Target State

### Current State (Android Only)
```
Saberloop Distribution:
├── ✅ Web: https://saberloop.com/app/
├── ✅ Android: Google Play Store (PWABuilder TWA)
└── ❌ iOS: Not available (only Safari "Add to Home Screen")

Current App Features:
├── ✅ Multi-provider AI (OpenAI, Anthropic, Google AI, xAI, OpenRouter)
├── ✅ Party Mode - real-time multiplayer quiz battles
├── ✅ 9 languages (EN, PT, ES, FR, DE, IT, NL, NO, RU)
├── ✅ Quiz sharing via URL
├── ✅ Configurable quiz length (5, 10, 15 questions)
├── ✅ Offline support with service worker
└── ✅ Privacy-first (no tracking, local data)

iOS Users Today:
├── Can visit https://saberloop.com/app/ in Safari
├── Can "Add to Home Screen" (creates web clip)
├── Limited integration (no App Store presence)
└── No push notifications
```

### Target State (iOS App Store)
```
Saberloop Distribution:
├── ✅ Web: https://saberloop.com/app/
├── ✅ Android: Google Play Store
└── ✅ iOS: Apple App Store

iOS App Features (all current features plus):
├── ✅ Native app icon and launch experience
├── ✅ App Store discoverability
├── ✅ TestFlight beta distribution
├── ✅ (Plan B) Share Extension - create quiz from any app
├── ✅ (Plan B) Haptic feedback on answers
└── ✅ Automatic updates via App Store
```

---

## Strategy: Incremental Approach

### Why Incremental?

Apple has historically been strict about "web wrapper" apps. Rather than spending weeks on native features that might not be needed, we:

1. **Try the simple path first** (PWABuilder)
2. **Learn from rejection** (if it happens)
3. **Add native value** only if required

### The Two Paths

```
┌─────────────────────────────────────────────────────────────┐
│                    START HERE                                │
│                    Phase 0: Mac Setup (install Xcode, etc.)  │
│                    Phase 1: Prerequisites (Apple Dev Account)│
│                    Phase 2: PWABuilder iOS                   │
│                    Phase 3: Test & Submit                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ App Store       │
                    │ Review Result   │
                    └─────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
     ┌─────────────────┐           ┌─────────────────────┐
     │ ✅ APPROVED     │           │ ❌ REJECTED         │
     │                 │           │ "Minimum            │
     │ 🎉 Done!        │           │  functionality"     │
     │ Skip Phase 5    │           │                     │
     └─────────────────┘           │ → Phase 4: Evaluate │
                                   │ → Phase 5: Enhance  │
                                   │ → Resubmit          │
                                   └─────────────────────┘
```

---

## Phase 0: Mac Setup & Configuration

**Time:** 1-2 hours (can be done incrementally)
**Mac Required:** Yes
**Goal:** Get the Mac ready for iOS development before starting Phase 1

This phase ensures your Mac is properly configured. Do this FIRST when you have Mac access, as some downloads are large and time-consuming.

### 0.1 Mac System Requirements

**Minimum Requirements:**
- macOS Ventura (13.0) or later recommended
- At least 50GB free disk space (Xcode is ~12GB + simulators)
- Apple Silicon (M1/M2/M3) or Intel Mac

**Check your macOS version:**
```bash
sw_vers -productVersion
# Should be 13.0 or higher for latest Xcode
```

**Check available disk space:**
```bash
df -h /
# Look for "Avail" column - need 50GB+
```

### 0.2 Install Xcode (REQUIRED - Do This First!)

Xcode is Apple's IDE and is **required** for iOS development. It's a large download (~12GB), so start this first.

**Option A: App Store (Recommended)**
1. Open **App Store** on Mac
2. Search for "Xcode"
3. Click **Get** / **Install**
4. Wait for download (30-60 minutes on fast internet)
5. Open Xcode once to accept license agreement

**Option B: Direct Download (if App Store is slow)**
1. Go to https://developer.apple.com/download/all/
2. Sign in with Apple ID
3. Download Xcode `.xip` file
4. Double-click to extract (takes ~10 minutes)
5. Drag Xcode to Applications folder

**Verify Xcode installation:**
```bash
xcode-select --version
# Should show: xcode-select version 2397 (or similar)

xcodebuild -version
# Should show: Xcode 15.x (or later)
```

**Install Command Line Tools:**
```bash
xcode-select --install
# Click "Install" in the popup dialog
```

### 0.3 Install Homebrew (RECOMMENDED)

Homebrew is a package manager for macOS - makes installing developer tools easy.

**Install Homebrew:**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**After installation, follow the instructions to add to PATH:**
```bash
# For Apple Silicon Macs (M1/M2/M3):
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# For Intel Macs:
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/usr/local/bin/brew shellenv)"
```

**Verify Homebrew:**
```bash
brew --version
# Should show: Homebrew 4.x.x
```

### 0.4 Install Node.js (if not already installed)

You'll need Node.js for Capacitor (Plan B).

**Check if already installed:**
```bash
node --version
# Should be v18 or higher
```

**Install via Homebrew (if needed):**
```bash
brew install node@18
```

### 0.5 Install Git (if not already installed)

**Check if already installed:**
```bash
git --version
# macOS usually has git pre-installed
```

**Install via Homebrew (if needed):**
```bash
brew install git
```

### 0.6 Configure Git (if not already done)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 0.7 Clone Your Repository

Get your Saberloop code onto the Mac:

```bash
cd ~/Developer  # or wherever you keep projects
git clone https://github.com/vitorsilva/saberloop.git
cd saberloop
npm install
```

### 0.8 Optional: Install VS Code

If you prefer VS Code over Xcode for editing web code:

```bash
brew install --cask visual-studio-code
```

### 0.9 Optional: Install iOS Simulator Runtimes

Xcode comes with the latest iOS simulator, but you may want older versions for testing:

1. Open Xcode
2. Go to **Xcode → Settings → Platforms**
3. Click **+** to download additional iOS versions
4. Recommended: Download iOS 16 and iOS 17 simulators

### 0.10 Checklist: Mac Ready for iOS Development

Before proceeding to Phase 1, verify:

- [ ] macOS is up to date (13.0+)
- [ ] Xcode installed and opens without errors
- [ ] Xcode Command Line Tools installed (`xcode-select --version` works)
- [ ] Homebrew installed (`brew --version` works)
- [ ] Node.js 18+ installed (`node --version` works)
- [ ] Git installed and configured
- [ ] Saberloop repo cloned and `npm install` completed
- [ ] At least 20GB free space remaining (for simulators, builds)

### Tips for Limited Mac Access

If you only have occasional Mac access:

1. **Do Phase 0 completely** in your first session - get everything installed
2. **Prepare on Windows first:**
   - Have your Apple ID ready
   - Have your Apple Developer account enrolled ($99 paid)
   - Have your code pushed to GitHub
   - Generate iOS assets (icons, screenshots) beforehand
3. **Batch your Mac work:**
   - Phase 0 + Phase 1: First Mac session (~2 hours)
   - Phase 2 + Phase 3: Second Mac session (~2-3 hours)
   - Phase 5 (if needed): Third Mac session (~2 hours)

### 0.11 Start/Stop Scripts (Keep Mac Fast for Other Users)

Since this Mac is shared, use these scripts to cleanly start and stop your dev environment.

**Create the scripts directory:**
```bash
mkdir -p ~/Developer/scripts
```

**Create START script** (`~/Developer/scripts/ios-dev-start.sh`):
```bash
#!/bin/bash
# ios-dev-start.sh - Start iOS development environment

echo "🚀 Starting iOS Development Environment..."

# Navigate to project
cd ~/Developer/saberloop

# Pull latest changes
echo "📥 Pulling latest code..."
git pull

# Install any new dependencies
echo "📦 Checking dependencies..."
npm install

# Open Xcode (if iOS project exists)
if [ -d "ios" ]; then
    echo "📱 Opening Xcode project..."
    open ios/App/App.xcworkspace 2>/dev/null || open ios/App/App.xcodeproj 2>/dev/null
fi

# Start dev server in background (optional)
# echo "🌐 Starting dev server..."
# npm run dev &

echo ""
echo "✅ Development environment ready!"
echo ""
echo "When finished, run: ~/Developer/scripts/ios-dev-stop.sh"
```

**Create STOP script** (`~/Developer/scripts/ios-dev-stop.sh`):
```bash
#!/bin/bash
# ios-dev-stop.sh - Stop iOS development environment and cleanup

echo "🛑 Stopping iOS Development Environment..."

# Kill any running node processes (dev servers)
echo "Stopping Node.js processes..."
pkill -f "node" 2>/dev/null

# Quit Xcode gracefully
echo "Closing Xcode..."
osascript -e 'quit app "Xcode"' 2>/dev/null

# Stop iOS Simulator
echo "Stopping iOS Simulator..."
osascript -e 'quit app "Simulator"' 2>/dev/null

# Kill any Xcode background processes
echo "Cleaning up Xcode processes..."
pkill -f "com.apple.dt" 2>/dev/null

# Clear Xcode derived data cache (optional - saves disk space)
# Uncomment if you want to free up space each time
# echo "Clearing Xcode cache..."
# rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Stop any running simulators
xcrun simctl shutdown all 2>/dev/null

echo ""
echo "✅ All development processes stopped!"
echo ""
echo "Verifying nothing is running..."
echo "Node processes: $(pgrep -f node | wc -l | tr -d ' ')"
echo "Xcode processes: $(pgrep -f Xcode | wc -l | tr -d ' ')"
echo "Simulator processes: $(pgrep -f Simulator | wc -l | tr -d ' ')"
```

**Make scripts executable:**
```bash
chmod +x ~/Developer/scripts/ios-dev-start.sh
chmod +x ~/Developer/scripts/ios-dev-stop.sh
```

**Usage:**
```bash
# When starting your work session:
~/Developer/scripts/ios-dev-start.sh

# When finished (ALWAYS run this before leaving):
~/Developer/scripts/ios-dev-stop.sh
```

**Create aliases for convenience (optional):**
```bash
echo 'alias ios-start="~/Developer/scripts/ios-dev-start.sh"' >> ~/.zshrc
echo 'alias ios-stop="~/Developer/scripts/ios-dev-stop.sh"' >> ~/.zshrc
source ~/.zshrc

# Then you can just type:
ios-start
ios-stop
```

### 0.12 What Runs in Background (and What Doesn't)

**Things that DON'T run after you close them:**
| Tool | Behavior |
|------|----------|
| Xcode | Closes completely when quit ✅ |
| VS Code | Closes completely when quit ✅ |
| Terminal | Closes completely when quit ✅ |
| Homebrew | No background services ✅ |

**Things that MIGHT keep running:**
| Tool | Issue | Solution |
|------|-------|----------|
| iOS Simulator | May stay open | `ios-stop` script closes it |
| Node.js dev server | Runs until stopped | `ios-stop` script kills it |
| Xcode indexing | May run briefly after closing | Usually stops on its own |

**Things installed that use disk space (but don't slow down):**
| Tool | Size | Notes |
|------|------|-------|
| Xcode | ~12GB | Required, doesn't run unless opened |
| iOS Simulators | ~2-5GB each | Can delete unused ones |
| Homebrew | ~500MB | Doesn't run in background |
| Node.js | ~100MB | Doesn't run unless you start it |
| Derived Data | Grows over time | `ios-stop` can clear this |

### 0.13 Manual Cleanup Commands

If you want to verify everything is stopped manually:

**Check what's running:**
```bash
# See all processes with "node" in name
pgrep -fl node

# See all processes with "Xcode" in name
pgrep -fl Xcode

# See all processes with "Simulator" in name
pgrep -fl Simulator
```

**Force stop everything:**
```bash
# Nuclear option - kills all dev-related processes
pkill -f node
pkill -f Xcode
pkill -f Simulator
xcrun simctl shutdown all
```

**Free up disk space:**
```bash
# Clear Xcode build cache (can recover 5-20GB!)
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Clear iOS Simulator caches
xcrun simctl erase all

# See how much space Xcode stuff is using
du -sh ~/Library/Developer/Xcode/
du -sh ~/Library/Developer/CoreSimulator/
```

### 0.14 Checklist: Leaving the Mac Clean

Before ending your session, verify:

- [ ] Ran `ios-stop` script (or manually quit everything)
- [ ] Xcode is closed (check Dock - no dot under icon)
- [ ] Simulator is closed
- [ ] Terminal windows are closed
- [ ] No spinning fans or high CPU (Activity Monitor should be calm)
- [ ] Optionally: cleared Derived Data to free space

**Quick verification command:**
```bash
# Should all show "0" if everything is stopped
echo "Node: $(pgrep -f node | wc -l) | Xcode: $(pgrep -f Xcode | wc -l) | Sim: $(pgrep -f Simulator | wc -l)"
```

---

## Phase 1: Prerequisites

**Time:** 1 session (~1-2 hours)
**Mac Required:** Yes (for Xcode configuration)
**Prerequisites:** Phase 0 complete (Xcode installed)

### 1.1 Apple Developer Account

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

### 1.2 Xcode Installation (Mac Required)

**Why Xcode?**
- Required to build iOS apps
- Required to sign apps for distribution
- Required to upload to App Store

**Steps:**
1. On your Mac, open App Store
2. Search for "Xcode"
3. Click "Get" / "Install"
4. Wait for download (~12GB, can take 30-60 minutes)
5. Open Xcode and accept license agreement
6. Install additional components when prompted

**Verify installation:**
```bash
xcode-select --version
# Should show version info
```

### 1.3 Apple Developer Account in Xcode

**Steps:**
1. Open Xcode
2. Menu: Xcode → Settings (or Preferences)
3. Click "Accounts" tab
4. Click "+" to add account
5. Sign in with your Apple Developer account
6. Xcode will download your certificates and provisioning profiles

### 1.4 Understand App Store Review Guidelines

**Before building, read these key sections:**
- https://developer.apple.com/app-store/review/guidelines/

**Key guidelines for PWA wrappers:**
- **4.2 Minimum Functionality**: Apps should provide value beyond a website
- **4.2.3 Web Clipping**: Apps that are simply web pages bundled as apps may be rejected

**What this means:**
- Apple MAY reject a pure PWA wrapper
- Having offline functionality helps (you have this ✅)
- Native features (sharing, haptics) increase approval chances

---

## Phase 2: PWABuilder iOS Package

**Time:** 1 session (~1-2 hours)
**Mac Required:** Yes (for Xcode build)

### 2.1 Generate iOS Package with PWABuilder

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

### 2.2 Understand the Package Contents

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

### 2.3 Open in Xcode

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

### 2.4 Configure App Icons

**PWABuilder should import icons from your manifest, but verify:**

1. In Xcode, expand Assets.xcassets
2. Click "AppIcon"
3. Verify all icon sizes are filled:
   - 20pt, 29pt, 40pt, 60pt, 76pt, 83.5pt
   - Each at 1x, 2x, 3x scales

**If missing icons:**
- Use https://appicon.co/ to generate all sizes
- Drag into appropriate slots in Xcode

### 2.5 Build for Testing

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

## Phase 3: Test & Submit

**Time:** 1-2 sessions
**Mac Required:** Yes

### 3.1 Test on Your iPhone

**Option A: Via USB (requires free Apple ID)**

1. Connect iPhone to Mac via USB
2. Trust the computer on iPhone if prompted
3. In Xcode, select your iPhone from device dropdown
4. Click Run (Play button) or Cmd+R
5. App installs and launches on device
6. Test all features

**Option B: Via TestFlight (requires Developer Account)**

Better for sharing with others - see section 3.2

### 3.2 TestFlight Distribution

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

### 3.3 Create App in App Store Connect

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

### 3.4 Prepare App Store Listing

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

**Description:**
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

**Keywords (100 char max):**
```
quiz,AI,learning,trivia,education,study,flashcards,multiplayer,party,knowledge,test,brain
```

### 3.5 Submit for Review

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

## Phase 4: Evaluate Outcome

**Time:** Depends on review result

### 4.1 If Approved 🎉

**Congratulations!** Your app is on the App Store.

**Post-approval tasks:**
- [ ] Verify app appears in App Store search
- [ ] Test installation on a clean device
- [ ] Update landing page with App Store badge
- [ ] Announce on social media
- [ ] Monitor reviews and ratings

**Skip to Success Criteria** - you're done!

### 4.2 If Rejected ❌

**Don't panic!** This is common for PWA wrappers.

**Read the rejection reason carefully:**
- App Store Connect → Resolution Center
- Apple provides specific guideline violations

**Common rejection reasons for PWAs:**

| Rejection Reason | Solution |
|------------------|----------|
| 4.2 Minimum Functionality | Add native features (Phase 5) |
| 4.2.3 Web Clipping | Add native features (Phase 5) |
| Missing features | May need specific native APIs |
| Metadata issues | Fix description, screenshots |
| Bugs/crashes | Fix and resubmit |

### 4.3 Appeal vs Enhance

**When to appeal:**
- Rejection seems unfair or incorrect
- You can clearly explain added value
- Rejection is for metadata (easy to fix)

**When to enhance (Phase 5):**
- Rejection cites "minimum functionality"
- Rejection cites "web clipping"
- Apple suggests adding native features

**Most PWA wrappers need Phase 5** to pass review.

---

## Phase 5: Native Enhancement (Plan B)

**Time:** 2-3 sessions
**Mac Required:** Yes

This phase transforms your PWA wrapper into a hybrid app with genuine native features.

### 5.1 Migrate to Capacitor

**Why Capacitor?**
- PWABuilder iOS is limited to basic WebView
- Capacitor allows adding native iOS features
- Same web code, more native capabilities
- Created by Ionic team, well-maintained

**Capacitor vs PWABuilder:**

| Feature | PWABuilder iOS | Capacitor |
|---------|----------------|-----------|
| Web code reuse | ✅ 100% | ✅ 100% |
| Native plugins | ❌ Limited | ✅ Extensive |
| Share Extension | ❌ No | ✅ Yes |
| Haptics | ❌ No | ✅ Yes |
| Push Notifications | ❌ Limited | ✅ Full |
| Community plugins | ❌ Few | ✅ Many |

### 5.2 Install Capacitor

**On your main development machine (not Mac):**

```bash
# In your Saberloop project directory
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init Saberloop com.saberloop.app

# Add iOS platform
npm install @capacitor/ios
npx cap add ios
```

**This creates:**
```
saberloop/
├── ios/                    # Native iOS project
│   ├── App/
│   │   ├── App.xcodeproj
│   │   └── ...
│   └── ...
├── capacitor.config.ts     # Capacitor configuration
└── ...
```

### 5.3 Configure Capacitor

**File:** `capacitor.config.ts`

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.saberloop.app',
  appName: 'Saberloop',
  webDir: 'dist',
  server: {
    // For development, can point to dev server
    // url: 'http://localhost:5173',
    // cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'Saberloop'
  }
};

export default config;
```

### 5.4 Build and Sync

**Workflow:**

```bash
# 1. Build your web app
npm run build

# 2. Copy web assets to native project
npx cap sync ios

# 3. Open in Xcode (on Mac)
npx cap open ios
```

**After running on Mac:**
- Xcode opens with native project
- Configure signing (same as Phase 2)
- Build and run

### 5.5 Add Haptic Feedback

**Native haptic feedback makes the app feel more "iOS native".**

**Install Haptics plugin:**
```bash
npm install @capacitor/haptics
npx cap sync
```

**Use in your code:**

```javascript
// src/utils/haptics.js
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export async function vibrateSuccess() {
  if (Capacitor.isNativePlatform()) {
    await Haptics.impact({ style: ImpactStyle.Light });
  }
}

export async function vibrateError() {
  if (Capacitor.isNativePlatform()) {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  }
}

export async function vibrateSelection() {
  if (Capacitor.isNativePlatform()) {
    await Haptics.selectionStart();
  }
}
```

**Integrate with quiz:**

```javascript
// In your quiz answer handler
import { vibrateSuccess, vibrateError } from './utils/haptics.js';

function handleAnswer(selectedAnswer, correctAnswer) {
  if (selectedAnswer === correctAnswer) {
    vibrateSuccess();  // Light tap for correct
    // ... show success UI
  } else {
    vibrateError();    // Heavy tap for incorrect
    // ... show error UI
  }
}
```

### 5.6 Add Share FROM (Results Sharing)

**Allow users to share their quiz results.**

**Install Share plugin:**
```bash
npm install @capacitor/share
npx cap sync
```

**Implement sharing:**

```javascript
// src/utils/share.js
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export async function shareResults(quizTopic, score, total) {
  const text = `I scored ${score}/${total} on "${quizTopic}" in Saberloop! 🧠`;
  const url = 'https://saberloop.com/app/';

  if (Capacitor.isNativePlatform()) {
    // Native share sheet
    await Share.share({
      title: 'My Saberloop Quiz Result',
      text: text,
      url: url,
      dialogTitle: 'Share your result'
    });
  } else {
    // Web Share API fallback
    if (navigator.share) {
      await navigator.share({ title: 'Quiz Result', text, url });
    } else {
      // Clipboard fallback
      await navigator.clipboard.writeText(`${text} ${url}`);
      alert('Result copied to clipboard!');
    }
  }
}
```

**Add to Results view:**

```javascript
// In ResultsView.js
import { shareResults } from '../utils/share.js';

// Add share button
const shareButton = document.createElement('button');
shareButton.textContent = 'Share Result';
shareButton.onclick = () => shareResults(quiz.topic, score, total);
```

### 5.7 Add Share TO (Share Extension) - The Big Feature

**This is the feature that transforms Saberloop from "a website" to "an iOS learning tool."**

**What it does:**
- User reads article about "Photosynthesis" in Safari/News/etc.
- User taps Share → Saberloop
- Saberloop opens with topic pre-filled
- User generates quiz about what they just read

**Why Apple loves this:**
- Genuine iOS integration
- Can't be done with a website
- Provides unique value

**Implementation (requires native Swift code):**

**Step 1: Create Share Extension in Xcode**

1. In Xcode, File → New → Target
2. Select "Share Extension"
3. Name: "ShareToSaberloop"
4. Finish

**Step 2: Configure Share Extension**

**File:** `ios/App/ShareToSaberloop/ShareViewController.swift`

```swift
import UIKit
import Social
import MobileCoreServices

class ShareViewController: SLComposeServiceViewController {

    override func isContentValid() -> Bool {
        return true
    }

    override func didSelectPost() {
        // Get shared text
        if let item = extensionContext?.inputItems.first as? NSExtensionItem,
           let attachments = item.attachments {

            for attachment in attachments {
                if attachment.hasItemConformingToTypeIdentifier(kUTTypeText as String) {
                    attachment.loadItem(forTypeIdentifier: kUTTypeText as String, options: nil) { (text, error) in
                        if let sharedText = text as? String {
                            self.openApp(with: sharedText)
                        }
                    }
                } else if attachment.hasItemConformingToTypeIdentifier(kUTTypeURL as String) {
                    attachment.loadItem(forTypeIdentifier: kUTTypeURL as String, options: nil) { (url, error) in
                        if let sharedURL = url as? URL {
                            self.openApp(with: sharedURL.absoluteString)
                        }
                    }
                }
            }
        }

        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }

    private func openApp(with content: String) {
        // Encode content for URL
        let encoded = content.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

        // Open main app with shared content
        let url = URL(string: "saberloop://share?content=\(encoded)")!

        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                application.open(url, options: [:], completionHandler: nil)
                break
            }
            responder = responder?.next
        }
    }

    override func configurationItems() -> [Any]! {
        return []
    }
}
```

**Step 3: Configure URL Scheme**

In Xcode, select main App target → Info tab → URL Types:
- Add URL Scheme: `saberloop`

**Step 4: Handle incoming share in your web app**

```javascript
// src/features/share-handler.js
import { App } from '@capacitor/app';

export function setupShareHandler() {
  App.addListener('appUrlOpen', (event) => {
    const url = new URL(event.url);

    if (url.protocol === 'saberloop:' && url.host === 'share') {
      const content = url.searchParams.get('content');
      if (content) {
        // Navigate to quiz creation with pre-filled topic
        handleSharedContent(decodeURIComponent(content));
      }
    }
  });
}

function handleSharedContent(content) {
  // Extract topic from shared content
  // Could be URL (fetch page title) or text (use directly)

  // Simple approach: use first 100 chars as topic
  const topic = content.substring(0, 100);

  // Navigate to home and pre-fill topic
  window.location.href = `/app/?topic=${encodeURIComponent(topic)}`;
}
```

**Step 5: Initialize in main.js**

```javascript
import { setupShareHandler } from './features/share-handler.js';

// On app start
setupShareHandler();
```

### 5.8 Rebuild and Test

**After adding native features:**

```bash
# Rebuild web app
npm run build

# Sync to native project
npx cap sync ios

# Open in Xcode
npx cap open ios
```

**Test on device:**
1. Build and run on iPhone
2. Test haptic feedback on quiz answers
3. Test Share button on results
4. Test Share TO from Safari (share an article)

### 5.9 Resubmit to App Store

**Update your submission:**

1. Increment version number (1.0.0 → 1.1.0)
2. Archive and upload new build
3. Update "What's New":
   ```
   - Added haptic feedback for quiz answers
   - Added Share button to share your results
   - Added Share Extension - create quizzes from any app!
   ```
4. Submit for review

**In appeal/resubmission notes, highlight:**
- Native haptic feedback integration
- iOS Share Extension for content creation
- Features that cannot be replicated by a website

---

## Decision Matrix

### ✅ Proceed with iOS if:

- [ ] You want to reach iPhone users
- [ ] You want "Available on iOS & Android" credibility
- [ ] You have Mac access (even if limited)
- [ ] You're okay with $99/year fee
- [ ] You want to learn iOS ecosystem
- [ ] You're patient with potential rejection/iteration

### ❌ Skip iOS for now if:

- [ ] Most of your target users are on Android
- [ ] $99/year is not justifiable
- [ ] No Mac access at all
- [ ] Need to ship quickly (Android is enough)
- [ ] Don't want to deal with Apple's stricter review

---

## Minimizing Mac Usage

Since you have limited Mac access, here's how to optimize:

**Do on your main machine (Windows/Linux):**
- ✅ All web development
- ✅ Capacitor installation and configuration
- ✅ Building web assets (`npm run build`)
- ✅ Most native code editing (copy to Mac later)
- ✅ Preparing App Store assets (screenshots, descriptions)

**Must do on Mac:**
- ⚠️ Install Xcode (one-time, ~1 hour)
- ⚠️ Configure signing (one-time, ~15 minutes)
- ⚠️ Build and archive (~10 minutes per build)
- ⚠️ Upload to App Store Connect (~10 minutes)

**Estimated Mac time:**
- Initial setup: ~2 hours
- Each subsequent build: ~30 minutes
- Total for Phase 1-3: ~3-4 hours
- Total including Phase 5: ~5-6 hours

---

## Cost Estimate

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer Account | $99 | Yearly |
| Xcode | Free | One-time |
| Capacitor | Free | - |
| Mac | (You have access) | - |
| **Total Year 1** | **$99** | |
| **Total Year 2+** | **$99/year** | |

**Comparison with Android:**
- Google Play: $25 one-time
- Apple App Store: $99/year
- **iOS costs ~$74 more in year 1, $99 more each following year**

---

## Success Criteria

**Phase 0 Complete (Mac Setup):**
- [ ] macOS 13.0+ verified
- [ ] Xcode installed and opens without errors
- [ ] Command Line Tools installed
- [ ] Homebrew installed
- [ ] Node.js 18+ installed
- [ ] Git configured
- [ ] Saberloop repo cloned and dependencies installed

**Phase 1-3 Complete (PWABuilder path):**
- [ ] Apple Developer Account active ($99 paid)
- [ ] Xcode signing configured with Apple ID
- [ ] PWABuilder iOS package generated
- [ ] App builds successfully in Xcode
- [ ] App tested on real iPhone
- [ ] App uploaded to App Store Connect
- [ ] TestFlight beta distributed
- [ ] App submitted for review

**Phase 5 Complete (if needed):**
- [ ] Capacitor project configured
- [ ] Haptic feedback working
- [ ] Share FROM (results) working
- [ ] Share TO (extension) working
- [ ] App resubmitted with native features

**Final Success:**
- [ ] Saberloop approved and live on App Store
- [ ] App appears in App Store search
- [ ] Users can install from App Store
- [ ] Landing page updated with App Store badge

---

## References

**Apple Resources:**
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)

**PWABuilder:**
- [PWABuilder iOS Documentation](https://docs.pwabuilder.com/#/builder/app-store)
- [PWABuilder GitHub](https://github.com/pwa-builder/PWABuilder)

**Capacitor:**
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Haptics Plugin](https://capacitorjs.com/docs/apis/haptics)
- [Share Plugin](https://capacitorjs.com/docs/apis/share)

**Share Extensions:**
- [App Extension Guide](https://developer.apple.com/app-extensions/)
- [Share Extension Tutorial](https://www.raywenderlich.com/721-share-extension-tutorial-getting-started)

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
- Solution: Run `npx cap sync ios` again, then build

### App Store Rejection

**"4.2 Minimum Functionality"**
- Solution: Add native features (Phase 5), highlight in resubmission

**"Guideline 2.1 - App Completeness"**
- Solution: Ensure all features work during review

**"Metadata Rejected"**
- Solution: Fix screenshots, description, or other metadata issues

### TestFlight Issues

**"Build processing"**
- Wait 10-30 minutes for Apple to process

**"Missing compliance"**
- Answer export compliance questions in App Store Connect

---

## FAQ

**Q: Can I skip PWABuilder and go straight to Capacitor?**
A: Yes! If you're confident Apple will reject PWABuilder, you can start with Capacitor. However, trying PWABuilder first takes minimal extra effort and might succeed.

**Q: Do I need to pay $99 before testing on my own device?**
A: No! You can test on your own device with a free Apple ID. But you need the paid account for TestFlight and App Store submission.

**Q: Can I use the same app name as Android?**
A: Yes, "Saberloop" can be used on both stores. Bundle ID should match (com.saberloop.app).

**Q: How long does App Store review take?**
A: Usually 24-48 hours, but can be faster or slower. First submissions may take longer.

**Q: What if Apple rejects me multiple times?**
A: Each rejection gives specific feedback. Address it, add more native features if needed, and resubmit. Most apps get approved eventually.

**Q: Can I develop Capacitor plugins on Windows and just build on Mac?**
A: Yes! All JavaScript/TypeScript development works on any platform. Only the final Xcode build requires Mac.

---

## What's Next After iOS?

Once both Android and iOS are published:

- **Marketing**: Update landing page with both store badges
- **Analytics**: Consider adding privacy-respecting analytics
- **Features**: Widgets, Siri Shortcuts, Apple Watch companion
- **Updates**: Coordinate releases across both platforms

---

**Related Documentation:**
- [Phase 9: Google Play Store](../epic03_quizmaster_v2/PHASE9_PLAYSTORE_PUBLISHING.md)
- [PWA Fundamentals](../epic01_infrastructure/LEARNING_PLAN.md)
- [Capacitor Migration (if needed)](./CAPACITOR_MIGRATION.md) - Future doc

---

**Last Updated:** 2026-01-23
**Status:** Optional Phase - Implement when ready for iOS expansion
**Note:** App Store listing content updated to reflect current features (Party Mode, multi-provider AI, 9 languages)
