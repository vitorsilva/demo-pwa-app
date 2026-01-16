# Phase 4: Settings UI

**Epic:** 11 - Multi-Provider LLM Support
**Status:** Not Started
**Effort:** 3-4 days
**Prerequisites:** Phase 3 complete (key management working)

---

## Goal

Create the Settings UI for managing LLM providers, including provider selection, model selection, and API key management.

---

## Tasks

### 4.1 Create LLM Providers Settings Component

**File:** `src/components/LLMProvidersSettings.js`

```javascript
/**
 * LLM Providers Settings Component
 * Main component for managing provider configuration
 */

import { getAllProviders, getProvider } from '../api/providers-config.js';
import {
  getActiveProvider,
  setActiveProvider,
  getActiveModel,
  setActiveModel
} from '../services/provider-settings-service.js';
import {
  getAllProviderStatuses,
  saveProviderKey,
  removeProviderKey,
  KEY_STATUS
} from '../services/api-keys-service.js';
import { t } from '../i18n/index.js';

export class LLMProvidersSettings {
  constructor(container) {
    this.container = container;
    this.providers = getAllProviders();
    this.statuses = {};
    this.activeProvider = null;
    this.activeModel = null;
  }

  async init() {
    this.statuses = await getAllProviderStatuses();
    this.activeProvider = await getActiveProvider();
    this.activeModel = await getActiveModel();
    this.render();
    this.startStatusPolling();
  }

  render() {
    this.container.innerHTML = `
      <div class="llm-providers-settings">
        <h3>${t('settings.llmProviders.title')}</h3>

        <!-- Active Provider Selection -->
        <div class="active-provider-section">
          <label for="active-provider">${t('settings.llmProviders.activeProvider')}</label>
          <select id="active-provider" data-testid="active-provider-select">
            ${this.renderProviderOptions()}
          </select>

          <label for="active-model">${t('settings.llmProviders.activeModel')}</label>
          <select id="active-model" data-testid="active-model-select">
            ${this.renderModelOptions()}
          </select>

          <div class="cost-estimate">
            ${t('settings.llmProviders.estimatedCost')}: ${this.getEstimatedCost()}
          </div>
        </div>

        <hr />

        <!-- Configured Providers List -->
        <div class="providers-list">
          <h4>${t('settings.llmProviders.configuredProviders')}</h4>
          ${this.providers.map(p => this.renderProviderCard(p)).join('')}
        </div>

        <!-- Info Box -->
        <div class="info-box">
          <p>${t('settings.llmProviders.openrouterRecommended')}</p>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  renderProviderOptions() {
    return this.providers
      .filter(p => this.statuses[p.id]?.hasKey)
      .map(p => `
        <option value="${p.id}" ${this.activeProvider === p.id ? 'selected' : ''}>
          ${p.name}
        </option>
      `)
      .join('');
  }

  renderModelOptions() {
    const provider = getProvider(this.activeProvider);
    if (!provider) return '';

    return provider.models.map(m => `
      <option value="${m.id}" ${this.activeModel === m.id ? 'selected' : ''}>
        ${m.name} (${this.formatPrice(m.inputPrice)}/${this.formatPrice(m.outputPrice)})
      </option>
    `).join('');
  }

  renderProviderCard(provider) {
    const status = this.statuses[provider.id] || { hasKey: false, status: KEY_STATUS.NOT_SET };
    const isActive = this.activeProvider === provider.id;

    return `
      <div class="provider-card ${isActive ? 'active' : ''}" data-provider="${provider.id}">
        <div class="provider-header">
          <span class="provider-radio">${isActive ? '●' : '○'}</span>
          <span class="provider-name">${provider.name}</span>
          <span class="provider-status ${status.status}" data-testid="${provider.id}-status">
            ${this.getStatusIcon(status.status)} ${this.getStatusText(status.status)}
          </span>
        </div>
        <div class="provider-details">
          ${status.hasKey
            ? `<span class="masked-key" data-testid="${provider.id}-masked-key">${status.maskedKey}</span>`
            : `<span class="provider-description">${provider.description}</span>`
          }
          ${provider.freeTier ? `<span class="free-tier-badge">${t('settings.llmProviders.freeTier')}</span>` : ''}
        </div>
        <div class="provider-actions">
          ${status.hasKey
            ? `
              <button class="btn-secondary" data-action="change-key" data-provider="${provider.id}">
                ${t('settings.llmProviders.changeKey')}
              </button>
              <button class="btn-danger-outline" data-action="remove-key" data-provider="${provider.id}" data-testid="remove-key-${provider.id}">
                ${t('settings.llmProviders.removeKey')}
              </button>
            `
            : `
              <button class="btn-primary" data-action="add-key" data-provider="${provider.id}" data-testid="add-key-${provider.id}">
                ${t('settings.llmProviders.addApiKey')}
              </button>
            `
          }
        </div>
      </div>
    `;
  }

  getStatusIcon(status) {
    switch (status) {
      case KEY_STATUS.VALID: return '✅';
      case KEY_STATUS.INVALID: return '❌';
      case KEY_STATUS.VALIDATING: return '🔄';
      default: return '○';
    }
  }

  getStatusText(status) {
    return t(`settings.llmProviders.keyStatus.${status}`);
  }

  formatPrice(price) {
    if (price === 0) return 'Free';
    return `$${price.toFixed(2)}/1M`;
  }

  getEstimatedCost() {
    const provider = getProvider(this.activeProvider);
    const model = provider?.models.find(m => m.id === this.activeModel);
    if (!model) return '-';

    // Estimate for a typical quiz (500 input, 800 output tokens)
    const cost = ((500 / 1_000_000) * model.inputPrice) + ((800 / 1_000_000) * model.outputPrice);
    return cost === 0 ? t('settings.llmProviders.free') : `~$${cost.toFixed(4)}/quiz`;
  }

  attachEventListeners() {
    // Provider selection
    const providerSelect = this.container.querySelector('#active-provider');
    providerSelect?.addEventListener('change', async (e) => {
      await setActiveProvider(e.target.value);
      this.activeProvider = e.target.value;

      // Reset model to default for new provider
      const provider = getProvider(e.target.value);
      await setActiveModel(provider.defaultModel);
      this.activeModel = provider.defaultModel;

      this.render();
    });

    // Model selection
    const modelSelect = this.container.querySelector('#active-model');
    modelSelect?.addEventListener('change', async (e) => {
      await setActiveModel(e.target.value);
      this.activeModel = e.target.value;
      this.render();
    });

    // Provider action buttons
    this.container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleAction(e));
    });
  }

  async handleAction(e) {
    const action = e.target.dataset.action;
    const providerId = e.target.dataset.provider;

    switch (action) {
      case 'add-key':
      case 'change-key':
        this.showAddKeyModal(providerId);
        break;
      case 'remove-key':
        this.showRemoveKeyModal(providerId);
        break;
    }
  }

  showAddKeyModal(providerId) {
    const provider = getProvider(providerId);
    // Modal implementation - see AddKeyModal component
    const modal = new AddKeyModal(provider, async (key) => {
      await saveProviderKey(providerId, key);
      this.statuses = await getAllProviderStatuses();
      this.render();
    });
    modal.show();
  }

  showRemoveKeyModal(providerId) {
    const provider = getProvider(providerId);
    // Modal implementation - see RemoveKeyModal component
    const modal = new RemoveKeyModal(provider, async () => {
      await removeProviderKey(providerId);

      // If removing active provider, switch to openrouter
      if (this.activeProvider === providerId) {
        await setActiveProvider('openrouter');
        this.activeProvider = 'openrouter';
      }

      this.statuses = await getAllProviderStatuses();
      this.render();
    });
    modal.show();
  }

  startStatusPolling() {
    // Poll for status updates every 5 seconds
    this.pollInterval = setInterval(async () => {
      const newStatuses = await getAllProviderStatuses();

      // Check if any status changed
      let changed = false;
      for (const [id, status] of Object.entries(newStatuses)) {
        if (this.statuses[id]?.status !== status.status) {
          changed = true;
          break;
        }
      }

      if (changed) {
        this.statuses = newStatuses;
        this.render();
      }
    }, 5000);
  }

  destroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}
