/**
 * Party Lobby View
 *
 * Waiting room for party participants.
 * Shows room info, participants, and waiting status.
 */

import BaseView from './BaseView.js';
import { t } from '../core/i18n.js';
import { createParticipantList } from '../components/ParticipantList.js';
import { logger } from '../utils/logger.js';
import router from '../core/router.js';
import { getRoom, leaveRoom } from '../services/party-api.js';
import {
  CONNECTION_MODES,
} from '../services/party-connection-manager.js';
import { getConnection, clearConnection } from '../services/party-connection-store.js';

const log = logger.child({ module: 'PartyLobbyView' });

/** @type {number} Polling interval for room updates (ms) */
const POLL_INTERVAL_MS = 2000;

export default class PartyLobbyView extends BaseView {
  /**
   * @param {Object} [options]
   * @param {string} [options.roomCode] - Room code
   * @param {boolean} [options.isHost=false] - Whether current user is host
   */
  constructor(options = {}) {
    super();
    // Check for code from router (URL) or constructor options
    this.roomCode = options.roomCode || router.getPartyLobbyCode() || '';
    this.isHost = options.isHost || false;
    this.participants = [];
    this.quizInfo = null;
    this.pollInterval = null;
    // Get participant ID from session storage (set during join)
    this.participantId = sessionStorage.getItem('partyParticipantId') || '';
    this.roomStatus = 'waiting';
    this.connectionManager = null;
  }

  async render() {
    // Retrieve connection manager from store (set by JoinPartyView)
    this.connectionManager = getConnection();

    if (this.connectionManager) {
      // Set up P2P event handlers
      this.connectionManager.onModeChange((mode, previousMode) => {
        log.info('Connection mode changed', { from: previousMode, to: mode });
        this._updateConnectionStatus(mode);
      });

      this.connectionManager.onPeerJoined((peerId) => {
        log.info('Peer joined via P2P', { peerId });
        this._pollParticipants();
      });

      this.connectionManager.onPeerLeft((peerId) => {
        log.info('Peer left', { peerId });
        this._pollParticipants();
      });

      this.connectionManager.onError((error) => {
        log.warn('P2P connection error', { error: error.message });
      });

      // Check current mode and start polling if in fallback
      if (this.connectionManager.getMode() === CONNECTION_MODES.HTTP_FALLBACK) {
        log.info('Starting in HTTP fallback mode');
      }
    } else {
      log.warn('No connection manager found - using HTTP polling only');
    }

    // Fetch room info from API
    try {
      const roomData = await getRoom(this.roomCode);
      this._updateFromRoomData(roomData);
    } catch (error) {
      log.error('Failed to fetch room', { error: error.message });
      // Room might not exist anymore
      alert(t('party.roomNotFound'));
      this.navigateTo('/');
      return;
    }

    this.setHTML(`
      <div class="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
        <!-- Header -->
        <div class="flex items-center p-4 gap-4 bg-background-light dark:bg-background-dark">
          <h1 class="text-text-light dark:text-text-dark text-lg font-bold flex-1">
            ${t('party.code')}: ${this.roomCode}
          </h1>
        </div>

        <div class="flex-grow px-4 pb-24">
          <!-- Waiting Status -->
          <div class="text-center py-8">
            <div class="text-6xl mb-4">⏳</div>
            <p class="text-text-light dark:text-text-dark text-lg font-medium">
              ${t('party.waiting')}
            </p>
          </div>

          <!-- Quiz Info -->
          <div class="bg-card-light dark:bg-card-dark rounded-xl p-4 mb-6">
            <h3 class="text-text-light dark:text-text-dark font-bold mb-2">
              ${this.quizInfo?.topic || t('party.quizFallback')}
            </h3>
            <p class="text-subtext-light dark:text-subtext-dark text-sm">
              ${this.quizInfo?.questionCount || '?'} ${t('party.questionsLabel')} • ${this.quizInfo?.secondsPerQuestion || 30} ${t('party.secEach')}
            </p>
          </div>

          <!-- Participant List -->
          <div id="participantContainer" class="mb-6"></div>

          <!-- Leave Button -->
          <button
            id="leaveBtn"
            class="w-full py-3 rounded-xl border-2 border-red-500 text-red-500 font-medium
                   hover:bg-red-500/10 transition-colors"
          >
            ${t('party.leave')}
          </button>
        </div>

        <!-- Connection Status Bar -->
        <div id="connectionStatusBar" class="fixed bottom-0 left-0 right-0 py-3 bg-blue-500 text-white text-center text-sm">
          <span class="material-symbols-outlined text-sm align-middle mr-1">wifi</span>
          ${t('party.connected')}
        </div>
      </div>
    `);

    // Render participant list
    this.updateParticipantList();

    this.attachListeners();

    // Check connection mode and update status bar
    if (this.connectionManager) {
      const mode = this.connectionManager.getMode();
      this._updateConnectionStatus(mode);

      // Only start polling if in HTTP fallback mode or still connecting
      if (mode === CONNECTION_MODES.HTTP_FALLBACK || mode === CONNECTION_MODES.CONNECTING) {
        this._startPolling();
      }
    } else {
      // No connection manager - use HTTP polling only
      this._startPolling();
    }
  }

