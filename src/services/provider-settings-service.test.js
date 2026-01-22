import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getActiveProvider,
  setActiveProvider,
  getActiveModel,
  setActiveModel,
  getProviderKey,
  setProviderKey,
  removeProviderKey,
  hasProviderKey,
  getConfiguredProviders,
  // Phase 3 exports
  KEY_STATUS,
  getKeyStatus,
  getMaskedKey,
  saveProviderKeyWithValidation,
  removeProviderKeyWithStatus,
  getAllProviderStatuses,
  revalidateKey,
} from './provider-settings-service.js';

// Mock the db module
vi.mock('../core/db.js', () => ({
  getSetting: vi.fn(),
  saveSetting: vi.fn(),
  getOpenRouterKey: vi.fn(),
  storeOpenRouterKey: vi.fn(),
  removeOpenRouterKey: vi.fn(),
}));

// Mock the logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock providers-config
vi.mock('../api/providers-config.js', () => ({
  getProvider: vi.fn((id) => {
    const providers = {
      openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        keyPrefix: 'sk-or-',
        defaultModel: 'anthropic/claude-3.5-sonnet',
      },
      openai: { id: 'openai', name: 'OpenAI', keyPrefix: 'sk-', defaultModel: 'gpt-4o-mini' },
      anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        keyPrefix: 'sk-ant-',
        defaultModel: 'claude-sonnet-4-20250514',
      },
      google: {
        id: 'google',
        name: 'Google AI',
        keyPrefix: 'AIza',
        defaultModel: 'gemini-2.5-flash',
      },
      xai: { id: 'xai', name: 'xAI', keyPrefix: 'xai-', defaultModel: 'grok-3-fast' },
    };
    return providers[id] || null;
  }),
  validateKeyFormat: vi.fn((providerId, key) => {
    const prefixes = {
      openrouter: 'sk-or-',
      openai: 'sk-',
      anthropic: 'sk-ant-',
      google: 'AIza',
      xai: 'xai-',
    };
    return key.startsWith(prefixes[providerId] || '');
  }),
  getAllProviders: vi.fn(() => [
    { id: 'openrouter', name: 'OpenRouter' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'anthropic', name: 'Anthropic' },
    { id: 'google', name: 'Google AI' },
    { id: 'xai', name: 'xAI' },
  ]),
  supportsCors: vi.fn((id) => id === 'openrouter'),
}));

import {
  getSetting,
  saveSetting,
  getOpenRouterKey,
  storeOpenRouterKey,
  removeOpenRouterKey,
} from '../core/db.js';

