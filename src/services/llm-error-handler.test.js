import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseProviderError,
  handleLLMError,
  withRetry,
  LLM_ERROR_CODES,
} from './llm-error-handler.js';

// Mock i18n
vi.mock('../core/i18n.js', () => ({
  t: vi.fn((key, params) => {
    // Return a message based on the key for testing
    const messages = {
      'errors.providerNetworkError': 'Network error',
      'errors.providerInvalidKey': `Invalid key for ${params?.provider || 'provider'}`,
      'errors.providerRateLimited': 'Rate limited',
      'errors.providerInsufficientCredits': `Insufficient credits for ${params?.provider || 'provider'}`,
      'errors.providerServerError': 'Server error',
      'errors.providerRequestError': 'Request error',
      'errors.providerUnknownError': 'Unknown error',
    };
    return messages[key] || key;
  }),
}));

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LLM Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseProviderError', () => {
    it('should identify network errors', () => {
      const error = new TypeError('Failed to fetch');
      const result = parseProviderError('openai', error, null);

      expect(result.code).toBe(LLM_ERROR_CODES.NETWORK_ERROR);
      expect(result.httpStatus).toBeNull();
      expect(result.retryable).toBe(true);
      expect(result.message).toBe('Network error');
    });

    it('should identify invalid key (401)', () => {
      const response = { status: 401 };
      const result = parseProviderError('openai', {}, response);

      expect(result.code).toBe(LLM_ERROR_CODES.INVALID_API_KEY);
      expect(result.httpStatus).toBe(401);
      expect(result.retryable).toBe(false);
      expect(result.message).toContain('Invalid key');
    });

    it('should identify rate limiting (429)', () => {
      const response = {
        status: 429,
        headers: { get: () => '60' },
      };
      const result = parseProviderError('anthropic', {}, response);

      expect(result.code).toBe(LLM_ERROR_CODES.RATE_LIMITED);
      expect(result.httpStatus).toBe(429);
      expect(result.retryable).toBe(true);
      expect(result.retryAfter).toBe(60);
    });

    it('should identify rate limiting without retry-after header', () => {
      const response = {
        status: 429,
        headers: { get: () => null },
      };
      const result = parseProviderError('anthropic', {}, response);

      expect(result.code).toBe(LLM_ERROR_CODES.RATE_LIMITED);
      expect(result.retryAfter).toBe(60); // Default fallback
    });

    it('should identify insufficient credits (402)', () => {
      const response = { status: 402 };
      const result = parseProviderError('openai', {}, response);

      expect(result.code).toBe(LLM_ERROR_CODES.INSUFFICIENT_CREDITS);
      expect(result.httpStatus).toBe(402);
      expect(result.retryable).toBe(false);
    });

    it('should identify server errors (5xx)', () => {
      const response = { status: 503 };
      const result = parseProviderError('google', {}, response);

      expect(result.code).toBe(LLM_ERROR_CODES.PROVIDER_ERROR);
      expect(result.httpStatus).toBe(503);
      expect(result.retryable).toBe(true);
    });

    it('should preserve actual 5xx status code', () => {
      const response500 = { status: 500 };
      const response502 = { status: 502 };
      const response504 = { status: 504 };

      expect(parseProviderError('openai', {}, response500).httpStatus).toBe(500);
      expect(parseProviderError('openai', {}, response502).httpStatus).toBe(502);
      expect(parseProviderError('openai', {}, response504).httpStatus).toBe(504);
    });

    it('should identify other HTTP errors as non-retryable', () => {
      const response = { status: 400 };
      const result = parseProviderError('openai', {}, response);

      expect(result.code).toBe(LLM_ERROR_CODES.PROVIDER_ERROR);
      expect(result.httpStatus).toBe(400);
      expect(result.retryable).toBe(false);
    });

    it('should parse invalid_request_error from error body', () => {
      const error = {
        error: {
          type: 'invalid_request_error',
          message: 'Custom error message',
        },
      };
      const result = parseProviderError('anthropic', error, null);

      expect(result.code).toBe(LLM_ERROR_CODES.PROVIDER_ERROR);
      expect(result.message).toBe('Custom error message');
      expect(result.retryable).toBe(false);
    });

    it('should return unknown error as fallback', () => {
      const result = parseProviderError('openai', {}, null);

      expect(result.code).toBe(LLM_ERROR_CODES.UNKNOWN);
      expect(result.httpStatus).toBeNull();
      expect(result.retryable).toBe(false);
    });
  });

  describe('handleLLMError', () => {
    it('should return structured error with context', () => {
      const error = { response: { status: 401 } };
      const result = handleLLMError(error, {
        providerId: 'openai',
        operation: 'generateQuestions',
      });

      expect(result.code).toBe(LLM_ERROR_CODES.INVALID_API_KEY);
      expect(result.providerId).toBe('openai');
      expect(result.operation).toBe('generateQuestions');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('number');
    });

    it('should log error to telemetry', async () => {
      const { logger } = await import('../utils/logger.js');

      const error = { response: { status: 503 } };
      handleLLMError(error, { providerId: 'google', operation: 'test' });

      expect(logger.error).toHaveBeenCalledWith(
        'LLM operation failed',
        expect.objectContaining({
          providerId: 'google',
          operation: 'test',
          errorCode: LLM_ERROR_CODES.PROVIDER_ERROR,
          httpStatus: 503,
        })
      );
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValueOnce('success');

      const result = await withRetry(fn, { baseDelay: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable error', async () => {
      const fn = vi.fn().mockRejectedValue({ response: { status: 401 } });

      await expect(withRetry(fn)).rejects.toEqual({ response: { status: 401 } });
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should respect maxRetries limit', async () => {
      const fn = vi.fn().mockRejectedValue({ response: { status: 503 } });

      await expect(withRetry(fn, { maxRetries: 2, baseDelay: 10 })).rejects.toEqual({
        response: { status: 503 },
      });

      // Initial attempt + 2 retries = 3 calls
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback before each retry', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValueOnce('success');

      const onRetry = vi.fn();

      await withRetry(fn, { baseDelay: 10, onRetry });

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          attempt: 1,
          delay: expect.any(Number),
        })
      );
    });

    it('should use exponential backoff', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValueOnce('success');

      const delays = [];
      const onRetry = ({ delay }) => delays.push(delay);

      await withRetry(fn, { baseDelay: 100, onRetry });

      // First retry: 100 * 2^0 = 100
      // Second retry: 100 * 2^1 = 200
      expect(delays[0]).toBe(100);
      expect(delays[1]).toBe(200);
    });

    it('should respect maxDelay', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValueOnce('success');

      const delays = [];
      const onRetry = ({ delay }) => delays.push(delay);

      await withRetry(fn, { baseDelay: 100, maxDelay: 150, maxRetries: 3, onRetry });

      // Third retry would be 100 * 2^2 = 400, but capped at 150
      expect(delays[2]).toBe(150);
    });

    it('should use retry-after header when available', async () => {
      // Create error with headers that return retry-after
      // Use a small value (1 second) to keep test fast
      const error = {
        response: {
          status: 429,
          headers: { get: () => '1' }, // 1 second
        },
      };

      const fn = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce('success');

      const delays = [];
      const onRetry = ({ delay }) => delays.push(delay);

      // Mock setTimeout to make test faster
      vi.useFakeTimers();
      const retryPromise = withRetry(fn, { baseDelay: 100, onRetry });

      // Advance timers to complete the retry delay
      await vi.advanceTimersByTimeAsync(1000);

      const result = await retryPromise;
      vi.useRealTimers();

      expect(result).toBe('success');
      // Should use retry-after (1 second = 1000ms) instead of baseDelay
      expect(delays[0]).toBe(1000);
    });
  });
});
