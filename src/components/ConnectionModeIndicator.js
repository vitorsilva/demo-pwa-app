/**
 * Connection Mode Indicator Component
 *
 * Shows the current P2P connection status in party mode.
 * - Green: P2P direct connection
 * - Yellow: HTTP fallback (server relay)
 * - Blue: Connecting
 */

import { t } from '../core/i18n.js';
import { CONNECTION_MODES } from '../services/party-connection-manager.js';

/**
 * Configuration for each connection mode.
 * Maps mode to its visual styling and icon.
 */
export const MODE_CONFIG = {
  [CONNECTION_MODES.P2P]: {
    bgClass: 'bg-green-500',
    icon: 'wifi',
    iconClass: '',
    i18nKey: 'party.connectedP2P',
  },
  [CONNECTION_MODES.HTTP_FALLBACK]: {
    bgClass: 'bg-yellow-500',
    icon: 'cloud',
    iconClass: '',
    i18nKey: 'party.connectedServer',
  },
  [CONNECTION_MODES.CONNECTING]: {
    bgClass: 'bg-blue-500',
    icon: 'sync',
    iconClass: 'animate-spin',
    i18nKey: 'party.connecting',
  },
};

/**
 * Creates a connection mode indicator element.
 *
 * @param {string} mode - Connection mode from CONNECTION_MODES
 * @returns {HTMLElement} The indicator element
 */
export function createConnectionModeIndicator(mode = CONNECTION_MODES.CONNECTING) {
  const indicator = document.createElement('div');
  indicator.id = 'connectionModeIndicator';
  updateConnectionModeIndicator(indicator, mode);
  return indicator;
}

/**
 * Updates an existing connection mode indicator.
 *
 * @param {HTMLElement} indicator - The indicator element to update
 * @param {string} mode - Connection mode from CONNECTION_MODES
 */
export function updateConnectionModeIndicator(indicator, mode) {
  if (!indicator) return;

  const config = MODE_CONFIG[mode];
  if (!config) return;

  const baseClasses = 'fixed bottom-0 left-0 right-0 py-3 text-white text-center text-sm';
  indicator.className = `${baseClasses} ${config.bgClass}`;
  indicator.innerHTML = `
      <span class="material-symbols-outlined text-sm align-middle mr-1 ${config.iconClass}">${config.icon}</span>
      ${t(config.i18nKey)}
    `;
}
