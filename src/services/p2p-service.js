/**
 * P2P Service
 *
 * WebRTC connection management for party sessions.
 * Handles peer connections, data channels, and reconnection.
 *
 * @module services/p2p-service
 */

import { logger } from '../utils/logger.js';
import { telemetry } from '../utils/telemetry.js';

const log = logger.child({ module: 'p2p-service' });

/**
 * @typedef {Object} PeerConnection
 * @property {RTCPeerConnection} connection - The WebRTC connection   
 * @property {RTCDataChannel|null} dataChannel - The data channel     
 * @property {'new'|'connecting'|'connected'|'disconnected'|'failed'} state - Connection state
 * @property {number} reconnectAttempts - Number of reconnection attempts
 * @property {number} connectionStartTime - Timestamp when connection was initiated
 * @property {RTCIceCandidate[]} pendingIceCandidates - Queued ICE candidates waiting for remote description
 */

/**
 * STUN servers for ICE candidate gathering.
 * Google provides these free public STUN servers.
 * No external service or API key needed.
 */
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

/**
 * P2P Service for managing WebRTC connections.
 */
export class P2PService {
  /**
   * Create a P2PService.
   *
   * @param {import('./signaling-client.js').SignalingClient} signalingClient - Signaling client
   */
  constructor(signalingClient) {
    /** @type {import('./signaling-client.js').SignalingClient} */
    this.signalingClient = signalingClient;

    /** @type {Map<string, PeerConnection>} */
    this.peers = new Map();

    /** @type {Function|null} */
    this.onMessageCallback = null;

    /** @type {Function|null} */
    this.onPeerConnectedCallback = null;

    /** @type {Function|null} */
    this.onPeerDisconnectedCallback = null;

    /** @type {number} */
    this.maxReconnectAttempts = 3;

    /** @type {number} */
    this.reconnectDelay = 2000;

    /** @type {boolean} */
    this.isDestroyed = false;

    // Start handling signaling messages
    this._setupSignalingHandler();

    log.debug('P2PService created');
  }

  /**
   * Set up the signaling message handler.
   *
   * @private
   */
  _setupSignalingHandler() {
    this.signalingClient.startPolling((message) => {
      this._handleSignalingMessage(message);
    });
  }

  /**
   * Handle incoming signaling messages.
   *
   * @private
   * @param {import('./signaling-client.js').SignalingMessage} message
   */
  async _handleSignalingMessage(message) {
    const { fromId, type, payload } = message;

    log.debug('Received signaling message', { from: fromId, type });

    try {
      switch (type) {
        case 'offer':
          await this._handleOffer(fromId, payload);
          break;
        case 'answer':
          await this._handleAnswer(fromId, payload);
          break;
        case 'ice':
          await this._handleIceCandidate(fromId, payload);
          break;
        default:
          log.warn('Unknown message type', { type });
      }
    } catch (error) {
      log.error('Error handling signaling message', { type, error: error.message });
    }
  }

  /**
   * Create a connection to a peer (as initiator).
   *
   * @param {string} peerId - Peer ID to connect to
   * @returns {Promise<void>}
   */
  async createConnection(peerId) {
    if (this.peers.has(peerId)) {
      log.warn('Connection already exists', { peerId });
      return;
    }

    log.info('Creating connection to peer', { peerId });

    // Track telemetry
    telemetry.track('p2p_connection_attempt', {
      peerId,
      role: 'initiator',
    });

    const peerConnection = this._createPeerConnection(peerId);

    // Create data channel (initiator creates the channel)
    const dataChannel = peerConnection.connection.createDataChannel('party', {
      ordered: true,
    });

    this._setupDataChannel(peerId, dataChannel);
    peerConnection.dataChannel = dataChannel;

    // Create and send offer
    const offer = await peerConnection.connection.createOffer();
    await peerConnection.connection.setLocalDescription(offer);

    await this.signalingClient.sendOffer(peerId, offer);

    peerConnection.state = 'connecting';
  }

  /**
   * Handle an incoming offer.
   *
   * @private
   * @param {string} peerId - Peer ID
   * @param {Object} payload - Offer payload
   */
  async _handleOffer(peerId, payload) {
    log.info('Handling offer from peer', { peerId });

    // Create connection if it doesn't exist
    let peerConnection = this.peers.get(peerId);
    if (!peerConnection) {
      peerConnection = this._createPeerConnection(peerId);
    }

    const { connection } = peerConnection;

    // Set remote description (the offer)
    await connection.setRemoteDescription(new RTCSessionDescription({     
      type: 'offer',
      sdp: payload.sdp,
    }));

    // Process any ICE candidates that arrived before the offer
    await this._processPendingIceCandidates(peerId);

    // Create and send answer
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);

    await this.signalingClient.sendAnswer(peerId, answer);

