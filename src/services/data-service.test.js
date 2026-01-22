/**
 * Unit tests for data-service.js
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all dependencies
vi.mock('../core/db.js', () => ({
  clearAllUserData: vi.fn(),
}));

vi.mock('../features/sample-loader.js', () => ({
  loadSamplesIfNeeded: vi.fn(),
}));

vi.mock('../core/state.js', () => ({
  default: {
    clear: vi.fn(),
  },
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

import { deleteAllUserData } from './data-service.js';
import { clearAllUserData } from '../core/db.js';
import { loadSamplesIfNeeded } from '../features/sample-loader.js';
import state from '../core/state.js';
import { logger } from '../utils/logger.js';

describe('Data Service', () => {
  let originalLocalStorage;
  let originalSessionStorage;
  let localStorageData;
  let sessionStorageData;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    localStorageData = {};
    originalLocalStorage = global.localStorage;
    global.localStorage = {
      getItem: vi.fn((key) => localStorageData[key] || null),
      setItem: vi.fn((key, value) => {
        localStorageData[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete localStorageData[key];
      }),
      clear: vi.fn(() => {
        localStorageData = {};
      }),
    };

    // Mock sessionStorage
    sessionStorageData = {};
    originalSessionStorage = global.sessionStorage;
    global.sessionStorage = {
      getItem: vi.fn((key) => sessionStorageData[key] || null),
      setItem: vi.fn((key, value) => {
        sessionStorageData[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete sessionStorageData[key];
      }),
      clear: vi.fn(() => {
        sessionStorageData = {};
      }),
    };
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
    global.sessionStorage = originalSessionStorage;
  });

  describe('deleteAllUserData', () => {
    it('should clear IndexedDB user data', async () => {
      await deleteAllUserData();

      expect(clearAllUserData).toHaveBeenCalledTimes(1);
    });

    it('should clear localStorage keys', async () => {
      // Set up localStorage with data
      localStorageData = {
        quizmaster_settings: '{}',
        openrouter_models_cache: '[]',
        i18nextLng: 'en',
        saberloop_telemetry_queue: '[]',
        other_key: 'should not be removed',
      };

      await deleteAllUserData();

      // Verify app-specific keys were removed
      expect(localStorage.removeItem).toHaveBeenCalledWith('quizmaster_settings');
      expect(localStorage.removeItem).toHaveBeenCalledWith('openrouter_models_cache');
      expect(localStorage.removeItem).toHaveBeenCalledWith('i18nextLng');
      expect(localStorage.removeItem).toHaveBeenCalledWith('saberloop_telemetry_queue');
    });

    it('should clear sessionStorage keys', async () => {
      sessionStorageData = {
        openrouter_code_verifier: 'test-verifier',
      };

      await deleteAllUserData();

      expect(sessionStorage.removeItem).toHaveBeenCalledWith('openrouter_code_verifier');
    });

    it('should reset in-memory state', async () => {
      await deleteAllUserData();

      expect(state.clear).toHaveBeenCalledTimes(1);
    });

    it('should reload sample quizzes', async () => {
      await deleteAllUserData();

      expect(loadSamplesIfNeeded).toHaveBeenCalledTimes(1);
    });

    it('should execute in correct order', async () => {
      const callOrder = [];

      clearAllUserData.mockImplementation(() => {
        callOrder.push('clearAllUserData');
        return Promise.resolve();
      });

      localStorage.removeItem.mockImplementation(() => {
        if (!callOrder.includes('localStorage')) {
          callOrder.push('localStorage');
        }
      });

      sessionStorage.removeItem.mockImplementation(() => {
        if (!callOrder.includes('sessionStorage')) {
          callOrder.push('sessionStorage');
        }
      });

      state.clear.mockImplementation(() => {
        callOrder.push('state.clear');
      });

      loadSamplesIfNeeded.mockImplementation(() => {
        callOrder.push('loadSamplesIfNeeded');
        return Promise.resolve();
      });

      await deleteAllUserData();

      expect(callOrder).toEqual([
        'clearAllUserData',
        'localStorage',
        'sessionStorage',
        'state.clear',
        'loadSamplesIfNeeded',
      ]);
    });

    it('should log info messages', async () => {
      await deleteAllUserData();

      expect(logger.info).toHaveBeenCalledWith('Starting data deletion...');
      expect(logger.info).toHaveBeenCalledWith('Data deletion complete');
    });

    it('should log debug messages for each step', async () => {
      await deleteAllUserData();

      expect(logger.debug).toHaveBeenCalledWith('Clearing IndexedDB...');
      expect(logger.debug).toHaveBeenCalledWith('Clearing localStorage...');
      expect(logger.debug).toHaveBeenCalledWith('Clearing sessionStorage...');
      expect(logger.debug).toHaveBeenCalledWith('Resetting in-memory state...');
      expect(logger.debug).toHaveBeenCalledWith('Reloading sample quizzes...');
    });

    it('should throw and log error if deletion fails', async () => {
      const error = new Error('Database error');
      clearAllUserData.mockRejectedValue(error);

      await expect(deleteAllUserData()).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalledWith('Data deletion failed', {
        error: 'Database error',
      });
    });

    it('should not reload samples if clearing fails', async () => {
      clearAllUserData.mockRejectedValue(new Error('Database error'));

      try {
        await deleteAllUserData();
      } catch {
        // Expected to throw
      }

      expect(loadSamplesIfNeeded).not.toHaveBeenCalled();
    });
  });
});
