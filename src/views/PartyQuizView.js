/**
 * Party Quiz View
 *
 * Quiz playing screen for party sessions.
 * Shows question with timer and live scoreboard.
 *
 * MVP Implementation: Uses HTTP polling instead of WebRTC.
 */

import BaseView from './BaseView.js';
import { t } from '../core/i18n.js';
import { createLiveScoreboard } from '../components/LiveScoreboard.js';
import { shuffleOptions } from '../utils/shuffle.js';
import { logger } from '../utils/logger.js';
import router from '../core/router.js';
import { getRoom, submitAnswer as submitAnswerApi, advanceQuestion as advanceQuestionApi } from '../services/party-api.js';
import { CONNECTION_MODES } from '../services/party-connection-manager.js';
import { getConnection } from '../services/party-connection-store.js';

const log = logger.child({ module: 'PartyQuizView' });

/** @type {number} Polling interval for room updates (ms) */
const POLL_INTERVAL_MS = 1000;

export default class PartyQuizView extends BaseView {
  /**
   * @param {Object} options
   * @param {string} [options.roomCode] - Room code from URL
   * @param {import('../services/party-session.js').PartySession} [options.session] - Party session (legacy)
   */
  constructor(options = {}) {
    super();
    // Support both new (roomCode) and legacy (session) approaches
    this.roomCode = options.roomCode || router.getPartyQuizCode() || sessionStorage.getItem('partyRoomCode') || '';
    this.participantId = sessionStorage.getItem('partyParticipantId') || '';
    this.isHost = sessionStorage.getItem('partyIsHost') === 'true';
    this.session = options.session; // Legacy support
    this.connectionManager = null;

    this.quiz = null;
    this.participants = [];
    this.currentQuestion = 0;
    this.secondsPerQuestion = 30;
    this.questionStartTime = Date.now();

    this.selectedAnswer = null;
    this.hasAnswered = false;
    this.timerExpiredHandled = false;
    this.timerInterval = null;
    this.pollInterval = null;
    this.shuffledOptions = null;
    this.shuffleMap = null; // Maps shuffled index to original index
    this.allAnswered = false; // Track if all participants answered (Issue #108)
  }

