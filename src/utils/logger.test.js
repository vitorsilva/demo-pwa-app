import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock loglevel - factory must be self-contained (no external references)
vi.mock('loglevel', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setLevel: vi.fn(),
    getLevel: vi.fn(),
  },
}));

// Import after mock
import { logger } from './logger.js';
import log from 'loglevel';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('log levels', () => {
    it('should log debug messages', () => {
      logger.debug('Test debug');
      expect(log.debug).toHaveBeenCalledWith('[DEBUG] Test debug');
    });

    it('should log info messages', () => {
      logger.info('Test info');
      expect(log.info).toHaveBeenCalledWith('[INFO] Test info');
    });

    it('should log warn messages', () => {
      logger.warn('Test warn');
      expect(log.warn).toHaveBeenCalledWith('[WARN] Test warn');
    });

    it('should log error messages', () => {
      logger.error('Test error');
      expect(log.error).toHaveBeenCalledWith('[ERROR] Test error');
    });
  });

  describe('context handling', () => {
    it('should include context in logs', () => {
      logger.info('Test', { userId: '123' });
      expect(log.info).toHaveBeenCalledWith(
        '[INFO] Test',
        expect.objectContaining({ userId: '123' })
      );
    });

    it('should handle empty context', () => {
      logger.info('No context');
      expect(log.info).toHaveBeenCalledWith('[INFO] No context');
    });
  });

  describe('sensitive data redaction', () => {
    it('should redact apiKey', () => {
      logger.info('Settings', { apiKey: 'sk-secret-123' });
      expect(log.info).toHaveBeenCalledWith(
        '[INFO] Settings',
        expect.objectContaining({ apiKey: '[REDACTED]' })
      );
    });

    it('should redact token', () => {
      logger.info('Auth', { token: 'bearer-xyz' });
      expect(log.info).toHaveBeenCalledWith(
        '[INFO] Auth',
        expect.objectContaining({ token: '[REDACTED]' })
      );
    });

    it('should redact password', () => {
      logger.info('Login', { password: 'secret123' });
      expect(log.info).toHaveBeenCalledWith(
        '[INFO] Login',
        expect.objectContaining({ password: '[REDACTED]' })
      );
    });

    it('should redact nested sensitive data', () => {
      logger.info('Config', {
        user: { name: 'John', secretKey: 'abc123' },
      });
      expect(log.info).toHaveBeenCalledWith(
        '[INFO] Config',
        expect.objectContaining({
          user: expect.objectContaining({
            name: 'John',
            secretKey: '[REDACTED]',
          }),
        })
      );
    });

    it('should not redact non-sensitive data', () => {
      logger.info('Quiz', { topic: 'Math', score: 5 });
      expect(log.info).toHaveBeenCalledWith(
        '[INFO] Quiz',
        expect.objectContaining({ topic: 'Math', score: 5 })
      );
    });
  });

  describe('special methods', () => {
    it('should log performance metrics', () => {
      logger.perf('Page Load', { duration: 234 });
      expect(log.info).toHaveBeenCalledWith(
        '[INFO] [PERF] Page Load',
        expect.objectContaining({ duration: 234 })
      );
    });

    it('should log user actions', () => {
      logger.action('Quiz Started', { topic: 'Math' });
      expect(log.debug).toHaveBeenCalledWith(
        '[DEBUG] [ACTION] Quiz Started',
        expect.objectContaining({ topic: 'Math' })
      );
    });

    it('should log perf without data', () => {
      logger.perf('Simple Metric');
      expect(log.info).toHaveBeenCalledWith('[INFO] [PERF] Simple Metric');
    });

    it('should log action without data', () => {
      logger.action('Simple Action');
      expect(log.debug).toHaveBeenCalledWith('[DEBUG] [ACTION] Simple Action');
    });
  });

  describe('child logger', () => {
    it('should create child logger with module prefix', () => {
      const child = logger.child({ module: 'TestModule' });

      child.info('Child message');

      expect(log.info).toHaveBeenCalledWith('[INFO] [TestModule] Child message');
    });

    it('should prefix debug messages', () => {
      const child = logger.child({ module: 'Auth' });

      child.debug('Debug message', { detail: 'value' });

      expect(log.debug).toHaveBeenCalledWith(
        '[DEBUG] [Auth] Debug message',
        expect.objectContaining({ detail: 'value' })
      );
    });

    it('should prefix warn messages', () => {
      const child = logger.child({ module: 'Network' });

      child.warn('Warning message');

      expect(log.warn).toHaveBeenCalledWith('[WARN] [Network] Warning message');
    });

    it('should prefix error messages', () => {
      const child = logger.child({ module: 'DB' });

      child.error('Error message');

      expect(log.error).toHaveBeenCalledWith('[ERROR] [DB] Error message');
    });

    it('should prefix perf messages', () => {
      const child = logger.child({ module: 'API' });

      child.perf('Request Time', { ms: 100 });

      expect(log.info).toHaveBeenCalledWith(
        '[INFO] [PERF] [API] Request Time',
        expect.objectContaining({ ms: 100 })
      );
    });

    it('should prefix action messages', () => {
      const child = logger.child({ module: 'UI' });

      child.action('Button Click');

      expect(log.debug).toHaveBeenCalledWith('[DEBUG] [ACTION] [UI] Button Click');
    });

    it('should pass context to child methods', () => {
      const child = logger.child({ module: 'Quiz' });

      child.info('Started', { quizId: 123 });

      expect(log.info).toHaveBeenCalledWith(
        '[INFO] [Quiz] Started',
        expect.objectContaining({ quizId: 123 })
      );
    });
  });

  describe('getLevel and setLevel', () => {
    it('should get current log level', () => {
      log.getLevel.mockReturnValue(2);

      const level = logger.getLevel();

      expect(log.getLevel).toHaveBeenCalled();
      expect(level).toBe(2);
    });

    it('should set log level', () => {
      logger.setLevel('debug');

      expect(log.setLevel).toHaveBeenCalledWith('debug');
    });

    it('should set log level to warn', () => {
      logger.setLevel('warn');

      expect(log.setLevel).toHaveBeenCalledWith('warn');
    });
  });

  describe('sensitive data redaction edge cases', () => {
    it('should redact authorization header', () => {
      logger.info('Request', { authorization: 'Bearer xyz' });

      expect(log.info).toHaveBeenCalledWith(
        '[INFO] Request',
        expect.objectContaining({ authorization: '[REDACTED]' })
      );
    });

    it('should redact key in any position', () => {
      logger.info('Settings', { myKey: 'sensitive' });

      expect(log.info).toHaveBeenCalledWith(
        '[INFO] Settings',
        expect.objectContaining({ myKey: '[REDACTED]' })
      );
    });

    it('should redact secret variations', () => {
      logger.info('Config', { clientSecret: 'abc123' });

      expect(log.info).toHaveBeenCalledWith(
        '[INFO] Config',
        expect.objectContaining({ clientSecret: '[REDACTED]' })
      );
    });

    it('should handle deeply nested sensitive data', () => {
      logger.info('Deep', {
        level1: {
          level2: {
            level3: {
              apiKey: 'secret',
            },
          },
        },
      });

      expect(log.info).toHaveBeenCalledWith(
        '[INFO] Deep',
        expect.objectContaining({
          level1: expect.objectContaining({
            level2: expect.objectContaining({
              level3: expect.objectContaining({
                apiKey: '[REDACTED]',
              }),
            }),
          }),
        })
      );
    });

    it('should handle array with sensitive data', () => {
      logger.info('Array', {
        items: [
          { name: 'item1', token: 'secret1' },
          { name: 'item2', token: 'secret2' },
        ],
      });

      expect(log.info).toHaveBeenCalledWith(
        '[INFO] Array',
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ name: 'item1', token: '[REDACTED]' }),
            expect.objectContaining({ name: 'item2', token: '[REDACTED]' }),
          ]),
        })
      );
    });

    it('should handle null context', () => {
      logger.info('Null context', null);

      expect(log.info).toHaveBeenCalledWith('[INFO] Null context');
    });

    it('should handle primitive context values', () => {
      logger.info('Primitive', 'string value');

      // Should just return the primitive
      expect(log.info).toHaveBeenCalledWith('[INFO] Primitive', 'string value');
    });

    it('should handle numeric context values as no context', () => {
      // Numbers are not valid context objects, so they are treated as empty
      logger.info('Number', 42);

      // formatContext returns 42 which is truthy but has no keys, so it's logged without context
      expect(log.info).toHaveBeenCalledWith('[INFO] Number');
    });

    it('should handle boolean context values as no context', () => {
      // Booleans are not valid context objects, so they are treated as empty
      logger.info('Boolean', true);

      expect(log.info).toHaveBeenCalledWith('[INFO] Boolean');
    });

    it('should preserve array structure during redaction', () => {
      logger.info('Array', [1, 2, 3]);

      expect(log.info).toHaveBeenCalledWith('[INFO] Array', [1, 2, 3]);
    });

    it('should handle mixed array with objects', () => {
      logger.info('Mixed', [{ apiKey: 'secret' }, 'string', 123]);

      const call = log.info.mock.calls[0];
      expect(call[1][0]).toEqual({ apiKey: '[REDACTED]' });
      expect(call[1][1]).toBe('string');
      expect(call[1][2]).toBe(123);
    });
  });

  describe('formatContext edge cases', () => {
    it('should return empty string for undefined context', () => {
      logger.debug('No context', undefined);

      expect(log.debug).toHaveBeenCalledWith('[DEBUG] No context');
    });

    it('should return empty string for empty object', () => {
      logger.debug('Empty object', {});

      expect(log.debug).toHaveBeenCalledWith('[DEBUG] Empty object');
    });

    it('should format non-empty object', () => {
      // Note: 'key' contains the sensitive word 'key', so use a different property name
      logger.debug('With data', { name: 'value' });

      expect(log.debug).toHaveBeenCalledWith(
        '[DEBUG] With data',
        expect.objectContaining({ name: 'value' })
      );
    });
  });
});
