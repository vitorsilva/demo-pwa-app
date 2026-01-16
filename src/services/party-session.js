/**
 * Party Session Manager
 *
 * Manages party session state for both host and guest.
 * Coordinates quiz progression, scoring, and results.
 *
 * @module services/party-session
 */

import { logger } from '../utils/logger.js';
import { telemetry } from '../utils/telemetry.js';

const log = logger.child({ module: 'party-session' });

/**
 * Scoring configuration.
 */
export const SCORING = {
  basePoints: 10,           // Points for correct answer
  maxSpeedBonus: 5,         // Maximum bonus for fast answers
  speedBonusWindow: 5000,   // Milliseconds to get full speed bonus
  wrongAnswerPoints: 0,     // No points for wrong answers
  noAnswerPoints: 0,        // No points for timeout
};

/**
 * Message types for P2P communication.
 */
export const MESSAGE_TYPES = {
  // Host → Guests
  SESSION_INFO: 'session_info',     // Quiz data and settings
  QUIZ_START: 'quiz_start',         // Start time for synchronization
  SCORE_UPDATE: 'score_update',     // Live score updates
  QUIZ_END: 'quiz_end',             // Final results
  KICK: 'kick',                     // Remove participant

  // Guests → Host
  ANSWER: 'answer',                 // Answer submission
  LEAVE: 'leave',                   // Participant leaving
};

/**
 * Session states.
 */
export const SESSION_STATES = {
  WAITING: 'waiting',       // In lobby, waiting for participants
  PLAYING: 'playing',       // Quiz in progress
  FINISHED: 'finished',     // Quiz completed
  ENDED: 'ended',           // Session terminated
};

/**
 * @typedef {Object} Participant
 * @property {string} id - Participant ID
 * @property {string} name - Display name
 * @property {boolean} isHost - Whether this is the host
 * @property {number} score - Current score
 * @property {number[]} answers - Answer indices for each question
 * @property {number[]} answerTimes - Time taken for each answer (ms)
 * @property {'connected'|'disconnected'|'answered'|'thinking'} status - Current status
 */

/**
 * @typedef {Object} SessionState
 * @property {string} roomCode - Room code
 * @property {string} state - Session state
 * @property {Object|null} quiz - Quiz data
 * @property {number} startTime - Quiz start timestamp
 * @property {number} secondsPerQuestion - Time per question
 * @property {number} currentQuestion - Current question index
 * @property {Map<string, Participant>} participants - Participants map
 */

/**
 * Calculate points for an answer.
 *
 * @param {boolean} correct - Whether the answer was correct
 * @param {number} responseTimeMs - Time taken to answer in milliseconds
 * @returns {number} Points earned
 */
export function calculatePoints(correct, responseTimeMs) {
  if (!correct) {
    return SCORING.wrongAnswerPoints;
  }

  // Base points for correct answer
  let points = SCORING.basePoints;

  // Speed bonus: faster answers get more bonus points
  if (responseTimeMs < SCORING.speedBonusWindow) {
    const speedRatio = 1 - (responseTimeMs / SCORING.speedBonusWindow);
    points += Math.round(SCORING.maxSpeedBonus * speedRatio);
  }

  return points;
}

/**
 * Calculate current question index from start time.
 *
 * @param {number} startTime - Quiz start timestamp
 * @param {number} secondsPerQuestion - Time per question in seconds
 * @param {number} totalQuestions - Total number of questions
 * @returns {number} Current question index (0-based), or -1 if not started
 */
export function getCurrentQuestionIndex(startTime, secondsPerQuestion, totalQuestions) {
  if (!startTime) return -1;

  const elapsed = Date.now() - startTime;
  const questionTime = secondsPerQuestion * 1000;
  const index = Math.floor(elapsed / questionTime);

  return Math.min(index, totalQuestions - 1);
}

/**
 * Calculate time remaining in current question.
 *
 * @param {number} startTime - Quiz start timestamp
 * @param {number} secondsPerQuestion - Time per question in seconds
 * @returns {number} Milliseconds remaining, or 0 if not started
 */
