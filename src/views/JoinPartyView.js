/**
 * Join Party View
 *
 * Guest enters room code and name to join a party.
 */

import BaseView from './BaseView.js';
import { t } from '../core/i18n.js';
import { getSetting, saveSetting } from '../core/settings.js';
import { createRoomCodeInput, isValidRoomCode } from '../components/RoomCodeInput.js';
import { logger } from '../utils/logger.js';
import router from '../core/router.js';
import { joinRoom, generateParticipantId } from '../services/party-api.js';
import { PartyConnectionManager } from '../services/party-connection-manager.js';
import { setConnection } from '../services/party-connection-store.js';

const log = logger.child({ module: 'JoinPartyView' });

export default class JoinPartyView extends BaseView {
  /**
   * @param {Object} [options]
   * @param {string} [options.prefillCode] - Pre-fill room code (from URL)
   */
  constructor(options = {}) {
    super();
    // Check for code from router (URL) or constructor options
    this.prefillCode = options.prefillCode || router.getPartyJoinCode() || '';
    this.roomCodeInput = null;
    /** @type {boolean} Track if screenName was empty on load for auto-save */
    this._screenNameWasEmpty = false;
  }

  async render() {
    // Get saved name: prefer screenName setting, fall back to partyPlayerName
    const screenName = getSetting('screenName') || '';
    const fallbackName = localStorage.getItem('partyPlayerName') || '';
    const savedName = screenName || fallbackName;

    // Track if screenName was empty for auto-save feature
    this._screenNameWasEmpty = !screenName;

    this.setHTML(`
      <div class="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
        <!-- Header -->
        <div class="flex items-center p-4 gap-4 bg-background-light dark:bg-background-dark">
          <button id="backBtn" data-testid="back-btn" class="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <span class="material-symbols-outlined text-text-light dark:text-text-dark">arrow_back</span>
          </button>
          <h1 class="text-text-light dark:text-text-dark text-lg font-bold">${t('party.join')}</h1>
        </div>

        <div class="flex-grow px-4 pb-24">
          <div class="py-6 max-w-md mx-auto">
            <!-- Room Code Input -->
            <div id="roomCodeContainer" class="mb-6"></div>

            <!-- Name Input -->
            <div class="mb-6">
              <label for="playerName" class="text-subtext-light dark:text-subtext-dark text-sm block mb-2">
                ${t('party.yourName')}
              </label>
              <input
                type="text"
                id="playerName"
                value="${savedName}"
                maxlength="30"
                placeholder="${t('party.enterName')}"
                class="w-full px-4 py-3 rounded-xl
                       bg-card-light dark:bg-card-dark
                       text-text-light dark:text-text-dark
                       border-2 border-transparent
                       focus:border-primary focus:outline-none
                       placeholder:text-subtext-light/50"
                data-testid="player-name-input"
              />
              <p id="nameSavedFeedback" class="hidden text-green-500 text-sm mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">check</span>
                ${t('settings.nameSavedToSettings')}
              </p>
            </div>

            <!-- Join Button -->
            <button
              id="joinBtn"
              disabled
              class="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg
                     disabled:bg-gray-400 disabled:cursor-not-allowed
                     hover:bg-primary/90 transition-colors"
            >
              ${t('party.join')}
            </button>

            <!-- Error Message -->
            <p id="errorMessage" class="hidden text-red-500 text-sm text-center mt-4"></p>
          </div>
        </div>

        <!-- Loading overlay -->
        <div id="loadingOverlay" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-card-light dark:bg-card-dark rounded-2xl p-8 flex flex-col items-center gap-4">
            <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p class="text-text-light dark:text-text-dark">${t('party.joining')}</p>
          </div>
        </div>
      </div>
    `);

    // Create and mount room code input
    const container = this.querySelector('#roomCodeContainer');
    if (container) {
      this.roomCodeInput = createRoomCodeInput({
        onChange: () => this.validateForm(),
        onValidCode: () => this.validateForm(),
      });

      // Pre-fill if code provided
      if (this.prefillCode) {
        this.roomCodeInput.setValue(this.prefillCode);
      }

      container.appendChild(this.roomCodeInput);
    }

    this.attachListeners();
    this.validateForm();
  }

