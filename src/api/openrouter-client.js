  /**
   * OpenRouter API Client
   * Makes direct browser → OpenRouter API calls (CORS supported)
   */

  import { logger } from '../utils/logger.js';
  import { getSelectedModel } from '../services/model-service.js';
  import { withRetry, isRetryableError } from '../utils/retry.js';

  /**
   * @typedef {Error & {status?: number, response?: Response}} ApiError
   */

  const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  /**
   * Call OpenRouter Chat API
   * @param {string} apiKey - User's OpenRouter API key
   * @param {string} prompt - The prompt to send
   * @param {object} options - Optional settings (model, maxTokens, temperature)
   * @returns {Promise<{text: string, model: string, usage: {promptTokens: number, completionTokens: number, totalTokens: number, costUsd: number}}>}
   */
  export async function callOpenRouter(apiKey, prompt, options = {}) {
    const {
      model = getSelectedModel(),
      maxTokens = 2048,
      temperature = 0.7
    } = options;

    logger.debug('Calling OpenRouter', { model, maxTokens, temperature });

    // Wrap fetch with retry logic for transient failures
    const response = await withRetry(
      async () => {
        const res = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'SaberLoop'
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            temperature,
            messages: [{ role: 'user', content: prompt }],
            usage: { include: true }
          })
        });

        // If response is not ok, throw an error with status for retry logic
        if (!res.ok) {
          const error = /** @type {ApiError} */ (new Error(`HTTP ${res.status}`));
          error.status = res.status;
          error.response = res;
          throw error;
        }

        return res;
      },
      {
        maxRetries: 3,
        shouldRetry: (/** @type {ApiError} */ error) => {
          // Don't retry client errors (except 429 rate limit)
          if (error.status === 401 || error.status === 402 || error.status === 400) {
            return false;
          }
          return isRetryableError(error);
        },
        onRetry: (/** @type {{attempt: number, error: ApiError, delay: number}} */ { attempt, error, delay }) => {
          logger.info('API call retry', {
            attempt,
            delay,
            status: error.status,
            error: error.message
          });
        }
      }
    ).catch(async (error) => {
      // If error has a response, handle it with proper error messages
      if (error.response) {
        await handleApiError(error.response);
      }
      throw error;
    });

    logger.debug('OpenRouter response', { status: response.status });

    const data = await response.json();

    // Get the actual response content
    // Note: reasoning field is chain-of-thought, only use as fallback if it looks like an actual answer
    const message = data.choices?.[0]?.message;
    let text = message?.content;

    // For reasoning models that hit token limit, reasoning may contain partial answer
    // Only use reasoning if content is empty AND reasoning doesn't look like chain-of-thought
    if (!text && message?.reasoning) {
      const reasoning = message.reasoning.trim();
      // Chain-of-thought typically starts with "Okay", "Let me", "First", etc.
      const isChainOfThought = /^(okay|let me|let's|first|i need|the user|alright|so,)/i.test(reasoning);
      if (!isChainOfThought) {
        text = reasoning;
      }
    }

    if (!text) {
      throw new Error('Empty response from OpenRouter');
    }

    logger.debug('OpenRouter response received', { length: text.length });

    return {
      text,
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
        costUsd: data.usage?.cost_usd || 0
      }
    };
  }

  /**
   * Handle API errors with helpful messages
   */
  async function handleApiError(response) {
    const error = await response.json().catch(() => ({}));

    if (response.status === 401) {
      throw new Error('Invalid API key. Please reconnect with OpenRouter.');
    }

    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Free tier allows 50 requests/day.');     
    }

    if (response.status === 402) {
      throw new Error('Insufficient credits. Add credits at openrouter.ai');
    }

    throw new Error(error.error?.message || `API error: ${response.status}`);        
  }

  /**
   * Test if an API key is valid
   * @param {string} apiKey - API key to test
   * @returns {Promise<boolean>}
   */
  export async function testApiKey(apiKey) {
    try {
      await callOpenRouter(apiKey, 'Say "ok"', { maxTokens: 10 });
      return true;
    } catch (error) {
      logger.debug('API key test failed', { error: error.message });
      return false;
    }
  }

  /**
   * Get credits balance from OpenRouter
   * @param {string} apiKey - User's OpenRouter API key
   * @returns {Promise<{balance: number, balanceFormatted: string}|null>}
   */
  export async function getCreditsBalance(apiKey) {
    try {
      const response = await withRetry(
        async () => {
          const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`
            }
          });

          if (!res.ok) {
            const error = /** @type {ApiError} */ (new Error(`HTTP ${res.status}`));
            error.status = res.status;
            throw error;
          }

          return res;
        },
        {
          maxRetries: 2, // Fewer retries for balance check (less critical)
          shouldRetry: isRetryableError
        }
      );

      const data = await response.json();
      // OpenRouter returns limit_remaining in credits (1 credit = $1)
      const balance = data.data?.limit_remaining ?? null;

      if (balance === null) {
        return null;
      }

      return {
        balance,
        balanceFormatted: balance >= 0 ? `$${balance.toFixed(2)}` : `$${balance.toFixed(2)}`
      };
    } catch (error) {
      logger.debug('Error fetching credits', { error: error.message });
      return null;
    }
  }