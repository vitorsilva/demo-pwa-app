/**
 * Network status utilities for Saberloop
 * Detects and monitors online/offline state
 */

import { logger } from './logger.js';

/**
 * Check if browser is currently online
 * @returns {boolean} True if online, false if offline
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Listen for when browser goes online
 * @param {EventListener} callback - Function to call when online
 */
export function onOnline(callback) {
  window.addEventListener('online', callback);
}

/**
 * Listen for when browser goes offline
 * @param {EventListener} callback - Function to call when offline
 */
export function onOffline(callback) {
  window.addEventListener('offline', callback);
}

/**
 * Update the network status indicator dot
 * Call this whenever network status changes
 */
export function updateNetworkIndicator() {
  const indicator = document.getElementById('networkStatusDot');

  if (!indicator) return; // Indicator not on this view

  if (isOnline()) {
    // Online: green dot
    indicator.className =
      'absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background-light dark:border-background-dark';
  } else {
    // Offline: orange dot
    indicator.className =
      'absolute -top-0.5 -right-0.5 w-3 h-3 bg-orange-500 rounded-full border-2 border-background-light  dark:border-background-dark';
  }
}

/**
 * Update the offline UI elements (banner and button)
 * Call this whenever network status changes
 */
export function updateOfflineUI() {
  const banner = document.getElementById('offlineBanner');
  const button = /** @type {HTMLButtonElement} */ (document.getElementById('startQuizBtn'));

  if (isOnline()) {
    // Online: hide banner, enable button
    if (banner) banner.classList.add('hidden');
    if (button) button.disabled = false;
  } else {
    // Offline: show banner, disable button
    if (banner) banner.classList.remove('hidden');
    if (button) button.disabled = true;
  }
}

/**
 * Initialize network status monitoring
 * Call this once when app starts
 */
export function initNetworkMonitoring() {
  // Update UI on initial load
  updateNetworkIndicator();
  updateOfflineUI();

  // Listen for network changes
  onOnline(() => {
    updateNetworkIndicator();
    updateOfflineUI();
  });
  onOffline(() => {
    updateNetworkIndicator();
    updateOfflineUI();
  });

  logger.info('Network monitoring initialized');
}
