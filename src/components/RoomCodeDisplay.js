/**
 * Room Code Display Component
 *
 * Large room code display with copy and share functionality.
 */

import { t } from '../core/i18n.js';
import { copyToClipboard, shareContent } from '../utils/share.js';

/**
 * Format room code with dash for display (ABC-DEF).
 * @param {string} code - The 6-character room code
 * @returns {string} Formatted code with dash
 */
export function formatRoomCode(code) {
  if (!code) return '';
  // Remove existing dashes and format
  const clean = code.replace(/-/g, '');
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
}

/**
 * Creates a room code display element.
 * @param {string} roomCode - The 6-character room code
 * @param {Object} [options] - Display options
 * @param {boolean} [options.showCopy=true] - Show copy button
 * @param {boolean} [options.showShare=false] - Show share button
 * @param {boolean} [options.showLabel=true] - Show "Room Code" label
 * @param {Function} [options.onShare] - Callback for share button click
 * @returns {HTMLElement}
 */
export function createRoomCodeDisplay(roomCode, options = {}) {
  const { showCopy = true, showShare = false, showLabel = true, onShare } = options;

  const container = document.createElement('div');
  container.className = 'room-code-display flex flex-col items-center gap-4';

  // Room code display
  const codeContainer = document.createElement('div');
  codeContainer.className = 'bg-card-light dark:bg-card-dark rounded-2xl px-8 py-6 shadow-lg';

  if (showLabel) {
    const codeLabel = document.createElement('p');
    codeLabel.className = 'text-subtext-light dark:text-subtext-dark text-sm text-center mb-2';
    codeLabel.textContent = t('party.code');
    codeContainer.appendChild(codeLabel);
  }

  const codeDisplay = document.createElement('p');
  codeDisplay.className =
    'text-text-light dark:text-text-dark text-4xl font-mono font-bold tracking-[0.3em] text-center select-all';
  codeDisplay.textContent = formatRoomCode(roomCode);
  codeDisplay.setAttribute('data-testid', 'room-code');

  codeContainer.appendChild(codeDisplay);
  container.appendChild(codeContainer);

  // Action buttons
  if (showCopy || showShare) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex gap-3';

    if (showCopy) {
      const copyBtn = document.createElement('button');
      copyBtn.className =
        'flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-text-light dark:text-text-dark hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors';
      copyBtn.innerHTML = `
        <span class="material-symbols-outlined text-lg">content_copy</span>
        <span class="text-sm font-medium">${t('party.copyCode')}</span>
      `;
      copyBtn.setAttribute('data-testid', 'copy-code-btn');

      copyBtn.addEventListener('click', async () => {
        const success = await copyToClipboard(roomCode);
        if (success) {
          // Show feedback
          const originalHTML = copyBtn.innerHTML;
          copyBtn.innerHTML = `
            <span class="material-symbols-outlined text-lg text-green-500">check</span>
            <span class="text-sm font-medium text-green-500">${t('party.codeCopied')}</span>
          `;
          setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
          }, 2000);
        }
      });

      buttonContainer.appendChild(copyBtn);
    }

    if (showShare) {
      const shareBtn = document.createElement('button');
      shareBtn.className =
        'flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors';
      shareBtn.innerHTML = `
        <span class="material-symbols-outlined text-lg">share</span>
        <span class="text-sm font-medium">${t('party.shareNative')}</span>
      `;
      shareBtn.setAttribute('data-testid', 'share-code-btn');

      shareBtn.addEventListener('click', () => {
        if (onShare) {
          onShare(roomCode);
        } else {
          // Use native share if no callback provided
          shareContent({
            title: t('party.code'),
            text: `${t('party.shareCode')}: ${roomCode}`,
          });
        }
      });

      buttonContainer.appendChild(shareBtn);
    }

    container.appendChild(buttonContainer);
  }

  return container;
}
