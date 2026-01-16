/**
 * Retry utility with exponential backoff
 * For handling transient network failures
 */

import { logger } from './logger.js';

/**
 * @typedef {Error & {status?: number}} RetryableError
 */

/**
 * Default retry configuration
 */
const DEFAULT_OPTIONS = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 8000,
  shouldRetry: isRetryableError,
  onRetry: null
};

/**
 * Execute a function with retry logic and exponential backoff
 * @param {() => Promise<T>} fn - Async function to execute
 * @param {Object} [options] - Retry options
 * @param {number} [options.maxRetries=3] - Maximum number of attempts
 * @param {number} [options.initialDelay=1000] - Initial delay in ms
 * @param {number} [options.backoffMultiplier=2] - Delay multiplier for each retry
 * @param {number} [options.maxDelay=8000] - Maximum delay between retries
 * @param {(error: Error) => boolean} [options.shouldRetry] - Function to determine if error is retryable
 * @param {(info: {attempt: number, error: Error, delay: number}) => void} [options.onRetry] - Callback on retry
 * @returns {Promise<T>} Result of the function
 * @template T
 */
export async function withRetry(fn, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = config.shouldRetry(error);

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt >= config.maxRetries || !shouldRetry) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );

      // Log retry attempt
      logger.debug('Retrying after error', {
        attempt,
        maxRetries: config.maxRetries,
        delay,
        error: error.message
      });

      // Call onRetry callback if provided
      if (config.onRetry) {
        config.onRetry({ attempt, error, delay });
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Determine if an error is retryable
 * @param {RetryableError} error - The error to check
 * @returns {boolean} True if the error is retryable
 */
export function isRetryableError(error) {
  // Network errors (TypeError: Failed to fetch)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // Generic network errors
  if (error.message && error.message.toLowerCase().includes('network')) {
    return true;
  }

  // Check HTTP status codes
  const status = error.status;
  if (status) {
    // 5xx server errors are retryable
    if (status >= 500 && status < 600) {
      return true;
    }

    // 429 rate limit is retryable (with backoff)
    if (status === 429) {
      return true;
    }

    // 4xx client errors are NOT retryable (except 429)
    if (status >= 400 && status < 500) {
      return false;
    }
  }

  // Default: retry on unknown errors
  return true;
}

/**
 * Sleep for a given duration
 * @param {number} ms - Duration in milliseconds
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
