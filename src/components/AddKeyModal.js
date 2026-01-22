/**
 * Add Key Modal Component
 * Modal for adding or changing API keys for LLM providers
 */

import { t } from '../core/i18n.js';
import { validateKeyFormat } from '../api/providers-config.js';

/**
 * Show the Add Key modal
 * @param {Object} provider - Provider configuration object
 * @returns {Promise<{saved: boolean, key?: string}>} Result with saved flag and key if saved
 */
export function showAddKeyModal(provider) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.id = 'addKeyModal';
    backdrop.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';

    backdrop.innerHTML = `
      <div class="bg-background-light dark:bg-background-dark rounded-2xl max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
           data-testid="add-key-modal"
           role="dialog"
           aria-modal="true"
           aria-labelledby="add-key-title">

        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <h3 id="add-key-title" class="text-lg font-bold text-text-light dark:text-text-dark">
            ${t('settings.addKeyModal.title', { provider: provider.name })}
          </h3>
          <button class="p-1 text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
                  data-action="close" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="p-4">
          <p class="text-sm text-subtext-light dark:text-subtext-dark mb-2">
            ${t('settings.addKeyModal.enterKey', { provider: provider.name })}
          </p>
          <a href="${provider.docsUrl}" target="_blank" rel="noopener noreferrer"
             class="text-sm text-primary hover:underline inline-flex items-center gap-1 mb-4">
            ${provider.docsUrl}
            <span class="material-symbols-outlined text-base">open_in_new</span>
          </a>

          <!-- Key Input -->
          <div class="relative mb-4">
            <input type="password"
                   id="api-key-input"
                   data-testid="api-key-input"
                   placeholder="${provider.keyPrefix}..."
                   autocomplete="off"
                   class="w-full px-4 py-3 pr-12 rounded-lg border border-border-light dark:border-border-dark
                          bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark
                          focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
            />
            <button type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
                    data-action="toggle-visibility"
                    aria-label="Toggle visibility">
              <span class="material-symbols-outlined" id="visibility-icon">visibility</span>
            </button>
          </div>

          <!-- Error Message -->
          <div id="key-error" data-testid="key-error"
               class="text-sm text-red-500 mb-4 hidden">
          </div>

          <!-- Security Note -->
          <div class="bg-yellow-500/10 rounded-lg p-3 mb-4 flex items-start gap-2">
            <span class="material-symbols-outlined text-yellow-600 text-lg mt-0.5">warning</span>
            <p class="text-sm text-subtext-light dark:text-subtext-dark">
              ${t('settings.addKeyModal.securityNote')}
            </p>
          </div>

          <!-- Available Models -->
          <div>
            <h4 class="text-sm font-medium text-text-light dark:text-text-dark mb-2">
              ${t('settings.addKeyModal.availableModels')}
            </h4>
            <ul class="text-sm text-subtext-light dark:text-subtext-dark space-y-1">
              ${provider.models
                .map(
                  (m) => `
                <li class="flex justify-between">
                  <span>${m.name}</span>
                  <span class="text-xs">$${m.inputPrice}/1M in · $${m.outputPrice}/1M out</span>
                </li>
              `
                )
                .join('')}
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex gap-3 p-4 border-t border-border-light dark:border-border-dark">
          <button class="flex-1 h-12 rounded-xl bg-card-light dark:bg-card-dark
                         text-text-light dark:text-text-dark font-medium
                         hover:bg-primary/10 transition-colors"
                  data-action="cancel">
            ${t('settings.addKeyModal.cancel')}
          </button>
          <button class="flex-1 h-12 rounded-xl bg-primary text-white font-bold
                         hover:bg-primary-hover transition-colors"
                  data-action="save" data-testid="save-key-button">
            ${t('settings.addKeyModal.saveKey')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const input = backdrop.querySelector('#api-key-input');
    const errorEl = backdrop.querySelector('#key-error');
    const visibilityIcon = backdrop.querySelector('#visibility-icon');

    // Focus input
    input.focus();

    const closeModal = (result) => {
      backdrop.remove();
      document.removeEventListener('keydown', handleKeydown);
      resolve(result);
    };

    const showError = (message) => {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
      input.classList.add('border-red-500');
    };

    const clearError = () => {
      errorEl.classList.add('hidden');
      input.classList.remove('border-red-500');
    };

    const saveKey = () => {
      const key = input.value.trim();

      if (!key) {
        showError(t('settings.addKeyModal.keyRequired'));
        return;
      }

      // Format validation
      if (!validateKeyFormat(provider.id, key)) {
        showError(t('settings.addKeyModal.invalidFormat', { prefix: provider.keyPrefix }));
        return;
      }

      closeModal({ saved: true, key });
    };

    // Event handlers
    backdrop.querySelector('[data-action="close"]').addEventListener('click', () => {
      closeModal({ saved: false });
    });

    backdrop.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      closeModal({ saved: false });
    });

    backdrop.querySelector('[data-action="save"]').addEventListener('click', saveKey);

    backdrop.querySelector('[data-action="toggle-visibility"]').addEventListener('click', () => {
      if (input.type === 'password') {
        input.type = 'text';
        visibilityIcon.textContent = 'visibility_off';
      } else {
        input.type = 'password';
        visibilityIcon.textContent = 'visibility';
      }
    });

    // Clear error on input
    input.addEventListener('input', clearError);

    // Save on Enter
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveKey();
      }
    });

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal({ saved: false });
      }
    });

    // Keyboard handling
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal({ saved: false });
      }
    };
    document.addEventListener('keydown', handleKeydown);
  });
}
