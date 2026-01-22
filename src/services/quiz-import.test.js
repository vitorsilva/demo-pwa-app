import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importQuizFromUrl, saveImportedQuiz } from './quiz-import.js';
import { serializeQuiz } from './quiz-serializer.js';

// Mock the database module
vi.mock('../core/db.js', () => ({
  saveSession: vi.fn().mockResolvedValue(123),
}));

// Mock telemetry
vi.mock('../utils/telemetry.js', () => ({
  telemetry: {
    track: vi.fn(),
  },
}));

// Helper to create encoded quiz data
function createEncodedQuiz(options = {}) {
  const quiz = {
    topic: options.topic || 'Test Topic',
    gradeLevel: options.gradeLevel || 'middle school',
    creator: options.creator || 'Test Creator',
    mode: options.mode || 'learning',
    questions: options.questions || [
      {
        question: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correct: 1,
      },
    ],
  };
  const result = serializeQuiz(quiz);
  return result.data;
}

describe('quiz-import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('importQuizFromUrl', () => {
    it('successfully imports valid encoded data', async () => {
      const encoded = createEncodedQuiz({ topic: 'History' });
      const result = await importQuizFromUrl(encoded);

      expect(result.success).toBe(true);
      expect(result.quiz).toBeDefined();
      expect(result.quiz.topic).toBe('History');
    });

    it('adds import metadata to quiz', async () => {
      const encoded = createEncodedQuiz({ creator: 'João' });
      const result = await importQuizFromUrl(encoded);

      expect(result.quiz.isImported).toBe(true);
      expect(result.quiz.importedAt).toBeDefined();
      expect(typeof result.quiz.importedAt).toBe('number');
      expect(result.quiz.originalCreator).toBe('João');
    });

    it('sets originalCreator to Anonymous when not provided', async () => {
      const quiz = {
        topic: 'Test',
        questions: [{ question: 'Q?', options: ['A', 'B', 'C', 'D'], correct: 0 }],
      };
      const { data } = serializeQuiz(quiz);
      const result = await importQuizFromUrl(data);

      expect(result.quiz.originalCreator).toBe('Anonymous');
    });

    it('defaults mode to learning when not provided', async () => {
      const quiz = {
        topic: 'Test',
        questions: [{ question: 'Q?', options: ['A', 'B', 'C', 'D'], correct: 0 }],
      };
      const { data } = serializeQuiz(quiz);
      const result = await importQuizFromUrl(data);

      expect(result.quiz.mode).toBe('learning');
    });

    it('preserves mode when provided', async () => {
      const encoded = createEncodedQuiz({ mode: 'party' });
      const result = await importQuizFromUrl(encoded);

      expect(result.quiz.mode).toBe('party');
    });

    it('fails for invalid encoded data', async () => {
      const result = await importQuizFromUrl('invalid-data-here');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('fails for empty string', async () => {
      const result = await importQuizFromUrl('');

      expect(result.success).toBe(false);
    });

    it('removes creator field after copying to originalCreator', async () => {
      const encoded = createEncodedQuiz({ creator: 'Someone' });
      const result = await importQuizFromUrl(encoded);

      expect(result.quiz.creator).toBeUndefined();
      expect(result.quiz.originalCreator).toBe('Someone');
    });
  });

  describe('saveImportedQuiz', () => {
    it('saves quiz and returns id', async () => {
      const quiz = {
        topic: 'Test',
        gradeLevel: 'high school',
        questions: [{ question: 'Q?', options: ['A', 'B', 'C', 'D'], correct: 0 }],
        isImported: true,
        importedAt: Date.now(),
        originalCreator: 'Tester',
        mode: 'learning',
      };

      const result = await saveImportedQuiz(quiz);

      expect(result.success).toBe(true);
      expect(result.id).toBe(123);
    });

    it('adds session metadata before saving', async () => {
      const { saveSession } = await import('../core/db.js');

      const quiz = {
        topic: 'Test',
        questions: [{ question: 'Q?', options: ['A', 'B', 'C', 'D'], correct: 0 }],
        isImported: true,
      };

      await saveImportedQuiz(quiz);

      expect(saveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'Test',
          timestamp: expect.any(Number),
          userAnswers: [],
          score: 0,
          totalQuestions: 1,
        })
      );
    });

    it('handles save errors gracefully', async () => {
      const { saveSession } = await import('../core/db.js');
      saveSession.mockRejectedValueOnce(new Error('Database error'));

      const quiz = {
        topic: 'Test',
        questions: [{ question: 'Q?', options: ['A', 'B', 'C', 'D'], correct: 0 }],
        isImported: true,
      };

      const result = await saveImportedQuiz(quiz);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('returns error for IndexedDB quota exceeded', async () => {
      const { saveSession } = await import('../core/db.js');
      saveSession.mockRejectedValueOnce(new Error('QuotaExceededError'));

      const quiz = {
        topic: 'Test',
        questions: [{ question: 'Q?', options: ['A', 'B', 'C', 'D'], correct: 0 }],
      };

      const result = await saveImportedQuiz(quiz);

      expect(result.success).toBe(false);
      expect(result.error).toBe('QuotaExceededError');
    });
  });

  describe('importQuizFromUrl additional edge cases', () => {
    it('correctly sets importedAt timestamp', async () => {
      const before = Date.now();
      const encoded = createEncodedQuiz({ topic: 'Test' });
      const result = await importQuizFromUrl(encoded);
      const after = Date.now();

      expect(result.quiz.importedAt).toBeGreaterThanOrEqual(before);
      expect(result.quiz.importedAt).toBeLessThanOrEqual(after);
    });

    it('sets isImported to true', async () => {
      const encoded = createEncodedQuiz({ topic: 'Test' });
      const result = await importQuizFromUrl(encoded);

      expect(result.quiz.isImported).toBe(true);
    });

    it('handles quiz with all fields populated', async () => {
      const encoded = createEncodedQuiz({
        topic: 'Full Quiz',
        gradeLevel: 'college',
        creator: 'Test Creator',
        mode: 'party',
        questions: [
          { question: 'Q1?', options: ['A', 'B', 'C', 'D'], correct: 2, difficulty: 'hard' },
        ],
      });

      const result = await importQuizFromUrl(encoded);

      expect(result.success).toBe(true);
      expect(result.quiz.topic).toBe('Full Quiz');
      expect(result.quiz.gradeLevel).toBe('college');
      expect(result.quiz.mode).toBe('party');
      expect(result.quiz.originalCreator).toBe('Test Creator');
      expect(result.quiz.creator).toBeUndefined();
    });

    it('returns specific error message from deserializer', async () => {
      const result = await importQuizFromUrl('not-valid-base64!@#');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });
  });

  describe('saveImportedQuiz additional edge cases', () => {
    it('creates session with correct structure', async () => {
      const { saveSession } = await import('../core/db.js');

      const quiz = {
        topic: 'Session Test',
        gradeLevel: 'high school',
        questions: [
          { question: 'Q1?', options: ['A', 'B', 'C', 'D'], correct: 0 },
          { question: 'Q2?', options: ['A', 'B', 'C', 'D'], correct: 1 },
        ],
        isImported: true,
      };

      await saveImportedQuiz(quiz);

      expect(saveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'Session Test',
          gradeLevel: 'high school',
          userAnswers: [],
          score: 0,
          totalQuestions: 2,
          isImported: true,
        })
      );
    });

    it('preserves all quiz properties in session', async () => {
      const { saveSession } = await import('../core/db.js');

      const quiz = {
        topic: 'Preserve Test',
        gradeLevel: 'middle school',
        mode: 'learning',
        questions: [{ question: 'Q?', options: ['A', 'B', 'C', 'D'], correct: 0 }],
        originalCreator: 'Someone',
        isImported: true,
        importedAt: 1234567890,
      };

      await saveImportedQuiz(quiz);

      expect(saveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'learning',
          originalCreator: 'Someone',
          importedAt: 1234567890,
        })
      );
    });
  });
});
