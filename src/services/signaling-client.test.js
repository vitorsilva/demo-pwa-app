/**
 * Tests for SignalingClient
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SignalingClient, getSignalingBaseUrl } from './signaling-client.js';

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

describe('SignalingClient', () => {
  let client;
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    client = new SignalingClient('https://example.com/party', 'ABC123', 'user-1');
  });

  afterEach(() => {
    client.destroy();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should normalize base URL by removing trailing slash', () => {
      const client1 = new SignalingClient('https://example.com/party/', 'ABC123', 'user-1');
      expect(client1.baseUrl).toBe('https://example.com/party');
      client1.destroy();
    });

    it('should uppercase room code', () => {
      const client2 = new SignalingClient('https://example.com', 'abc123', 'user-1');
      expect(client2.roomCode).toBe('ABC123');
      client2.destroy();
    });

    it('should store participant ID', () => {
      expect(client.participantId).toBe('user-1');
    });
  });

  describe('sendOffer', () => {
    it('should send offer to correct endpoint', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { messageId: 1 } }),
      });

      const offer = { type: 'offer', sdp: 'v=0\r\n...' };
      await client.sendOffer('user-2', offer);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/party/endpoints/signal.php',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: 'ABC123',
            fromId: 'user-1',
            toId: 'user-2',
            type: 'offer',
            payload: { sdp: 'v=0\r\n...', type: 'offer' },
          }),
        })
      );
    });
  });

  describe('sendAnswer', () => {
    it('should send answer to correct endpoint', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const answer = { type: 'answer', sdp: 'v=0\r\n...' };
      await client.sendAnswer('user-2', answer);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/party/endpoints/signal.php',
        expect.objectContaining({
          body: expect.stringContaining('"type":"answer"'),
        })
      );
    });
  });

  describe('sendIceCandidate', () => {
    it('should send ICE candidate with correct payload', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const candidate = {
        candidate: 'candidate:123',
        sdpMid: 'audio',
        sdpMLineIndex: 0,
      };

      await client.sendIceCandidate('user-2', candidate);

      const call = fetchMock.mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.type).toBe('ice');
      expect(body.payload.candidate).toBe('candidate:123');
      expect(body.payload.sdpMid).toBe('audio');
      expect(body.payload.sdpMLineIndex).toBe(0);
    });
  });

  describe('getPeers', () => {
    it('should fetch peers from correct endpoint', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { peers: ['user-2', 'user-3'] } }),
      });

      const peers = await client.getPeers();

      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/party/endpoints/signal.php/ABC123/user-1/peers'
      );
      expect(peers).toEqual(['user-2', 'user-3']);
    });

    it('should return empty array when no peers', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      });

      const peers = await client.getPeers();
      expect(peers).toEqual([]);
    });

    it('should throw on HTTP error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(client.getPeers()).rejects.toThrow('HTTP 500');
    });
  });

  describe('polling', () => {
    it('should start polling and call callback with messages', async () => {
      const messages = [{ id: 1, fromId: 'user-2', type: 'offer', payload: {} }];

      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { messages } }),
      });

      const callback = vi.fn();
      client.startPolling(callback);

      // Wait for first poll
      await new Promise((r) => setTimeout(r, 100));

      expect(callback).toHaveBeenCalledWith(messages[0]);

      client.stopPolling();
    });

    it('should not start polling twice', () => {
      client.startPolling(vi.fn());
      client.startPolling(vi.fn());

      expect(client.isPolling).toBe(true);
      client.stopPolling();
    });

    it('should stop polling when stopPolling is called', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { messages: [] } }),
      });

      client.startPolling(vi.fn());
      await new Promise((r) => setTimeout(r, 50));

      client.stopPolling();
      expect(client.isPolling).toBe(false);
    });

    it('should stop polling after max consecutive errors', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));
      client.maxConsecutiveErrors = 2;
      client.pollIntervalMs = 10;

      client.startPolling(vi.fn());

      // Wait for errors to accumulate
      await new Promise((r) => setTimeout(r, 100));

      expect(client.isPolling).toBe(false);
    });
  });

  describe('setPollInterval', () => {
    it('should update poll interval', () => {
      client.setPollInterval(1000);
      expect(client.pollIntervalMs).toBe(1000);
    });
  });

  describe('error handling', () => {
    it('should throw on send error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: { message: 'Bad request' } }),
      });

      await expect(client.sendOffer('user-2', { type: 'offer', sdp: '' })).rejects.toThrow(
        'Bad request'
      );
    });

    it('should handle JSON parse error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(client.sendOffer('user-2', { type: 'offer', sdp: '' })).rejects.toThrow(
        'HTTP 500'
      );
    });
  });
});

describe('getSignalingBaseUrl', () => {
  it('should return configured or default URL', () => {
    const url = getSignalingBaseUrl();
    // Returns env var if set, otherwise default
    const envUrl = import.meta.env.VITE_PARTY_API_URL;
    if (envUrl) {
      expect(url).toBe(envUrl);
    } else {
      expect(url).toBe('https://saberloop.com/party');
    }
  });
});

describe('SignalingClient edge cases', () => {
  let client;
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    client = new SignalingClient('https://example.com/party', 'ABC123', 'user-1');
  });

  afterEach(() => {
    client.destroy();
    vi.clearAllMocks();
  });

  describe('stopPolling edge cases', () => {
    it('should handle stopPolling when pollInterval is null', () => {
      // Ensure pollInterval is null
      expect(client.pollInterval).toBeNull();

      // Should not throw
      client.stopPolling();

      expect(client.isPolling).toBe(false);
    });

    it('should handle stopPolling when already stopped', () => {
      client.startPolling(vi.fn());
      client.stopPolling();

      // Call stopPolling again
      client.stopPolling();

      expect(client.isPolling).toBe(false);
      expect(client.pollInterval).toBeNull();
    });
  });

  describe('_poll edge cases', () => {
    it('should handle messages when onMessageCallback is null', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { messages: [{ id: 1 }] } }),
      });

      // Start polling then clear callback
      client.startPolling(vi.fn());
      client.onMessageCallback = null;

      // Should not throw even with null callback
      await new Promise((r) => setTimeout(r, 100));

      client.stopPolling();
    });

    it('should return early if not polling', async () => {
      // isPolling is false by default
      expect(client.isPolling).toBe(false);

      // Call _poll directly - should return early
      await client._poll();

      // fetch should not have been called
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should handle empty messages array', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { messages: [] } }),
      });

      const callback = vi.fn();
      client.startPolling(callback);

      await new Promise((r) => setTimeout(r, 100));

      // Callback should not be called for empty messages
      expect(callback).not.toHaveBeenCalled();

      client.stopPolling();
    });
  });

  describe('_fetchMessages edge cases', () => {
    it('should return empty array when data.data is undefined', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const messages = await client._fetchMessages();

      expect(messages).toEqual([]);
    });

    it('should return empty array when data.data.messages is undefined', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { otherField: 'value' } }),
      });

      const messages = await client._fetchMessages();

      expect(messages).toEqual([]);
    });
  });

  describe('getPeers edge cases', () => {
    it('should return empty array when data.data.peers is undefined', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      });

      const peers = await client.getPeers();

      expect(peers).toEqual([]);
    });

    it('should return empty array when data.data is undefined', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const peers = await client.getPeers();

      expect(peers).toEqual([]);
    });
  });

  describe('destroy', () => {
    it('should stop polling and clear callback', () => {
      const callback = vi.fn();
      client.startPolling(callback);

      client.destroy();

      expect(client.isPolling).toBe(false);
      expect(client.onMessageCallback).toBeNull();
    });

    it('should handle destroy when never started', () => {
      // Should not throw
      client.destroy();

      expect(client.onMessageCallback).toBeNull();
    });
  });

  describe('polling retry behavior', () => {
    it('should reset consecutiveErrors on successful poll', async () => {
      // First two calls fail, third succeeds
      fetchMock
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ data: { messages: [] } }),
        });

      client.pollIntervalMs = 10;
      client.maxConsecutiveErrors = 5;
      client.startPolling(vi.fn());

      // Wait for multiple polls
      await new Promise((r) => setTimeout(r, 100));

      // After success, consecutiveErrors should be 0
      expect(client.consecutiveErrors).toBe(0);

      client.stopPolling();
    });

    it('should not schedule next poll after stopping', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { messages: [] } }),
      });

      client.pollIntervalMs = 50;
      client.startPolling(vi.fn());

      // Immediately stop
      client.stopPolling();

      const fetchCount = fetchMock.mock.calls.length;

      // Wait to see if more polls happen
      await new Promise((r) => setTimeout(r, 150));

      // Should not have made many more calls
      expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(fetchCount + 1);
    });
  });
});
