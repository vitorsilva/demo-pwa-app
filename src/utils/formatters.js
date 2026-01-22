/**
 * Locale-aware formatters using Intl API
 * These formatters respect the user's language setting from i18n
 */
import { getCurrentLanguage, t } from '../core/i18n.js';

/**
 * Format a date in the user's locale
 * @param {Date} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  const locale = getCurrentLanguage();
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(date);
}

/**
 * Format a date as relative time (e.g., "2 days ago", "Yesterday")
 * Uses translated strings for Today/Yesterday, Intl.RelativeTimeFormat for others
 * @param {Date|number} date - The date or timestamp to format
 * @returns {string} Relative time string in user's locale
 */
export function formatRelativeDate(date) {
  const locale = getCurrentLanguage();
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();

  // Calculate difference in days (ignoring time)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Use translated strings for common cases
  if (diffDays === 0) return t('dates.today');
  if (diffDays === 1) return t('dates.yesterday');

  // Use Intl.RelativeTimeFormat for recent dates
  if (diffDays < 7) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    return rtf.format(-diffDays, 'day');
  }

  // Use Intl.RelativeTimeFormat for weeks
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    return rtf.format(-weeks, 'week');
  }

  // Fall back to formatted date for older dates
  return formatDate(dateObj);
}

/**
 * Format a number in the user's locale
 * @param {number} number - The number to format
 * @param {Object} options - Intl.NumberFormat options
 * @returns {string} Formatted number string
 */
export function formatNumber(number, options = {}) {
  const locale = getCurrentLanguage();
  return new Intl.NumberFormat(locale, options).format(number);
}

/**
 * Format a value as a percentage
 * @param {number} value - Value between 0 and 1 (or 0-100 if isRaw=true)
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.isRaw] - If true, value is already 0-100 scale
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, options = {}) {
  const locale = getCurrentLanguage();
  const { isRaw = false, ...intlOptions } = options;

  const normalizedValue = isRaw ? value / 100 : value;

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...intlOptions,
  }).format(normalizedValue);
}
