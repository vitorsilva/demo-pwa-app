import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { migrateApiKeys } from './api-keys-migration.js';

// Mock the db module
vi.mock('../core/db.js', () => ({
  getSetting: vi.fn(),
  saveSetting: vi.fn(),
  getOpenRouterKey: vi.fn(),
  storeOpenRouterKey: vi.fn(),
}));

// Mock the provider-settings-service
vi.mock('./provider-settings-service.js', () => ({
  getKeyStatus: vi.fn(),
  KEY_STATUS: {
    NOT_SET: 'not_set',
    VALIDATING: 'validating',
    VALID: 'valid',
    INVALID: 'invalid',
  },
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

import { getSetting, saveSetting, getOpenRouterKey, storeOpenRouterKey } from '../core/db.js';
import { getKeyStatus, KEY_STATUS } from './provider-settings-service.js';
import { logger } from '../utils/logger.js';

describe('API Keys Migration', () => {
  let originalLocalStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    // Save original localStorage
    originalLocalStorage = global.localStorage;
    // Create mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
  });

  afterEach(() => {
    // Restore original localStorage
    global.localStorage = originalLocalStorage;
  });

  describe('migrateApiKeys', () => {
    it('should skip if already migrated', async () => {
      getSetting.mockResolvedValue(true); // Already migrated

      await migrateApiKeys();

      expect(getSetting).toHaveBeenCalledWith('llm_keys_migrated_v1');
      expect(getOpenRouterKey).not.toHaveBeenCalled();
    });

    it('should initialize status for existing OpenRouter key', async () => {
      getSetting.mockResolvedValue(null); // Not migrated yet
      getOpenRouterKey.mockResolvedValue('sk-or-v1-existingkey');
      getKeyStatus.mockResolvedValue(KEY_STATUS.NOT_SET);
      saveSetting.mockResolvedValue();

      await migrateApiKeys();

      expect(saveSetting).toHaveBeenCalledWith('llm_key_status_openrouter', KEY_STATUS.VALID);
      expect(saveSetting).toHaveBeenCalledWith('llm_keys_migrated_v1', true);
      expect(logger.info).toHaveBeenCalledWith('OpenRouter key status initialized');
    });

    it('should not overwrite existing status', async () => {
      getSetting.mockResolvedValue(null); // Not migrated yet
      getOpenRouterKey.mockResolvedValue('sk-or-v1-existingkey');
      getKeyStatus.mockResolvedValue(KEY_STATUS.VALID); // Already has status
      saveSetting.mockResolvedValue();

      await migrateApiKeys();

      // Should not set status again
      expect(saveSetting).not.toHaveBeenCalledWith('llm_key_status_openrouter', KEY_STATUS.VALID);
      // But should mark migration complete
      expect(saveSetting).toHaveBeenCalledWith('llm_keys_migrated_v1', true);
    });

    it('should migrate legacy localStorage key', async () => {
      getSetting.mockResolvedValue(null); // Not migrated yet
      getOpenRouterKey.mockResolvedValue(null); // No key in IndexedDB
      global.localStorage.getItem.mockReturnValue('sk-or-v1-legacykey');
      storeOpenRouterKey.mockResolvedValue();
      saveSetting.mockResolvedValue();

      await migrateApiKeys();

      expect(storeOpenRouterKey).toHaveBeenCalledWith('sk-or-v1-legacykey');
      expect(saveSetting).toHaveBeenCalledWith('llm_key_status_openrouter', KEY_STATUS.VALID);
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('openrouter_api_key');
      expect(logger.info).toHaveBeenCalledWith('Legacy OpenRouter key migrated from localStorage');
    });

    it('should not migrate localStorage key if IndexedDB key exists', async () => {
      getSetting.mockResolvedValue(null); // Not migrated yet
      getOpenRouterKey.mockResolvedValue('sk-or-v1-existingkey'); // Key in IndexedDB
      getKeyStatus.mockResolvedValue(KEY_STATUS.NOT_SET);
      global.localStorage.getItem.mockReturnValue('sk-or-v1-legacykey'); // Also in localStorage
      saveSetting.mockResolvedValue();

      await migrateApiKeys();

      // Should not store from localStorage
      expect(storeOpenRouterKey).not.toHaveBeenCalled();
      // Should not remove from localStorage
      expect(global.localStorage.removeItem).not.toHaveBeenCalled();
    });

    it('should handle migration errors gracefully', async () => {
      getSetting.mockResolvedValue(null); // Not migrated yet
      getOpenRouterKey.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(migrateApiKeys()).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith('API key migration failed:', expect.any(Error));
    });

    it('should complete migration even with no keys', async () => {
      getSetting.mockResolvedValue(null); // Not migrated yet
      getOpenRouterKey.mockResolvedValue(null); // No key
      global.localStorage.getItem.mockReturnValue(null); // No legacy key
      saveSetting.mockResolvedValue();

      await migrateApiKeys();

      expect(saveSetting).toHaveBeenCalledWith('llm_keys_migrated_v1', true);
      expect(logger.info).toHaveBeenCalledWith('API key migration complete');
    });
  });
});
