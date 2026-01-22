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
} from './provider-settings-service.js';

// Mock the db module
vi.mock('../core/db.js', () => ({
  getSetting: vi.fn(),
  saveSetting: vi.fn(),
  getOpenRouterKey: vi.fn(),
  storeOpenRouterKey: vi.fn(),
  removeOpenRouterKey: vi.fn(),
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
});
