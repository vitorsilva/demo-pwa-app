  import { describe, it, expect, beforeEach, vi } from 'vitest';
  import { getSettings, getSetting, saveSetting, saveSettings, DEFAULT_MODEL } from './settings.js';
  import { logger } from '../utils/logger.js';

  describe('Settings Utilities', () => {

    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    describe('getSettings', () => {
      it('should return default settings when nothing is stored', () => {
        const settings = getSettings();

        expect(settings.defaultGradeLevel).toBe('middle school');
        expect(settings.questionsPerQuiz).toBe('5');
        expect(settings.difficulty).toBe('mixed');
        expect(settings.selectedModel).toBe(DEFAULT_MODEL);
        expect(settings.screenName).toBe('');
      });

      it('should return stored settings merged with defaults', () => {
        // Arrange: Store partial settings
        localStorage.setItem('quizmaster_settings', JSON.stringify({
          defaultGradeLevel: 'college'
        }));

        // Act
        const settings = getSettings();

        // Assert: Should have stored value + defaults
        expect(settings.defaultGradeLevel).toBe('college');
        expect(settings.questionsPerQuiz).toBe('5'); // default
        expect(settings.difficulty).toBe('mixed'); // default
        expect(settings.selectedModel).toBe(DEFAULT_MODEL); // default
      });

      it('should handle corrupted localStorage gracefully', () => {
        // Arrange: Store invalid JSON
        localStorage.setItem('quizmaster_settings', 'not valid json');

        // Act & Assert: Should return defaults, not crash
        const settings = getSettings();
        expect(settings.defaultGradeLevel).toBe('middle school');
      });
    });

    describe('getSetting', () => {
      it('should return a single setting value', () => {
        localStorage.setItem('quizmaster_settings', JSON.stringify({
          difficulty: 'hard'
        }));

        const difficulty = getSetting('difficulty');

        expect(difficulty).toBe('hard');
      });

      it('should return default for unset setting', () => {
        const gradeLevel = getSetting('defaultGradeLevel');

        expect(gradeLevel).toBe('middle school');
      });
    });

    describe('saveSetting', () => {
      it('should save a single setting', () => {
        saveSetting('questionsPerQuiz', '15');

        const stored = JSON.parse(localStorage.getItem('quizmaster_settings'));
        expect(stored.questionsPerQuiz).toBe('15');
      });

      it('should preserve existing settings when saving new one', () => {
        // Arrange: Save initial setting
        saveSetting('difficulty', 'easy');

        // Act: Save another setting
        saveSetting('questionsPerQuiz', '5');

        // Assert: Both should exist
        const stored = JSON.parse(localStorage.getItem('quizmaster_settings'));
        expect(stored.difficulty).toBe('easy');
        expect(stored.questionsPerQuiz).toBe('5');
      });

      it('should handle localStorage errors gracefully and log the error', () => {
        localStorage.clear();

        const errorSpy = vi.spyOn(logger, 'error');

        // Mock on Storage.prototype - this works in jsdom/happy-dom
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });

        expect(() => saveSetting('testKey', 'testValue')).not.toThrow();

        expect(errorSpy).toHaveBeenCalledWith(
          'Error saving setting',
          { key: 'testKey', error: 'QuotaExceededError' }
        );

        setItemSpy.mockRestore();
      });
    });

    describe('saveSettings', () => {
      it('should save multiple settings at once', () => {
        saveSettings({
          defaultGradeLevel: 'high school',
          difficulty: 'hard'
        });

        const stored = JSON.parse(localStorage.getItem('quizmaster_settings'));
        expect(stored.defaultGradeLevel).toBe('high school');
        expect(stored.difficulty).toBe('hard');
      });

      it('should handle localStorage errors gracefully and log the error', () => {
        localStorage.clear();

        const errorSpy = vi.spyOn(logger, 'error');

        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });

        expect(() => saveSettings({ theme: 'dark' })).not.toThrow();

        expect(errorSpy).toHaveBeenCalledWith(
          'Error saving settings',
          { error: 'QuotaExceededError' }
        );

        setItemSpy.mockRestore();
      });
    });

    describe('screenName setting', () => {
      it('should get/set screenName setting', () => {
        // Initially empty
        expect(getSetting('screenName')).toBe('');

        // Save a screen name
        saveSetting('screenName', 'TestPlayer');

        // Verify it was saved
        expect(getSetting('screenName')).toBe('TestPlayer');
      });

      it('should persist screenName to localStorage', () => {
        saveSetting('screenName', 'PartyHost');

        const stored = JSON.parse(localStorage.getItem('quizmaster_settings'));
        expect(stored.screenName).toBe('PartyHost');
      });

      it('should return empty string when screenName not set', () => {
        // Don't set anything, just verify default
        const screenName = getSetting('screenName');
        expect(screenName).toBe('');
      });
    });

  });