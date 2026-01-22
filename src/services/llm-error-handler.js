/**
 * LLM Error Handler
 * Centralized error handling for all LLM operations
 */

import { t } from '../core/i18n.js';
import { logger } from '../utils/logger.js';

export const LLM_ERROR_CODES = {
  // Authentication errors
  INVALID_API_KEY: 'invalid_api_key',
  EXPIRED_API_KEY: 'expired_api_key',
  INSUFFICIENT_CREDITS: 'insufficient_credits',

  // Rate limiting
  RATE_LIMITED: 'rate_limited',
  QUOTA_EXCEEDED: 'quota_exceeded',

  // Network errors
  NETWORK_ERROR: 'network_error',
  TIMEOUT: 'timeout',
  PROXY_ERROR: 'proxy_error',

  // Provider errors
  PROVIDER_ERROR: 'provider_error',
  MODEL_NOT_AVAILABLE: 'model_not_available',
  CONTENT_FILTERED: 'content_filtered',

  // General
  UNKNOWN: 'unknown',
};

/**
 * Parse error from provider response
 * Returns httpStatus for telemetry (preserves actual HTTP code for debugging)
 * @param {string} providerId - Provider ID
 * @param {Error|object} error - Error object
 * @param {Response|object} response - HTTP response object
 * @returns {object} Parsed error with code, httpStatus, message, and retryable flag
 */
export function parseProviderError(providerId, error, response) {
  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: LLM_ERROR_CODES.NETWORK_ERROR,
      httpStatus: null, // No HTTP status for network errors
      message: t('errors.providerNetworkError'),
      retryable: true,
    };
  }

  // Handle HTTP status codes
  if (response) {
    const status = response.status;

    if (status === 401) {
      return {
        code: LLM_ERROR_CODES.INVALID_API_KEY,
        httpStatus: 401,
        message: t('errors.providerInvalidKey', { provider: providerId }),
        retryable: false,
      };
    }

    if (status === 429) {
      const retryAfter = response.headers?.get?.('retry-after');
      return {
        code: LLM_ERROR_CODES.RATE_LIMITED,
        httpStatus: 429,
        message: t('errors.providerRateLimited'),
        retryable: true,
        retryAfter: retryAfter ? parseInt(retryAfter, 10) : 60,
      };
    }

    if (status === 402) {
      return {
        code: LLM_ERROR_CODES.INSUFFICIENT_CREDITS,
        httpStatus: 402,
        message: t('errors.providerInsufficientCredits', { provider: providerId }),
        retryable: false,
      };
    }

    if (status >= 500) {
      return {
        code: LLM_ERROR_CODES.PROVIDER_ERROR,
        httpStatus: status, // Preserve actual 5xx code (500, 502, 503, etc.)
        message: t('errors.providerServerError'),
        retryable: true,
      };
    }

    // Other HTTP errors (400, 403, etc.)
    return {
      code: LLM_ERROR_CODES.PROVIDER_ERROR,
      httpStatus: status,
      message: t('errors.providerRequestError'),
      retryable: false,
    };
  }

  // Parse error body if available
  if (error?.error?.type === 'invalid_request_error') {
    return {
      code: LLM_ERROR_CODES.PROVIDER_ERROR,
      httpStatus: null,
      message: error.error.message || t('errors.providerRequestError'),
      retryable: false,
    };
  }

  // Default unknown error
  return {
    code: LLM_ERROR_CODES.UNKNOWN,
    httpStatus: null,
    message: t('errors.providerUnknownError'),
    retryable: false,
  };
}

/**
 * Handle error with user-friendly messaging
 * Logs to telemetry with actual HTTP status code for debugging
 * @param {Error|object} error - Error object
 * @param {object} context - Context about the error
 * @param {string} context.providerId - Provider ID
 * @param {string} context.operation - Operation name (e.g., 'generateQuestions')
 * @returns {object} Structured error with user-friendly message
 */
export function handleLLMError(error, context = {}) {
  const { providerId, operation } = context;

  // Parse and return structured error
  const parsed = parseProviderError(providerId, error, error.response);

  // Log to telemetry with HTTP status code (not just error code)
  logger.error('LLM operation failed', {
    providerId,
    operation,
    errorCode: parsed.code,
    httpStatus: parsed.httpStatus, // Actual HTTP status for debugging (401, 429, 503, etc.)
    error: error.message || error,
  });

  return {
    ...parsed,
    providerId,
    operation,
    timestamp: Date.now(),
  };
}

/**
 * Retry wrapper for LLM operations
 * @param {Function} fn - Async function to retry
 * @param {object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {Function} options.onRetry - Callback called before each retry
 * @returns {Promise<*>} Result of the function
 */
export async function withRetry(fn, options = {}) {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000, onRetry = () => {} } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const parsed = parseProviderError(null, error, error.response);

      // Don't retry non-retryable errors
      if (!parsed.retryable || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      // Use retry-after header if available
      const actualDelay = parsed.retryAfter ? parsed.retryAfter * 1000 : delay;

      onRetry({ attempt: attempt + 1, delay: actualDelay, error });

      await new Promise((resolve) => setTimeout(resolve, actualDelay));
    }
  }

  throw lastError;
}
