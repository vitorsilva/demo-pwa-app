import { describe, it, expect, vi, beforeEach } from 'vitest';
import { completion, getActiveProviderInfo } from './provider-router.js';

// Mock all dependencies
vi.mock('./openrouter-client.js', () => ({
  callOpenRouter: vi.fn(),
}));

vi.mock('./providers-config.js', () => ({
  supportsCors: vi.fn(),
  getDefaultModel: vi.fn(),
}));

vi.mock('../services/provider-settings-service.js', () => ({
  getActiveProvider: vi.fn(),
  getActiveModel: vi.fn(),
  getProviderKey: vi.fn(),
}));

vi.mock('../core/features.js', () => ({
  isFeatureEnabled: vi.fn(),
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { callOpenRouter } from './openrouter-client.js';
import { supportsCors, getDefaultModel } from './providers-config.js';
import {
  getActiveProvider,
  getActiveModel,
  getProviderKey,
} from '../services/provider-settings-service.js';
import { isFeatureEnabled } from '../core/features.js';

describe('Provider Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('when feature flag is DISABLED', () => {
    beforeEach(() => {
      isFeatureEnabled.mockReturnValue(false);
    });

    it('should use OpenRouter directly (legacy behavior)', async () => {
      getProviderKey.mockResolvedValue('sk-or-test-key');
      callOpenRouter.mockResolvedValue({
        text: 'Hello from OpenRouter!',
        model: 'anthropic/claude-3.5-sonnet',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15, costUsd: 0.001 },
      });

      const result = await completion('Test prompt');

      expect(isFeatureEnabled).toHaveBeenCalledWith('MULTI_PROVIDER_LLM');
      expect(callOpenRouter).toHaveBeenCalledWith(
        'sk-or-test-key',
        'Test prompt',
        expect.any(Object)
      );
      expect(result.provider).toBe('openrouter');
      expect(result.text).toBe('Hello from OpenRouter!');
    });

    it('should throw error when no OpenRouter key configured', async () => {
      getProviderKey.mockResolvedValue(null);

      await expect(completion('Test prompt')).rejects.toThrow('No OpenRouter API key configured');
    });
  });

  describe('when feature flag is ENABLED', () => {
    beforeEach(() => {
      isFeatureEnabled.mockReturnValue(true);
    });

    describe('OpenRouter (direct call)', () => {
      it('should call OpenRouter directly when selected', async () => {
        getActiveProvider.mockResolvedValue('openrouter');
        getActiveModel.mockResolvedValue('anthropic/claude-3.5-sonnet');
        getProviderKey.mockResolvedValue('sk-or-test-key');
        supportsCors.mockReturnValue(true);

        callOpenRouter.mockResolvedValue({
          text: 'Hello!',
          model: 'anthropic/claude-3.5-sonnet',
          usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15, costUsd: 0.001 },
        });

        const result = await completion('Hi');

        expect(supportsCors).toHaveBeenCalledWith('openrouter');
        expect(callOpenRouter).toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
        expect(result.provider).toBe('openrouter');
        expect(result.text).toBe('Hello!');
      });

      it('should use default model when none selected', async () => {
        getActiveProvider.mockResolvedValue('openrouter');
        getActiveModel.mockResolvedValue(null);
        getProviderKey.mockResolvedValue('sk-or-test-key');
        supportsCors.mockReturnValue(true);
        getDefaultModel.mockReturnValue('anthropic/claude-3.5-sonnet');

        callOpenRouter.mockResolvedValue({
          text: 'Hello!',
          model: 'anthropic/claude-3.5-sonnet',
          usage: {},
        });

        await completion('Hi');

        expect(getDefaultModel).toHaveBeenCalledWith('openrouter');
        expect(callOpenRouter).toHaveBeenCalledWith(
          'sk-or-test-key',
          'Hi',
          expect.objectContaining({ model: 'anthropic/claude-3.5-sonnet' })
        );
      });
    });

    describe('Other providers (via proxy)', () => {
      it('should call backend proxy for OpenAI', async () => {
        getActiveProvider.mockResolvedValue('openai');
        getActiveModel.mockResolvedValue('gpt-4o-mini');
        getProviderKey.mockResolvedValue('sk-openai-key');
        supportsCors.mockReturnValue(false);

        global.fetch.mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              text: 'Hello from GPT!',
              model: 'gpt-4o-mini',
              provider: 'openai',
              usage: { prompt_tokens: 10, completion_tokens: 5 },
            }),
        });

        const result = await completion('Hi');

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/llm/completion.php'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );

        // Verify request body
        const fetchCall = global.fetch.mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.provider).toBe('openai');
        expect(body.api_key).toBe('sk-openai-key');
        expect(body.model).toBe('gpt-4o-mini');
        expect(body.messages).toEqual([{ role: 'user', content: 'Hi' }]);

        expect(callOpenRouter).not.toHaveBeenCalled();
        expect(result.provider).toBe('openai');
        expect(result.text).toBe('Hello from GPT!');
      });

      it('should call backend proxy for Anthropic', async () => {
        getActiveProvider.mockResolvedValue('anthropic');
        getActiveModel.mockResolvedValue('claude-sonnet-4-20250514');
        getProviderKey.mockResolvedValue('sk-ant-test-key');
        supportsCors.mockReturnValue(false);

        global.fetch.mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              text: 'Hello from Claude!',
              model: 'claude-sonnet-4-20250514',
              provider: 'anthropic',
              usage: {},
            }),
        });

        const result = await completion('Hi');

        const fetchCall = global.fetch.mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.provider).toBe('anthropic');
        expect(result.provider).toBe('anthropic');
      });

      it('should call backend proxy for Google', async () => {
        getActiveProvider.mockResolvedValue('google');
        getActiveModel.mockResolvedValue('gemini-2.5-flash');
        getProviderKey.mockResolvedValue('AIza-test-key');
        supportsCors.mockReturnValue(false);

        global.fetch.mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              text: 'Hello from Gemini!',
              model: 'gemini-2.5-flash',
              provider: 'google',
              usage: {},
            }),
        });

        const result = await completion('Hi');

        const fetchCall = global.fetch.mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.provider).toBe('google');
        expect(result.provider).toBe('google');
      });

      it('should call backend proxy for xAI', async () => {
        getActiveProvider.mockResolvedValue('xai');
        getActiveModel.mockResolvedValue('grok-3-fast');
        getProviderKey.mockResolvedValue('xai-test-key');
        supportsCors.mockReturnValue(false);

        global.fetch.mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              text: 'Hello from Grok!',
              model: 'grok-3-fast',
              provider: 'xai',
              usage: {},
            }),
        });

        const result = await completion('Hi');

        const fetchCall = global.fetch.mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.provider).toBe('xai');
        expect(result.provider).toBe('xai');
      });
    });

    describe('Error handling', () => {
      it('should throw error when no API key configured', async () => {
        getActiveProvider.mockResolvedValue('openai');
        getActiveModel.mockResolvedValue('gpt-4o-mini');
        getProviderKey.mockResolvedValue(null);

        await expect(completion('Hi')).rejects.toThrow('No API key configured for openai');
      });

      it('should throw error when proxy returns error', async () => {
        getActiveProvider.mockResolvedValue('anthropic');
        getActiveModel.mockResolvedValue('claude-3.5-sonnet');
        getProviderKey.mockResolvedValue('sk-ant-test');
        supportsCors.mockReturnValue(false);

        global.fetch.mockResolvedValue({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Invalid API key' }),
        });

        await expect(completion('Hi')).rejects.toThrow('Invalid API key');
      });

      it('should handle proxy returning unknown error', async () => {
        getActiveProvider.mockResolvedValue('openai');
        getActiveModel.mockResolvedValue('gpt-4o-mini');
        getProviderKey.mockResolvedValue('sk-test');
        supportsCors.mockReturnValue(false);

        global.fetch.mockResolvedValue({
          ok: false,
          status: 500,
          json: () => Promise.reject(new Error('Not JSON')),
        });

        // When JSON parsing fails, we fall back to status code in the error message
        await expect(completion('Hi')).rejects.toThrow('Provider error: 500');
      });

      it('should throw error for direct call to non-OpenRouter provider', async () => {
        getActiveProvider.mockResolvedValue('openai');
        getActiveModel.mockResolvedValue('gpt-4o-mini');
        getProviderKey.mockResolvedValue('sk-test');
        // Incorrectly return true for non-OpenRouter
        supportsCors.mockReturnValue(true);

        await expect(completion('Hi')).rejects.toThrow('Direct calls not supported for openai');
      });
    });

    describe('Options handling', () => {
      it('should pass maxTokens and temperature options', async () => {
        getActiveProvider.mockResolvedValue('openai');
        getActiveModel.mockResolvedValue('gpt-4o-mini');
        getProviderKey.mockResolvedValue('sk-test');
        supportsCors.mockReturnValue(false);

        global.fetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ text: 'OK', model: 'gpt-4o-mini', provider: 'openai' }),
        });

        await completion('Hi', { maxTokens: 500, temperature: 0.5 });

        const fetchCall = global.fetch.mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.options.max_tokens).toBe(500);
        expect(body.options.temperature).toBe(0.5);
      });

      it('should use default options when not provided', async () => {
        getActiveProvider.mockResolvedValue('openai');
        getActiveModel.mockResolvedValue('gpt-4o-mini');
        getProviderKey.mockResolvedValue('sk-test');
        supportsCors.mockReturnValue(false);

        global.fetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ text: 'OK', model: 'gpt-4o-mini', provider: 'openai' }),
        });

        await completion('Hi');

        const fetchCall = global.fetch.mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.options.max_tokens).toBe(2048);
        expect(body.options.temperature).toBe(0.7);
      });
    });
  });

  describe('getActiveProviderInfo', () => {
    it('should return current provider and model', async () => {
      getActiveProvider.mockResolvedValue('anthropic');
      getActiveModel.mockResolvedValue('claude-sonnet-4-20250514');

      const info = await getActiveProviderInfo();

      expect(info.providerId).toBe('anthropic');
      expect(info.modelId).toBe('claude-sonnet-4-20250514');
    });

    it('should return null model when not set', async () => {
      getActiveProvider.mockResolvedValue('openrouter');
      getActiveModel.mockResolvedValue(null);

      const info = await getActiveProviderInfo();

      expect(info.providerId).toBe('openrouter');
      expect(info.modelId).toBeNull();
    });
  });
});
