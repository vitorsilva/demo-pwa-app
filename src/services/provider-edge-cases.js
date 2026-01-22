/**
 * Provider Edge Cases
 * Handle special scenarios and edge cases for LLM providers
 */

import {
  getActiveProvider,
  getProviderKey,
  getKeyStatus,
  KEY_STATUS,
} from './provider-settings-service.js';
import { getOpenRouterKey } from '../core/db.js';
import { logger } from '../utils/logger.js';

/**
 * Check if provider is ready to use
 * @returns {Promise<{ready: boolean, reason?: string, action?: string}>}
 */
export async function checkProviderReady() {
  const providerId = await getActiveProvider();

  // OpenRouter uses OAuth, not API key
  if (providerId === 'openrouter') {
    const hasToken = await checkOpenRouterToken();
    if (!hasToken) {
      return {
        ready: false,
        reason: 'openrouter_not_connected',
        action: 'connect_openrouter',
      };
    }
    return { ready: true };
  }

  // Other providers need API key
  const apiKey = await getProviderKey(providerId);
  if (!apiKey) {
    return {
      ready: false,
      reason: 'no_api_key',
      action: 'add_api_key',
    };
  }

  const status = await getKeyStatus(providerId);
  if (status === KEY_STATUS.INVALID) {
    return {
      ready: false,
      reason: 'invalid_api_key',
      action: 'update_api_key',
    };
  }

  // Key is validating - allow but warn
  if (status === KEY_STATUS.VALIDATING) {
    logger.info('Provider key still validating, proceeding anyway');
  }

  return { ready: true };
}

/**
 * Check OpenRouter OAuth token
 * @returns {Promise<boolean>} True if OpenRouter is connected
 */
async function checkOpenRouterToken() {
  const key = await getOpenRouterKey();
  return !!key;
}

/**
 * Handle provider switch mid-session
 * (Prevented by UI, but handle gracefully if it happens)
 * @param {string} quizProviderId - Provider ID when quiz was started
 * @param {string} currentProviderId - Current active provider ID
 * @returns {string} Provider ID to use (original quiz provider)
 */
export function validateProviderConsistency(quizProviderId, currentProviderId) {
  if (quizProviderId !== currentProviderId) {
    logger.warn('Provider changed during quiz session', {
      quizProviderId,
      currentProviderId,
    });
    // Continue with original provider for consistency
    return quizProviderId;
  }
  return currentProviderId;
}

/**
 * Get fallback provider if primary fails
 * @param {string} failedProviderId - Provider ID that failed
 * @returns {Promise<string|null>} Fallback provider ID or null if none available
 */
export async function getFallbackProvider(failedProviderId) {
  // OpenRouter is the recommended fallback
  if (failedProviderId !== 'openrouter') {
    const hasOpenRouter = await checkOpenRouterToken();
    if (hasOpenRouter) {
      return 'openrouter';
    }
  }

  // No fallback available
  return null;
}

/**
 * Check if any provider is configured
 * @returns {Promise<boolean>} True if at least one provider is configured
 */
export async function hasAnyProvider() {
  // Check OpenRouter first (most common)
  const hasOpenRouter = await checkOpenRouterToken();
  if (hasOpenRouter) return true;

  // Check other providers
  const providers = ['openai', 'anthropic', 'google', 'xai'];
  for (const providerId of providers) {
    const key = await getProviderKey(providerId);
    if (key) return true;
  }

  return false;
}
