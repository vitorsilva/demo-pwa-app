/**
 * Party Results View
 *
 * Final standings screen after party quiz completion.
 * Shows winner, rankings, and options to play again or save.
 *
 * MVP Implementation: Fetches final standings from API.
 */

import BaseView from './BaseView.js';
import { t } from '../core/i18n.js';
import { shareContent } from '../utils/share.js';
import { logger } from '../utils/logger.js';
import router from '../core/router.js';
import { getRoom } from '../services/party-api.js';
import { getConnection, clearConnection } from '../services/party-connection-store.js';

const log = logger.child({ module: 'PartyResultsView' });

export default class PartyResultsView extends BaseView {
  /**
   * @param {Object} options
   * @param {string} [options.roomCode] - Room code from URL
   * @param {Array} [options.standings] - Final standings array (legacy)
   * @param {Object} [options.quiz] - Quiz data (legacy)
   * @param {string} [options.participantId] - Current user's participant ID (legacy)
   * @param {boolean} [options.isHost=false] - Whether current user is host
   */
  constructor(options = {}) {
    super();
    // Support both new (roomCode) and legacy (standings) approaches
    this.roomCode = options.roomCode || router.getPartyResultsCode() || sessionStorage.getItem('partyRoomCode') || '';
    this.standings = options.standings || [];
    this.quiz = options.quiz;
    this.participantId = options.participantId || sessionStorage.getItem('partyParticipantId') || '';
    this.isHost = options.isHost || sessionStorage.getItem('partyIsHost') === 'true';
    this.connectionManager = null
  }

