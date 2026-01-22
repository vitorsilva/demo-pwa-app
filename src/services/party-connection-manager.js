/**
 * Party Connection Manager
 *
 * Orchestrates P2P connection lifecycle for party sessions.
 * Coordinates SignalingClient, P2PService, and PartySession.
 * Handles fallback to HTTP mode when P2P fails.
 *
 * @module services/party-connection-manager
 */

import { logger } from '../utils/logger.js';
import { telemetry } from '../utils/telemetry.js';
import { SignalingClient, getSignalingBaseUrl } from './signaling-client.js';
import { P2PService } from './p2p-service.js';
import { PartySession } from './party-session.js';

const log = logger.child({ module: 'party-connection-manager' });

/**
 * Connection modes.
 */
export const CONNECTION_MODES = {
  CONNECTING: 'connecting',
  P2P: 'p2p',
  HTTP_FALLBACK: 'http_fallback',
  DISCONNECTED: 'disconnected',
};

/**
 * Connection configuration.
 */
const CONFIG = {
  connectionTimeout: 30000, // 30 seconds to establish P2P
  maxRetries: 3, // Retry P2P this many times before fallback
};

/**
 * Party Connection Manager.
 * Orchestrates P2P services and handles fallback.
 */
export class PartyConnectionManager {
  /**
   * Create a PartyConnectionManager.
   *
   * @param {string} roomCode - Room code
   * @param {string} participantId - This participant's ID
   * @param {boolean} isHost - Whether this participant is the host
   */
  constructor(roomCode, participantId, isHost) {
    /** @type {string} */
    this.roomCode = roomCode.toUpperCase();

    /** @type {string} */
    this.participantId = participantId;

    /** @type {boolean} */
    this.isHost = isHost;

    /** @type {string} */
    this.mode = CONNECTION_MODES.DISCONNECTED;

    /** @type {SignalingClient|null} */
    this.signalingClient = null;

    /** @type {P2PService|null} */
    this.p2pService = null;

    /** @type {PartySession|null} */
    this.session = null;

    /** @type {string|null} */
    this.hostId = null;

    /** @type {number} */
    this.retryCount = 0;

    /** @type {number|null} */
    this.connectionTimer = null;

    // Event callbacks
    /** @type {Function|null} */
    this.onModeChangeCallback = null;

    /** @type {Function|null} */
    this.onPeerJoinedCallback = null;

    /** @type {Function|null} */
    this.onPeerLeftCallback = null;

    /** @type {Function|null} */
    this.onErrorCallback = null;

    log.info('PartyConnectionManager created', { roomCode: this.roomCode, isHost });
  }

  // ============================================
  // LIFECYCLE METHODS
  // ============================================

  /**
   * Start the P2P connection process.
   *
   * @returns {Promise<boolean>} Whether connection succeeded
   */
  async connect() {
    if (this.mode === CONNECTION_MODES.P2P) {
      log.warn('Already connected');
      return true;
    }

    this._setMode(CONNECTION_MODES.CONNECTING);

    try {
      // Initialize signaling client
      const baseUrl = getSignalingBaseUrl();
      this.signalingClient = new SignalingClient(baseUrl, this.roomCode, this.participantId);

      // Initialize P2P service
      this.p2pService = new P2PService(this.signalingClient);
      this._setupP2PHandlers();

      // Initialize party session
      this.session = new PartySession(this.p2pService, this.isHost);

      // Start connection timeout
      this._startConnectionTimeout();

      // If guest, try to connect to host
      if (!this.isHost) {
        const peers = await this.signalingClient.getPeers();
        if (peers.length > 0) {
          this.hostId = peers[0]; // First peer is the host
          await this.p2pService.createConnection(this.hostId);
        }
      }

      log.info('Connection initiated', { isHost: this.isHost });
      return true;
    } catch (error) {
      log.error('Connection failed', { error: error.message });
      this._handleConnectionFailure(error);
      return false;
    }
  }

  /**
   * Disconnect and clean up.
   *
   * @returns {Promise<void>}
   */
  async disconnect() {
    this._clearConnectionTimeout();

    if (this.session) {
      this.session.destroy();
      this.session = null;
    }

    if (this.p2pService) {
      this.p2pService.destroy();
      this.p2pService = null;
    }

    if (this.signalingClient) {
      this.signalingClient.destroy();
      this.signalingClient = null;
    }

    this._setMode(CONNECTION_MODES.DISCONNECTED);
    log.info('Disconnected');
  }

