/**
 * LLM Providers Settings Component
 * Main component for managing LLM provider configuration in Settings
 */

import { getAllProviders, getProvider, getDefaultModel } from '../api/providers-config.js';
import {
  getActiveProvider,
  setActiveProvider,
  getActiveModel,
  setActiveModel,
  getAllProviderStatuses,
  saveProviderKeyWithValidation,
  removeProviderKeyWithStatus,
  KEY_STATUS,
} from '../services/provider-settings-service.js';
import { t } from '../core/i18n.js';
import { showAddKeyModal } from './AddKeyModal.js';
import { showRemoveKeyModal } from './RemoveKeyModal.js';

/**
 * Create and render the LLM Providers Settings section
 * @param {HTMLElement} container - Container element to render into
 * @param {Function} onUpdate - Callback when settings change (to re-render parent)
 * @returns {Object} Component interface with destroy method
 */
export async function createLLMProvidersSettings(container, onUpdate = () => {}) {
  const providers = getAllProviders();
  let statuses = {};
  let activeProvider = null;
  let activeModel = null;
  let pollInterval = null;

  // Initial load
  async function init() {
    statuses = await getAllProviderStatuses();
    activeProvider = await getActiveProvider();
    activeModel = await getActiveModel();

    // If no model selected, use default for active provider
    if (!activeModel) {
      const provider = getProvider(activeProvider);
      activeModel = provider?.defaultModel || null;
      if (activeModel) {
        await setActiveModel(activeModel);
      }
    }

    render();
    startStatusPolling();
  }

  function render() {
    const configuredProviders = providers.filter((p) => statuses[p.id]?.hasKey);

    container.innerHTML = `
      <div class="llm-providers-settings">
        <h2 class="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-8">
          ${t('settings.llmProviders.title')}
        </h2>

        <!-- Active Provider Selection -->
        <div class="bg-card-light dark:bg-card-dark rounded-xl p-4 mb-4">
          ${
            configuredProviders.length > 0
              ? `
            <div class="mb-4">
              <label class="text-base font-medium text-text-light dark:text-text-dark block mb-2">
                ${t('settings.llmProviders.activeProvider')}
              </label>
              <select id="active-provider-select" data-testid="active-provider-select"
                class="form-select w-full rounded-lg h-12 px-4 text-base bg-background-light dark:bg-background-dark
                border border-border-light dark:border-border-dark text-text-light dark:text-text-dark
                focus:ring-2 focus:ring-primary focus:border-primary">
                ${renderProviderOptions(configuredProviders)}
              </select>
            </div>

            <div class="mb-4">
              <label class="text-base font-medium text-text-light dark:text-text-dark block mb-2">
                ${t('settings.llmProviders.activeModel')}
              </label>
              <select id="active-model-select" data-testid="active-model-select"
                class="form-select w-full rounded-lg h-12 px-4 text-base bg-background-light dark:bg-background-dark
                border border-border-light dark:border-border-dark text-text-light dark:text-text-dark
                focus:ring-2 focus:ring-primary focus:border-primary">
                ${renderModelOptions()}
              </select>
            </div>

            <div class="flex items-center gap-2 text-sm text-subtext-light dark:text-subtext-dark">
              <span class="material-symbols-outlined text-base">payments</span>
              <span>${t('settings.llmProviders.estimatedCost')}: <strong>${getEstimatedCost()}</strong></span>
            </div>
          `
              : `
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-yellow-500">warning</span>
              <div>
                <p class="text-text-light dark:text-text-dark text-base font-medium">
                  ${t('settings.llmProviders.noProviderConfigured')}
                </p>
                <p class="text-subtext-light dark:text-subtext-dark text-sm">
                  ${t('settings.llmProviders.addProviderToStart')}
                </p>
              </div>
            </div>
          `
          }
        </div>

        <!-- Configured Providers List -->
        <h3 class="text-text-light dark:text-text-dark text-base font-medium mb-3">
          ${t('settings.llmProviders.configuredProviders')}
        </h3>

        <div class="flex flex-col gap-3 mb-4">
          ${providers.map((p) => renderProviderCard(p)).join('')}
        </div>

        <!-- Info Box -->
        <div class="bg-blue-500/10 rounded-xl p-4 flex items-start gap-3">
          <span class="material-symbols-outlined text-blue-500 mt-0.5">info</span>
          <p class="text-sm text-subtext-light dark:text-subtext-dark">
            ${t('settings.llmProviders.openrouterRecommended')}
          </p>
        </div>
      </div>
    `;

    attachEventListeners();
  }

  function renderProviderOptions(configuredProviders) {
    return configuredProviders
      .map(
        (p) => `
        <option value="${p.id}" ${activeProvider === p.id ? 'selected' : ''}>
          ${p.name}
        </option>
      `
      )
      .join('');
  }

  function renderModelOptions() {
    const provider = getProvider(activeProvider);
    if (!provider) return '<option value="">-</option>';

    return provider.models
      .map(
        (m) => `
        <option value="${m.id}" ${activeModel === m.id ? 'selected' : ''}>
          ${m.name} (${formatPrice(m.inputPrice)}/${formatPrice(m.outputPrice)})
        </option>
      `
      )
      .join('');
  }

  function renderProviderCard(provider) {
    const status = statuses[provider.id] || { hasKey: false, status: KEY_STATUS.NOT_SET };
    const isActive = activeProvider === provider.id;

    return `
      <div class="bg-card-light dark:bg-card-dark rounded-xl p-4 ${isActive ? 'ring-2 ring-primary' : ''}"
           data-provider="${provider.id}">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-3">
            <span class="text-xl ${isActive ? 'text-primary' : 'text-subtext-light dark:text-subtext-dark'}">
              ${isActive ? '●' : '○'}
            </span>
            <span class="text-text-light dark:text-text-dark font-medium">${provider.name}</span>
          </div>
          <span class="text-sm px-2 py-1 rounded ${getStatusClasses(status.status)}" data-testid="${provider.id}-status">
            ${getStatusIcon(status.status)} ${getStatusText(status.status)}
          </span>
        </div>

        <div class="text-sm text-subtext-light dark:text-subtext-dark mb-3 ml-8">
          ${
            status.hasKey
              ? `<code class="bg-background-light dark:bg-background-dark px-2 py-1 rounded text-xs" data-testid="${provider.id}-masked-key">${status.maskedKey}</code>`
              : `<span>${provider.description}</span>`
          }
          ${provider.freeTier ? `<span class="ml-2 text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded">${t('settings.llmProviders.freeTier')}</span>` : ''}
        </div>

        <div class="flex gap-2 ml-8">
          ${
            status.hasKey
              ? `
              <button class="text-sm px-3 py-1.5 rounded-lg bg-background-light dark:bg-background-dark
                text-text-light dark:text-text-dark hover:bg-primary/10 transition-colors"
                data-action="change-key" data-provider="${provider.id}">
                ${t('settings.llmProviders.changeKey')}
              </button>
              <button class="text-sm px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                data-action="remove-key" data-provider="${provider.id}" data-testid="remove-key-${provider.id}">
                ${t('settings.llmProviders.removeKey')}
              </button>
            `
              : `
              <button class="text-sm px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
                data-action="add-key" data-provider="${provider.id}" data-testid="add-key-${provider.id}">
                ${t('settings.llmProviders.addApiKey')}
              </button>
            `
          }
        </div>
      </div>
    `;
  }

  function getStatusIcon(status) {
    switch (status) {
      case KEY_STATUS.VALID:
        return '✓';
      case KEY_STATUS.INVALID:
        return '✗';
      case KEY_STATUS.VALIDATING:
        return '⟳';
      default:
        return '';
    }
  }

  function getStatusText(status) {
    return t(`settings.llmProviders.keyStatus.${status}`);
  }

  function getStatusClasses(status) {
    switch (status) {
      case KEY_STATUS.VALID:
        return 'bg-green-500/10 text-green-600';
      case KEY_STATUS.INVALID:
        return 'bg-red-500/10 text-red-500';
      case KEY_STATUS.VALIDATING:
        return 'bg-yellow-500/10 text-yellow-600';
      default:
        return 'bg-gray-500/10 text-subtext-light dark:text-subtext-dark';
    }
  }

  function formatPrice(price) {
    if (price === 0) return t('settings.llmProviders.free');
    return `$${price.toFixed(2)}/1M`;
  }

  function getEstimatedCost() {
    const provider = getProvider(activeProvider);
    const model = provider?.models.find((m) => m.id === activeModel);
    if (!model) return '-';

    // Estimate for a typical quiz (500 input, 800 output tokens)
    const cost = (500 / 1_000_000) * model.inputPrice + (800 / 1_000_000) * model.outputPrice;
    return cost === 0 ? t('settings.llmProviders.free') : `~$${cost.toFixed(4)}/quiz`;
  }

  function attachEventListeners() {
    // Provider selection
    const providerSelect = container.querySelector('#active-provider-select');
    if (providerSelect) {
      providerSelect.addEventListener('change', async (e) => {
        activeProvider = e.target.value;
        await setActiveProvider(activeProvider);

        // Reset model to default for new provider
        const provider = getProvider(activeProvider);
        activeModel = provider?.defaultModel || provider?.models[0]?.id;
        if (activeModel) {
          await setActiveModel(activeModel);
        }

        render();
        onUpdate();
      });
    }

    // Model selection
    const modelSelect = container.querySelector('#active-model-select');
    if (modelSelect) {
      modelSelect.addEventListener('change', async (e) => {
        activeModel = e.target.value;
        await setActiveModel(activeModel);
        render();
        onUpdate();
      });
    }

    // Provider action buttons
    container.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => handleAction(e));
    });
  }

  async function handleAction(e) {
    const action = e.target.dataset.action;
    const providerId = e.target.dataset.provider;

    switch (action) {
      case 'add-key':
      case 'change-key':
        await handleAddKey(providerId);
        break;
      case 'remove-key':
        await handleRemoveKey(providerId);
        break;
    }
  }

  async function handleAddKey(providerId) {
    const provider = getProvider(providerId);
    const result = await showAddKeyModal(provider);

    if (result.saved) {
      try {
        await saveProviderKeyWithValidation(providerId, result.key);
        statuses = await getAllProviderStatuses();

        // If this is the first provider configured, make it active
        const configuredProviders = providers.filter((p) => statuses[p.id]?.hasKey);
        if (configuredProviders.length === 1) {
          activeProvider = providerId;
          await setActiveProvider(providerId);
          activeModel = provider.defaultModel;
          await setActiveModel(activeModel);
        }

        render();
        onUpdate();
      } catch (error) {
        // Error will be shown in the modal validation
        console.error('Failed to save key:', error);
      }
    }
  }

  async function handleRemoveKey(providerId) {
    const provider = getProvider(providerId);
    const confirmed = await showRemoveKeyModal(provider);

    if (confirmed) {
      await removeProviderKeyWithStatus(providerId);

      // If removing active provider, switch to another configured one or openrouter
      if (activeProvider === providerId) {
        const remainingConfigured = providers.filter(
          (p) => p.id !== providerId && statuses[p.id]?.hasKey
        );
        if (remainingConfigured.length > 0) {
          activeProvider = remainingConfigured[0].id;
          activeModel = getDefaultModel(activeProvider);
        } else {
          activeProvider = 'openrouter';
          activeModel = null;
        }
        await setActiveProvider(activeProvider);
        if (activeModel) {
          await setActiveModel(activeModel);
        }
      }

      statuses = await getAllProviderStatuses();
      render();
      onUpdate();
    }
  }

  function startStatusPolling() {
    // Poll for status updates every 5 seconds
    pollInterval = setInterval(async () => {
      const newStatuses = await getAllProviderStatuses();

      // Check if any status changed
      let changed = false;
      for (const [id, status] of Object.entries(newStatuses)) {
        if (statuses[id]?.status !== status.status) {
          changed = true;
          break;
        }
      }

      if (changed) {
        statuses = newStatuses;
        render();
      }
    }, 5000);
  }

  function destroy() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  // Initialize
  await init();

  // Return component interface
  return {
    destroy,
    refresh: async () => {
      statuses = await getAllProviderStatuses();
      activeProvider = await getActiveProvider();
      activeModel = await getActiveModel();
      render();
    },
  };
}
