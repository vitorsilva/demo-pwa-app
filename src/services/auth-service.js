/**
 * Auth Service - OpenRouter authentication operations
 * Views should use this instead of importing db or api directly
 */
import { isOpenRouterConnected, getOpenRouterKey, removeOpenRouterKey } from '../core/db.js';
import { startAuth as startOAuthFlow } from '../api/openrouter-auth.js';
import { getCreditsBalance as fetchCreditsBalance } from '../api/openrouter-client.js';
import { getActiveProvider, hasProviderKey, getProviderKey } from './provider-settings-service.js';

/**
 * Check if user is connected to any LLM provider
 * First checks the active provider, falls back to OpenRouter for backward compatibility
 * @returns {Promise<boolean>} True if connected
 */
export async function isConnected() {
  // Check if the active provider has a key configured
  const activeProvider = await getActiveProvider();
  if (await hasProviderKey(activeProvider)) {
    return true;
  }

  // Fallback: check OpenRouter for backward compatibility
  return isOpenRouterConnected();
}

/**
 * Get the API key for the active provider
 * When multi-provider feature is enabled, returns key for active provider.
 * Otherwise, returns OpenRouter key for backward compatibility.
 * @returns {Promise<string|null>} API key or null
 */
export async function getApiKey() {
  // Get the key for the active provider
  const activeProvider = await getActiveProvider();
  const key = await getProviderKey(activeProvider);
  if (key) {
    return key;
  }

  // Fallback: OpenRouter key for backward compatibility
  return getOpenRouterKey();
}

/**
 * Disconnect from OpenRouter (remove stored key)
 * @returns {Promise<void>}
 */
export async function disconnect() {
  return removeOpenRouterKey();
}

/**
 * Start OAuth flow to connect to OpenRouter
 * Redirects user to OpenRouter for authentication
 * @returns {Promise<void>}
 */
export async function startAuth() {
  return startOAuthFlow();
}

/**
 * Get credits balance from OpenRouter
 * @returns {Promise<{balance: number, balanceFormatted: string}|null>}
 */
export async function getCreditsBalance() {
  const apiKey = await getOpenRouterKey();
  if (!apiKey) return null;
  return fetchCreditsBalance(apiKey);
}
