import { logger } from '../utils/logger.js';
import { t } from '../core/i18n.js';

/**
 * Show a confirmation modal for deleting all user data
 * @param {Function} onConfirm - Callback to execute when user confirms deletion
 * @returns {Promise<boolean>} true if user confirmed and deletion succeeded, false if cancelled
 */
export function showDeleteDataModal(onConfirm) {
  return new Promise((resolve) => {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'deleteDataModal';
    backdrop.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';

    backdrop.innerHTML = `
      <div class="bg-background-light dark:bg-background-dark rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div class="flex flex-col items-center text-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
            <span class="material-symbols-outlined text-3xl text-red-500">warning</span>
          </div>

          <h2 data-testid="delete-modal-title" class="text-xl font-bold text-text-light dark:text-text-dark mb-2">
            ${t('settings.deleteDataTitle')}
          </h2>

          <p class="text-subtext-light dark:text-subtext-dark text-sm mb-4">
            ${t('settings.deleteDataDescription')}
          </p>

          <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6 w-full">
            <div class="flex items-start gap-2">
              <span class="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-lg">lightbulb</span>
              <p class="text-yellow-700 dark:text-yellow-300 text-xs text-left">
                ${t('settings.deleteDataTip')}
              </p>
            </div>
          </div>

          <button
            id="cancelDeleteBtn"
            data-testid="modal-cancel-delete-btn"
            class="w-full h-12 rounded-xl bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark font-medium hover:bg-primary/10 transition-colors mb-3"
          >
            ${t('common.cancel')}
          </button>

          <button
            id="confirmDeleteBtn"
            data-testid="modal-confirm-delete-btn"
            class="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined">delete</span>
            ${t('settings.deleteDataConfirm')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const cancelBtn = backdrop.querySelector('#cancelDeleteBtn');
    const confirmBtn = /** @type {HTMLButtonElement} */ (
      backdrop.querySelector('#confirmDeleteBtn')
    );

    // Handle cancel button
    cancelBtn.addEventListener('click', () => {
      backdrop.remove();
      resolve(false);
    });

    // Handle confirm button
    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `
        <span class="material-symbols-outlined animate-spin">progress_activity</span>
        ${t('settings.deleting')}
      `;

      try {
        await onConfirm();
        backdrop.remove();
        resolve(true);
      } catch (error) {
        logger.error('Data deletion failed in DeleteDataModal', { error: error.message });
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `
          <span class="material-symbols-outlined">delete</span>
          ${t('settings.deleteDataConfirm')}
        `;
        // Could show error toast here, but for now just re-enable button
      }
    });

    // Handle backdrop click (close modal)
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.remove();
        resolve(false);
      }
    });

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        backdrop.remove();
        document.removeEventListener('keydown', handleEscape);
        resolve(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}
