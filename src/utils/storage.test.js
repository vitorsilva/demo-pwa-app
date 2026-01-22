/**
 * Unit tests for storage utility functions
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock db.js module
vi.mock('../core/db.js', () => ({
  getAllSessions: vi.fn(),
  getAllTopics: vi.fn(),
  getSetting: vi.fn(),
}));

import { formatStorageSize, getStorageBreakdown } from './storage.js';
import { getAllSessions, getAllTopics, getSetting } from '../core/db.js';

describe('Storage Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  describe('formatStorageSize', () => {
    it('should format 0 bytes', () => {
      expect(formatStorageSize(0)).toBe('0 B');
    });

    it('should format bytes (< 1024)', () => {
      expect(formatStorageSize(500)).toBe('500 B');
      expect(formatStorageSize(1)).toBe('1 B');
      expect(formatStorageSize(1023)).toBe('1023 B');
    });

    it('should format kilobytes', () => {
      expect(formatStorageSize(1024)).toBe('1.0 KB');
      expect(formatStorageSize(1536)).toBe('1.5 KB');
      expect(formatStorageSize(10240)).toBe('10.0 KB');
    });

    it('should format megabytes', () => {
      expect(formatStorageSize(1048576)).toBe('1.0 MB');
      expect(formatStorageSize(1572864)).toBe('1.5 MB');
      expect(formatStorageSize(5242880)).toBe('5.0 MB');
    });

    it('should format gigabytes', () => {
      expect(formatStorageSize(1073741824)).toBe('1.0 GB');
      expect(formatStorageSize(2147483648)).toBe('2.0 GB');
    });

    it('should handle negative numbers', () => {
      expect(formatStorageSize(-100)).toBe('0 B');
    });

    it('should handle NaN', () => {
      expect(formatStorageSize(NaN)).toBe('0 B');
    });

    it('should handle Infinity', () => {
      expect(formatStorageSize(Infinity)).toBe('0 B');
    });

    it('should use 1 decimal place for KB and above', () => {
      expect(formatStorageSize(1024)).toBe('1.0 KB');
      expect(formatStorageSize(1048576)).toBe('1.0 MB');
    });

    it('should use 0 decimal places for bytes', () => {
      expect(formatStorageSize(512)).toBe('512 B');
    });

    it('should handle very large values without exceeding GB', () => {
      // 10 TB should still show as GB (capped at units.length - 1)
      const tenTB = 10 * 1024 * 1024 * 1024 * 1024;
      const result = formatStorageSize(tenTB);
      expect(result).toContain('GB');
    });
  });

  describe('getStorageBreakdown', () => {
    beforeEach(() => {
      // Default mocks return empty data
      getAllSessions.mockResolvedValue([]);
      getAllTopics.mockResolvedValue([]);
      getSetting.mockResolvedValue(null);
    });

    it('should return formatted storage sizes', async () => {
      const result = await getStorageBreakdown();

      expect(result).toHaveProperty('settings');
      expect(result).toHaveProperty('quizzes');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('settingsBytes');
      expect(result).toHaveProperty('quizzesBytes');
      expect(result).toHaveProperty('totalBytes');
    });

    it('should return minimal size for empty storage', async () => {
      const result = await getStorageBreakdown();

      // Empty arrays [] still have 2 bytes each when serialized
      // So sessions [] + topics [] = 4 bytes minimum for quizzes
      expect(result.settings).toBe('0 B');
      expect(result.quizzes).toBe('4 B'); // Two empty arrays: [] + []
      expect(result.total).toBe('4 B');
      expect(result.settingsBytes).toBe(0);
      expect(result.quizzesBytes).toBe(4);
      expect(result.totalBytes).toBe(4);
    });

    it('should calculate settings size from IndexedDB', async () => {
      getSetting.mockImplementation((key) => {
        if (key === 'openrouter_api_key') return Promise.resolve({ key: 'test-key-123' });
        if (key === 'welcome_version') return Promise.resolve('1.0.0');
        return Promise.resolve(null);
      });

      const result = await getStorageBreakdown();

      expect(result.settingsBytes).toBeGreaterThan(0);
    });

    it('should calculate settings size from localStorage', async () => {
      localStorage.setItem('quizmaster_settings', JSON.stringify({ grade: 'middle' }));
      localStorage.setItem('i18nextLng', 'en');

      const result = await getStorageBreakdown();

      expect(result.settingsBytes).toBeGreaterThan(0);
    });

    it('should calculate quizzes size from sessions', async () => {
      getAllSessions.mockResolvedValue([
        { id: 1, topic: 'Test Topic', questions: [{ text: 'Question 1' }] },
      ]);

      const result = await getStorageBreakdown();

      expect(result.quizzesBytes).toBeGreaterThan(0);
    });

    it('should calculate quizzes size from topics', async () => {
      getAllTopics.mockResolvedValue([{ id: 'topic-1', name: 'Test Topic' }]);

      const result = await getStorageBreakdown();

      expect(result.quizzesBytes).toBeGreaterThan(0);
    });

    it('should sum settings and quizzes for total', async () => {
      localStorage.setItem('quizmaster_settings', JSON.stringify({ grade: 'middle' }));
      getAllSessions.mockResolvedValue([{ id: 1, topic: 'Test Topic' }]);

      const result = await getStorageBreakdown();

      expect(result.totalBytes).toBe(result.settingsBytes + result.quizzesBytes);
    });

    it('should handle localStorage keys that do not exist', async () => {
      // No localStorage items set
      const result = await getStorageBreakdown();

      // Should not throw and should return valid result
      expect(result).toBeDefined();
      expect(result.settingsBytes).toBe(0);
    });

    it('should include all expected localStorage keys in calculation', async () => {
      // Set all expected keys
      localStorage.setItem('quizmaster_settings', '{"a":1}');
      localStorage.setItem('openrouter_models_cache', '{"b":2}');
      localStorage.setItem('i18nextLng', 'en');
      localStorage.setItem('saberloop_telemetry_queue', '[]');

      const result = await getStorageBreakdown();

      // Each key should contribute to settings size
      expect(result.settingsBytes).toBeGreaterThan(10);
    });
  });
});
