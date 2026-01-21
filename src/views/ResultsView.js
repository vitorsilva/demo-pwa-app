import BaseView from './BaseView.js';
import state from '../core/state.js';
import { saveQuizSession, updateQuizSession, generateExplanation, generateWrongAnswerExplanation, updateQuestionExplanation } from '../services/quiz-service.js';
import { getApiKey } from '../services/auth-service.js';
import { logger } from '../utils/logger.js';
import { showExplanationModal } from '../components/ExplanationModal.js';
import { showShareModal } from '../components/ShareModal.js';
import { showShareQuizModal } from '../components/ShareQuizModal.js';
import { calculateNextGradeLevel } from '../utils/gradeProgression.js';
import { t, getCurrentLanguage } from '../core/i18n.js';
import { getUsageSummary } from '../services/cost-service.js';
import { isOnline } from '../utils/network.js';

export default class ResultsView extends BaseView {
  render() {
    const questions = state.get('currentQuestions');
    const answers = state.get('currentAnswers');

    if (!questions || !answers) {
      this.navigateTo('/');
      return;
    }

    // Calculate score
    let correctCount = 0;
    questions.forEach((question, index) => {
      if (Number(answers[index]) === Number(question.correct) ) {
        correctCount++;
      }
    });

    const totalQuestions = questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    this.saveQuizSession(questions, answers, correctCount, totalQuestions);

    // Calculate stroke-dashoffset for circular progress (100 = full circle, 0 = empty)
    const strokeDashoffset = 100 - percentage;

    // Determine message based on score
    let message;
    if (percentage === 100) {
      message = t('results.perfectScore');
    } else if (percentage >= 80) {
      message = t('results.greatJob');
    } else if (percentage >= 60) {
      message = t('results.goodWork');
    } else {
      message = t('results.keepPracticing');
    }

    // Get usage data for cost display
    const usage = state.get('quizUsage');
    const model = state.get('quizModel');
    const usageSummary = usage ? getUsageSummary(usage, model) : null;

    // Helper function to render usage cost card
    const renderUsageCard = () => {
      if (!usageSummary) return '';

      const modelDisplay = usageSummary.isFreeModel ? t('usage.freeModel') : model;
      const showEstimatedCost = usageSummary.isFreeModel && usageSummary.formattedEstimatedCost;
      const estimatedCostHtml = showEstimatedCost
        ? `<p class="mt-2 text-xs text-subtext-light dark:text-subtext-dark">
            ${t('usage.onPaidModel', { cost: usageSummary.formattedEstimatedCost })}
          </p>`
        : '';

      return `
        <div data-testid="usage-cost-card" class="mt-4 p-4 rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
            <div class="flex-1">
              <p class="text-sm text-text-light dark:text-text-dark font-medium">${t('usage.thisQuizUsed')}</p>
              <ul class="mt-1 text-sm text-subtext-light dark:text-subtext-dark">
                <li>• ${t('usage.tokens', { count: usageSummary.totalTokens })} (${usageSummary.formattedActualCost})</li>
                <li>• ${modelDisplay}</li>
              </ul>
              ${estimatedCostHtml}
            </div>
          </div>
        </div>
      `;
    };

    // Generate question review HTML
    const questionReviewHTML = questions.map((question, index) => {
      const isCorrect = Number(answers[index]) === Number(question.correct);
      const userAnswer = question.options[Number(answers[index])];
      const correctAnswer = question.options[Number(question.correct)];

      if (isCorrect) {
        return `
          <div class="flex items-center gap-4 bg-card-light dark:bg-card-dark p-3 rounded-lg min-h-[72px] justify-between">
            <div class="flex items-center gap-4">
              <div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                <span class="material-symbols-outlined">check</span>
              </div>
              <div class="flex flex-col justify-center">
                <p class="text-text-light dark:text-text-dark text-base font-medium leading-normal">${question.question}</p>
                <p class="text-subtext-light dark:text-subtext-dark text-sm font-normal leading-normal">${t('results.yourAnswer')}: ${userAnswer}</p>
              </div>
            </div>
            <div class="shrink-0">
              <div class="flex size-7 items-center justify-center">
                <div class="size-3 rounded-full bg-success"></div>
              </div>
            </div>
          </div>
        `;
      } else {
        // Incorrect answer - show explain button
        const rightSideContent = `<button
              aria-label="Explain answer"
              data-question-index="${index}"
              class="explain-btn flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary/20 active:scale-95 animate-pulse shadow-[0_0_10px_rgba(74,144,226,0.5)]">
              <span class="material-symbols-outlined text-[20px]">info</span>
            </button>`;

        return `
          <div class="flex items-center gap-4 bg-card-light dark:bg-card-dark p-3 rounded-lg min-h-[72px] justify-between">
            <div class="flex items-center gap-4">
              <div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-error/10 text-error">
                <span class="material-symbols-outlined">close</span>
              </div>
              <div class="flex flex-col justify-center">
                <p class="text-text-light dark:text-text-dark text-base font-medium leading-normal">${question.question}</p>
                <p class="text-error text-sm font-normal leading-normal">${t('results.yourAnswer')}: ${userAnswer}</p>
                <p class="text-success text-sm font-normal leading-normal">${t('results.correctAnswer')}: ${correctAnswer}</p>
              </div>
            </div>
            <div class="shrink-0">
              ${rightSideContent}
            </div>
          </div>
        `;
      }
    }).join('');

    this.setHTML(`
      <div class="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <!-- Top App Bar -->
        <header class="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-border-light dark:border-border-dark">
          <button id="backBtn" class="text-text-light dark:text-text-dark flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-primary/10">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 class="text-text-light dark:text-text-dark text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">${t('results.title')}</h1>
        </header>

        <main class="flex-grow px-4 pt-6 pb-40">
          <!-- Score Display Card -->
          <div class="flex flex-col items-center justify-center rounded-xl bg-card-light dark:bg-card-dark p-6 text-center shadow-sm">
            <div class="relative size-40">
              <svg class="size-full" height="36" viewbox="0 0 36 36" width="36" xmlns="http://www.w3.org/2000/svg">
                <circle class="stroke-border-light dark:stroke-border-dark" cx="18" cy="18" fill="none" r="16" stroke-width="3"></circle>
                <circle class="stroke-success" cx="18" cy="18" fill="none" r="16" stroke-dasharray="100" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round" stroke-width="3"></circle>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <p data-testid="score-percentage" class="text-success text-5xl font-extrabold">${percentage}%</p>
              </div>
            </div>
            <p data-testid="result-message" class="text-text-light dark:text-text-dark text-xl font-bold mt-4">${message}</p>
            <p data-testid="score-summary" class="text-subtext-light dark:text-subtext-dark mt-1">${t('results.scoreSummary', { correct: correctCount, total: totalQuestions })}</p>
          </div>

          <!-- Usage Cost Card -->
          ${renderUsageCard()}

          <!-- Share Buttons -->
          <div class="flex justify-center gap-3 mt-4 flex-wrap">
            <button id="shareBtn" data-testid="share-results-btn" class="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary text-primary font-semibold hover:bg-primary/10 transition-colors">
              <span class="material-symbols-outlined text-xl">share</span>
              ${t('share.button')}
            </button>
            <button id="shareQuizBtn" data-testid="share-quiz-btn" class="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary text-primary font-semibold hover:bg-primary/10 transition-colors">
              <span class="material-symbols-outlined text-xl">link</span>
              ${t('shareQuiz.title')}
            </button>
          </div>

          <!-- Section Header -->
          <h2 class="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] pt-8 pb-3">${t('results.reviewAnswers')}</h2>

          <!-- Question List -->
          <div class="flex flex-col space-y-2">
            ${questionReviewHTML}
          </div>
        </main>

        <!-- Bottom Actions & Navigation -->
        <div class="fixed bottom-0 left-0 w-full bg-background-light dark:bg-background-dark border-t border-border-light dark:border-border-dark">
          <!-- CTA Buttons -->
          <div class="p-4 pb-0">
            <div class="flex gap-3">
              <button id="continueTopicBtn" class="flex-1 rounded-xl bg-primary h-14 text-center text-base font-bold text-white hover:bg-primary/90 shadow-lg shadow-primary/30 flex items-center justify-center gap-2">
                ${t('results.continueOnTopic')}
                <span class="material-symbols-outlined text-xl">arrow_forward</span>
              </button>
              <button id="tryAnotherBtn" class="flex-1 rounded-xl border-2 border-border-light dark:border-border-dark h-14 text-center text-base font-bold text-text-light dark:text-text-dark hover:bg-card-light dark:hover:bg-card-dark">
                ${t('results.tryAnother')}
              </button>
            </div>
          </div>

          <!-- Bottom Navigation Bar -->
          <div class="h-20 border-t border-border-light dark:border-border-dark">
            <div class="flex justify-around items-center h-full max-w-lg mx-auto px-4">
              <a class="flex flex-col items-center justify-center text-subtext-light dark:text-subtext-dark hover:text-primary gap-1" href="#/">
                <span class="material-symbols-outlined text-2xl">home</span>
                <span class="text-xs font-medium">${t('common.home')}</span>
              </a>
              <a class="flex flex-col items-center justify-center text-primary gap-1" href="#/history">
                <span class="material-symbols-outlined text-2xl fill">category</span>
                <span class="text-xs font-bold">${t('common.topics')}</span>
              </a>
              <a class="flex flex-col items-center justify-center text-subtext-light dark:text-subtext-dark hover:text-primary gap-1" href="#/settings">
                <span class="material-symbols-outlined text-2xl">settings</span>
                <span class="text-xs font-medium">${t('common.settings')}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `);

    this.attachListeners();
  }

