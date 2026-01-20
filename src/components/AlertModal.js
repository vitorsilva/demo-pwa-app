import { t } from '../core/i18n.js';

/**
 * Icon configuration for different alert types
 */
const ICONS = {
  error: { icon: 'error', bgColor: 'bg-red-500/10', textColor: 'text-red-500' },
  warning: { icon: 'warning', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-500' },
  info: { icon: 'info', bgColor: 'bg-blue-500/10', textColor: 'text-blue-500' },
  success: { icon: 'check_circle', bgColor: 'bg-green-500/10', textColor: 'text-green-500' },
};

/**
 * Show an alert modal with a single OK button
 * @param {Object} options
 * @param {string} options.title - Modal title (i18n key or string)
 * @param {string} options.message - Modal message (i18n key or string)
 * @param {string} [options.icon='error'] - Icon type: 'error', 'warning', 'info', 'success'
 * @param {string} [options.buttonText] - Custom button text (default: t('common.ok'))
 * @returns {Promise<void>} Resolves when user clicks OK or closes modal
 */
export function showAlertModal({ title, message, icon = 'error', buttonText }) {
  return new Promise((resolve) => {
    const iconConfig = ICONS[icon] || ICONS.error;
    const okText = buttonText || t('common.ok');

    const backdrop = document.createElement('div');
    backdrop.id = 'alertModal';
    backdrop.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';

    backdrop.innerHTML = `
      <div class="bg-background-light dark:bg-background-dark rounded-2xl p-6 max-w-sm w-full shadow-xl"
           data-testid="alert-modal"
           role="alertdialog"
           aria-modal="true"
           aria-labelledby="alert-title"
           aria-describedby="alert-message">
        <div class="flex flex-col items-center text-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full ${iconConfig.bgColor} mb-4">
            <span class="material-symbols-outlined text-3xl ${iconConfig.textColor}">${iconConfig.icon}</span>
          </div>

          <h2 id="alert-title" class="text-xl font-bold text-text-light dark:text-text-dark mb-2">
            ${title}
          </h2>

          <p id="alert-message" class="text-subtext-light dark:text-subtext-dark text-sm mb-6">
            ${message}
          </p>

          <button id="alertOkBtn" data-testid="alert-ok-btn"
            class="w-full h-12 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition-colors">
            ${okText}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const okBtn = backdrop.querySelector('#alertOkBtn');

    // Focus the OK button for accessibility
    okBtn.focus();

    const closeModal = () => {
      backdrop.remove();
      document.removeEventListener('keydown', handleKeydown);
      resolve();
    };

    // OK button click
    okBtn.addEventListener('click', closeModal);

    // Backdrop click to close
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal();
      }
    });

    // Keyboard handling
    const handleKeydown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleKeydown);
  });
}
