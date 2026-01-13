
  /**
   * Tests for PartyConnectionManager
   */

  import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
  import { PartyConnectionManager, CONNECTION_MODES } from './party-connection-manager.js';

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

  // Mock telemetry
  vi.mock('../utils/telemetry.js', () => ({
    telemetry: {
      track: vi.fn(),
    },
  }));

  // Mock SignalingClient
  const mockSignalingClient = {
    startPolling: vi.fn(),
    stopPolling: vi.fn(),
    sendOffer: vi.fn().mockResolvedValue(undefined),
    sendAnswer: vi.fn().mockResolvedValue(undefined),
    sendIceCandidate: vi.fn().mockResolvedValue(undefined),
    getPeers: vi.fn().mockResolvedValue(['host-123']),
    destroy: vi.fn(),
  };

  vi.mock('./signaling-client.js', () => ({
    SignalingClient: vi.fn().mockImplementation(function () {
      return mockSignalingClient;
    }),
    getSignalingBaseUrl: vi.fn().mockReturnValue('https://test.com/party'),
  }));

  // Mock P2PService
  const mockP2PService = {
    createConnection: vi.fn().mockResolvedValue(undefined),
    onPeerConnected: vi.fn(),
    onPeerDisconnected: vi.fn(),
    onMessage: vi.fn(),
    getConnectedPeers: vi.fn().mockReturnValue([]),
    destroy: vi.fn(),
  };

  vi.mock('./p2p-service.js', () => ({
    P2PService: vi.fn().mockImplementation(function () {
      return mockP2PService;
    }),
  }));

  // Mock PartySession
  const mockPartySession = {
    destroy: vi.fn(),
  };

  vi.mock('./party-session.js', () => ({
    PartySession: vi.fn().mockImplementation(function () {
      return mockPartySession;
    }),
  }));

  describe('PartyConnectionManager', () => {
    let manager;

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      if (manager) {
        manager.destroy();
      }
      vi.clearAllMocks();
      vi.useRealTimers();
      mockSignalingClient.getPeers.mockResolvedValue(['host-123']);
    });

    describe('constructor', () => {
      it('should initialize with correct properties', () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);

        expect(manager.roomCode).toBe('ABC123');
        expect(manager.participantId).toBe('participant-1');
        expect(manager.isHost).toBe(true);
        expect(manager.mode).toBe(CONNECTION_MODES.DISCONNECTED);
      });

      it('should uppercase room code', () => {
        manager = new PartyConnectionManager('abc123', 'participant-1', false);

        expect(manager.roomCode).toBe('ABC123');
      });
    });

    describe('connect', () => {
      it('should transition to CONNECTING mode', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);

        const connectPromise = manager.connect();

        expect(manager.mode).toBe(CONNECTION_MODES.CONNECTING);

        await connectPromise;
      });

      it('should initialize all services', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);

        await manager.connect();

        expect(manager.signalingClient).not.toBeNull();
        expect(manager.p2pService).not.toBeNull();
        expect(manager.session).not.toBeNull();
      });

      it('should return true on successful connection', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);

        const result = await manager.connect();

        expect(result).toBe(true);
      });

      it('should not connect twice if already in P2P mode', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);

        await manager.connect();
        manager.mode = CONNECTION_MODES.P2P;

        const result = await manager.connect();

        expect(result).toBe(true);
      });

      it('should get peers and connect to host if guest', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', false);

        await manager.connect();

        expect(manager.signalingClient.getPeers).toHaveBeenCalled();
        expect(manager.hostId).toBe('host-123');
        expect(manager.p2pService.createConnection).toHaveBeenCalledWith('host-123');
      });

      it('should not call createConnection if host', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);

        await manager.connect();

        expect(manager.p2pService.createConnection).not.toHaveBeenCalled();
      });
    });

    describe('disconnect', () => {
      it('should clean up all services', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);
        await manager.connect();

        const session = manager.session;
        const p2p = manager.p2pService;
        const signaling = manager.signalingClient;

        await manager.disconnect();

        expect(session.destroy).toHaveBeenCalled();
        expect(p2p.destroy).toHaveBeenCalled();
        expect(signaling.destroy).toHaveBeenCalled();
      });

      it('should set mode to DISCONNECTED', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);
        await manager.connect();

        await manager.disconnect();

        expect(manager.mode).toBe(CONNECTION_MODES.DISCONNECTED);
      });

      it('should set services to null', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);
        await manager.connect();

        await manager.disconnect();

        expect(manager.session).toBeNull();
        expect(manager.p2pService).toBeNull();
        expect(manager.signalingClient).toBeNull();
      });
    });

    describe('destroy', () => {
      it('should clear all callbacks', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);
        manager.onModeChange(() => {});
        manager.onPeerJoined(() => {});
        manager.onPeerLeft(() => {});
        manager.onError(() => {});

        manager.destroy();

        expect(manager.onModeChangeCallback).toBeNull();
        expect(manager.onPeerJoinedCallback).toBeNull();
        expect(manager.onPeerLeftCallback).toBeNull();
        expect(manager.onErrorCallback).toBeNull();
      });
    });

    describe('getMode', () => {
      it('should return current mode', () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);

        expect(manager.getMode()).toBe(CONNECTION_MODES.DISCONNECTED);
      });
    });

    describe('getSession', () => {
      it('should return null before connect', () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);

        expect(manager.getSession()).toBeNull();
      });

      it('should return session after connect', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);
        await manager.connect();

        expect(manager.getSession()).not.toBeNull();
      });
    });

    describe('isConnected', () => {
      it('should return false when disconnected', () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);

        expect(manager.isConnected()).toBe(false);
      });

      it('should return true when in P2P mode', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);
        await manager.connect();
        manager.mode = CONNECTION_MODES.P2P;

        expect(manager.isConnected()).toBe(true);
      });

      it('should return true when in HTTP fallback mode', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);
        await manager.connect();
        manager.mode = CONNECTION_MODES.HTTP_FALLBACK;

        expect(manager.isConnected()).toBe(true);
      });
    });

    describe('isP2P', () => {
      it('should return false when not in P2P mode', () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);

        expect(manager.isP2P()).toBe(false);
      });

      it('should return true when in P2P mode', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);
        await manager.connect();
        manager.mode = CONNECTION_MODES.P2P;

        expect(manager.isP2P()).toBe(true);
      });
    });

    describe('getPeers', () => {
      it('should return empty array before connect', () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);

        expect(manager.getPeers()).toEqual([]);
      });
    });

    describe('getHostId', () => {
      it('should return null before connect', () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', false);

        expect(manager.getHostId()).toBeNull();
      });

      it('should return host ID after guest connects', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', false);
        await manager.connect();

        expect(manager.getHostId()).toBe('host-123');
      });
    });

    describe('event callbacks', () => {
      it('should call onModeChange when mode changes', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);
        const callback = vi.fn();
        manager.onModeChange(callback);

        await manager.connect();

        expect(callback).toHaveBeenCalledWith(CONNECTION_MODES.CONNECTING, CONNECTION_MODES.DISCONNECTED);      
      });
    });

    describe('connection timeout', () => {
      it('should trigger fallback after timeout', async () => {
        manager = new PartyConnectionManager('ABC123', 'participant-1', true);

        await manager.connect();

        // Fast-forward past the connection timeout (30s) and retries
        vi.advanceTimersByTime(30000); // First timeout
        vi.advanceTimersByTime(2000);  // Retry delay
        vi.advanceTimersByTime(30000); // Second timeout
        vi.advanceTimersByTime(2000);  // Retry delay
        vi.advanceTimersByTime(30000); // Third timeout

        expect(manager.mode).toBe(CONNECTION_MODES.HTTP_FALLBACK);
      });
    });
  });