  async saveQuizSession(questions, answers, correctCount, totalQuestions) {

    // Skip saving if this is a replay
    const replaySessionId = state.get('replaySessionId');

    // If replay, update existing session and keep track of session ID for caching
    if (replaySessionId) {
      try {
        await updateQuizSession(replaySessionId, {
          score: correctCount,
          answers,
          timestamp: Date.now()  // Update timestamp to show when last played
        });
        // Store session ID for explanation caching
        state.set('currentSessionId', replaySessionId);
        logger.debug('Replay session updated', { sessionId: replaySessionId });
      } catch (error) {
        logger.error('Failed to update session', { error: error.message });
      }
      state.set('replaySessionId', null);
      return;
    }

    const topic = state.get('currentTopic') || 'Unknown Topic';
    const gradeLevel = state.get('currentGradeLevel') || 'Unknown';
    const model = state.get('quizModel');
    const usage = state.get('quizUsage');

    const session = {
      topic,
      gradeLevel,
      timestamp: Date.now(),
      score: correctCount,
      totalQuestions,
      questions,
      answers,
      model,
      usage
    };

    try {
      const sessionId = await saveQuizSession(session);
      // Store session ID for explanation caching
      state.set('currentSessionId', sessionId);
      logger.debug('Quiz session saved', { topic: session.topic, sessionId });
    } catch (error) {
      logger.error('Failed to save session', { error: error.message });
    }
  }

