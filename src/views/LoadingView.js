import BaseView from './BaseView.js';
import state from '../core/state.js';
import { generateQuestions } from '../services/quiz-service.js';
import { getApiKey } from '../services/auth-service.js';
import { logger } from '../utils/logger.js';
import { t, getCurrentLanguage } from '../core/i18n.js';
import { getSetting } from '../core/settings.js';
import { loadAd, resetForNavigation } from '../utils/adManager.js';

// Default timing constants (can be overridden via window.LOADING_VIEW_CONFIG for testing)
const getConfig = () => {
  const defaults = {
    ESTIMATED_DURATION_SECONDS: 60,
    SHOW_COUNTDOWN_AFTER_SECONDS: 20
  };
  return /** @type {*} */ (window).LOADING_VIEW_CONFIG || defaults;
};

export default class LoadingView extends BaseView {
  constructor() {
    super();
    this.loadingMessages = [
      t('loading.preparing'),
      t('loading.consulting'),
      t('loading.crafting'),
      t('loading.almostReady')
    ];
    this.extendedMessages = [
      t('loading.teachingNotEasy'),
      t('loading.thinkingHard')
    ];
    this.currentMessageIndex = 0;
    this.messageInterval = null;
    this.countdownInterval = null;
    this.elapsedSeconds = 0;
    this.extendedMessagesAdded = false;
  }

  async render() {
    const topic = state.get('currentTopic');
    const gradeLevel = state.get('currentGradeLevel');

    if (!topic) {
      this.navigateTo('/topic-input');
      return;
    }

    // Check if offline
    const isOffline = !navigator.onLine;

    this.setHTML(`
      <div class="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark items-center justify-center">
        <!-- Loading Content -->
        <div class="flex flex-col items-center gap-6 p-8 text-center">

          <!-- Animated Spinner -->
          <div class="relative">
            <div class="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
            <div class="absolute top-0 left-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>

          <!-- Topic Display -->
          <div class="mt-4">
            <p class="text-sm text-subtext-light dark:text-subtext-darkuppercase tracking-wider">
              ${t('loading.generatingFor')}
            </p>
            <h1 data-testid="loading-topic" class="text-2xl font-bold text-text-light dark:text-text-dark mt-2">
              ${this.escapeHtml(topic)}
            </h1>
            <p class="text-sm text-subtext-light dark:text-subtext-dark mt-1">
              ${t('loading.level', { level: this.getTranslatedGradeLevel(gradeLevel) || t('topicInput.middleSchool') })}
            </p>
          </div>

          <!-- Dynamic Message -->
          <p id="loadingMessage" data-testid="loading-message" class="text-base text-primary font-medium animate-pulse">
            ${isOffline ? t('loading.offlineAppear') : this.loadingMessages[0]}
          </p>

          <!-- Countdown Timer (hidden initially, shown after delay) -->
          <p id="countdownText" class="text-sm text-subtext-light dark:text-subtext-dark hidden">
          </p>

          <!-- Progress Dots -->
          <div class="flex gap-2 mt-4">
            <span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0ms"></span>
            <span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 150ms"></span>
            <span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 300ms"></span>
          </div>

          <!-- Ad Container (shown during loading) -->
          <div id="quiz-loading-ad" class="ad-container mt-6"></div>

          <!-- Offline Warning -->
          ${isOffline ? `
            <div class="mt-4 p-4 bg-warning/10 border border-warning rounded-lg max-w-sm">
              <p class="text-sm text-warning">
                ${t('loading.offlineWarning')}
              </p>
            </div>
          ` : ''}

        </div>

        <!-- Cancel Button -->
        <div class="absolute bottom-8 left-0 right-0 flex justify-center">
          <button id="cancelBtn" class="px-6 py-2 text-sm text-subtext-light dark:text-subtext-dark hover:text-error transition-colors">
            ${t('common.cancel')}
          </button>
        </div>
      </div>
    `);

    this.attachListeners();

    if (!isOffline) {
      this.startMessageRotation();
      this.startCountdownTimer();
      this.startQuizGeneration(topic, gradeLevel);

      // Load ad during quiz generation (user is waiting anyway)
      loadAd('quiz-loading-ad', 'quizLoading');
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Translate raw grade level value to localized display text.
   * The grade level is stored as English value ('middle school', 'high school', 'college')
   * but needs to be displayed in the user's selected language.
   * @param {string} gradeLevel - Raw grade level value (e.g., 'middle school')
   * @returns {string} Translated grade level text
   */
  getTranslatedGradeLevel(gradeLevel) {
    const gradeLevelMap = {
      'middle school': t('topicInput.middleSchool'),
      'high school': t('topicInput.highSchool'),
      'college': t('topicInput.college')
    };
    return gradeLevelMap[gradeLevel] || gradeLevel;
  }

  startMessageRotation() {
    this.messageInterval = setInterval(() => {
      this.currentMessageIndex = (this.currentMessageIndex + 1) % this.loadingMessages.length;
      const messageEl = this.querySelector('#loadingMessage');
      if (messageEl) {
        messageEl.textContent = this.loadingMessages[this.currentMessageIndex];
      }
    }, 2000);
  }

  startCountdownTimer() {
    const config = getConfig();
    this.elapsedSeconds = 0;
    this.extendedMessagesAdded = false;

    this.countdownInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.updateCountdown();
    }, 1000);
  }

