/**
 * Mode Toggle Component
 * Segmented button to switch between Learning and Party modes.
 */

import { t } from '../core/i18n.js';
import { getCurrentMode, setMode } from '../services/theme-manager.js';

/**
 * Creates a mode toggle element for the header.
 * @returns {HTMLElement} The toggle element
 */
export function createModeToggle() {
  const toggle = document.createElement('div');
  toggle.className = 'mode-toggle flex rounded-lg bg-gray-200 dark:bg-gray-700 p-0.5';
  toggle.setAttribute('role', 'tablist');
  toggle.setAttribute('aria-label', 'App mode');

  const currentMode = getCurrentMode();

  toggle.innerHTML = `
    <button
      class="mode-btn mode-btn-learn flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
        currentMode === 'learning'
          ? 'bg-white dark:bg-gray-600 text-primary shadow-sm'
          : 'text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark'
      }"
      data-mode="learning"
      role="tab"
      aria-selected="${currentMode === 'learning'}"
      aria-label="${t('mode.switchToLearn')}"
    >
      <span class="text-sm">📚</span>
      <span>${t('mode.learn')}</span>
    </button>
    <button
      class="mode-btn mode-btn-party flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
        currentMode === 'party'
          ? 'bg-white dark:bg-gray-600 text-primary shadow-sm'
          : 'text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark'
      }"
      data-mode="party"
      role="tab"
      aria-selected="${currentMode === 'party'}"
      aria-label="${t('mode.switchToParty')}"
    >
      <span class="text-sm">🎉</span>
      <span>${t('mode.party')}</span>
    </button>
  `;

  // Add click handler
  toggle.addEventListener('click', (e) => {
    const btn = /** @type {HTMLElement | null} */ (
      /** @type {HTMLElement} */ (e.target).closest('[data-mode]')
    );
    if (btn) {
      const mode = /** @type {'learning' | 'party'} */ (btn.dataset.mode);
      setMode(mode);
      updateToggleUI(toggle, mode);
    }
  });

  return toggle;
}

/**
 * Updates the toggle UI to reflect the current mode.
 * @param {HTMLElement} toggle - The toggle element
 * @param {'learning' | 'party'} mode - The current mode
 */
function updateToggleUI(toggle, mode) {
  const buttons = toggle.querySelectorAll('[data-mode]');

  buttons.forEach((btn) => {
    const btnMode = /** @type {HTMLElement} */ (btn).dataset.mode;
    const isActive = btnMode === mode;

    // Update classes
    btn.classList.toggle('bg-white', isActive);
    btn.classList.toggle('dark:bg-gray-600', isActive);
    btn.classList.toggle('text-primary', isActive);
    btn.classList.toggle('shadow-sm', isActive);
    btn.classList.toggle('text-subtext-light', !isActive);
    btn.classList.toggle('dark:text-subtext-dark', !isActive);
    btn.classList.toggle('hover:text-text-light', !isActive);
    btn.classList.toggle('dark:hover:text-text-dark', !isActive);

    // Update ARIA
    btn.setAttribute('aria-selected', String(isActive));
  });
}
