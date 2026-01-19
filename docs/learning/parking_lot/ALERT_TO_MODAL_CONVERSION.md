# Alert to Modal Conversion

## Overview

Replace all native browser `alert()` and `confirm()` dialogs with custom modal components that match the app's design system, providing a consistent and polished user experience.

**Status:** Parked
**Priority:** Medium (UX Polish)
**Estimated Effort:** Medium (~4-6 hours)
**Reason Parked:** Not blocking any features, UX enhancement

---

## Current State

### Native Alerts Found (9 instances)

| File | Line | Message Key | Context |
|------|------|-------------|---------|
| `TopicsView.js` | 224 | `errors.cannotReplay` | Cannot replay quiz error |
| `TopicInputView.js` | 83 | `errors.enterTopic` | Empty topic validation |
| `PartyQuizView.js` | 96 | `party.roomNotFound` | Party room not found |
| `PartyLobbyView.js` | 85 | `party.roomNotFound` | Party room not found |
| `PartyLobbyView.js` | 249 | `party.hostLeft` | Host disconnected |
| `PartyLobbyView.js` | 328 | `party.hostLeft` | Host left room |
| `LoadingView.js` | 240 | `errors.failedToGenerate` | Quiz generation error |
| `CreatePartyView.js` | 380 | `errors.generic` | Party creation error |
| `CreatePartyView.js` | 518 | `errors.generic` | Party creation error |

### Native Confirms Found (5 instances)

| File | Line | Message Key | Context |
|------|------|-------------|---------|
| `SettingsView.js` | 450 | `settings.confirmDisconnect` | Disconnect OpenRouter |
| `QuizView.js` | 136 | `quiz.confirmLeave` | Back button during quiz |
| `QuizView.js` | 176 | `quiz.confirmLeave` | Home button during quiz |
| `LoadingView.js` | 249 | `loading.confirmCancel` | Cancel quiz generation |
| `main.js` | 225 | (hardcoded) | SW update notification |

### Existing Modal Components (6)

The codebase already has well-designed modal components in `src/components/`:

| Component | Pattern | Features |
|-----------|---------|----------|
| `DeleteQuizModal.js` | Promise → `true/false` | Backdrop, Escape key, i18n |
| `DeleteDataModal.js` | Promise → `true/false` | Loading state, async callback |
| `ShareQuizModal.js` | Close only | Copy URL, social sharing |
| `ExplanationModal.js` | Close only | Async data fetch |
| `ShareModal.js` | Close only | Result sharing |
| `ConnectModal.js` | Callback | OpenRouter connection |

**Common modal pattern:**
- Backdrop: `fixed inset-0 bg-black/50 flex items-center justify-center z-50`
- Close triggers: Backdrop click + Escape key
- i18n: All text uses `t()` function
- Theming: Dark/light mode with Tailwind classes

---

## Goals

1. **Consistent UX** - All dialogs match app design system
2. **Better accessibility** - Custom modals with proper focus management
3. **Reusable components** - Generic AlertModal and ConfirmModal
4. **Full i18n support** - All modal text translated
5. **Comprehensive testing** - Unit, E2E, and Maestro coverage

---

## Implementation Plan

### Phase 1: Create Generic Modal Components

#### Step 1.1: Create AlertModal Component

**File:** `src/components/AlertModal.js`

**API:**
```javascript
/**
 * Show an alert modal with a single OK button
 * @param {Object} options
 * @param {string} options.title - Modal title (i18n key or string)
 * @param {string} options.message - Modal message (i18n key or string)
 * @param {string} [options.icon='error'] - Icon name (error, warning, info, success)
 * @param {string} [options.buttonText] - Custom button text (default: t('common.ok'))
 * @returns {Promise<void>} Resolves when user clicks OK
 */
export function showAlertModal({ title, message, icon = 'error', buttonText })
```

**Icon variants:**
- `error` - Red circle with `!` (for errors)
- `warning` - Yellow triangle (for warnings)
- `info` - Blue circle with `i` (for information)
- `success` - Green checkmark (for confirmations)

#### Step 1.2: Create ConfirmModal Component

**File:** `src/components/ConfirmModal.js`

**API:**
```javascript
/**
 * Show a confirmation modal with Cancel/Confirm buttons
 * @param {Object} options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {string} [options.icon='warning'] - Icon name
 * @param {string} [options.confirmText] - Confirm button text (default: t('common.confirm'))
 * @param {string} [options.cancelText] - Cancel button text (default: t('common.cancel'))
 * @param {boolean} [options.destructive=false] - If true, confirm button is red
 * @returns {Promise<boolean>} true if confirmed, false if cancelled
 */
export function showConfirmModal({ title, message, icon, confirmText, cancelText, destructive })
```

### Phase 2: Add i18n Keys

**File:** `src/core/i18n.js` (and translation files)

New keys needed:
```javascript
// Alert modal titles
'modal.errorTitle': 'Error',
'modal.warningTitle': 'Warning',
'modal.infoTitle': 'Information',

// Common buttons (may already exist)
'common.ok': 'OK',
'common.confirm': 'Confirm',
'common.cancel': 'Cancel',

// SW update (currently hardcoded)
'app.updateAvailable': 'Update Available',
'app.updateMessage': 'A new version is available. Reload to update?',
'app.reload': 'Reload'
```

