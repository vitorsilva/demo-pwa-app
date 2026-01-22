import { test, expect } from '@playwright/test';

const LLM_PROXY_URL = 'https://saberloop.com/llm';

test.describe('LLM Proxy Backend', () => {

  test('health check returns healthy status', async ({ request }) => {
    const response = await request.get(`${LLM_PROXY_URL}/health.php`);

    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.service).toBe('llm-proxy');
    expect(data.providers).toContain('openai');
    expect(data.providers).toContain('anthropic');
    expect(data.providers).toContain('google');
    expect(data.providers).toContain('xai');
  });

  test('rejects GET requests to completion endpoint', async ({ request }) => {
    const response = await request.get(`${LLM_PROXY_URL}/completion.php`);

    expect(response.status()).toBe(405);
  });

  test('rejects invalid JSON', async ({ request }) => {
    const response = await request.post(`${LLM_PROXY_URL}/completion.php`, {
      data: 'not valid json',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid JSON');
  });

  test('rejects missing required fields', async ({ request }) => {
    const response = await request.post(`${LLM_PROXY_URL}/completion.php`, {
      data: { provider: 'openai' }, // missing api_key, messages, model
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status()).toBe(500); // Handler throws exception
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test('rejects invalid provider', async ({ request }) => {
    const response = await request.post(`${LLM_PROXY_URL}/completion.php`, {
      data: {
        provider: 'invalid_provider',
        api_key: 'test-key',
        model: 'test-model',
        messages: [{ role: 'user', content: 'test' }]
      },
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status()).toBe(500);
  });

  test('CORS headers are set correctly', async ({ request }) => {
    const response = await request.get(`${LLM_PROXY_URL}/health.php`);

    expect(response.headers()['access-control-allow-origin']).toBe('*');
  });

  test('OPTIONS preflight returns 200', async ({ request }) => {
    const response = await request.fetch(`${LLM_PROXY_URL}/completion.php`, {
      method: 'OPTIONS'
    });

    expect(response.status()).toBe(200);
  });

});

// Integration tests with real API keys (skip in CI, run manually)
test.describe('LLM Proxy Integration @manual', () => {

  test.describe('OpenAI', () => {
    test.skip(({ }, testInfo) => !process.env.TEST_OPENAI_KEY, 'Requires TEST_OPENAI_KEY');

    test('OpenAI completion works', async ({ request }) => {
      const response = await request.post(`${LLM_PROXY_URL}/completion.php`, {
        data: {
          provider: 'openai',
          api_key: process.env.TEST_OPENAI_KEY,
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Say "test successful" and nothing else.' }],
          options: { max_tokens: 20 }
        },
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();

      expect(data.text).toBeDefined();
      expect(data.provider).toBe('openai');
      expect(data.usage).toBeDefined();
      expect(data.usage.prompt_tokens).toBeGreaterThan(0);
    });
  });

  test.describe('Anthropic', () => {
    test.skip(({ }, testInfo) => !process.env.TEST_ANTHROPIC_KEY, 'Requires TEST_ANTHROPIC_KEY');

    test('Anthropic completion works', async ({ request }) => {
      const response = await request.post(`${LLM_PROXY_URL}/completion.php`, {
        data: {
          provider: 'anthropic',
          api_key: process.env.TEST_ANTHROPIC_KEY,
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: 'Say "test successful" and nothing else.' }],
          options: { max_tokens: 20 }
        },
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();

      expect(data.text).toBeDefined();
      expect(data.provider).toBe('anthropic');
      expect(data.usage).toBeDefined();
      expect(data.usage.prompt_tokens).toBeGreaterThan(0);
    });
  });

  test.describe('Google AI', () => {
    test.skip(({ }, testInfo) => !process.env.TEST_GOOGLE_KEY, 'Requires TEST_GOOGLE_KEY');

    test('Google AI completion works', async ({ request }) => {
      const response = await request.post(`${LLM_PROXY_URL}/completion.php`, {
        data: {
          provider: 'google',
          api_key: process.env.TEST_GOOGLE_KEY,
          model: 'gemini-1.5-flash',
          messages: [{ role: 'user', content: 'Say "test successful" and nothing else.' }],
          options: { max_tokens: 20 }
        },
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();

      expect(data.text).toBeDefined();
      expect(data.provider).toBe('google');
      expect(data.usage).toBeDefined();
    });
  });

  test.describe('xAI', () => {
    test.skip(({ }, testInfo) => !process.env.TEST_XAI_KEY, 'Requires TEST_XAI_KEY');

    test('xAI completion works', async ({ request }) => {
      const response = await request.post(`${LLM_PROXY_URL}/completion.php`, {
        data: {
          provider: 'xai',
          api_key: process.env.TEST_XAI_KEY,
          model: 'grok-2-latest',
          messages: [{ role: 'user', content: 'Say "test successful" and nothing else.' }],
          options: { max_tokens: 20 }
        },
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();

      expect(data.text).toBeDefined();
      expect(data.provider).toBe('xai');
      expect(data.usage).toBeDefined();
    });
  });

});
