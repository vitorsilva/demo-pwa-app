/**
 * Provider Settings Service
 * Manages active provider selection and API keys for LLM providers
 */

import { getSetting, saveSetting, getOpenRouterKey } from '../core/db.js';
import { getProvider, validateKeyFormat, getAllProviders } from '../api/providers-config.js';
import { logger } from '../utils/logger.js';

/**
 * Key validation status enum
 */
export const KEY_STATUS = {
  NOT_SET: 'not_set',
  VALIDATING: 'validating',
  VALID: 'valid',
  INVALID: 'invalid',
};

const SETTINGS_KEYS = {
  ACTIVE_PROVIDER: 'llm_active_provider',
  ACTIVE_MODEL: 'llm_active_model',
  PROVIDER_KEY_PREFIX: 'llm_key_',
  KEY_STATUS_PREFIX: 'llm_key_status_',
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

// =============================================================================
// Key Status and Validation (Phase 3)
// =============================================================================

/**
 * Get key status for a provider
 * @param {string} providerId - Provider ID
 * @returns {Promise<string>} Key status (NOT_SET, VALIDATING, VALID, INVALID)
 */
export async function getKeyStatus(providerId) {
  const status = await getSetting(SETTINGS_KEYS.KEY_STATUS_PREFIX + providerId);
  return status || KEY_STATUS.NOT_SET;
}

/**
 * Set key status (internal helper)
 * @param {string} providerId - Provider ID
 * @param {string} status - Status to set
 */
async function setKeyStatus(providerId, status) {
  await saveSetting(SETTINGS_KEYS.KEY_STATUS_PREFIX + providerId, status);
}

/**
 * Get masked key for display (e.g., "sk-12...cdef")
 * @param {string} apiKey - Full API key
 * @returns {string} Masked key for display
 */
export function getMaskedKey(apiKey) {
  if (!apiKey || apiKey.length < 8) return '***';
  const prefix = apiKey.substring(0, 5);
  const suffix = apiKey.substring(apiKey.length - 4);
  return `${prefix}...${suffix}`;
}

/**
 * Save API key with format validation and async validation trigger
 * Enhanced version of setProviderKey with validation
 * @param {string} providerId - Provider ID
 * @param {string} apiKey - API key to save
 * @returns {Promise<{status: string}>} Result with initial status
 */
export async function saveProviderKeyWithValidation(providerId, apiKey) {
  const provider = getProvider(providerId);
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  // Format validation (sync)
  if (!validateKeyFormat(providerId, apiKey)) {
    throw new Error(
      `Invalid key format. ${provider.name} keys should start with '${provider.keyPrefix}'`
    );
  }

  // Save key using existing function
  await setProviderKey(providerId, apiKey);

  // Set status to validating
  await setKeyStatus(providerId, KEY_STATUS.VALIDATING);

  // Trigger async validation (fire and forget)
  validateKeyAsync(providerId, apiKey);

  return { status: KEY_STATUS.VALIDATING };
}

/**
 * Remove API key and clear status
 * @param {string} providerId - Provider ID
 */
export async function removeProviderKeyWithStatus(providerId) {
  await removeProviderKey(providerId);
  await saveSetting(SETTINGS_KEYS.KEY_STATUS_PREFIX + providerId, null);
}

/**
 * Get all provider statuses for UI display
 * @returns {Promise<object>} Map of provider ID to status info
 */
export async function getAllProviderStatuses() {
  const providers = getAllProviders();
  const statuses = {};

  for (const provider of providers) {
    const key = await getProviderKey(provider.id);
    const status = await getKeyStatus(provider.id);

    statuses[provider.id] = {
      hasKey: !!key,
      maskedKey: key ? getMaskedKey(key) : null,
      status: key ? status : KEY_STATUS.NOT_SET,
    };
  }

  return statuses;
}

/**
 * Re-validate a key (manual trigger from UI)
 * @param {string} providerId - Provider ID
 */
export async function revalidateKey(providerId) {
  const apiKey = await getProviderKey(providerId);
  if (!apiKey) {
    throw new Error('No key configured');
  }

  await setKeyStatus(providerId, KEY_STATUS.VALIDATING);
  validateKeyAsync(providerId, apiKey);
}

// =============================================================================
// Async Key Validation (Phase 3.2 - placeholder, implemented in next subtask)
// =============================================================================

/**
 * Async validation - makes test call to provider
 * Called after key is saved, updates status when complete
 * @param {string} providerId - Provider ID
 * @param {string} _apiKey - API key to validate (unused in placeholder, used in 3.2)
 */
async function validateKeyAsync(providerId, _apiKey) {
  // Placeholder - will be implemented in Subtask 3.2
  // For now, just mark as valid after a delay to simulate async behavior
  try {
    logger.debug(`Validating ${providerId} key...`);
    // Actual implementation in 3.2 will call testProviderKey() with _apiKey
    await setKeyStatus(providerId, KEY_STATUS.VALID);
    logger.info(`${providerId} key marked as valid (full validation in 3.2)`);
  } catch (error) {
    logger.error(`${providerId} key validation error:`, error);
    await setKeyStatus(providerId, KEY_STATUS.INVALID);
  }
}
