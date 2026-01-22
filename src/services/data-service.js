/**
 * Data service for managing user data lifecycle.
 * Orchestrates deletion across all storage types.
 * @module services/data-service
 */

import { clearAllUserData } from '../core/db.js';
import { loadSamplesIfNeeded } from '../features/sample-loader.js';
import state from '../core/state.js';
import { logger } from '../utils/logger.js';

/**
 * localStorage keys used by the application.
 * These will be cleared during data deletion.
 */
const LOCAL_STORAGE_KEYS = [
  'quizmaster_settings',
  'openrouter_models_cache',
  'i18nextLng',
  'saberloop_telemetry_queue',
];

/**
 * sessionStorage keys used by the application.
 * These will be cleared during data deletion.
 */
const SESSION_STORAGE_KEYS = ['openrouter_code_verifier'];

/**
 * Delete all user data from all storage locations.
 * Order: IndexedDB (largest) → localStorage → sessionStorage → in-memory state
 *
 * After deletion:
 * - Sample quizzes are reloaded
 * - App remains functional
 *
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails
 */
export async function deleteAllUserData() {
  logger.info('Starting data deletion...');

  try {
    // 1. Clear IndexedDB (largest, most important)
    logger.debug('Clearing IndexedDB...');
    await clearAllUserData();

    // 2. Clear localStorage
    logger.debug('Clearing localStorage...');
    for (const key of LOCAL_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }

    // 3. Clear sessionStorage
    logger.debug('Clearing sessionStorage...');
    for (const key of SESSION_STORAGE_KEYS) {
      sessionStorage.removeItem(key);
    }

    // 4. Reset in-memory state
    logger.debug('Resetting in-memory state...');
    state.clear();

    // 5. Reload sample quizzes so app stays functional
    logger.debug('Reloading sample quizzes...');
    await loadSamplesIfNeeded();

    logger.info('Data deletion complete');
  } catch (error) {
    logger.error('Data deletion failed', { error: error.message });
    throw error;
  }
}
