# Phase 0: Mac Setup & Configuration

**Epic:** 08 - iOS
**Time:** 1-2 hours (can be done incrementally)
**Mac Required:** Yes
**Goal:** Get the Mac ready for iOS development before starting Phase 1

This phase ensures your Mac is properly configured. Do this FIRST when you have Mac access, as some downloads are large and time-consuming.

---

## 0.1 Mac System Requirements

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

---

## 0.2 Install Xcode (REQUIRED - Do This First!)

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

---

## 0.3 Install Homebrew (RECOMMENDED)

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

---

## 0.4 Install Node.js (if not already installed)

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

---

## 0.5 Install Git (if not already installed)

**Check if already installed:**
```bash
git --version
# macOS usually has git pre-installed
```

**Install via Homebrew (if needed):**
```bash
brew install git
```

---

## 0.6 Configure Git (if not already done)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 0.7 Clone Your Repository

Get your Saberloop code onto the Mac:

```bash
cd ~/Developer  # or wherever you keep projects
git clone https://github.com/vitorsilva/saberloop.git
cd saberloop
npm install
```

---

## 0.8 Optional: Install VS Code

If you prefer VS Code over Xcode for editing web code:

```bash
brew install --cask visual-studio-code
```

---

## 0.9 Optional: Install iOS Simulator Runtimes

Xcode comes with the latest iOS simulator, but you may want older versions for testing:

1. Open Xcode
2. Go to **Xcode → Settings → Platforms**
3. Click **+** to download additional iOS versions
4. Recommended: Download iOS 16 and iOS 17 simulators

---

## 0.10 Checklist: Mac Ready for iOS Development

Before proceeding to Phase 1, verify:

- [ ] macOS is up to date (13.0+)
- [ ] Xcode installed and opens without errors
- [ ] Xcode Command Line Tools installed (`xcode-select --version` works)
- [ ] Homebrew installed (`brew --version` works)
- [ ] Node.js 18+ installed (`node --version` works)
- [ ] Git installed and configured
- [ ] Saberloop repo cloned and `npm install` completed
- [ ] At least 20GB free space remaining (for simulators, builds)

---

## Tips for Limited Mac Access

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

---

## 0.11 Start/Stop Scripts (Keep Mac Fast for Other Users)

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

---

## 0.12 What Runs in Background (and What Doesn't)

**Things that DON'T run after you close them:**
| Tool | Behavior |
|------|----------|
| Xcode | Closes completely when quit |
| VS Code | Closes completely when quit |
| Terminal | Closes completely when quit |
| Homebrew | No background services |

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

---

## 0.13 Manual Cleanup Commands

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

---

## 0.14 Checklist: Leaving the Mac Clean

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

## Next Phase

Once your Mac is configured, proceed to:
- **[Phase 1: Prerequisites](./PHASE1_PREREQUISITES.md)** - Apple Developer Account setup

---

**Last Updated:** 2026-01-23
