import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCurrentMode, setMode, applyTheme, toggleMode, initTheme } from './theme-manager.js';
import { getSetting, saveSetting } from '../core/settings.js';
import { telemetry } from '../utils/telemetry.js';

// Mock dependencies
vi.mock('../core/settings.js', () => ({
  getSetting: vi.fn(),
  saveSetting: vi.fn(),
}));

vi.mock('../utils/telemetry.js', () => ({
  telemetry: {
    track: vi.fn(),
  },
}));

describe('Theme Manager Service', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Reset document classes
    document.documentElement.classList.remove('party-mode', 'dark');
  });

  describe('getCurrentMode', () => {
    it('should return "learning" as default when no setting exists', () => {
      getSetting.mockReturnValue(undefined);

      const mode = getCurrentMode();

      expect(mode).toBe('learning');
      expect(getSetting).toHaveBeenCalledWith('appMode');
    });

    it('should return "learning" when setting is "learning"', () => {
      getSetting.mockReturnValue('learning');

      const mode = getCurrentMode();

      expect(mode).toBe('learning');
    });

    it('should return "party" when setting is "party"', () => {
      getSetting.mockReturnValue('party');

      const mode = getCurrentMode();

      expect(mode).toBe('party');
    });
  });

  describe('setMode', () => {
    it('should save mode to settings', () => {
      getSetting.mockReturnValue('learning');

      setMode('party');

      expect(saveSetting).toHaveBeenCalledWith('appMode', 'party');
    });

    it('should apply theme after saving', () => {
      getSetting.mockReturnValue('learning');

      setMode('party');

      expect(document.documentElement.classList.contains('party-mode')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should track telemetry when mode changes', () => {
      getSetting.mockReturnValue('learning');

      setMode('party');

      expect(telemetry.track).toHaveBeenCalledWith('event', {
        name: 'mode_switched',
        from: 'learning',
        to: 'party',
      });
    });

    it('should not track telemetry when mode stays the same', () => {
      getSetting.mockReturnValue('party');

      setMode('party');

      expect(telemetry.track).not.toHaveBeenCalled();
    });

    it('should track telemetry when switching from party to learning', () => {
      getSetting.mockReturnValue('party');

      setMode('learning');

      expect(telemetry.track).toHaveBeenCalledWith('event', {
        name: 'mode_switched',
        from: 'party',
        to: 'learning',
      });
    });
  });

  describe('applyTheme', () => {
    it('should add party-mode and dark classes for party mode', () => {
      applyTheme('party');

      expect(document.documentElement.classList.contains('party-mode')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove party-mode and dark classes for learning mode', () => {
      // First apply party mode
      document.documentElement.classList.add('party-mode', 'dark');

      applyTheme('learning');

      expect(document.documentElement.classList.contains('party-mode')).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should handle switching from learning to party', () => {
      applyTheme('learning');
      expect(document.documentElement.classList.contains('party-mode')).toBe(false);

      applyTheme('party');
      expect(document.documentElement.classList.contains('party-mode')).toBe(true);
    });

    it('should handle switching from party to learning', () => {
      applyTheme('party');
      expect(document.documentElement.classList.contains('party-mode')).toBe(true);

      applyTheme('learning');
      expect(document.documentElement.classList.contains('party-mode')).toBe(false);
    });
  });

  describe('toggleMode', () => {
    it('should switch from learning to party', () => {
      getSetting.mockReturnValue('learning');

      const newMode = toggleMode();

      expect(newMode).toBe('party');
      expect(saveSetting).toHaveBeenCalledWith('appMode', 'party');
    });

    it('should switch from party to learning', () => {
      getSetting.mockReturnValue('party');

      const newMode = toggleMode();

      expect(newMode).toBe('learning');
      expect(saveSetting).toHaveBeenCalledWith('appMode', 'learning');
    });

    it('should apply theme after toggling', () => {
      getSetting.mockReturnValue('learning');

      toggleMode();

      expect(document.documentElement.classList.contains('party-mode')).toBe(true);
    });

    it('should track telemetry on toggle', () => {
      getSetting.mockReturnValue('learning');

      toggleMode();

      expect(telemetry.track).toHaveBeenCalledWith('event', {
        name: 'mode_switched',
        from: 'learning',
        to: 'party',
      });
    });
  });

  describe('initTheme', () => {
    it('should apply learning theme when mode is learning', () => {
      getSetting.mockReturnValue('learning');

      initTheme();

      expect(document.documentElement.classList.contains('party-mode')).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should apply party theme when mode is party', () => {
      getSetting.mockReturnValue('party');

      initTheme();

      expect(document.documentElement.classList.contains('party-mode')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should apply learning theme when no mode is set (default)', () => {
      getSetting.mockReturnValue(undefined);

      initTheme();

      expect(document.documentElement.classList.contains('party-mode')).toBe(false);
    });

    it('should not track telemetry on init', () => {
      getSetting.mockReturnValue('party');

      initTheme();

      // initTheme only applies theme, doesn't call setMode with tracking
      expect(telemetry.track).not.toHaveBeenCalled();
    });
  });
});
