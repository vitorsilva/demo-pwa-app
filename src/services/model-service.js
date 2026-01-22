/**
 * Model Service - Manage AI model selection
 * Fetches available models from OpenRouter and manages user selection
 */
import { getSetting, saveSetting, DEFAULT_MODEL } from '../core/settings.js';
import { logger } from '../utils/logger.js';

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';
const CACHE_KEY = 'openrouter_models_cache';
const PRICING_CACHE_KEY = 'openrouter_pricing_cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get the currently selected model from settings
 * @returns {string} Model ID
 */
export function getSelectedModel() {
  return getSetting('selectedModel') || DEFAULT_MODEL;
}

/**
 * Save the user's model selection
 * @param {string} modelId - The model ID to save
 */
export function saveSelectedModel(modelId) {
  saveSetting('selectedModel', modelId);
  logger.debug('Model selection saved', { modelId });
}

/**
 * Get a user-friendly display name for a model ID
 * @param {string} modelId - Full model ID (e.g., 'tngtech/deepseek-r1t2-chimera:free')
 * @returns {string} Display name (e.g., 'DeepSeek R1T2 Chimera')
 */
export function getModelDisplayName(modelId) {
  if (!modelId) return 'Unknown Model';

  // Remove provider prefix and :free suffix
  let name = modelId.split('/').pop() || modelId;
  name = name.replace(/:free$/, '');

  // Convert kebab-case to Title Case
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Fetch available free models from OpenRouter
 * @param {string} apiKey - User's OpenRouter API key
 * @returns {Promise<Array<{id: string, name: string, description: string}>>}
 */
export async function getAvailableModels(apiKey) {
  // Check cache first
  const cached = getCachedModels();
  if (cached) {
    logger.debug('Using cached models', { count: cached.length });
    return cached;
  }

  logger.debug('Fetching models from OpenRouter');

  const response = await fetch(OPENROUTER_MODELS_URL, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    logger.error('Failed to fetch models', { status: response.status });
    throw new Error(`Failed to fetch models: ${response.status}`);
  }

  const data = await response.json();
  const allModels = data.data || [];

  // Cache ALL models with pricing for cost estimation
  cachePricing(allModels);

  // Filter for free models only (for UI selection)
  const freeModels = allModels
    .filter((model) => isFreeModel(model))
    .map((model) => ({
      id: model.id,
      name: model.name || getModelDisplayName(model.id),
      description: model.description || '',
      contextLength: model.context_length || 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  logger.debug('Fetched models', { total: allModels.length, free: freeModels.length });

  // Cache free models for UI
  cacheModels(freeModels);

  return freeModels;
}

/**
 * Check if a model is free (no cost for prompt or completion)
 * @param {object} model - Model object from OpenRouter API
 * @returns {boolean}
 */
function isFreeModel(model) {
  const pricing = model.pricing || {};
  const promptPrice = parseFloat(pricing.prompt) || 0;
  const completionPrice = parseFloat(pricing.completion) || 0;
  return promptPrice === 0 && completionPrice === 0;
}

/**
 * Get cached models if still valid
 * @returns {Array|null}
 */
function getCachedModels() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { models, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age < CACHE_DURATION_MS) {
      return models;
    }

    // Cache expired
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    logger.debug('Cache read error', { error: error.message });
    return null;
  }
}

/**
 * Cache models with timestamp
 * @param {Array} models - Models to cache
 */
function cacheModels(models) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        models,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    logger.debug('Cache write error', { error: error.message });
  }
}

/**
 * Clear the model cache (useful for forcing refresh)
 */
export function clearModelCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(PRICING_CACHE_KEY);
  logger.debug('Model cache cleared');
}

/**
 * Cache all models with pricing data
 * @param {Array} models - All models from OpenRouter API
 */
function cachePricing(models) {
  try {
    // Create a map of model ID to pricing
    const pricingMap = {};
    for (const model of models) {
      pricingMap[model.id] = {
        prompt: model.pricing?.prompt || '0',
        completion: model.pricing?.completion || '0',
      };
    }
    localStorage.setItem(
      PRICING_CACHE_KEY,
      JSON.stringify({
        pricing: pricingMap,
        timestamp: Date.now(),
      })
    );
    logger.debug('Pricing cache updated', { modelCount: Object.keys(pricingMap).length });
  } catch (error) {
    logger.debug('Pricing cache write error', { error: error.message });
  }
}

/**
 * Get cached pricing data if still valid
 * @returns {Object|null} Map of model ID to pricing, or null if cache expired/missing
 */
function getCachedPricing() {
  try {
    const cached = localStorage.getItem(PRICING_CACHE_KEY);
    if (!cached) return null;

    const { pricing, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age < CACHE_DURATION_MS) {
      return pricing;
    }

    // Cache expired
    localStorage.removeItem(PRICING_CACHE_KEY);
    return null;
  } catch (error) {
    logger.debug('Pricing cache read error', { error: error.message });
    return null;
  }
}

/**
 * Get pricing for a specific model
 * @param {string} modelId - Model ID (e.g., 'meta-llama/llama-3-8b-instruct')
 * @returns {{prompt: string, completion: string}|null} Pricing per token, or null if not found
 */
export function getModelPricing(modelId) {
  const pricing = getCachedPricing();
  if (!pricing) {
    logger.debug('Pricing cache not available');
    return null;
  }
  return pricing[modelId] || null;
}

/**
 * Prefetch model pricing data in background
 * Called during app initialization to enable cost estimates
 * Uses public endpoint (no auth required)
 * Only caches pricing for the selected model and its paid equivalent
 */
export async function prefetchModelPricing() {
  // Skip if cache already exists
  const cached = getCachedPricing();
  if (cached) {
    logger.debug('Pricing cache already available');
    return;
  }

  try {
    // Get the model we need pricing for
    const selectedModel = getSelectedModel();
    const paidEquivalent = selectedModel.replace(/:free$/, '');
    const modelsNeeded = new Set([selectedModel, paidEquivalent]);

    logger.debug('Prefetching model pricing', { models: Array.from(modelsNeeded) });
    const response = await fetch(OPENROUTER_MODELS_URL);

    if (!response.ok) {
      logger.debug('Failed to prefetch pricing', { status: response.status });
      return;
    }

    const data = await response.json();
    const allModels = data.data || [];

    // Filter to only the models we need
    const filteredModels = allModels.filter((model) => modelsNeeded.has(model.id));

    cachePricing(filteredModels);
    logger.debug('Pricing prefetch complete', { modelCount: filteredModels.length });
  } catch (error) {
    // Silent fail - pricing will be fetched later when user opens model selector
    logger.debug('Pricing prefetch error', { error: error.message });
  }
}
