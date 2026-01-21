import { logger } from '../utils/logger.js';
import { t } from '../core/i18n.js';

/**
 * Show a bottom sheet modal with explanation for an incorrect answer.
 * Supports progressive loading: shows cached explanation instantly while loading personalized feedback.
 * @param {Object} options - Modal options
 * @param {string} options.question - The question text
 * @param {string} options.userAnswer - User's incorrect answer
 * @param {string} options.correctAnswer - The correct answer
 * @param {string} [options.cachedExplanation] - Pre-cached rightAnswerExplanation (optional)
 * @param {Function} options.onFetchExplanation - Async function to fetch explanation (returns {rightAnswerExplanation, wrongAnswerExplanation} or just wrongAnswerExplanation string if cached)
 * @param {boolean} [options.isOffline] - Whether the app is currently offline
 * @param {boolean} [options.hasApiKey] - Whether user has an API key connected
 * @returns {Promise<void>} Resolves when modal is closed
 */
export function showExplanationModal({ question, userAnswer, correctAnswer, cachedExplanation, onFetchExplanation, isOffline = false, hasApiKey = true }) {
  return new Promise((resolve) => {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'explanationModal';
    backdrop.className = 'fixed inset-0 bg-black/50 z-50 flex items-end justify-center';

    // Extract just the answer text (remove A), B), etc. prefix if present)
    const cleanUserAnswer = userAnswer.replace(/^[A-D]\)\s*/, '');
    const cleanCorrectAnswer = correctAnswer.replace(/^[A-D]\)\s*/, '');

    // Helper function to render wrong answer section content
    const getWrongAnswerContent = () => {
      if (isOffline) {
        return '';
      }
      if (hasApiKey) {
        return `
              <div id="wrongAnswerLoading" class="flex items-center gap-2 text-subtext-light dark:text-subtext-dark">
                <span class="material-symbols-outlined animate-spin">progress_activity</span>
                <span>${t('explanation.loadingPersonalized')}</span>
              </div>
              <p id="wrongAnswerText" class="text-subtext-light dark:text-subtext-dark leading-relaxed hidden"></p>
            `;
      }
      return `
            <div id="connectToAI" class="flex items-center gap-2 text-subtext-light dark:text-subtext-dark">
              <span class="material-symbols-outlined text-base">cloud</span>
              <span>${t('explanation.connectToAI')}</span>
            </div>
          `;
    };

    backdrop.innerHTML = `
      <div class="bg-card-light dark:bg-card-dark rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto transform transition-transform duration-300 translate-y-full" id="explanationSheet">
        <!-- Drag Handle -->
        <div class="flex justify-center pt-3 pb-2">
          <div class="w-12 h-1 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
        </div>

        <!-- INCORRECT Badge -->
        <div class="flex justify-center mb-4">
          <span class="bg-error/20 text-error px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <span class="material-symbols-outlined text-base">error</span>
            ${t('explanation.incorrect')}
          </span>
        </div>

        <!-- Question -->
        <h2 data-testid="explanation-question" class="text-text-light dark:text-text-dark text-xl font-bold text-center px-6 mb-6">${question}</h2>

        <!-- Answer Cards Side by Side -->
        <div class="flex gap-3 px-4 mb-6">
          <!-- User's Answer -->
          <div class="flex-1 bg-error/10 rounded-xl p-4">
            <div class="flex items-center gap-2 text-error text-sm mb-1">
              <span class="material-symbols-outlined text-base">close</span>
              ${t('explanation.youSelected')}
            </div>
            <p class="text-text-light dark:text-text-dark text-lg font-semibold">${cleanUserAnswer}</p>
          </div>
          <!-- Correct Answer -->
          <div class="flex-1 bg-success/10 rounded-xl p-4 border border-success/30">
            <div class="flex items-center justify-between text-success text-sm mb-1">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-base">check</span>
                ${t('explanation.correctAnswer')}
              </span>
              <span class="material-symbols-outlined">check_circle</span>
            </div>
            <p class="text-text-light dark:text-text-dark text-lg font-semibold">${cleanCorrectAnswer}</p>
          </div>
        </div>

        <!-- Divider -->
        <hr class="border-border-light dark:border-border-dark mx-4 mb-6">

        <!-- Explanation Section -->
        <div class="px-4 mb-6" id="explanationContent">
          <div class="flex items-center gap-2 mb-3">
            <span class="material-symbols-outlined text-primary">lightbulb</span>
            <h3 class="text-text-light dark:text-text-dark font-bold text-lg">${t('explanation.title')}</h3>
          </div>

          <!-- Right answer explanation (cached or loading) -->
          <div id="rightAnswerSection">
            ${cachedExplanation ? `
              <p id="rightAnswerText" class="text-subtext-light dark:text-subtext-dark leading-relaxed">${cachedExplanation}</p>
            ` : `
              <div id="rightAnswerLoading" class="flex items-center gap-2 text-subtext-light dark:text-subtext-dark">
                <span class="material-symbols-outlined animate-spin">progress_activity</span>
                <span>${t('explanation.generating')}</span>
              </div>
              <p id="rightAnswerText" class="text-subtext-light dark:text-subtext-dark leading-relaxed hidden"></p>
            `}
          </div>

          <!-- Separator (shown when we have/expect both parts) -->
          <hr id="explanationSeparator" class="border-border-light dark:border-border-dark my-4 ${isOffline && !hasApiKey ? 'hidden' : ''}">

          <!-- Wrong answer explanation (personalized, loading) -->
          <div id="wrongAnswerSection" class="${isOffline ? 'hidden' : ''}">
            ${getWrongAnswerContent()}
          </div>

          <!-- Error state (hidden initially) -->
          <div id="explanationError" class="hidden">
            <p class="text-error mb-3">${t('explanation.couldntLoad')}</p>
            <button id="retryBtn" class="text-primary font-medium hover:underline">${t('explanation.tryAgain')}</button>
          </div>
        </div>

        <!-- Got it Button -->
        <div class="px-4 pb-8">
          <button id="gotItBtn" data-testid="got-it-btn" class="w-full bg-primary rounded-xl py-4 font-bold text-white flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
            ${t('explanation.gotIt')}
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    // Animate sheet in
    const sheet = backdrop.querySelector('#explanationSheet');
    requestAnimationFrame(() => {
      sheet.classList.remove('translate-y-full');
      sheet.classList.add('translate-y-0');
    });

    // Function to close modal
    const closeModal = () => {
      sheet.classList.remove('translate-y-0');
      sheet.classList.add('translate-y-full');
      setTimeout(() => {
        backdrop.remove();
        resolve();
      }, 300);
    };

    // Function to fetch and display explanation
    const fetchExplanation = async () => {
      const rightAnswerLoadingEl = backdrop.querySelector('#rightAnswerLoading');
      const rightAnswerTextEl = backdrop.querySelector('#rightAnswerText');
      const wrongAnswerLoadingEl = backdrop.querySelector('#wrongAnswerLoading');
      const wrongAnswerTextEl = backdrop.querySelector('#wrongAnswerText');
      const wrongAnswerSectionEl = backdrop.querySelector('#wrongAnswerSection');
      const separatorEl = backdrop.querySelector('#explanationSeparator');
      const errorEl = backdrop.querySelector('#explanationError');

      // If offline and we have cache, we're done (no fetch needed)
      if (isOffline && cachedExplanation) {
        if (separatorEl) separatorEl.classList.add('hidden');
        return;
      }

      // If offline and no cache, show error
      if (isOffline && !cachedExplanation) {
        errorEl.classList.remove('hidden');
        return;
      }

      // If no API key, we can't fetch personalized explanation
      if (!hasApiKey) {
        return;
      }

      try {
        const result = await onFetchExplanation();

        // Handle structured response (full fetch)
        if (typeof result === 'object' && result.rightAnswerExplanation !== undefined) {
          // Update right answer section
          if (rightAnswerLoadingEl) rightAnswerLoadingEl.classList.add('hidden');
          if (rightAnswerTextEl) {
            rightAnswerTextEl.textContent = result.rightAnswerExplanation;
            rightAnswerTextEl.classList.remove('hidden');
          }

          // Update wrong answer section
          if (wrongAnswerLoadingEl) wrongAnswerLoadingEl.classList.add('hidden');
          if (wrongAnswerTextEl && result.wrongAnswerExplanation) {
            wrongAnswerTextEl.textContent = result.wrongAnswerExplanation;
            wrongAnswerTextEl.classList.remove('hidden');
          } else if (wrongAnswerSectionEl && !result.wrongAnswerExplanation) {
            // Hide wrong answer section if no personalized feedback
            wrongAnswerSectionEl.classList.add('hidden');
            if (separatorEl) separatorEl.classList.add('hidden');
          }
        }
        // Handle string response (partial fetch - only wrong answer)
        else if (typeof result === 'string') {
          if (wrongAnswerLoadingEl) wrongAnswerLoadingEl.classList.add('hidden');
          if (wrongAnswerTextEl) {
            wrongAnswerTextEl.textContent = result;
            wrongAnswerTextEl.classList.remove('hidden');
          }
        }
      } catch (error) {
        logger.error('Failed to fetch explanation', { error: error.message, code: error.code });

        // Hide loading states
        if (rightAnswerLoadingEl) rightAnswerLoadingEl.classList.add('hidden');
        if (wrongAnswerLoadingEl) wrongAnswerLoadingEl.classList.add('hidden');

        // Determine error message and action based on error code
        let errorMessage = t('explanation.couldntLoad');
        let actionButton = `<button id="retryBtn" class="text-primary font-medium hover:underline ml-2">${t('explanation.tryAgain')}</button>`;

        if (error.code === 'RATE_LIMIT') {
          errorMessage = t('explanation.rateLimitError');
          actionButton = ''; // No action for rate limit - just wait
        } else if (error.code === 'INVALID_API_KEY') {
          errorMessage = t('explanation.invalidKeyError');
          actionButton = `<button id="goToSettingsBtn" class="text-primary font-medium hover:underline ml-2">${t('explanation.goToSettings')}</button>`;
        }

        // If we have cached explanation, only show error for personalized part
        if (cachedExplanation) {
          if (wrongAnswerSectionEl) {
            wrongAnswerSectionEl.innerHTML = `
              <div class="flex items-center gap-2 text-subtext-light dark:text-subtext-dark flex-wrap">
                <span class="material-symbols-outlined text-base text-warning">warning</span>
                <span>${errorMessage}</span>
                ${actionButton}
              </div>
            `;
            // Re-attach retry listener
            const newRetryBtn = wrongAnswerSectionEl.querySelector('#retryBtn');
            if (newRetryBtn) {
              newRetryBtn.addEventListener('click', fetchExplanation);
            }
            // Attach Settings button listener
            const settingsBtn = wrongAnswerSectionEl.querySelector('#goToSettingsBtn');
            if (settingsBtn) {
              settingsBtn.addEventListener('click', () => {
                closeModal();
                window.location.hash = '#/settings';
              });
            }
          }
        } else {
          // No cache, show full error with specific message
          errorEl.innerHTML = `
            <p class="text-error mb-3">${errorMessage}</p>
            ${actionButton}
          `;
          errorEl.classList.remove('hidden');

          // Re-attach retry listener
          const newRetryBtn = errorEl.querySelector('#retryBtn');
          if (newRetryBtn) {
            newRetryBtn.addEventListener('click', fetchExplanation);
          }
          // Attach Settings button listener
          const settingsBtn = errorEl.querySelector('#goToSettingsBtn');
          if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
              closeModal();
              window.location.hash = '#/settings';
            });
          }
        }
      }
    };

    // Start fetching explanation (unless offline with cache)
    if (!(isOffline && cachedExplanation)) {
      fetchExplanation();
    }

    // Handle "Got it" button
    const gotItBtn = backdrop.querySelector('#gotItBtn');
    gotItBtn.addEventListener('click', closeModal);

    // Handle retry button
    const retryBtn = backdrop.querySelector('#retryBtn');
    retryBtn.addEventListener('click', fetchExplanation);

    // Handle backdrop click (close modal)
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal();
      }
    });

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}
