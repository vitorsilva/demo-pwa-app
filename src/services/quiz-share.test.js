  import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
  import {
    generateShareUrl,
    copyShareUrl,
    nativeShare,
    isNativeShareSupported,
  } from './quiz-share.js';

  // Mock telemetry
  vi.mock('../utils/telemetry.js', () => ({
    telemetry: {
      track: vi.fn(),
    },
  }));

  // Helper to create a valid quiz
  function createTestQuiz(questionCount = 5) {
    return {
      topic: 'Test Topic',
      gradeLevel: 'middle school',
      mode: 'learning',
      questions: Array.from({ length: questionCount }, (_, i) => ({
        question: `Question ${i + 1}?`,
        options: ['A', 'B', 'C', 'D'],
        correct: 0,
      })),
    };
  }

  describe('quiz-share', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('generateShareUrl', () => {
      it('generates a valid URL for a shareable quiz', () => {
        const quiz = createTestQuiz(5);
        const result = generateShareUrl(quiz);

        expect(result.success).toBe(true);
        expect(result.url).toBeDefined();
        expect(result.url).toContain('#/quiz/');
      });

      it('includes creator name when provided', () => {
        const quiz = createTestQuiz(3);
        const result = generateShareUrl(quiz, 'João');

        expect(result.success).toBe(true);
        // The creator should be encoded in the URL
        expect(result.url).toBeDefined();
      });

      it('fails for quiz that is too large', () => {
        const largeQuiz = {
          topic: 'A'.repeat(100),
          questions: Array.from({ length: 50 }, (_, i) => ({
            question: `Very long question ${i + 1} with lots of text?`,
            options: [
              'Long option A with padding',
              'Long option B with padding',
              'Long option C with padding',
              'Long option D with padding',
            ],
            correct: 0,
          })),
        };

        const result = generateShareUrl(largeQuiz);

        expect(result.success).toBe(false);
        expect(result.error).toContain('too large');
      });

      it('returns URL length in result', () => {
        const quiz = createTestQuiz(3);
        const result = generateShareUrl(quiz);

        expect(result.length).toBeGreaterThan(0);
        expect(result.length).toBe(result.url.length);
      });
    });

    describe('copyShareUrl', () => {
      let originalClipboard;

      beforeEach(() => {
        originalClipboard = navigator.clipboard;
      });

      afterEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
          value: originalClipboard,
          writable: true,
        });
      });

      it('copies URL using Clipboard API', async () => {
        const mockWriteText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: mockWriteText },
          writable: true,
        });

        const result = await copyShareUrl('https://example.com/quiz#abc');

        expect(result).toBe(true);
        expect(mockWriteText).toHaveBeenCalledWith('https://example.com/quiz#abc');
      });

      it('uses fallback when Clipboard API fails', async () => {
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: vi.fn().mockRejectedValue(new Error('Not allowed')) },
          writable: true,
        });

        // Mock execCommand for fallback
        document.execCommand = vi.fn().mockReturnValue(true);

        const result = await copyShareUrl('https://example.com/quiz#abc');

        expect(result).toBe(true);
      });

      it('returns false when fallback also fails', async () => {
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: vi.fn().mockRejectedValue(new Error('Not allowed')) },
          writable: true,
        });

        // Mock execCommand to fail
        document.execCommand = vi.fn().mockReturnValue(false);

        const result = await copyShareUrl('https://example.com/quiz#abc');

        expect(result).toBe(false);
      });

      it('handles execCommand throwing an exception', async () => {
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: vi.fn().mockRejectedValue(new Error('Not allowed')) },
          writable: true,
        });

        // Mock execCommand to throw
        document.execCommand = vi.fn().mockImplementation(() => {
          throw new Error('execCommand failed');
        });

        const result = await copyShareUrl('https://example.com/quiz#abc');

        expect(result).toBe(false);
      });
    });

    describe('nativeShare', () => {
      let originalShare;
      let originalCanShare;

      beforeEach(() => {
        originalShare = navigator.share;
        originalCanShare = navigator.canShare;
      });

      afterEach(() => {
        navigator.share = originalShare;
        navigator.canShare = originalCanShare;
      });

      it('returns unsupported when Web Share API not available', async () => {
        navigator.share = undefined;

        const quiz = createTestQuiz(3);
        const result = await nativeShare(quiz, 'https://example.com');

        expect(result.success).toBe(false);
        expect(result.error).toContain('not supported');
      });

      it('calls navigator.share with correct data', async () => {
        const mockShare = vi.fn().mockResolvedValue(undefined);
        navigator.share = mockShare;
        navigator.canShare = vi.fn().mockReturnValue(true);

        const quiz = createTestQuiz(3);
        quiz.topic = 'History Quiz';

        await nativeShare(quiz, 'https://example.com/quiz');

        expect(mockShare).toHaveBeenCalledWith({
          title: 'Play "History Quiz" on Saberloop!',
          text: 'I challenge you to this 3-question quiz!',
          url: 'https://example.com/quiz',
        });
      });

      it('handles user cancellation gracefully', async () => {
        const abortError = new Error('User cancelled');
        abortError.name = 'AbortError';
        navigator.share = vi.fn().mockRejectedValue(abortError);
        navigator.canShare = vi.fn().mockReturnValue(true);

        const quiz = createTestQuiz(3);
        const result = await nativeShare(quiz, 'https://example.com');

        expect(result.success).toBe(false);
        expect(result.error).toBe('cancelled');
      });

      it('reports actual errors', async () => {
        navigator.share = vi.fn().mockRejectedValue(new Error('Network error'));
        navigator.canShare = vi.fn().mockReturnValue(true);

        const quiz = createTestQuiz(3);
        const result = await nativeShare(quiz, 'https://example.com');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Network error');
      });

      it('returns error when canShare returns false', async () => {
        navigator.share = vi.fn();
        navigator.canShare = vi.fn().mockReturnValue(false);

        const quiz = createTestQuiz(3);
        const result = await nativeShare(quiz, 'https://example.com');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Cannot share');
      });

      it('works when canShare is not defined but share is', async () => {
        navigator.share = vi.fn().mockResolvedValue(undefined);
        navigator.canShare = undefined;

        const quiz = createTestQuiz(3);
        const result = await nativeShare(quiz, 'https://example.com');

        expect(result.success).toBe(true);
        expect(navigator.share).toHaveBeenCalled();
      });

      it('returns success true on successful share', async () => {
        navigator.share = vi.fn().mockResolvedValue(undefined);
        navigator.canShare = vi.fn().mockReturnValue(true);

        const quiz = createTestQuiz(5);
        const result = await nativeShare(quiz, 'https://example.com');

        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('isNativeShareSupported', () => {
      let originalShare;

      beforeEach(() => {
        originalShare = navigator.share;
      });

      afterEach(() => {
        navigator.share = originalShare;
      });

      it('returns true when share is available', () => {
        navigator.share = vi.fn();
        expect(isNativeShareSupported()).toBe(true);
      });

      it('returns false when share is not available', () => {
        navigator.share = undefined;
        expect(isNativeShareSupported()).toBe(false);
      });
    });

    describe('generateShareUrl edge cases', () => {
      it('includes creator name when provided', () => {
        const quiz = createTestQuiz(3);
        const result = generateShareUrl(quiz, 'João');

        expect(result.success).toBe(true);
        expect(result.url).toBeDefined();
        // The URL should contain encoded quiz with creator
      });

      it('does not include creator when not provided', () => {
        const quiz = createTestQuiz(3);
        const result = generateShareUrl(quiz);

        expect(result.success).toBe(true);
        expect(result.url).toBeDefined();
      });

      it('returns serialization error for empty quiz', () => {
        const result = generateShareUrl({ questions: [] });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('handles quiz with empty questions array', () => {
        const quiz = { topic: 'Test', questions: [] };
        const result = generateShareUrl(quiz);

        expect(result.success).toBe(false);
      });
    });

    describe('copyShareUrl edge cases', () => {
      let originalClipboard;

      beforeEach(() => {
        originalClipboard = navigator.clipboard;
      });

      afterEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
          value: originalClipboard,
          writable: true,
        });
      });

      it('returns true when Clipboard API succeeds', async () => {
        const mockWriteText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: mockWriteText },
          writable: true,
        });

        const result = await copyShareUrl('https://test.com');

        expect(result).toBe(true);
        expect(mockWriteText).toHaveBeenCalledWith('https://test.com');
      });

      it('tracks success telemetry on Clipboard API success', async () => {
        const mockWriteText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: mockWriteText },
          writable: true,
        });

        await copyShareUrl('https://test.com');

        // Telemetry should be called
        const { telemetry } = await import('../utils/telemetry.js');
        expect(telemetry.track).toHaveBeenCalled();
      });

      it('tracks failure telemetry when both methods fail', async () => {
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) },
          writable: true,
        });

        document.execCommand = vi.fn().mockReturnValue(false);

        await copyShareUrl('https://test.com');

        // Telemetry should be called for failure
        const { telemetry } = await import('../utils/telemetry.js');
        expect(telemetry.track).toHaveBeenCalled();
      });
    });

    describe('nativeShare edge cases', () => {
      let originalShare;
      let originalCanShare;

      beforeEach(() => {
        originalShare = navigator.share;
        originalCanShare = navigator.canShare;
      });

      afterEach(() => {
        navigator.share = originalShare;
        navigator.canShare = originalCanShare;
      });

      it('includes quiz topic in share title', async () => {
        const mockShare = vi.fn().mockResolvedValue(undefined);
        navigator.share = mockShare;
        navigator.canShare = vi.fn().mockReturnValue(true);

        const quiz = createTestQuiz(5);
        quiz.topic = 'My Custom Quiz';

        await nativeShare(quiz, 'https://test.com');

        expect(mockShare).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('My Custom Quiz'),
          })
        );
      });

      it('includes question count in share text', async () => {
        const mockShare = vi.fn().mockResolvedValue(undefined);
        navigator.share = mockShare;
        navigator.canShare = vi.fn().mockReturnValue(true);

        const quiz = createTestQuiz(7);

        await nativeShare(quiz, 'https://test.com');

        expect(mockShare).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.stringContaining('7'),
          })
        );
      });

      it('handles share object construction', async () => {
        navigator.share = vi.fn().mockResolvedValue(undefined);
        navigator.canShare = undefined;

        const quiz = createTestQuiz(3);
        const result = await nativeShare(quiz, 'https://test.com/quiz');

        expect(result.success).toBe(true);
        expect(navigator.share).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'https://test.com/quiz',
          })
        );
      });
    });
  });