export function getTimeRemaining(startTime, secondsPerQuestion) {
  if (!startTime) return 0;

  const elapsed = Date.now() - startTime;
  const questionTime = secondsPerQuestion * 1000;
  const timeInQuestion = elapsed % questionTime;

  return questionTime - timeInQuestion;
}

/**
 * Party Session class.
 */
export class PartySession {
  /**
   * Create a PartySession.
   *
   * @param {import('./p2p-service.js').P2PService} p2pService - P2P service instance
   * @param {boolean} isHost - Whether this instance is the host
   */
  constructor(p2pService, isHost) {
    /** @type {import('./p2p-service.js').P2PService} */
    this.p2p = p2pService;

    /** @type {boolean} */
    this.isHost = isHost;

    /** @type {string} */
    this.participantId = `${isHost ? 'host' : 'guest'}-${Date.now()}`;

    /** @type {string} */
    this.participantName = '';

    /** @type {string} */
    this.roomCode = '';

    /** @type {string} */
    this.state = SESSION_STATES.WAITING;

    /** @type {Object|null} */
    this.quiz = null;

    /** @type {number} */
    this.startTime = 0;

    /** @type {number} */
    this.secondsPerQuestion = 30;

    /** @type {number} */
    this.currentQuestion = -1;

    /** @type {Map<string, Participant>} */
    this.participants = new Map();

    /** @type {Function|null} */
    this.onStateChangeCallback = null;

    /** @type {Function|null} */
    this.onParticipantsChangeCallback = null;

    /** @type {Function|null} */
    this.onQuestionChangeCallback = null;

    /** @type {Function|null} */
    this.onScoreUpdateCallback = null;

    /** @type {Function|null} */
    this.onQuizEndCallback = null;

    /** @type {number|null} */
    this.questionTimer = null;

    // Set up P2P message handler
    this._setupMessageHandler();

    log.info('PartySession created', { isHost });
  }

  /**
   * Set up the P2P message handler.
   *
   * @private
   */
  _setupMessageHandler() {
    this.p2p.onMessage((peerId, message) => {
      this._handleMessage(peerId, message);
    });

    this.p2p.onPeerConnected((peerId) => {
      log.info('Peer connected', { peerId });
      if (this.isHost) {
        this._sendSessionInfo(peerId);
      }
    });

    this.p2p.onPeerDisconnected((peerId, reason) => {
      log.info('Peer disconnected', { peerId, reason });
      this._handlePeerDisconnected(peerId);
    });
  }

  /**
   * Handle incoming P2P messages.
   *
   * @private
   * @param {string} peerId - Sender peer ID
   * @param {Object} message - Message object
   */
  _handleMessage(peerId, message) {
    const { type, payload } = message;

    log.debug('Received message', { peerId, type });

    switch (type) {
      case MESSAGE_TYPES.SESSION_INFO:
        this._handleSessionInfo(payload);
        break;

      case MESSAGE_TYPES.QUIZ_START:
        this._handleQuizStart(payload);
        break;

      case MESSAGE_TYPES.ANSWER:
        if (this.isHost) {
          this._handleAnswer(peerId, payload);
        }
        break;

      case MESSAGE_TYPES.SCORE_UPDATE:
        this._handleScoreUpdate(payload);
        break;

      case MESSAGE_TYPES.QUIZ_END:
        this._handleQuizEnd(payload);
        break;

      case MESSAGE_TYPES.LEAVE:
        this._handleParticipantLeave(peerId);
        break;

      default:
        log.warn('Unknown message type', { type });
    }
  }

  // ============================================
  // HOST METHODS
  // ============================================

  /**
   * Create a new session (host only).
   *
   * @param {Object} quiz - Quiz data
   * @param {string} roomCode - Room code
   * @param {string} hostName - Host's display name
   * @param {number} [secondsPerQuestion=30] - Time per question
   */
  createSession(quiz, roomCode, hostName, secondsPerQuestion = 30) {
    if (!this.isHost) {
      throw new Error('Only host can create session');
    }

    this.quiz = quiz;
    this.roomCode = roomCode;
    this.participantName = hostName;
    this.secondsPerQuestion = secondsPerQuestion;
    this.state = SESSION_STATES.WAITING;

    // Add host as first participant
    this.participants.set(this.participantId, {
      id: this.participantId,
      name: hostName,
      isHost: true,
      score: 0,
      answers: [],
      answerTimes: [],
      status: 'connected',
    });

    this._notifyParticipantsChange();

    // Track telemetry
    telemetry.track('party_room_created', { roomCode });

    log.info('Session created', { roomCode, quiz: quiz.topic });
  }

