/**
 * Quiz Share Service
 * Handles generating shareable URLs and share actions.
 */

import { serializeQuiz, canShareQuiz } from './quiz-serializer.js';
import { telemetry } from '../utils/telemetry.js';

// Base URL for shared quizzes
const SHARE_BASE_URL = `${window.location.origin}${window.location.pathname}#/quiz/`;

/**
 * Generates a shareable URL for a quiz.
 *
 * @param {Object} quiz - The quiz to share
 * @param {string} [creatorName] - Optional name to include as creator
 * @returns {{success: boolean, url?: string, error?: string, length?: number}}
 */
export function generateShareUrl(quiz, creatorName = null) {
  telemetry.track('event', { name: 'quiz_share_initiated', topic: quiz.topic });

  // Add creator if provided
  const quizToShare = creatorName ? { ...quiz, creator: creatorName } : quiz;

  const result = serializeQuiz(quizToShare);

  if (!result.success) {
    telemetry.track('event', {
      name: 'quiz_share_failed_too_large',
      length: result.length,
      questionCount: quiz.questions?.length,
    });
    return result;
  }

  const url = `${SHARE_BASE_URL}${result.data}`;

  return {
    success: true,
    url,
    length: url.length,
  };
}

/**
 * Copies share URL to clipboard.
 *
 * @param {string} url - The URL to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyShareUrl(url) {
  try {
    await navigator.clipboard.writeText(url);
    telemetry.track('event', { name: 'quiz_share_copy_success' });
    return true;
  } catch (err) {
    // Fallback for older browsers or restricted contexts
    const success = fallbackCopyToClipboard(url);
    if (success) {
      telemetry.track('event', { name: 'quiz_share_copy_success' });
    } else {
      telemetry.track('event', { name: 'quiz_share_copy_failed', error: err.message });
    }
    return success;
  }
}

/**
 * Fallback copy method using temporary textarea.
 * @param {string} text - Text to copy
 * @returns {boolean} Success status
 */
function fallbackCopyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    document.body.removeChild(textarea);
    return false;
  }
}

/**
 * Triggers native share dialog (Web Share API).
 *
 * @param {Object} quiz - Quiz being shared
 * @param {string} url - Share URL
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function nativeShare(quiz, url) {
  const shareData = {
    title: `Play "${quiz.topic}" on Saberloop!`,
    text: `I challenge you to this ${quiz.questions.length}-question quiz!`,
    url: url,
  };

  // Check if Web Share API is supported
  if (!navigator.share) {
    telemetry.track('event', { name: 'quiz_share_native_unsupported' });
    return { success: false, error: 'Native share not supported' };
  }

  // Check if we can share this data
  if (navigator.canShare && !navigator.canShare(shareData)) {
    telemetry.track('event', { name: 'quiz_share_native_unsupported' });
    return { success: false, error: 'Cannot share this content' };
  }

  try {
    await navigator.share(shareData);
    telemetry.track('event', { name: 'quiz_share_native_success' });
    return { success: true };
  } catch (err) {
    // AbortError means user cancelled - not an error
    if (err.name === 'AbortError') {
      return { success: false, error: 'cancelled' };
    }
    telemetry.track('event', { name: 'quiz_share_native_failed', error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * Checks if native sharing is available.
 * @returns {boolean}
 */
export function isNativeShareSupported() {
  return typeof navigator.share === 'function';
}

/**
 * Checks if a quiz can be shared (size validation).
 * @param {Object} quiz - Quiz to check
 * @returns {{canShare: boolean, estimatedLength: number, maxLength: number}}
 */
export { canShareQuiz };
