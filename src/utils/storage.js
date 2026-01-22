/**
 * Storage utility functions for calculating and formatting storage usage.
 * @module utils/storage
 */

import { getAllSessions, getAllTopics, getSetting } from '../core/db.js';

/**
 * Format bytes into human-readable storage size.
 * @param {number} bytes - The number of bytes to format
 * @returns {string} Formatted string (e.g., "1.5 KB", "2.3 MB")
 */
export function formatStorageSize(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 0 || !Number.isFinite(bytes)) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const size = bytes / Math.pow(k, i);

  // Use 1 decimal place for KB and above, 0 for bytes
  const decimals = i === 0 ? 0 : 1;
  return `${size.toFixed(decimals)} ${units[i]}`;
}

/**
 * Calculate the size in bytes of a JavaScript value by serializing to JSON.
 * @param {*} value - The value to measure
 * @returns {number} Size in bytes
 */
function getJsonSize(value) {
  if (value === null || value === undefined) return 0;
  try {
    return new Blob([JSON.stringify(value)]).size;
  } catch {
    return 0;
  }
}

/**
 * Get storage breakdown by category.
 * @returns {Promise<{settings: string, quizzes: string, total: string, settingsBytes: number, quizzesBytes: number, totalBytes: number}>} Formatted storage sizes and raw bytes
 */
export async function getStorageBreakdown() {
  // Calculate settings size (IndexedDB settings + localStorage)
  let settingsBytes = 0;

  // IndexedDB settings
  const apiKey = await getSetting('openrouter_api_key');
  const welcomeVersion = await getSetting('welcome_version');
  settingsBytes += getJsonSize(apiKey);
  settingsBytes += getJsonSize(welcomeVersion);

  // localStorage settings
  const localStorageKeys = [
    'quizmaster_settings',
    'openrouter_models_cache',
    'i18nextLng',
    'saberloop_telemetry_queue',
  ];

  for (const key of localStorageKeys) {
    const value = localStorage.getItem(key);
    if (value) {
      settingsBytes += new Blob([value]).size;
    }
  }

  // Calculate quizzes size (sessions + topics)
  let quizzesBytes = 0;

  const sessions = await getAllSessions();
  const topics = await getAllTopics();

  quizzesBytes += getJsonSize(sessions);
  quizzesBytes += getJsonSize(topics);

  const totalBytes = settingsBytes + quizzesBytes;

  return {
    settings: formatStorageSize(settingsBytes),
    quizzes: formatStorageSize(quizzesBytes),
    total: formatStorageSize(totalBytes),
    settingsBytes,
    quizzesBytes,
    totalBytes,
  };
}
