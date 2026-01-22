import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callOpenRouter, testApiKey, getCreditsBalance } from './openrouter-client.js';

describe('OpenRouter Client', () => {
  // Mock fetch globally
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('callOpenRouter', () => {
    it('should call fetch with correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Hello!' } }],
            model: 'test-model',
            usage: { total_tokens: 10 },
          }),
      });

      await callOpenRouter('sk-test-key', 'Say hello');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.any(Object)
      );
    });

    it('should send correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Hello!' } }],
            model: 'test-model',
            usage: {},
          }),
      });

      await callOpenRouter('sk-test-key', 'Say hello');

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers['Authorization']).toBe('Bearer sk-test-key');
      expect(callArgs.headers['Content-Type']).toBe('application/json');
      expect(callArgs.headers['X-Title']).toBe('SaberLoop');
    });

    it('should use default model when not specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
            model: 'default-model',
            usage: {},
          }),
      });

      await callOpenRouter('sk-test-key', 'Test prompt');

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.model).toBe('tngtech/deepseek-r1t2-chimera:free');
    });

    it('should use custom model when specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
            model: 'openai/gpt-4',
            usage: {},
          }),
      });

      await callOpenRouter('sk-test-key', 'Test prompt', { model: 'openai/gpt-4' });

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.model).toBe('openai/gpt-4');
    });

    it('should return text, model, and usage from response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'The answer is 42' } }],
            model: 'test-model',
            usage: { total_tokens: 50, prompt_tokens: 10, completion_tokens: 40 },
          }),
      });

      const result = await callOpenRouter('sk-test-key', 'What is the answer?');

      expect(result.text).toBe('The answer is 42');
      expect(result.model).toBe('test-model');
      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 40,
        totalTokens: 50,
        costUsd: 0,
      });
    });

    it('should throw error on 401 (invalid API key)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Unauthorized' } }),
      });

      await expect(callOpenRouter('bad-key', 'Test')).rejects.toThrow('Invalid API key');
    });

    it('should throw error on 429 (rate limit) after retries', async () => {
      // 429 is retryable, so we need to mock multiple responses
      // maxRetries is 3, so we need 3 429 responses
      const mock429Response = {
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: { message: 'Too many requests' } }),
      };
      mockFetch
        .mockResolvedValueOnce(mock429Response)
        .mockResolvedValueOnce(mock429Response)
        .mockResolvedValueOnce(mock429Response);

      const promise = callOpenRouter('sk-test-key', 'Test');

      // Catch to prevent unhandled rejection warnings
      promise.catch(() => {});

      // Advance through retry delays (1s, 2s)
      await vi.advanceTimersByTimeAsync(0); // First attempt
      await vi.advanceTimersByTimeAsync(1000); // First retry
      await vi.advanceTimersByTimeAsync(2000); // Second retry (3rd attempt)

      await expect(promise).rejects.toThrow('Rate limit exceeded');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should throw error on 402 (insufficient credits)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: () => Promise.resolve({ error: { message: 'Payment required' } }),
      });

      await expect(callOpenRouter('sk-test-key', 'Test')).rejects.toThrow('Insufficient credits');
    });

    it('should throw error on empty response after retries fail', async () => {
      // Empty responses are now retried (up to 3 times), so mock all retries as empty
      const emptyResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: '', reasoning: '' } }],
            model: 'test-model',
            usage: {},
          }),
      };
      mockFetch.mockResolvedValue(emptyResponse); // All calls return empty

      // Start the call and immediately attach error handler to prevent unhandled rejection
      let caughtError = null;
      const promise = callOpenRouter('sk-test-key', 'Test').catch((e) => {
        caughtError = e;
      });

      // Run all timers and pending promises to completion
      await vi.runAllTimersAsync();
      await promise;

      // Verify the error was thrown
      expect(caughtError).not.toBeNull();
      expect(caughtError.message).toBe('Empty response from OpenRouter');
    });

    it('should use reasoning field when content is empty and reasoning is not chain-of-thought', async () => {
      // Some models may put actual answer in reasoning field
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: '', reasoning: 'A resposta correta é 32 dentes.' } }],
            model: 'deepseek-r1t2-chimera',
            usage: { total_tokens: 100 },
          }),
      });

      const result = await callOpenRouter('sk-test-key', 'Test prompt');

      expect(result.text).toBe('A resposta correta é 32 dentes.');
    });

    it('should reject chain-of-thought reasoning as answer after retries', async () => {
      // Chain-of-thought should not be used as the answer
      // Empty responses are now retried (up to 3 times), so mock all retries
      const chainOfThoughtResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: '', reasoning: 'Okay, let me think about this...' } }],
            model: 'deepseek-r1t2-chimera',
            usage: { total_tokens: 100 },
          }),
      };
      mockFetch.mockResolvedValue(chainOfThoughtResponse); // All calls return chain-of-thought

      // Start the call and immediately attach error handler to prevent unhandled rejection
      let caughtError = null;
      const promise = callOpenRouter('sk-test-key', 'Test prompt').catch((e) => {
        caughtError = e;
      });

      // Run all timers and pending promises to completion
      await vi.runAllTimersAsync();
      await promise;

      // Verify the error was thrown
      expect(caughtError).not.toBeNull();
      expect(caughtError.message).toBe('Empty response from OpenRouter');
    });

    it('should prefer content over reasoning when both are present', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              { message: { content: 'Content response', reasoning: 'Reasoning response' } },
            ],
            model: 'test-model',
            usage: {},
          }),
      });

      const result = await callOpenRouter('sk-test-key', 'Test prompt');

      expect(result.text).toBe('Content response');
    });
  });

  describe('testApiKey', () => {
    it('should return true when API call succeeds', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'ok' } }],
            model: 'test-model',
            usage: {},
          }),
      });

      const result = await testApiKey('sk-valid-key');
      expect(result).toBe(true);
    });

    it('should return false when API call fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Invalid key' } }),
      });

      const result = await testApiKey('sk-invalid-key');
      expect(result).toBe(false);
    });
  });

  describe('getCreditsBalance', () => {
    it('should fetch credits from /api/v1/auth/key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { limit_remaining: 5.5 },
          }),
      });

      await getCreditsBalance('sk-test-key');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/auth/key',
        expect.objectContaining({
          method: 'GET',
          headers: { Authorization: 'Bearer sk-test-key' },
        })
      );
    });

    it('should return balance and formatted balance', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { limit_remaining: 5.5 },
          }),
      });

      const result = await getCreditsBalance('sk-test-key');

      expect(result.balance).toBe(5.5);
      expect(result.balanceFormatted).toBe('$5.50');
    });

    it('should handle zero balance', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { limit_remaining: 0 },
          }),
      });

      const result = await getCreditsBalance('sk-test-key');

      expect(result.balance).toBe(0);
      expect(result.balanceFormatted).toBe('$0.00');
    });

    it('should return null on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await getCreditsBalance('sk-invalid-key');
      expect(result).toBeNull();
    });

    it('should return null when limit_remaining is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {},
          }),
      });

      const result = await getCreditsBalance('sk-test-key');
      expect(result).toBeNull();
    });

    it('should return null on network error after retries', async () => {
      // Network errors are retryable, getCreditsBalance has maxRetries: 2
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const promise = getCreditsBalance('sk-test-key');

      // Advance through retry delay (1s)
      await vi.advanceTimersByTimeAsync(0); // First attempt
      await vi.advanceTimersByTimeAsync(1000); // First retry (2nd attempt)

      const result = await promise;
      expect(result).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
