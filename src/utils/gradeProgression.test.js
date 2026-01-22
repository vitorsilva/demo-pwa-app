import { describe, it, expect } from 'vitest';
import {
  calculateNextGradeLevel,
  getContinuesUntilNextLevel,
  GRADE_LEVELS,
  PROGRESSION_THRESHOLDS,
} from './gradeProgression.js';

describe('gradeProgression', () => {
  describe('calculateNextGradeLevel', () => {
    it('should return same level for 0-1 continues', () => {
      expect(calculateNextGradeLevel(0, 'middle school')).toBe('middle school');
      expect(calculateNextGradeLevel(1, 'middle school')).toBe('middle school');
    });

    it('should return next level after 2 continues', () => {
      expect(calculateNextGradeLevel(2, 'elementary')).toBe('middle school');
      expect(calculateNextGradeLevel(2, 'middle school')).toBe('high school');
      expect(calculateNextGradeLevel(2, 'high school')).toBe('college');
    });

    it('should return next level after 6 continues (2 levels up)', () => {
      expect(calculateNextGradeLevel(6, 'elementary')).toBe('high school');
      expect(calculateNextGradeLevel(6, 'middle school')).toBe('college');
    });

    it('should return next level after 14 continues (3 levels up)', () => {
      expect(calculateNextGradeLevel(14, 'elementary')).toBe('college');
    });

    it('should cap at college level', () => {
      expect(calculateNextGradeLevel(2, 'college')).toBe('college');
      expect(calculateNextGradeLevel(6, 'college')).toBe('college');
      expect(calculateNextGradeLevel(14, 'college')).toBe('college');
      expect(calculateNextGradeLevel(100, 'middle school')).toBe('college');
    });

    it('should handle starting at college', () => {
      expect(calculateNextGradeLevel(0, 'college')).toBe('college');
      expect(calculateNextGradeLevel(5, 'college')).toBe('college');
    });

    it('should handle invalid starting level by defaulting to middle school', () => {
      expect(calculateNextGradeLevel(0, 'invalid')).toBe('middle school');
    });

    it('should handle intermediate continue counts correctly', () => {
      // Between thresholds
      expect(calculateNextGradeLevel(3, 'elementary')).toBe('middle school'); // past 2, not 6
      expect(calculateNextGradeLevel(5, 'elementary')).toBe('middle school'); // past 2, not 6
      expect(calculateNextGradeLevel(10, 'elementary')).toBe('high school'); // past 6, not 14
    });
  });

  describe('getContinuesUntilNextLevel', () => {
    it('should return continues until first threshold', () => {
      expect(getContinuesUntilNextLevel(0)).toBe(2);
      expect(getContinuesUntilNextLevel(1)).toBe(1);
    });

    it('should return continues until second threshold', () => {
      expect(getContinuesUntilNextLevel(2)).toBe(4);
      expect(getContinuesUntilNextLevel(3)).toBe(3);
      expect(getContinuesUntilNextLevel(5)).toBe(1);
    });

    it('should return continues until third threshold', () => {
      expect(getContinuesUntilNextLevel(6)).toBe(8);
      expect(getContinuesUntilNextLevel(10)).toBe(4);
      expect(getContinuesUntilNextLevel(13)).toBe(1);
    });

    it('should return null when at max progression', () => {
      expect(getContinuesUntilNextLevel(14)).toBe(null);
      expect(getContinuesUntilNextLevel(100)).toBe(null);
    });
  });

  describe('constants', () => {
    it('should have correct grade levels', () => {
      expect(GRADE_LEVELS).toEqual(['elementary', 'middle school', 'high school', 'college']);
    });

    it('should have correct progression thresholds', () => {
      expect(PROGRESSION_THRESHOLDS).toEqual([2, 6, 14]);
    });
  });
});
