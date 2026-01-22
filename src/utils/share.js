/**
 * Share utilities for Saberloop
 * Provides Web Share API with clipboard fallback
 */

import { logger } from './logger.js';
import { telemetry } from './telemetry.js';

/**
 * Check if the Web Share API is available
 * @returns {boolean} True if Web Share API is supported
 */
export function canShare() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Check if the Web Share API supports sharing files
 * @returns {boolean} True if file sharing is supported
 */
export function canShareFiles() {
  return canShare() && typeof navigator.canShare === 'function';
}

/**
 * Share content using the Web Share API
 * @param {Object} options - Share options
 * @param {string} [options.title] - Share title
 * @param {string} [options.text] - Share text/message
 * @param {string} [options.url] - Share URL
 * @returns {Promise<boolean>} True if share was successful, false if cancelled/failed
 */
export async function shareContent({ title, text, url }) {
  if (!canShare()) {
    logger.debug('Web Share API not available');
    return false;
  }

  try {
    await navigator.share({ title, text, url });
    logger.debug('Content shared successfully');
    telemetry.track('share_completed', { method: 'native' });
    return true;
  } catch (error) {
    // User cancelled or share failed
    if (error.name === 'AbortError') {
      logger.debug('Share cancelled by user');
      telemetry.track('share_cancelled', { method: 'native' });
    } else {
      logger.error('Share failed', { error: error.message });
      telemetry.track('share_failed', { method: 'native', error: error.message });
    }
    return false;
  }
}

/**
 * Share content with an image file using the Web Share API
 * @param {Object} options - Share options
 * @param {string} [options.title] - Share title
 * @param {string} [options.text] - Share text/message
 * @param {string} [options.url] - Share URL
 * @param {Blob} options.imageBlob - Image blob to share
 * @param {string} [options.fileName] - Image file name (default: 'saberloop-score.png')
 * @returns {Promise<boolean>} True if share was successful, false if cancelled/failed
 */
export async function shareWithImage({
  title,
  text,
  url,
  imageBlob,
  fileName = 'saberloop-score.png',
}) {
  if (!canShareFiles()) {
    logger.debug('File sharing not supported, falling back to text share');
    return shareContent({ title, text, url });
  }

  const file = new File([imageBlob], fileName, { type: imageBlob.type });
  const shareData = { title, text, url, files: [file] };

  // Check if this specific share is supported
  if (!navigator.canShare(shareData)) {
    logger.debug('Cannot share this content with files, falling back to text');
    return shareContent({ title, text, url });
  }

  try {
    await navigator.share(shareData);
    logger.debug('Content with image shared successfully');
    telemetry.track('share_completed', { method: 'native_with_image' });
    return true;
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.debug('Share cancelled by user');
      telemetry.track('share_cancelled', { method: 'native_with_image' });
    } else {
      logger.error('Share with image failed', { error: error.message });
      telemetry.track('share_failed', { method: 'native_with_image', error: error.message });
    }
    return false;
  }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if copy was successful
 */
export async function copyToClipboard(text) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    logger.debug('Clipboard API not available');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    logger.debug('Text copied to clipboard');
    telemetry.track('share_completed', { method: 'clipboard' });
    return true;
  } catch (error) {
    logger.error('Clipboard copy failed', { error: error.message });
    telemetry.track('share_failed', { method: 'clipboard', error: error.message });
    return false;
  }
}

/**
 * Generate a share URL with topic parameter
 * @param {string} topic - Quiz topic
 * @returns {string} Full share URL
 */
export function generateShareUrl(topic) {
  const baseUrl = 'https://saberloop.com/app/';
  const encodedTopic = encodeURIComponent(topic);
  return `${baseUrl}?topic=${encodedTopic}`;
}

/**
 * Generate share text message
 * @param {Object} options - Message options
 * @param {string} options.topic - Quiz topic
 * @param {number} options.score - Number of correct answers
 * @param {number} options.total - Total number of questions
 * @param {number} options.percentage - Score percentage
 * @returns {string} Formatted share message
 */
export function generateShareText({ topic, score, total, percentage }) {
  return `🏆 ${topic} Quiz Master!
I scored ${score}/${total} (${percentage}%) on Saberloop!
Can you beat my score?`;
}

/**
 * Open Twitter/X share intent
 * @param {string} text - Tweet text
 * @param {string} url - URL to share
 */
export function shareToTwitter(text, url) {
  const tweetText = encodeURIComponent(text);
  const tweetUrl = encodeURIComponent(url);
  const intentUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`;
  window.open(intentUrl, '_blank', 'width=550,height=420');
  telemetry.track('share_completed', { method: 'twitter' });
}

/**
 * Open Facebook share dialog
 * @param {string} url - URL to share
 * @param {string} [quote] - Optional quote text
 */
export function shareToFacebook(url, quote) {
  const shareUrl = encodeURIComponent(url);
  let intentUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
  if (quote) {
    intentUrl += `&quote=${encodeURIComponent(quote)}`;
  }
  window.open(intentUrl, '_blank', 'width=550,height=420');
  telemetry.track('share_completed', { method: 'facebook' });
}
