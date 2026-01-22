/**
 * ImportView - Handles importing quizzes from shared URLs
 */

import BaseView from './BaseView.js';
import router from '../core/router.js';
import state from '../core/state.js';
import { importQuizFromUrl, saveImportedQuiz } from '../services/quiz-import.js';
import { t } from '../core/i18n.js';

export default class ImportView extends BaseView {
  async render() {
    // Show loading state first
    this.showLoading();

    // Get encoded data from router
    const encodedData = router.getSharedQuizData();

    if (!encodedData) {
      this.showError(t('import.error.description'));
      return;
    }

    // Try to import the quiz
    const result = await importQuizFromUrl(encodedData);

    if (result.success) {
      this.showPreview(result.quiz);
    } else {
      this.showError(result.error);
    }
  }

  showLoading() {
    this.setHTML(`
        <div class="flex min-h-screen flex-col items-center justify-center bg-background-light dark:bg-background-dark p-4">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p class="text-text-light dark:text-text-dark text-lg">${t('import.loading')}</p>
        </div>
      `);
  }

  showPreview(quiz) {
    this.quiz = quiz; // Store for later use

    this.setHTML(`
        <div class="flex min-h-screen flex-col bg-background-light dark:bg-background-dark">
          <!-- Header -->
          <div class="p-4 text-center border-b border-border-light dark:border-border-dark">
            <h1 class="text-text-light dark:text-text-dark text-xl font-bold">${t('import.title')}</h1>   
          </div>

          <!-- Content -->
          <div class="flex-grow flex flex-col items-center justify-center p-6">
            <!-- Icon -->
            <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">      
              <span class="material-symbols-outlined text-4xl text-primary">quiz</span>
            </div>

            <!-- Quiz Title -->
            <h2 class="text-text-light dark:text-text-dark text-2xl font-bold text-center mb-2">
              "${quiz.topic}"
            </h2>

            <!-- Quiz Details -->
            <div class="flex flex-col gap-2 text-subtext-light dark:text-subtext-dark text-center mb-8">  
              <p class="flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-lg">help</span>
                ${t('import.questions_count', { count: quiz.questions.length })}
              </p>
              ${
                quiz.gradeLevel
                  ? `
                <p class="flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-lg">school</span>
                  ${t('import.grade_level', { level: quiz.gradeLevel })}
                </p>
              `
                  : ''
              }
              <p class="flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-lg">person</span>
                ${t('import.shared_by', { name: quiz.originalCreator })}
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="w-full max-w-sm flex flex-col gap-3">
              <button
                id="playNowBtn"
                class="flex cursor-pointer items-center justify-center rounded-xl h-14 px-5 bg-primary text-white text-base font-bold w-full shadow-lg shadow-primary/30 hover:bg-primary/90"
              >
                <span class="material-symbols-outlined mr-2">play_arrow</span>
                ${t('import.play')}
              </button>

              <button
                id="saveBtn"
                class="flex cursor-pointer items-center justify-center rounded-xl h-14 px-5 bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark text-base font-bold w-full border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span class="material-symbols-outlined mr-2">bookmark</span>
                ${t('import.save')}
              </button>

              <button
                id="dismissBtn"
                class="flex cursor-pointer items-center justify-center rounded-xl h-12 px-5 text-subtext-light dark:text-subtext-dark text-sm font-medium w-full hover:text-text-light dark:hover:text-text-dark"   
              >
                ${t('import.dismiss')}
              </button>
            </div>
          </div>
        </div>
      `);

    this.attachPreviewListeners();
  }

