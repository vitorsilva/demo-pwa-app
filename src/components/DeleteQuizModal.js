import { t } from '../core/i18n.js';

/**
 * Show a confirmation modal for deleting a single quiz
 * @param {string} topic - Quiz topic name to display
 * @returns {Promise<boolean>} true if confirmed, false if cancelled
 */
export function showDeleteQuizModal(topic) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.id = 'deleteQuizModal';
    backdrop.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';

    backdrop.innerHTML = `
      <div class="bg-background-light dark:bg-background-dark rounded-2xl p-6 max-w-sm w-full shadow-xl"
           data-testid="delete-quiz-modal">
        <div class="flex flex-col items-center text-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
            <span class="material-symbols-outlined text-3xl text-red-500">delete</span>
          </div>

          <h2 class="text-xl font-bold text-text-light dark:text-text-dark mb-2">
            ${t('history.deleteQuizConfirm')}
          </h2>

          <p class="text-subtext-light dark:text-subtext-dark text-sm mb-6">
            ${t('history.deleteQuizDescription', { topic })}
          </p>

          <button id="cancelDeleteQuizBtn"
            class="w-full h-12 rounded-xl bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark font-medium hover:bg-primary/10 transition-colors mb-3">
            ${t('common.cancel')}
          </button>

          <button id="confirmDeleteQuizBtn" data-testid="confirm-delete-btn"
            class="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors flex items-center justify-center gap-2">
            <span class="material-symbols-outlined">delete</span>
            ${t('history.deleteQuiz')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const cancelBtn = backdrop.querySelector('#cancelDeleteQuizBtn');
    const confirmBtn = backdrop.querySelector('#confirmDeleteQuizBtn');

    // Cancel button
    cancelBtn.addEventListener('click', () => {
      backdrop.remove();
      resolve(false);
    });

    // Confirm button
    confirmBtn.addEventListener('click', () => {
      backdrop.remove();
      resolve(true);
    });

    // Backdrop click to close
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.remove();
        resolve(false);
      }
    });

    // Escape key to close
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
