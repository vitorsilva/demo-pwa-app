import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateCost,
  recordUsage,
  getQuizCost,
  getQuizUsageRecords,
  getSessionUsageSummary,
  clearUsageRecords,
  formatCost,
} from './cost-tracker.js';

// Mock providers-config
vi.mock('../api/providers-config.js', () => ({
  getProvider: vi.fn((providerId) => {
    const providers = {
      openai: {
        id: 'openai',
        name: 'OpenAI',
        models: [
          { id: 'gpt-4o', inputPrice: 2.5, outputPrice: 10.0 },
          { id: 'gpt-4o-mini', inputPrice: 0.15, outputPrice: 0.6 },
        ],
      },
      anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        models: [
          { id: 'claude-3-5-sonnet-20241022', inputPrice: 3.0, outputPrice: 15.0 },
          { id: 'claude-3-haiku-20240307', inputPrice: 0.25, outputPrice: 1.25 },
        ],
      },
      google: {
        id: 'google',
        name: 'Google AI',
        models: [
          { id: 'gemini-2.0-flash-exp', inputPrice: 0, outputPrice: 0 }, // Free
          { id: 'gemini-1.5-pro', inputPrice: 1.25, outputPrice: 5.0 },
        ],
      },
      openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        models: [],
      },
    };
    return providers[providerId] || null;
  }),
}));

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Cost Tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearUsageRecords();
  });

  describe('calculateCost', () => {
    it('should calculate OpenAI GPT-4o cost', () => {
      const usage = { prompt_tokens: 1000, completion_tokens: 500 };
      const cost = calculateCost('openai', 'gpt-4o', usage);

      // (1000/1M * 2.50) + (500/1M * 10.00) = 0.0025 + 0.005 = 0.0075
      expect(cost).toBeCloseTo(0.0075);
    });

    it('should calculate OpenAI GPT-4o-mini cost', () => {
      const usage = { prompt_tokens: 1000, completion_tokens: 500 };
      const cost = calculateCost('openai', 'gpt-4o-mini', usage);

      // (1000/1M * 0.15) + (500/1M * 0.60) = 0.00015 + 0.0003 = 0.00045
      expect(cost).toBeCloseTo(0.00045);
    });

    it('should calculate Anthropic Claude cost', () => {
      const usage = { prompt_tokens: 2000, completion_tokens: 1000 };
      const cost = calculateCost('anthropic', 'claude-3-5-sonnet-20241022', usage);

      // (2000/1M * 3.00) + (1000/1M * 15.00) = 0.006 + 0.015 = 0.021
      expect(cost).toBeCloseTo(0.021);
    });

    it('should return 0 for free tier models', () => {
      const usage = { prompt_tokens: 5000, completion_tokens: 2000 };
      const cost = calculateCost('google', 'gemini-2.0-flash-exp', usage);

      expect(cost).toBe(0);
    });

    it('should use OpenRouter cost from response', () => {
      const usage = { prompt_tokens: 1000, completion_tokens: 500, cost: 0.0123 };
      const cost = calculateCost('openrouter', 'any-model', usage);

      expect(cost).toBe(0.0123);
    });

    it('should return null for unknown provider', () => {
      const usage = { prompt_tokens: 1000, completion_tokens: 500 };
      const cost = calculateCost('unknown', 'model', usage);

      expect(cost).toBeNull();
    });

    it('should return null for unknown model', () => {
      const usage = { prompt_tokens: 1000, completion_tokens: 500 };
      const cost = calculateCost('openai', 'unknown-model', usage);

      expect(cost).toBeNull();
    });

    it('should handle missing token counts', () => {
      const usage = {};
      const cost = calculateCost('openai', 'gpt-4o', usage);

      expect(cost).toBe(0);
    });
  });

  describe('recordUsage', () => {
    it('should record usage and return record', () => {
      const data = {
        providerId: 'openai',
        model: 'gpt-4o',
        usage: { prompt_tokens: 1000, completion_tokens: 500 },
        operation: 'generateQuestions',
        quizId: 'quiz-123',
      };

      const record = recordUsage(data);

      expect(record.id).toBeDefined();
      expect(record.timestamp).toBeDefined();
      expect(record.providerId).toBe('openai');
      expect(record.model).toBe('gpt-4o');
      expect(record.operation).toBe('generateQuestions');
      expect(record.quizId).toBe('quiz-123');
      expect(record.promptTokens).toBe(1000);
      expect(record.completionTokens).toBe(500);
      expect(record.cost).toBeCloseTo(0.0075);
    });

    it('should store record in memory by quizId', () => {
      const data = {
        providerId: 'openai',
        model: 'gpt-4o',
        usage: { prompt_tokens: 100, completion_tokens: 50 },
        operation: 'test',
        quizId: 'quiz-456',
      };

      recordUsage(data);

      const records = getQuizUsageRecords('quiz-456');
      expect(records.length).toBe(1);
      expect(records[0].quizId).toBe('quiz-456');
    });

    it('should accumulate multiple records for same quiz', () => {
      recordUsage({
        providerId: 'openai',
        model: 'gpt-4o',
        usage: { prompt_tokens: 100, completion_tokens: 50 },
        operation: 'generateQuestions',
        quizId: 'quiz-multi',
      });

      recordUsage({
        providerId: 'openai',
        model: 'gpt-4o',
        usage: { prompt_tokens: 50, completion_tokens: 25 },
        operation: 'generateExplanation',
        quizId: 'quiz-multi',
      });

      const records = getQuizUsageRecords('quiz-multi');
      expect(records.length).toBe(2);
    });
  });

  describe('getQuizCost', () => {
    it('should return total cost for a quiz', () => {
      recordUsage({
        providerId: 'openai',
        model: 'gpt-4o',
        usage: { prompt_tokens: 1000, completion_tokens: 500 },
        operation: 'generateQuestions',
        quizId: 'quiz-cost',
      });

      recordUsage({
        providerId: 'openai',
        model: 'gpt-4o',
        usage: { prompt_tokens: 500, completion_tokens: 250 },
        operation: 'generateExplanation',
        quizId: 'quiz-cost',
      });

      const totalCost = getQuizCost('quiz-cost');

      // First: 0.0075, Second: 0.00375
      expect(totalCost).toBeCloseTo(0.01125);
    });

    it('should return 0 for unknown quiz', () => {
      const cost = getQuizCost('unknown-quiz');
      expect(cost).toBe(0);
    });
  });

  describe('getSessionUsageSummary', () => {
    it('should return empty summary when no usage', () => {
      const summary = getSessionUsageSummary();

      expect(summary.totalCost).toBe(0);
      expect(summary.totalPromptTokens).toBe(0);
      expect(summary.totalCompletionTokens).toBe(0);
      expect(summary.recordCount).toBe(0);
    });

    it('should aggregate usage across quizzes', () => {
      recordUsage({
        providerId: 'openai',
        model: 'gpt-4o',
        usage: { prompt_tokens: 1000, completion_tokens: 500 },
        operation: 'generateQuestions',
        quizId: 'quiz-1',
      });

      recordUsage({
        providerId: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        usage: { prompt_tokens: 2000, completion_tokens: 1000 },
        operation: 'generateQuestions',
        quizId: 'quiz-2',
      });

      const summary = getSessionUsageSummary();

      expect(summary.totalPromptTokens).toBe(3000);
      expect(summary.totalCompletionTokens).toBe(1500);
      expect(summary.recordCount).toBe(2);
      expect(summary.byProvider.openai).toBeDefined();
      expect(summary.byProvider.anthropic).toBeDefined();
      expect(summary.byProvider.openai.requests).toBe(1);
      expect(summary.byProvider.anthropic.requests).toBe(1);
    });

    it('should aggregate by operation', () => {
      recordUsage({
        providerId: 'openai',
        model: 'gpt-4o',
        usage: { prompt_tokens: 1000, completion_tokens: 500 },
        operation: 'generateQuestions',
        quizId: 'quiz-1',
      });

      recordUsage({
        providerId: 'openai',
        model: 'gpt-4o',
        usage: { prompt_tokens: 500, completion_tokens: 200 },
        operation: 'generateExplanation',
        quizId: 'quiz-1',
      });

      const summary = getSessionUsageSummary();

      expect(summary.byOperation.generateQuestions.requests).toBe(1);
      expect(summary.byOperation.generateExplanation.requests).toBe(1);
    });
  });

  describe('formatCost', () => {
    it('should return "N/A" for null/undefined', () => {
      expect(formatCost(null)).toBe('N/A');
      expect(formatCost(undefined)).toBe('N/A');
    });

    it('should return "Free" for zero cost', () => {
      expect(formatCost(0)).toBe('Free');
    });

    it('should show 4 decimal places for small costs', () => {
      expect(formatCost(0.0001)).toBe('$0.0001');
      expect(formatCost(0.009)).toBe('$0.0090');
    });

    it('should show 2 decimal places for larger costs', () => {
      expect(formatCost(0.01)).toBe('$0.01');
      expect(formatCost(1.23)).toBe('$1.23');
      expect(formatCost(100.0)).toBe('$100.00');
    });
  });

  describe('clearUsageRecords', () => {
    it('should clear all records', () => {
      recordUsage({
        providerId: 'openai',
        model: 'gpt-4o',
        usage: { prompt_tokens: 100, completion_tokens: 50 },
        operation: 'test',
        quizId: 'quiz-clear',
      });

      expect(getQuizUsageRecords('quiz-clear').length).toBe(1);

      clearUsageRecords();

      expect(getQuizUsageRecords('quiz-clear').length).toBe(0);
    });
  });
});
