/**
 * Provider configuration
 * Defines supported LLM providers and their properties
 */

export const PROVIDERS = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access multiple AI models via OpenRouter',
    cors: true, // Can call directly from browser
    keyPrefix: 'sk-or-',
    keyPattern: /^sk-or-v1-[a-zA-Z0-9]+$/,
    docsUrl: 'https://openrouter.ai/keys',
    models: [
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        inputPrice: 3.0,
        outputPrice: 15.0,
      },
      { id: 'openai/gpt-4o', name: 'GPT-4o', inputPrice: 2.5, outputPrice: 10.0 },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', inputPrice: 0.15, outputPrice: 0.6 },
      {
        id: 'google/gemini-2.0-flash-exp:free',
        name: 'Gemini 2.0 Flash (Free)',
        inputPrice: 0,
        outputPrice: 0,
      },
      {
        id: 'meta-llama/llama-3.1-70b-instruct:free',
        name: 'Llama 3.1 70B (Free)',
        inputPrice: 0,
        outputPrice: 0,
      },
    ],
    defaultModel: 'anthropic/claude-3.5-sonnet',
  },

  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'Direct access to GPT models',
    cors: false, // Requires backend proxy
    keyPrefix: 'sk-',
    keyPattern: /^sk-[a-zA-Z0-9]+$/,
    docsUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', inputPrice: 2.5, outputPrice: 10.0 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', inputPrice: 0.15, outputPrice: 0.6 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', inputPrice: 10.0, outputPrice: 30.0 },
      { id: 'o1-preview', name: 'O1 Preview', inputPrice: 15.0, outputPrice: 60.0 },
    ],
    defaultModel: 'gpt-4o-mini',
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Direct access to Claude models',
    cors: false,
    keyPrefix: 'sk-ant-',
    keyPattern: /^sk-ant-[a-zA-Z0-9_-]+$/,
    docsUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        inputPrice: 3.0,
        outputPrice: 15.0,
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        inputPrice: 3.0,
        outputPrice: 15.0,
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        inputPrice: 15.0,
        outputPrice: 75.0,
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        inputPrice: 0.25,
        outputPrice: 1.25,
      },
    ],
    defaultModel: 'claude-sonnet-4-20250514',
  },

  google: {
    id: 'google',
    name: 'Google AI',
    description: 'Direct access to Gemini models',
    cors: false,
    keyPrefix: 'AIza',
    keyPattern: /^AIza[a-zA-Z0-9_-]+$/,
    docsUrl: 'https://aistudio.google.com/apikey',
    freeTier: true,
    models: [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        inputPrice: 0.075,
        outputPrice: 0.3,
      },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', inputPrice: 1.25, outputPrice: 5.0 },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        inputPrice: 0.075,
        outputPrice: 0.3,
      },
    ],
    defaultModel: 'gemini-2.5-flash',
  },

  xai: {
    id: 'xai',
    name: 'xAI',
    description: 'Direct access to Grok models',
    cors: false,
    keyPrefix: 'xai-',
    keyPattern: /^xai-[a-zA-Z0-9]+$/,
    docsUrl: 'https://console.x.ai',
    models: [
      { id: 'grok-3-fast', name: 'Grok 3 Fast', inputPrice: 0.2, outputPrice: 0.5 },
      { id: 'grok-3', name: 'Grok 3', inputPrice: 3.0, outputPrice: 15.0 },
    ],
    defaultModel: 'grok-3-fast',
  },
};

/**
 * Get provider by ID
 * @param {string} providerId - Provider ID
 * @returns {object|null} Provider configuration or null if not found
 */
export function getProvider(providerId) {
  return PROVIDERS[providerId] || null;
}

/**
 * Get all providers
 * @returns {object[]} Array of all provider configurations
 */
export function getAllProviders() {
  return Object.values(PROVIDERS);
}

/**
 * Check if provider supports direct browser calls (CORS)
 * @param {string} providerId - Provider ID
 * @returns {boolean} True if provider supports CORS
 */
export function supportsCors(providerId) {
  const provider = getProvider(providerId);
  return provider?.cors ?? false;
}

/**
 * Validate API key format for a provider
 * @param {string} providerId - Provider ID
 * @param {string} key - API key to validate
 * @returns {boolean} True if key format is valid
 */
export function validateKeyFormat(providerId, key) {
  const provider = getProvider(providerId);
  if (!provider) return false;
  return provider.keyPattern.test(key);
}

/**
 * Calculate estimated cost for a request
 * @param {string} providerId - Provider ID
 * @param {string} modelId - Model ID
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @returns {object|null} Cost breakdown or null if provider/model not found
 */
export function estimateCost(providerId, modelId, inputTokens, outputTokens) {
  const provider = getProvider(providerId);
  if (!provider) return null;

  const model = provider.models.find((m) => m.id === modelId);
  if (!model) return null;

  const inputCost = (inputTokens / 1_000_000) * model.inputPrice;
  const outputCost = (outputTokens / 1_000_000) * model.outputPrice;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

/**
 * Get default model for a provider
 * @param {string} providerId - Provider ID
 * @returns {string|null} Default model ID or null if provider not found
 */
export function getDefaultModel(providerId) {
  const provider = getProvider(providerId);
  return provider?.defaultModel || null;
}
