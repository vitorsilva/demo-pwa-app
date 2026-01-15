  import { describe, it, expect, beforeEach, afterEach } from 'vitest';
  import { FEATURE_FLAGS, isFeatureEnabled, getFeaturePhase } from './features.js';

  describe('Feature Flags', () => {

    beforeEach(() => {
      // Clear any test overrides before each test
      localStorage.removeItem('__test_feature_SHOW_ADS');
      localStorage.removeItem('__test_feature_MODE_TOGGLE');
      localStorage.removeItem('__test_feature_PARTY_SESSION');
    });

    afterEach(() => {
      // Clean up after each test
      localStorage.removeItem('__test_feature_SHOW_ADS');
      localStorage.removeItem('__test_feature_MODE_TOGGLE');
      localStorage.removeItem('__test_feature_PARTY_SESSION');
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

      it('should return true for MODE_TOGGLE (enabled in all environments)', () => {
        // MODE_TOGGLE is ENABLED in all environments
        expect(isFeatureEnabled('MODE_TOGGLE', 'settings')).toBe(true);
        expect(isFeatureEnabled('MODE_TOGGLE', 'welcome')).toBe(true);
        expect(isFeatureEnabled('MODE_TOGGLE', 'home')).toBe(true);
      });

      it('should use default context when not provided', () => {
        // ENABLED should return true regardless of context
        expect(isFeatureEnabled('SHOW_ADS')).toBe(true);
        expect(isFeatureEnabled('MODE_TOGGLE')).toBe(true);
      });

      describe('localStorage overrides', () => {

        it('should return true when localStorage override is ENABLED', () => {
          localStorage.setItem('__test_feature_PARTY_SESSION', 'ENABLED');
          expect(isFeatureEnabled('PARTY_SESSION')).toBe(true);
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
        // SHOW_ADS and MODE_TOGGLE are always ENABLED
        expect(getFeaturePhase('SHOW_ADS')).toBe('ENABLED');
        expect(getFeaturePhase('MODE_TOGGLE')).toBe('ENABLED');
      });

    });

    describe('environment-aware flags', () => {

      it('PARTY_SESSION should be ENABLED (P2P decentralization complete)', () => {
        // PARTY_SESSION is now enabled for all environments after P2P validation
        expect(getFeaturePhase('PARTY_SESSION')).toBe('ENABLED');
        expect(isFeatureEnabled('PARTY_SESSION')).toBe(true);
      });

      it('PARTY_SESSION can be disabled via localStorage override', () => {
        // localStorage override should work for testing/rollback
        localStorage.setItem('__test_feature_PARTY_SESSION', 'DISABLED');
        expect(isFeatureEnabled('PARTY_SESSION')).toBe(false);
      });

    });

    describe('FEATURE_FLAGS structure', () => {

      it('should have expected flags defined', () => {
        expect(FEATURE_FLAGS).toHaveProperty('SHOW_ADS');
        expect(FEATURE_FLAGS).toHaveProperty('MODE_TOGGLE');
        expect(FEATURE_FLAGS).toHaveProperty('PARTY_SESSION');
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

  });