  /**
   * Send session info to a newly connected peer.
   *
   * @private
   * @param {string} peerId - Peer to send info to
   */
  _sendSessionInfo(peerId) {
    this.p2p.send(peerId, {
      type: MESSAGE_TYPES.SESSION_INFO,
      payload: {
        quiz: this.quiz,
        roomCode: this.roomCode,
        secondsPerQuestion: this.secondsPerQuestion,
        participants: Array.from(this.participants.values()),
        state: this.state,
      },
    });
  }

  /**
   * Add a participant (host only, called when guest joins).
   *
   * @param {string} peerId - Peer ID
   * @param {string} name - Participant name
   */
  addParticipant(peerId, name) {
    if (!this.isHost) return;

    /** @type {Participant} */
    const participant = {
      id: peerId,
      name,
      isHost: false,
      score: 0,
      answers: [],
      answerTimes: [],
      status: 'connected',
    };

    this.participants.set(peerId, participant);
    this._notifyParticipantsChange();
    this._broadcastParticipants();

    // Track telemetry
    telemetry.track('party_room_joined', {
      roomCode: this.roomCode,
      participantCount: this.participants.size,
    });

    log.info('Participant added', { peerId, name });
  }

  /**
   * Start the quiz (host only).
   */
  startQuiz() {
    if (!this.isHost) {
      throw new Error('Only host can start quiz');
    }

    if (this.state !== SESSION_STATES.WAITING) {
      throw new Error('Quiz already started');
    }

    this.startTime = Date.now();
    this.state = SESSION_STATES.PLAYING;
    this.currentQuestion = 0;

    // Update all participants to "thinking" status
    for (const participant of this.participants.values()) {
      participant.status = 'thinking';
    }

    // Broadcast start time to all peers
    this.p2p.broadcast({
      type: MESSAGE_TYPES.QUIZ_START,
      payload: {
        startTime: this.startTime,
      },
    });

    this._notifyStateChange();
    this._notifyParticipantsChange();
    this._startQuestionTimer();

    // Track telemetry
    telemetry.track('party_room_started', {
      roomCode: this.roomCode,
      participantCount: this.participants.size,
      questionCount: this.quiz.questions.length,
    });

    log.info('Quiz started', { startTime: this.startTime });
  }

  /**
   * Handle an answer from a guest (host only).
   *
   * @private
   * @param {string} peerId - Peer who answered
   * @param {Object} payload - Answer payload
   */
  _handleAnswer(peerId, payload) {
    const { questionIndex, answerIndex, timestamp } = payload;

    const participant = this.participants.get(peerId);
    if (!participant) {
      log.warn('Answer from unknown participant', { peerId });
      return;
    }

    // Ignore if already answered this question
    if (participant.answers[questionIndex] !== undefined) {
      log.debug('Duplicate answer ignored', { peerId, questionIndex });
      return;
    }

    // Calculate response time
    const questionStartTime = this.startTime + (questionIndex * this.secondsPerQuestion * 1000);
    const responseTime = timestamp - questionStartTime;

    // Check if correct
    const question = this.quiz.questions[questionIndex];
    const isCorrect = answerIndex === question.correct;

    // Calculate points
    const points = calculatePoints(isCorrect, responseTime);

    // Update participant
    participant.answers[questionIndex] = answerIndex;
    participant.answerTimes[questionIndex] = responseTime;
    participant.score += points;
    participant.status = 'answered';

    this._notifyParticipantsChange();
    this._broadcastScoreUpdate();

    // Track telemetry
    telemetry.track('party_answer_submitted', {
      roomCode: this.roomCode,
      questionIndex,
      responseTime,
      correct: isCorrect,
    });

    log.info('Answer received', {
      peerId,
      questionIndex,
      isCorrect,
      points,
      totalScore: participant.score,
    });
  }