  showError(_errorMessage) {
    this.setHTML(`
        <div class="flex min-h-screen flex-col bg-background-light dark:bg-background-dark">
          <!-- Header -->
          <div class="p-4 text-center border-b border-border-light dark:border-border-dark">
            <h1 class="text-text-light dark:text-text-dark text-xl font-bold">${t('import.error.title')}</h1>
          </div>

          <!-- Content -->
          <div class="flex-grow flex flex-col items-center justify-center p-6">
            <!-- Icon -->
            <div class="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">      
              <span class="material-symbols-outlined text-4xl text-red-500">error</span>
            </div>

            <!-- Error Message -->
            <h2 class="text-text-light dark:text-text-dark text-xl font-bold text-center mb-2">
              ${t('import.error.description')}
            </h2>

            <p class="text-subtext-light dark:text-subtext-dark text-center mb-2">
              ${t('import.error.reason.incomplete')}
            </p>
            <p class="text-subtext-light dark:text-subtext-dark text-center mb-2">
              ${t('import.error.reason.corrupted')}
            </p>
            <p class="text-subtext-light dark:text-subtext-dark text-center mb-8">
              ${t('import.error.reason.old_version')}
            </p>

            <!-- Action Buttons -->
            <div class="w-full max-w-sm flex flex-col gap-3">
              <button
                id="goHomeBtn"
                class="flex cursor-pointer items-center justify-center rounded-xl h-14 px-5 bg-primary text-white text-base font-bold w-full shadow-lg shadow-primary/30 hover:bg-primary/90"
              >
                <span class="material-symbols-outlined mr-2">home</span>
                ${t('import.error.go_home')}
              </button>
            </div>
          </div>
        </div>
      `);

    this.attachErrorListeners();
  }

  showSaveSuccess() {
    this.setHTML(`
        <div class="flex min-h-screen flex-col bg-background-light dark:bg-background-dark">
          <!-- Content -->
          <div class="flex-grow flex flex-col items-center justify-center p-6">
            <!-- Icon -->
            <div class="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">    
              <span class="material-symbols-outlined text-4xl text-green-500">check_circle</span>
            </div>

            <!-- Success Message -->
            <h2 class="text-text-light dark:text-text-dark text-xl font-bold text-center mb-2">
              ${t('import.saved.title')}
            </h2>

            <p class="text-subtext-light dark:text-subtext-dark text-center mb-8">
              ${t('import.saved.description', { title: this.quiz.topic })}
            </p>

            <!-- Action Buttons -->
            <div class="w-full max-w-sm flex flex-col gap-3">
              <button
                id="playAfterSaveBtn"
                class="flex cursor-pointer items-center justify-center rounded-xl h-14 px-5 bg-primary text-white text-base font-bold w-full shadow-lg shadow-primary/30 hover:bg-primary/90"
              >
                <span class="material-symbols-outlined mr-2">play_arrow</span>
                ${t('import.play')}
              </button>

              <button
                id="goHomeAfterSaveBtn"
                class="flex cursor-pointer items-center justify-center rounded-xl h-14 px-5 bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark text-base font-bold w-full border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span class="material-symbols-outlined mr-2">home</span>
                ${t('import.saved.go_home')}
              </button>
            </div>
          </div>
        </div>
      `);

    this.attachSaveSuccessListeners();
  }

  attachPreviewListeners() {
    const playNowBtn = this.querySelector('#playNowBtn');
    const saveBtn = this.querySelector('#saveBtn');
    const dismissBtn = this.querySelector('#dismissBtn');

    this.addEventListener(playNowBtn, 'click', () => this.handlePlayNow());
    this.addEventListener(saveBtn, 'click', () => this.handleSave());
    this.addEventListener(dismissBtn, 'click', () => this.navigateTo('/'));
  }

  attachErrorListeners() {
    const goHomeBtn = this.querySelector('#goHomeBtn');
    this.addEventListener(goHomeBtn, 'click', () => this.navigateTo('/'));
  }

  attachSaveSuccessListeners() {
    const playBtn = this.querySelector('#playAfterSaveBtn');
    const homeBtn = this.querySelector('#goHomeAfterSaveBtn');

    this.addEventListener(playBtn, 'click', () => this.startQuiz());
    this.addEventListener(homeBtn, 'click', () => this.navigateTo('/'));
  }

  async handlePlayNow() {
    // Save first, then start quiz
    const result = await saveImportedQuiz(this.quiz);
    if (result.success) {
      this.savedSessionId = result.id;
      this.startQuiz();
    } else {
      this.showError(result.error);
    }
  }

  async handleSave() {
    const result = await saveImportedQuiz(this.quiz);
    if (result.success) {
      this.savedSessionId = result.id;
      this.showSaveSuccess();
    } else {
      this.showError(result.error);
    }
  }

  startQuiz() {
    // Set up state for QuizView
    state.set('currentTopic', this.quiz.topic);
    state.set('currentGradeLevel', this.quiz.gradeLevel || 'middle school');
    state.set('generatedQuestions', this.quiz.questions);
    // Use replaySessionId so ResultsView updates this session instead of creating a duplicate
    state.set('replaySessionId', this.savedSessionId);

    this.navigateTo('/quiz');
  }
}