  async render() {
    // Try to get standings from P2P session first
    this.connectionManager = getConnection();

    if (this.connectionManager) {
      const session = this.connectionManager.getSession();
      if (session && session.quiz) {
        this.standings = session.getStandings().map(p => ({
          ...p,
          isYou: p.id === session.participantId,
        }));
        this.quiz = session.quiz;
        log.info('Results loaded from P2P session', { participants: this.standings.length });
      }
    }

    // If no standings from session, fetch from API
    if (this.standings.length === 0 && this.roomCode) {
      try {
        const roomData = await getRoom(this.roomCode);
        this.standings = this._mapParticipants(roomData.participants || []);
        this.quiz = roomData.quiz_data;
        log.info('Results loaded from API', { participants: this.standings.length });
      } catch (error) {
        log.error('Failed to load results', { error: error.message });
        // Continue with empty standings
      }
    }

    // Sort by score descending
    this.standings.sort((a, b) => b.score - a.score);

    const winner = this.standings[0];
    const myStanding = this.standings.find(p => p.id === this.participantId || p.isYou);
    const myRank = this.standings.findIndex(p => p.id === this.participantId || p.isYou) + 1;
    const isWinner = myRank === 1;

    this.setHTML(`
      <div class="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
        <!-- Header -->
        <div class="flex items-center p-4 gap-4 bg-background-light dark:bg-background-dark">
          <h1 class="text-text-light dark:text-text-dark text-lg font-bold flex-1">
            ${t('party.complete')}
          </h1>
        </div>

        <div class="flex-grow px-4 pb-24">
          <!-- Winner Celebration -->
          <div class="text-center py-8">
            <div class="text-6xl mb-4">${isWinner ? '🏆' : '🎉'}</div>
            <h2 class="text-text-light dark:text-text-dark text-2xl font-bold mb-2">
              ${isWinner ? t('results.perfectScore') : t('party.complete')}
            </h2>
            ${winner ? `
              <p class="text-primary text-xl font-bold">
                ${t('party.winner')}: ${winner.name}
              </p>
              <p class="text-subtext-light dark:text-subtext-dark">
                ${winner.score} ${t('party.points', { points: winner.score }).replace(/\+\d+ pts/, 'points')}
              </p>
            ` : ''}
          </div>

          <!-- Your Result -->
          ${myStanding ? `
            <div class="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-subtext-light dark:text-subtext-dark text-sm">
                    ${t('party.yourProgress')}
                  </p>
                  <p class="text-text-light dark:text-text-dark text-lg font-bold">
                    #${myRank} of ${this.standings.length}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-primary text-2xl font-bold">${myStanding.score}</p>
                  <p class="text-subtext-light dark:text-subtext-dark text-sm">${t('party.pointsLabel')}</p>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Final Standings -->
          <h3 class="text-text-light dark:text-text-dark text-lg font-bold mb-3">
            ${t('party.finalStandings')}
          </h3>
          <div class="flex flex-col gap-2 mb-6">
            ${this._renderStandings()}
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-3">
            <button
              id="shareBtn"
              class="w-full py-4 rounded-xl bg-primary text-white font-bold
                     flex items-center justify-center gap-2
                     hover:bg-primary/90 transition-colors"
            >
              <span class="material-symbols-outlined">share</span>
              ${t('party.shareResults')}
            </button>

            ${this.isHost ? `
              <button
                id="playAgainBtn"
                class="w-full py-4 rounded-xl bg-purple-500 text-white font-bold
                       flex items-center justify-center gap-2
                       hover:bg-purple-600 transition-colors"
              >
                <span class="material-symbols-outlined">replay</span>
                ${t('party.playAgain')}
              </button>
            ` : ''}

            ${!this.isHost ? `
              <button
                id="saveBtn"
                data-testid="save-locally-btn"
                class="w-full py-3 rounded-xl border-2 border-primary text-primary font-medium
                       hover:bg-primary/10 transition-colors"
              >
                ${t('party.saveLocally')}
              </button>
            ` : ''}

            <button
              id="homeBtn"
              class="w-full py-3 rounded-xl text-subtext-light dark:text-subtext-dark
                     hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              ${t('common.home')}
            </button>
          </div>
        </div>
      </div>
    `);

    this.attachListeners();
  }

  /**
   * Map API participants to standings format.
   *
   * @private
   * @param {Array} participants - Participants from API
   * @returns {Array} Standings array
   */
  _mapParticipants(participants) {
    return participants.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score || 0,
      answers: p.answers || [],
      isYou: p.id === this.participantId,
    }));
  }

  /**
   * Render standings list.
   *
   * @private
   * @returns {string} HTML string
   */
  _renderStandings() {
    return this.standings.map((participant, index) => {
      const isMe = participant.id === this.participantId;
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

      return `
        <div class="flex items-center gap-3 p-3 rounded-xl
                    ${isMe ? 'bg-primary/10 border border-primary/30' : 'bg-card-light dark:bg-card-dark'}">
          <span class="w-8 h-8 rounded-full flex items-center justify-center text-lg
                       ${index < 3 ? '' : 'bg-gray-200 dark:bg-gray-700'}">
            ${medal || index + 1}
          </span>
          <div class="flex-1">
            <p class="text-text-light dark:text-text-dark font-medium">
              ${participant.name}
              ${isMe ? `<span class="text-subtext-light dark:text-subtext-dark text-sm">(${t('party.you')})</span>` : ''}
            </p>
            <p class="text-subtext-light dark:text-subtext-dark text-sm">
              ${t('party.answeredCount', {
                answered: participant.answers?.filter(a => a !== undefined).length || 0,
                total: this.quiz?.questions?.length || 0,
              })}
            </p>
          </div>
          <span class="text-lg font-bold ${isMe ? 'text-primary' : 'text-text-light dark:text-text-dark'}">
            ${participant.score}
          </span>
        </div>
      `;
    }).join('');
  }

  attachListeners() {
    // Share button
    const shareBtn = this.querySelector('#shareBtn');
    if (shareBtn) {
      this.addEventListener(shareBtn, 'click', () => this._shareResults());
    }

    // Play again button (host only)
    const playAgainBtn = this.querySelector('#playAgainBtn');
    if (playAgainBtn) {
      this.addEventListener(playAgainBtn, 'click', () => {
        // Navigate back to create party with same quiz
        this.navigateTo('/party/create');
      });
    }

    // Save locally button
    const saveBtn = this.querySelector('#saveBtn');
    if (saveBtn) {
      this.addEventListener(saveBtn, 'click', () => this._saveLocally());
    }

    // Home button
    const homeBtn = this.querySelector('#homeBtn');
    if (homeBtn) {
      this.addEventListener(homeBtn, 'click', () => {
        this.navigateTo('/');
      });
    }
  }

  /**
   * Share results.
   *
   * @private
   */
  async _shareResults() {
    const winner = this.standings[0];
    const myStanding = this.standings.find(p => p.id === this.participantId);

    const text = myStanding
      ? t('share.scoreMessage', {
          score: myStanding.score,
          total: this.quiz?.questions?.length || 0,
          percentage: Math.round((myStanding.score / (this.quiz?.questions?.length * 15)) * 100),
        })
      : `${winner?.name} won the ${this.quiz?.topic || 'quiz'} party!`;

    await shareContent({
      title: t('party.shareResults'),
      text: `${text}\n\n${t('share.challengeText')}`,
      url: window.location.origin + window.location.pathname,
    });

    log.info('Results shared');
  }

  /**
   * Save quiz locally for replay.
   *
   * @private
   */
  async _saveLocally() {
    // TODO: Implement saving quiz to IndexedDB
    log.info('Save locally - not implemented yet');
    alert(t('party.saveFeatureComingSoon'));
  }

  destroy() {
    // Clean up P2P connection - this is the final view in the party flow
    if (this.connectionManager) {
      clearConnection();
      this.connectionManager = null;
    }

    // Clear session storage
    sessionStorage.removeItem('partyRoomCode');
    sessionStorage.removeItem('partyParticipantId');
    sessionStorage.removeItem('partyIsHost');

    super.destroy();
  }  
}