    peerConnection.state = 'connecting';
  }

  /**
   * Handle an incoming answer.
   *
   * @private
   * @param {string} peerId - Peer ID
   * @param {Object} payload - Answer payload
   */
  async _handleAnswer(peerId, payload) {
    log.info('Handling answer from peer', { peerId });

    const peerConnection = this.peers.get(peerId);
    if (!peerConnection) {
      log.warn('No connection for answer', { peerId });
      return;
    }

    await peerConnection.connection.setRemoteDescription(new RTCSessionDescription({
      type: 'answer',
      sdp: payload.sdp,
    }));

    // Process any ICE candidates that arrived before the answer
    await this._processPendingIceCandidates(peerId);
  }

  /**
   * Handle an incoming ICE candidate.
   *
   * @private
   * @param {string} peerId - Peer ID
   * @param {Object} payload - ICE candidate payload
   */
  async _handleIceCandidate(peerId, payload) {
    const peerConnection = this.peers.get(peerId);
    if (!peerConnection) {
      log.warn('No connection for ICE candidate', { peerId });
      return;
    }

    const candidate = new RTCIceCandidate({
      candidate: payload.candidate,
      sdpMid: payload.sdpMid,
      sdpMLineIndex: payload.sdpMLineIndex,
    });

    // Queue candidate if remote description not yet set
    if (!peerConnection.connection.remoteDescription) {
      log.debug('Queuing ICE candidate (no remote description yet)', { peerId });
      peerConnection.pendingIceCandidates.push(candidate);
      return;
    }

    await peerConnection.connection.addIceCandidate(candidate);
    log.debug('Added ICE candidate', { peerId });
  }

  /**
   * Process any queued ICE candidates after remote description is set. 
   *
   * @private
   * @param {string} peerId - Peer ID
   */
  async _processPendingIceCandidates(peerId) {
    const peerConnection = this.peers.get(peerId);
    if (!peerConnection) return;

    const pending = peerConnection.pendingIceCandidates;
    if (pending.length === 0) return;

    log.debug('Processing queued ICE candidates', { peerId, count: pending.length });

    for (const candidate of pending) {
      try {
        await peerConnection.connection.addIceCandidate(candidate);     
      } catch (error) {
        log.warn('Failed to add queued ICE candidate', { peerId, error: error.message });
      }
    }

    // Clear the queue
    peerConnection.pendingIceCandidates = [];
  }

  /**
   * Create a new RTCPeerConnection.
   *
   * @private
   * @param {string} peerId - Peer ID
   * @returns {PeerConnection}
   */
  _createPeerConnection(peerId) {
    const connection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    /** @type {PeerConnection} */
    const peerConnection = {
      connection,
      dataChannel: null,
      state: 'new',
      reconnectAttempts: 0,
      connectionStartTime: Date.now(),
      pendingIceCandidates: [],
    };

    this.peers.set(peerId, peerConnection);

    // Handle ICE candidates
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        // Track ICE candidate type for STUN vs TURN evaluation
        telemetry.track('p2p_ice_candidate', {
          peerId,
          type: event.candidate.type,
          protocol: event.candidate.protocol,
        });

        this.signalingClient.sendIceCandidate(peerId, event.candidate);   
      }
    };

    // Handle connection state changes
    connection.onconnectionstatechange = () => {
      const state = connection.connectionState;
      log.info('Connection state changed', { peerId, state });

      switch (state) {
        case 'connected':
          peerConnection.state = 'connected';
          peerConnection.reconnectAttempts = 0;

          // Track telemetry
          telemetry.track('p2p_connection_success', {
            peerId,
            connectionTime: Date.now() - peerConnection.connectionStartTime,    
            iceState: connection.iceConnectionState,
          });

          if (this.onPeerConnectedCallback) {
            this.onPeerConnectedCallback(peerId);
          }
          break;

        case 'disconnected':
          peerConnection.state = 'disconnected';
          this._handleDisconnection(peerId);
          break;

        case 'failed':
          peerConnection.state = 'failed';

          // Track telemetry
          telemetry.track('p2p_connection_failed', {
            peerId,
            error: 'connection_failed',
            iceState: connection.iceConnectionState,
          });

          this._handleConnectionFailure(peerId);
          break;
      }
    };

    // Handle data channel (for non-initiator)
    connection.ondatachannel = (event) => {
      log.debug('Data channel received', { peerId });
      this._setupDataChannel(peerId, event.channel);
      peerConnection.dataChannel = event.channel;
    };

    return peerConnection;
  }

  /**
   * Set up data channel event handlers.
   *
   * @private
   * @param {string} peerId - Peer ID
   * @param {RTCDataChannel} channel - Data channel
   */
  _setupDataChannel(peerId, channel) {
    channel.onopen = () => {
      log.info('Data channel opened', { peerId });
    };

    channel.onclose = () => {
      log.info('Data channel closed', { peerId });
    };

    channel.onerror = (error) => {
      log.error('Data channel error', { peerId, error });
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        log.debug('Received message', { peerId, type: message.type });

        if (this.onMessageCallback) {
          this.onMessageCallback(peerId, message);
        }
      } catch (error) {
        log.error('Error parsing message', { error: error.message });
      }
    };
  }

  /**
   * Handle peer disconnection.
   *
   * @private
   * @param {string} peerId - Peer ID
   */
  _handleDisconnection(peerId) {
    if (this.onPeerDisconnectedCallback) {
      this.onPeerDisconnectedCallback(peerId, 'disconnected');
    }
  }

  /**
   * Handle connection failure (attempt reconnection).
   *
   * @private
   * @param {string} peerId - Peer ID
   */
  async _handleConnectionFailure(peerId) {
    const peerConnection = this.peers.get(peerId);
    if (!peerConnection) return;

    if (peerConnection.reconnectAttempts < this.maxReconnectAttempts) {
      peerConnection.reconnectAttempts++;
      log.info('Attempting reconnection', { peerId, attempt: peerConnection.reconnectAttempts });

      // Track telemetry
      telemetry.track('p2p_reconnect_attempt', {
        peerId,
        attempt: peerConnection.reconnectAttempts,
      });

      // Clean up old connection
      this._cleanupPeerConnection(peerId);

      // Wait before reconnecting
      await new Promise((resolve) => setTimeout(resolve, this.reconnectDelay));

      // Try to reconnect
      if (!this.isDestroyed) {
        await this.createConnection(peerId);
      }
    } else {
      log.error('Max reconnection attempts reached', { peerId });
      this._cleanupPeerConnection(peerId);

      if (this.onPeerDisconnectedCallback) {
        this.onPeerDisconnectedCallback(peerId, 'failed');
      }
    }
  }

  /**
   * Clean up a peer connection.
   *
   * @private
   * @param {string} peerId - Peer ID
   */
  _cleanupPeerConnection(peerId) {
    const peerConnection = this.peers.get(peerId);
    if (!peerConnection) return;

    if (peerConnection.dataChannel) {
      peerConnection.dataChannel.close();
    }

    peerConnection.connection.close();
    this.peers.delete(peerId);

    log.debug('Cleaned up peer connection', { peerId });
  }

  /**
   * Send a message to a specific peer.
   *
   * @param {string} peerId - Peer ID
   * @param {Object} message - Message to send
   * @returns {boolean} Whether the message was sent
   */
  send(peerId, message) {
    const peerConnection = this.peers.get(peerId);
    if (!peerConnection?.dataChannel) {
      log.warn('No data channel for peer', { peerId });
      return false;
    }

    if (peerConnection.dataChannel.readyState !== 'open') {
      log.warn('Data channel not open', { peerId, state: peerConnection.dataChannel.readyState });
      return false;
    }

    try {
      peerConnection.dataChannel.send(JSON.stringify(message));
      return true;
    } catch (error) {
      log.error('Error sending message', { peerId, error: error.message });
      return false;
    }
  }

  /**
   * Broadcast a message to all connected peers.
   *
   * @param {Object} message - Message to broadcast
   * @returns {number} Number of peers the message was sent to
   */
  broadcast(message) {
    let sentCount = 0;

    for (const [peerId] of this.peers) {
      if (this.send(peerId, message)) {
        sentCount++;
      }
    }

    log.debug('Broadcast message', { sentTo: sentCount, total: this.peers.size });
    return sentCount;
  }

  /**
   * Set callback for received messages.
   *
   * @param {Function} callback - Called with (peerId, message)
   */
  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  /**
   * Set callback for peer connected events.
   *
   * @param {Function} callback - Called with (peerId)
   */
  onPeerConnected(callback) {
    this.onPeerConnectedCallback = callback;
  }

  /**
   * Set callback for peer disconnected events.
   *
   * @param {Function} callback - Called with (peerId, reason)
   */
  onPeerDisconnected(callback) {
    this.onPeerDisconnectedCallback = callback;
  }

  /**
   * Get the connection state for a peer.
   *
   * @param {string} peerId - Peer ID
   * @returns {string|null} Connection state or null if not found
   */
  getConnectionState(peerId) {
    return this.peers.get(peerId)?.state || null;
  }

  /**
   * Check if connected to a peer.
   *
   * @param {string} peerId - Peer ID
   * @returns {boolean}
   */
  isConnected(peerId) {
    return this.getConnectionState(peerId) === 'connected';
  }

  /**
   * Get all connected peer IDs.
   *
   * @returns {string[]}
   */
  getConnectedPeers() {
    const connected = [];
    for (const [peerId, peer] of this.peers) {
      if (peer.state === 'connected') {
        connected.push(peerId);
      }
    }
    return connected;
  }

  /**
   * Disconnect from a specific peer.
   *
   * @param {string} peerId - Peer ID
   */
  disconnect(peerId) {
    this._cleanupPeerConnection(peerId);
  }

  /**
   * Disconnect from all peers.
   */
  disconnectAll() {
    for (const [peerId] of this.peers) {
      this._cleanupPeerConnection(peerId);
    }
  }

  /**
   * Clean up all resources.
   */
  destroy() {
    this.isDestroyed = true;
    this.disconnectAll();
    this.signalingClient.stopPolling();
    this.onMessageCallback = null;
    this.onPeerConnectedCallback = null;
    this.onPeerDisconnectedCallback = null;

    log.info('P2PService destroyed');
  }
}
