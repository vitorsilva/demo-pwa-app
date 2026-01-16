# Maestro Testing Guide

## Overview

Saberloop uses **Maestro** for mobile E2E testing on Android and iOS.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Saberloop  │────▶│   Maestro   │────▶│   Results   │
│     APK     │     │  (Device)   │     │ + Screenshots│
└─────────────┘     └─────────────┘     └─────────────┘
```

## Prerequisites

### Install Maestro CLI

```bash
# macOS / Linux
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
```

**Windows Setup** (native, NOT WSL - see Troubleshooting):

```powershell
# 1. Download Maestro
Invoke-WebRequest -Uri "https://github.com/mobile-dev-inc/maestro/releases/latest/download/maestro.zip" -OutFile "$env:USERPROFILE\Downloads\maestro.zip"

# 2. Extract (creates nested folder)
Expand-Archive -Path "$env:USERPROFILE\Downloads\maestro.zip" -DestinationPath "$env:USERPROFILE\maestro" -Force

# 3. Add to PATH (note double maestro\maestro)
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:USERPROFILE\maestro\maestro\bin", "User")

# 4. Set JAVA_HOME to Android Studio's JDK
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Android\Android Studio\jbr", "User")

# 5. Add ADB to PATH
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools", "User")

# 6. Restart PowerShell and verify
maestro --version
```

### Android Setup

1. **Android Studio** with emulator or **physical device**
2. **ADB** in PATH (see Windows Setup above)
3. **JAVA_HOME** set to Android Studio's JDK
4. **APK file** at `package/Saberloop.apk`

```powershell
# List available emulators
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator" -list-avds

# Start emulator (replace AVD_NAME)
Start-Process -FilePath "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator" -ArgumentList "-avd AVD_NAME -no-snapshot-load"

# Check device is connected
adb devices
# Should show: emulator-5554   device

# Install APK on device/emulator
adb install "package/Saberloop.apk"
```

### iOS Setup (macOS only)

1. **Xcode** with iOS Simulator
2. **App installed** on simulator

## Quick Start

```bash
# Run smoke test
maestro test .maestro/smoke-test.yaml

# Run all flow tests
maestro test .maestro/flows/

# Run specific test
maestro test .maestro/flows/02-quiz-flow.yaml
```

## Test File Location

Maestro tests are in `.maestro/`:

```
.maestro/
├── config.yaml                 # Workspace configuration
├── smoke-test.yaml             # Quick sanity check
└── flows/
    ├── 01-onboarding.yaml      # Welcome screen flow
    ├── 02-quiz-flow.yaml       # Complete quiz flow
    ├── 03-quiz-results.yaml    # Results verification
    ├── 04-replay-quiz.yaml     # Replay saved quiz
    ├── 05-navigation.yaml      # Bottom nav tests
    ├── 06-settings.yaml        # Settings page tests
    └── 07-offline.yaml         # Offline mode tests
```

## Writing Tests

### Basic Structure

```yaml
appId: com.saberloop.app
---
- launchApp
- assertVisible: "Home"
- tapOn: "Start New Quiz"
- assertVisible: "Enter a topic"
```

### Common Actions

```yaml
# App lifecycle
- launchApp
- stopApp
- clearState       # Note: Does NOT work for TWA

# Tap/Click
- tapOn: "Button Text"
- tapOn:
    id: "submit-btn"
- tapOn:
    index: 0        # First match

# Text input
- inputText: "Solar System"
- clearText
- eraseText: 5      # Delete 5 characters

# Assertions
- assertVisible: "Welcome"
- assertNotVisible: "Error"
- assertVisible:
    text: ".*Quiz.*"    # Regex pattern

# Screenshots
- takeScreenshot: screenshot-name

# Waiting
- extendedWaitUntil:
    visible: "Results"
    timeout: 30000
```

### Example: Complete Quiz Flow

```yaml
appId: com.saberloop.app
---
- launchApp
- assertVisible: ".*Home.*|.*Welcome.*"

# Handle welcome screen if present
- runFlow:
    when:
      visible: "Try Free Quizzes"
    commands:
      - tapOn: "Try Free Quizzes"

# Start sample quiz
- tapOn: "Basic Math"
- assertVisible: "Question 1 of 5"

# Answer questions
- tapOn:
    index: 2        # Option C (correct answer)
- tapOn: "Submit"

# ... repeat for remaining questions

- assertVisible: "Results"
- takeScreenshot: quiz-results
```

## Testing Sample Quizzes

The app pre-loads 8 sample quizzes. For testing, use **"Basic Math"**:

| Question | Correct Answer | Index |
|----------|----------------|-------|
| Q1-Q4 | Option C | 2 |
| Q5 | Option B | 1 |

**Benefits:**
- No API calls needed
- Fast, deterministic tests
- Works offline
- No cost

## Running in CI

GitHub Actions workflow at `.github/workflows/maestro.yml`:

```bash
# Triggered by label on PR
# Label: "test:maestro"