```

---

### 4.2 Create Add Key Modal

**File:** `src/components/AddKeyModal.js`

```javascript
/**
 * Add Key Modal Component
 */

import { t } from '../i18n/index.js';

export class AddKeyModal {
  constructor(provider, onSave) {
    this.provider = provider;
    this.onSave = onSave;
    this.error = null;
  }

  show() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>${t('settings.addKeyModal.title', { provider: this.provider.name })}</h3>
          <button class="modal-close" data-action="close">&times;</button>
        </div>
        <div class="modal-body">
          <p>${t('settings.addKeyModal.enterKey', { provider: this.provider.name })}</p>
          <a href="${this.provider.docsUrl}" target="_blank" rel="noopener">
            ${this.provider.docsUrl}
          </a>

          <div class="form-group">
            <input
              type="password"
              id="api-key-input"
              data-testid="api-key-input"
              placeholder="${this.provider.keyPrefix}..."
              autocomplete="off"
            />
            <button type="button" class="btn-icon" data-action="toggle-visibility">
              👁
            </button>
          </div>

          <div class="error-message" data-testid="key-error" style="display: none;"></div>

          <div class="security-note">
            <p>⚠️ ${t('settings.addKeyModal.securityNote')}</p>
          </div>

          <div class="available-models">
            <h4>${t('settings.addKeyModal.availableModels')}</h4>
            <ul>
              ${this.provider.models.map(m => `
                <li>${m.name} ($${m.inputPrice}/1M in, $${m.outputPrice}/1M out)</li>
              `).join('')}
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" data-action="cancel">
            ${t('settings.addKeyModal.cancel')}
          </button>
          <button class="btn-primary" data-action="save" data-testid="save-key-button">
            ${t('settings.addKeyModal.saveKey')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.attachEventListeners();

    // Focus input
    overlay.querySelector('#api-key-input').focus();
  }

