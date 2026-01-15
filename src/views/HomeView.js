import BaseView from './BaseView.js';
import { updateNetworkIndicator, isOnline } from '../utils/network.js';
import { getQuizHistory, getQuizSession } from '../services/quiz-service.js';
import { isConnected, startAuth } from '../services/auth-service.js';
import state from '../core/state.js';
import { showConnectModal } from '../components/ConnectModal.js';
import { t } from '../core/i18n.js';
import { formatRelativeDate } from '../utils/formatters.js';
import { createModeToggle } from '../components/ModeToggle.js';
import { getCurrentMode } from '../services/theme-manager.js';

export default class HomeView extends BaseView {
  async render() {
    // Fetch recent sessions via quiz service
    const sessions = await getQuizHistory(10);

    // Generate the recent topics HTML
    const recentTopicsHTML = this.generateRecentTopicsHTML(sessions);

    this.setHTML(`
      <div class="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
        <!-- Top App Bar -->
        <div class="flex items-center p-4 pb-2 justify-between bg-background-light dark:bg-background-dark">
          <h1 class="text-text-light dark:text-text-dark text-lg font-bold leading-tight tracking-[-0.015em]">Saberloop</h1>
          <div class="flex items-center gap-2">
            <div id="modeToggleContainer"></div>
            <button class="flex cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-transparent text-text-light dark:text-text-dark hover:bg-primary/10">
              <span class="material-symbols-outlined text-2xl">notifications</span>
            </button>
          </div>
        </div>

        <div class="flex-grow px-4">
          <!-- Headline Text -->
          <h2 data-testid="welcome-heading" class="text-text-light dark:text-text-dark tracking-light text-[32px] font-bold leading-tight text-left pb-3 pt-6">${t('home.welcome')}</h2>

        <!-- Offline Banner -->
        <div id="offlineBanner" class="bg-orange-500/20 border
        border-orange-500 rounded-xl p-4 mb-3 ${isOnline() ? 'hidden' : ''}">      
          <div class="flex items-center gap-2 text-orange-500">
            <span class="material-symbols-outlined">wifi_off</span>
            <span class="text-sm font-medium">${t('offline.banner')}</span>
          </div>
        </div>

        <!-- Start New Quiz Button -->
        <div class="py-3">
          <button
            id="startQuizBtn"
            class="flex cursor-pointer items-center justify-center
        overflow-hidden rounded-xl h-14 px-5 bg-primary text-white text-base
        font-bold leading-normal tracking-[0.015em] w-full shadow-lg
        shadow-primary/30 hover:bg-primary/90 disabled:bg-gray-400
        disabled:cursor-not-allowed disabled:shadow-none">
            <span class="truncate">${t('home.startQuiz')}</span>
          </button>
        </div>

        <!-- Party Buttons (visible in Party mode only) -->
        <div id="partyButtonsContainer" class="hidden py-3">
          <div class="flex gap-3">
            <button
              id="createPartyBtn"
              data-testid="create-party-btn"
              class="flex-1 flex cursor-pointer items-center justify-center gap-2
                     overflow-hidden rounded-xl h-14 px-5 bg-purple-500 text-white text-base
                     font-bold leading-normal tracking-[0.015em] shadow-lg
                     shadow-purple-500/30 hover:bg-purple-600">
              <span class="material-symbols-outlined">celebration</span>
              <span class="truncate">${t('party.create')}</span>
            </button>
            <button
              id="joinPartyBtn"
              data-testid="join-party-btn"
              class="flex-1 flex cursor-pointer items-center justify-center gap-2
                     overflow-hidden rounded-xl h-14 px-5 bg-purple-500/20 text-purple-500
                     border-2 border-purple-500 text-base font-bold leading-normal
                     tracking-[0.015em] hover:bg-purple-500/30">
              <span class="material-symbols-outlined">group_add</span>
              <span class="truncate">${t('party.join')}</span>
            </button>
          </div>
        </div>

          <!-- Section Header -->
          <h3 data-testid="recent-topics-heading" class="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-8">${t('home.recentTopics')}</h3>

          <!-- List Items Container -->
          <div id="recentTopicsList" class="flex flex-col gap-3">
            ${recentTopicsHTML}
          </div>
        </div>

        <!-- Spacer for bottom nav -->
        <div class="h-24"></div>

        <!-- Bottom Navigation Bar -->
        <div class="fixed bottom-0 left-0 right-0 h-20 bg-background-light dark:bg-background-dark backdrop-blur-md border-t border-border-light dark:border-border-dark">
          <div class="flex justify-around items-center h-full max-w-lg mx-auto px-4">
            <a class="flex flex-col items-center justify-center text-primary gap-1" href="#/">
              <span class="material-symbols-outlined text-2xl fill">home</span>
              <span id="networkStatusDot" class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background-light dark:border-background-dark"></span>
              <span class="text-xs font-bold">${t('common.home')}</span>
            </a>
            <a class="flex flex-col items-center justify-center text-subtext-light dark:text-subtext-dark hover:text-primary gap-1" href="#/history">
              <span class="material-symbols-outlined text-2xl">category</span>
              <span class="text-xs font-medium">${t('common.topics')}</span>
            </a>
            <a class="flex flex-col items-center justify-center text-subtext-light dark:text-subtext-dark hover:text-primary gap-1" href="#/settings">
              <span class="material-symbols-outlined text-2xl">settings</span>
              <span class="text-xs font-medium">${t('common.settings')}</span>
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

    // Show party buttons when in party mode
    this.updatePartyButtonsVisibility();

    this.attachListeners();

    // Sync network indicator with current state
    updateNetworkIndicator();    
  }

  generateRecentTopicsHTML(sessions) {
    // Handle empty state
    if (!sessions || sessions.length === 0) {
      return `
        <div data-testid="no-quizzes-message" class="flex flex-col items-center justify-center py-8 text-center">
          <span class="material-symbols-outlined text-5xl text-subtext-light
  dark:text-subtext-dark mb-3">quiz</span>
          <p class="text-subtext-light dark:text-subtext-dark text-base">${t('home.noQuizzes')}</p>
          <p class="text-subtext-light dark:text-subtext-dark text-sm">${t('home.startFirst')}</p>
        </div>
      `;
    }

    // Generate HTML for each session
      return sessions.map(session => {
        const hasScore = session.score !== null && session.score !== undefined;
        const percentage = hasScore
          ? Math.round((session.score / session.totalQuestions) * 100)
          : null;
        const scoreDisplay = hasScore
          ? `${session.score}/${session.totalQuestions}`
          : `--/${session.totalQuestions}`;

        // Choose color based on score (gray for unplayed)
        let colorClass = 'text-subtext-light bg-gray-500';
        if (hasScore) {
          if (percentage >= 80) {
            colorClass = 'text-green-500 bg-green-500';
          } else if (percentage >= 50) {
            colorClass = 'text-orange-500 bg-orange-500';
          } else {
            colorClass = 'text-red-500 bg-red-500';
          }
        }

      // Format the date - handle unplayed quizzes (timestamp = 0)
      let dateStr;
      if (!session.timestamp || session.timestamp === 0) {
        dateStr = hasScore ? formatRelativeDate(session.timestamp) : t('home.notPlayedYet');
      } else {
        dateStr = formatRelativeDate(session.timestamp);
      }

      return `
        <div class="quiz-item flex items-center gap-4 bg-card-light dark:bg-card-dark
  rounded-xl p-4 cursor-pointer hover:opacity-80 transition-opacity"
  data-session-id="${session.id}">
          <div class="flex size-16 shrink-0 items-center justify-center
  rounded-xl ${colorClass.split(' ')[1]}">
            <span class="material-symbols-outlined text-white
  text-3xl">school</span>
          </div>
          <div class="flex flex-1 flex-col">
            <p data-testid="quiz-topic" class="text-text-light dark:text-text-dark text-base font-bold leading-normal">${session.topic}</p>
            <p data-testid="quiz-date" class="text-subtext-light dark:text-subtext-dark text-sm font-normal leading-normal">${dateStr}</p>
          </div>
          <p data-testid="quiz-score" class="${colorClass.split(' ')[0]} text-lg font-bold">${scoreDisplay}</p>
        </div>
      `;
    }).join('');
  }

  async replayQuiz(sessionId) {
    const session = await getQuizSession(sessionId);

    if (!session || !session.questions) {
      alert(t('errors.cannotReplay'));
      return;
    }

    // Set state for replay
    state.set('currentTopic', session.topic);
    state.set('currentGradeLevel', session.gradeLevel || 'middle school');
    state.set('generatedQuestions', session.questions);
    state.set('currentAnswers', []);
    state.set('replaySessionId', sessionId); 

    this.navigateTo('/quiz');
  }  

  /**
   * Update visibility of party buttons based on mode.
   */
  updatePartyButtonsVisibility() {
    const partyContainer = this.querySelector('#partyButtonsContainer');
    if (!partyContainer) return;

    // Show party buttons when mode is 'party'
    const showPartyButtons = getCurrentMode() === 'party';

    if (showPartyButtons) {
      partyContainer.classList.remove('hidden');
    } else {
      partyContainer.classList.add('hidden');
    }
  }

  attachListeners() {
    const startQuizBtn = this.querySelector('#startQuizBtn');

    this.addEventListener(startQuizBtn, 'click', async () => {
      // Check if connected to OpenRouter
      const connected = await isConnected();

      if (!connected) {
        this.navigateTo('/setup-openrouter');
        return;
      }

      this.navigateTo('/topic-input');
    });

    // Quiz item click handlers for replay
    const quizItems = document.querySelectorAll('.quiz-item');
    quizItems.forEach(item => {
      this.addEventListener(item, 'click', async () => {
        const sessionId = parseInt(/** @type {HTMLElement} */ (item).dataset.sessionId);
        await this.replayQuiz(sessionId);
      });
    });

    // Party button handlers
    const createPartyBtn = this.querySelector('#createPartyBtn');
    if (createPartyBtn) {
      this.addEventListener(createPartyBtn, 'click', () => {
        this.navigateTo('/party/create');
      });
    }

    const joinPartyBtn = this.querySelector('#joinPartyBtn');
    if (joinPartyBtn) {
      this.addEventListener(joinPartyBtn, 'click', () => {
        this.navigateTo('/party/join');
      });
    }

    // Listen for mode changes to update party buttons visibility
    window.addEventListener('modechange', () => {
      this.updatePartyButtonsVisibility();
    });
  }
}