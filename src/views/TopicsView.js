 import BaseView from './BaseView.js';
  import { getQuizHistory, getQuizSession, deleteQuiz } from '../services/quiz-service.js';
  import state from '../core/state.js';
  import { t } from '../core/i18n.js';
  import { formatRelativeDate } from '../utils/formatters.js';
  import { formatCost, isFreeModel } from '../services/cost-service.js';
  import { showShareQuizModal } from '../components/ShareQuizModal.js';
  import { showDeleteQuizModal } from '../components/DeleteQuizModal.js';
  import { logger } from '../utils/logger.js';
  import { createModeToggle } from '../components/ModeToggle.js';

  export default class TopicsView extends BaseView {
    async render() {
      // Get ALL sessions (pass a large number or modify db function)
      const sessions = await getQuizHistory(100);

      this.setHTML(`
        <div class="relative flex min-h-screen w-full flex-col
  bg-background-light dark:bg-background-dark">
          <!-- Header -->
          <header class="flex items-center p-4 pb-2 justify-between
  bg-background-light dark:bg-background-dark">
            <h1 data-testid="topics-title" class="text-text-light dark:text-text-dark text-lg
  font-bold leading-tight tracking-[-0.015em]">${t('topics.title')}</h1>
            <div class="flex items-center gap-2">
              <div id="modeToggleContainer"></div>
              <span data-testid="quiz-count" class="text-subtext-light dark:text-subtext-dark
  text-sm">${t('topics.quizCount', { count: sessions.length })}</span>
            </div>
          </header>

          <!-- Main Content -->
          <main class="flex-grow px-4 pb-24">
            ${sessions.length === 0 ? this.renderEmptyState() :
  this.renderQuizList(sessions)}
          </main>

          <!-- Bottom Navigation Bar -->
          <div class="fixed bottom-0 left-0 right-0 h-20
  bg-background-light dark:bg-background-dark backdrop-blur-md border-t
  border-border-light dark:border-border-dark">
            <div class="flex justify-around items-center h-full max-w-lg
  mx-auto px-4">
              <a class="flex flex-col items-center justify-center
  text-subtext-light dark:text-subtext-dark hover:text-primary gap-1"
  href="#/">
                <span class="material-symbols-outlined
  text-2xl">home</span>
                <span class="text-xs font-medium">${t('common.home')}</span>
              </a>
              <a class="flex flex-col items-center justify-center
  text-primary gap-1" href="#/history">
                <span class="material-symbols-outlined text-2xl
  fill">category</span>
                <span class="text-xs font-bold">${t('common.topics')}</span>
              </a>
              <a class="flex flex-col items-center justify-center
  text-subtext-light dark:text-subtext-dark hover:text-primary gap-1"
  href="#/settings">
                <span class="material-symbols-outlined
  text-2xl">settings</span>
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

      this.attachListeners();
    }

    renderEmptyState() {
      return `
        <div class="flex flex-col items-center justify-center py-16
  text-center">
          <span class="material-symbols-outlined text-6xl
  text-subtext-light dark:text-subtext-dark mb-4">quiz</span>
          <p class="text-text-light dark:text-text-dark text-xl font-bold
   mb-2">${t('home.noQuizzes')}</p>
          <p class="text-subtext-light dark:text-subtext-dark
  mb-6">${t('topics.completeFirst')}</p>
          <a href="#/topic-input" class="bg-primary text-white rounded-xl
   px-6 py-3 font-bold hover:bg-primary/90">
            ${t('topics.startQuiz')}
          </a>
        </div>
      `;
    }

    renderQuizList(sessions) {
      return `
        <div class="flex flex-col gap-3 pt-4">
          ${sessions.map(session =>
  this.renderQuizItem(session)).join('')}
        </div>
      `;
    }

    renderQuizItem(session) {
      const hasScore = session.score !== null && session.score !== undefined;
      const percentage = hasScore
        ? Math.round((session.score / session.totalQuestions) * 100)
        : null;
      const scoreDisplay = hasScore
        ? `${session.score}/${session.totalQuestions}`
        : `--/${session.totalQuestions}`;

      // Format the date - handle unplayed quizzes (timestamp = 0)
      let dateStr;
      if (!session.timestamp || session.timestamp === 0) {
        dateStr = hasScore ? formatRelativeDate(session.timestamp) : t('home.notPlayedYet');
      } else {
        dateStr = formatRelativeDate(session.timestamp);
      }

      // Format cost if available and feature enabled
      const showCost = session.usage;
      let costStr = '';
      if (showCost) {
        const isFree = isFreeModel(session.model);
        costStr = ` • ${formatCost(session.usage.costUsd || 0, isFree)}`;
      }

      const canReplay = !!session.questions;
      const canShare = canReplay;  // Share quiz always available when replay is possible

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

      return `
        <div class="quiz-item flex items-center gap-4 bg-card-light
  dark:bg-card-dark rounded-xl p-4
          ${canReplay ? 'cursor-pointer hover:opacity-80' : 'opacity-60'}    
   transition-opacity"
          data-session-id="${session.id}"
          ${!canReplay ? 'data-no-replay="true"' : ''}>
          <div class="flex size-16 shrink-0 items-center justify-center      
  rounded-xl ${colorClass.split(' ')[1]}">
            <span class="material-symbols-outlined text-white
  text-3xl">school</span>
          </div>
          <div class="flex flex-1 flex-col">
            <p class="text-text-light dark:text-text-dark text-base
  font-bold leading-normal">${session.topic}</p>
            <p class="text-subtext-light dark:text-subtext-dark text-sm
  font-normal leading-normal">
              ${dateStr}${costStr}${!canReplay ? ` • ${t('topics.cannotReplay')}` : ''}
            </p>
          </div>
          <div class="flex items-center gap-2">
            ${canShare ? `
            <button class="share-quiz-btn flex size-10 items-center justify-center rounded-full hover:bg-primary/10 text-primary transition-colors"
              data-session-id="${session.id}"
              aria-label="Share quiz">
              <span class="material-symbols-outlined text-xl">link</span>
            </button>
            ` : ''}
            <button class="delete-quiz-btn flex size-10 items-center justify-center rounded-full hover:bg-red-500/10 text-red-500 transition-colors"
              data-session-id="${session.id}"
              data-topic="${session.topic.replace(/"/g, '&quot;')}"
              aria-label="${t('history.deleteQuiz')}">
              <span class="material-symbols-outlined text-xl">delete</span>
            </button>
            <p class="${colorClass.split(' ')[0]} text-lg
  font-bold">${scoreDisplay}</p>
            ${canReplay ? '<span class="material-symbols-outlined text-subtext-light dark:text-subtext-dark">chevron_right</span>' : ''}
          </div>
        </div>
      `;
    }

    attachListeners() {
      // Quiz item click handlers for replay
      const quizItems =
  document.querySelectorAll('.quiz-item:not([data-no-replay])');
      quizItems.forEach(item => {
        this.addEventListener(item, 'click', async () => {
          const sessionId = parseInt(/** @type {HTMLElement} */ (item).dataset.sessionId);
          await this.replayQuiz(sessionId);
        });
      });

      // Share quiz button handlers
      const shareButtons = document.querySelectorAll('.share-quiz-btn');
      shareButtons.forEach(btn => {
        this.addEventListener(btn, 'click', async (e) => {
          e.stopPropagation(); // Prevent triggering quiz item click
          const sessionId = parseInt(/** @type {HTMLElement} */ (btn).dataset.sessionId);
          await this.shareQuiz(sessionId);
        });
      });

      // Delete quiz button handlers
      const deleteButtons = document.querySelectorAll('.delete-quiz-btn');
      deleteButtons.forEach(btn => {
        this.addEventListener(btn, 'click', async (e) => {
          e.stopPropagation(); // Prevent triggering quiz item click
          const sessionId = parseInt(/** @type {HTMLElement} */ (btn).dataset.sessionId);
          const topic = /** @type {HTMLElement} */ (btn).dataset.topic;
          await this.handleDeleteQuiz(sessionId, topic);
        });
      });
    }

    async replayQuiz(sessionId) {
      const session = await getQuizSession(sessionId);

      if (!session || !session.questions) {
        alert(t('errors.cannotReplay'));
        return;
      }

      state.set('currentTopic', session.topic);
      state.set('currentGradeLevel', session.gradeLevel || 'middle school');
      state.set('generatedQuestions', session.questions);
      state.set('currentAnswers', []);
      state.set('replaySessionId', sessionId);

      this.navigateTo('/quiz');
    }

    async shareQuiz(sessionId) {
      const session = await getQuizSession(sessionId);

      if (!session || !session.questions) {
        return;
      }

      logger.action('share_quiz_initiated_from_history', {
        topic: session.topic,
        questionCount: session.questions.length
      });

      showShareQuizModal({
        topic: session.topic,
        gradeLevel: session.gradeLevel,
        questions: session.questions
      });
    }

    async handleDeleteQuiz(sessionId, topic) {
      const confirmed = await showDeleteQuizModal(topic);

      if (!confirmed) {
        return;
      }

      logger.action('delete_quiz', {
        sessionId,
        topic
      });

      const success = await deleteQuiz(sessionId);

      if (success) {
        this.showSuccessToast(t('history.quizDeleted'));
        // Re-render the view to update the list
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
  }