  async render() {
    // Get connection manager from store (set by JoinPartyView or CreatePartyView)
    this.connectionManager = getConnection();

    // If we have a connection manager with a session, use it
    if (this.connectionManager) {
      const session = this.connectionManager.getSession();
      if (session && session.quiz) {
        this.session = session;
      }
    }
    
    // Legacy support: if session provided, use original behavior
    if (this.session && this.session.quiz) {
      return this._renderWithSession();
    }

    // New approach: fetch room data from API
    if (!this.roomCode) {
      log.error('No room code');
      this.navigateTo('/');
      return;
    }

    try {
      const roomData = await getRoom(this.roomCode);
      if (roomData.status !== 'playing') {
        log.warn('Room not in playing state', { status: roomData.status });
        this.navigateTo('/');
        return;
      }

      this.quiz = roomData.quiz_data;
      this.secondsPerQuestion = roomData.seconds_per_question || 30;
      this.participants = this._mapParticipants(roomData.participants || []);
      this.questionStartTime = Date.now();

      log.info('Quiz loaded', { questions: this.quiz?.questions?.length, participants: this.participants.length });
    } catch (error) {
      log.error('Failed to load room', { error: error.message });
      alert(t('party.roomNotFound'));
      this.navigateTo('/');
      return;
    }

    if (!this.quiz || !this.quiz.questions || this.quiz.questions.length === 0) {
      log.error('No quiz data');
      this.navigateTo('/');
      return;
    }

    const question = this.quiz.questions[this.currentQuestion];
    const totalQuestions = this.quiz.questions.length;
    const questionIndex = this.currentQuestion;

    // Shuffle options for this question
    this._shuffleCurrentQuestion(question);

    this.setHTML(`
      <div class="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
        <!-- Header with timer -->
        <div class="flex items-center justify-between p-4 bg-background-light dark:bg-background-dark">
          <div class="text-text-light dark:text-text-dark text-sm font-medium">
            ${t('party.question', { current: questionIndex + 1, total: totalQuestions })}
          </div>
          <div id="timer" class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">timer</span>
            <span id="timerText" class="text-lg font-bold text-primary">--</span>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="h-1 bg-gray-200 dark:bg-gray-700">
          <div id="progressBar" class="h-full bg-primary transition-all duration-100" style="width: 100%"></div>
        </div>

        <div class="flex-grow px-4 pb-24">
          <!-- Question -->
          <div class="py-6">
            <h2 id="questionText" class="text-text-light dark:text-text-dark text-xl font-bold leading-tight">
              ${question?.question || 'Loading...'}
            </h2>
          </div>

          <!-- Options -->
          <div id="optionsContainer" class="flex flex-col gap-3">
            ${this._renderOptions(question)}
          </div>

          <!-- Scoreboard (collapsed by default on mobile) -->
          <div class="mt-6">
            <button id="toggleScoreboardBtn" class="flex items-center gap-2 text-primary text-sm font-medium mb-2">
              <span class="material-symbols-outlined text-sm">leaderboard</span>
              ${t('party.liveScores')}
              <span id="toggleIcon" class="material-symbols-outlined text-sm">expand_more</span>
            </button>
            <div id="scoreboardContainer" class="hidden">
              <!-- Scoreboard will be inserted here -->
            </div>
          </div>
        </div>

        <!-- Host controls and status bar -->
        <div id="statusBar" class="fixed bottom-0 left-0 right-0 py-3 bg-primary text-white text-center">
          <!-- Answer status indicator (visible to all) -->
          <div id="answerStatusContainer" class="mb-2 ${this.hasAnswered ? '' : 'hidden'}">
            <span id="answer-status-indicator" data-testid="answer-status-indicator" class="text-sm">
              <!-- Will be updated by _updateAnswerStatus -->
            </span>
          </div>

          <!-- Next Question button (host only, after answering) -->
          ${this.isHost ? `
            <button
              id="nextQuestionBtn"
              data-testid="next-question-btn"
              class="hidden px-6 py-2 mb-2 bg-white text-primary font-medium rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-gray-100 transition-colors"
              disabled
            >
              <span class="flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-sm">skip_next</span>
                ${t('party.nextQuestion')}
              </span>
            </button>
          ` : ''}

          <!-- Status text -->
          <span id="statusText" class="text-sm">${t('party.waiting')}</span>
        </div>
      </div>
    `);

    this._renderScoreboard();
    this.attachListeners();
    this._startTimer();

    // Set up connection manager event handlers
    if (this.connectionManager) {
      this.connectionManager.onModeChange((mode, previousMode) => {
        log.info('Connection mode changed', { from: previousMode, to: mode });

        // If we switched to HTTP fallback, start polling
        if (mode === CONNECTION_MODES.HTTP_FALLBACK && !this.pollInterval) {
          this._startPolling();
        }
      });

      this.connectionManager.onError((error) => {
        log.warn('P2P connection error', { error: error.message });
      });
    }    
    
    // Set up callbacks and polling based on connection mode
    if (this.session) {
      this._setupSessionCallbacks();

      // Only start polling if in HTTP fallback mode
      if (this.connectionManager) {
        const mode = this.connectionManager.getMode();
        if (mode === CONNECTION_MODES.HTTP_FALLBACK || mode === CONNECTION_MODES.CONNECTING) {
          this._startPolling();
        }
      }
    } else {
      // No session - use HTTP polling only
      this._startPolling();
    }

  }

