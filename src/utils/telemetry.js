/**
 * Telemetry Client - Collects and sends telemetry to VPS
 *
 * Features:
 * - Batches events before sending (reduces network requests)
 * - Auto-flushes on batch size or time interval
 * - Offline queue with localStorage fallback
 * - Controlled via VITE_TELEMETRY_ENABLED environment variable
 *
 * Usage:
 *   import { telemetry } from './telemetry.js';
 *   telemetry.track('error', { message: 'Something went wrong' });
 */

// Configuration from environment variables
const CONFIG = {
  enabled: import.meta.env.VITE_TELEMETRY_ENABLED === 'true',
  endpoint: import.meta.env.VITE_TELEMETRY_ENDPOINT || '',
  token: import.meta.env.VITE_TELEMETRY_TOKEN || '',
  batchSize: parseInt(import.meta.env.VITE_TELEMETRY_BATCH_SIZE, 10) || 10,
  flushInterval: parseInt(import.meta.env.VITE_TELEMETRY_FLUSH_INTERVAL, 10) || 30000,
};

// localStorage key for offline queue
const STORAGE_KEY = 'saberloop_telemetry_queue';

/**
 * TelemetryClient class
 * Singleton pattern - use the exported `telemetry` instance
 */
class TelemetryClient {
  constructor() {
    this.queue = [];
    this.flushTimer = null;
    this.sessionId = this._generateSessionId();

    // Load any events saved from previous offline session
    this._loadOfflineQueue();

    // Start flush timer if enabled
    if (this._isEnabled()) {
      this._startFlushTimer();
    }

    // Flush on page unload to capture final events
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  /**
   * Check if telemetry is enabled (via environment variable)
   * @returns {boolean}
   */
  _isEnabled() {
    return CONFIG.enabled;
  }

  /**
   * Public method to check if telemetry is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this._isEnabled();
  }

  /**
   * Generate a unique session ID for correlating events
   * @returns {string}
   */
  _generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Load any queued events from localStorage (offline recovery)
   */
  _loadOfflineQueue() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.queue = parsed;
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // Ignore localStorage errors (private browsing, etc.)
    }
  }

  /**
   * Save queue to localStorage for offline recovery
   */
  _saveOfflineQueue() {
    try {
      if (this.queue.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Start the automatic flush timer
   */
  _startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => this.flush(), CONFIG.flushInterval);
  }

  /**
   * Stop the flush timer
   */
  _stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Track an event
   * @param {string} type - Event type: 'log', 'error', 'metric', 'event'
   * @param {Object} data - Event data
   */
  track(type, data = {}) {
    if (!this._isEnabled()) {
      return;
    }

    const event = {
      type,
      data,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    this.queue.push(event);

    // Flush if batch size reached
    if (this.queue.length >= CONFIG.batchSize) {
      this.flush();
    }
  }

  /**
   * Send queued events to VPS
   * @returns {Promise<boolean>} - Success status
   */
  async flush() {
    if (!this._isEnabled() || this.queue.length === 0) {
      return true;
    }

    // Don't flush if no endpoint configured
    if (!CONFIG.endpoint) {
      console.warn('[Telemetry] No endpoint configured');
      return false;
    }

    // Take current queue and clear it (so new events go to fresh queue)
    const eventsToSend = [...this.queue];
    this.queue = [];

    try {
      const response = await fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telemetry-Token': CONFIG.token,
        },
        body: JSON.stringify({
          events: eventsToSend,
          sentAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Success - events are sent
      return true;
    } catch (error) {
      // Failed - put events back in queue and save to localStorage
      this.queue = [...eventsToSend, ...this.queue];
      this._saveOfflineQueue();
      console.warn('[Telemetry] Failed to send, saved to offline queue:', error.message);
      return false;
    }
  }

  /**
   * Get current queue size (useful for debugging/testing)
   * @returns {number}
   */
  getQueueSize() {
    return this.queue.length;
  }

  /**
   * Clear the queue (useful for testing)
   */
  clearQueue() {
    this.queue = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

// Export singleton instance
export const telemetry = new TelemetryClient();

// Also export class for testing
export { TelemetryClient, CONFIG };
