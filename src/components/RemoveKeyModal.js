/**
 * Remove Key Modal Component
 * Confirmation modal for removing API keys from LLM providers
 */

import { t } from '../core/i18n.js';

/**
 * Show the Remove Key confirmation modal
 * @param {Object} provider - Provider configuration object
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 */
export function showRemoveKeyModal(provider) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.id = 'removeKeyModal';
    backdrop.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';

    backdrop.innerHTML = `
      <div class="bg-background-light dark:bg-background-dark rounded-2xl p-6 max-w-sm w-full shadow-xl"
           data-testid="remove-key-modal"
           role="dialog"
           aria-modal="true"
           aria-labelledby="remove-key-title"
           aria-describedby="remove-key-message">

        <div class="flex flex-col items-center text-center">
          <!-- Warning Icon -->
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
            <span class="material-symbols-outlined text-3xl text-red-500">delete</span>
          </div>

          <!-- Title -->
          <h2 id="remove-key-title" class="text-xl font-bold text-text-light dark:text-text-dark mb-2">
            ${t('settings.removeKeyModal.title', { provider: provider.name })}
          </h2>

          <!-- Message -->
          <p id="remove-key-message" class="text-subtext-light dark:text-subtext-dark text-sm mb-6">
            ${t('settings.removeKeyModal.confirm', { provider: provider.name })}
          </p>

          <!-- Cancel Button -->
          <button id="removeKeyCancelBtn" data-testid="remove-key-cancel-btn"
            class="w-full h-12 rounded-xl bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark font-medium hover:bg-primary/10 transition-colors mb-3">
            ${t('settings.removeKeyModal.cancel')}
          </button>

          <!-- Remove Button -->
          <button id="removeKeyConfirmBtn" data-testid="confirm-remove"
            class="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors">
            ${t('settings.removeKeyModal.remove')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const cancelBtn = backdrop.querySelector('#removeKeyCancelBtn');
    const confirmBtn = backdrop.querySelector('#removeKeyConfirmBtn');

    // Focus the cancel button for safety
    cancelBtn.focus();

    const closeModal = (result) => {
      backdrop.remove();
      document.removeEventListener('keydown', handleKeydown);
      resolve(result);
    };

    // Cancel button click
    cancelBtn.addEventListener('click', () => closeModal(false));

    // Confirm button click
    confirmBtn.addEventListener('click', () => closeModal(true));

    // Backdrop click to close (treated as cancel)
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(false);
      }
    });

    // Keyboard handling
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal(false);
      }
    };
    document.addEventListener('keydown', handleKeydown);
  });
}