  /**
   * Map API participant data to UI format.
   * @param {Array} apiParticipants - Participants from API
   * @returns {Array} Formatted participants
   */
  _mapParticipants(apiParticipants) {
    return apiParticipants.map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost === true,
      isYou: p.id === this.participantId,
      score: p.score || 0,
      status: 'connected',
      hasAnsweredCurrent: p.hasAnsweredCurrent ?? false,
    }));
  }

  /**
   * Legacy render method for PartySession-based usage.
   * @private
   */
  async _renderWithSession() {
    const question = this.session.getCurrentQuestion();
    const questionIndex = this.session.currentQuestion;
    const totalQuestions = this.session.quiz.questions.length;

    this._shuffleCurrentQuestion(question);

    this.setHTML(`
      <div class="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
        <div class="flex items-center justify-between p-4 bg-background-light dark:bg-background-dark">
          <div class="text-text-light dark:text-text-dark text-sm font-medium">
            ${t('party.question', { current: questionIndex + 1, total: totalQuestions })}
          </div>
          <div id="timer" class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">timer</span>
            <span id="timerText" class="text-lg font-bold text-primary">--</span>
          </div>
        </div>
        <div class="h-1 bg-gray-200 dark:bg-gray-700">
          <div id="progressBar" class="h-full bg-primary transition-all duration-100" style="width: 100%"></div>
        </div>
        <div class="flex-grow px-4 pb-24">
          <div class="py-6">
            <h2 id="questionText" class="text-text-light dark:text-text-dark text-xl font-bold leading-tight">
              ${question?.question || 'Loading...'}
            </h2>
          </div>
          <div id="optionsContainer" class="flex flex-col gap-3">
            ${this._renderOptions(question)}
          </div>
          <div class="mt-6">
            <button id="toggleScoreboardBtn" class="flex items-center gap-2 text-primary text-sm font-medium mb-2">
              <span class="material-symbols-outlined text-sm">leaderboard</span>
              ${t('party.liveScores')}
              <span id="toggleIcon" class="material-symbols-outlined text-sm">expand_more</span>
            </button>
            <div id="scoreboardContainer" class="hidden"></div>
          </div>
        </div>
        <!-- Host controls and status bar -->
        <div id="statusBar" class="fixed bottom-0 left-0 right-0 py-3 bg-primary text-white text-center">
          <!-- Answer status indicator (visible to all) -->
          <div id="answerStatusContainer" class="mb-2 ${this.hasAnswered ? '' : 'hidden'}">
            <span id="answer-status-indicator" data-testid="answer-status-indicator" class="text-sm">
              <!-- Will be updated by _updateAnswerStatus -->
            </span>
          </div>

          <!-- Next Question button (host only, after answering) -->
          ${this.isHost ? `
            <button
              id="nextQuestionBtn"
              data-testid="next-question-btn"
              class="hidden px-6 py-2 mb-2 bg-white text-primary font-medium rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-gray-100 transition-colors"
              disabled
            >
              <span class="flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-sm">skip_next</span>
                ${t('party.nextQuestion')}
              </span>
            </button>
          ` : ''}

          <!-- Status text -->
          <span id="statusText" class="text-sm">${t('party.waiting')}</span>
        </div>
      </div>
    `);

    this._renderScoreboard();
    this.attachListeners();
    this._startTimer();
    this._setupSessionCallbacks();
  }

  /**
   * Shuffle options for the current question.
   *
   * @private
   * @param {Object} question - Question object
   */
  _shuffleCurrentQuestion(question) {
    if (!question) return;

    const result = shuffleOptions(question.options, question.correct);
    this.shuffledOptions = result.shuffledOptions;
    this.shuffleMap = result.shuffleMap;
  }

  /**
   * Render answer options.
   *
   * @private
   * @param {Object} question - Question object
   * @returns {string} HTML string
   */
  _renderOptions(question) {
    if (!question || !this.shuffledOptions) return '';

    const labels = ['A', 'B', 'C', 'D'];

    return this.shuffledOptions.map((option, index) => `
      <button
        class="option-btn flex items-start gap-3 p-4 rounded-xl
               bg-card-light dark:bg-card-dark
               border-2 border-transparent
               hover:border-primary/50
               text-left transition-all"
        data-index="${index}"
        data-testid="option-${index}"
      >
        <span class="w-8 h-8 rounded-full bg-primary/20 text-primary
                     flex items-center justify-center text-sm font-bold shrink-0">
          ${labels[index]}
        </span>
        <span class="text-text-light dark:text-text-dark text-base pt-1">
          ${option}
        </span>
      </button>
    `).join('');
  }

  /**
   * Render the scoreboard.
   *
   * @private
   */
  _renderScoreboard() {
    const container = this.querySelector('#scoreboardContainer');
    if (!container) return;

    // Support both new (this.participants) and legacy (this.session) approaches
    let participants;
    let highlightId;

    if (this.session) {
      participants = this.session.getParticipants().map(p => ({
        ...p,
        isYou: p.id === this.session.participantId,
      }));
      highlightId = this.session.participantId;
    } else {
      participants = this.participants;
      highlightId = this.participantId;
    }

    container.innerHTML = '';
    const scoreboard = createLiveScoreboard(participants, {
      showStatus: true,
      highlightId,
    });
    container.appendChild(scoreboard);
  }

  attachListeners() {
    // Option buttons
    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach((btn) => {
      this.addEventListener(btn, 'click', () => {
        if (this.hasAnswered) return;

        const index = parseInt(/** @type {HTMLElement} */ (btn).dataset.index);
        this._selectOption(index);
      });
    });

    // Toggle scoreboard
    const toggleBtn = this.querySelector('#toggleScoreboardBtn');
    const scoreboardContainer = this.querySelector('#scoreboardContainer');
    const toggleIcon = this.querySelector('#toggleIcon');

    if (toggleBtn && scoreboardContainer) {
      this.addEventListener(toggleBtn, 'click', () => {
        scoreboardContainer.classList.toggle('hidden');
        if (toggleIcon) {
          toggleIcon.textContent = scoreboardContainer.classList.contains('hidden')
            ? 'expand_more'
            : 'expand_less';
        }
      });
    }

    // Next Question button (host only)
    const nextQuestionBtn = this.querySelector('#nextQuestionBtn');
    if (nextQuestionBtn && this.isHost) {
      this.addEventListener(nextQuestionBtn, 'click', () => {
        this._onNextQuestionClick();
      });
    }
  }

  /**
   * Set up session callbacks.
   *
   * @private
   */
  _setupSessionCallbacks() {
    this.session.onQuestionChange((questionIndex, question) => {
      this._onQuestionChange(questionIndex, question);
    });

    this.session.onParticipantsChange(() => {
      this._renderScoreboard();
    });

    this.session.onScoreUpdate(() => {
      this._renderScoreboard();
    });

    this.session.onQuizEnd((standings) => {
      this._onQuizEnd(standings);
    });
  }

  /**
   * Handle question change.
   *
   * @private
   * @param {number} questionIndex - New question index
   * @param {Object} question - New question data
   */
  _onQuestionChange(questionIndex, question) {
    log.info('Question changed', { questionIndex });

    // Reset state
    this.selectedAnswer = null;
    this.hasAnswered = false;

    // Reset answer status for new question (Issue #108 fix)
    this.allAnswered = false;
    const answerStatusContainer = this.querySelector('#answerStatusContainer');
    const nextQuestionBtn = this.querySelector('#nextQuestionBtn');
    if (answerStatusContainer) {
      answerStatusContainer.classList.add('hidden');
    }
    if (nextQuestionBtn) {
      nextQuestionBtn.classList.add('hidden');
      nextQuestionBtn.setAttribute('disabled', 'true');
    }

    // Shuffle new question
    this._shuffleCurrentQuestion(question);

    // Update UI
    const questionText = this.querySelector('#questionText');
    if (questionText) {
      questionText.textContent = question?.question || '';
    }

    const optionsContainer = this.querySelector('#optionsContainer');
    if (optionsContainer) {
      optionsContainer.innerHTML = this._renderOptions(question);

      // Re-attach listeners
      const optionBtns = optionsContainer.querySelectorAll('.option-btn');
      optionBtns.forEach((btn) => {
        this.addEventListener(btn, 'click', () => {
          if (this.hasAnswered) return;
          const index = parseInt(/** @type {HTMLElement} */ (btn).dataset.index);
          this._selectOption(index);
        });
      });
    }

    // Update header
    const header = this.querySelector('.text-sm.font-medium');
    if (header) {
      header.textContent = t('party.question', {
        current: questionIndex + 1,
        total: this.session.quiz.questions.length,
      });
    }

    this._updateStatus(t('party.thinking'));
  }

  /**
   * Select an option.
   *
   * @private
   * @param {number} shuffledIndex - Selected shuffled option index
   */
  async _selectOption(shuffledIndex) {
    this.selectedAnswer = shuffledIndex;
    this.hasAnswered = true;

    // Get original index for submission
    const originalIndex = this.shuffleMap[shuffledIndex];

    // Update UI - mark selected
    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach((btn, index) => {
      if (index === shuffledIndex) {
        btn.classList.add('border-primary', 'bg-primary/10');
      } else {
        btn.classList.add('opacity-50');
        btn.setAttribute('disabled', 'true');
      }
    });

    // Submit answer - support both session and API modes
    if (this.session) {
      this.session.submitAnswer(this.session.currentQuestion, originalIndex);
      this._updateStatus(t('party.answered'));
      // Update answer status for host controls
      this._updateAnswerStatus();
    } else {
      // MVP mode: submit via API
      const timeMs = Date.now() - this.questionStartTime;
      try {
        const result = await submitAnswerApi(
          this.roomCode,
          this.participantId,
          this.currentQuestion,
          originalIndex,
          timeMs
        );

        // Show correct/incorrect feedback
        this._showAnswerFeedback(shuffledIndex, result.isCorrect, result.points);

        // Update answer status for host controls (mark self as answered)
        // Self is already answered, so update participants to reflect this
        const selfParticipant = this.participants.find((p) => p.id === this.participantId);
        if (selfParticipant) {
          selfParticipant.hasAnsweredCurrent = true;
        }
        this._updateAnswerStatus();

        log.info('Answer result', { isCorrect: result.isCorrect, points: result.points, score: result.score });
      } catch (error) {
        log.error('Failed to submit answer', { error: error.message });
        this._updateStatus(t('party.answered'));
        // Still update answer status on error
        this._updateAnswerStatus();
      }
    }

    log.info('Option selected', { shuffledIndex, originalIndex });
  }

  /**
   * Show visual feedback for answer correctness.
   *
   * @private
   * @param {number} shuffledIndex - Selected option index
   * @param {boolean} isCorrect - Whether answer was correct
   * @param {number} points - Points earned
   */
  _showAnswerFeedback(shuffledIndex, isCorrect, points) {
    const optionBtns = document.querySelectorAll('.option-btn');
    const selectedBtn = optionBtns[shuffledIndex];

    if (selectedBtn) {
      // Remove neutral styling
      selectedBtn.classList.remove('border-primary', 'bg-primary/10');

      if (isCorrect) {
        // Show correct styling
        selectedBtn.classList.add('border-green-500', 'bg-green-500/20');
        this._updateStatus(`✓ ${t('party.correct')} +${points} pts`);
      } else {
        // Show incorrect styling
        selectedBtn.classList.add('border-red-500', 'bg-red-500/20');
        this._updateStatus(`✗ ${t('party.incorrect')}`);
      }
    }
  }

  /**
   * Start the timer.
   *
   * @private
   */
  _startTimer() {
    const timerText = this.querySelector('#timerText');
    const progressBar = this.querySelector('#progressBar');

    this.timerInterval = setInterval(() => {
      // Support both new (local state) and legacy (session) approaches
      let remaining;
      let total;

      if (this.session) {
        remaining = this.session.getTimeRemaining();
        total = this.session.secondsPerQuestion * 1000;
      } else {
        // Calculate remaining time from questionStartTime
        const elapsed = Date.now() - this.questionStartTime;
        total = this.secondsPerQuestion * 1000;
        remaining = Math.max(0, total - elapsed);
      }

      const seconds = Math.ceil(remaining / 1000);
      const progress = (remaining / total) * 100;

      if (timerText) {
        timerText.textContent = String(seconds);

        // Change color when low
        if (seconds <= 5) {
          timerText.classList.remove('text-primary');
          timerText.classList.add('text-red-500');
        } else {
          timerText.classList.remove('text-red-500');
          timerText.classList.add('text-primary');
        }
      }

      if (progressBar) {
        progressBar.style.width = `${progress}%`;

        if (seconds <= 5) {
          progressBar.classList.remove('bg-primary');
          progressBar.classList.add('bg-red-500');
        } else {
          progressBar.classList.remove('bg-red-500');
          progressBar.classList.add('bg-primary');
        }
      }

      // Handle timer expiration for non-session mode
      if (!this.session && remaining <= 0) {
        this._onTimerExpired();
      }
    }, 100);
  }

  /**
   * Handle timer expiration (MVP mode).
   *
   * @private
   */
  async _onTimerExpired() {
    if (this.timerExpiredHandled) return;
    this.timerExpiredHandled = true;

    log.info('Timer expired');

    // Mark as answered if not already
    if (!this.hasAnswered) {
      this.hasAnswered = true;
      this._updateStatus(t('party.timeUp'));

      // Submit no-answer (-1) to record the miss
      try {
        await submitAnswerApi(
          this.roomCode,
          this.participantId,
          this.currentQuestion,
          -1, // No answer
          this.secondsPerQuestion * 1000 // Max time
        );
      } catch (error) {
        log.error('Failed to submit no-answer', { error: error.message });
      }
    }

    // Host advances to next question after a brief delay
    if (this.isHost) {
      this._updateStatus(t('party.loading'));

      // Wait 2 seconds for everyone to see feedback
      setTimeout(async () => {
        try {
          const roomData = await advanceQuestionApi(this.roomCode, this.participantId);

          if (roomData.status === 'ended') {
            this._onQuizEnd([]);
          } else {
            // Move to next question
            this._moveToQuestion(roomData.current_question, roomData);
          }
        } catch (error) {
          log.error('Failed to advance question', { error: error.message });
        }
      }, 2000);
    }
  }

  /**
   * Move to a specific question.
   *
   * @private
   * @param {number} questionIndex - Question index to move to
   * @param {Object} roomData - Room data from API
   */
  _moveToQuestion(questionIndex, roomData) {
    log.info('Moving to question', { questionIndex });

    // Update state
    this.currentQuestion = questionIndex;
    this.hasAnswered = false;
    this.timerExpiredHandled = false;
    this.questionStartTime = Date.now();

    // Get new question
    const question = this.quiz.questions[questionIndex];
    if (!question) {
      log.error('Question not found', { questionIndex });
      return;
    }

    // Shuffle new options
    this._shuffleCurrentQuestion(question);

    // Update UI
    const questionText = this.querySelector('#questionText');
    if (questionText) {
      questionText.textContent = question.question;
    }

    const optionsContainer = this.querySelector('#optionsContainer');
    if (optionsContainer) {
      optionsContainer.innerHTML = this._renderOptions(question);

      // Re-attach option listeners
      const optionBtns = optionsContainer.querySelectorAll('.option-btn');
      optionBtns.forEach((btn) => {
        this.addEventListener(btn, 'click', () => {
          if (this.hasAnswered) return;
          const index = parseInt(/** @type {HTMLElement} */ (btn).dataset.index);
          this._selectOption(index);
        });
      });
    }

    // Update header
    const header = this.querySelector('.text-sm.font-medium');
    if (header) {
      header.textContent = t('party.question', {
        current: questionIndex + 1,
        total: this.quiz.questions.length,
      });
    }

    // Update participants/scores
    if (roomData.participants) {
      this.participants = this._mapParticipants(roomData.participants);
      this._renderScoreboard();
    }

    // Reset host controls for new question (Issue #108 fix)
    this.allAnswered = false;
    const answerStatusContainer = this.querySelector('#answerStatusContainer');
    const nextQuestionBtn = this.querySelector('#nextQuestionBtn');
    if (answerStatusContainer) {
      answerStatusContainer.classList.add('hidden');
    }
    if (nextQuestionBtn) {
      nextQuestionBtn.classList.add('hidden');
      nextQuestionBtn.setAttribute('disabled', 'true');
    }

    // Reset timer display
    const timerText = this.querySelector('#timerText');
    if (timerText) {
      timerText.textContent = String(this.secondsPerQuestion);
      timerText.classList.remove('text-red-500');
      timerText.classList.add('text-primary');
    }

    const progressBar = this.querySelector('#progressBar');
    if (progressBar) {
      progressBar.style.width = '100%';
      progressBar.classList.remove('bg-red-500');
      progressBar.classList.add('bg-primary');
    }

    this._updateStatus(t('party.thinking'));
  }

  /**
   * Update status bar text.
   *
   * @private
   * @param {string} text - Status text
   */
  _updateStatus(text) {
    const statusText = this.querySelector('#statusText');
    if (statusText) {
      statusText.textContent = text;
    }
  }

  /**
   * Update answer status tracking.
   * Calculates how many participants have answered the current question.
   *
   * @private
   */
  _updateAnswerStatus() {
    // Get participants from session or local state
    const participants = this.session
      ? this.session.getParticipants()
      : this.participants;

    // Count who has answered (support both HTTP and P2P modes)
    const answered = participants.filter((p) => {
      // HTTP mode: hasAnsweredCurrent from API
      // P2P mode: status === 'answered'
      return p.hasAnsweredCurrent ?? (p.status === 'answered');
    }).length;

    const total = participants.length;
    this.allAnswered = answered === total && total > 0;

    // Update UI
    this._renderHostControls(answered, total);
  }

  /**
   * Render host controls (status indicator and Next Question button).
   *
   * @private
   * @param {number} answered - Number of participants who answered
   * @param {number} total - Total number of participants
   */
  _renderHostControls(answered, total) {
    const answerStatusContainer = this.querySelector('#answerStatusContainer');
    const statusIndicator = this.querySelector('#answer-status-indicator');
    const nextQuestionBtn = this.querySelector('#nextQuestionBtn');

    // Show status container if host has answered
    if (answerStatusContainer && this.hasAnswered) {
      answerStatusContainer.classList.remove('hidden');
    }

    // Update status indicator text
    if (statusIndicator) {
      if (this.allAnswered) {
        statusIndicator.textContent = t('party.allAnswered', { answered: total, total });
      } else {
        const waiting = total - answered;
        statusIndicator.textContent = t('party.waitingFor', { count: waiting });
      }
    }

    // Show/enable Next Question button for host
    if (nextQuestionBtn && this.isHost && this.hasAnswered) {
      nextQuestionBtn.classList.remove('hidden');

      if (this.allAnswered) {
        nextQuestionBtn.removeAttribute('disabled');
      } else {
        nextQuestionBtn.setAttribute('disabled', 'true');
      }
    }
  }

  /**
   * Handle click on Next Question button (host only).
   *
   * @private
   */
  async _onNextQuestionClick() {
    // Prevent double-click and race with timer
    if (this.timerExpiredHandled) return;
    this.timerExpiredHandled = true;

    log.info('Host clicked Next Question');

    // Disable button immediately to prevent double-click
    const nextQuestionBtn = this.querySelector('#nextQuestionBtn');
    if (nextQuestionBtn) {
      nextQuestionBtn.setAttribute('disabled', 'true');
    }

    this._updateStatus(t('party.loading'));

    try {
      const roomData = await advanceQuestionApi(this.roomCode, this.participantId);

      if (roomData.status === 'ended') {
        this._onQuizEnd([]);
      } else {
        // Move to next question
        this._moveToQuestion(roomData.current_question, roomData);
      }
    } catch (error) {
      log.error('Failed to advance question', { error: error.message });
      // Re-enable button on error
      this.timerExpiredHandled = false;
      if (nextQuestionBtn) {
        nextQuestionBtn.removeAttribute('disabled');
      }
    }
  }

  /**
   * Handle quiz end.
   *
   * @private
   * @param {Array} standings - Final standings
   */
  _onQuizEnd(standings) {
    log.info('Quiz ended, navigating to results');

    // Stop timer and polling
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this._stopPolling();

    // Navigate to results view with room code
    if (this.roomCode) {
      this.navigateTo(`/party/results/${this.roomCode}`);
    } else if (this.session) {
      // Legacy mode: navigate with standings
      this.navigateTo('/');
    } else {
      this.navigateTo('/');
    }
  }

  /**
   * Start polling for room updates (MVP mode).
   *
   * @private
   */
  _startPolling() {
    if (this.session || this.pollInterval) return;

    log.info('Starting poll for room updates');

    this.pollInterval = setInterval(async () => {
      try {
        const roomData = await getRoom(this.roomCode);

        // Check if quiz ended
        if (roomData.status === 'ended') {
          log.info('Quiz ended via poll');
          this._onQuizEnd([]);
          return;
        }

        // Check for question change (non-host only, host controls advancement)
        const serverQuestion = roomData.current_question ?? 0;
        if (serverQuestion !== this.currentQuestion) {
          log.info('Question changed via poll', { from: this.currentQuestion, to: serverQuestion });
          this._moveToQuestion(serverQuestion, roomData);
          return;
        }

        // Update participants/scores
        const newParticipants = this._mapParticipants(roomData.participants || []);
        if (JSON.stringify(newParticipants) !== JSON.stringify(this.participants)) {
          this.participants = newParticipants;
          this._renderScoreboard();
          // Update answer status for host controls
          if (this.hasAnswered) {
            this._updateAnswerStatus();
          }
        }
      } catch (error) {
        log.error('Poll failed', { error: error.message });
      }
    }, POLL_INTERVAL_MS);
  }

  /**
   * Stop polling for room updates.
   *
   * @private
   */
  _stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  destroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this._stopPolling();
    super.destroy();
  }
}