  attachListeners() {
    // Back button
    const backBtn = this.querySelector('#backBtn');
    this.addEventListener(backBtn, 'click', () => {
      this.navigateTo('/');
    });

    // Try another topic button
    const tryAnotherBtn = this.querySelector('#tryAnotherBtn');
    this.addEventListener(tryAnotherBtn, 'click', () => {
      // Clear continue chain when starting new topic
      state.clearContinueChain();
      this.navigateTo('/topic-input');
    });

    // Continue on topic button
    const continueTopicBtn = this.querySelector('#continueTopicBtn');
    if (continueTopicBtn) {
      this.addEventListener(continueTopicBtn, 'click', () => {
        this.handleContinueTopic();
      });
    }

    // Explanation buttons for incorrect answers
    const explainBtns = this.appContainer.querySelectorAll('.explain-btn');
    explainBtns.forEach(btn => {
      this.addEventListener(btn, 'click', async () => {
        const questionIndex = parseInt(/** @type {HTMLElement} */ (btn).dataset.questionIndex, 10);
        await this.handleExplanationClick(questionIndex);
      });
    });

    // Share button
    const shareBtn = this.querySelector('#shareBtn');
    if (shareBtn) {
      this.addEventListener(shareBtn, 'click', () => {
        this.handleShareClick();
      });
    }

    // Share Quiz button
    const shareQuizBtn = this.querySelector('#shareQuizBtn');
    if (shareQuizBtn) {
      this.addEventListener(shareQuizBtn, 'click', () => {
        this.handleShareQuizClick();
      });
    }
  }