  attachEventListeners() {
    this.overlay.querySelector('[data-action="close"]').addEventListener('click', () => this.close());
    this.overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => this.close());
    this.overlay.querySelector('[data-action="save"]').addEventListener('click', () => this.save());
    this.overlay.querySelector('[data-action="toggle-visibility"]').addEventListener('click', (e) => {
      const input = this.overlay.querySelector('#api-key-input');
      input.type = input.type === 'password' ? 'text' : 'password';
    });

    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Save on Enter
    this.overlay.querySelector('#api-key-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.save();
    });
  }

  async save() {
    const input = this.overlay.querySelector('#api-key-input');
    const key = input.value.trim();

    if (!key) {
      this.showError(t('settings.addKeyModal.keyRequired'));
      return;
    }

    try {
      await this.onSave(key);
      this.close();
    } catch (error) {
      this.showError(error.message);
    }
  }

  showError(message) {
    const errorEl = this.overlay.querySelector('.error-message');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }

  close() {
    this.overlay.remove();
  }
}
```

---

### 4.3 Create Remove Key Modal

**File:** `src/components/RemoveKeyModal.js`

```javascript
/**
 * Remove Key Modal Component
 */

import { t } from '../i18n/index.js';

export class RemoveKeyModal {
  constructor(provider, onRemove) {
    this.provider = provider;
    this.onRemove = onRemove;
  }

  show() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal modal-small">
        <div class="modal-header">
          <h3>${t('settings.removeKeyModal.title', { provider: this.provider.name })}</h3>
        </div>
        <div class="modal-body">
          <p>${t('settings.removeKeyModal.confirm', { provider: this.provider.name })}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" data-action="cancel">
            ${t('settings.removeKeyModal.cancel')}
          </button>
          <button class="btn-danger" data-action="remove" data-testid="confirm-remove">
            ${t('settings.removeKeyModal.remove')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.attachEventListeners();
  }

