import BaseView from './BaseView.js';
import { t } from '../core/i18n.js';

export default class HelpView extends BaseView {
  constructor() {
    super();
  }

  render() {
    this.setHTML(`
      <div class="relative flex h-auto min-h-screen w-full flex-col
bg-background-light dark:bg-background-dark overflow-x-hidden">
        <!-- Top App Bar -->
        <div class="flex items-center p-4 pb-2 gap-3
bg-background-light dark:bg-background-dark">
          <a href="#/settings" class="text-text-light dark:text-text-dark">
            <span class="material-symbols-outlined">arrow_back</span>
          </a>
          <h1 data-testid="help-title" class="text-text-light dark:text-text-dark text-lg font-bold
leading-tight tracking-[-0.015em] flex-1">${t('common.help')}</h1>
        </div>

        <div class="flex-grow px-4 pb-8">
          <!-- FAQ Section -->
          <h2 class="text-text-light dark:text-text-dark text-[22px] font-bold
leading-tight tracking-[-0.015em] pb-3 pt-4">${t('help.faq')}</h2>

          <div class="flex flex-col gap-3" id="faqContainer">
            <!-- FAQ items will be rendered here -->
          </div>

          <!-- Contact Section -->
          <h2 class="text-text-light dark:text-text-dark text-[22px] font-bold
leading-tight tracking-[-0.015em] pb-3 pt-8">${t('help.needMoreHelp')}</h2>

          <div class="flex flex-col gap-3">
            <a href="https://github.com/vitorsilva/demo-pwa-app/issues"
target="_blank" rel="noopener noreferrer"
class="bg-card-light dark:bg-card-dark rounded-xl p-4 flex items-center
justify-between hover:bg-primary/10 transition-colors">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-text-light
dark:text-text-dark">bug_report</span>
                <div>
                  <p class="text-text-light dark:text-text-dark text-base
font-medium">${t('help.reportIssue')}</p>
                  <p class="text-subtext-light dark:text-subtext-dark text-sm">
${t('help.openGithubIssue')}</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-subtext-light
dark:text-subtext-dark">open_in_new</span>
            </a>
          </div>
        </div>
      </div>
    `);

    this.renderFAQ();
    this.bindEvents();
  }

  renderFAQ() {
    const faqData = [
      {
        question: t('help.faq1Question'),
        answer: t('help.faq1Answer')
      },
      {
        question: t('help.faq2Question'),
        answer: t('help.faq2Answer')
      },
      {
        question: t('help.faq3Question'),
        answer: t('help.faq3Answer')
      },
      {
        question: t('help.faq4Question'),
        answer: t('help.faq4Answer')
      },
      {
        question: t('help.faq5Question'),
        answer: t('help.faq5Answer')
      }
    ];

    const container = this.querySelector('#faqContainer');

    container.innerHTML = faqData.map((faq, index) => `
      <div class="bg-card-light dark:bg-card-dark rounded-xl overflow-hidden">
        <button class="faq-toggle w-full p-4 flex items-center justify-between
text-left" data-index="${index}">
          <p class="text-text-light dark:text-text-dark text-base font-medium
pr-4">${faq.question}</p>
          <span class="material-symbols-outlined text-subtext-light
dark:text-subtext-dark transition-transform duration-200 faq-icon"
data-index="${index}">expand_more</span>
        </button>
        <div class="faq-answer hidden px-4 pb-4" data-index="${index}">
          <p class="text-subtext-light dark:text-subtext-dark text-sm
leading-relaxed">${faq.answer}</p>
        </div>
      </div>
    `).join('');
  }

  bindEvents() {
    const toggles = this.appContainer.querySelectorAll('.faq-toggle');

    toggles.forEach(toggle => {
      this.addEventListener(toggle, 'click', () => {
        const index = /** @type {HTMLElement} */ (toggle).dataset.index;
        const answer = this.querySelector(`.faq-answer[data-index="${index}"]`);
        const icon = this.querySelector(`.faq-icon[data-index="${index}"]`);

        // Toggle visibility
        answer.classList.toggle('hidden');

        // Rotate icon
        if (answer.classList.contains('hidden')) {
          icon.style.transform = 'rotate(0deg)';
        } else {
          icon.style.transform = 'rotate(180deg)';
        }
      });
    });
  }
}
