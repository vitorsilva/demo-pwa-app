/**
 * Unit tests for locale-aware formatters
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock i18n module
vi.mock('../core/i18n.js', () => ({
  getCurrentLanguage: vi.fn(() => 'en'),
  t: vi.fn((key, options) => {
    const translations = {
      'dates.today': 'Today',
      'dates.yesterday': 'Yesterday',
      'dates.daysAgo': `${options?.count} days ago`,
    };
    return translations[key] || key;
  }),
}));

import { formatDate, formatRelativeDate, formatNumber, formatPercent } from './formatters.js';
import { getCurrentLanguage, t } from '../core/i18n.js';

describe('Formatters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatDate', () => {
    it('should format date using Intl.DateTimeFormat with default options', () => {
      const date = new Date('2024-06-15');
      const result = formatDate(date);
      // Verify default options are applied: year:'numeric', month:'short', day:'numeric'
      expect(result).toContain('Jun'); // month: 'short'
      expect(result).toContain('2024'); // year: 'numeric'
      expect(result).toContain('15'); // day: 'numeric'
    });

    it('should use current language from i18n', () => {
      const date = new Date('2024-06-15');
      formatDate(date);
      expect(getCurrentLanguage).toHaveBeenCalled();
    });

    it('should accept custom options', () => {
      const date = new Date('2024-06-15');
      const result = formatDate(date, { month: 'long' });
      expect(typeof result).toBe('string');
    });
  });

  describe('formatRelativeDate', () => {
    it('should return "Today" for today\'s date', () => {
      const today = new Date();
      const result = formatRelativeDate(today);
      expect(result).toBe('Today');
      expect(t).toHaveBeenCalledWith('dates.today');
    });

    it('should return "Yesterday" for yesterday\'s date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = formatRelativeDate(yesterday);
      expect(result).toBe('Yesterday');
      expect(t).toHaveBeenCalledWith('dates.yesterday');
    });

    it('should handle timestamp numbers', () => {
      const today = Date.now();
      const result = formatRelativeDate(today);
      expect(result).toBe('Today');
    });

    it('should use Intl.RelativeTimeFormat for 2-6 days ago', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const result = formatRelativeDate(threeDaysAgo);
      // Should contain "3" and "day" and be in the past (not future)
      expect(result).toContain('3');
      expect(result.toLowerCase()).toContain('day');
      expect(result.toLowerCase()).toContain('ago');
    });

    it('should switch to weeks format at exactly 7 days', () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const result = formatRelativeDate(sevenDaysAgo);
      // 7 days = 1 week, should use week format not day format
      expect(result.toLowerCase()).toContain('week');
      expect(result.toLowerCase()).not.toContain('day');
    });

    it('should use Intl.RelativeTimeFormat for weeks', () => {
      // Test 1 week ago - should use "last week" (numeric: 'auto')
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 10); // 10 days = 1 week in floor division
      const resultOne = formatRelativeDate(oneWeekAgo);
      expect(resultOne.toLowerCase()).toContain('last');
      expect(resultOne.toLowerCase()).toContain('week');

      // Test 2 weeks ago
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const resultTwo = formatRelativeDate(twoWeeksAgo);
      expect(resultTwo).toContain('2');
      expect(resultTwo.toLowerCase()).toContain('week');
    });

    it('should fall back to formatted date for older dates', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);
      const result = formatRelativeDate(oldDate);
      // Should NOT contain relative time words, should be formatted date
      expect(result.toLowerCase()).not.toContain('day');
      expect(result.toLowerCase()).not.toContain('week');
      // Should contain year (formatted date)
      expect(result).toContain(String(oldDate.getFullYear()));
    });

    it('should switch to formatted date at exactly 30 days', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const result = formatRelativeDate(thirtyDaysAgo);
      // 30 days should use formatted date, not weeks
      expect(result.toLowerCase()).not.toContain('week');
      expect(result).toContain(String(thirtyDaysAgo.getFullYear()));
    });
  });

  describe('formatNumber', () => {
    it('should format numbers using Intl.NumberFormat', () => {
      const result = formatNumber(1234567);
      expect(typeof result).toBe('string');
      // Should contain the number in some format
      expect(result).toContain('1');
    });

    it('should use current language from i18n', () => {
      formatNumber(1000);
      expect(getCurrentLanguage).toHaveBeenCalled();
    });

    it('should accept custom options', () => {
      const result = formatNumber(1234.56, { minimumFractionDigits: 2 });
      expect(typeof result).toBe('string');
    });
  });

  describe('formatPercent', () => {
    it('should format decimal as percentage', () => {
      const result = formatPercent(0.85);
      expect(result).toContain('85');
      expect(result).toContain('%');
    });

    it('should handle raw percentage values (0-100)', () => {
      // 85 raw should become 85%, not 8500%
      const result = formatPercent(85, { isRaw: true });
      expect(result).toBe('85%');
    });

    it('should use current language from i18n', () => {
      formatPercent(0.5);
      expect(getCurrentLanguage).toHaveBeenCalled();
    });

    it('should format 0% correctly', () => {
      const result = formatPercent(0);
      expect(result).toContain('0');
      expect(result).toContain('%');
    });

    it('should format 100% correctly', () => {
      const result = formatPercent(1);
      expect(result).toContain('100');
      expect(result).toContain('%');
    });
  });
});
