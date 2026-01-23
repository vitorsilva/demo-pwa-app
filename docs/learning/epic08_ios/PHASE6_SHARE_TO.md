# Phase 6: Share TO Functionality

**Epic:** 08 - iOS
**Time:** 1-2 sessions
**Mac Required:** Yes
**Prerequisites:** Phase 5 complete (Capacitor installed)

---

## Overview

Receive shared content to create quizzes. This is a key iOS-native feature that transforms Saberloop from "a website" to "an iOS learning tool."

**User Flow:**
1. User sees interesting article/content in Safari, News, or any app
2. Taps Share → Saberloop
3. Saberloop opens with content as topic suggestion
4. User generates quiz based on shared content

**Why This Matters:**
- Genuine iOS integration that can't be done with a website
- Significantly increases approval chances on App Store
- Provides unique value to iOS users
- Natural fit for learning app workflow

---

## Technical Requirements

- iOS Share Extension (native Swift code)
- URL scheme for deep linking (`saberloop://`)
- Handle incoming share data in web app
- Parse shared text/URL for topic extraction

---

## 6.1 Create Share Extension in Xcode

1. In Xcode, File → New → Target
2. Select "Share Extension"
3. Name: "ShareToSaberloop"
4. Finish

---

## 6.2 Configure Share Extension

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

---

## 6.3 Configure URL Scheme

In Xcode, select main App target → Info tab → URL Types:
- Add URL Scheme: `saberloop`

---

## 6.4 Handle Incoming Share in Web App

**File:** `src/features/share-handler.js`

```javascript
import { App } from '@capacitor/app';

export function setupShareHandler() {
  App.addListener('appUrlOpen', (event) => {
    const url = new URL(event.url);

    if (url.protocol === 'saberloop:' && url.host === 'share') {
      const content = url.searchParams.get('content');
      if (content) {
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

**Initialize in main.js:**

```javascript
import { setupShareHandler } from './features/share-handler.js';

// On app start
setupShareHandler();
```

---

## 6.5 Topic Extraction Enhancements (Optional)

For smarter topic extraction:

```javascript
function extractTopic(content) {
  // If it's a URL, try to extract page title or path
  if (content.startsWith('http://') || content.startsWith('https://')) {
    const url = new URL(content);
    // Use last path segment as topic hint
    const pathParts = url.pathname.split('/').filter(p => p);
    if (pathParts.length > 0) {
      return pathParts[pathParts.length - 1]
        .replace(/-/g, ' ')
        .replace(/_/g, ' ');
    }
    return url.hostname;
  }

  // For text, use first sentence or first 100 chars
  const firstSentence = content.split(/[.!?]/)[0];
  if (firstSentence.length < 100) {
    return firstSentence.trim();
  }
  return content.substring(0, 100).trim();
}
```

---

## 6.6 Testing

1. Build and run on iPhone
2. Open Safari and navigate to any article
3. Tap Share button
4. Select "Saberloop" from share sheet
5. Verify Saberloop opens with topic pre-filled
6. Test with different content types:
   - URL from Safari
   - Text selection from Notes
   - Link from Twitter/News app

---

## 6.7 Checklist: Phase 6 Complete

- [ ] Share Extension target created in Xcode
- [ ] ShareViewController.swift implemented
- [ ] URL scheme `saberloop://` registered
- [ ] share-handler.js created
- [ ] Handler initialized in main.js
- [ ] Tested sharing from Safari
- [ ] Tested sharing from other apps
- [ ] Topic pre-fills correctly in home view

---

## Troubleshooting

### Extension not appearing in share sheet

- Verify extension target is included in build scheme
- Check that extension and main app have same team/signing
- Try restarting the device

### App not opening from extension

- Verify URL scheme is registered in Info.plist
- Check URL encoding of shared content
- Test URL scheme manually: `saberloop://share?content=test`

### Topic not pre-filling

- Check console for errors in share-handler.js
- Verify URL parsing is correct
- Test with simple content first

---

## Related Documents

- [PHASE5_NATIVE_ENHANCEMENT.md](./PHASE5_NATIVE_ENHANCEMENT.md) - Capacitor setup (prerequisite)
- [Epic 6: Quiz Sharing](../epic06_sharing/PHASE1_QUIZ_SHARING.md) - Share FROM functionality

---

**Last Updated:** 2026-01-23
