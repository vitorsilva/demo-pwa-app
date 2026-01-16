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
    });
  });