  /**
   * Handle host's own answer.
   *
   * @param {number} questionIndex - Question index
   * @param {number} answerIndex - Selected answer index
   */
  submitHostAnswer(questionIndex, answerIndex) {
    if (!this.isHost) return;

    const participant = this.participants.get(this.participantId);
    if (!participant) return;

    // Ignore if already answered
    if (participant.answers[questionIndex] !== undefined) return;

    const questionStartTime = this.startTime + (questionIndex * this.secondsPerQuestion * 1000);
    const responseTime = Date.now() - questionStartTime;

    const question = this.quiz.questions[questionIndex];
    const isCorrect = answerIndex === question.correct;
    const points = calculatePoints(isCorrect, responseTime);

    participant.answers[questionIndex] = answerIndex;
    participant.answerTimes[questionIndex] = responseTime;
    participant.score += points;
    participant.status = 'answered';

    this._notifyParticipantsChange();
    this._broadcastScoreUpdate();
  }

  /**
   * Start the question timer.
   *
   * @private
   */
  _startQuestionTimer() {
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
    }

    this.questionTimer = setInterval(() => {
      const newQuestion = getCurrentQuestionIndex(
        this.startTime,
        this.secondsPerQuestion,
        this.quiz.questions.length
      );

      if (newQuestion !== this.currentQuestion) {
        this.currentQuestion = newQuestion;

        // Reset participant status for new question
        for (const participant of this.participants.values()) {
          if (participant.answers[newQuestion] === undefined) {
            participant.status = 'thinking';
          }
        }

        this._notifyQuestionChange();
        this._notifyParticipantsChange();

        // Check if quiz is finished
        if (newQuestion >= this.quiz.questions.length - 1) {
          // Wait for the last question to complete
          setTimeout(() => {
            this._endQuiz();
          }, this.secondsPerQuestion * 1000);
        }
      }
    }, 100); // Check every 100ms
  }

  /**
   * End the quiz (host only).
   *
   * @private
   */
  _endQuiz() {
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
      this.questionTimer = null;
    }

    this.state = SESSION_STATES.FINISHED;

    // Get final standings
    const standings = this.getStandings();

    // Broadcast end to all peers
    this.p2p.broadcast({
      type: MESSAGE_TYPES.QUIZ_END,
      payload: {
        standings,
      },
    });

    this._notifyStateChange();
    if (this.onQuizEndCallback) {
      this.onQuizEndCallback(standings);
    }

    // Track telemetry
    const duration = Date.now() - this.startTime;
    telemetry.track('party_room_ended', {
      roomCode: this.roomCode,
      participantCount: this.participants.size,
      duration,
    });

    log.info('Quiz ended', { standings: standings.map(p => ({ name: p.name, score: p.score })) });
  }

  /**
   * Broadcast score update to all peers.
   *
   * @private
   */
  _broadcastScoreUpdate() {
    const scores = Array.from(this.participants.values()).map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      status: p.status,
    }));

    this.p2p.broadcast({
      type: MESSAGE_TYPES.SCORE_UPDATE,
      payload: { scores },
    });

    if (this.onScoreUpdateCallback) {
      this.onScoreUpdateCallback(scores);
    }
  }

  /**
   * Broadcast participants list to all peers.
   *
   * @private
   */
  _broadcastParticipants() {
    const participants = Array.from(this.participants.values());

    // Send updated session info to all peers
    for (const [peerId] of this.p2p.peers || new Map()) {
      this._sendSessionInfo(peerId);
    }
  }

  /**
   * End the session.
   */
  endSession() {
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
      this.questionTimer = null;
    }

    this.state = SESSION_STATES.ENDED;
    this.p2p.destroy();
    this._notifyStateChange();

    log.info('Session ended');
  }

  // ============================================
  // GUEST METHODS
  // ============================================

  /**
   * Join a session (guest only).
   *
   * @param {string} roomCode - Room code
   * @param {string} name - Guest's display name
   */
  joinSession(roomCode, name) {
    if (this.isHost) {
      throw new Error('Host cannot join as guest');
    }

    this.roomCode = roomCode;
    this.participantName = name;

    log.info('Joining session', { roomCode, name });
  }

  /**
   * Handle session info from host.
   *
   * @private
   * @param {Object} payload - Session info
   */
  _handleSessionInfo(payload) {
    if (this.isHost) return;

    const { quiz, roomCode, secondsPerQuestion, participants, state } = payload;

    this.quiz = quiz;
    this.roomCode = roomCode;
    this.secondsPerQuestion = secondsPerQuestion;
    this.state = state;

    // Update participants
    this.participants.clear();
    for (const p of participants) {
      this.participants.set(p.id, p);
    }

    // Add self if not in list
    if (!this.participants.has(this.participantId)) {
      this.participants.set(this.participantId, {
        id: this.participantId,
        name: this.participantName,
        isHost: false,
        score: 0,
        answers: [],
        answerTimes: [],
        status: 'connected',
      });
    }

    this._notifyStateChange();
    this._notifyParticipantsChange();

    log.info('Session info received', { quiz: quiz?.topic, participants: participants.length });
  }

  /**
   * Handle quiz start from host.
   *
   * @private
   * @param {Object} payload - Start info
   */
  _handleQuizStart(payload) {
    if (this.isHost) return;

    this.startTime = payload.startTime;
    this.state = SESSION_STATES.PLAYING;
    this.currentQuestion = 0;

    this._notifyStateChange();
    this._startGuestQuestionTracker();

    log.info('Quiz started (guest)', { startTime: this.startTime });
  }

  /**
   * Start tracking question changes (guest).
   *
   * @private
   */
  _startGuestQuestionTracker() {
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
    }

    this.questionTimer = setInterval(() => {
      const newQuestion = getCurrentQuestionIndex(
        this.startTime,
        this.secondsPerQuestion,
        this.quiz.questions.length
      );

      if (newQuestion !== this.currentQuestion) {
        this.currentQuestion = newQuestion;
        this._notifyQuestionChange();
      }
    }, 100);
  }

  /**
   * Submit an answer (guest only).
   *
   * @param {number} questionIndex - Question index
   * @param {number} answerIndex - Selected answer index
   */
  submitAnswer(questionIndex, answerIndex) {
    if (this.isHost) {
      this.submitHostAnswer(questionIndex, answerIndex);
      return;
    }

    // Send answer to host
    this.p2p.broadcast({
      type: MESSAGE_TYPES.ANSWER,
      payload: {
        questionIndex,
        answerIndex,
        timestamp: Date.now(),
      },
    });

    // Update local participant status
    const participant = this.participants.get(this.participantId);
    if (participant) {
      participant.answers[questionIndex] = answerIndex;
      participant.status = 'answered';
      this._notifyParticipantsChange();
    }

    log.info('Answer submitted', { questionIndex, answerIndex });
  }

  /**
   * Handle score update from host.
   *
   * @private
   * @param {Object} payload - Score update
   */
  _handleScoreUpdate(payload) {
    if (this.isHost) return;

    const { scores } = payload;

    for (const score of scores) {
      const participant = this.participants.get(score.id);
      if (participant) {
        participant.score = score.score;
        participant.status = score.status;
      }
    }

    this._notifyParticipantsChange();
    if (this.onScoreUpdateCallback) {
      this.onScoreUpdateCallback(scores);
    }
  }

  /**
   * Handle quiz end from host.
   *
   * @private
   * @param {Object} payload - End info
   */
  _handleQuizEnd(payload) {
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
      this.questionTimer = null;
    }

    this.state = SESSION_STATES.FINISHED;
    this._notifyStateChange();

    if (this.onQuizEndCallback) {
      this.onQuizEndCallback(payload.standings);
    }

    log.info('Quiz ended (guest)');
  }

  /**
   * Leave the session (guest only).
   */
  leaveSession() {
    // Notify host
    this.p2p.broadcast({
      type: MESSAGE_TYPES.LEAVE,
      payload: { participantId: this.participantId },
    });

    if (this.questionTimer) {
      clearInterval(this.questionTimer);
      this.questionTimer = null;
    }

    this.state = SESSION_STATES.ENDED;
    this.p2p.destroy();

    // Track telemetry
    telemetry.track('party_room_left', {
      roomCode: this.roomCode,
      reason: 'user_left',
    });

    log.info('Left session');
  }

  /**
   * Handle participant leaving.
   *
   * @private
   * @param {string} peerId - Peer who left
   */
  _handleParticipantLeave(peerId) {
    this.participants.delete(peerId);
    this._notifyParticipantsChange();

    if (this.isHost) {
      this._broadcastParticipants();
    }

    // Track telemetry
    telemetry.track('party_room_left', {
      roomCode: this.roomCode,
      reason: 'participant_left',
    });

    log.info('Participant left', { peerId });
  }

  /**
   * Handle peer disconnection.
   *
   * @private
   * @param {string} peerId - Disconnected peer
   */
  _handlePeerDisconnected(peerId) {
    const participant = this.participants.get(peerId);
    if (participant) {
      participant.status = 'disconnected';
      this._notifyParticipantsChange();

      // Track telemetry
      telemetry.track('p2p_disconnected', {
        roomCode: this.roomCode,
        peerId,
        reason: 'connection_lost',
      });
    }
  }

  // ============================================
  // SHARED METHODS
  // ============================================

  /**
   * Get current question data.
   *
   * @returns {Object|null} Current question or null
   */
  getCurrentQuestion() {
    if (!this.quiz || this.currentQuestion < 0) return null;
    return this.quiz.questions[this.currentQuestion];
  }

  /**
   * Get time remaining for current question.
   *
   * @returns {number} Milliseconds remaining
   */
  getTimeRemaining() {
    return getTimeRemaining(this.startTime, this.secondsPerQuestion);
  }

  /**
   * Get all participants.
   *
   * @returns {Participant[]} Participants array
   */
  getParticipants() {
    return Array.from(this.participants.values());
  }

  /**
   * Get standings sorted by score.
   *
   * @returns {Participant[]} Sorted participants
   */
  getStandings() {
    return Array.from(this.participants.values())
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get own participant data.
   *
   * @returns {Participant|null}
   */
  getSelf() {
    return this.participants.get(this.participantId) || null;
  }

  // ============================================
  // CALLBACKS
  // ============================================

  /**
   * Set callback for state changes.
   *
   * @param {Function} callback - Called with (state)
   */
  onStateChange(callback) {
    this.onStateChangeCallback = callback;
  }

  /**
   * Set callback for participants changes.
   *
   * @param {Function} callback - Called with (participants)
   */
  onParticipantsChange(callback) {
    this.onParticipantsChangeCallback = callback;
  }

  /**
   * Set callback for question changes.
   *
   * @param {Function} callback - Called with (questionIndex, question)
   */
  onQuestionChange(callback) {
    this.onQuestionChangeCallback = callback;
  }

  /**
   * Set callback for score updates.
   *
   * @param {Function} callback - Called with (scores)
   */
  onScoreUpdate(callback) {
    this.onScoreUpdateCallback = callback;
  }

  /**
   * Set callback for quiz end.
   *
   * @param {Function} callback - Called with (standings)
   */
  onQuizEnd(callback) {
    this.onQuizEndCallback = callback;
  }

  /**
   * Notify state change.
   *
   * @private
   */
  _notifyStateChange() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.state);
    }
  }

  /**
   * Notify participants change.
   *
   * @private
   */
  _notifyParticipantsChange() {
    if (this.onParticipantsChangeCallback) {
      this.onParticipantsChangeCallback(this.getParticipants());
    }
  }

  /**
   * Notify question change.
   *
   * @private
   */
  _notifyQuestionChange() {
    if (this.onQuestionChangeCallback) {
      this.onQuestionChangeCallback(this.currentQuestion, this.getCurrentQuestion());
    }
  }

  /**
   * Clean up resources.
   */
  destroy() {
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
      this.questionTimer = null;
    }

    this.onStateChangeCallback = null;
    this.onParticipantsChangeCallback = null;
    this.onQuestionChangeCallback = null;
    this.onScoreUpdateCallback = null;
    this.onQuizEndCallback = null;

    log.info('PartySession destroyed');
  }
}
