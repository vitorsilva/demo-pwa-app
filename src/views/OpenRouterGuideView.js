import BaseView from './BaseView.js';
import { startAuth } from '../services/auth-service.js';
import { t } from '../core/i18n.js';

/**
 * Step card content and display options.
 * @typedef {Object} StepCard
 * @property {number} number - Step number (1-based)
 * @property {string} title - Step title
 * @property {string} description - Step description
 * @property {string} icon - Material icon name
 * @property {boolean} [highlighted=false] - Whether to highlight this step
 * @property {string|null} [imageSrc=null] - Optional image URL
 */

export default class OpenRouterGuideView extends BaseView {
  constructor() {
    super();
  }

  async render() {
    this.setHTML(`
        <div class="relative flex h-auto min-h-screen w-full flex-col
          bg-background-light dark:bg-background-dark overflow-x-hidden">

          <!-- Header with back button -->
          <div class="sticky top-0 z-10 flex items-center p-4 pb-2
            bg-background-light dark:bg-background-dark">
            <button id="back-btn" class="p-2 -ml-2 mr-2 rounded-full
              hover:bg-card-light dark:hover:bg-card-dark transition-colors">
              <svg class="w-6 h-6 text-text-light dark:text-text-dark" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 data-testid="openrouter-guide-title" class="text-text-light dark:text-text-dark text-lg font-bold
              leading-tight tracking-[-0.015em]">${t('openrouter.setupTitle')}</h1>
          </div>

          <!-- Main content -->
          <div class="flex-grow px-4 pb-24">

            <!-- Hero Section -->
            <div class="py-6">
              <h2 class="text-text-light dark:text-text-dark text-3xl font-bold mb-3">
                ${t('openrouter.createFreeAccount')}
              </h2>
              <p class="text-subtext-light dark:text-subtext-dark text-base leading-relaxed">
                ${t('openrouter.followSteps')}
                <span class="font-semibold text-text-light dark:text-text-dark">${t('openrouter.noCreditCardRequired')}</span>
                ${t('openrouter.forFreeTier')}
              </p>
            </div>

            <!-- Free Access Info Box -->
            <div class="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div class="flex items-start gap-3">
                <span class="material-symbols-outlined text-primary text-2xl">verified_user</span>
                <div>
                  <p class="font-semibold text-text-light dark:text-text-dark mb-1">${t('openrouter.freeAccess')}</p>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark">
                    ${t('openrouter.noCreditsNeeded')}
                  </p>
                </div>
              </div>
            </div>

            <!-- Primary CTA -->
            <button id="cta-top" class="w-full py-3.5 px-6 rounded-xl font-medium
              bg-primary hover:bg-primary-dark text-white transition-colors
              flex items-center justify-center gap-2">
              ${t('openrouter.continueToOpenRouter')}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </button>

            <!-- Secondary link -->
            <p class="text-center mt-4 mb-8">
              <button id="skip-btn" class="text-subtext-light dark:text-subtext-dark
                hover:text-text-light dark:hover:text-text-dark transition-colors text-sm">
                ${t('openrouter.doItLater')}
              </button>
            </p>

            <!-- Instructions header -->
            <p class="text-subtext-light dark:text-subtext-dark text-sm mb-4">
              ${t('openrouter.seeInstructions')}
            </p>

            <!-- Step Cards -->
            <div class="space-y-4">
                ${this.renderStepCard({
                  number: 1,
                  title: t('openrouter.step1Title'),
                  description: t('openrouter.step1Desc'),
                  icon: 'how_to_reg',
                })}

                ${this.renderStepCard({
                  number: 2,
                  title: t('openrouter.step2Title'),
                  description: t('openrouter.step2Desc'),
                  icon: 'person_add',
                  imageSrc: '/app/images/onboarding/openrouter_step2_createaccount.png',
                })}

                ${this.renderStepCard({
                  number: 3,
                  title: t('openrouter.step3Title'),
                  description: t('openrouter.step3Desc'),
                  icon: 'money_off',
                  highlighted: true,
                  imageSrc: '/app/images/onboarding/openrouter_step3_freeaccount.png',
                })}

                ${this.renderStepCard({
                  number: 4,
                  title: t('openrouter.step4Title'),
                  description: t('openrouter.step4Desc'),
                  icon: 'verified',
                  imageSrc: '/app/images/onboarding/openrouter_step4_authorization.png',
                })}
            </div>

          </div>

          <!-- Fixed Bottom CTA -->
          <div class="fixed bottom-0 left-0 right-0 p-4
            bg-background-light dark:bg-background-dark border-t
            border-border-light dark:border-border-dark">
            <button id="cta-bottom" class="w-full py-3.5 px-6 rounded-xl font-medium
              bg-primary hover:bg-primary-dark text-white transition-colors
              flex items-center justify-center gap-2">
              ${t('openrouter.continueToOpenRouter')}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </button>
          </div>

        </div>
      `);

    this.setupEventListeners();
  }

  /**
   * Render a step card
   * @param {StepCard} step - Step card data
   */
  renderStepCard(step) {
    const { number, title, description, icon, highlighted = false, imageSrc = null } = step;
    const highlightClass = highlighted
      ? 'border-2 border-primary ring-4 ring-primary/10'
      : 'border border-border-light dark:border-border-dark';

    const numberClass = highlighted ? 'bg-primary text-white' : 'bg-primary/20 text-primary';

    const warningBox = highlighted
      ? `
        <div class="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20
          border-l-4 border-amber-500">
          <p class="text-sm text-amber-800 dark:text-amber-200 font-medium">
            ${t('openrouter.importantNoPayment')}
          </p>
        </div>
      `
      : '';

    // Image block (only if image provided)
    const imageBlock = imageSrc
      ? `<img src="${imageSrc}" alt="Step ${number}" class="mt-4 w-full rounded-lg border border-border-light dark:border-border-dark" />`
      : '';

    return `
        <div class="p-4 rounded-xl bg-card-light dark:bg-card-dark ${highlightClass}">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-8 h-8 rounded-full ${numberClass}
              flex items-center justify-center font-bold text-sm">
              ${number}
            </div>
            <div class="flex-grow">
              <div class="flex items-center gap-2 mb-1">
                <span class="material-symbols-outlined text-primary text-xl">${icon}</span>
                <h3 class="font-semibold text-text-light dark:text-text-dark">${title}</h3>
              </div>
              <p class="text-sm text-subtext-light dark:text-subtext-dark leading-relaxed">
                ${description}
              </p>
              ${warningBox}
              ${imageBlock}
            </div>
          </div>
        </div>
      `;
  }

  setupEventListeners() {
    // Back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }

    // CTA buttons (both top and bottom)
    const ctaTop = document.getElementById('cta-top');
    const ctaBottom = document.getElementById('cta-bottom');

    const handleContinue = () => {
      startAuth();
    };

    if (ctaTop) ctaTop.addEventListener('click', handleContinue);
    if (ctaBottom) ctaBottom.addEventListener('click', handleContinue);

    // Skip button
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        this.navigateTo('/');
      });
    }
  }
}
