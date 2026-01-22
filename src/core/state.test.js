import { describe, it, expect, beforeEach, vi } from 'vitest';
import state from './state.js';

describe('AppState', () => {
  // Reset state before each test to avoid test pollution
  beforeEach(() => {
    state.clear();
    // Clear listeners array directly (since no unsubscribe method exists)
    state.listeners = [];
  });

  describe('get and set', () => {
    it('should get default values', () => {
      expect(state.get('currentTopic')).toBeNull();
      expect(state.get('currentGradeLevel')).toBe('middle school');
      expect(state.get('currentAnswers')).toEqual([]);
    });

    it('should set and get values', () => {
      state.set('currentTopic', 'Science');
      expect(state.get('currentTopic')).toBe('Science');
    });

    it('should return undefined for non-existent keys', () => {
      expect(state.get('nonExistentKey')).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update multiple values at once', () => {
      state.update({
        currentTopic: 'History',
        currentScore: 85,
      });

      expect(state.get('currentTopic')).toBe('History');
      expect(state.get('currentScore')).toBe(85);
    });
  });

  describe('subscribe and notify', () => {
    it('should notify subscribers on set', () => {
      const callback = vi.fn();
      state.subscribe(callback);

      state.set('currentTopic', 'Math');

      expect(callback).toHaveBeenCalledWith('currentTopic', 'Math');
    });

    it('should notify subscribers on update with wildcard', () => {
      const callback = vi.fn();
      state.subscribe(callback);

      state.update({ currentScore: 100 });

      expect(callback).toHaveBeenCalledWith(
        '*',
        expect.objectContaining({
          currentScore: 100,
        })
      );
    });

    it('should notify multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      state.subscribe(callback1);
      state.subscribe(callback2);

      state.set('currentTopic', 'Art');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should reset all values to defaults', () => {
      state.set('currentTopic', 'Physics');
      state.set('currentScore', 90);

      state.clear();

      expect(state.get('currentTopic')).toBeNull();
      expect(state.get('currentScore')).toBeNull();
      expect(state.get('currentGradeLevel')).toBe('middle school');
    });

    it('should notify subscribers on clear', () => {
      const callback = vi.fn();
      state.subscribe(callback);

      state.clear();

      expect(callback).toHaveBeenCalledWith('*', expect.any(Object));
    });
  });

  describe('continue chain', () => {
    const mockQuestions = [
      { question: 'What is 2+2?' },
      { question: 'What is the capital of France?' },
    ];

    it('should initialize continue chain', () => {
      state.initContinueChain('Math', 'high school', mockQuestions);

      const chain = state.getContinueChain();
      expect(chain).toEqual({
        topic: 'Math',
        continueCount: 0,
        previousQuestions: ['What is 2+2?', 'What is the capital of France?'],
        startingGradeLevel: 'high school',
      });
    });

    it('should add to continue chain', () => {
      state.initContinueChain('Math', 'high school', mockQuestions);

      const newQuestions = [{ question: 'What is 3+3?' }];
      state.addToContinueChain(newQuestions);

      const chain = state.getContinueChain();
      expect(chain.continueCount).toBe(1);
      expect(chain.previousQuestions).toContain('What is 3+3?');
    });

    it('should not add to chain if not initialized', () => {
      state.addToContinueChain([{ question: 'Test?' }]);

      expect(state.getContinueChain()).toBeNull();
    });

    it('should clear continue chain', () => {
      state.initContinueChain('Math', 'high school', mockQuestions);
      state.clearContinueChain();

      expect(state.getContinueChain()).toBeNull();
    });

    it('should return null when chain not initialized', () => {
      expect(state.getContinueChain()).toBeNull();
    });
  });
});
