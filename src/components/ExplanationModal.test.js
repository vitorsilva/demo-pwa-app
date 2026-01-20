/**
 * ExplanationModal Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showExplanationModal } from './ExplanationModal.js';

// Mock i18n
vi.mock('../core/i18n.js', () => ({
  t: (key) => {
    const translations = {
      'explanation.incorrect': 'Incorrect',
      'explanation.youSelected': 'You selected',
      'explanation.correctAnswer': 'Correct answer',
      'explanation.title': 'Explanation',
      'explanation.generating': 'Generating explanation...',
      'explanation.loadingPersonalized': 'Loading personalized feedback...',
      'explanation.connectToAI': 'Connect to AI for personalized feedback',
      'explanation.couldntLoad': "Couldn't load explanation",
      'explanation.tryAgain': 'Try again',
      'explanation.gotIt': 'Got it',
      'explanation.rateLimitError': 'Rate limit exceeded. Please wait.',
      'explanation.invalidKeyError': 'Invalid API key.',
      'explanation.goToSettings': 'Go to Settings',
    };
    return translations[key] || key;
  },
}));

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  },
}));

describe('ExplanationModal', () => {
  let originalBody;

  beforeEach(() => {
    vi.clearAllMocks();
    // Store original body content
    originalBody = document.body.innerHTML;
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Cleanup any modals
    const modal = document.getElementById('explanationModal');
    if (modal) modal.remove();
    document.body.innerHTML = originalBody;
  });

  describe('modal creation', () => {
    it('should create modal with correct structure', async () => {
      const modalPromise = showExplanationModal({
        question: 'What is 2+2?',
        userAnswer: 'A) 3',
        correctAnswer: 'B) 4',
        cachedExplanation: 'The answer is 4 because...',
        onFetchExplanation: vi.fn().mockResolvedValue({}),
        isOffline: true,
      });

      const modal = document.getElementById('explanationModal');
      expect(modal).not.toBeNull();
      expect(modal.className).toContain('fixed');
      expect(modal.className).toContain('inset-0');

      // Close modal
      const gotItBtn = modal.querySelector('#gotItBtn');
      gotItBtn.click();

      await modalPromise;
    });

    it('should display the question', async () => {
      const modalPromise = showExplanationModal({
        question: 'What is the capital of France?',
        userAnswer: 'London',
        correctAnswer: 'Paris',
        cachedExplanation: 'Paris is the capital.',
        onFetchExplanation: vi.fn().mockResolvedValue({}),
        isOffline: true,
      });

      const modal = document.getElementById('explanationModal');
      const questionEl = modal.querySelector('[data-testid="explanation-question"]');
      expect(questionEl.textContent).toBe('What is the capital of France?');

      // Close modal
      modal.querySelector('#gotItBtn').click();
      await modalPromise;
    });

    it('should display incorrect badge', async () => {
      const modalPromise = showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        cachedExplanation: 'Explanation',
        onFetchExplanation: vi.fn().mockResolvedValue({}),
        isOffline: true,
      });

      const modal = document.getElementById('explanationModal');
      expect(modal.textContent).toContain('Incorrect');

      modal.querySelector('#gotItBtn').click();
      await modalPromise;
    });
  });

  describe('answer text cleaning', () => {
    it('should clean A) prefix from user answer', async () => {
      const modalPromise = showExplanationModal({
        question: 'Test?',
        userAnswer: 'A) First option',
        correctAnswer: 'B) Second option',
        cachedExplanation: 'Explanation',
        onFetchExplanation: vi.fn().mockResolvedValue({}),
        isOffline: true,
      });

      const modal = document.getElementById('explanationModal');
      const userAnswerSection = modal.querySelector('.bg-error\\/10');
      expect(userAnswerSection.textContent).toContain('First option');
      expect(userAnswerSection.textContent).not.toContain('A)');

      modal.querySelector('#gotItBtn').click();
      await modalPromise;
    });

    it('should clean B) prefix from correct answer', async () => {
      const modalPromise = showExplanationModal({
        question: 'Test?',
        userAnswer: 'A) Wrong',
        correctAnswer: 'B) Correct answer here',
        cachedExplanation: 'Explanation',
        onFetchExplanation: vi.fn().mockResolvedValue({}),
        isOffline: true,
      });

      const modal = document.getElementById('explanationModal');
      const correctSection = modal.querySelector('.bg-success\\/10');
      expect(correctSection.textContent).toContain('Correct answer here');
      expect(correctSection.textContent).not.toContain('B)');

      modal.querySelector('#gotItBtn').click();
      await modalPromise;
    });

    it('should clean C) prefix', async () => {
      const modalPromise = showExplanationModal({
        question: 'Test?',
        userAnswer: 'C) Third option',
        correctAnswer: 'D) Fourth option',
        cachedExplanation: 'Explanation',
        onFetchExplanation: vi.fn().mockResolvedValue({}),
        isOffline: true,
      });

      const modal = document.getElementById('explanationModal');
      expect(modal.textContent).toContain('Third option');
      expect(modal.textContent).toContain('Fourth option');
      expect(modal.textContent).not.toContain('C)');
      expect(modal.textContent).not.toContain('D)');

      modal.querySelector('#gotItBtn').click();
      await modalPromise;
    });

    it('should handle answers without prefix', async () => {
      const modalPromise = showExplanationModal({
        question: 'Test?',
        userAnswer: 'No prefix answer',
        correctAnswer: 'Also no prefix',
        cachedExplanation: 'Explanation',
        onFetchExplanation: vi.fn().mockResolvedValue({}),
        isOffline: true,
      });

      const modal = document.getElementById('explanationModal');
      expect(modal.textContent).toContain('No prefix answer');
      expect(modal.textContent).toContain('Also no prefix');

      modal.querySelector('#gotItBtn').click();
      await modalPromise;
    });
  });

  describe('cached explanation', () => {
    it('should display cached explanation immediately', async () => {
      const modalPromise = showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        cachedExplanation: 'This is the cached explanation text.',
        onFetchExplanation: vi.fn().mockResolvedValue({}),
        isOffline: true,
      });

      const modal = document.getElementById('explanationModal');
      const rightAnswerText = modal.querySelector('#rightAnswerText');
      expect(rightAnswerText.textContent).toBe('This is the cached explanation text.');
      expect(rightAnswerText.className).not.toContain('hidden');

      modal.querySelector('#gotItBtn').click();
      await modalPromise;
    });

    it('should show loading state when no cached explanation', async () => {
      const fetchFn = vi.fn().mockImplementation(() => new Promise(() => {})); // Never resolves

      showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        onFetchExplanation: fetchFn,
        hasApiKey: true,
      });

      const modal = document.getElementById('explanationModal');
      const loading = modal.querySelector('#rightAnswerLoading');
      expect(loading).not.toBeNull();
      expect(loading.className).not.toContain('hidden');

      // Cleanup
      modal.remove();
    });
  });

  describe('offline handling', () => {
    it('should hide wrong answer section when offline', async () => {
      const modalPromise = showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        cachedExplanation: 'Cached explanation',
        onFetchExplanation: vi.fn(),
        isOffline: true,
      });

      const modal = document.getElementById('explanationModal');
      const wrongSection = modal.querySelector('#wrongAnswerSection');
      expect(wrongSection.className).toContain('hidden');

      modal.querySelector('#gotItBtn').click();
      await modalPromise;
    });

    it('should not call onFetchExplanation when offline with cached data', async () => {
      const fetchFn = vi.fn();

      const modalPromise = showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        cachedExplanation: 'Cached',
        onFetchExplanation: fetchFn,
        isOffline: true,
      });

      // Give some time for any async calls
      await new Promise((r) => setTimeout(r, 50));

      expect(fetchFn).not.toHaveBeenCalled();

      document.getElementById('explanationModal').querySelector('#gotItBtn').click();
      await modalPromise;
    });
  });

  describe('API key handling', () => {
    it('should show connect message when hasApiKey is false', async () => {
      const modalPromise = showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        cachedExplanation: 'Cached',
        onFetchExplanation: vi.fn(),
        hasApiKey: false,
      });

      const modal = document.getElementById('explanationModal');
      const connectSection = modal.querySelector('#connectToAI');
      expect(connectSection).not.toBeNull();
      expect(connectSection.textContent).toContain('Connect to AI');

      modal.querySelector('#gotItBtn').click();
      await modalPromise;
    });

    it('should show loading for personalized when hasApiKey is true', async () => {
      showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        cachedExplanation: 'Cached',
        onFetchExplanation: vi.fn().mockImplementation(() => new Promise(() => {})),
        hasApiKey: true,
      });

      const modal = document.getElementById('explanationModal');
      const wrongLoading = modal.querySelector('#wrongAnswerLoading');
      expect(wrongLoading).not.toBeNull();
      expect(wrongLoading.textContent).toContain('Loading personalized feedback');

      modal.remove();
    });
  });

  describe('fetch explanation', () => {
    it('should update UI with fetched explanation object', async () => {
      const fetchFn = vi.fn().mockResolvedValue({
        rightAnswerExplanation: 'Right answer explanation from API',
        wrongAnswerExplanation: 'Why your answer was wrong',
      });

      showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        onFetchExplanation: fetchFn,
        hasApiKey: true,
      });

      // Wait for fetch to complete
      await new Promise((r) => setTimeout(r, 100));

      const modal = document.getElementById('explanationModal');
      const rightText = modal.querySelector('#rightAnswerText');
      const wrongText = modal.querySelector('#wrongAnswerText');

      expect(rightText.textContent).toBe('Right answer explanation from API');
      expect(wrongText.textContent).toBe('Why your answer was wrong');

      modal.querySelector('#gotItBtn').click();
    });

    it('should update UI with fetched explanation string (partial fetch)', async () => {
      const fetchFn = vi.fn().mockResolvedValue('Only wrong answer explanation');

      showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        cachedExplanation: 'Cached right explanation',
        onFetchExplanation: fetchFn,
        hasApiKey: true,
      });

      await new Promise((r) => setTimeout(r, 100));

      const modal = document.getElementById('explanationModal');
      const wrongText = modal.querySelector('#wrongAnswerText');

      expect(wrongText.textContent).toBe('Only wrong answer explanation');

      modal.querySelector('#gotItBtn').click();
    });

    it('should hide wrong section when no wrongAnswerExplanation returned', async () => {
      const fetchFn = vi.fn().mockResolvedValue({
        rightAnswerExplanation: 'Right explanation only',
        wrongAnswerExplanation: null,
      });

      showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        onFetchExplanation: fetchFn,
        hasApiKey: true,
      });

      await new Promise((r) => setTimeout(r, 100));

      const modal = document.getElementById('explanationModal');
      const wrongSection = modal.querySelector('#wrongAnswerSection');

      expect(wrongSection.className).toContain('hidden');

      modal.querySelector('#gotItBtn').click();
    });
  });

  describe('error handling', () => {
    it('should show error state when fetch fails', async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'));

      showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        onFetchExplanation: fetchFn,
        hasApiKey: true,
      });

      await new Promise((r) => setTimeout(r, 100));

      const modal = document.getElementById('explanationModal');
      const errorEl = modal.querySelector('#explanationError');

      expect(errorEl.className).not.toContain('hidden');

      modal.querySelector('#gotItBtn').click();
    });

    it('should show rate limit message for RATE_LIMIT error', async () => {
      const rateLimitError = new Error('Rate limited');
      rateLimitError.code = 'RATE_LIMIT';
      const fetchFn = vi.fn().mockRejectedValue(rateLimitError);

      showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        onFetchExplanation: fetchFn,
        hasApiKey: true,
      });

      await new Promise((r) => setTimeout(r, 100));

      const modal = document.getElementById('explanationModal');
      expect(modal.textContent).toContain('Rate limit exceeded');

      modal.querySelector('#gotItBtn').click();
    });

    it('should show invalid key message for INVALID_API_KEY error', async () => {
      const apiKeyError = new Error('Invalid key');
      apiKeyError.code = 'INVALID_API_KEY';
      const fetchFn = vi.fn().mockRejectedValue(apiKeyError);

      showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        onFetchExplanation: fetchFn,
        hasApiKey: true,
      });

      await new Promise((r) => setTimeout(r, 100));

      const modal = document.getElementById('explanationModal');
      expect(modal.textContent).toContain('Invalid API key');
      expect(modal.textContent).toContain('Go to Settings');

      modal.querySelector('#gotItBtn').click();
    });

    it('should show error in wrong section only when cached explanation exists', async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error('Failed'));

      showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        cachedExplanation: 'Cached is still visible',
        onFetchExplanation: fetchFn,
        hasApiKey: true,
      });

      await new Promise((r) => setTimeout(r, 100));

      const modal = document.getElementById('explanationModal');
      const rightText = modal.querySelector('#rightAnswerText');
      const wrongSection = modal.querySelector('#wrongAnswerSection');

      // Cached explanation should still be visible
      expect(rightText.textContent).toBe('Cached is still visible');
      // Error should be in wrong section
      expect(wrongSection.textContent).toContain("Couldn't load explanation");

      modal.querySelector('#gotItBtn').click();
    });
  });

  describe('modal interactions', () => {
    it('should close on "Got it" button click', async () => {
      const modalPromise = showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        cachedExplanation: 'Cached',
        onFetchExplanation: vi.fn().mockResolvedValue({}),
        isOffline: true,
      });

      const modal = document.getElementById('explanationModal');
      expect(modal).not.toBeNull();

      const gotItBtn = modal.querySelector('#gotItBtn');
      gotItBtn.click();

      await modalPromise;

      // Wait for animation
      await new Promise((r) => setTimeout(r, 350));

      expect(document.getElementById('explanationModal')).toBeNull();
    });

    it('should close on backdrop click', async () => {
      const modalPromise = showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        cachedExplanation: 'Cached',
        onFetchExplanation: vi.fn().mockResolvedValue({}),
        isOffline: true,
      });

      const modal = document.getElementById('explanationModal');

      // Simulate backdrop click (clicking on the modal backdrop itself, not content)
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: modal });
      modal.dispatchEvent(clickEvent);

      await modalPromise;
      await new Promise((r) => setTimeout(r, 350));

      expect(document.getElementById('explanationModal')).toBeNull();
    });

    it('should close on Escape key', async () => {
      const modalPromise = showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        cachedExplanation: 'Cached',
        onFetchExplanation: vi.fn().mockResolvedValue({}),
        isOffline: true,
      });

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      await modalPromise;
      await new Promise((r) => setTimeout(r, 350));

      expect(document.getElementById('explanationModal')).toBeNull();
    });

    it('should resolve promise when closed', async () => {
      const modalPromise = showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        cachedExplanation: 'Cached',
        onFetchExplanation: vi.fn().mockResolvedValue({}),
        isOffline: true,
      });

      document.getElementById('explanationModal').querySelector('#gotItBtn').click();

      // Should resolve without error
      await expect(modalPromise).resolves.toBeUndefined();
    });
  });

  describe('retry functionality', () => {
    it('should retry fetch when retry button is clicked', async () => {
      let callCount = 0;
      const fetchFn = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('First call fails'));
        }
        return Promise.resolve({
          rightAnswerExplanation: 'Success on retry',
          wrongAnswerExplanation: 'Retry worked',
        });
      });

      showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        onFetchExplanation: fetchFn,
        hasApiKey: true,
      });

      // Wait for first fetch to fail
      await new Promise((r) => setTimeout(r, 100));

      const modal = document.getElementById('explanationModal');
      const retryBtn = modal.querySelector('#retryBtn');

      expect(retryBtn).not.toBeNull();
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Click retry
      retryBtn.click();

      await new Promise((r) => setTimeout(r, 100));

      expect(fetchFn).toHaveBeenCalledTimes(2);

      modal.querySelector('#gotItBtn').click();
    });
  });

  describe('animation', () => {
    it('should animate sheet in on creation', async () => {
      showExplanationModal({
        question: 'Test?',
        userAnswer: 'Wrong',
        correctAnswer: 'Right',
        cachedExplanation: 'Cached',
        onFetchExplanation: vi.fn().mockResolvedValue({}),
        isOffline: true,
      });

      const modal = document.getElementById('explanationModal');
      const sheet = modal.querySelector('#explanationSheet');

      // Initially has translate-y-full
      expect(sheet.className).toContain('translate-y-full');

      // After animation frame, should transition
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 50));

      expect(sheet.className).toContain('translate-y-0');

      modal.querySelector('#gotItBtn').click();
    });
  });
});
