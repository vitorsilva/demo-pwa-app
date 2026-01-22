import { logger } from '../utils/logger.js';
import { t } from '../core/i18n.js';

/**
 * Collect all explanation DOM elements from the modal.
 * @param {HTMLElement} backdrop - Modal backdrop element
 * @returns {Object} Object containing all DOM elements
 */
function getExplanationElements(backdrop) {
  return {
    rightAnswerLoading: backdrop.querySelector('#rightAnswerLoading'),
    rightAnswerText: backdrop.querySelector('#rightAnswerText'),
    wrongAnswerLoading: backdrop.querySelector('#wrongAnswerLoading'),
    wrongAnswerText: backdrop.querySelector('#wrongAnswerText'),
    wrongAnswerSection: backdrop.querySelector('#wrongAnswerSection'),
    separator: backdrop.querySelector('#explanationSeparator'),
    error: backdrop.querySelector('#explanationError'),
  };
}

/**
 * Update UI with successful explanation result.
 * @param {Object|string} result - API response (object with both explanations, or string for wrong answer only)
 * @param {Object} elements - DOM elements from getExplanationElements
 */
function updateExplanationUI(result, elements) {
  // Handle structured response (full fetch)
  if (typeof result === 'object' && result.rightAnswerExplanation !== undefined) {
    // Update right answer section
    if (elements.rightAnswerLoading) elements.rightAnswerLoading.classList.add('hidden');
    if (elements.rightAnswerText) {
      elements.rightAnswerText.textContent = result.rightAnswerExplanation;
      elements.rightAnswerText.classList.remove('hidden');
    }

    // Update wrong answer section
    if (elements.wrongAnswerLoading) elements.wrongAnswerLoading.classList.add('hidden');
    if (elements.wrongAnswerText && result.wrongAnswerExplanation) {
      elements.wrongAnswerText.textContent = result.wrongAnswerExplanation;
      elements.wrongAnswerText.classList.remove('hidden');
    } else if (elements.wrongAnswerSection && !result.wrongAnswerExplanation) {
      elements.wrongAnswerSection.classList.add('hidden');
      if (elements.separator) elements.separator.classList.add('hidden');
    }
    return;
  }

  // Handle string response (partial fetch - only wrong answer)
  if (typeof result === 'string') {
    if (elements.wrongAnswerLoading) elements.wrongAnswerLoading.classList.add('hidden');
    if (elements.wrongAnswerText) {
      elements.wrongAnswerText.textContent = result;
      elements.wrongAnswerText.classList.remove('hidden');
    }
  }
}

/**
 * Show error UI based on error type and cache state.
 * @param {Error} error - The error that occurred
 * @param {Object} elements - DOM elements from getExplanationElements
 * @param {Object} options - Configuration options
 * @param {boolean} options.hasCachedExplanation - Whether we have cached data
 * @param {Function} options.onRetry - Callback for retry button
 * @param {Function} options.onGoToSettings - Callback for settings button
 */
function showExplanationError(error, elements, options) {
  const { hasCachedExplanation, onRetry, onGoToSettings } = options;

  // Hide loading states
  if (elements.rightAnswerLoading) elements.rightAnswerLoading.classList.add('hidden');
  if (elements.wrongAnswerLoading) elements.wrongAnswerLoading.classList.add('hidden');

  // Determine error message and action based on error code
  let errorMessage = t('explanation.couldntLoad');
  let actionButton = `<button id="retryBtn" class="text-primary font-medium hover:underline ml-2">${t('explanation.tryAgain')}</button>`;

  if (error.code === 'RATE_LIMIT') {
    errorMessage = t('explanation.rateLimitError');
    actionButton = '';
  } else if (error.code === 'INVALID_API_KEY') {
    errorMessage = t('explanation.invalidKeyError');
    actionButton = `<button id="goToSettingsBtn" class="text-primary font-medium hover:underline ml-2">${t('explanation.goToSettings')}</button>`;
  }

  // Choose where to show error based on cache state
  const targetEl = hasCachedExplanation ? elements.wrongAnswerSection : elements.error;
  if (!targetEl) return;

  if (hasCachedExplanation) {
    targetEl.innerHTML = `
      <div class="flex items-center gap-2 text-subtext-light dark:text-subtext-dark flex-wrap">
        <span class="material-symbols-outlined text-base text-warning">warning</span>
        <span>${errorMessage}</span>
        ${actionButton}
      </div>
    `;
  } else {
    targetEl.innerHTML = `
      <p class="text-error mb-3">${errorMessage}</p>
      ${actionButton}
    `;
    targetEl.classList.remove('hidden');
  }

  // Attach event listeners
  const retryBtn = targetEl.querySelector('#retryBtn');
  if (retryBtn) retryBtn.addEventListener('click', onRetry);

  const settingsBtn = targetEl.querySelector('#goToSettingsBtn');
  if (settingsBtn) settingsBtn.addEventListener('click', onGoToSettings);
}

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
export function showExplanationModal({
  question,
  userAnswer,
  correctAnswer,
  cachedExplanation,
  onFetchExplanation,
  isOffline = false,
  hasApiKey = true,
}) {
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
            ${
              cachedExplanation
                ? `
              <p id="rightAnswerText" class="text-subtext-light dark:text-subtext-dark leading-relaxed">${cachedExplanation}</p>
            `
                : `
              <div id="rightAnswerLoading" class="flex items-center gap-2 text-subtext-light dark:text-subtext-dark">
                <span class="material-symbols-outlined animate-spin">progress_activity</span>
                <span>${t('explanation.generating')}</span>
              </div>
              <p id="rightAnswerText" class="text-subtext-light dark:text-subtext-dark leading-relaxed hidden"></p>
            `
            }
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
      const elements = getExplanationElements(backdrop);

      // Guard: offline with cache - nothing to fetch
      if (isOffline && cachedExplanation) {
        if (elements.separator) elements.separator.classList.add('hidden');
        return;
      }

      // Guard: offline without cache - show error
      if (isOffline && !cachedExplanation) {
        elements.error.classList.remove('hidden');
        return;
      }

      // Guard: no API key - can't fetch
      if (!hasApiKey) {
        return;
      }

      try {
        const result = await onFetchExplanation();
        updateExplanationUI(result, elements);
      } catch (error) {
        logger.error('Failed to fetch explanation', { error: error.message, code: error.code });
        showExplanationError(error, elements, {
          hasCachedExplanation: !!cachedExplanation,
          onRetry: fetchExplanation,
          onGoToSettings: () => {
            closeModal();
            window.location.hash = '#/settings';
          },
        });
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