  attachEventListeners() {
    this.overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => this.close());
    this.overlay.querySelector('[data-action="remove"]').addEventListener('click', () => this.remove());

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
  }

  async remove() {
    await this.onRemove();
    this.close();
  }

  close() {
    this.overlay.remove();
  }
}
```

---

### 4.4 Add i18n Strings

**File:** `src/i18n/en.json` (additions)

```json
{
  "settings": {
    "llmProviders": {
      "title": "LLM Providers",
      "description": "Configure AI providers for quiz generation",
      "activeProvider": "Active Provider",
      "activeModel": "Active Model",
      "estimatedCost": "Estimated cost",
      "configuredProviders": "Configured Providers",
      "openrouterRecommended": "OpenRouter is recommended for easiest setup. Add direct provider keys for lower costs.",
      "connected": "Connected",
      "notConfigured": "Not configured",
      "addApiKey": "Add API Key",
      "changeKey": "Change Key",
      "removeKey": "Remove",
      "disconnect": "Disconnect",
      "freeTier": "Free tier",
      "free": "Free",
      "keyStatus": {
        "valid": "Valid",
        "invalid": "Invalid",
        "validating": "Validating...",
        "not_set": "Not configured"
      }
    },
    "addKeyModal": {
      "title": "Add {{provider}} API Key",
      "titleChange": "Change {{provider}} API Key",
      "enterKey": "Enter your {{provider}} API key. You can get one from:",
      "securityNote": "Your API key is stored locally on your device. It is sent to our server only when making LLM calls. We never store your key on our servers.",
      "availableModels": "Available Models",
      "cancel": "Cancel",
      "saveKey": "Save Key",
      "keyRequired": "Please enter an API key",
      "invalidFormat": "Invalid API key format. Keys should start with '{{prefix}}'.",
      "keyUpdated": "API key updated. Validating...",
      "validationSuccess": "API key is valid!",
      "validationFailed": "API key validation failed: {{error}}"
    },
    "removeKeyModal": {
      "title": "Remove {{provider}} API Key",
      "confirm": "Are you sure you want to remove your {{provider}} API key?",
      "cancel": "Cancel",
      "remove": "Remove Key"
    }
  },
  "quiz": {
    "providerIndicator": {
      "poweredBy": "Powered by {{provider}}"
    }
  },
  "errors": {
    "providerError": "Error from {{provider}}: {{message}}",
    "proxyError": "Could not connect to LLM service. Please try again.",
    "invalidApiKey": "Invalid API key for {{provider}}. Please check your key in Settings.",
    "rateLimited": "Rate limit exceeded for {{provider}}. Please wait and try again.",
    "quotaExceeded": "API quota exceeded for {{provider}}. Check your account balance."
  }
}
```

---

### 4.5 Add CSS Styles

**File:** `src/styles/llm-providers.css`

```css
/* LLM Providers Settings */
.llm-providers-settings {
  padding: 1rem;
}

.llm-providers-settings h3 {
  margin-bottom: 1.5rem;
}