### Phase 3: Replace Alert Calls

**Files to update:** 6 files with 9 alert() calls

```javascript
// Before
alert(t('errors.cannotReplay'));

// After
import { showAlertModal } from '../components/AlertModal.js';
await showAlertModal({
  title: t('modal.errorTitle'),
  message: t('errors.cannotReplay'),
  icon: 'error'
});
```

| File | Alerts | Icon Type |
|------|--------|-----------|
| `TopicsView.js` | 1 | error |
| `TopicInputView.js` | 1 | warning |
| `PartyQuizView.js` | 1 | error |
| `PartyLobbyView.js` | 3 | warning |
| `LoadingView.js` | 1 | error |
| `CreatePartyView.js` | 2 | error |

### Phase 4: Replace Confirm Calls

**Files to update:** 4 files with 5 confirm() calls

```javascript
// Before
if (confirm(t('quiz.confirmLeave'))) {
  // navigate away
}

// After
import { showConfirmModal } from '../components/ConfirmModal.js';
const confirmed = await showConfirmModal({
  title: t('quiz.leaveTitle'),
  message: t('quiz.confirmLeave'),
  icon: 'warning',
  confirmText: t('quiz.leave'),
  destructive: true
});
if (confirmed) {
  // navigate away
}
```

| File | Confirms | Destructive |
|------|----------|-------------|
| `SettingsView.js` | 1 | Yes (disconnect) |
| `QuizView.js` | 2 | Yes (leave quiz) |
| `LoadingView.js` | 1 | Yes (cancel generation) |
| `main.js` | 1 | No (update app) |

### Phase 5: Refactor Handlers to Async

Some handlers need refactoring to support `async/await`:

```javascript
// Before (synchronous)
backBtn.addEventListener('click', () => {
  if (confirm(t('quiz.confirmLeave'))) {
    router.navigate('/');
  }
});

// After (async)
backBtn.addEventListener('click', async () => {
  const confirmed = await showConfirmModal({...});
  if (confirmed) {
    router.navigate('/');
  }
});
```

---

## Testing Requirements

### Unit Tests (Vitest)

**File:** `src/components/AlertModal.test.js`

```javascript
describe('AlertModal', () => {
  it('renders with title and message');
  it('resolves promise when OK clicked');
  it('closes on backdrop click');
  it('closes on Escape key');
  it('displays correct icon for each type (error, warning, info, success)');
  it('uses custom button text when provided');
  it('supports i18n keys');
});
```

**File:** `src/components/ConfirmModal.test.js`

```javascript
describe('ConfirmModal', () => {
  it('renders with title and message');
  it('resolves true when confirm clicked');
  it('resolves false when cancel clicked');
  it('resolves false on backdrop click');
  it('resolves false on Escape key');
  it('shows destructive style when destructive=true');
  it('uses custom button texts when provided');
  it('supports i18n keys');
});
```

**Coverage targets:**
- AlertModal: 100% line coverage
- ConfirmModal: 100% line coverage

### E2E Tests (Playwright)

**File:** `tests/e2e/modals.spec.js`

```javascript
test.describe('Alert and Confirm Modals', () => {
  test('shows error modal when topic input is empty', async ({ page }) => {
    // Navigate to topic input
    // Submit empty form
    // Verify AlertModal appears with correct message
    // Click OK
    // Verify modal closes
  });

  test('shows confirm modal when leaving quiz', async ({ page }) => {
    // Start a quiz
    // Click back button
    // Verify ConfirmModal appears
    // Click Cancel
    // Verify still on quiz
    // Click back again
    // Click Confirm (Leave)
    // Verify navigated away
  });

  test('confirm modal closes on Escape key', async ({ page }) => {
    // Trigger confirm modal
    // Press Escape
    // Verify modal closed and action cancelled
  });

  test('confirm modal closes on backdrop click', async ({ page }) => {
    // Trigger confirm modal
    // Click backdrop
    // Verify modal closed and action cancelled
  });
});
```

### Maestro Tests (Mobile)

**File:** `tests/maestro/modal-interactions.yaml`

```yaml
appId: com.saberloop.app
---
- launchApp
- tapOn: "Topics"
- tapOn: "Create Quiz"
# Don't enter topic, just submit
- tapOn: "Generate"
# Verify alert modal appears
- assertVisible: "Enter a topic"
- tapOn: "OK"
# Verify modal closed
- assertNotVisible: "Enter a topic"

---
# Test confirm modal on quiz leave
- launchApp
- tapOn: "Topics"
- tapOn:
    id: "quiz-topic-card"
    index: 0
- tapOn: "Start Quiz"
# Wait for quiz to load
- waitForAnimationToEnd
- tapOn:
    id: "back-button"
- assertVisible: "Leave Quiz?"
- tapOn: "Cancel"
# Should still be on quiz
- assertVisible: "Question"
```