  attachListeners() {
    // Back button
    const backBtn = this.querySelector('#backBtn');
    this.addEventListener(backBtn, 'click', () => {
      this.navigateTo('/');
    });

    // Name input
    const nameInput = /** @type {HTMLInputElement} */ (
      this.querySelector('#playerName')
    );
    this.addEventListener(nameInput, 'input', () => {
      this.validateForm();
      const name = nameInput.value.trim();
      if (name) {
        // Auto-save to screenName setting if it was empty on load
        if (this._screenNameWasEmpty) {
          saveSetting('screenName', name);
          // Show feedback
          const feedback = this.querySelector('#nameSavedFeedback');
          if (feedback) {
            feedback.classList.remove('hidden');
            // Only show once
            this._screenNameWasEmpty = false;
          }
        }
      }
    });

    // Join button
    const joinBtn = this.querySelector('#joinBtn');
    this.addEventListener(joinBtn, 'click', () => this.joinParty());

    // Allow Enter key to submit
    this.addEventListener(nameInput, 'keydown', (e) => {
      if (/** @type {KeyboardEvent} */ (e).key === 'Enter') {
        this.joinParty();
      }
    });
  }

  validateForm() {
    const code = this.roomCodeInput?.getValue() || '';
    const name = /** @type {HTMLInputElement} */ (
      this.querySelector('#playerName')
    )?.value.trim();

    const isValid = isValidRoomCode(code) && name && name.length > 0;

    const joinBtn = this.querySelector('#joinBtn');
    if (isValid) {
      joinBtn?.removeAttribute('disabled');
    } else {
      joinBtn?.setAttribute('disabled', 'true');
    }

    return isValid;
  }

  async joinParty() {
    if (!this.validateForm()) {
      return;
    }

    const code = this.roomCodeInput?.getValue();
    const name = /** @type {HTMLInputElement} */ (
      this.querySelector('#playerName')
    )?.value.trim();

    // Save name for next time
    localStorage.setItem('partyPlayerName', name);

    // Show loading
    const overlay = this.querySelector('#loadingOverlay');
    overlay?.classList.remove('hidden');

    // Hide any previous error
    const errorMsg = this.querySelector('#errorMessage');
    errorMsg?.classList.add('hidden');

    try {
      // Generate participant ID
      const participantId = generateParticipantId();

      // Join room via API
      const roomData = await joinRoom(code, participantId, name);

      log.info('Joined party', {
        code,
        name,
        participantId,
        participantCount: roomData.participants?.length,
      });

      // Initialize P2P connection manager as guest
      const connectionManager = new PartyConnectionManager(
        code,
        participantId,
        false // isHost = false (guest)
      );

      // Store connection for lobby view to retrieve
      setConnection(connectionManager);

      // Set up error handler for connection issues
      connectionManager.onError((error) => {
        log.warn('Connection error during join', { error: error.message });
        // Continue to lobby anyway - it will handle fallback mode
      });

      // Start P2P connection (don't await - let it connect while navigating)
      connectionManager.connect();

      // Store participant ID for lobby/quiz views
      sessionStorage.setItem('partyParticipantId', participantId);
      sessionStorage.setItem('partyRoomCode', code);

      // Navigate to lobby
      this.navigateTo(`/party/lobby/${code}`);
    } catch (error) {
      log.error('Failed to join party', { error: error.message });

      // Show error
      if (errorMsg) {
        errorMsg.textContent =
          error.message === 'ROOM_NOT_FOUND'
            ? t('party.roomNotFound')
            : error.message === 'ROOM_FULL'
              ? t('party.roomFull')
              : t('errors.generic');
        errorMsg.classList.remove('hidden');
      }

      // Show error on input
      this.roomCodeInput?.showError(t('party.invalidCode'));
    } finally {
      overlay?.classList.add('hidden');
    }
  }
}