  /**
   * Update view state from API room data.
   * @param {Object} roomData - Room data from API
   */
  _updateFromRoomData(roomData) {
    // Extract quiz info
    const quiz = roomData.quiz_data;
    if (quiz) {
      this.quizInfo = {
        topic: quiz.topic || t('party.quizFallback'),
        questionCount: quiz.questions?.length || quiz.totalQuestions || 10,
        secondsPerQuestion: roomData.seconds_per_question || 30,
      };
    }

    // Map participants
    this.participants = (roomData.participants || []).map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost === true,
      isYou: p.id === this.participantId,
      status: 'connected',
    }));

    this.roomStatus = roomData.status || 'waiting';
  }

  /**
   * Start polling for room updates.
   * Only used in HTTP fallback mode.
   */
  _startPolling() {
    if (this.pollInterval) return;

    log.info('Starting HTTP polling for room', { roomCode: this.roomCode });

    this.pollInterval = setInterval(() => {
      this._pollParticipants();
    }, POLL_INTERVAL_MS);
  }

  /**
   * Stop polling for room updates.
   */
  _stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Update UI based on connection mode.
   * @param {string} mode - Connection mode from CONNECTION_MODES
   */
  _updateConnectionStatus(mode) {
    const statusBar = this.querySelector('#connectionStatusBar');
    if (!statusBar) return;

    if (mode === CONNECTION_MODES.P2P) {
      statusBar.className = 'fixed bottom-0 left-0 right-0 py-3 bg-green-500 text-white text-center text-sm';
      statusBar.innerHTML = `
        <span class="material-symbols-outlined text-sm align-middle mr-1">wifi</span>
        ${t('party.connectedP2P')}
      `;
    } else if (mode === CONNECTION_MODES.HTTP_FALLBACK) {
      statusBar.className = 'fixed bottom-0 left-0 right-0 py-3 bg-yellow-500 text-white text-center text-sm';
      statusBar.innerHTML = `
        <span class="material-symbols-outlined text-sm align-middle mr-1">cloud</span>
        ${t('party.connectedServer')}
      `;
      // Start HTTP polling in fallback mode
      this._startPolling();
    } else if (mode === CONNECTION_MODES.CONNECTING) {
      statusBar.className = 'fixed bottom-0 left-0 right-0 py-3 bg-blue-500 text-white text-center text-sm';
      statusBar.innerHTML = `
        <span class="material-symbols-outlined text-sm align-middle mr-1 animate-spin">sync</span>   
        ${t('party.connecting')}
      `;
    }
  }

  /**
   * Fetch participants once from the server.
   */
  async _pollParticipants() {
    try {
      const roomData = await getRoom(this.roomCode);

      // Check if quiz started
      if (roomData.status === 'playing' && this.roomStatus !== 'playing') {
        log.info('Quiz started by host');
        this._stopPolling();
        this.navigateTo(`/party/quiz/${this.roomCode}`);
        return;
      }

      // Check if room ended
      if (roomData.status === 'ended') {
        log.info('Room ended');
        this._stopPolling();
        alert(t('party.hostLeft'));
        this.navigateTo('/');
        return;
      }

      // Update participants
      const newParticipants = (roomData.participants || []).map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost === true,
        isYou: p.id === this.participantId,
        status: 'connected',
      }));

      if (JSON.stringify(newParticipants) !== JSON.stringify(this.participants)) {
        log.info('Participants updated', { count: newParticipants.length });
        this.participants = newParticipants;
        this.updateParticipantList();
      }
    } catch (error) {
      log.error('Failed to fetch participants', { error: error.message });
    }
  }


  updateParticipantList() {
    const container = this.querySelector('#participantContainer');
    if (container) {
      container.innerHTML = '';
      const list = createParticipantList(this.participants, {
        showStatus: true,
      });
      container.appendChild(list);
    }
  }

  attachListeners() {
    // Leave button
    const leaveBtn = this.querySelector('#leaveBtn');
    this.addEventListener(leaveBtn, 'click', () => this.leaveParty());
  }

  async leaveParty() {
    this._stopPolling();

    // Call API to leave room
    if (this.roomCode && this.participantId) {
      try {
        await leaveRoom(this.roomCode, this.participantId);
      } catch (error) {
        log.error('Failed to leave room', { error: error.message });
      }
    }

    // Clear session storage
    sessionStorage.removeItem('partyParticipantId');
    sessionStorage.removeItem('partyRoomCode');

    log.info('Left party', { roomCode: this.roomCode });
    this.navigateTo('/');
  }

  /**
   * Called when host starts the quiz.
   * @param {Object} quizData - Quiz data from host
   */
  onQuizStart(quizData) {
    log.info('Quiz started', { roomCode: this.roomCode });
    this.navigateTo(`/party/quiz/${this.roomCode}`);
  }

  /**
   * Called when host ends the party.
   */
  onHostLeft() {
    log.info('Host left party', { roomCode: this.roomCode });
    alert(t('party.hostLeft'));
    this.navigateTo('/');
  }

  /**
   * Called when a participant joins or leaves.
   * @param {Array} participants - Updated participant list
   */
  onParticipantsChanged(participants) {
    this.participants = participants;
    this.updateParticipantList();
  }

  destroy() {
    this._stopPolling();
    if (this.connectionManager) {
      clearConnection();
      this.connectionManager = null;
    }
    super.destroy();
  }
}
