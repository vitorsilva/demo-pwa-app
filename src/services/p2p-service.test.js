/**
 * Tests for P2PService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { P2PService } from './p2p-service.js';

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    child: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  constructor() {
    this.localDescription = null;
    this.remoteDescription = null;
    this.connectionState = 'new';
    this.iceConnectionState = 'new';
    this.signalingState = 'stable';
    this.onicecandidate = null;
    this.onconnectionstatechange = null;
    this.ondatachannel = null;
    this._dataChannels = [];
  }

  createDataChannel(label, options) {
    const channel = new MockRTCDataChannel(label);
    this._dataChannels.push(channel);
    return channel;
  }

  async createOffer() {
    return { type: 'offer', sdp: 'mock-offer-sdp' };
  }

  async createAnswer() {
    return { type: 'answer', sdp: 'mock-answer-sdp' };
  }

  async setLocalDescription(desc) {
    this.localDescription = desc;
    // Update signaling state based on description type
    if (desc && desc.type === 'offer') {
      this.signalingState = 'have-local-offer';
    } else if (desc && desc.type === 'answer') {
      this.signalingState = 'stable';
    }
  }

  async setRemoteDescription(desc) {
    this.remoteDescription = desc;
    // Update signaling state based on description type
    if (desc && desc.type === 'offer') {
      this.signalingState = 'have-remote-offer';
    } else if (desc && desc.type === 'answer') {
      this.signalingState = 'stable';
    }
  }

  async addIceCandidate(candidate) {
    // Mock implementation
  }

  close() {
    this.connectionState = 'closed';
  }

  // Helper to simulate connection state change
  _setConnectionState(state) {
    this.connectionState = state;
    if (this.onconnectionstatechange) {
      this.onconnectionstatechange();
    }
  }

  // Helper to simulate ICE candidate
  _emitIceCandidate(candidate) {
    if (this.onicecandidate) {
      this.onicecandidate({ candidate });
    }
  }

  // Helper to simulate data channel
  _emitDataChannel(channel) {
    if (this.ondatachannel) {
      this.ondatachannel({ channel });
    }
  }
}

class MockRTCDataChannel {
  constructor(label) {
    this.label = label;
    this.readyState = 'connecting';
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    this._messages = [];
  }

  send(data) {
    this._messages.push(data);
  }

  close() {
    this.readyState = 'closed';
    if (this.onclose) {
      this.onclose();
    }
  }

  // Helper to simulate open
  _open() {
    this.readyState = 'open';
    if (this.onopen) {
      this.onopen();
    }
  }

  // Helper to simulate message
  _receiveMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }
}

// Mock RTCSessionDescription
class MockRTCSessionDescription {
  constructor({ type, sdp }) {
    this.type = type;
    this.sdp = sdp;
  }
}

// Mock RTCIceCandidate
class MockRTCIceCandidate {
  constructor({ candidate, sdpMid, sdpMLineIndex }) {
    this.candidate = candidate;
    this.sdpMid = sdpMid;
    this.sdpMLineIndex = sdpMLineIndex;
  }
}

// Set up global mocks
global.RTCPeerConnection = MockRTCPeerConnection;
global.RTCSessionDescription = MockRTCSessionDescription;
global.RTCIceCandidate = MockRTCIceCandidate;

describe('P2PService', () => {
  let p2pService;
  let mockSignalingClient;

  beforeEach(() => {
    mockSignalingClient = {
      startPolling: vi.fn(),
      stopPolling: vi.fn(),
      sendOffer: vi.fn().mockResolvedValue(undefined),
      sendAnswer: vi.fn().mockResolvedValue(undefined),
      sendIceCandidate: vi.fn().mockResolvedValue(undefined),
      getPeers: vi.fn().mockResolvedValue([]),
    };

    p2pService = new P2PService(mockSignalingClient);
  });

  afterEach(() => {
    p2pService.destroy();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should start polling on creation', () => {
      expect(mockSignalingClient.startPolling).toHaveBeenCalled();
    });

    it('should initialize empty peers map', () => {
      expect(p2pService.peers.size).toBe(0);
    });
  });

  describe('createConnection', () => {
    it('should create a new peer connection', async () => {
      await p2pService.createConnection('peer-1');

      expect(p2pService.peers.has('peer-1')).toBe(true);
      expect(p2pService.peers.get('peer-1').state).toBe('connecting');
    });

    it('should create data channel as initiator', async () => {
      await p2pService.createConnection('peer-1');

      const peer = p2pService.peers.get('peer-1');
      expect(peer.dataChannel).toBeDefined();
      expect(peer.dataChannel.label).toBe('party');
    });

    it('should send offer via signaling client', async () => {
      await p2pService.createConnection('peer-1');

      expect(mockSignalingClient.sendOffer).toHaveBeenCalledWith(
        'peer-1',
        expect.objectContaining({ type: 'offer' })
      );
    });

    it('should not create duplicate connections', async () => {
      await p2pService.createConnection('peer-1');
      await p2pService.createConnection('peer-1');

      expect(mockSignalingClient.sendOffer).toHaveBeenCalledTimes(1);
    });
  });

  describe('handling signaling messages', () => {
    it('should handle offer and send answer', async () => {
      // Get the polling callback
      const pollingCallback = mockSignalingClient.startPolling.mock.calls[0][0];

      // Simulate receiving an offer
      pollingCallback({
        fromId: 'peer-2',
        type: 'offer',
        payload: { sdp: 'remote-offer-sdp', type: 'offer' },
      });

      // Wait for async handling
      await new Promise((r) => setTimeout(r, 10));

      expect(mockSignalingClient.sendAnswer).toHaveBeenCalledWith(
        'peer-2',
        expect.objectContaining({ type: 'answer' })
      );
    });

    it('should handle answer', async () => {
      // First create a connection
      await p2pService.createConnection('peer-2');

      const pollingCallback = mockSignalingClient.startPolling.mock.calls[0][0];

      // Simulate receiving an answer
      await pollingCallback({
        fromId: 'peer-2',
        type: 'answer',
        payload: { sdp: 'remote-answer-sdp', type: 'answer' },
      });

      const peer = p2pService.peers.get('peer-2');
      expect(peer.connection.remoteDescription).toEqual(
        expect.objectContaining({ type: 'answer' })
      );
    });

    it('should handle ICE candidate', async () => {
      await p2pService.createConnection('peer-2');

      const pollingCallback = mockSignalingClient.startPolling.mock.calls[0][0];

      // Simulate receiving an ICE candidate
      await pollingCallback({
        fromId: 'peer-2',
        type: 'ice',
        payload: { candidate: 'candidate:123', sdpMid: 'audio', sdpMLineIndex: 0 },
      });

      // Should not throw
      expect(p2pService.peers.has('peer-2')).toBe(true);
    });
  });

  describe('send', () => {
    it('should return false when no data channel exists', () => {
      const result = p2pService.send('peer-1', { type: 'test' });
      expect(result).toBe(false);
    });

    it('should return false when data channel is not open', async () => {
      await p2pService.createConnection('peer-1');

      const result = p2pService.send('peer-1', { type: 'test' });
      expect(result).toBe(false);
    });

    it('should send message when data channel is open', async () => {
      await p2pService.createConnection('peer-1');

      const peer = p2pService.peers.get('peer-1');
      peer.dataChannel._open();

      const result = p2pService.send('peer-1', { type: 'test', data: 'hello' });

      expect(result).toBe(true);
      expect(peer.dataChannel._messages).toHaveLength(1);
      expect(JSON.parse(peer.dataChannel._messages[0])).toEqual({ type: 'test', data: 'hello' });
    });
  });

  describe('broadcast', () => {
    it('should send to all connected peers', async () => {
      await p2pService.createConnection('peer-1');
      await p2pService.createConnection('peer-2');

      // Open data channels
      p2pService.peers.get('peer-1').dataChannel._open();
      p2pService.peers.get('peer-2').dataChannel._open();

      const count = p2pService.broadcast({ type: 'broadcast', data: 'hello all' });

      expect(count).toBe(2);
    });

    it('should return 0 when no peers connected', () => {
      const count = p2pService.broadcast({ type: 'test' });
      expect(count).toBe(0);
    });
  });

  describe('onMessage', () => {
    it('should call callback when message received', async () => {
      const callback = vi.fn();
      p2pService.onMessage(callback);

      await p2pService.createConnection('peer-1');

      const peer = p2pService.peers.get('peer-1');
      peer.dataChannel._open();
      peer.dataChannel._receiveMessage({ type: 'test', data: 'hello' });

      expect(callback).toHaveBeenCalledWith('peer-1', { type: 'test', data: 'hello' });
    });
  });

  describe('onPeerConnected', () => {
    it('should call callback when peer connects', async () => {
      const callback = vi.fn();
      p2pService.onPeerConnected(callback);

      await p2pService.createConnection('peer-1');

      const peer = p2pService.peers.get('peer-1');
      peer.connection._setConnectionState('connected');

      expect(callback).toHaveBeenCalledWith('peer-1');
    });
  });

  describe('onPeerDisconnected', () => {
    it('should call callback when peer disconnects', async () => {
      const callback = vi.fn();
      p2pService.onPeerDisconnected(callback);

      await p2pService.createConnection('peer-1');

      const peer = p2pService.peers.get('peer-1');
      peer.connection._setConnectionState('disconnected');

      expect(callback).toHaveBeenCalledWith('peer-1', 'disconnected');
    });
  });

  describe('getConnectionState', () => {
    it('should return null for unknown peer', () => {
      expect(p2pService.getConnectionState('unknown')).toBeNull();
    });

    it('should return peer state', async () => {
      await p2pService.createConnection('peer-1');
      expect(p2pService.getConnectionState('peer-1')).toBe('connecting');
    });
  });

  describe('isConnected', () => {
    it('should return false for unknown peer', () => {
      expect(p2pService.isConnected('unknown')).toBe(false);
    });

    it('should return true when connected', async () => {
      await p2pService.createConnection('peer-1');

      const peer = p2pService.peers.get('peer-1');
      peer.state = 'connected';

      expect(p2pService.isConnected('peer-1')).toBe(true);
    });
  });

  describe('getConnectedPeers', () => {
    it('should return empty array when no peers', () => {
      expect(p2pService.getConnectedPeers()).toEqual([]);
    });

    it('should return only connected peers', async () => {
      await p2pService.createConnection('peer-1');
      await p2pService.createConnection('peer-2');

      p2pService.peers.get('peer-1').state = 'connected';
      p2pService.peers.get('peer-2').state = 'connecting';

      expect(p2pService.getConnectedPeers()).toEqual(['peer-1']);
    });
  });

  describe('disconnect', () => {
    it('should remove peer connection', async () => {
      await p2pService.createConnection('peer-1');
      p2pService.disconnect('peer-1');

      expect(p2pService.peers.has('peer-1')).toBe(false);
    });
  });

  describe('disconnectAll', () => {
    it('should remove all peer connections', async () => {
      await p2pService.createConnection('peer-1');
      await p2pService.createConnection('peer-2');

      p2pService.disconnectAll();

      expect(p2pService.peers.size).toBe(0);
    });
  });

  describe('destroy', () => {
    it('should clean up all resources', async () => {
      await p2pService.createConnection('peer-1');

      p2pService.destroy();

      expect(p2pService.isDestroyed).toBe(true);
      expect(p2pService.peers.size).toBe(0);
      expect(mockSignalingClient.stopPolling).toHaveBeenCalled();
    });
  });
});