  updateCountdown() {
    const config = getConfig();
    const countdownEl = this.querySelector('#countdownText');
    if (!countdownEl) return;

    const { ESTIMATED_DURATION_SECONDS, SHOW_COUNTDOWN_AFTER_SECONDS } = config;

    // Don't show countdown until after the initial delay
    if (this.elapsedSeconds < SHOW_COUNTDOWN_AFTER_SECONDS) {
      return;
    }

    // Show the countdown element
    countdownEl.classList.remove('hidden');

    // Calculate remaining time
    const remaining = ESTIMATED_DURATION_SECONDS - this.elapsedSeconds;

    if (remaining > 0) {
      countdownEl.textContent = t('loading.secondsRemaining', { count: remaining });
    } else {
      countdownEl.textContent = t('loading.almostDone');

      // Add extended messages to rotation (only once)
      if (!this.extendedMessagesAdded) {
        this.extendedMessagesAdded = true;
        this.loadingMessages = [...this.loadingMessages, ...this.extendedMessages];
      }
    }
  }

  async startQuizGeneration(topic, gradeLevel) {
    try {
      // Get API key via auth service
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error(t('errors.notConnected'));
      }

      // Build options for question generation
      const questionCount = parseInt(getSetting('questionsPerQuiz'), 10) || 5;
      const options = {
        language: getCurrentLanguage(),
        questionCount
      };

      // If continuing on topic, pass previous questions to exclude
      const continueChain = state.getContinueChain();
      if (continueChain && continueChain.topic === topic) {
        options.previousQuestions = continueChain.previousQuestions;
      }

      const result = await generateQuestions(topic, gradeLevel, apiKey, options);

      // Store questions, language, and usage in state for QuizView
      state.set('generatedQuestions', result.questions);
      state.set('quizLanguage', result.language);
      state.set('quizModel', result.model);
      state.set('quizUsage', result.usage);

      // Clear interval before navigating
      this.cleanup();

      // Navigate to quiz
      this.navigateTo('/quiz');

    } catch (error) {
      logger.error('Failed to generate questions', { error: error.message });
      this.cleanup();

      // Show specific error message to help user diagnose the issue
      alert(error.message || t('errors.failedToGenerate'));
      this.navigateTo('/topic-input');
    }
  }

  attachListeners() {
    const cancelBtn = this.querySelector('#cancelBtn');
    if (cancelBtn) {
      this.addEventListener(cancelBtn, 'click', () => {
        if (confirm(t('loading.confirmCancel'))) {
          this.cleanup();
          this.navigateTo('/topic-input');
        }
      });
    }
  }

  cleanup() {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
      this.messageInterval = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    // Reset ad state for next navigation
    resetForNavigation();
  }

  destroy() {
    this.cleanup();
    super.destroy();
  }
}
