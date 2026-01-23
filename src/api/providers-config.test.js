import { describe, it, expect } from 'vitest';
import {
  PROVIDERS,
  getProvider,
  getAllProviders,
  supportsCors,
  validateKeyFormat,
  estimateCost,
  getDefaultModel,
} from './providers-config.js';

describe('Providers Config', () => {
  describe('PROVIDERS constant', () => {
    it('should have all expected providers', () => {
      expect(PROVIDERS).toHaveProperty('openrouter');
      expect(PROVIDERS).toHaveProperty('openai');
      expect(PROVIDERS).toHaveProperty('anthropic');
      expect(PROVIDERS).toHaveProperty('google');
      expect(PROVIDERS).toHaveProperty('xai');
    });

    it('should have required properties for each provider', () => {
      const requiredProps = [
        'id',
        'name',
        'description',
        'cors',
        'keyPrefix',
        'keyPattern',
        'docsUrl',
        'models',
        'defaultModel',
      ];

      Object.values(PROVIDERS).forEach((provider) => {
        requiredProps.forEach((prop) => {
          expect(provider).toHaveProperty(prop);
        });
      });
    });

    it('should have at least one model for each provider', () => {
      Object.values(PROVIDERS).forEach((provider) => {
        expect(provider.models.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getProvider', () => {
    it('should return provider by ID', () => {
      const provider = getProvider('openai');
      expect(provider).not.toBeNull();
      expect(provider.name).toBe('OpenAI');
    });

    it('should return openrouter provider', () => {
      const provider = getProvider('openrouter');
      expect(provider).not.toBeNull();
      expect(provider.name).toBe('OpenRouter');
    });

    it('should return null for unknown provider', () => {
      expect(getProvider('unknown')).toBeNull();
      expect(getProvider('')).toBeNull();
      expect(getProvider(null)).toBeNull();
    });
  });

  describe('getAllProviders', () => {
    it('should return all providers as array', () => {
      const providers = getAllProviders();
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBe(5);
    });

    it('should include all provider IDs', () => {
      const providers = getAllProviders();
      const ids = providers.map((p) => p.id);
      expect(ids).toContain('openrouter');
      expect(ids).toContain('openai');
      expect(ids).toContain('anthropic');
      expect(ids).toContain('google');
      expect(ids).toContain('xai');
    });
  });

  describe('supportsCors', () => {
    it('should return true for OpenRouter', () => {
      expect(supportsCors('openrouter')).toBe(true);
    });

    it('should return false for other providers', () => {
      expect(supportsCors('openai')).toBe(false);
      expect(supportsCors('anthropic')).toBe(false);
      expect(supportsCors('google')).toBe(false);
      expect(supportsCors('xai')).toBe(false);
    });

    it('should return false for unknown provider', () => {
      expect(supportsCors('unknown')).toBe(false);
    });
  });

  describe('validateKeyFormat', () => {
    describe('OpenRouter', () => {
      it('should validate correct OpenRouter key format', () => {
        expect(validateKeyFormat('openrouter', 'sk-or-v1-abc123')).toBe(true);
        expect(validateKeyFormat('openrouter', 'sk-or-v1-ABC123xyz')).toBe(true);
      });

      it('should reject invalid OpenRouter key format', () => {
        expect(validateKeyFormat('openrouter', 'invalid')).toBe(false);
        expect(validateKeyFormat('openrouter', 'sk-or-abc123')).toBe(false);
        expect(validateKeyFormat('openrouter', 'sk-abc123')).toBe(false);
      });
    });

    describe('OpenAI', () => {
      it('should validate correct OpenAI key format', () => {
        expect(validateKeyFormat('openai', 'sk-abc123')).toBe(true);
        expect(validateKeyFormat('openai', 'sk-ABC123xyz789')).toBe(true);
      });

      it('should validate OpenAI keys with dashes and underscores', () => {
        // Modern OpenAI keys use project-based format with dashes and underscores
        expect(validateKeyFormat('openai', 'sk-proj-abc123')).toBe(true);
        expect(
          validateKeyFormat(
            'openai',
            'sk-proj-IECUDl2KJ3xt39dcy2-GP1WOKEH8_8w1O9Esr0um0k77JlJsgQqw7xxw0z9npO4h'
          )
        ).toBe(true);
      });

      it('should reject invalid OpenAI key format', () => {
        expect(validateKeyFormat('openai', 'invalid')).toBe(false);
        expect(validateKeyFormat('openai', 'abc123')).toBe(false);
      });
    });

    describe('Anthropic', () => {
      it('should validate correct Anthropic key format', () => {
        expect(validateKeyFormat('anthropic', 'sk-ant-abc123')).toBe(true);
        expect(validateKeyFormat('anthropic', 'sk-ant-ABC-123-xyz')).toBe(true);
      });

      it('should validate Anthropic keys with underscores', () => {
        // Real Anthropic keys often contain underscores
        expect(validateKeyFormat('anthropic', 'sk-ant-api03-abc_def-123')).toBe(true);
        expect(
          validateKeyFormat(
            'anthropic',
            'sk-ant-api03-meDm-eUBehBLfyR54fY2zcDMeS-a5iAEsz6SHap2JJDl3wK7fa_Mo0Ui9xv7'
          )
        ).toBe(true);
      });

      it('should reject invalid Anthropic key format', () => {
        expect(validateKeyFormat('anthropic', 'invalid')).toBe(false);
        expect(validateKeyFormat('anthropic', 'sk-abc123')).toBe(false);
      });
    });

    describe('Google', () => {
      it('should validate correct Google key format', () => {
        expect(validateKeyFormat('google', 'AIzaABC123xyz')).toBe(true);
        expect(validateKeyFormat('google', 'AIza_test-key_123')).toBe(true);
      });

      it('should reject invalid Google key format', () => {
        expect(validateKeyFormat('google', 'invalid')).toBe(false);
        expect(validateKeyFormat('google', 'AIza')).toBe(false);
      });
    });

    describe('xAI', () => {
      it('should validate correct xAI key format', () => {
        expect(validateKeyFormat('xai', 'xai-abc123')).toBe(true);
        expect(validateKeyFormat('xai', 'xai-ABC123xyz')).toBe(true);
      });

      it('should reject invalid xAI key format', () => {
        expect(validateKeyFormat('xai', 'invalid')).toBe(false);
        expect(validateKeyFormat('xai', 'xai-')).toBe(false);
      });
    });

    it('should return false for unknown provider', () => {
      expect(validateKeyFormat('unknown', 'anykey')).toBe(false);
    });
  });

  describe('estimateCost', () => {
    it('should calculate cost correctly for OpenAI gpt-4o-mini', () => {
      // gpt-4o-mini: inputPrice: 0.15, outputPrice: 0.6 per 1M tokens
      const cost = estimateCost('openai', 'gpt-4o-mini', 1000, 500);

      // Input: 1000 / 1,000,000 * 0.15 = 0.00015
      expect(cost.inputCost).toBeCloseTo(0.00015, 6);

      // Output: 500 / 1,000,000 * 0.6 = 0.0003
      expect(cost.outputCost).toBeCloseTo(0.0003, 6);

      // Total: 0.00015 + 0.0003 = 0.00045
      expect(cost.totalCost).toBeCloseTo(0.00045, 6);
    });

    it('should calculate cost correctly for free models', () => {
      const cost = estimateCost('openrouter', 'google/gemini-2.0-flash-exp:free', 10000, 5000);

      expect(cost.inputCost).toBe(0);
      expect(cost.outputCost).toBe(0);
      expect(cost.totalCost).toBe(0);
    });

    it('should return null for unknown provider', () => {
      expect(estimateCost('unknown', 'some-model', 1000, 500)).toBeNull();
    });

    it('should return null for unknown model', () => {
      expect(estimateCost('openai', 'unknown-model', 1000, 500)).toBeNull();
    });
  });

  describe('getDefaultModel', () => {
    it('should return default model for openrouter', () => {
      expect(getDefaultModel('openrouter')).toBe('anthropic/claude-3.5-sonnet');
    });

    it('should return default model for openai', () => {
      expect(getDefaultModel('openai')).toBe('gpt-4o-mini');
    });

    it('should return default model for anthropic', () => {
      expect(getDefaultModel('anthropic')).toBe('claude-sonnet-4-20250514');
    });

    it('should return default model for google', () => {
      expect(getDefaultModel('google')).toBe('gemini-2.5-flash');
    });

    it('should return default model for xai', () => {
      expect(getDefaultModel('xai')).toBe('grok-3-fast');
    });

    it('should return null for unknown provider', () => {
      expect(getDefaultModel('unknown')).toBeNull();
    });
  });
});
