/**
 * Cost Tracker
 * Track LLM costs across all providers
 *
 * Note: Usage records are stored in memory for the current session.
 * For persistent storage, this can be extended to use IndexedDB in the future.
 */

import { getProvider } from '../api/providers-config.js';
import { logger } from '../utils/logger.js';

// In-memory storage for usage records
// Key: quizId, Value: array of usage records
const usageRecords = new Map();

/**
 * Calculate cost from token usage
 * @param {string} providerId - Provider ID (e.g., 'openai', 'anthropic')
 * @param {string} modelId - Model ID
 * @param {{prompt_tokens?: number, completion_tokens?: number, cost?: number}} usage - Token usage data
 * @returns {number|null} Cost in USD or null if cannot calculate
 */
export function calculateCost(providerId, modelId, usage) {
  const { prompt_tokens = 0, completion_tokens = 0 } = usage;

  // OpenRouter includes cost in response
  if (providerId === 'openrouter' && usage.cost !== undefined) {
    return usage.cost;
  }

  const provider = getProvider(providerId);
  if (!provider) {
    logger.warn(`No pricing info for provider: ${providerId}`);
    return null;
  }

  const model = provider.models.find((m) => m.id === modelId);
  if (!model) {
    logger.warn(`No pricing info for model: ${modelId}`);
    return null;
  }

  const inputCost = (prompt_tokens / 1_000_000) * model.inputPrice;
  const outputCost = (completion_tokens / 1_000_000) * model.outputPrice;

  return inputCost + outputCost;
}

/**
 * Record LLM usage
 * @param {object} data - Usage data
 * @param {string} data.providerId - Provider ID
 * @param {string} data.model - Model ID
 * @param {{prompt_tokens: number, completion_tokens: number, cost?: number}} data.usage - Token usage
 * @param {string} data.operation - Operation name (e.g., 'generateQuestions', 'generateExplanation')
 * @param {string} data.quizId - Quiz ID for tracking
 * @returns {object} The recorded usage record
 */
export function recordUsage(data) {
  const { providerId, model, usage, operation, quizId } = data;

  const cost = calculateCost(providerId, model, usage);

  const record = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    providerId,
    model,
    operation,
    quizId,
    promptTokens: usage.prompt_tokens || 0,
    completionTokens: usage.completion_tokens || 0,
    cost,
  };

  // Store in memory by quizId
  if (quizId) {
    if (!usageRecords.has(quizId)) {
      usageRecords.set(quizId, []);
    }
    usageRecords.get(quizId).push(record);
  }

  logger.debug('LLM usage recorded', {
    providerId,
    model,
    operation,
    promptTokens: record.promptTokens,
    completionTokens: record.completionTokens,
    cost,
  });

  return record;
}

/**
 * Get total cost for a quiz
 * @param {string} quizId - Quiz ID
 * @returns {number} Total cost for the quiz
 */
export function getQuizCost(quizId) {
  const records = usageRecords.get(quizId) || [];
  return records.reduce((total, r) => total + (r.cost || 0), 0);
}

/**
 * Get usage records for a quiz
 * @param {string} quizId - Quiz ID
 * @returns {object[]} Array of usage records
 */
export function getQuizUsageRecords(quizId) {
  return usageRecords.get(quizId) || [];
}

/**
 * Get usage summary for current session
 * @returns {object} Usage summary with totals by provider and operation
 */
export function getSessionUsageSummary() {
  const summary = {
    totalCost: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    byProvider: {},
    byOperation: {},
    recordCount: 0,
  };

  for (const records of usageRecords.values()) {
    for (const record of records) {
      summary.totalCost += record.cost || 0;
      summary.totalPromptTokens += record.promptTokens || 0;
      summary.totalCompletionTokens += record.completionTokens || 0;
      summary.recordCount += 1;

      // By provider
      if (!summary.byProvider[record.providerId]) {
        summary.byProvider[record.providerId] = { cost: 0, requests: 0 };
      }
      summary.byProvider[record.providerId].cost += record.cost || 0;
      summary.byProvider[record.providerId].requests += 1;

      // By operation
      if (!summary.byOperation[record.operation]) {
        summary.byOperation[record.operation] = { cost: 0, requests: 0 };
      }
      summary.byOperation[record.operation].cost += record.cost || 0;
      summary.byOperation[record.operation].requests += 1;
    }
  }

  return summary;
}

/**
 * Clear usage records (useful for testing)
 */
export function clearUsageRecords() {
  usageRecords.clear();
}

/**
 * Format cost for display
 * @param {number|null} cost - Cost in USD
 * @returns {string} Formatted cost string
 */
export function formatCost(cost) {
  if (cost === null || cost === undefined) {
    return 'N/A';
  }

  if (cost === 0) {
    return 'Free';
  }

  // For very small costs, show more decimal places
  if (cost > 0 && cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }

  // Standard 2 decimal places for larger amounts
  return `$${cost.toFixed(2)}`;
}
