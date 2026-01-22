/**
 * Theme Manager Service
 * Manages Learning/Party mode switching and theme application.
 */

import { getSetting, saveSetting } from '../core/settings.js';
import { telemetry } from '../utils/telemetry.js';

/**
 * Gets the current app mode.
 * @returns {'learning' | 'party'} The current mode
 */
export function getCurrentMode() {
  return getSetting('appMode') || 'learning';
}

/**
 * Sets the app mode and applies the theme.
 * @param {'learning' | 'party'} mode - The mode to set
 */
export function setMode(mode) {
  const previousMode = getCurrentMode();
  saveSetting('appMode', mode);
  applyTheme(mode);

  if (previousMode !== mode) {
    telemetry.track('event', {
      name: 'mode_switched',
      from: previousMode,
      to: mode,
    });

    // Dispatch event so views can respond to mode changes
    window.dispatchEvent(
      new CustomEvent('modechange', {
        detail: { mode, previousMode },
      })
    );
  }
}

/**
 * Applies the visual theme for the given mode.
 * @param {'learning' | 'party'} mode - The mode to apply
 */
export function applyTheme(mode) {
  const root = document.documentElement;

  if (mode === 'party') {
    root.classList.add('party-mode', 'dark');
  } else {
    root.classList.remove('party-mode', 'dark');
  }
}

/**
 * Toggles between learning and party modes.
 * @returns {'learning' | 'party'} The new mode
 */
export function toggleMode() {
  const current = getCurrentMode();
  const newMode = current === 'learning' ? 'party' : 'learning';
  setMode(newMode);
  return newMode;
}

/**
 * Initializes the theme based on saved preference.
 * Call this on app startup.
 */
export function initTheme() {
  const mode = getCurrentMode();
  applyTheme(mode);
}
