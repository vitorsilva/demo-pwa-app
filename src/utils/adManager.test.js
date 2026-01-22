import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies
vi.mock('./logger.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('./network.js', () => ({
  isOnline: vi.fn(),
  onOnline: vi.fn(),
  onOffline: vi.fn(),
}));

vi.mock('../core/features.js', () => ({
  isFeatureEnabled: vi.fn(),
}));

import {
  canLoadAds,
  loadAd,
  hideContainer,
  showContainer,
  showPlaceholder,
  resetForNavigation,
  initAdManager,
  getPublisherId,
  setAdSlot,
} from './adManager.js';
import { logger } from './logger.js';
import { isOnline, onOnline, onOffline } from './network.js';
import { isFeatureEnabled } from '../core/features.js';

describe('AdManager', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Reset DOM
    document.body.innerHTML = '';

    // Reset adsbygoogle
    delete window.adsbygoogle;

    // Reset loaded ads state by calling resetForNavigation
    resetForNavigation();
  });

  describe('canLoadAds', () => {
    it('should return false when feature flag is disabled', () => {
      isFeatureEnabled.mockReturnValue(false);
      isOnline.mockReturnValue(true);
      window.adsbygoogle = [];

      const result = canLoadAds();

      expect(result).toBe(false);
      expect(isFeatureEnabled).toHaveBeenCalledWith('SHOW_ADS');
      expect(logger.debug).toHaveBeenCalledWith('[AdManager] Ads disabled by feature flag');
    });

    it('should return false when offline', () => {
      isFeatureEnabled.mockReturnValue(true);
      isOnline.mockReturnValue(false);
      window.adsbygoogle = [];

      const result = canLoadAds();

      expect(result).toBe(false);
      expect(logger.debug).toHaveBeenCalledWith('[AdManager] Cannot load ads: offline');
    });

    it('should return false when adsbygoogle is not loaded', () => {
      isFeatureEnabled.mockReturnValue(true);
      isOnline.mockReturnValue(true);
      // Don't set window.adsbygoogle

      const result = canLoadAds();

      expect(result).toBe(false);
      expect(logger.debug).toHaveBeenCalledWith(
        '[AdManager] Cannot load ads: adsbygoogle not loaded'
      );
    });

    it('should return true when all conditions are met', () => {
      isFeatureEnabled.mockReturnValue(true);
      isOnline.mockReturnValue(true);
      window.adsbygoogle = [];

      const result = canLoadAds();

      expect(result).toBe(true);
    });
  });

  describe('loadAd', () => {
    beforeEach(() => {
      // Setup container
      document.body.innerHTML = '<div id="test-ad-container"></div>';

      // Setup conditions for loading ads
      isFeatureEnabled.mockReturnValue(true);
      isOnline.mockReturnValue(true);
      window.adsbygoogle = [];
    });

    it('should return false when container is not found', async () => {
      const result = await loadAd('nonexistent-container', 'quizLoading');

      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        '[AdManager] Container not found: nonexistent-container'
      );
    });

    it('should return false and show placeholder when no slot ID is configured for quizLoading', async () => {
      // quizLoading has empty slot ID by default
      const result = await loadAd('test-ad-container', 'quizLoading');

      expect(result).toBe(false);
      expect(logger.debug).toHaveBeenCalledWith(
        '[AdManager] No slot ID for quizLoading - AdSense pending approval'
      );

      // Should show placeholder instead of hiding
      const container = document.getElementById('test-ad-container');
      expect(container.style.display).toBe('block');
      expect(container.innerHTML).toContain('Ad Space');
    });

    it('should return false and show placeholder when no slot ID is configured for resultsLoading', async () => {
      // resultsLoading also has empty slot ID by default
      const result = await loadAd('test-ad-container', 'resultsLoading');

      expect(result).toBe(false);
      expect(logger.debug).toHaveBeenCalledWith(
        '[AdManager] No slot ID for resultsLoading - AdSense pending approval'
      );

      // Should show placeholder instead of hiding
      const container = document.getElementById('test-ad-container');
      expect(container.style.display).toBe('block');
      expect(container.innerHTML).toContain('Ad Space');
    });

    it('should prevent duplicate ad loads in same container', async () => {
      // Set a slot ID
      setAdSlot('quizLoading', '1234567890');

      // First load
      await loadAd('test-ad-container', 'quizLoading');

      // Second load attempt
      const result = await loadAd('test-ad-container', 'quizLoading');

      expect(result).toBe(false);
      expect(logger.debug).toHaveBeenCalledWith(
        '[AdManager] Ad already loaded in test-ad-container'
      );
    });

    it('should hide container when ads cannot load', async () => {
      // Add content to verify it gets cleared by hideContainer
      document.getElementById('test-ad-container').innerHTML = '<p>old content</p>';
      isOnline.mockReturnValue(false);

      const result = await loadAd('test-ad-container', 'quizLoading');

      expect(result).toBe(false);
      const container = document.getElementById('test-ad-container');
      expect(container.style.display).toBe('none');
      expect(container.innerHTML).toBe('');
      // Verify old content was removed
      expect(container.querySelectorAll('p').length).toBe(0);
    });

    it('should load ad successfully when slot ID is set', async () => {
      // Add some content to verify it gets cleared
      document.getElementById('test-ad-container').innerHTML = '<p>old content</p>';
      setAdSlot('quizLoading', '1234567890');

      const result = await loadAd('test-ad-container', 'quizLoading');

      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('[AdManager] Ad loaded in test-ad-container');

      // Check that ad element was created with correct attributes
      const container = document.getElementById('test-ad-container');
      const adElement = container.querySelector('.adsbygoogle');
      expect(adElement).toBeTruthy();
      expect(adElement.getAttribute('data-ad-slot')).toBe('1234567890');
      expect(adElement.getAttribute('data-ad-format')).toBe('auto');
      expect(adElement.getAttribute('data-full-width-responsive')).toBe('true');
      expect(adElement.style.display).toBe('block');

      // Verify container was cleared (old content removed) and only has the ad element
      expect(container.querySelectorAll('p').length).toBe(0);
      expect(container.children.length).toBe(1);
      expect(container.children[0]).toBe(adElement);
      // Also verify no text nodes exist (container.innerHTML = '' must clear all content)
      expect(container.childNodes.length).toBe(1);
    });

    it('should push to adsbygoogle array when loading ad', async () => {
      setAdSlot('quizLoading', '1234567890');
      window.adsbygoogle = [];

      await loadAd('test-ad-container', 'quizLoading');

      expect(window.adsbygoogle.length).toBe(1);
    });

    it('should initialize adsbygoogle array if undefined when loading ad', () => {
      setAdSlot('quizLoading', '1234567890');
      // Simulate adsbygoogle being defined but as an empty array (edge case)
      window.adsbygoogle = undefined;
      // But we need canLoadAds to pass, so set it back before the check
      Object.defineProperty(window, 'adsbygoogle', {
        value: [],
        writable: true,
        configurable: true,
      });

      loadAd('test-ad-container', 'quizLoading');

      expect(window.adsbygoogle).toBeDefined();
      expect(Array.isArray(window.adsbygoogle)).toBe(true);
    });
  });

  describe('hideContainer', () => {
    it('should hide container and clear content', () => {
      document.body.innerHTML = '<div id="test-container">Some content</div>';

      hideContainer('test-container');

      const container = document.getElementById('test-container');
      expect(container.innerHTML).toBe('');
      expect(container.style.display).toBe('none');
    });

    it('should not crash when container does not exist', () => {
      expect(() => {
        hideContainer('nonexistent');
      }).not.toThrow();
    });
  });

  describe('showContainer', () => {
    it('should show container', () => {
      document.body.innerHTML = '<div id="test-container" style="display: none;"></div>';

      showContainer('test-container');

      const container = document.getElementById('test-container');
      expect(container.style.display).toBe('block');
    });

    it('should not crash when container does not exist', () => {
      expect(() => {
        showContainer('nonexistent');
      }).not.toThrow();
    });
  });

  describe('showPlaceholder', () => {
    it('should show placeholder with "Ad Space" text', () => {
      document.body.innerHTML = '<div id="test-container" style="display: none;"></div>';

      showPlaceholder('test-container');

      const container = document.getElementById('test-container');
      expect(container.style.display).toBe('block');
      expect(container.innerHTML).toContain('Ad Space');
      expect(container.innerHTML).toContain('Awaiting AdSense approval');
    });

    it('should not crash when container does not exist', () => {
      expect(() => {
        showPlaceholder('nonexistent');
      }).not.toThrow();
    });
  });

  describe('resetForNavigation', () => {
    it('should clear loaded ads tracking', async () => {
      document.body.innerHTML = '<div id="test-ad-container"></div>';
      isFeatureEnabled.mockReturnValue(true);
      isOnline.mockReturnValue(true);
      window.adsbygoogle = [];
      setAdSlot('quizLoading', '1234567890');

      // Load an ad
      loadAd('test-ad-container', 'quizLoading');

      // Reset
      resetForNavigation();

      // Should be able to load again (duplicate check should pass)
      document.body.innerHTML = '<div id="test-ad-container"></div>';
      const result = await loadAd('test-ad-container', 'quizLoading');

      expect(result).toBe(true);
    });

    it('should log debug message', () => {
      resetForNavigation();

      expect(logger.debug).toHaveBeenCalledWith('[AdManager] Reset for navigation');
    });
  });

  describe('initAdManager', () => {
    it('should register online/offline listeners', () => {
      isFeatureEnabled.mockReturnValue(true);
      isOnline.mockReturnValue(true);

      initAdManager();

      expect(onOnline).toHaveBeenCalledTimes(1);
      expect(onOffline).toHaveBeenCalledTimes(1);
    });

    it('should log initialization info with correct details', () => {
      isFeatureEnabled.mockReturnValue(true);
      isOnline.mockReturnValue(true);

      initAdManager();

      // Verify isFeatureEnabled was called with correct argument
      expect(isFeatureEnabled).toHaveBeenCalledWith('SHOW_ADS');
      expect(logger.info).toHaveBeenCalledWith('[AdManager] Initialized', {
        publisherId: 'ca-pub-9849708569219157',
        featureEnabled: true,
        online: true,
      });
    });
  });

  describe('getPublisherId', () => {
    it('should return the publisher ID', () => {
      const publisherId = getPublisherId();

      expect(publisherId).toBe('ca-pub-9849708569219157');
    });
  });

  describe('setAdSlot', () => {
    it('should set slot ID for valid key', () => {
      setAdSlot('quizLoading', '9999999999');

      expect(logger.info).toHaveBeenCalledWith('[AdManager] Set slot quizLoading = 9999999999');
    });

    it('should set slot ID for resultsLoading key', () => {
      setAdSlot('resultsLoading', '8888888888');

      expect(logger.info).toHaveBeenCalledWith('[AdManager] Set slot resultsLoading = 8888888888');
    });

    it('should warn for unknown slot key', () => {
      setAdSlot('unknownSlot', '1234567890');

      expect(logger.warn).toHaveBeenCalledWith('[AdManager] Unknown slot key: unknownSlot');
    });
  });

  describe('online/offline handlers', () => {
    it('should register handlers that log on online event', () => {
      isFeatureEnabled.mockReturnValue(true);
      isOnline.mockReturnValue(true);

      initAdManager();

      // Get the handler that was registered
      const onlineHandler = onOnline.mock.calls[0][0];

      // Call the handler
      onlineHandler();

      expect(logger.debug).toHaveBeenCalledWith('[AdManager] Online - ads can be shown');
    });

    it('should register handlers that hide containers on offline event', async () => {
      document.body.innerHTML = '<div id="ad-container-1"></div><div id="ad-container-2"></div>';
      isFeatureEnabled.mockReturnValue(true);
      isOnline.mockReturnValue(true);
      window.adsbygoogle = [];

      // Load ads in containers first
      setAdSlot('quizLoading', '1234567890');
      await loadAd('ad-container-1', 'quizLoading');

      resetForNavigation(); // Clear loaded state
      setAdSlot('resultsLoading', '0987654321');
      await loadAd('ad-container-2', 'resultsLoading');

      initAdManager();

      // Get the offline handler that was registered
      const offlineHandler = onOffline.mock.calls[0][0];

      // Call the handler
      offlineHandler();

      expect(logger.debug).toHaveBeenCalledWith('[AdManager] Offline - hiding ads');
      // Containers should be hidden
      expect(document.getElementById('ad-container-2').style.display).toBe('none');
    });
  });

  describe('error handling', () => {
    it('should handle errors when loading ad and return false', async () => {
      // Setup container
      document.body.innerHTML = '<div id="error-test-container"></div>';
      isFeatureEnabled.mockReturnValue(true);
      isOnline.mockReturnValue(true);
      window.adsbygoogle = [];
      setAdSlot('quizLoading', '1234567890');

      // Make appendChild throw an error
      const container = document.getElementById('error-test-container');
      container.appendChild = () => {
        throw new Error('DOM error');
      };

      const result = await loadAd('error-test-container', 'quizLoading');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('[AdManager] Error loading ad:', expect.any(Error));
    });
  });
});
