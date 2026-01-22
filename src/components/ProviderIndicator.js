/**
 * Provider Indicator Component
 * Shows current LLM provider in quiz view
 */

import { getActiveProvider } from '../services/provider-settings-service.js';
import { getProvider } from '../api/providers-config.js';
import { t } from '../core/i18n.js';

/**
 * Provider icons mapping
 */
const PROVIDER_ICONS = {
  openrouter: '🔀',
  openai: '🤖',
  anthropic: '🧠',
  google: '✨',
  xai: '🚀',
};

/**
 * Creates a provider indicator element
 * @returns {HTMLElement} Provider indicator element
 */
export function createProviderIndicator() {
  const container = document.createElement('div');
  container.className =
    'provider-indicator flex items-center gap-1 text-xs text-subtext-light dark:text-subtext-dark opacity-80';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-label', t('quiz.providerIndicator.ariaLabel'));

  // Start with loading state
  container.innerHTML = `
    <span class="provider-indicator__icon text-sm" aria-hidden="true">🤖</span>
    <span class="provider-indicator__text whitespace-nowrap"></span>
  `;

  // Update async
  updateIndicator(container);

  return container;
}

/**
 * Updates the indicator with current provider info
 * @param {HTMLElement} container - The indicator container element
 */
export async function updateIndicator(container) {
  try {
    const activeProviderId = await getActiveProvider();
    const provider = getProvider(activeProviderId);

    if (!provider) {
      container.innerHTML = '';
      return;
    }

    const icon = PROVIDER_ICONS[activeProviderId] || '🤖';

    container.innerHTML = `
      <span class="provider-indicator__icon text-sm" aria-hidden="true">${icon}</span>
      <span class="provider-indicator__text whitespace-nowrap">
        ${t('quiz.providerIndicator.poweredBy', { provider: provider.name })}
      </span>
    `;
  } catch {
    // Silently fail - indicator is non-critical UI
    container.innerHTML = '';
  }
}
