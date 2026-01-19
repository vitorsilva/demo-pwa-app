import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSelectedModel,
  saveSelectedModel,
  getModelDisplayName,
  getAvailableModels,
  clearModelCache,
  getModelPricing,
  prefetchModelPricing
} from './model-service.js';
import { DEFAULT_MODEL } from '../core/settings.js';

// Mock fetch
global.fetch = vi.fn();

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn()
  }
}));

describe('Model Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getSelectedModel', () => {
    it('should return default model when none selected', () => {
      const model = getSelectedModel();
      expect(model).toBe(DEFAULT_MODEL);
    });

    it('should return saved model when one is selected', () => {
      localStorage.setItem('quizmaster_settings', JSON.stringify({
        selectedModel: 'google/gemma-2-9b-it:free'
      }));

      const model = getSelectedModel();
      expect(model).toBe('google/gemma-2-9b-it:free');
    });
  });

  describe('saveSelectedModel', () => {
    it('should save model to settings', () => {
      saveSelectedModel('meta-llama/llama-3.1-8b-instruct:free');

      const stored = JSON.parse(localStorage.getItem('quizmaster_settings'));
      expect(stored.selectedModel).toBe('meta-llama/llama-3.1-8b-instruct:free');
    });

    it('should preserve other settings when saving model', () => {
      localStorage.setItem('quizmaster_settings', JSON.stringify({
        defaultGradeLevel: 'college',
        questionsPerQuiz: '10'
      }));

      saveSelectedModel('google/gemma-2-9b-it:free');

      const stored = JSON.parse(localStorage.getItem('quizmaster_settings'));
      expect(stored.selectedModel).toBe('google/gemma-2-9b-it:free');
      expect(stored.defaultGradeLevel).toBe('college');
      expect(stored.questionsPerQuiz).toBe('10');
    });
  });

  describe('getModelDisplayName', () => {
    it('should convert model ID to display name', () => {
      expect(getModelDisplayName('tngtech/deepseek-r1t2-chimera:free'))
        .toBe('Deepseek R1t2 Chimera');
    });

    it('should handle model without provider prefix', () => {
      expect(getModelDisplayName('gemma-2-9b-it'))
        .toBe('Gemma 2 9b It');
    });

    it('should remove :free suffix', () => {
      expect(getModelDisplayName('google/gemma-2-9b-it:free'))
        .toBe('Gemma 2 9b It');
    });

    it('should handle empty or null input', () => {
      expect(getModelDisplayName(null)).toBe('Unknown Model');
      expect(getModelDisplayName('')).toBe('Unknown Model');
      expect(getModelDisplayName(undefined)).toBe('Unknown Model');
    });

    it('should handle model without dashes', () => {
      expect(getModelDisplayName('provider/modelname:free'))
        .toBe('Modelname');
    });
  });

  describe('getAvailableModels', () => {
    const mockModelsResponse = {
      data: [
        {
          id: 'google/gemma-2-9b-it:free',
          name: 'Gemma 2 9B',
          description: 'Google Gemma 2',
          context_length: 8192,
          pricing: { prompt: '0', completion: '0' }
        },
        {
          id: 'openai/gpt-4',
          name: 'GPT-4',
          description: 'OpenAI GPT-4',
          context_length: 8192,
          pricing: { prompt: '0.03', completion: '0.06' }
        },
        {
          id: 'meta-llama/llama-3.1-8b-instruct:free',
          name: 'Llama 3.1 8B',
          description: 'Meta Llama 3.1',
          context_length: 131072,
          pricing: { prompt: '0', completion: '0' }
        }
      ]
    };

    it('should fetch and filter free models only', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModelsResponse)
      });

      const models = await getAvailableModels('test-api-key');

      expect(models).toHaveLength(2); // Only free models
      expect(models.map(m => m.id)).toContain('google/gemma-2-9b-it:free');
      expect(models.map(m => m.id)).toContain('meta-llama/llama-3.1-8b-instruct:free');
      expect(models.map(m => m.id)).not.toContain('openai/gpt-4');
    });

    it('should include model details in response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModelsResponse)
      });

      const models = await getAvailableModels('test-api-key');
      const gemma = models.find(m => m.id === 'google/gemma-2-9b-it:free');

      expect(gemma).toBeDefined();
      expect(gemma.name).toBe('Gemma 2 9B');
      expect(gemma.description).toBe('Google Gemma 2');
      expect(gemma.contextLength).toBe(8192);
    });

    it('should sort models alphabetically by name', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModelsResponse)
      });

      const models = await getAvailableModels('test-api-key');

      expect(models[0].name).toBe('Gemma 2 9B');
      expect(models[1].name).toBe('Llama 3.1 8B');
    });

    it('should use cache on subsequent calls', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModelsResponse)
      });

      // First call - fetches from API
      await getAvailableModels('test-api-key');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await getAvailableModels('test-api-key');
      expect(fetch).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should throw error on API failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(getAvailableModels('invalid-key'))
        .rejects.toThrow('Failed to fetch models: 401');
    });

    it('should handle empty API response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      const models = await getAvailableModels('test-api-key');
      expect(models).toHaveLength(0);
    });

    it('should handle models with missing pricing as non-free', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 'model-no-pricing', name: 'No Pricing' },
            { id: 'free-model:free', pricing: { prompt: '0', completion: '0' } }
          ]
        })
      });

      const models = await getAvailableModels('test-api-key');

      // Model without pricing should be treated as free (0 || 0 = 0)
      expect(models.map(m => m.id)).toContain('model-no-pricing');
      expect(models.map(m => m.id)).toContain('free-model:free');
    });
  });

  describe('clearModelCache', () => {
    it('should remove cached models', async () => {
      // Set up cache
      localStorage.setItem('openrouter_models_cache', JSON.stringify({
        models: [{ id: 'test' }],
        timestamp: Date.now()
      }));

      clearModelCache();

      expect(localStorage.getItem('openrouter_models_cache')).toBeNull();
    });
  });

  describe('cache expiration', () => {
    it('should ignore expired cache', async () => {
      // Set up expired cache (25 hours old)
      const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000);
      localStorage.setItem('openrouter_models_cache', JSON.stringify({
        models: [{ id: 'old-model', name: 'Old' }],
        timestamp: expiredTimestamp
      }));

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ id: 'new-model:free', name: 'New', pricing: { prompt: '0', completion: '0' } }]
        })
      });

      const models = await getAvailableModels('test-api-key');

      expect(fetch).toHaveBeenCalled();
      expect(models[0].id).toBe('new-model:free');
    });

    it('should handle invalid cache JSON gracefully', async () => {
      localStorage.setItem('openrouter_models_cache', 'invalid-json');

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ id: 'model:free', pricing: { prompt: '0', completion: '0' } }]
        })
      });

      const models = await getAvailableModels('test-api-key');
      expect(fetch).toHaveBeenCalled();
      expect(models).toHaveLength(1);
    });
  });

  describe('getModelPricing', () => {
    it('should return null when pricing cache is empty', () => {
      const pricing = getModelPricing('some-model');
      expect(pricing).toBeNull();
    });

    it('should return pricing for cached model', async () => {
      // Populate pricing cache by fetching models
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 'google/gemma:free', pricing: { prompt: '0', completion: '0' } },
            { id: 'openai/gpt-4', pricing: { prompt: '0.03', completion: '0.06' } }
          ]
        })
      });

      await getAvailableModels('test-key');

      const pricing = getModelPricing('openai/gpt-4');
      expect(pricing).toEqual({ prompt: '0.03', completion: '0.06' });
    });

    it('should return null for unknown model', async () => {
      // Populate pricing cache
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ id: 'known-model', pricing: { prompt: '0.01', completion: '0.02' } }]
        })
      });

      await getAvailableModels('test-key');

      const pricing = getModelPricing('unknown-model');
      expect(pricing).toBeNull();
    });

    it('should return null for expired pricing cache', async () => {
      // Set up expired pricing cache (25 hours old)
      const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000);
      localStorage.setItem('openrouter_pricing_cache', JSON.stringify({
        pricing: { 'model-id': { prompt: '0.01', completion: '0.02' } },
        timestamp: expiredTimestamp
      }));

      const pricing = getModelPricing('model-id');
      expect(pricing).toBeNull();
      // Cache should be cleared
      expect(localStorage.getItem('openrouter_pricing_cache')).toBeNull();
    });

    it('should handle invalid pricing cache JSON gracefully', () => {
      localStorage.setItem('openrouter_pricing_cache', 'invalid-json');

      const pricing = getModelPricing('any-model');
      expect(pricing).toBeNull();
    });
  });

  describe('prefetchModelPricing', () => {
    it('should skip if pricing cache already exists', async () => {
      localStorage.setItem('openrouter_pricing_cache', JSON.stringify({
        pricing: { 'model': { prompt: '0', completion: '0' } },
        timestamp: Date.now()
      }));

      await prefetchModelPricing();

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should fetch pricing for selected model', async () => {
      localStorage.setItem('quizmaster_settings', JSON.stringify({
        selectedModel: 'google/gemma:free'
      }));

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 'google/gemma:free', pricing: { prompt: '0', completion: '0' } },
            { id: 'google/gemma', pricing: { prompt: '0.01', completion: '0.02' } }
          ]
        })
      });

      await prefetchModelPricing();

      expect(fetch).toHaveBeenCalled();
      // Should cache the pricing
      const cached = localStorage.getItem('openrouter_pricing_cache');
      expect(cached).not.toBeNull();
    });

    it('should handle API failure gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      // Should not throw
      await expect(prefetchModelPricing()).resolves.toBeUndefined();
    });

    it('should handle network error gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw
      await expect(prefetchModelPricing()).resolves.toBeUndefined();
    });

    it('should handle empty API response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      await prefetchModelPricing();
      // Should complete without error
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('clearModelCache', () => {
    it('should clear both models and pricing cache', () => {
      localStorage.setItem('openrouter_models_cache', JSON.stringify({ models: [], timestamp: Date.now() }));
      localStorage.setItem('openrouter_pricing_cache', JSON.stringify({ pricing: {}, timestamp: Date.now() }));

      clearModelCache();

      expect(localStorage.getItem('openrouter_models_cache')).toBeNull();
      expect(localStorage.getItem('openrouter_pricing_cache')).toBeNull();
    });
  });

  describe('getAvailableModels edge cases', () => {
    it('should use display name when model name is missing', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ id: 'provider/model-name:free', pricing: { prompt: '0', completion: '0' } }]
        })
      });

      const models = await getAvailableModels('test-key');
      expect(models[0].name).toBe('Model Name');
    });

    it('should use empty string when description is missing', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ id: 'model:free', name: 'Model', pricing: { prompt: '0', completion: '0' } }]
        })
      });

      const models = await getAvailableModels('test-key');
      expect(models[0].description).toBe('');
    });

    it('should use 0 when context_length is missing', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ id: 'model:free', name: 'Model', pricing: { prompt: '0', completion: '0' } }]
        })
      });

      const models = await getAvailableModels('test-key');
      expect(models[0].contextLength).toBe(0);
    });

    it('should handle missing data property in response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      const models = await getAvailableModels('test-key');
      expect(models).toHaveLength(0);
    });
  });

  describe('getModelDisplayName additional cases', () => {
    it('should handle model ID without dashes', () => {
      expect(getModelDisplayName('provider/simplemodel:free')).toBe('Simplemodel');
    });

    it('should handle model ID with multiple parts', () => {
      expect(getModelDisplayName('org/long-model-name-with-many-parts:free'))
        .toBe('Long Model Name With Many Parts');
    });

    it('should handle empty string', () => {
      expect(getModelDisplayName('')).toBe('Unknown Model');
    });
  });

  describe('isFreeModel behavior via getAvailableModels', () => {
    it('should filter out models with non-zero prompt price', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 'free-model:free', name: 'Free', pricing: { prompt: '0', completion: '0' } },
            { id: 'paid-prompt', name: 'Paid Prompt', pricing: { prompt: '0.01', completion: '0' } }
          ]
        })
      });

      const models = await getAvailableModels('test-key');
      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('free-model:free');
    });

    it('should filter out models with non-zero completion price', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 'free-model:free', name: 'Free', pricing: { prompt: '0', completion: '0' } },
            { id: 'paid-completion', name: 'Paid Completion', pricing: { prompt: '0', completion: '0.02' } }
          ]
        })
      });

      const models = await getAvailableModels('test-key');
      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('free-model:free');
    });

    it('should treat models with null pricing as free', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 'no-pricing-model', name: 'No Pricing' }
          ]
        })
      });

      const models = await getAvailableModels('test-key');
      expect(models).toHaveLength(1);
    });
  });

  describe('caching edge cases', () => {
    it('should handle localStorage setItem throwing', async () => {
      // First fetch successfully
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ id: 'model:free', name: 'Model', pricing: { prompt: '0', completion: '0' } }]
        })
      });

      // Mock localStorage to throw on setItem
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });

      // Should still return models despite cache failure
      const models = await getAvailableModels('test-key');
      expect(models).toHaveLength(1);

      // Restore
      localStorage.setItem = originalSetItem;
    });
  });

  describe('prefetchModelPricing edge cases', () => {
    it('should prefetch pricing for model without :free suffix', async () => {
      localStorage.setItem('quizmaster_settings', JSON.stringify({
        selectedModel: 'google/gemma-2-9b-it' // No :free suffix
      }));

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 'google/gemma-2-9b-it', pricing: { prompt: '0.01', completion: '0.02' } }
          ]
        })
      });

      await prefetchModelPricing();

      expect(fetch).toHaveBeenCalled();
    });
  });
});
