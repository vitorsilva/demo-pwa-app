import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, isRetryableError } from './retry.js';

describe('retry utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('withRetry', () => {
    it('succeeds on first attempt without retry', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const promise = withRetry(fn);

      // First attempt fails immediately
      await vi.advanceTimersByTimeAsync(0);

      // Wait for first retry delay (1000ms)
      await vi.advanceTimersByTimeAsync(1000);

      // Wait for second retry delay (2000ms)
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('uses exponential backoff delays', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const promise = withRetry(fn, { maxRetries: 4 });

      // First attempt (immediate)
      await vi.advanceTimersByTimeAsync(0);
      expect(fn).toHaveBeenCalledTimes(1);

      // First retry after 1000ms
      await vi.advanceTimersByTimeAsync(999);
      expect(fn).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(fn).toHaveBeenCalledTimes(2);

      // Second retry after 2000ms
      await vi.advanceTimersByTimeAsync(1999);
      expect(fn).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);
      expect(fn).toHaveBeenCalledTimes(3);

      // Third retry after 4000ms
      await vi.advanceTimersByTimeAsync(3999);
      expect(fn).toHaveBeenCalledTimes(3);
      await vi.advanceTimersByTimeAsync(1);
      expect(fn).toHaveBeenCalledTimes(4);

      const result = await promise;
      expect(result).toBe('success');
    });

    it('gives up after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

      const promise = withRetry(fn, { maxRetries: 3 });

      // Catch the rejection to avoid unhandled rejection warnings
      promise.catch(() => {});

      // Advance through all retries
      await vi.advanceTimersByTimeAsync(0); // attempt 1
      await vi.advanceTimersByTimeAsync(1000); // attempt 2
      await vi.advanceTimersByTimeAsync(2000); // attempt 3

      await expect(promise).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('does not retry non-retryable errors', async () => {
      const nonRetryableError = new Error('Invalid API key');
      nonRetryableError.status = 401;

      const fn = vi.fn().mockRejectedValue(nonRetryableError);

      const promise = withRetry(fn, {
        shouldRetry: (error) => isRetryableError(error),
      });

      await expect(promise).rejects.toThrow('Invalid API key');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('respects custom maxRetries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      const promise = withRetry(fn, { maxRetries: 2 });

      // Catch the rejection to avoid unhandled rejection warnings
      promise.catch(() => {});

      await vi.advanceTimersByTimeAsync(0); // attempt 1
      await vi.advanceTimersByTimeAsync(1000); // attempt 2

      await expect(promise).rejects.toThrow('fail');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('calls onRetry callback with attempt info', async () => {
      const onRetry = vi.fn();
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const promise = withRetry(fn, { onRetry });

      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      await promise;

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          attempt: 1,
          error: expect.any(Error),
          delay: 1000,
        })
      );
      expect(onRetry).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          attempt: 2,
          error: expect.any(Error),
          delay: 2000,
        })
      );
    });
  });

  describe('isRetryableError', () => {
    it('returns true for network errors', () => {
      expect(isRetryableError(new TypeError('Failed to fetch'))).toBe(true);
      expect(isRetryableError(new Error('Network error'))).toBe(true);
    });

    it('returns true for 5xx server errors', () => {
      const error = new Error('Server error');
      error.status = 500;
      expect(isRetryableError(error)).toBe(true);

      error.status = 502;
      expect(isRetryableError(error)).toBe(true);

      error.status = 503;
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for 429 rate limit', () => {
      const error = new Error('Rate limited');
      error.status = 429;
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns false for 401 auth errors', () => {
      const error = new Error('Unauthorized');
      error.status = 401;
      expect(isRetryableError(error)).toBe(false);
    });

    it('returns false for 402 payment errors', () => {
      const error = new Error('Payment required');
      error.status = 402;
      expect(isRetryableError(error)).toBe(false);
    });

    it('returns false for 400 bad request', () => {
      const error = new Error('Bad request');
      error.status = 400;
      expect(isRetryableError(error)).toBe(false);
    });
  });
});
