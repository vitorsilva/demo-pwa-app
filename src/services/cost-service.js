/**
 * Cost Service - Calculate and format LLM usage costs
 * Provides cost estimation for free models and formatting for display
 */
import { getModelPricing } from './model-service.js';
import { logger } from '../utils/logger.js';

/**
 * Check if a model ID represents a free model
 * @param {string} modelId - Model ID (e.g., 'meta-llama/llama-3-8b-instruct:free')
 * @returns {boolean} True if model is free tier
 */
export function isFreeModel(modelId) {
  if (!modelId) return false;
  return modelId.endsWith(':free');
}

/**
 * Get the equivalent paid model ID for a free model
 * @param {string} modelId - Free model ID (e.g., 'meta-llama/llama-3-8b-instruct:free')
 * @returns {string} Paid model ID (e.g., 'meta-llama/llama-3-8b-instruct')
 */
export function getPaidEquivalent(modelId) {
  if (!modelId) return modelId;
  return modelId.replace(/:free$/, '');
}

/**
 * Calculate estimated cost based on token counts and model pricing
 * @param {number} promptTokens - Number of prompt tokens
 * @param {number} completionTokens - Number of completion tokens
 * @param {string} modelId - Model ID to look up pricing for
 * @returns {number} Estimated cost in USD
 */
export function calculateEstimatedCost(promptTokens, completionTokens, modelId) {
  const pricing = getModelPricing(modelId);

  if (!pricing) {
    logger.debug('No pricing found for model', { modelId });
    return 0;
  }

  const promptPrice = parseFloat(pricing.prompt) || 0;
  const completionPrice = parseFloat(pricing.completion) || 0;

  const cost = promptTokens * promptPrice + completionTokens * completionPrice;

  return cost;
}

/**
 * Format a cost value for display
 * @param {number} costUsd - Cost in USD
 * @param {boolean} isFree - Whether the model is free
 * @returns {string} Formatted cost string (e.g., "$0.002", "Free", "$0.00")
 */
export function formatCost(costUsd, isFree = false) {
  if (isFree && costUsd === 0) {
    return 'Free';
  }

  // For very small costs, show more decimal places
  if (costUsd > 0 && costUsd < 0.01) {
    // Show up to 4 decimal places for small amounts
    return `$${costUsd.toFixed(4)}`;
  }

  // Standard 2 decimal places for larger amounts
  return `$${costUsd.toFixed(2)}`;
}

/**
 * Get a complete usage summary with actual and estimated costs
 * @param {{promptTokens: number, completionTokens: number, totalTokens: number, costUsd: number}} usage - Usage data from API
 * @param {string} modelId - Model ID used for generation
 * @returns {{
 *   promptTokens: number,
 *   completionTokens: number,
 *   totalTokens: number,
 *   actualCost: number,
 *   estimatedCost: number|null,
 *   isFreeModel: boolean,
 *   formattedActualCost: string,
 *   formattedEstimatedCost: string|null
 * }}
 */
export function getUsageSummary(usage, modelId) {
  const isFree = isFreeModel(modelId);
  const actualCost = usage?.costUsd || 0;

  let estimatedCost = null;
  let formattedEstimatedCost = null;

  // For free models, calculate what it would cost on the paid equivalent
  if (isFree) {
    const paidModelId = getPaidEquivalent(modelId);
    estimatedCost = calculateEstimatedCost(
      usage?.promptTokens || 0,
      usage?.completionTokens || 0,
      paidModelId
    );

    if (estimatedCost > 0) {
      formattedEstimatedCost = formatCost(estimatedCost, false);
    }
  }

  return {
    promptTokens: usage?.promptTokens || 0,
    completionTokens: usage?.completionTokens || 0,
    totalTokens: usage?.totalTokens || 0,
    actualCost,
    estimatedCost,
    isFreeModel: isFree,
    formattedActualCost: formatCost(actualCost, isFree),
    formattedEstimatedCost,
  };
}
