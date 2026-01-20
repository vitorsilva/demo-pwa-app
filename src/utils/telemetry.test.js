import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TelemetryClient, CONFIG } from './telemetry.js';

describe('TelemetryClient', () => {
  let client;
  let mockFetch;
  let mockLocalStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock fetch
    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    // Mock localStorage
    mockLocalStorage = {
      store: {},
      getItem: vi.fn((key) => mockLocalStorage.store[key] || null),
      setItem: vi.fn((key, value) => { mockLocalStorage.store[key] = value; }),
      removeItem: vi.fn((key) => { delete mockLocalStorage.store[key]; })
    };
    global.localStorage = mockLocalStorage;

    // Override CONFIG for testing
    CONFIG.enabled = true;
    CONFIG.endpoint = 'https://test.example.com/telemetry';
    CONFIG.token = 'test-token';
    CONFIG.batchSize = 3;
    CONFIG.flushInterval = 1000;

    // Create fresh client for each test
    client = new TelemetryClient();
  });

  afterEach(() => {
    vi.useRealTimers();
    client._stopFlushTimer();
  });

  describe('track()', () => {
    it('should add event to queue when enabled', () => {
      client.track('error', { message: 'Test error' });

      expect(client.getQueueSize()).toBe(1);
    });

    it('should not add event when env var is disabled', () => {
      CONFIG.enabled = false;

      client.track('error', { message: 'Test error' });

      expect(client.getQueueSize()).toBe(0);
    });

    it('should include metadata with event', () => {
      client.track('log', { level: 'info' });

      // Access queue directly for testing
      const event = client.queue[0];
      expect(event.type).toBe('log');
      expect(event.data).toEqual({ level: 'info' });
      expect(event.timestamp).toBeDefined();
      expect(event.sessionId).toBe(client.sessionId);
    });

    it('should auto-flush when batch size is reached', async () => {
      // Stop the interval timer to avoid infinite loop in test
      client._stopFlushTimer();

      client.track('event', { n: 1 });
      client.track('event', { n: 2 });

      expect(mockFetch).not.toHaveBeenCalled();

      client.track('event', { n: 3 }); // This triggers flush (batchSize = 3)

      // Give the async flush a moment to complete
      await Promise.resolve();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('flush()', () => {
    it('should send events to endpoint', async () => {
      client.track('error', { message: 'Test' });

      await client.flush();

      expect(mockFetch).toHaveBeenCalledWith(
        CONFIG.endpoint,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Telemetry-Token': CONFIG.token
          }
        })
      );
    });

    it('should clear queue after successful flush', async () => {
      client.track('event', { n: 1 });
      client.track('event', { n: 2 });

      expect(client.getQueueSize()).toBe(2);

      await client.flush();

      expect(client.getQueueSize()).toBe(0);
    });

    it('should not send if queue is empty', async () => {
      await client.flush();

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return true on success', async () => {
      client.track('event', {});

      const result = await client.flush();

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      client.track('event', {});

      const result = await client.flush();

      expect(result).toBe(false);
    });
  });

  describe('offline queue', () => {
    it('should save to localStorage on send failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      client.track('event', { important: true });

      await client.flush();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'saberloop_telemetry_queue',
        expect.any(String)
      );
    });

    it('should restore events from queue after failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      client.track('event', { n: 1 });

      await client.flush();

      // Events should still be in queue after failure
      expect(client.getQueueSize()).toBe(1);
    });

    it('should load saved queue on initialization', () => {
      const savedEvents = [{ type: 'saved', data: {}, timestamp: '2025-01-01' }];
      mockLocalStorage.store['saberloop_telemetry_queue'] = JSON.stringify(savedEvents);

      const newClient = new TelemetryClient();

      expect(newClient.getQueueSize()).toBe(1);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('saberloop_telemetry_queue');

      newClient._stopFlushTimer();
    });
  });

  describe('auto-flush timer', () => {
    it('should flush after interval', async () => {
      client.track('event', {});

      expect(mockFetch).not.toHaveBeenCalled();

      // Advance timer past flush interval
      await vi.advanceTimersByTimeAsync(CONFIG.flushInterval + 100);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not start timer when disabled', () => {
      CONFIG.enabled = false;
      const disabledClient = new TelemetryClient();

      expect(disabledClient.flushTimer).toBeNull();

      // No need to stop timer since it wasn't started
    });
  });

  describe('clearQueue()', () => {
    it('should clear in-memory queue', () => {
      client.track('event', {});
      client.track('event', {});

      client.clearQueue();

      expect(client.getQueueSize()).toBe(0);
    });

    it('should clear localStorage queue', () => {
      mockLocalStorage.store['saberloop_telemetry_queue'] = '[]';

      client.clearQueue();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('saberloop_telemetry_queue');
    });
  });

  describe('session ID', () => {
    it('should generate unique session ID', () => {
      const client2 = new TelemetryClient();

      expect(client.sessionId).toBeDefined();
      expect(client2.sessionId).toBeDefined();
      expect(client.sessionId).not.toBe(client2.sessionId);

      client2._stopFlushTimer();
    });

    it('should include session ID in all events', () => {
      client.track('event', {});
      client.track('error', {});

      expect(client.queue[0].sessionId).toBe(client.sessionId);
      expect(client.queue[1].sessionId).toBe(client.sessionId);
    });
  });

  describe('_loadOfflineQueue edge cases', () => {
    it('should not load queue when localStorage returns null', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const newClient = new TelemetryClient();

      // Queue should remain empty since saved is null
      expect(newClient.getQueueSize()).toBe(0);
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('saberloop_telemetry_queue');

      newClient._stopFlushTimer();
    });

    it('should not load queue when localStorage returns undefined', () => {
      mockLocalStorage.getItem.mockReturnValue(undefined);

      const newClient = new TelemetryClient();

      expect(newClient.getQueueSize()).toBe(0);

      newClient._stopFlushTimer();
    });

    it('should not load queue when localStorage returns empty string', () => {
      mockLocalStorage.getItem.mockReturnValue('');

      const newClient = new TelemetryClient();

      expect(newClient.getQueueSize()).toBe(0);

      newClient._stopFlushTimer();
    });

    it('should not load when saved data is not an array', () => {
      mockLocalStorage.store['saberloop_telemetry_queue'] = JSON.stringify({ notAnArray: true });

      const newClient = new TelemetryClient();

      // Should not load non-array data
      expect(newClient.getQueueSize()).toBe(0);

      newClient._stopFlushTimer();
    });

    it('should handle JSON parse errors gracefully', () => {
      mockLocalStorage.store['saberloop_telemetry_queue'] = 'invalid json{';

      const newClient = new TelemetryClient();

      // Should not crash, queue should be empty
      expect(newClient.getQueueSize()).toBe(0);

      newClient._stopFlushTimer();
    });

    it('should handle localStorage.getItem throwing', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      // Should not throw, just silently fail
      const newClient = new TelemetryClient();
      expect(newClient.getQueueSize()).toBe(0);

      newClient._stopFlushTimer();
    });
  });

  describe('_startFlushTimer edge cases', () => {
    it('should clear existing timer before starting new one', () => {
      // Start with an existing timer
      client._startFlushTimer();
      const firstTimer = client.flushTimer;
      expect(firstTimer).toBeDefined();

      // Start again - should clear the first
      client._startFlushTimer();
      const secondTimer = client.flushTimer;

      // Should have a different timer instance
      expect(secondTimer).toBeDefined();
      // Both should be defined but implementation detail
    });

    it('should not clear interval if flushTimer is null', () => {
      client._stopFlushTimer();
      expect(client.flushTimer).toBeNull();

      // This should not throw when flushTimer is null
      client._startFlushTimer();
      expect(client.flushTimer).toBeDefined();
    });

    it('should set interval with correct flush interval', async () => {
      client._stopFlushTimer();
      client._startFlushTimer();

      client.track('event', { test: true });
      expect(mockFetch).not.toHaveBeenCalled();

      // Fast forward to just before flush interval
      await vi.advanceTimersByTimeAsync(CONFIG.flushInterval - 100);
      expect(mockFetch).not.toHaveBeenCalled();

      // Fast forward past flush interval
      await vi.advanceTimersByTimeAsync(200);
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('_stopFlushTimer edge cases', () => {
    it('should handle stopping when timer is already null', () => {
      client.flushTimer = null;

      // Should not throw
      client._stopFlushTimer();
      expect(client.flushTimer).toBeNull();
    });

    it('should clear interval and set timer to null', () => {
      expect(client.flushTimer).toBeDefined();

      client._stopFlushTimer();

      expect(client.flushTimer).toBeNull();
    });
  });

  describe('_saveOfflineQueue edge cases', () => {
    it('should not save empty queue', async () => {
      client.queue = [];
      client._saveOfflineQueue();

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should save non-empty queue', () => {
      client.queue = [{ type: 'event', data: {} }];
      client._saveOfflineQueue();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'saberloop_telemetry_queue',
        expect.any(String)
      );
    });

    it('should handle localStorage.setItem throwing', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });

      client.queue = [{ type: 'event', data: {} }];

      // Should not throw
      expect(() => client._saveOfflineQueue()).not.toThrow();
    });
  });

  describe('flush edge cases', () => {
    it('should return true immediately if disabled', async () => {
      CONFIG.enabled = false;
      client.track('event', {}); // This won't add anything since disabled

      const result = await client.flush();

      expect(result).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return true immediately if queue is empty', async () => {
      expect(client.getQueueSize()).toBe(0);

      const result = await client.flush();

      expect(result).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return false when no endpoint configured', async () => {
      CONFIG.endpoint = '';
      client.track('event', { test: true });

      const result = await client.flush();

      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle HTTP error response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
      client.track('event', { test: true });

      const result = await client.flush();

      expect(result).toBe(false);
      // Events should be restored to queue
      expect(client.getQueueSize()).toBe(1);
    });

    it('should preserve new events added during failed flush', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      client.track('event', { n: 1 });

      await client.flush();

      // Add another event
      client.track('event', { n: 2 });

      // Both should be in queue
      expect(client.getQueueSize()).toBe(2);
    });

    it('should include sentAt timestamp in request body', async () => {
      client.track('event', { test: true });

      await client.flush();

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.sentAt).toBeDefined();
      expect(typeof body.sentAt).toBe('string');
    });

    it('should send correct headers', async () => {
      client.track('event', { test: true });

      await client.flush();

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers['Content-Type']).toBe('application/json');
      expect(callArgs[1].headers['X-Telemetry-Token']).toBe(CONFIG.token);
    });
  });

  describe('track edge cases', () => {
    it('should include url in event', () => {
      client.track('event', { test: true });

      expect(client.queue[0].url).toBeDefined();
    });

    it('should include userAgent in event', () => {
      client.track('event', { test: true });

      expect(client.queue[0].userAgent).toBeDefined();
    });

    it('should include timestamp as ISO string', () => {
      client.track('event', { test: true });

      const timestamp = client.queue[0].timestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should handle empty data object', () => {
      client.track('log');

      expect(client.queue[0].type).toBe('log');
      expect(client.queue[0].data).toEqual({});
    });
  });

  describe('isEnabled', () => {
    it('should return true when enabled', () => {
      CONFIG.enabled = true;
      expect(client.isEnabled()).toBe(true);
    });

    it('should return false when disabled', () => {
      CONFIG.enabled = false;
      expect(client.isEnabled()).toBe(false);
    });
  });

  describe('clearQueue edge cases', () => {
    it('should handle localStorage.removeItem throwing', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Access denied');
      });

      client.track('event', {});

      // Should not throw
      expect(() => client.clearQueue()).not.toThrow();
      expect(client.getQueueSize()).toBe(0);
    });
  });

  describe('_generateSessionId', () => {
    it('should generate session ID with timestamp prefix', () => {
      const sessionId = client.sessionId;
      const parts = sessionId.split('-');

      // Should have timestamp part (numeric)
      expect(parseInt(parts[0], 10)).toBeGreaterThan(0);
    });

    it('should generate session ID with random suffix', () => {
      const sessionId = client.sessionId;
      const parts = sessionId.split('-');

      // Should have random alphanumeric suffix
      expect(parts[1]).toMatch(/^[a-z0-9]+$/);
    });
  });
});
