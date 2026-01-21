/**
 * Share Quiz Modal Component
 * Bottom sheet modal for sharing quizzes via URL
 */

import { t } from '../core/i18n.js';
import { telemetry } from '../utils/telemetry.js';
import { logger } from '../utils/logger.js';
import {
  generateShareUrl,
  copyShareUrl,
  nativeShare,
  isNativeShareSupported,
} from '../services/quiz-share.js';
import QRCode from 'qrcode';

/**
 * Generate a QR code data URL from a URL string
 * @param {string} url - The URL to encode
 * @returns {Promise<string|null>} Data URL or null on error
 */
async function generateQRCode(url) {
  try {
    return await QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (err) {
    logger.error('Failed to generate QR code', err);
    return null;
  }
}

/**
 * Show a bottom sheet modal for sharing a quiz
 * @param {Object} quiz - The quiz to share
 * @param {string} quiz.topic - Quiz topic
 * @param {string} [quiz.gradeLevel] - Grade level
 * @param {Array} quiz.questions - Questions array
 * @param {string} [creatorName] - Optional creator name to include
 * @returns {Promise<void>} Resolves when modal is closed
 */
export async function showShareQuizModal(quiz, creatorName = null) {
  telemetry.track('event', {
    name: 'quiz_share_modal_opened',
    topic: quiz.topic,
    questionCount: quiz.questions.length
  });

  // Generate share URL
  const shareResult = generateShareUrl(quiz, creatorName);

  // Generate QR code only if URL is short enough to be scannable
  const MAX_QR_URL_LENGTH = 300;
  const qrCodeDataUrl = shareResult.success && shareResult.url.length <= MAX_QR_URL_LENGTH
    ? await generateQRCode(shareResult.url)
    : null;

  return new Promise((resolve) => {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'shareQuizModal';
    backdrop.className = 'fixed inset-0 bg-black/50 z-50 flex items-end justify-center';

    if (!shareResult.success) {
      // Show error state
      backdrop.innerHTML = createErrorContent(quiz);
    } else {
      // Show share options
      backdrop.innerHTML = createShareContent(quiz, shareResult.url, qrCodeDataUrl);
    }

    document.body.appendChild(backdrop);

    // Animate sheet in
    const sheet = backdrop.querySelector('#shareQuizSheet');
    requestAnimationFrame(() => {
      sheet.classList.remove('translate-y-full');
      sheet.classList.add('translate-y-0');
    });

    // Function to show toast
    const showToast = (message) => {
      const toast = backdrop.querySelector('#shareQuizToast');
      if (toast) {
        toast.textContent = message;
        toast.classList.remove('opacity-0');
        toast.classList.add('opacity-100');
        setTimeout(() => {
          toast.classList.remove('opacity-100');
          toast.classList.add('opacity-0');
        }, 2000);
      }
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

    // Handle Copy Link
    const copyLinkBtn = backdrop.querySelector('#copyQuizLinkBtn');
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', async () => {
        const success = await copyShareUrl(shareResult.url);
        if (success) {
          showToast(t('share.copied'));
          // Update button to show success
          copyLinkBtn.innerHTML = `
            <span class="material-symbols-outlined text-xl text-green-500">check_circle</span>
            <span>${t('share.copied')}</span>
          `;
          setTimeout(() => {
            copyLinkBtn.innerHTML = `
              <span class="material-symbols-outlined text-xl">content_copy</span>
              <span>${t('share.copyLink')}</span>
            `;
          }, 2000);
        }
      });
    }

    // Handle Native Share
    const nativeShareBtn = backdrop.querySelector('#nativeShareQuizBtn');
    if (nativeShareBtn) {
      nativeShareBtn.addEventListener('click', async () => {
        const result = await nativeShare(quiz, shareResult.url);
        if (result.success) {
          telemetry.track('event', { name: 'quiz_share_completed', method: 'native' });
          closeModal();
        }
        // If cancelled or failed, just stay open
      });
    }

    // Handle Close button
    const closeBtn = backdrop.querySelector('#closeShareQuizBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

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

/**
 * Create the share content HTML
 */
function createShareContent(quiz, url, qrCodeDataUrl) {
  const questionCount = quiz.questions.length;
  const truncatedUrl = url.length > 50 ? url.substring(0, 50) + '...' : url;

  return `
    <div class="bg-card-light dark:bg-card-dark rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto transform transition-transform duration-300 translate-y-full" id="shareQuizSheet">
      <!-- Drag Handle -->
      <div class="flex justify-center pt-3 pb-2">
        <div class="w-12 h-1 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
      </div>

      <!-- Title -->
      <h2 class="text-text-light dark:text-text-dark text-xl font-bold text-center px-6 mb-4">
        ${t('shareQuiz.title')}
      </h2>

      <!-- Quiz Info Card -->
      <div class="px-4 mb-6">
        <div class="bg-primary/10 rounded-xl p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span class="material-symbols-outlined text-2xl text-primary">quiz</span>
            </div>
            <div class="flex-1">
              <h3 class="text-text-light dark:text-text-dark font-bold text-lg">"${quiz.topic}"</h3>
              <p class="text-subtext-light dark:text-subtext-dark text-sm">
                ${questionCount} ${t('shareQuiz.questions')} ${quiz.gradeLevel ? `• ${quiz.gradeLevel}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Share Link -->
      <div class="px-4 mb-4">
        <p class="text-subtext-light dark:text-subtext-dark text-sm mb-2">${t('shareQuiz.linkLabel')}</p>
        <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex items-center gap-2">
          <span class="material-symbols-outlined text-subtext-light dark:text-subtext-dark">link</span>
          <span class="text-text-light dark:text-text-dark text-sm flex-1 truncate">${truncatedUrl}</span>
        </div>
      </div>

        <!-- QR Code -->
        ${qrCodeDataUrl ? `
        <div class="px-4 mb-4 flex justify-center">
          <div class="bg-white p-3 rounded-xl">
            <img src="${qrCodeDataUrl}" alt="QR Code" class="w-56 h-56" />
          </div>
        </div>
        ` : ''}      

      <!-- Copy Button -->
      <div class="px-4 mb-4">
        <button id="copyQuizLinkBtn" class="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-4 font-semibold flex items-center justify-center gap-2 transition-colors">
          <span class="material-symbols-outlined text-xl">content_copy</span>
          <span>${t('share.copyLink')}</span>
        </button>
      </div>

      <!-- Native Share (if supported) -->
      ${isNativeShareSupported() ? `
      <div class="px-4 mb-4">
        <button id="nativeShareQuizBtn" class="w-full bg-primary/10 hover:bg-primary/20 text-primary rounded-xl py-4 font-semibold flex items-center justify-center gap-2 transition-colors">
          <span class="material-symbols-outlined">share</span>
          ${t('shareQuiz.shareVia')}
        </button>
      </div>
      ` : ''}

      <!-- Note about explanations -->
      <div class="px-4 mb-4">
        <p class="text-subtext-light dark:text-subtext-dark text-xs text-center">
          <span class="material-symbols-outlined text-sm align-middle">info</span>
          ${t('shareQuiz.noteNoExplanations')}
        </p>
      </div>

      <!-- Close Button -->
      <div class="px-4 pb-8">
        <button id="closeShareQuizBtn" class="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-text-light dark:text-text-dark rounded-xl py-4 font-semibold transition-colors">
          ${t('common.close')}
        </button>
      </div>

      <!-- Toast notification -->
      <div id="shareQuizToast" class="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium opacity-0 transition-opacity duration-300 pointer-events-none">
        ${t('share.copied')}
      </div>
    </div>
  `;
}

/**
 * Create error content when quiz is too large
 */
function createErrorContent(quiz) {
  return `
    <div class="bg-card-light dark:bg-card-dark rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto transform transition-transform duration-300 translate-y-full" id="shareQuizSheet">
      <!-- Drag Handle -->
      <div class="flex justify-center pt-3 pb-2">
        <div class="w-12 h-1 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
      </div>

      <!-- Error Icon -->
      <div class="flex justify-center mb-4">
        <div class="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
          <span class="material-symbols-outlined text-3xl text-orange-500">warning</span>
        </div>
      </div>

      <!-- Title -->
      <h2 class="text-text-light dark:text-text-dark text-xl font-bold text-center px-6 mb-2">
        ${t('shareQuiz.error.tooLargeTitle')}
      </h2>

      <!-- Description -->
      <p class="text-subtext-light dark:text-subtext-dark text-center px-6 mb-6">
        ${t('shareQuiz.error.tooLargeDescription')}
      </p>

      <!-- Stats -->
      <div class="px-6 mb-6">
        <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-2">
          <div class="flex justify-between">
            <span class="text-subtext-light dark:text-subtext-dark">${t('shareQuiz.error.maximum')}</span>
            <span class="text-text-light dark:text-text-dark font-medium">~10 ${t('shareQuiz.questions')}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-subtext-light dark:text-subtext-dark">${t('shareQuiz.error.thisQuiz')}</span>
            <span class="text-orange-500 font-medium">${quiz.questions.length} ${t('shareQuiz.questions')}</span>
          </div>
        </div>
      </div>

      <!-- Suggestions -->
      <div class="px-6 mb-6">
        <p class="text-subtext-light dark:text-subtext-dark text-sm mb-2">${t('shareQuiz.error.suggestions')}</p>
        <ul class="text-text-light dark:text-text-dark text-sm space-y-1">
          <li class="flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">check</span>
            ${t('shareQuiz.error.suggestion1')}
          </li>
          <li class="flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">check</span>
            ${t('shareQuiz.error.suggestion2')}
          </li>
        </ul>
      </div>

      <!-- Close Button -->
      <div class="px-4 pb-8">
        <button id="closeShareQuizBtn" class="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-text-light dark:text-text-dark rounded-xl py-4 font-semibold transition-colors">
          ${t('common.close')}
        </button>
      </div>
    </div>
  `;
}
