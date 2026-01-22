import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isFreeModel,
  getPaidEquivalent,
  calculateEstimatedCost,
  formatCost,
  getUsageSummary,
} from './cost-service.js';

// Mock model-service
vi.mock('./model-service.js', () => ({
  getModelPricing: vi.fn(),
}));

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

import { getModelPricing } from './model-service.js';

describe('Cost Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isFreeModel', () => {
    it('should return true for models ending with :free', () => {
      expect(isFreeModel('meta-llama/llama-3-8b-instruct:free')).toBe(true);
      expect(isFreeModel('google/gemma-2-9b-it:free')).toBe(true);
    });

    it('should return false for paid models', () => {
      expect(isFreeModel('openai/gpt-4')).toBe(false);
      expect(isFreeModel('anthropic/claude-3-opus')).toBe(false);
    });

    it('should return false for null/undefined/empty', () => {
      expect(isFreeModel(null)).toBe(false);
      expect(isFreeModel(undefined)).toBe(false);
      expect(isFreeModel('')).toBe(false);
    });

    it('should handle :free in the middle of model ID', () => {
      // Edge case: :free should only match at the end
      expect(isFreeModel('provider/model:free-variant')).toBe(false);
    });
  });

  describe('getPaidEquivalent', () => {
    it('should strip :free suffix from model ID', () => {
      expect(getPaidEquivalent('meta-llama/llama-3-8b-instruct:free')).toBe(
        'meta-llama/llama-3-8b-instruct'
      );
    });

    it('should return unchanged ID for already paid models', () => {
      expect(getPaidEquivalent('openai/gpt-4')).toBe('openai/gpt-4');
    });

    it('should handle null/undefined', () => {
      expect(getPaidEquivalent(null)).toBe(null);
      expect(getPaidEquivalent(undefined)).toBe(undefined);
    });
  });

  describe('calculateEstimatedCost', () => {
    it('should calculate cost based on token counts and pricing', () => {
      getModelPricing.mockReturnValue({
        prompt: '0.00000007', // $0.07 per 1M tokens
        completion: '0.00000021', // $0.21 per 1M tokens
      });

      // 100 prompt tokens, 50 completion tokens
      const cost = calculateEstimatedCost(100, 50, 'meta-llama/llama-3-8b-instruct');

      // Expected: (100 * 0.00000007) + (50 * 0.00000021) = 0.000007 + 0.0000105 = 0.0000175
      expect(cost).toBeCloseTo(0.0000175, 7);
    });

    it('should return 0 when no pricing found', () => {
      getModelPricing.mockReturnValue(null);

      const cost = calculateEstimatedCost(100, 50, 'unknown-model');
      expect(cost).toBe(0);
    });

    it('should handle zero tokens', () => {
      getModelPricing.mockReturnValue({
        prompt: '0.00000007',
        completion: '0.00000021',
      });

      const cost = calculateEstimatedCost(0, 0, 'model');
      expect(cost).toBe(0);
    });

    it('should handle missing pricing values', () => {
      getModelPricing.mockReturnValue({});

      const cost = calculateEstimatedCost(100, 50, 'model');
      expect(cost).toBe(0);
    });
  });

  describe('formatCost', () => {
    it('should return "Free" for free models with zero cost', () => {
      expect(formatCost(0, true)).toBe('Free');
    });

    it('should show 4 decimal places for small costs', () => {
      expect(formatCost(0.0001, false)).toBe('$0.0001');
      expect(formatCost(0.009, false)).toBe('$0.0090');
    });

    it('should show 2 decimal places for larger costs', () => {
      expect(formatCost(0.01, false)).toBe('$0.01');
      expect(formatCost(1.23, false)).toBe('$1.23');
      expect(formatCost(100.0, false)).toBe('$100.00');
    });

    it('should show $0.00 for zero cost on paid models', () => {
      expect(formatCost(0, false)).toBe('$0.00');
    });

    it('should handle edge case at exactly 0.01', () => {
      // At exactly 0.01, should use 2 decimals
      expect(formatCost(0.01, false)).toBe('$0.01');
      // Just below 0.01, should use 4 decimals
      expect(formatCost(0.0099, false)).toBe('$0.0099');
    });
  });

  describe('getUsageSummary', () => {
    it('should return complete summary for free model', () => {
      getModelPricing.mockReturnValue({
        prompt: '0.00000007',
        completion: '0.00000021',
      });

      const usage = {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costUsd: 0,
      };

      const summary = getUsageSummary(usage, 'meta-llama/llama-3-8b-instruct:free');

      expect(summary.promptTokens).toBe(100);
      expect(summary.completionTokens).toBe(50);
      expect(summary.totalTokens).toBe(150);
      expect(summary.actualCost).toBe(0);
      expect(summary.isFreeModel).toBe(true);
      expect(summary.formattedActualCost).toBe('Free');
      expect(summary.estimatedCost).toBeCloseTo(0.0000175, 7);
      expect(summary.formattedEstimatedCost).toBe('$0.0000');
    });

    it('should return summary for paid model without estimated cost', () => {
      const usage = {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costUsd: 0.05,
      };

      const summary = getUsageSummary(usage, 'openai/gpt-4');

      expect(summary.isFreeModel).toBe(false);
      expect(summary.actualCost).toBe(0.05);
      expect(summary.formattedActualCost).toBe('$0.05');
      expect(summary.estimatedCost).toBeNull();
      expect(summary.formattedEstimatedCost).toBeNull();
    });

    it('should handle missing usage data gracefully', () => {
      const summary = getUsageSummary(null, 'openai/gpt-4');

      expect(summary.promptTokens).toBe(0);
      expect(summary.completionTokens).toBe(0);
      expect(summary.totalTokens).toBe(0);
      expect(summary.actualCost).toBe(0);
    });

    it('should handle undefined usage values', () => {
      const usage = {};

      const summary = getUsageSummary(usage, 'openai/gpt-4');

      expect(summary.promptTokens).toBe(0);
      expect(summary.completionTokens).toBe(0);
      expect(summary.totalTokens).toBe(0);
      expect(summary.actualCost).toBe(0);
    });

    it('should not show estimated cost when pricing not available', () => {
      getModelPricing.mockReturnValue(null);

      const usage = {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costUsd: 0,
      };

      const summary = getUsageSummary(usage, 'unknown-model:free');

      expect(summary.isFreeModel).toBe(true);
      expect(summary.estimatedCost).toBe(0);
      expect(summary.formattedEstimatedCost).toBeNull(); // 0 estimated cost = no display
    });
  });
});