# Or run manually
gh workflow run maestro.yml
```

### CI Considerations

1. **APK Source**: `package/Saberloop.apk` checked into repo
2. **Emulator**: API level 30, cached snapshots
3. **Timeout**: 30s default per command
4. **Artifacts**: Screenshots saved for debugging

## Debugging

### Maestro Studio (Interactive Mode)

```bash
maestro studio
```

Features:
- Live device view
- Click to get selectors
- Test commands in real-time
- Record flows automatically

### View Screenshots

Screenshots saved to `.maestro/tests/`:

```bash
ls .maestro/tests/
# screenshot-name.png
```

### Verbose Output

```bash
maestro test .maestro/flows/02-quiz-flow.yaml --debug-output
```

## TWA-Specific Notes

Saberloop runs as a **Trusted Web Activity (TWA)**, which affects testing:

1. **State persists** - `clearState` doesn't work for Chrome storage
2. **Design state-resilient tests** - Handle both fresh and returning users
3. **Use flexible assertions** - Match multiple valid states

```yaml
# Handle both fresh and returning user
- assertVisible: ".*Home.*|.*Welcome.*"
```

## Configuration

`.maestro/config.yaml`:

```yaml
testOutputDir: .maestro/tests
```

## Troubleshooting

### WSL + Windows Emulator Doesn't Work

```
Maestro reported "0 devices connected"
```

**Cause:** Maestro running in WSL cannot see devices on Windows host due to WSL/Windows boundary

**Fix:** Install Maestro natively on Windows (see Prerequisites), NOT in WSL

---

### ADB Not Found

```
'adb' is not recognized as an internal or external command
```

**Cause:** Android SDK platform-tools not in PATH

**Fix:**
```powershell
# Temporary (current session)
$env:Path += ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"

# Permanent
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools", "User")
```

---

### JAVA_HOME Not Set

```
Error: JAVA_HOME is not set
```

**Cause:** Maestro requires Java to run

**Fix:** Use Android Studio's bundled JDK:
```powershell
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Android\Android Studio\jbr", "User")
```

---

### Maestro Command Not Found (Wrong PATH)

**Cause:** ZIP extracts to nested `maestro\maestro\bin`, not `maestro\bin`

**Fix:** Use correct nested path:
```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:USERPROFILE\maestro\maestro\bin", "User")
```

---

### Output Directory Not Respected

**Cause:** `config.yaml`'s `testOutputDir` setting is ignored by Maestro

**Fix:** Use `--test-output-dir` flag explicitly:
```bash
maestro test .maestro/flows/ --test-output-dir .maestro/tests
```

---

### APK Path With Spaces Fails

```
adb: error: failed to stat package/Saberloop - Google
```

**Cause:** Spaces in file path not properly quoted

**Fix:** Use quotes around path:
```bash
adb install "package/Saberloop - Google Play package/Saberloop.apk"
```

---

### Leave Quiz Confirmation Dialog Blocks Test

**Cause:** App shows "Are you sure you want to leave?" when navigating away from quiz

**Fix:** Add optional tap to handle dialog:
```yaml
- tapOn: "OK"
  optional: true
```

---

### State Persistence (Can't Clear Data)

**Cause:** TWA data persists in Chrome's storage, `clearState` doesn't work

**Fix:** Design state-resilient tests with flexible regex:
```yaml
# Accept multiple possible states
- assertVisible: ".*Home.*|.*Welcome.*"

# Accept any available quiz
- assertVisible: ".*Solar System.*|.*Famous Scientists.*|.*Basic Math.*"
```

---

### runFlow with `when` Condition Hangs

**Cause:** Conditional flows can hang waiting for element that doesn't exist

**Fix:** Use `optional: true` on tapOn instead:
```yaml
# ❌ Can hang
- runFlow:
    when:
      visible: "Try Free Quizzes"
    commands:
      - tapOn: "Try Free Quizzes"

# ✅ Better approach
- tapOn: "Try Free Quizzes"
  optional: true
```

---

### Airplane Mode Flaky in CI

**Cause:** `toggleAirplaneMode` requires elevated permissions, unreliable in emulators

**Fix:** Exclude offline tests from CI, run locally only. The GitHub Actions workflow excludes `07-offline.yaml`.

## Best Practices

1. **Use sample quizzes** - Avoid API calls in tests
2. **State-resilient tests** - Handle multiple starting states
3. **Screenshots on key steps** - Helps debug failures
4. **Flexible selectors** - Use regex patterns when text varies
5. **Wait for elements** - Use `extendedWaitUntil` for async content

## Related Documentation

- [Unit Testing](./UNIT_TESTING.md) - Vitest unit tests
- [E2E Testing](./E2E_TESTING.md) - Playwright browser tests
- [Phase 60 Learning Notes](../learning/epic04_saberloop_v1/PHASE60_MAESTRO_TESTING.md) - Detailed concepts
