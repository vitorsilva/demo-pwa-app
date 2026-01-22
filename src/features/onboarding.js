import { getSetting, saveSetting } from '../core/db.js';

const WELCOME_VERSION_KEY = 'welcomeScreenVersion';

// Manually bump this when you want to re-show the welcome screen
// (e.g., to announce new features)
const WELCOME_SCREEN_VERSION = '1.0';

/**
 * Check if we should show the welcome screen
 * Returns true if user hasn't seen current version
 */
export async function shouldShowWelcome() {
  const seenVersion = await getSetting(WELCOME_VERSION_KEY);
  return !seenVersion || seenVersion < WELCOME_SCREEN_VERSION;
}

/**
 * Mark the welcome screen as seen (current version)
 */
export async function markWelcomeSeen() {
  await saveSetting(WELCOME_VERSION_KEY, WELCOME_SCREEN_VERSION);
}
