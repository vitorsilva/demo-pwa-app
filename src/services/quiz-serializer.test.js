import { describe, it, expect } from 'vitest';
import {
  serializeQuiz,
  deserializeQuiz,
  canShareQuiz,
  getMaxShareableQuestions,
} from './quiz-serializer.js';

// Helper to create a valid quiz for testing
function createTestQuiz(questionCount = 5, options = {}) {
  return {
    topic: options.topic || 'Test Topic',
    gradeLevel: options.gradeLevel || 'middle school',
    creator: options.creator || 'Tester',
    mode: options.mode || 'learning',
    questions: Array.from({ length: questionCount }, (_, i) => ({
      question: `Question ${i + 1}?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct: 0,
      difficulty: 'medium',
      explanation: 'This is an explanation that should be excluded',
    })),
  };
}

describe('quiz-serializer', () => {
  describe('serializeQuiz', () => {
    it('produces valid encoded string for a valid quiz', () => {
      const quiz = createTestQuiz(5);
      const result = serializeQuiz(quiz);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('uses URL-safe characters only', () => {
      const quiz = createTestQuiz(5);
      const result = serializeQuiz(quiz);

      // LZ-string's compressToEncodedURIComponent produces URL-safe output
      // Should not contain characters that need encoding: +, /, =, &, ?
      expect(result.data).not.toMatch(/[+/=&?#]/);
    });

    it('excludes explanations from payload', () => {
      const quiz = createTestQuiz(1);
      quiz.questions[0].explanation = 'Very long explanation here';

      const result = serializeQuiz(quiz);
      expect(result.success).toBe(true);

      // Deserialize and check explanation is not present
      const decoded = deserializeQuiz(result.data);
      expect(decoded.quiz.questions[0].explanation).toBeUndefined();
    });

    it('rejects empty quiz', () => {
      const result = serializeQuiz({});
      expect(result.success).toBe(false);
      expect(result.error).toContain('at least one question');
    });

    it('rejects quiz with no questions', () => {
      const quiz = { topic: 'Test', questions: [] };
      const result = serializeQuiz(quiz);
      expect(result.success).toBe(false);
    });

    it('rejects null/undefined input', () => {
      expect(serializeQuiz(null).success).toBe(false);
      expect(serializeQuiz(undefined).success).toBe(false);
    });

    it('handles quiz with only required fields (no optional fields)', () => {
      const minimalQuiz = {
        questions: [{ question: 'Q?', options: ['A', 'B', 'C', 'D'], correct: 0 }],
      };
      const result = serializeQuiz(minimalQuiz);
      expect(result.success).toBe(true);

      // Verify roundtrip - optional fields should remain undefined
      const decoded = deserializeQuiz(result.data);
      expect(decoded.success).toBe(true);
      expect(decoded.quiz.topic).toBeUndefined();
      expect(decoded.quiz.gradeLevel).toBeUndefined();
      expect(decoded.quiz.creator).toBeUndefined();
      expect(decoded.quiz.mode).toBeUndefined();
      expect(decoded.quiz.questions).toHaveLength(1);
    });
  });

  describe('deserializeQuiz', () => {
    it('recovers original quiz data', () => {
      const original = createTestQuiz(5);
      const serialized = serializeQuiz(original);
      const result = deserializeQuiz(serialized.data);

      expect(result.success).toBe(true);
      expect(result.quiz.topic).toBe(original.topic);
      expect(result.quiz.gradeLevel).toBe(original.gradeLevel);
      expect(result.quiz.questions).toHaveLength(5);
      expect(result.quiz.questions[0].question).toBe('Question 1?');
    });

    it('handles missing optional fields', () => {
      const quiz = {
        topic: 'Minimal Quiz',
        questions: [{ question: 'Q?', options: ['A', 'B', 'C', 'D'], correct: 1 }],
      };
      const serialized = serializeQuiz(quiz);
      const result = deserializeQuiz(serialized.data);

      expect(result.success).toBe(true);
      expect(result.quiz.gradeLevel).toBeUndefined();
      expect(result.quiz.creator).toBeUndefined();
    });

    it('rejects invalid encoded data', () => {
      const result = deserializeQuiz('not-valid-data!!!');
      expect(result.success).toBe(false);
    });

    it('rejects empty string', () => {
      const result = deserializeQuiz('');
      expect(result.success).toBe(false);
    });

    it('rejects null/undefined input', () => {
      expect(deserializeQuiz(null).success).toBe(false);
      expect(deserializeQuiz(undefined).success).toBe(false);
    });

    it('rejects non-string input types', () => {
      expect(deserializeQuiz(123).success).toBe(false);
      expect(deserializeQuiz({}).success).toBe(false);
      expect(deserializeQuiz([]).success).toBe(false);
      expect(deserializeQuiz(true).success).toBe(false);
    });
  });

  describe('roundtrip', () => {
    it('serialize then deserialize preserves data', () => {
      const original = createTestQuiz(10, {
        topic: 'History of Portugal',
        gradeLevel: 'high school',
        creator: 'João',
        mode: 'party',
      });

      const serialized = serializeQuiz(original);
      const deserialized = deserializeQuiz(serialized.data);

      expect(deserialized.quiz.topic).toBe('History of Portugal');
      expect(deserialized.quiz.gradeLevel).toBe('high school');
      expect(deserialized.quiz.creator).toBe('João');
      expect(deserialized.quiz.mode).toBe('party');
      expect(deserialized.quiz.questions).toHaveLength(10);
    });

    // Issue #86: Quiz sharing breaks because serializer uses 'correctIndex'
    // but the app uses 'correct' throughout (API response, ResultsView, shuffle)
    it('preserves correct property from API-style quiz (issue #86)', () => {
      // This is how the AI API returns questions - with 'correct' not 'correctIndex'
      const apiStyleQuiz = {
        topic: 'Science Quiz',
        gradeLevel: 'middle school',
        questions: [
          { question: 'Q1?', options: ['A', 'B', 'C', 'D'], correct: 0, difficulty: 'easy' },
          { question: 'Q2?', options: ['A', 'B', 'C', 'D'], correct: 2, difficulty: 'medium' },
          { question: 'Q3?', options: ['A', 'B', 'C', 'D'], correct: 1, difficulty: 'hard' },
        ],
      };

      const serialized = serializeQuiz(apiStyleQuiz);
      expect(serialized.success).toBe(true);

      const deserialized = deserializeQuiz(serialized.data);
      expect(deserialized.success).toBe(true);

      // The 'correct' property must be preserved after roundtrip
      expect(deserialized.quiz.questions[0].correct).toBe(0);
      expect(deserialized.quiz.questions[1].correct).toBe(2);
      expect(deserialized.quiz.questions[2].correct).toBe(1);
    });
  });

  describe('canShareQuiz', () => {
    it('returns true for small quiz', () => {
      const quiz = createTestQuiz(5);
      const result = canShareQuiz(quiz);

      expect(result.canShare).toBe(true);
      expect(result.estimatedLength).toBeGreaterThan(0);
      expect(result.maxLength).toBe(2000);
    });

    it('returns false for empty quiz', () => {
      const result = canShareQuiz({ questions: [] });
      expect(result.canShare).toBe(false);
    });

    it('returns false for null quiz', () => {
      const result = canShareQuiz(null);
      expect(result.canShare).toBe(false);
    });

    it('returns false for quiz without questions property', () => {
      const result = canShareQuiz({ topic: 'Test' });
      expect(result.canShare).toBe(false);
      expect(result.estimatedLength).toBe(0);
    });
  });

  describe('getMaxShareableQuestions', () => {
    it('returns a reasonable number', () => {
      const max = getMaxShareableQuestions();
      expect(max).toBeGreaterThan(0);
      expect(max).toBeLessThanOrEqual(15);
    });

    it('returns exactly 10', () => {
      const max = getMaxShareableQuestions();
      expect(max).toBe(10);
    });
  });

  describe('difficulty field handling', () => {
    it('preserves difficulty field in roundtrip', () => {
      const quiz = {
        topic: 'Test',
        questions: [
          { question: 'Q1?', options: ['A', 'B', 'C', 'D'], correct: 0, difficulty: 'easy' },
          { question: 'Q2?', options: ['A', 'B', 'C', 'D'], correct: 1, difficulty: 'hard' },
        ],
      };

      const serialized = serializeQuiz(quiz);
      const deserialized = deserializeQuiz(serialized.data);

      expect(deserialized.quiz.questions[0].difficulty).toBe('easy');
      expect(deserialized.quiz.questions[1].difficulty).toBe('hard');
    });

    it('handles questions without difficulty', () => {
      const quiz = {
        topic: 'Test',
        questions: [{ question: 'Q1?', options: ['A', 'B', 'C', 'D'], correct: 0 }],
      };

      const serialized = serializeQuiz(quiz);
      const deserialized = deserializeQuiz(serialized.data);

      expect(deserialized.quiz.questions[0].difficulty).toBeUndefined();
    });
  });

  describe('mode field handling', () => {
    it('preserves party mode', () => {
      const quiz = {
        topic: 'Test',
        mode: 'party',
        questions: [{ question: 'Q?', options: ['A', 'B', 'C', 'D'], correct: 0 }],
      };

      const serialized = serializeQuiz(quiz);
      const deserialized = deserializeQuiz(serialized.data);

      expect(deserialized.quiz.mode).toBe('party');
    });

    it('preserves learning mode', () => {
      const quiz = {
        topic: 'Test',
        mode: 'learning',
        questions: [{ question: 'Q?', options: ['A', 'B', 'C', 'D'], correct: 0 }],
      };

      const serialized = serializeQuiz(quiz);
      const deserialized = deserializeQuiz(serialized.data);

      expect(deserialized.quiz.mode).toBe('learning');
    });
  });

  it('produces output that does not change when URL encoded', () => {
    const quiz = createTestQuiz(5);
    const result = serializeQuiz(quiz);

    // If already URL-safe, encodeURIComponent won't change it
    const encoded = encodeURIComponent(result.data);
    expect(encoded).toBe(result.data);
  });

  it('rejects quiz exceeding max URL length', () => {
    // Create a quiz with many questions and long text to exceed limit
    const largeQuiz = {
      topic: 'A'.repeat(100),
      gradeLevel: 'high school',
      questions: Array.from({ length: 50 }, (_, i) => ({
        question: `This is a very long question number ${i + 1} with lots of extra text to make it bigger?`,
        options: [
          'This is option A with extra padding text',
          'This is option B with extra padding text',
          'This is option C with extra padding text',
          'This is option D with extra padding text',
        ],
        correct: 0,
      })),
    };

    const result = serializeQuiz(largeQuiz);

    expect(result.success).toBe(false);
    expect(result.error).toContain('too large');
    expect(result.length).toBeGreaterThan(2000);
  });
});