**File:** `tests/maestro/modal-party-errors.yaml`

```yaml
appId: com.saberloop.app
---
# Test party room not found error
- launchApp
- openLink: "https://saberloop.com/app/#/party/join/INVALID123"
- assertVisible: "Room not found"
- tapOn: "OK"
- assertVisible: "Home"
```

---

## i18n Checklist

### New Keys Required

| Key | EN | PT |
|-----|----|----|
| `modal.errorTitle` | Error | Erro |
| `modal.warningTitle` | Warning | Aviso |
| `modal.infoTitle` | Information | Informação |
| `common.ok` | OK | OK |
| `common.confirm` | Confirm | Confirmar |
| `app.updateAvailable` | Update Available | Atualização Disponível |
| `app.updateMessage` | A new version is available. Reload to update? | Nova versão disponível. Recarregar para atualizar? |
| `app.reload` | Reload | Recarregar |
| `quiz.leaveTitle` | Leave Quiz? | Sair do Quiz? |
| `quiz.leave` | Leave | Sair |
| `loading.cancelTitle` | Cancel Generation? | Cancelar Geração? |
| `settings.disconnectTitle` | Disconnect? | Desconectar? |

### Verify Existing Keys

Ensure these keys exist and are properly translated:
- `errors.cannotReplay`
- `errors.enterTopic`
- `errors.failedToGenerate`
- `errors.generic`
- `party.roomNotFound`
- `party.hostLeft`
- `quiz.confirmLeave`
- `loading.confirmCancel`
- `settings.confirmDisconnect`
- `common.cancel`

---

## Files to Change

### New Files
1. `src/components/AlertModal.js` - Generic alert modal
2. `src/components/ConfirmModal.js` - Generic confirm modal
3. `src/components/AlertModal.test.js` - Unit tests
4. `src/components/ConfirmModal.test.js` - Unit tests
5. `tests/e2e/modals.spec.js` - E2E tests
6. `tests/maestro/modal-interactions.yaml` - Maestro tests
7. `tests/maestro/modal-party-errors.yaml` - Maestro party error tests

### Modified Files
1. `src/core/i18n.js` - Add new translation keys
2. `src/views/TopicsView.js` - Replace 1 alert
3. `src/views/TopicInputView.js` - Replace 1 alert
4. `src/views/PartyQuizView.js` - Replace 1 alert
5. `src/views/PartyLobbyView.js` - Replace 3 alerts
6. `src/views/LoadingView.js` - Replace 1 alert + 1 confirm
7. `src/views/CreatePartyView.js` - Replace 2 alerts
8. `src/views/SettingsView.js` - Replace 1 confirm
9. `src/views/QuizView.js` - Replace 2 confirms
10. `src/main.js` - Replace 1 confirm (SW update)

**Total:** 7 new files + 10 modified files

---

## Validation Checklist

### Functional
- [ ] AlertModal displays correctly with all icon types
- [ ] ConfirmModal displays correctly with normal and destructive styles
- [ ] All 9 alert() calls replaced and working
- [ ] All 5 confirm() calls replaced and working
- [ ] Modals close on OK/Confirm click
- [ ] Modals close on Cancel click
- [ ] Modals close on backdrop click
- [ ] Modals close on Escape key
- [ ] SW update modal works correctly

### Testing
- [ ] AlertModal unit tests pass (100% coverage)
- [ ] ConfirmModal unit tests pass (100% coverage)
- [ ] E2E modal tests pass
- [ ] Maestro modal tests pass
- [ ] All existing tests still pass
- [ ] Manual testing on mobile (iOS + Android)

### i18n
- [ ] All new keys added to EN translation
- [ ] All new keys added to PT translation
- [ ] No hardcoded strings in modal components
- [ ] RTL layout works (if supported)

### Visual/UX
- [ ] Modals match existing design system
- [ ] Dark mode displays correctly
- [ ] Light mode displays correctly
- [ ] Animations feel smooth
- [ ] Focus trapped inside modal
- [ ] Screen reader announces modal

---

## Success Metrics

- **Zero native dialogs** - No `alert()` or `confirm()` calls remain
- **100% test coverage** - New modal components fully tested
- **Consistent UX** - All dialogs match app design
- **Full i18n** - All text translated

---

## Rollback Plan

If issues arise:
1. Revert to native `alert()` and `confirm()` calls
2. Keep modal components for future use
3. Document issues for next attempt

---

## Related Documentation

- [DeleteQuizModal](../../src/components/DeleteQuizModal.js) - Example confirm modal
- [DeleteDataModal](../../src/components/DeleteDataModal.js) - Example with loading state
- [Tailwind Modal Patterns](https://tailwindui.com/components/application-ui/overlays/modals)

---

## Notes

- The `deferredPrompt.prompt()` in `app.js:46` is the PWA install prompt, NOT a browser alert - no changes needed
- Consider adding toast notifications for less critical alerts in the future
- Modal focus management is important for accessibility - trap focus inside modal while open
- Test keyboard navigation: Tab should cycle through modal buttons

---

**Last Updated:** 2026-01-19
**Author:** Claude Code Audit