describe('Provider Settings Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActiveProvider', () => {
    it('should return default provider when not set', async () => {
      getSetting.mockResolvedValue(null);
      const provider = await getActiveProvider();
      expect(provider).toBe('openrouter');
    });

    it('should return stored provider', async () => {
      getSetting.mockResolvedValue('openai');
      const provider = await getActiveProvider();
      expect(provider).toBe('openai');
    });

    it('should call getSetting with correct key', async () => {
      getSetting.mockResolvedValue(null);
      await getActiveProvider();
      expect(getSetting).toHaveBeenCalledWith('llm_active_provider');
    });
  });

  describe('setActiveProvider', () => {
    it('should store provider in settings', async () => {
      await setActiveProvider('anthropic');
      expect(saveSetting).toHaveBeenCalledWith('llm_active_provider', 'anthropic');
    });
  });

  describe('getActiveModel', () => {
    it('should return null when not set', async () => {
      getSetting.mockResolvedValue(null);
      const model = await getActiveModel();
      expect(model).toBeNull();
    });

    it('should return stored model', async () => {
      getSetting.mockResolvedValue('gpt-4o-mini');
      const model = await getActiveModel();
      expect(model).toBe('gpt-4o-mini');
    });
  });

  describe('setActiveModel', () => {
    it('should store model in settings', async () => {
      await setActiveModel('claude-3.5-sonnet');
      expect(saveSetting).toHaveBeenCalledWith('llm_active_model', 'claude-3.5-sonnet');
    });
  });

  describe('getProviderKey', () => {
    it('should use getOpenRouterKey for openrouter provider', async () => {
      getOpenRouterKey.mockResolvedValue('sk-or-test-key');
      const key = await getProviderKey('openrouter');
      expect(getOpenRouterKey).toHaveBeenCalled();
      expect(key).toBe('sk-or-test-key');
    });

    it('should return null when openrouter key not stored', async () => {
      getOpenRouterKey.mockResolvedValue(null);
      const key = await getProviderKey('openrouter');
      expect(key).toBeNull();
    });

    it('should use getSetting for other providers', async () => {
      getSetting.mockResolvedValue('sk-test-openai-key');
      const key = await getProviderKey('openai');
      expect(getSetting).toHaveBeenCalledWith('llm_key_openai');
      expect(key).toBe('sk-test-openai-key');
    });

    it('should return null when key not stored', async () => {
      getSetting.mockResolvedValue(null);
      const key = await getProviderKey('openai');
      expect(key).toBeNull();
    });
  });

  describe('setProviderKey', () => {
    it('should use storeOpenRouterKey for openrouter provider', async () => {
      await setProviderKey('openrouter', 'sk-or-new-key');
      expect(storeOpenRouterKey).toHaveBeenCalledWith('sk-or-new-key');
    });

    it('should use saveSetting for other providers', async () => {
      await setProviderKey('openai', 'sk-new-openai-key');
      expect(saveSetting).toHaveBeenCalledWith('llm_key_openai', 'sk-new-openai-key');
    });

    it('should store anthropic key correctly', async () => {
      await setProviderKey('anthropic', 'sk-ant-test');
      expect(saveSetting).toHaveBeenCalledWith('llm_key_anthropic', 'sk-ant-test');
    });
  });

  describe('removeProviderKey', () => {
    it('should use removeOpenRouterKey for openrouter provider', async () => {
      await removeProviderKey('openrouter');
      expect(removeOpenRouterKey).toHaveBeenCalled();
    });

    it('should set key to null for other providers', async () => {
      await removeProviderKey('openai');
      expect(saveSetting).toHaveBeenCalledWith('llm_key_openai', null);
    });
  });

  describe('hasProviderKey', () => {
    it('should return false when no key', async () => {
      getOpenRouterKey.mockResolvedValue(null);
      expect(await hasProviderKey('openrouter')).toBe(false);
    });

    it('should return true when key exists', async () => {
      getOpenRouterKey.mockResolvedValue('sk-or-key');
      expect(await hasProviderKey('openrouter')).toBe(true);
    });

    it('should return false when other provider key is null', async () => {
      getSetting.mockResolvedValue(null);
      expect(await hasProviderKey('openai')).toBe(false);
    });

    it('should return true when other provider key exists', async () => {
      getSetting.mockResolvedValue('sk-key');
      expect(await hasProviderKey('openai')).toBe(true);
    });
  });

  describe('getConfiguredProviders', () => {
    it('should return empty array when no keys configured', async () => {
      getOpenRouterKey.mockResolvedValue(null);
      getSetting.mockResolvedValue(null);

      const providers = await getConfiguredProviders();
      expect(providers).toEqual([]);
    });

    it('should return list of providers with keys', async () => {
      getOpenRouterKey.mockResolvedValue('sk-or-key');
      getSetting.mockImplementation((key) => {
        if (key === 'llm_key_openai') return Promise.resolve('sk-openai');
        if (key === 'llm_key_anthropic') return Promise.resolve(null);
        if (key === 'llm_key_google') return Promise.resolve('AIza-google');
        if (key === 'llm_key_xai') return Promise.resolve(null);
        return Promise.resolve(null);
      });

      const providers = await getConfiguredProviders();
      expect(providers).toContain('openrouter');
      expect(providers).toContain('openai');
      expect(providers).toContain('google');
      expect(providers).not.toContain('anthropic');
      expect(providers).not.toContain('xai');
    });
  });

  // ==========================================================================
  // Phase 3: Key Status and Validation Tests
  // ==========================================================================

  describe('KEY_STATUS', () => {
    it('should have all expected status values', () => {
      expect(KEY_STATUS.NOT_SET).toBe('not_set');
      expect(KEY_STATUS.VALIDATING).toBe('validating');
      expect(KEY_STATUS.VALID).toBe('valid');
      expect(KEY_STATUS.INVALID).toBe('invalid');
    });
  });

  describe('getKeyStatus', () => {
    it('should return NOT_SET when no status stored', async () => {
      getSetting.mockResolvedValue(null);
      const status = await getKeyStatus('openai');
      expect(status).toBe(KEY_STATUS.NOT_SET);
      expect(getSetting).toHaveBeenCalledWith('llm_key_status_openai');
    });

    it('should return stored status', async () => {
      getSetting.mockResolvedValue(KEY_STATUS.VALID);
      const status = await getKeyStatus('openai');
      expect(status).toBe(KEY_STATUS.VALID);
    });

    it('should return VALIDATING status when stored', async () => {
      getSetting.mockResolvedValue(KEY_STATUS.VALIDATING);
      const status = await getKeyStatus('anthropic');
      expect(status).toBe(KEY_STATUS.VALIDATING);
    });

    it('should return INVALID status when stored', async () => {
      getSetting.mockResolvedValue(KEY_STATUS.INVALID);
      const status = await getKeyStatus('google');
      expect(status).toBe(KEY_STATUS.INVALID);
    });
  });

  describe('getMaskedKey', () => {
    it('should mask key correctly', () => {
      expect(getMaskedKey('sk-1234567890abcdef')).toBe('sk-12...cdef');
    });

    it('should handle minimum length key', () => {
      expect(getMaskedKey('12345678')).toBe('12345...5678');
    });

    it('should return *** for short keys', () => {
      expect(getMaskedKey('short')).toBe('***');
      expect(getMaskedKey('1234567')).toBe('***');
    });

    it('should handle null', () => {
      expect(getMaskedKey(null)).toBe('***');
    });

    it('should handle undefined', () => {
      expect(getMaskedKey(undefined)).toBe('***');
    });

    it('should handle empty string', () => {
      expect(getMaskedKey('')).toBe('***');
    });

    it('should mask OpenAI key correctly', () => {
      expect(getMaskedKey('sk-proj-abc123xyz789')).toBe('sk-pr...z789');
    });

    it('should mask Anthropic key correctly', () => {
      expect(getMaskedKey('sk-ant-api03-abcdefghij')).toBe('sk-an...ghij');
    });
  });

  describe('saveProviderKeyWithValidation', () => {
    it('should reject unknown provider', async () => {
      await expect(saveProviderKeyWithValidation('unknown', 'key')).rejects.toThrow(
        'Unknown provider: unknown'
      );
    });

    it('should reject invalid key format', async () => {
      await expect(saveProviderKeyWithValidation('openai', 'invalid-key')).rejects.toThrow(
        "Invalid key format. OpenAI keys should start with 'sk-'"
      );
    });

    it('should save valid key and return validating status', async () => {
      getSetting.mockResolvedValue(null);
      saveSetting.mockResolvedValue();

      const result = await saveProviderKeyWithValidation('openai', 'sk-validkey123456789');

      expect(saveSetting).toHaveBeenCalledWith('llm_key_openai', 'sk-validkey123456789');
      expect(saveSetting).toHaveBeenCalledWith('llm_key_status_openai', KEY_STATUS.VALIDATING);
      expect(result.status).toBe(KEY_STATUS.VALIDATING);
    });

    it('should save OpenRouter key using storeOpenRouterKey', async () => {
      getSetting.mockResolvedValue(null);
      saveSetting.mockResolvedValue();
      storeOpenRouterKey.mockResolvedValue();

      const result = await saveProviderKeyWithValidation('openrouter', 'sk-or-v1-abc123');

      expect(storeOpenRouterKey).toHaveBeenCalledWith('sk-or-v1-abc123');
      expect(result.status).toBe(KEY_STATUS.VALIDATING);
    });

    it('should save Anthropic key correctly', async () => {
      saveSetting.mockResolvedValue();

      const result = await saveProviderKeyWithValidation('anthropic', 'sk-ant-api03-test');

      expect(saveSetting).toHaveBeenCalledWith('llm_key_anthropic', 'sk-ant-api03-test');
      expect(result.status).toBe(KEY_STATUS.VALIDATING);
    });
  });

  describe('removeProviderKeyWithStatus', () => {
    it('should remove key and clear status for regular provider', async () => {
      saveSetting.mockResolvedValue();

      await removeProviderKeyWithStatus('openai');

      expect(saveSetting).toHaveBeenCalledWith('llm_key_openai', null);
      expect(saveSetting).toHaveBeenCalledWith('llm_key_status_openai', null);
    });

    it('should remove OpenRouter key and clear status', async () => {
      removeOpenRouterKey.mockResolvedValue();
      saveSetting.mockResolvedValue();

      await removeProviderKeyWithStatus('openrouter');

      expect(removeOpenRouterKey).toHaveBeenCalled();
      expect(saveSetting).toHaveBeenCalledWith('llm_key_status_openrouter', null);
    });
  });

  describe('getAllProviderStatuses', () => {
    it('should return status for all providers when no keys configured', async () => {
      getOpenRouterKey.mockResolvedValue(null);
      getSetting.mockResolvedValue(null);

      const statuses = await getAllProviderStatuses();

      expect(statuses).toHaveProperty('openrouter');
      expect(statuses).toHaveProperty('openai');
      expect(statuses).toHaveProperty('anthropic');
      expect(statuses).toHaveProperty('google');
      expect(statuses).toHaveProperty('xai');

      // All should be NOT_SET with no key
      expect(statuses.openai.hasKey).toBe(false);
      expect(statuses.openai.maskedKey).toBeNull();
      expect(statuses.openai.status).toBe(KEY_STATUS.NOT_SET);
    });

    it('should return correct status for configured providers', async () => {
      getOpenRouterKey.mockResolvedValue('sk-or-v1-testkey123');
      getSetting.mockImplementation((key) => {
        if (key === 'llm_key_openai') return Promise.resolve('sk-openaikey123');
        if (key === 'llm_key_status_openrouter') return Promise.resolve(KEY_STATUS.VALID);
        if (key === 'llm_key_status_openai') return Promise.resolve(KEY_STATUS.VALIDATING);
        return Promise.resolve(null);
      });

      const statuses = await getAllProviderStatuses();

      expect(statuses.openrouter.hasKey).toBe(true);
      expect(statuses.openrouter.maskedKey).toBe('sk-or...y123');
      expect(statuses.openrouter.status).toBe(KEY_STATUS.VALID);

      expect(statuses.openai.hasKey).toBe(true);
      expect(statuses.openai.maskedKey).toBe('sk-op...y123');
      expect(statuses.openai.status).toBe(KEY_STATUS.VALIDATING);
    });
  });

  describe('revalidateKey', () => {
    it('should throw when no key configured', async () => {
      getSetting.mockResolvedValue(null);
      getOpenRouterKey.mockResolvedValue(null);

      await expect(revalidateKey('openai')).rejects.toThrow('No key configured');
    });

    it('should set status to validating and trigger validation', async () => {
      getSetting.mockImplementation((key) => {
        if (key === 'llm_key_openai') return Promise.resolve('sk-test123456');
        return Promise.resolve(null);
      });
      saveSetting.mockResolvedValue();

      await revalidateKey('openai');

      expect(saveSetting).toHaveBeenCalledWith('llm_key_status_openai', KEY_STATUS.VALIDATING);
    });

    it('should work for OpenRouter key', async () => {
      getOpenRouterKey.mockResolvedValue('sk-or-v1-test123');
      saveSetting.mockResolvedValue();

      await revalidateKey('openrouter');

      expect(saveSetting).toHaveBeenCalledWith('llm_key_status_openrouter', KEY_STATUS.VALIDATING);
    });
  });

  // ==========================================================================
  // Phase 3.2: Async Key Validation Tests
  // ==========================================================================

  describe('Async Key Validation (integration)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should validate OpenRouter key directly and set VALID status', async () => {
      storeOpenRouterKey.mockResolvedValue();
      saveSetting.mockResolvedValue();
      global.fetch.mockResolvedValue({ ok: true });

      await saveProviderKeyWithValidation('openrouter', 'sk-or-v1-validkey123');

      // Wait for async validation to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should call OpenRouter auth endpoint directly
      expect(global.fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/auth/key', {
        method: 'GET',
        headers: { Authorization: 'Bearer sk-or-v1-validkey123' },
      });

      // Status should be set to VALID after successful validation
      expect(saveSetting).toHaveBeenCalledWith('llm_key_status_openrouter', KEY_STATUS.VALID);
    });

    it('should set INVALID status when OpenRouter validation fails', async () => {
      storeOpenRouterKey.mockResolvedValue();
      saveSetting.mockResolvedValue();
      global.fetch.mockResolvedValue({ ok: false, status: 401 });

      await saveProviderKeyWithValidation('openrouter', 'sk-or-v1-invalidkey');

      // Wait for async validation to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Status should be set to INVALID after failed validation
      expect(saveSetting).toHaveBeenCalledWith('llm_key_status_openrouter', KEY_STATUS.INVALID);
    });

    it('should validate OpenAI key via proxy and set VALID status', async () => {
      saveSetting.mockResolvedValue();
      global.fetch.mockResolvedValue({ ok: true });

      await saveProviderKeyWithValidation('openai', 'sk-validopenaikey123');

      // Wait for async validation to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should call backend proxy (not direct API)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://saberloop.com/llm/completion.php',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Verify request body contains correct provider and key
      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.provider).toBe('openai');
      expect(body.api_key).toBe('sk-validopenaikey123');
      expect(body.model).toBe('gpt-4o-mini');
      expect(body.options.max_tokens).toBe(5);

      // Status should be set to VALID
      expect(saveSetting).toHaveBeenCalledWith('llm_key_status_openai', KEY_STATUS.VALID);
    });

    it('should set INVALID status when proxy validation fails', async () => {
      saveSetting.mockResolvedValue();
      global.fetch.mockResolvedValue({ ok: false, status: 401 });

      await saveProviderKeyWithValidation('anthropic', 'sk-ant-invalidkey');

      // Wait for async validation to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(saveSetting).toHaveBeenCalledWith('llm_key_status_anthropic', KEY_STATUS.INVALID);
    });

    it('should handle network errors gracefully', async () => {
      saveSetting.mockResolvedValue();
      global.fetch.mockRejectedValue(new Error('Network error'));

      await saveProviderKeyWithValidation('openai', 'sk-validkey12345');

      // Wait for async validation to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should set INVALID on network error
      expect(saveSetting).toHaveBeenCalledWith('llm_key_status_openai', KEY_STATUS.INVALID);
    });

    it('should validate Google key via proxy', async () => {
      saveSetting.mockResolvedValue();
      global.fetch.mockResolvedValue({ ok: true });

      await saveProviderKeyWithValidation('google', 'AIzaValidGoogleKey123');

      // Wait for async validation to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.provider).toBe('google');
      expect(body.model).toBe('gemini-2.5-flash');

      expect(saveSetting).toHaveBeenCalledWith('llm_key_status_google', KEY_STATUS.VALID);
    });

    it('should validate xAI key via proxy', async () => {
      saveSetting.mockResolvedValue();
      global.fetch.mockResolvedValue({ ok: true });

      await saveProviderKeyWithValidation('xai', 'xai-validxaikey123');

      // Wait for async validation to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.provider).toBe('xai');
      expect(body.model).toBe('grok-3-fast');

      expect(saveSetting).toHaveBeenCalledWith('llm_key_status_xai', KEY_STATUS.VALID);
    });
  });
});
