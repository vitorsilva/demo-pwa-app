  /**
   * Feature Flags for Gradual Rollout
   *
   * Phases:
   * - DISABLED: Code deployed but not active
   * - SETTINGS_ONLY: Available only in Settings page
   * - ENABLED: Available everywhere
   */

  /**
   * Get current deployment environment
   * @returns {'production' | 'staging' | 'development'}
   */
  function getEnvironment() {
    return import.meta.env.VITE_DEPLOY_TARGET || 'production';
  }

  export const FEATURE_FLAGS = {
    SHOW_ADS: {
      phase: 'ENABLED',  // Show AdSense ads during loading screens
      description: 'Display Google AdSense ads during quiz and results loading'
    }
  };

  /**
   * Check if a feature is enabled for a given context
   * @param {string} featureName - Key from FEATURE_FLAGS
   * @param {string} context - Where the feature is being used ('settings' | 'welcome' | 'home')
   * @returns {boolean}
   */
  export function isFeatureEnabled(featureName, context = 'default') {
    // Check for test override in localStorage (for E2E testing)
    const override = localStorage.getItem(`__test_feature_${featureName}`);
    if (override === 'ENABLED') return true;
    if (override === 'DISABLED') return false;

    const feature = FEATURE_FLAGS[featureName];

    if (!feature) {
      console.warn(`[Features] Unknown feature: ${featureName}`);
      return false;
    }

    switch (feature.phase) {
      case 'DISABLED':
        return false;
      case 'SETTINGS_ONLY':
        return context === 'settings';
      case 'ENABLED':
        return true;
      default:
        return false;
    }
  }

  /**
   * Get current phase for a feature (useful for debugging)
   */
  export function getFeaturePhase(featureName) {
    return FEATURE_FLAGS[featureName]?.phase || 'UNKNOWN';
  }