// WelcomeView - First-time user onboarding

import BaseView from './BaseView.js';
import { markWelcomeSeen } from '../features/onboarding.js';
import { t } from '../core/i18n.js';

export default class WelcomeView extends BaseView {
  async render() {
    this.setHTML(`
        <div class="flex min-h-screen flex-col bg-background-light
  dark:bg-background-dark">
          <div class="flex flex-1 flex-col items-center justify-center p-6">

            <!-- Hero Section -->
            <div class="mb-8 flex flex-col items-center">
              <img src="/app/icons/icon-192x192.png" alt="Saberloop logo" class="mb-6 h-24 w-24 rounded-3xl">
              <h1 data-testid="welcome-title" class="text-3xl font-bold text-text-light dark:text-text-dark">
                ${t('welcome.title')}
              </h1>
              <p class="mt-2 text-center text-subtext-light
  dark:text-subtext-dark">
                ${t('welcome.tagline')}
              </p>
            </div>

            <!-- Features List -->
            <div class="mb-10 w-full max-w-sm space-y-4">
              <div class="flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl
   bg-card-light dark:bg-card-dark">
                  <span class="material-symbols-outlined text-xl
  text-primary">target</span>
                </div>
                <div>
                  <p class="font-medium text-text-light
  dark:text-text-dark">${t('welcome.personalizedQuizzes')}</p>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark">${t('welcome.anyTopic')}</p>
                </div>
              </div>

              <div class="flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl
   bg-card-light dark:bg-card-dark">
                  <span class="material-symbols-outlined text-xl
  text-primary">trending_up</span>
                </div>
                <div>
                  <p class="font-medium text-text-light
  dark:text-text-dark">${t('welcome.trackProgress')}</p>
                  <p class="text-sm text-subtext-light
  dark:text-subtext-dark">${t('welcome.seeImprovement')}</p>
                </div>
              </div>

              <div class="flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl
   bg-card-light dark:bg-card-dark">
                  <span class="material-symbols-outlined text-xl
  text-primary">offline_bolt</span>
                </div>
                <div>
                  <p class="font-medium text-text-light
  dark:text-text-dark">${t('welcome.worksOffline')}</p>
                  <p class="text-sm text-subtext-light
  dark:text-subtext-dark">${t('welcome.reviewAnytime')}</p>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="w-full max-w-sm">
              <button
                id="connectBtn"
                data-testid="connect-btn"
                class="flex h-14 w-full items-center justify-center rounded-xl
  bg-primary font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90
   transition-colors"
              >
                ${t('welcome.connectToAI')}
              </button>

              <button
                id="skipBtn"
                data-testid="skip-btn"
                class="flex h-14 w-full items-center justify-center rounded-xl
  bg-card-light dark:bg-card-dark font-bold text-text-light dark:text-text-dark
  mt-3 hover:bg-border-light dark:hover:bg-border-dark transition-colors"
              >
                ${t('welcome.tryFreeQuizzes')}
              </button>
            </div>
            
          </div>
        </div>
      `);

    this.attachListeners();
  }

  attachListeners() {
    const skipBtn = this.querySelector('#skipBtn');
    this.addEventListener(skipBtn, 'click', async () => {
      await markWelcomeSeen();
      this.navigateTo('/');
    });

    const connectBtn = this.querySelector('#connectBtn');
    this.addEventListener(connectBtn, 'click', async () => {
      this.navigateTo('/setup-openrouter');
    });
  }
}
