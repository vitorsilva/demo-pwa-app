import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FEATURE_FLAGS, isFeatureEnabled, getFeaturePhase } from './features.js';

describe('Feature Flags', () => {
  beforeEach(() => {
    // Clear any test overrides before each test
    localStorage.removeItem('__test_feature_SHOW_ADS');
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.removeItem('__test_feature_SHOW_ADS');
  });

  describe('isFeatureEnabled', () => {
    it('should return false for unknown feature', () => {
      const result = isFeatureEnabled('UNKNOWN_FEATURE');
      expect(result).toBe(false);
    });

    it('should return true when phase is ENABLED', () => {
      // SHOW_ADS is ENABLED in all environments
      expect(isFeatureEnabled('SHOW_ADS', 'settings')).toBe(true);
      expect(isFeatureEnabled('SHOW_ADS', 'welcome')).toBe(true);
      expect(isFeatureEnabled('SHOW_ADS', 'home')).toBe(true);
    });

    it('should use default context when not provided', () => {
      // ENABLED should return true regardless of context
      expect(isFeatureEnabled('SHOW_ADS')).toBe(true);
    });

    describe('localStorage overrides', () => {
      it('should return true when localStorage override is ENABLED', () => {
        // Temporarily set SHOW_ADS to DISABLED to verify override works
        const originalPhase = FEATURE_FLAGS.SHOW_ADS.phase;
        FEATURE_FLAGS.SHOW_ADS.phase = 'DISABLED';

        localStorage.setItem('__test_feature_SHOW_ADS', 'ENABLED');
        expect(isFeatureEnabled('SHOW_ADS')).toBe(true);

        // Restore
        FEATURE_FLAGS.SHOW_ADS.phase = originalPhase;
      });

      it('should return false when localStorage override is DISABLED', () => {
        localStorage.setItem('__test_feature_SHOW_ADS', 'DISABLED');
        expect(isFeatureEnabled('SHOW_ADS')).toBe(false);
      });

      it('should ignore invalid localStorage values', () => {
        localStorage.setItem('__test_feature_SHOW_ADS', 'INVALID');
        // Should fall back to the feature's actual phase
        expect(isFeatureEnabled('SHOW_ADS')).toBe(true);
      });
    });
  });

  describe('getFeaturePhase', () => {
    it('should return current phase for known feature', () => {
      const phase = getFeaturePhase('SHOW_ADS');
      expect(['DISABLED', 'SETTINGS_ONLY', 'ENABLED']).toContain(phase);
    });

    it('should return UNKNOWN for unknown feature', () => {
      const phase = getFeaturePhase('UNKNOWN_FEATURE');
      expect(phase).toBe('UNKNOWN');
    });

    it('should return the exact current phase for known features', () => {
      // SHOW_ADS is ENABLED
      expect(getFeaturePhase('SHOW_ADS')).toBe('ENABLED');
    });
  });

  describe('FEATURE_FLAGS structure', () => {
    it('should have expected flags defined', () => {
      expect(FEATURE_FLAGS).toHaveProperty('SHOW_ADS');
    });

    it('each flag should have phase and description', () => {
      Object.entries(FEATURE_FLAGS).forEach(([name, config]) => {
        expect(config).toHaveProperty('phase');
        expect(config).toHaveProperty('description');
        expect(['DISABLED', 'SETTINGS_ONLY', 'ENABLED']).toContain(config.phase);
        expect(typeof config.description).toBe('string');
      });
    });
  });

  describe('phase behaviors', () => {
    let originalPhase;

    beforeEach(() => {
      originalPhase = FEATURE_FLAGS.SHOW_ADS.phase;
    });

    afterEach(() => {
      FEATURE_FLAGS.SHOW_ADS.phase = originalPhase;
    });

    it('should return false when phase is DISABLED', () => {
      FEATURE_FLAGS.SHOW_ADS.phase = 'DISABLED';

      expect(isFeatureEnabled('SHOW_ADS', 'settings')).toBe(false);
      expect(isFeatureEnabled('SHOW_ADS', 'welcome')).toBe(false);
      expect(isFeatureEnabled('SHOW_ADS', 'home')).toBe(false);
      expect(isFeatureEnabled('SHOW_ADS')).toBe(false);
    });

    it('should return true only for settings context when phase is SETTINGS_ONLY', () => {
      FEATURE_FLAGS.SHOW_ADS.phase = 'SETTINGS_ONLY';

      expect(isFeatureEnabled('SHOW_ADS', 'settings')).toBe(true);
      expect(isFeatureEnabled('SHOW_ADS', 'welcome')).toBe(false);
      expect(isFeatureEnabled('SHOW_ADS', 'home')).toBe(false);
      expect(isFeatureEnabled('SHOW_ADS')).toBe(false); // default context
    });

    it('should return true for all contexts when phase is ENABLED', () => {
      FEATURE_FLAGS.SHOW_ADS.phase = 'ENABLED';

      expect(isFeatureEnabled('SHOW_ADS', 'settings')).toBe(true);
      expect(isFeatureEnabled('SHOW_ADS', 'welcome')).toBe(true);
      expect(isFeatureEnabled('SHOW_ADS', 'home')).toBe(true);
      expect(isFeatureEnabled('SHOW_ADS')).toBe(true);
    });

    it('should return false for unknown phase (default case)', () => {
      FEATURE_FLAGS.SHOW_ADS.phase = 'UNKNOWN_PHASE';

      expect(isFeatureEnabled('SHOW_ADS', 'settings')).toBe(false);
      expect(isFeatureEnabled('SHOW_ADS', 'welcome')).toBe(false);
      expect(isFeatureEnabled('SHOW_ADS')).toBe(false);
    });
  });
});
