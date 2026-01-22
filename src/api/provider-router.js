/**
 * Provider Router
 * Routes LLM calls to appropriate provider (direct or via proxy)
 *
 * OpenRouter: Direct browser call (CORS supported)
 * Other providers: Route through backend proxy (no CORS)
 */

import { callOpenRouter } from './openrouter-client.js';
import { supportsCors, getDefaultModel } from './providers-config.js';
import {
  getActiveProvider,
  getActiveModel,
  getProviderKey,
} from '../services/provider-settings-service.js';
import { logger } from '../utils/logger.js';
import { isFeatureEnabled } from '../core/features.js';

const LLM_PROXY_URL = 'https://saberloop.com/llm/completion.php';

/**
 * Make an LLM completion request using the active provider
 * This is the main entry point for all LLM calls when multi-provider feature is enabled.
 *
 * @param {string} prompt - The prompt to send to the LLM
 * @param {object} options - Request options
 * @param {number} [options.maxTokens=2048] - Maximum tokens in response
 * @param {number} [options.temperature=0.7] - Temperature for generation
 * @returns {Promise<{text: string, model: string, provider: string, usage: object}>}
 */
export async function completion(prompt, options = {}) {
  // If feature disabled, use OpenRouter directly (existing behavior)
  if (!isFeatureEnabled('MULTI_PROVIDER_LLM')) {
    return await callOpenRouterLegacy(prompt, options);
  }

  const providerId = await getActiveProvider();
  let modelId = await getActiveModel();
  const apiKey = await getProviderKey(providerId);

  // If no model selected, use provider default
  if (!modelId) {
    modelId = getDefaultModel(providerId);
  }

  if (!apiKey) {
    throw new Error(`No API key configured for ${providerId}`);
  }

  logger.debug('LLM request via provider router', { provider: providerId, model: modelId });

  if (supportsCors(providerId)) {
    // Direct call (OpenRouter only)
    return await callDirect(providerId, apiKey, prompt, modelId, options);
  } else {
    // Via backend proxy (OpenAI, Anthropic, Google, xAI)
    return await callViaProxy(providerId, apiKey, prompt, modelId, options);
  }
}

/**
 * Legacy OpenRouter call - used when MULTI_PROVIDER_LLM feature is disabled
 * This maintains backward compatibility with existing behavior.
 *
 * @param {string} prompt - The prompt to send
 * @param {object} options - Request options
 * @returns {Promise<{text: string, model: string, provider: string, usage: object}>}
 */
async function callOpenRouterLegacy(prompt, options = {}) {
  const apiKey = await getProviderKey('openrouter');

  if (!apiKey) {
    throw new Error('No OpenRouter API key configured');
  }

  const result = await callOpenRouter(apiKey, prompt, {
    maxTokens: options.maxTokens || 2048,
    temperature: options.temperature || 0.7,
  });

  return {
    text: result.text,
    model: result.model,
    provider: 'openrouter',
    usage: result.usage,
  };
}

/**
 * Direct call to provider (OpenRouter only - has CORS support)
 *
 * @param {string} providerId - Provider ID
 * @param {string} apiKey - API key
 * @param {string} prompt - Prompt to send
 * @param {string} modelId - Model ID
 * @param {object} options - Request options
 * @returns {Promise<{text: string, model: string, provider: string, usage: object}>}
 */
async function callDirect(providerId, apiKey, prompt, modelId, options) {
  if (providerId !== 'openrouter') {
    throw new Error(`Direct calls not supported for ${providerId}`);
  }

  const result = await callOpenRouter(apiKey, prompt, {
    model: modelId,
    maxTokens: options.maxTokens || 2048,
    temperature: options.temperature || 0.7,
  });

  return {
    text: result.text,
    model: result.model,
    provider: 'openrouter',
    usage: result.usage,
  };
}

/**
 * Call via backend proxy (OpenAI, Anthropic, Google, xAI)
 * These providers don't support CORS, so we route through our backend.
 *
 * @param {string} providerId - Provider ID
 * @param {string} apiKey - API key
 * @param {string} prompt - Prompt to send
 * @param {string} modelId - Model ID
 * @param {object} options - Request options
 * @returns {Promise<{text: string, model: string, provider: string, usage: object}>}
 */
async function callViaProxy(providerId, apiKey, prompt, modelId, options) {
  logger.debug('Calling LLM proxy', { provider: providerId, model: modelId });

  const response = await fetch(LLM_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider: providerId,
      api_key: apiKey,
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      options: {
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7,
      },
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: `Provider error: ${response.status}` }));
    logger.error('LLM proxy error', { status: response.status, error: error.error });
    throw new Error(error.error || `Provider error: ${response.status}`);
  }

  const result = await response.json();

  logger.debug('LLM proxy response received', {
    provider: result.provider,
    model: result.model,
  });

  return {
    text: result.text,
    model: result.model,
    provider: result.provider,
    usage: result.usage || {},
  };
}

/**
 * Get the current active provider and model info (for UI display)
 * @returns {Promise<{providerId: string, modelId: string|null}>}
 */
export async function getActiveProviderInfo() {
  const providerId = await getActiveProvider();
  const modelId = await getActiveModel();
  return { providerId, modelId };
}
