/**
 * Share Modal Component
 * Bottom sheet modal for sharing quiz results
 */

import { logger } from '../utils/logger.js';
import { t } from '../core/i18n.js';
import { telemetry } from '../utils/telemetry.js';
import escapeHtml from 'escape-html';
import { generateShareImage } from '../utils/share-image.js';
import {
  canShare,
  shareWithImage,
  copyToClipboard,
  generateShareUrl,
  generateShareText,
  shareToTwitter,
  shareToFacebook,
} from '../utils/share.js';

/**
 * Show a bottom sheet modal with share options
 * @param {Object} options - Modal options
 * @param {string} options.topic - Quiz topic
 * @param {number} options.score - Number of correct answers
 * @param {number} options.total - Total number of questions
 * @param {number} options.percentage - Score percentage
 * @returns {Promise<void>} Resolves when modal is closed
 */
export function showShareModal({ topic, score, total, percentage }) {
  return new Promise((resolve) => {
    telemetry.track('share_modal_opened', { topic, score, total, percentage });

    const shareUrl = generateShareUrl(topic);
    const shareText = generateShareText({ topic, score, total, percentage });

    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'shareModal';
    backdrop.className = 'fixed inset-0 bg-black/50 z-50 flex items-end justify-center';

    backdrop.innerHTML = `
      <div class="bg-card-light dark:bg-card-dark rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto transform transition-transform duration-300 translate-y-full" id="shareSheet">
        <!-- Drag Handle -->
        <div class="flex justify-center pt-3 pb-2">
          <div class="w-12 h-1 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
        </div>

        <!-- Title -->
        <h2 class="text-text-light dark:text-text-dark text-xl font-bold text-center px-6 mb-4">${t('share.title')}</h2>

        <!-- Preview Card -->
        <div class="px-4 mb-6">
          <div id="sharePreviewContainer" class="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 flex items-center justify-center min-h-[200px]">
            <div class="text-center text-white">
              <span class="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
              <p class="text-sm mt-2 text-gray-400">${t('share.preview')}</p>
            </div>
          </div>
        </div>

        <!-- Quick Share Buttons -->
        <div class="px-4 mb-6">
          <p class="text-subtext-light dark:text-subtext-dark text-sm mb-3">${t('share.shareVia')}</p>
          <div class="flex gap-3">
            <!-- Twitter/X -->
            <button id="shareTwitterBtn" class="flex-1 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span class="hidden sm:inline">X</span>
            </button>
            <!-- Facebook -->
            <button id="shareFacebookBtn" class="flex-1 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span class="hidden sm:inline">Facebook</span>
            </button>
            <!-- Copy Link -->
            <button id="copyLinkBtn" class="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-text-light dark:text-text-dark rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors">
              <span class="material-symbols-outlined text-xl">link</span>
              <span class="hidden sm:inline">${t('share.copyLink')}</span>
            </button>
          </div>
        </div>

        <!-- More Options (Native Share) -->
        ${
          canShare()
            ? `
        <div class="px-4 mb-6">
          <button id="moreOptionsBtn" data-testid="share-more-options" class="w-full bg-primary/10 hover:bg-primary/20 text-primary rounded-xl py-4 font-semibold flex items-center justify-center gap-2 transition-colors">
            <span class="material-symbols-outlined">share</span>
            ${t('share.moreOptions')}
          </button>
        </div>
        `
            : ''
        }

        <!-- Close Button -->
        <div class="px-4 pb-8">
          <button id="closeShareBtn" data-testid="close-share-btn" class="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-text-light dark:text-text-dark rounded-xl py-4 font-semibold transition-colors">
            ${t('common.close')}
          </button>
        </div>

        <!-- Toast notification (hidden initially) -->
        <div id="shareToast" class="fixed bottom-24 left-1/2 -translate-x-1/2 bg-success text-white px-4 py-2 rounded-full text-sm font-medium opacity-0 transition-opacity duration-300 pointer-events-none">
          ${t('share.copied')}
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    // Animate sheet in
    const sheet = backdrop.querySelector('#shareSheet');
    requestAnimationFrame(() => {
      sheet.classList.remove('translate-y-full');
      sheet.classList.add('translate-y-0');
    });

    // Generate preview image
    generateShareImage({ topic, score, total, percentage })
      .then((blob) => {
        const previewContainer = backdrop.querySelector('#sharePreviewContainer');
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        img.alt = 'Share preview';
        img.className = 'rounded-lg max-w-full';
        previewContainer.innerHTML = '';
        previewContainer.appendChild(img);

        // Store blob for native share
        backdrop.dataset.imageBlob = 'ready';
        /** @type {any} */ (sheet)._imageBlob = blob;
      })
      .catch((error) => {
        logger.error('Failed to generate share image', { error: error.message });
        const previewContainer = backdrop.querySelector('#sharePreviewContainer');
        previewContainer.innerHTML = `
          <div class="text-center text-white">
            <span class="text-4xl mb-2">🏆</span>
            <p class="font-bold">${escapeHtml(topic)} Quiz Master!</p>
            <p class="text-2xl font-bold text-[#e94560]">${score}/${total}</p>
            <p class="text-gray-400">${percentage}%</p>
          </div>
        `;
      });

    // Function to show toast
    const showToast = (message) => {
      const toast = backdrop.querySelector('#shareToast');
      toast.textContent = message;
      toast.classList.remove('opacity-0');
      toast.classList.add('opacity-100');
      setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0');
      }, 2000);
    };

    // Function to close modal
    const closeModal = () => {
      sheet.classList.remove('translate-y-0');
      sheet.classList.add('translate-y-full');
      setTimeout(() => {
        backdrop.remove();
        resolve();
      }, 300);
    };

    // Handle Twitter share
    const twitterBtn = backdrop.querySelector('#shareTwitterBtn');
    twitterBtn.addEventListener('click', () => {
      shareToTwitter(shareText, shareUrl);
    });

    // Handle Facebook share
    const facebookBtn = backdrop.querySelector('#shareFacebookBtn');
    facebookBtn.addEventListener('click', () => {
      shareToFacebook(shareUrl, shareText);
    });

    // Handle Copy Link
    const copyLinkBtn = backdrop.querySelector('#copyLinkBtn');
    copyLinkBtn.addEventListener('click', async () => {
      const textToCopy = `${shareText}\n\n${shareUrl}`;
      const success = await copyToClipboard(textToCopy);
      if (success) {
        showToast(t('share.copied'));
      }
    });

    // Handle More Options (native share)
    const moreOptionsBtn = backdrop.querySelector('#moreOptionsBtn');
    if (moreOptionsBtn) {
      moreOptionsBtn.addEventListener('click', async () => {
        const imageBlob = /** @type {any} */ (sheet)._imageBlob;
        if (imageBlob) {
          await shareWithImage({
            title: t('share.quizMaster', { topic }),
            text: shareText,
            url: shareUrl,
            imageBlob,
          });
        } else {
          // Fallback to text share if image not ready
          const { shareContent } = await import('../utils/share.js');
          await shareContent({
            title: t('share.quizMaster', { topic }),
            text: shareText,
            url: shareUrl,
          });
        }
      });
    }

    // Handle Close button
    const closeBtn = backdrop.querySelector('#closeShareBtn');
    closeBtn.addEventListener('click', closeModal);

    // Handle backdrop click (close modal)
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal();
      }
    });

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}
