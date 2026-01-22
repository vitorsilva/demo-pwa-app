import BaseView from './BaseView.js';
import { t } from '../core/i18n.js';

export default class ConnectionConfirmedView extends BaseView {
  constructor() {
    super();
  }

  async render() {
    this.setHTML(`
        <div class="relative flex h-auto min-h-screen w-full flex-col items-center justify-center
          bg-background-light dark:bg-background-dark overflow-x-hidden px-4">

          <!-- Success content with fade-in animation -->
          <div class="animate-fade-in flex flex-col items-center">

            <!-- Success checkmark -->
            <div class="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30
              flex items-center justify-center mb-6 animate-scale-in">
              <svg class="w-12 h-12 text-green-600 dark:text-green-400" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
            </div>

            <!-- Title -->
            <h1 data-testid="connection-confirmed-title" class="text-text-light dark:text-text-dark text-2xl font-bold mb-2">
              ${t('connection.confirmed')}
            </h1>

            <!-- Subtitle -->
            <p class="text-subtext-light dark:text-subtext-dark text-center mb-6">
              ${t('connection.allSet')}
            </p>

            <!-- Benefits list -->
            <div class="w-full max-w-xs mb-8 p-4 rounded-xl bg-card-light dark:bg-card-dark">
              <p class="text-text-light dark:text-text-dark font-medium mb-3">
                ${t('connection.freeTierIncludes')}
              </p>
              <ul class="space-y-2">
                <li class="flex items-center gap-2 text-sm text-subtext-light dark:text-subtext-dark">
                  <span class="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                  ${t('connection.limitedFreeGenerations')}
                </li>
                <li class="flex items-center gap-2 text-sm text-subtext-light dark:text-subtext-dark">
                  <span class="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                  ${t('connection.noCreditCard')}
                </li>
                <li class="flex items-center gap-2 text-sm text-subtext-light dark:text-subtext-dark">
                  <span class="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                  ${t('connection.worksOfflineSaved')}
                </li>
              </ul>
            </div>

            <!-- CTA Button -->
            <button id="start-quiz-btn" data-testid="start-quiz-btn" class="w-full max-w-xs px-6 py-3.5 rounded-xl
              bg-primary hover:bg-primary-dark text-white font-medium transition-colors
              flex items-center justify-center gap-2">
              ${t('connection.startFirstQuiz')}
              <span class="material-symbols-outlined text-xl">arrow_forward</span>
            </button>

          </div>

        </div>
      `);

    this.setupEventListeners();
  }

  setupEventListeners() {
    const startBtn = document.getElementById('start-quiz-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.navigateTo('/');
      });
    }
  }
}
