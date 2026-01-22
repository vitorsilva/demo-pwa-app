/**
 * API Keys Migration
 * Sets up initial key status for existing OpenRouter keys
 */

import { getSetting, saveSetting, getOpenRouterKey, storeOpenRouterKey } from '../core/db.js';
import { getKeyStatus, KEY_STATUS } from './provider-settings-service.js';
import { logger } from '../utils/logger.js';

const MIGRATION_FLAG = 'llm_keys_migrated_v1';

/**
 * Run migration if needed
 * Sets initial key status for existing OpenRouter keys
 * Migrates legacy localStorage keys to IndexedDB
 */
export async function migrateApiKeys() {
  const migrated = await getSetting(MIGRATION_FLAG);
  if (migrated) {
    return; // Already migrated
  }

  logger.info('Migrating API keys...');

  try {
    // Check for existing OpenRouter key (uses existing db.js mechanism)
    const existingKey = await getOpenRouterKey();

    if (existingKey) {
      // Check if status already set
      const status = await getKeyStatus('openrouter');

      if (status === KEY_STATUS.NOT_SET) {
        // Set initial status - mark as valid since it was working
        // (User can revalidate if needed)
        await saveSetting('llm_key_status_openrouter', KEY_STATUS.VALID);
        logger.info('OpenRouter key status initialized');
      }
    }

    // Check localStorage for legacy keys (from very old versions)
    if (typeof localStorage !== 'undefined') {
      const legacyKey = localStorage.getItem('openrouter_api_key');
      if (legacyKey && !existingKey) {
        // Import legacy key to IndexedDB
        await storeOpenRouterKey(legacyKey);
        await saveSetting('llm_key_status_openrouter', KEY_STATUS.VALID);
        localStorage.removeItem('openrouter_api_key');
        logger.info('Legacy OpenRouter key migrated from localStorage');
      }
    }

    // Mark migration complete
    await saveSetting(MIGRATION_FLAG, true);

    logger.info('API key migration complete');
  } catch (error) {
    logger.error('API key migration failed:', error);
    // Don't fail app startup - user can re-add key manually
  }
}