/* Active Provider Section */
.active-provider-section {
  background: var(--surface-color);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.active-provider-section label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.active-provider-section select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.cost-estimate {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* Provider Cards */
.providers-list {
  margin-top: 1.5rem;
}

.provider-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: border-color 0.2s;
}

.provider-card.active {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.provider-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.provider-radio {
  font-size: 1.25rem;
  color: var(--primary-color);
}

.provider-name {
  font-weight: 600;
  flex: 1;
}

.provider-status {
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.provider-status.valid {
  background: var(--success-light);
  color: var(--success-color);
}

.provider-status.invalid {
  background: var(--error-light);
  color: var(--error-color);
}

.provider-status.validating {
  background: var(--warning-light);
  color: var(--warning-color);
}

.provider-details {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.masked-key {
  font-family: monospace;
  background: var(--surface-color);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.free-tier-badge {
  background: var(--success-light);
  color: var(--success-color);
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.5rem;
}

.provider-actions {
  display: flex;
  gap: 0.5rem;
}

/* Info Box */
.info-box {
  background: var(--info-light);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1.5rem;
  font-size: 0.9rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--background-color);
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
}

.modal-small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
}

.form-group {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.form-group input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 1rem;
}

.error-message {
  color: var(--error-color);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.security-note {
  background: var(--warning-light);
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 1rem;
  font-size: 0.85rem;
}

.available-models {
  margin-top: 1.5rem;
}

.available-models h4 {
  margin-bottom: 0.5rem;
}

.available-models ul {
  font-size: 0.9rem;
  color: var(--text-secondary);
}
```

---

## Testing

### E2E Tests

**File:** `tests/e2e/llm-settings.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('LLM Provider Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/');
    await page.click('[data-testid="settings-button"]');
  });

  test('should display all providers', async ({ page }) => {
    await expect(page.locator('text=OpenRouter')).toBeVisible();
    await expect(page.locator('text=OpenAI')).toBeVisible();
    await expect(page.locator('text=Anthropic')).toBeVisible();
    await expect(page.locator('text=Google AI')).toBeVisible();
    await expect(page.locator('text=xAI')).toBeVisible();
  });

  test('should change active provider', async ({ page }) => {
    // First add an OpenAI key
    await page.click('[data-testid="add-key-openai"]');
    await page.fill('[data-testid="api-key-input"]', 'sk-test123456789');
    await page.click('[data-testid="save-key-button"]');

    // Change active provider
    await page.selectOption('[data-testid="active-provider-select"]', 'openai');

    // Verify model options updated
    await expect(page.locator('[data-testid="active-model-select"]'))
      .toContainText('GPT-4o');
  });

  test('should show cost estimate', async ({ page }) => {
    await expect(page.locator('text=Estimated cost')).toBeVisible();
    await expect(page.locator('text=/\\$[0-9.]+\\/quiz/')).toBeVisible();
  });
});
```

### Maestro Tests

**File:** `tests/maestro/llm_settings_flow.yaml`

```yaml
appId: com.saberloop.app
---
- launchApp

# Navigate to settings
- tapOn:
    id: "settings-button"

# Verify LLM Providers section visible
- assertVisible:
    text: "LLM Providers"

# Verify all providers listed
- assertVisible:
    text: "OpenRouter"
- assertVisible:
    text: "OpenAI"
- assertVisible:
    text: "Anthropic"
- assertVisible:
    text: "Google AI"

# Add OpenAI key
- tapOn:
    id: "add-key-openai"

- assertVisible:
    text: "Add OpenAI API Key"

- inputText:
    id: "api-key-input"
    text: "sk-test123456789"

- tapOn:
    id: "save-key-button"

# Verify key saved
- assertVisible:
    text: "sk-te...6789"

# Change active provider
- tapOn:
    id: "active-provider-select"

- tapOn:
    text: "OpenAI"

# Verify model dropdown updated
- assertVisible:
    text: "GPT-4o"
```

---

## Acceptance Criteria

- [ ] Settings UI displays all providers
- [ ] Active provider can be changed
- [ ] Active model can be changed per provider
- [ ] Cost estimate updates when selection changes
- [ ] Add key modal works correctly
- [ ] Remove key modal with confirmation
- [ ] Status indicators update (polling)
- [ ] All i18n strings in place
- [ ] CSS styles applied correctly
- [ ] E2E tests pass
- [ ] Maestro tests pass

---

*Previous: [PHASE3_KEY_MANAGEMENT.md](./PHASE3_KEY_MANAGEMENT.md)*
*Next: [PHASE5_POLISH.md](./PHASE5_POLISH.md)*
