import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the logger module - must be before imports that use it
vi.mock('./logger.js', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock the telemetry module
vi.mock('./telemetry.js', () => ({
  telemetry: {
    track: vi.fn(),
  },
}));

// Import after mocks are set up
import { handleApiError, initErrorHandling } from './errorHandler.js';
import { logger } from './logger.js';
import { telemetry } from './telemetry.js';

describe('Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleApiError', () => {
    it('should return network error message for fetch errors', () => {
      const error = new Error('Failed to fetch');
      const message = handleApiError(error);
      expect(message).toContain('Network error');
    });

    it('should return network error message for network errors', () => {
      const error = new Error('network error occurred');
      const message = handleApiError(error);
      expect(message).toContain('Network error');
    });

    it('should return API key message for 401 errors', () => {
      const error = new Error('401 Unauthorized');
      const message = handleApiError(error);
      expect(message).toContain('API key');
    });

    it('should return API key message for API key errors', () => {
      const error = new Error('Invalid API key');
      const message = handleApiError(error);
      expect(message).toContain('API key');
    });

    it('should return rate limit message for 429 errors', () => {
      const error = new Error('429 Too Many Requests');
      const message = handleApiError(error);
      expect(message).toContain('Rate limit');
    });

    it('should return rate limit message for rate limit errors', () => {
      const error = new Error('Rate limit exceeded');
      const message = handleApiError(error);
      expect(message).toContain('Rate limit');
    });

    it('should return timeout message for timeout errors', () => {
      const error = new Error('Request timeout');
      const message = handleApiError(error);
      expect(message).toContain('timed out');
    });

    it('should return generic message for unknown errors', () => {
      const error = new Error('Something weird happened');
      const message = handleApiError(error);
      expect(message).toContain('An error occurred');
    });

    it('should log errors with context', () => {
      const error = new Error('Test error');
      handleApiError(error, { endpoint: '/api/test' });

      expect(logger.error).toHaveBeenCalledWith('API error', {
        message: 'Test error',
        endpoint: '/api/test',
      });
    });
  });

  describe('initErrorHandling', () => {
    let errorHandler;
    let rejectionHandler;
    let originalAddEventListener;

    beforeEach(() => {
      // Store original and capture event handlers
      originalAddEventListener = window.addEventListener;
      window.addEventListener = vi.fn((event, handler) => {
        if (event === 'error') errorHandler = handler;
        if (event === 'unhandledrejection') rejectionHandler = handler;
      });

      // Clear any existing notifications
      document.body.innerHTML = '';
    });

    afterEach(() => {
      window.addEventListener = originalAddEventListener;
    });

    it('should register error event listener', () => {
      initErrorHandling();
      expect(window.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should register unhandledrejection event listener', () => {
      initErrorHandling();
      expect(window.addEventListener).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );
    });

    it('should log initialization message', () => {
      initErrorHandling();
      expect(logger.info).toHaveBeenCalledWith('Error handling initialized');
    });

    it('should log and track uncaught errors', () => {
      initErrorHandling();

      const mockEvent = {
        message: 'Test uncaught error',
        filename: 'test.js',
        lineno: 42,
        colno: 10,
      };
      errorHandler(mockEvent);

      expect(logger.error).toHaveBeenCalledWith('Uncaught error', {
        message: 'Test uncaught error',
        filename: 'test.js',
        line: 42,
        column: 10,
      });

      expect(telemetry.track).toHaveBeenCalledWith('error', {
        type: 'uncaught',
        message: 'Test uncaught error',
        filename: 'test.js',
        line: 42,
        column: 10,
      });
    });

    it('should handle unhandled promise rejections with Error object', () => {
      initErrorHandling();

      const mockEvent = {
        reason: new Error('Promise failed'),
        preventDefault: vi.fn(),
      };
      rejectionHandler(mockEvent);

      expect(logger.error).toHaveBeenCalledWith('Unhandled promise rejection', {
        reason: 'Promise failed',
      });

      expect(telemetry.track).toHaveBeenCalledWith('error', {
        type: 'unhandledrejection',
        reason: 'Promise failed',
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle unhandled promise rejections with string reason', () => {
      initErrorHandling();

      const mockEvent = {
        reason: 'Simple string rejection',
        preventDefault: vi.fn(),
      };
      rejectionHandler(mockEvent);

      expect(logger.error).toHaveBeenCalledWith('Unhandled promise rejection', {
        reason: 'Simple string rejection',
      });
    });

    it('should create error notification on uncaught error', () => {
      initErrorHandling();

      const mockEvent = {
        message: 'Test error',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
      };
      errorHandler(mockEvent);

      const notification = document.getElementById('error-notification');
      expect(notification).toBeTruthy();
      expect(notification.textContent).toContain('An unexpected error occurred');
    });

    it('should create error notification on unhandled rejection', () => {
      initErrorHandling();

      const mockEvent = {
        reason: new Error('Rejection'),
        preventDefault: vi.fn(),
      };
      rejectionHandler(mockEvent);

      const notification = document.getElementById('error-notification');
      expect(notification).toBeTruthy();
      expect(notification.textContent).toContain('Something went wrong');
    });

    it('should return false from error handler', () => {
      initErrorHandling();

      const mockEvent = {
        message: 'Test',
        filename: '',
        lineno: 0,
        colno: 0,
      };
      const result = errorHandler(mockEvent);

      expect(result).toBe(false);
    });
  });

  describe('showErrorNotification (via initErrorHandling)', () => {
    let errorHandler;
    let originalAddEventListener;

    beforeEach(() => {
      vi.useFakeTimers();
      originalAddEventListener = window.addEventListener;
      window.addEventListener = vi.fn((event, handler) => {
        if (event === 'error') errorHandler = handler;
      });
      document.body.innerHTML = '';
    });

    afterEach(() => {
      vi.useRealTimers();
      window.addEventListener = originalAddEventListener;
    });

    it('should auto-dismiss notification after 5 seconds', () => {
      initErrorHandling();

      errorHandler({
        message: 'Test',
        filename: '',
        lineno: 0,
        colno: 0,
      });

      expect(document.getElementById('error-notification')).toBeTruthy();

      vi.advanceTimersByTime(5000);

      expect(document.getElementById('error-notification')).toBeFalsy();
    });

    it('should remove existing notification before showing new one', () => {
      initErrorHandling();

      const mockEvent = {
        message: 'First error',
        filename: '',
        lineno: 0,
        colno: 0,
      };

      errorHandler(mockEvent);
      errorHandler(mockEvent);

      const notifications = document.querySelectorAll('#error-notification');
      expect(notifications.length).toBe(1);
    });

    it('should not fail if notification already removed before auto-dismiss', () => {
      initErrorHandling();

      errorHandler({
        message: 'Test',
        filename: '',
        lineno: 0,
        colno: 0,
      });

      // Manually remove the notification (simulating user clicking close)
      const notification = document.getElementById('error-notification');
      notification.remove();

      // Should not throw when timer fires
      expect(() => {
        vi.advanceTimersByTime(5000);
      }).not.toThrow();
    });
  });
});