  handleShareClick() {
    const topic = state.get('currentTopic') || 'Quiz';
    const questions = state.get('currentQuestions');
    const answers = state.get('currentAnswers');

    // Calculate score
    let correctCount = 0;
    questions.forEach((question, index) => {
      if (Number(answers[index]) === Number(question.correct)) {
        correctCount++;
      }
    });

    const totalQuestions = questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    logger.action('share_initiated', {
      topic,
      score: correctCount,
      total: totalQuestions,
      percentage
    });

    showShareModal({
      topic,
      score: correctCount,
      total: totalQuestions,
      percentage
    });
  }

  handleShareQuizClick() {
    const topic = state.get('currentTopic') || 'Quiz';
    const gradeLevel = state.get('currentGradeLevel');
    const questions = state.get('currentQuestions');

    logger.action('share_quiz_initiated', {
      topic,
      questionCount: questions.length
    });

    showShareQuizModal({
      topic,
      gradeLevel,
      questions
    });
  }

  handleContinueTopic() {
    const topic = state.get('currentTopic');
    const gradeLevel = state.get('currentGradeLevel');
    const questions = state.get('currentQuestions');

    // Get or initialize continue chain
    let chain = state.getContinueChain();

    if (!chain || chain.topic !== topic) {
      // First continue on this topic - initialize chain
      state.initContinueChain(topic, gradeLevel, questions);
      chain = state.getContinueChain();
    } else {
      // Add current questions to chain
      state.addToContinueChain(questions);
    }

    // Calculate next grade level
    const nextGradeLevel = calculateNextGradeLevel(chain.continueCount + 1, chain.startingGradeLevel);

    // Track telemetry
    logger.action('continue_topic_clicked', {
      topic,
      continueCount: chain.continueCount + 1,
      currentGradeLevel: gradeLevel,
      nextGradeLevel,
      previousQuestionCount: chain.previousQuestions.length
    });

    // Update grade level for next quiz
    state.set('currentGradeLevel', nextGradeLevel);

    // Navigate to loading to generate new questions
    this.navigateTo('/loading');
  }

  async handleExplanationClick(questionIndex) {
    const questions = state.get('currentQuestions');
    const answers = state.get('currentAnswers');
    const gradeLevel = state.get('currentGradeLevel') || 'middle school';
    const topic = state.get('currentTopic') || 'Unknown';
    const sessionId = state.get('currentSessionId');

    const question = questions[questionIndex];
    const userAnswer = question.options[Number(answers[questionIndex])];
    const correctAnswer = question.options[Number(question.correct)];

    // Check for cached explanation
    const cachedExplanation = question.rightAnswerExplanation;
    const hasCache = !!cachedExplanation;

    // Check network and API key status
    const offline = !isOnline();
    const apiKey = await getApiKey();
    const hasApiKey = !!apiKey;

    // Track telemetry event
    logger.action('explanation_opened', {
      topic,
      questionIndex,
      gradeLevel,
      cached: hasCache,
      offline
    });

    await showExplanationModal({
      question: question.question,
      userAnswer,
      correctAnswer,
      cachedExplanation,
      isOffline: offline,
      hasApiKey,
      onFetchExplanation: async () => {
        if (!apiKey) {
          throw new Error('No API key available');
        }

        // If we have cached explanation, only fetch wrong answer explanation
        if (hasCache) {
          logger.debug('Using cached rightAnswerExplanation, fetching wrongAnswerExplanation only');
          return generateWrongAnswerExplanation(
            question.question,
            userAnswer,
            correctAnswer,
            gradeLevel,
            apiKey,
            getCurrentLanguage()
          );
        }

        // No cache - fetch full explanation
        logger.debug('No cached explanation, fetching full explanation');
        const result = await generateExplanation(
          question.question,
          userAnswer,
          correctAnswer,
          gradeLevel,
          apiKey,
          getCurrentLanguage()
        );

        // Cache the rightAnswerExplanation for future use
        if (result.rightAnswerExplanation && sessionId) {
          try {
            await updateQuestionExplanation(sessionId, questionIndex, result.rightAnswerExplanation);
            // Also update the in-memory state
            questions[questionIndex].rightAnswerExplanation = result.rightAnswerExplanation;
            state.set('currentQuestions', questions);
            logger.debug('Cached rightAnswerExplanation for question', { questionIndex });
          } catch (cacheError) {
            logger.error('Failed to cache explanation', { error: cacheError.message });
            // Non-fatal - continue showing the explanation
          }
        }

        return result;
      }
    });
  }
}
