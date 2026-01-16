  import BaseView from './BaseView.js';
  import { getSettings, saveSetting } from '../core/settings.js';
  import { APP_VERSION, BUILD_DATE } from '../version.js';
  import { isConnected, disconnect, getApiKey, getCreditsBalance } from '../services/auth-service.js';
  import { t, changeLanguage, getCurrentLanguage, SUPPORTED_LANGUAGES } from '../core/i18n.js';
  import { getSelectedModel, getModelDisplayName, getAvailableModels, saveSelectedModel } from '../services/model-service.js';
  import { getStorageBreakdown } from '../utils/storage.js';
  import { showDeleteDataModal } from '../components/DeleteDataModal.js';
  import { deleteAllUserData } from '../services/data-service.js';
  import { createModeToggle } from '../components/ModeToggle.js';

  export default class SettingsView extends BaseView {
    constructor() {
      super();
    }

    async render() {
      this.setHTML(`
        <div class="relative flex min-h-screen w-full flex-col
  bg-background-light dark:bg-background-dark overflow-x-hidden">
          <!-- Top App Bar -->
          <div class="flex items-center p-4 pb-2 justify-between
  bg-background-light dark:bg-background-dark">
            <h1 data-testid="settings-title" class="text-text-light dark:text-text-dark text-lg font-bold
  leading-tight tracking-[-0.015em]">${t('common.settings')}</h1>
            <div id="modeToggleContainer"></div>
          </div>

          <div class="flex-grow px-4">
 <!-- Preferences Section -->
  <h2 class="text-text-light dark:text-text-dark text-[22px] font-bold
  leading-tight tracking-[-0.015em] pb-3 pt-4">${t('settings.preferences')}</h2>

  <div class="flex flex-col gap-4">
    <!-- Screen Name -->
    <label class="flex flex-col">
      <p class="text-base font-medium pb-2 text-text-light
  dark:text-text-dark">${t('settings.screenName')}</p>
      <input
        type="text"
        id="screenName"
        maxlength="20"
        placeholder="${t('settings.screenNamePlaceholder')}"
        data-testid="screen-name-input"
        class="form-input flex w-full rounded-lg h-14 p-4
  text-base font-normal leading-normal bg-card-light dark:bg-card-dark
  border border-border-light dark:border-border-dark text-text-light
  dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-primary
  placeholder:text-subtext-light/50"
      />
    </label>

    <!-- Default Grade Level -->
    <label class="flex flex-col">
      <p class="text-base font-medium pb-2 text-text-light
  dark:text-text-dark">${t('settings.defaultGradeLevel')}</p>
      <select id="defaultGradeLevel" data-testid="grade-level-select" class="form-select flex w-full rounded-lg
  h-14 p-4 text-base font-normal leading-normal bg-card-light dark:bg-card-dark
  border border-border-light dark:border-border-dark text-text-light
  dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-primary">
        <option value="elementary">${t('settings.elementary')}</option>
        <option value="middle school">${t('topicInput.middleSchool')}</option>
        <option value="high school">${t('topicInput.highSchool')}</option>
        <option value="college">${t('topicInput.college')}</option>
      </select>
    </label>

    <!-- Default Questions Per Quiz -->
    <label class="flex flex-col">
      <p class="text-base font-medium pb-2 text-text-light
  dark:text-text-dark">${t('settings.defaultQuestions')}</p>
      <select id="questionsPerQuiz" data-testid="questions-per-quiz-select" class="form-select flex w-full rounded-lg
  h-14 p-4 text-base font-normal leading-normal bg-card-light dark:bg-card-dark
  border border-border-light dark:border-border-dark text-text-light
  dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-primary">
        <option value="5">${t('settings.nQuestions', { count: 5 })}</option>
        <option value="10">${t('settings.nQuestions', { count: 10 })}</option>
        <option value="15">${t('settings.nQuestions', { count: 15 })}</option>
      </select>
    </label>

    <!-- Default Difficulty -->
    <label class="flex flex-col opacity-50">
      <p class="text-base font-medium pb-2 text-text-light
  dark:text-text-dark">${t('settings.defaultDifficulty')}</p>
      <select id="difficulty" disabled class="form-select flex w-full rounded-lg h-14 p-4
   text-base font-normal leading-normal bg-card-light dark:bg-card-dark border
  border-border-light dark:border-border-dark text-text-light
  dark:text-text-dark cursor-not-allowed">
        <option value="easy">${t('settings.easy')}</option>
        <option value="medium">${t('settings.medium')}</option>
        <option value="hard">${t('settings.hard')}</option>
        <option value="mixed" selected>${t('settings.mixed')}</option>
      </select>
    </label>

    <!-- Language -->
    <label class="flex flex-col">
      <p class="text-base font-medium pb-2 text-text-light
  dark:text-text-dark">${t('settings.language')}</p>
      <select id="languageSelect" data-testid="language-select" class="form-select flex w-full rounded-lg
  h-14 p-4 text-base font-normal leading-normal bg-card-light dark:bg-card-dark
  border border-border-light dark:border-border-dark text-text-light
  dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-primary">
        ${this.renderLanguageOptions()}
      </select>
    </label>
  </div>

               <!-- Connection to AI Provider Section -->
              <h2 class="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight
   tracking-[-0.015em] pb-3 pt-8">${t('settings.connection')}</h2>

              <div id="accountSection" class="flex flex-col gap-3">
                <!-- Will be populated by loadAccountStatus() -->
              </div>

              <!-- Data Management Section -->
              <h2 class="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight
   tracking-[-0.015em] pb-3 pt-8">${t('settings.dataManagement')}</h2>

              <div class="flex flex-col gap-3">
                <!-- Storage Usage Card -->
                <div class="bg-card-light dark:bg-card-dark rounded-xl p-4">
                  <div class="flex items-center gap-3 mb-3">
                    <span class="material-symbols-outlined text-primary">storage</span>
                    <p class="text-text-light dark:text-text-dark text-base font-medium">${t('settings.storageUsage')}</p>
                  </div>
                  <div id="storageBreakdown" class="flex flex-col gap-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-subtext-light dark:text-subtext-dark">${t('settings.settingsData')}</span>
                      <span data-testid="storage-settings" class="text-text-light dark:text-text-dark">...</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-subtext-light dark:text-subtext-dark">${t('settings.quizzesData')}</span>
                      <span data-testid="storage-quizzes" class="text-text-light dark:text-text-dark">...</span>
                    </div>
                    <div class="flex justify-between border-t border-border-light dark:border-border-dark pt-2 mt-1">
                      <span class="text-subtext-light dark:text-subtext-dark font-medium">${t('settings.totalStorage')}</span>
                      <span data-testid="storage-total" class="text-text-light dark:text-text-dark font-medium">...</span>
                    </div>
                  </div>
                </div>

                <!-- Delete All Data Button (placeholder - will be wired in Phase 3) -->
                <div id="deleteDataSection" class="bg-card-light dark:bg-card-dark rounded-xl p-4">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="material-symbols-outlined text-red-500">delete_forever</span>
                    <div>
                      <p class="text-text-light dark:text-text-dark text-base font-medium">${t('settings.deleteAllData')}</p>
                      <p class="text-subtext-light dark:text-subtext-dark text-sm">${t('settings.deleteAllDataDesc')}</p>
                    </div>
                  </div>
                  <button id="deleteAllDataBtn" data-testid="delete-all-data-btn"
                    class="w-full mt-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg p-3 flex items-center justify-center gap-2 transition-colors">
                    <span class="material-symbols-outlined">delete</span>
                    <span class="font-medium">${t('settings.deleteAllData')}</span>
                  </button>
                </div>
              </div>

           <!-- About Section -->
            <h2 class="text-text-light dark:text-text-dark text-[22px] font-bold
   leading-tight tracking-[-0.015em] pb-3 pt-8">${t('settings.about')}</h2>

            <div class="flex flex-col gap-3">
              <!-- Help Link -->
              <a href="#/help" class="bg-card-light dark:bg-card-dark rounded-xl p-4
  flex items-center justify-between hover:bg-primary/10 transition-colors">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-text-light
  dark:text-text-dark">help</span>
                  <p class="text-text-light dark:text-text-dark text-base
  font-medium">${t('settings.helpFaq')}</p>
                </div>
                <span class="material-symbols-outlined text-subtext-light
  dark:text-subtext-dark">chevron_right</span>
              </a>

              <!-- Version Card -->
              <div class="bg-card-light dark:bg-card-dark rounded-xl p-4">
                <div class="flex items-center justify-between">
                  <p class="text-text-light dark:text-text-dark text-base
  font-medium">${t('settings.version')}</p>
                  <p data-testid="app-version" class="text-subtext-light dark:text-subtext-dark
  text-base">${APP_VERSION}</p>
                </div>
              </div>

              <!-- GitHub Link -->
              <a href="https://github.com/vitorsilva/demo-pwa-app"
  target="_blank" rel="noopener noreferrer" class="bg-card-light
  dark:bg-card-dark rounded-xl p-4 flex items-center justify-between
  hover:bg-primary/10">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-text-light
  dark:text-text-dark">code</span>
                  <p class="text-text-light dark:text-text-dark text-base
  font-medium">${t('settings.viewOnGithub')}</p>
                </div>
                <span class="material-symbols-outlined text-subtext-light
  dark:text-subtext-dark">open_in_new</span>
              </a>

              <!-- Credits -->
              <div class="bg-card-light dark:bg-card-dark rounded-xl p-4">
                <p class="text-text-light dark:text-text-dark text-base
  font-medium mb-2">${t('settings.builtWith')}</p>
                <p class="text-subtext-light dark:text-subtext-dark
  text-sm">Claude AI by Anthropic</p>
                <p class="text-subtext-light dark:text-subtext-dark
  text-sm">Claude Code</p>
              </div>
            </div>

            <!-- Support Section -->
            <h2 class="text-text-light dark:text-text-dark text-[22px] font-bold
   leading-tight tracking-[-0.015em] pb-3 pt-8">${t('settings.support.title')}</h2>

            <div class="flex flex-col gap-3">
              <div class="bg-card-light dark:bg-card-dark rounded-xl p-4 text-center">
                <p class="text-subtext-light dark:text-subtext-dark text-sm mb-4">
                  ${t('settings.support.message')}
                </p>
                <a href="https://liberapay.com/vitormrsilva"
                  target="_blank" rel="noopener noreferrer"
                  data-testid="donation-link"
                  class="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500
                  text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
                  <span>💝</span>
                  <span>${t('settings.support.button')}</span>
                </a>
                <p class="text-subtext-light dark:text-subtext-dark text-xs mt-3 italic">
                  ${t('settings.support.note')}
                </p>
              </div>
            </div>

          <!-- Spacer for bottom nav -->
          <div class="h-24"></div>

          <!-- Bottom Navigation Bar -->
          <div class="fixed bottom-0 left-0 right-0 h-20 bg-background-light
  dark:bg-background-dark backdrop-blur-md border-t border-border-light
  dark:border-border-dark">
            <div class="flex justify-around items-center h-full max-w-lg mx-auto
   px-4">
              <a class="flex flex-col items-center justify-center
  text-subtext-light dark:text-subtext-dark hover:text-primary gap-1" href="#/">
                <span class="material-symbols-outlined text-2xl">home</span>
                <span class="text-xs font-medium">${t('common.home')}</span>
              </a>
              <a class="flex flex-col items-center justify-center
  text-subtext-light dark:text-subtext-dark hover:text-primary gap-1"
  href="#/history">
                <span class="material-symbols-outlined text-2xl">category</span>
                <span class="text-xs font-medium">${t('common.topics')}</span>
              </a>
              <a class="flex flex-col items-center justify-center text-primary
  gap-1" href="#/settings">
                <span class="material-symbols-outlined text-2xl
  fill">settings</span>
                <span class="text-xs font-bold">${t('common.settings')}</span>
              </a>
            </div>
          </div>
        </div>
      `);

      // Mount mode toggle
      const toggleContainer = this.querySelector('#modeToggleContainer');
      if (toggleContainer) {
        toggleContainer.appendChild(createModeToggle());
      }

      // Load saved settings into form fields
      this.loadSettings();

      // Load account connection status
      await this.loadAccountStatus();

      // Load storage breakdown (async, non-blocking)
      this.loadStorageBreakdown();

      this.bindEvents();
    }

    async loadStorageBreakdown() {
      try {
        const breakdown = await getStorageBreakdown();

        const settingsEl = this.querySelector('[data-testid="storage-settings"]');
        const quizzesEl = this.querySelector('[data-testid="storage-quizzes"]');
        const totalEl = this.querySelector('[data-testid="storage-total"]');

        if (settingsEl) settingsEl.textContent = breakdown.settings;
        if (quizzesEl) quizzesEl.textContent = breakdown.quizzes;
        if (totalEl) totalEl.textContent = breakdown.total;
      } catch (error) {
        // On error, show "--" instead of "..."
        const settingsEl = this.querySelector('[data-testid="storage-settings"]');
        const quizzesEl = this.querySelector('[data-testid="storage-quizzes"]');
        const totalEl = this.querySelector('[data-testid="storage-total"]');

        if (settingsEl) settingsEl.textContent = '--';
        if (quizzesEl) quizzesEl.textContent = '--';
        if (totalEl) totalEl.textContent = '--';
      }
    }

    renderLanguageOptions() {
      const currentLang = getCurrentLanguage();
      return SUPPORTED_LANGUAGES.map(lang =>
        `<option value="${lang.code}" ${lang.code === currentLang ? 'selected' : ''}>
          ${lang.flag} ${lang.name}
        </option>`
      ).join('');
    }

    loadSettings() {
      const settings = getSettings();

      // Set each dropdown to its saved value
      const screenNameInput = this.querySelector('#screenName');
      const gradeSelect = this.querySelector('#defaultGradeLevel');
      const questionsSelect = this.querySelector('#questionsPerQuiz');
      const difficultySelect = this.querySelector('#difficulty');
      const languageSelect = this.querySelector('#languageSelect');

      if (screenNameInput) screenNameInput.value = settings.screenName || '';
      if (gradeSelect) gradeSelect.value = settings.defaultGradeLevel;
      if (questionsSelect) questionsSelect.value = settings.questionsPerQuiz;
      if (difficultySelect) difficultySelect.value = settings.difficulty;
      if (languageSelect) languageSelect.value = getCurrentLanguage();
    }

      async loadAccountStatus() {
        const accountSection = this.querySelector('#accountSection');
        const connected = await isConnected();

        if (connected) {
          const currentModel = getSelectedModel();
          const modelName = getModelDisplayName(currentModel);

          // Fetch credits balance
          const credits = await getCreditsBalance();
          let creditsHtml = '';
          if (credits) {
            // Paid account with credits
            creditsHtml = `
            <!-- Credits Balance -->
            <a href="https://openrouter.ai/activity" target="_blank" rel="noopener noreferrer"
              class="bg-card-light dark:bg-card-dark rounded-xl p-4 flex items-center justify-between hover:bg-primary/10 transition-colors">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary">account_balance_wallet</span>
                <div>
                  <p class="text-text-light dark:text-text-dark text-base font-medium">${t('settings.creditsBalance')}</p>
                  <p data-testid="credits-balance" class="text-subtext-light dark:text-subtext-dark text-sm">${credits.balanceFormatted} ${t('settings.remaining')}</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-subtext-light dark:text-subtext-dark">open_in_new</span>
            </a>`;
          } else {
            // Free tier account (no credits)
            creditsHtml = `
            <!-- Free Tier Status -->
            <a href="https://openrouter.ai/activity" target="_blank" rel="noopener noreferrer"
              class="bg-card-light dark:bg-card-dark rounded-xl p-4 flex items-center justify-between hover:bg-primary/10 transition-colors">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary">account_balance_wallet</span>
                <div>
                  <p class="text-text-light dark:text-text-dark text-base font-medium">${t('settings.freeTierStatus')}</p>
                  <p data-testid="credits-balance" class="text-subtext-light dark:text-subtext-dark text-sm">${t('settings.freeTierLimit')}</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-subtext-light dark:text-subtext-dark">open_in_new</span>
            </a>`;
          }

          accountSection.innerHTML = `
            <div class="bg-card-light dark:bg-card-dark rounded-xl p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-green-500">check_circle</span>
                  <div>
                    <p class="text-text-light dark:text-text-dark text-base
  font-medium">${t('settings.openrouterConnected')}</p>
                    <p class="text-subtext-light dark:text-subtext-dark text-sm">${t('settings.freeTier')}</p>
                  </div>
                </div>
              </div>
            </div>

            ${creditsHtml}

            <!-- Model Selection -->
            <div class="bg-card-light dark:bg-card-dark rounded-xl p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-primary">smart_toy</span>
                  <div>
                    <p class="text-text-light dark:text-text-dark text-base font-medium">${t('settings.currentModel')}</p>
                    <p data-testid="current-model-name" class="text-subtext-light dark:text-subtext-dark text-sm">${modelName}</p>
                  </div>
                </div>
                <button id="changeModelBtn" class="text-primary hover:text-primary/80 text-sm font-medium transition-colors">
                  ${t('settings.changeModel')}
                </button>
              </div>
              <div id="modelSelectorContainer" class="hidden mt-4">
                <!-- Model selector will be inserted here -->
              </div>
            </div>

            <button id="disconnectBtn" class="bg-red-500/10 hover:bg-red-500/20 text-red-500
  rounded-xl p-4 flex items-center justify-center gap-2 transition-colors">
              <span class="material-symbols-outlined">logout</span>
              <span class="font-medium">${t('settings.disconnect')}</span>
            </button>
          `;

          // Bind disconnect button
          const disconnectBtn = this.querySelector('#disconnectBtn');
          this.addEventListener(disconnectBtn, 'click', () => this.handleDisconnect());

          // Bind change model button
          const changeModelBtn = this.querySelector('#changeModelBtn');
          this.addEventListener(changeModelBtn, 'click', () => this.toggleModelSelector());
        } else {
          accountSection.innerHTML = `
            <div class="bg-card-light dark:bg-card-dark rounded-xl p-4">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-yellow-500">warning</span>
                <div>
                  <p class="text-text-light dark:text-text-dark text-base font-medium">${t('settings.notConnected')}</p>
                  <p class="text-subtext-light dark:text-subtext-dark text-sm">${t('settings.connectToGenerate')}</p>
                </div>
              </div>
            </div>
            <a href="#/setup-openrouter"
              class="bg-primary hover:bg-primary/90 text-white rounded-xl p-4 flex items-center justify-center gap-2 transition-colors">
              <span class="material-symbols-outlined">link</span>
              <span class="font-medium">${t('settings.connectWithOpenRouter')}</span>
            </a>
          `;
        }
      }

      async handleDisconnect() {
        if (confirm(t('settings.confirmDisconnect'))) {
          await disconnect();
          // Reload the app to show WelcomeView
          window.location.href = window.location.origin + '/#/';
          window.location.reload();
        }
      }


    bindEvents() {
      const screenNameInput = this.querySelector('#screenName');
      const gradeSelect = this.querySelector('#defaultGradeLevel');
      const questionsSelect = this.querySelector('#questionsPerQuiz');
      const difficultySelect = this.querySelector('#difficulty');
      const languageSelect = this.querySelector('#languageSelect');

      // Save screen name on blur (when user finishes typing)
      this.addEventListener(screenNameInput, 'blur', (e) => {
        saveSetting('screenName', e.target.value.trim());
      });

      this.addEventListener(gradeSelect, 'change', (e) => {
        saveSetting('defaultGradeLevel', e.target.value);
      });

      this.addEventListener(questionsSelect, 'change', (e) => {
        saveSetting('questionsPerQuiz', e.target.value);
      });

      this.addEventListener(difficultySelect, 'change', (e) => {
        saveSetting('difficulty', e.target.value);
      });

      this.addEventListener(languageSelect, 'change', async (e) => {
        const newLang = e.target.value;
        await changeLanguage(newLang);
        // Re-render to apply new language
        await this.render();
      });

      // Delete all data button
      const deleteBtn = this.querySelector('#deleteAllDataBtn');
      if (deleteBtn) {
        this.addEventListener(deleteBtn, 'click', () => this.handleDeleteAllData());
      }
    }

    async handleDeleteAllData() {
      const confirmed = await showDeleteDataModal(async () => {
        await deleteAllUserData();
      });

      if (confirmed) {
        // Show success toast
        this.showSuccessToast(t('settings.deleteDataSuccess'));

        // Re-render to update storage display
        await this.render();
      }
    }

    showSuccessToast(message) {
      // Create toast element
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in';
      toast.innerHTML = `
        <span class="material-symbols-outlined">check_circle</span>
        <span>${message}</span>
      `;

      document.body.appendChild(toast);

      // Remove after 3 seconds
      setTimeout(() => {
        toast.classList.add('animate-fade-out');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }

    async toggleModelSelector() {
      const container = this.querySelector('#modelSelectorContainer');
      const changeBtn = this.querySelector('#changeModelBtn');

      if (container.classList.contains('hidden')) {
        // Show selector and fetch models
        container.classList.remove('hidden');
        changeBtn.textContent = t('common.cancel');

        // Show loading state
        container.innerHTML = `
          <div class="flex items-center justify-center py-4">
            <span class="material-symbols-outlined animate-spin text-primary">sync</span>
            <span class="ml-2 text-subtext-light dark:text-subtext-dark">${t('settings.loadingModels')}</span>
          </div>
        `;

        try {
          const apiKey = await getApiKey();
          const models = await getAvailableModels(apiKey);
          this.renderModelSelector(models);
        } catch (error) {
          container.innerHTML = `
            <div class="text-red-500 text-sm py-2">
              ${t('settings.errorLoadingModels')}
            </div>
          `;
        }
      } else {
        // Hide selector
        container.classList.add('hidden');
        container.innerHTML = '';
        changeBtn.textContent = t('settings.changeModel');
      }
    }

    renderModelSelector(models) {
      const container = this.querySelector('#modelSelectorContainer');
      const currentModel = getSelectedModel();

      container.innerHTML = `
        <div class="border-t border-border-light dark:border-border-dark pt-4">
          <p class="text-sm text-subtext-light dark:text-subtext-dark mb-3">${t('settings.selectModel')}</p>
          <div class="flex flex-col gap-2 max-h-64 overflow-y-auto">
            ${models.map(model => `
              <label class="flex items-center gap-3 p-3 rounded-lg cursor-pointer
                ${model.id === currentModel ? 'bg-primary/10 border border-primary' : 'bg-background-light dark:bg-background-dark hover:bg-primary/5'}">
                <input type="radio" name="modelSelect" value="${model.id}"
                  ${model.id === currentModel ? 'checked' : ''}
                  class="w-4 h-4 text-primary focus:ring-primary">
                <div class="flex-1 min-w-0">
                  <p class="text-text-light dark:text-text-dark text-sm font-medium truncate">${model.name}</p>
                  ${model.contextLength ? `<p class="text-subtext-light dark:text-subtext-dark text-xs">${t('settings.contextLength', { length: Math.round(model.contextLength / 1000) + 'K' })}</p>` : ''}
                </div>
              </label>
            `).join('')}
          </div>
        </div>
      `;

      // Bind radio change events
      const radios = container.querySelectorAll('input[name="modelSelect"]');
      radios.forEach(radio => {
        this.addEventListener(radio, 'change', (e) => this.handleModelSelection(e.target.value));
      });
    }

    async handleModelSelection(modelId) {
      saveSelectedModel(modelId);

      // Update the displayed model name
      const modelNameEl = this.querySelector('[data-testid="current-model-name"]');
      if (modelNameEl) {
        modelNameEl.textContent = getModelDisplayName(modelId);
      }

      // Close the selector
      const container = this.querySelector('#modelSelectorContainer');
      const changeBtn = this.querySelector('#changeModelBtn');
      container.classList.add('hidden');
      container.innerHTML = '';
      changeBtn.textContent = t('settings.changeModel');
    }

  }