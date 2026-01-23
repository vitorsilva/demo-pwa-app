# Phase 6: Native Enhancement (Plan B)

**Epic:** 08 - iOS
**Time:** 2-3 sessions
**Mac Required:** Yes
**Prerequisites:** Phase 5 - Rejection requiring native features

This phase transforms your PWA wrapper into a hybrid app with genuine native features.

---

## 6.1 Migrate to Capacitor

**Why Capacitor?**
- PWABuilder iOS is limited to basic WebView
- Capacitor allows adding native iOS features
- Same web code, more native capabilities
- Created by Ionic team, well-maintained

**Capacitor vs PWABuilder:**

| Feature | PWABuilder iOS | Capacitor |
|---------|----------------|-----------|
| Web code reuse | 100% | 100% |
| Native plugins | Limited | Extensive |
| Share Extension | No | Yes |
| Haptics | No | Yes |
| Push Notifications | Limited | Full |
| Community plugins | Few | Many |

---

## 6.2 Install Capacitor

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

---

## 6.3 Configure Capacitor

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

---

## 6.4 Build and Sync

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

---

## 6.5 Add Haptic Feedback

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

---

## 6.6 Add Share FROM (Results Sharing)

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

---

## 6.7 Share TO (Optional Enhancement)

The Share TO feature (iOS Share Extension) is covered in detail in **[Phase 7: Share TO](./PHASE7_SHARE_TO.md)**.

This feature allows users to share content FROM other apps (Safari, News, etc.) TO Saberloop to create quizzes. It's a powerful native feature that significantly increases App Store approval chances.

**Complete Phase 6 first**, then proceed to Phase 7 if you want this enhancement.

---

## 6.8 Rebuild and Test

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
4. (Optional) For Share TO testing, see [Phase 7](./PHASE7_SHARE_TO.md)

---

## 6.9 Resubmit to App Store

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

## 6.10 Checklist: Phase 5 Complete

- [ ] Capacitor installed and configured
- [ ] iOS project generated with `npx cap add ios`
- [ ] Haptic feedback plugin installed and integrated
- [ ] Share FROM (results) plugin installed and integrated
- [ ] All features tested on real device
- [ ] New build uploaded to App Store Connect
- [ ] App resubmitted for review with native features highlighted

---

## Troubleshooting

### Capacitor Issues

**"Module not found"**
- Solution: Run `npx cap sync ios` again, then build

**"Pod install failed"**
- Solution: `cd ios/App && pod install --repo-update`

### Share Extension Issues

See [Phase 7: Share TO](./PHASE7_SHARE_TO.md) for Share Extension troubleshooting.

---

## FAQ

**Q: Can I skip PWABuilder and go straight to Capacitor?**
A: Yes! If you're confident Apple will reject PWABuilder, you can start with Capacitor. However, trying PWABuilder first takes minimal extra effort and might succeed.

**Q: Can I develop Capacitor plugins on Windows and just build on Mac?**
A: Yes! All JavaScript/TypeScript development works on any platform. Only the final Xcode build requires Mac.

**Q: What if Apple rejects me multiple times?**
A: Each rejection gives specific feedback. Address it, add more native features if needed, and resubmit. Most apps get approved eventually.

---

## Next Steps

**Optional enhancement:**
- **[Phase 7: Share TO](./PHASE7_SHARE_TO.md)** - Add iOS Share Extension for receiving shared content

**After approval:**
- Update landing page with App Store badge
- Monitor reviews and ratings
- Consider additional iOS features (widgets, Siri shortcuts)

---

**Last Updated:** 2026-01-23
