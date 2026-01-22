/**
 * Provider Settings Service
 * Manages active provider selection and API keys for LLM providers
 */

import { getSetting, saveSetting, getOpenRouterKey } from '../core/db.js';

const SETTINGS_KEYS = {
  ACTIVE_PROVIDER: 'llm_active_provider',
  ACTIVE_MODEL: 'llm_active_model',
  PROVIDER_KEY_PREFIX: 'llm_key_',
};

const DEFAULT_PROVIDER = 'openrouter';

/**
 * Get active provider ID
 * @returns {Promise<string>} Active provider ID (defaults to 'openrouter')
 */
export async function getActiveProvider() {
  const providerId = await getSetting(SETTINGS_KEYS.ACTIVE_PROVIDER);
  return providerId || DEFAULT_PROVIDER;
}

/**
 * Set active provider
 * @param {string} providerId - Provider ID to set as active
 */
export async function setActiveProvider(providerId) {
  await saveSetting(SETTINGS_KEYS.ACTIVE_PROVIDER, providerId);
}

/**
 * Get active model for current provider
 * @returns {Promise<string|null>} Active model ID or null if not set
 */
export async function getActiveModel() {
  return await getSetting(SETTINGS_KEYS.ACTIVE_MODEL);
}

/**
 * Set active model
 * @param {string} modelId - Model ID to set as active
 */
export async function setActiveModel(modelId) {
  await saveSetting(SETTINGS_KEYS.ACTIVE_MODEL, modelId);
}

/**
 * Get API key for a provider
 * @param {string} providerId - Provider ID
 * @returns {Promise<string|null>} API key or null if not configured
 */
export async function getProviderKey(providerId) {
  // Special case: OpenRouter uses existing storage mechanism
  if (providerId === 'openrouter') {
    return await getOpenRouterKey();
  }

  const key = SETTINGS_KEYS.PROVIDER_KEY_PREFIX + providerId;
  return await getSetting(key);
}

/**
 * Set API key for a provider
 * @param {string} providerId - Provider ID
 * @param {string} apiKey - API key to store
 */
export async function setProviderKey(providerId, apiKey) {
  // Special case: OpenRouter uses existing storage mechanism
  // For OpenRouter, use the existing storeOpenRouterKey function from db.js
  if (providerId === 'openrouter') {
    // Import dynamically to avoid circular dependency
    const { storeOpenRouterKey } = await import('../core/db.js');
    await storeOpenRouterKey(apiKey);
    return;
  }

  const key = SETTINGS_KEYS.PROVIDER_KEY_PREFIX + providerId;
  await saveSetting(key, apiKey);
}

/**
 * Remove API key for a provider
 * @param {string} providerId - Provider ID
 */
export async function removeProviderKey(providerId) {
  // Special case: OpenRouter uses existing storage mechanism
  if (providerId === 'openrouter') {
    const { removeOpenRouterKey } = await import('../core/db.js');
    await removeOpenRouterKey();
    return;
  }

  const key = SETTINGS_KEYS.PROVIDER_KEY_PREFIX + providerId;
  // Remove by setting to null
  await saveSetting(key, null);
}

/**
 * Check if a provider has a key configured
 * @param {string} providerId - Provider ID
 * @returns {Promise<boolean>} True if key is configured
 */
export async function hasProviderKey(providerId) {
  const key = await getProviderKey(providerId);
  return !!key;
}

/**
 * Get list of configured providers (with keys)
 * @returns {Promise<string[]>} Array of provider IDs that have keys configured
 */
export async function getConfiguredProviders() {
  const providers = ['openrouter', 'openai', 'anthropic', 'google', 'xai'];
  const configured = [];

  for (const providerId of providers) {
    if (await hasProviderKey(providerId)) {
      configured.push(providerId);
    }
  }

  return configured;
}