  /**
   * Clean up all resources.
   */
  destroy() {
    this.disconnect();
    this.onModeChangeCallback = null;
    this.onPeerJoinedCallback = null;
    this.onPeerLeftCallback = null;
    this.onErrorCallback = null;
    log.info('PartyConnectionManager destroyed');
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Set up P2P event handlers.
   *
   * @private
   */
  _setupP2PHandlers() {
    this.p2pService.onPeerConnected((peerId) => {
      log.info('Peer connected via P2P', { peerId });

      // P2P connection established
      this._clearConnectionTimeout();
      this._setMode(CONNECTION_MODES.P2P);
      this.retryCount = 0;

      if (this.onPeerJoinedCallback) {
        this.onPeerJoinedCallback(peerId);
      }

      telemetry.track('party_p2p_connected', {
        roomCode: this.roomCode,
        isHost: this.isHost,
      });
    });

    this.p2pService.onPeerDisconnected((peerId, reason) => {
      log.info('Peer disconnected', { peerId, reason });

      if (this.onPeerLeftCallback) {
        this.onPeerLeftCallback(peerId, reason);
      }

      // If all peers disconnected, consider falling back
      if (this.p2pService.getConnectedPeers().length === 0) {
        this._handleAllPeersDisconnected();
      }
    });
  }

  /**
   * Set connection mode and notify listeners.
   *
   * @private
   * @param {string} mode - New mode
   */
  _setMode(mode) {
    if (this.mode === mode) return;

    const previousMode = this.mode;
    this.mode = mode;

    log.info('Mode changed', { from: previousMode, to: mode });

    if (this.onModeChangeCallback) {
      this.onModeChangeCallback(mode, previousMode);
    }
  }

  /**
   * Start the connection timeout timer.
   *
   * @private
   */
  _startConnectionTimeout() {
    this._clearConnectionTimeout();

    this.connectionTimer = window.setTimeout(() => {
      if (this.mode === CONNECTION_MODES.CONNECTING) {
        log.warn('Connection timeout');
        this._handleConnectionFailure(new Error('Connection timeout'));
      }
    }, CONFIG.connectionTimeout);
  }

  /**
   * Clear the connection timeout timer.
   *
   * @private
   */
  _clearConnectionTimeout() {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  /**
   * Handle connection failure.
   *
   * @private
   * @param {Error} error - The error
   */
  _handleConnectionFailure(error) {
    this.retryCount++;

    telemetry.track('party_p2p_failed', {
      roomCode: this.roomCode,
      attempt: this.retryCount,
      error: error.message,
    });

    if (this.retryCount < CONFIG.maxRetries) {
      log.info('Retrying P2P connection', { attempt: this.retryCount });
      // Retry after a short delay
      setTimeout(() => this.connect(), 2000);
    } else {
      log.warn('Max retries reached, falling back to HTTP');
      this._activateHttpFallback();
    }
  }

  /**
   * Handle all peers disconnected.
   *
   * @private
   */
  _handleAllPeersDisconnected() {
    if (this.mode === CONNECTION_MODES.P2P) {
      log.warn('All peers disconnected');
      // Could attempt reconnection or fallback here
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error('All peers disconnected'));
      }
    }
  }

  /**
   * Activate HTTP fallback mode.
   *
   * @private
   */
  _activateHttpFallback() {
    this._setMode(CONNECTION_MODES.HTTP_FALLBACK);

    telemetry.track('party_http_fallback_activated', {
      roomCode: this.roomCode,
      retryCount: this.retryCount,
    });

    if (this.onErrorCallback) {
      this.onErrorCallback(new Error('P2P failed, using HTTP fallback'));
    }
  }

  // ============================================
  // STATE METHODS
  // ============================================

  /**
   * Get current connection mode.
   *
   * @returns {string} Current mode
   */
  getMode() {
    return this.mode;
  }

  /**
   * Get the party session.
   *
   * @returns {PartySession|null} The session
   */
  getSession() {
    return this.session;
  }

  /**
   * Check if connected (P2P or HTTP fallback).
   *
   * @returns {boolean}
   */
  isConnected() {
    return this.mode === CONNECTION_MODES.P2P || this.mode === CONNECTION_MODES.HTTP_FALLBACK;
  }

  /**
   * Check if using P2P mode.
   *
   * @returns {boolean}
   */
  isP2P() {
    return this.mode === CONNECTION_MODES.P2P;
  }

  /**
   * Get connected peer IDs (host only).
   *
   * @returns {string[]}
   */
  getPeers() {
    if (!this.p2pService) return [];
    return this.p2pService.getConnectedPeers();
  }

  /**
   * Get the host's peer ID (guest only).
   *
   * @returns {string|null}
   */
  getHostId() {
    return this.hostId;
  }

  // ============================================
  // EVENT SETTERS
  // ============================================

  /**
   * Set callback for mode changes.
   *
   * @param {Function} callback - Called with (newMode, previousMode)
   */
  onModeChange(callback) {
    this.onModeChangeCallback = callback;
  }

  /**
   * Set callback for peer joined events.
   *
   * @param {Function} callback - Called with (peerId)
   */
  onPeerJoined(callback) {
    this.onPeerJoinedCallback = callback;
  }

  /**
   * Set callback for peer left events.
   *
   * @param {Function} callback - Called with (peerId, reason)
   */
  onPeerLeft(callback) {
    this.onPeerLeftCallback = callback;
  }

  /**
   * Set callback for errors.
   *
   * @param {Function} callback - Called with (error)
   */
  onError(callback) {
    this.onErrorCallback = callback;
  }
}
