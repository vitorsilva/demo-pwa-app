import { t } from '../core/i18n.js';

/**
 * Icon configuration for different confirm types
 */
const ICONS = {
  error: { icon: 'error', bgColor: 'bg-red-500/10', textColor: 'text-red-500' },
  warning: { icon: 'warning', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-500' },
  info: { icon: 'info', bgColor: 'bg-blue-500/10', textColor: 'text-blue-500' },
  success: { icon: 'check_circle', bgColor: 'bg-green-500/10', textColor: 'text-green-500' },
};

/**
 * Show a confirmation modal with Cancel/Confirm buttons
 * @param {Object} options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {string} [options.icon='warning'] - Icon type: 'error', 'warning', 'info', 'success'
 * @param {string} [options.confirmText] - Confirm button text (default: t('common.confirm'))
 * @param {string} [options.cancelText] - Cancel button text (default: t('common.cancel'))
 * @param {boolean} [options.destructive=false] - If true, confirm button is red
 * @returns {Promise<boolean>} true if confirmed, false if cancelled
 */
export function showConfirmModal({
  title,
  message,
  icon = 'warning',
  confirmText,
  cancelText,
  destructive = false,
}) {
  return new Promise((resolve) => {
    const iconConfig = ICONS[icon] || ICONS.warning;
    const confirmBtnText = confirmText || t('common.confirm');
    const cancelBtnText = cancelText || t('common.cancel');

    // Button styles based on destructive flag
    const confirmBtnClass = destructive
      ? 'bg-red-500 hover:bg-red-600 text-white'
      : 'bg-primary hover:bg-primary-hover text-white';

    const backdrop = document.createElement('div');
    backdrop.id = 'confirmModal';
    backdrop.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';

    backdrop.innerHTML = `
      <div class="bg-background-light dark:bg-background-dark rounded-2xl p-6 max-w-sm w-full shadow-xl"
           data-testid="confirm-modal"
           role="dialog"
           aria-modal="true"
           aria-labelledby="confirm-title"
           aria-describedby="confirm-message">
        <div class="flex flex-col items-center text-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full ${iconConfig.bgColor} mb-4">
            <span class="material-symbols-outlined text-3xl ${iconConfig.textColor}">${iconConfig.icon}</span>
          </div>

          <h2 id="confirm-title" class="text-xl font-bold text-text-light dark:text-text-dark mb-2">
            ${title}
          </h2>

          <p id="confirm-message" class="text-subtext-light dark:text-subtext-dark text-sm mb-6">
            ${message}
          </p>

          <button id="confirmCancelBtn" data-testid="confirm-cancel-btn"
            class="w-full h-12 rounded-xl bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark font-medium hover:bg-primary/10 transition-colors mb-3">
            ${cancelBtnText}
          </button>

          <button id="confirmOkBtn" data-testid="confirm-ok-btn"
            class="w-full h-12 rounded-xl ${confirmBtnClass} font-bold transition-colors">
            ${confirmBtnText}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const cancelBtn = backdrop.querySelector('#confirmCancelBtn');
    const confirmBtn = backdrop.querySelector('#confirmOkBtn');

    // Focus the cancel button for safety (non-destructive default)
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
