import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the logger module
vi.mock('../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import {
  generateCodeVerifier,
  generateCodeChallenge,
  isAuthCallback,
  startAuth,
  handleCallback,
} from './openrouter-auth.js';
import { logger } from '../utils/logger.js';

describe('OpenRouter Auth', () => {
  describe('generateCodeVerifier', () => {
    it('should return a string', () => {
      const verifier = generateCodeVerifier();
      expect(typeof verifier).toBe('string');
    });

    it('should be 43 characters long', () => {
      // 32 bytes → base64 = 44 chars, minus 1 padding = 43
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBe(43);
    });

    it('should only contain URL-safe characters', () => {
      const verifier = generateCodeVerifier();
      // URL-safe base64: a-z, A-Z, 0-9, -, _
      const urlSafePattern = /^[A-Za-z0-9_-]+$/;
      expect(verifier).toMatch(urlSafePattern);
    });

    it('should generate different values each time', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      expect(verifier1).not.toBe(verifier2);
    });
  });

  describe('generateCodeChallenge', () => {
    it('should return a string', async () => {
      const verifier = 'test-verifier-string-for-testing';
      const challenge = await generateCodeChallenge(verifier);
      expect(typeof challenge).toBe('string');
    });

    it('should be 43 characters long', async () => {
      // SHA-256 = 32 bytes → base64 = 43 chars without padding
      const verifier = 'test-verifier-string-for-testing';
      const challenge = await generateCodeChallenge(verifier);
      expect(challenge.length).toBe(43);
    });

    it('should only contain URL-safe characters', async () => {
      const verifier = 'test-verifier-string-for-testing';
      const challenge = await generateCodeChallenge(verifier);
      const urlSafePattern = /^[A-Za-z0-9_-]+$/;
      expect(challenge).toMatch(urlSafePattern);
    });

    it('should produce consistent output for same input', async () => {
      const verifier = 'consistent-test-verifier';
      const challenge1 = await generateCodeChallenge(verifier);
      const challenge2 = await generateCodeChallenge(verifier);
      expect(challenge1).toBe(challenge2);
    });

    it('should produce different output for different input', async () => {
      const challenge1 = await generateCodeChallenge('verifier-one');
      const challenge2 = await generateCodeChallenge('verifier-two');
      expect(challenge1).not.toBe(challenge2);
    });
  });

  describe('isAuthCallback', () => {
    const originalLocation = window.location;

    beforeEach(() => {
      // Mock window.location
      delete window.location;
    });

    afterEach(() => {
      // Restore window.location
      window.location = originalLocation;
    });

    it('should return true when URL has code parameter', () => {
      window.location = { search: '?code=abc123' };
      expect(isAuthCallback()).toBe(true);
    });

    it('should return false when URL has no code parameter', () => {
      window.location = { search: '' };
      expect(isAuthCallback()).toBe(false);
    });

    it('should return false when URL has other parameters but no code', () => {
      window.location = { search: '?state=xyz&redirect=home' };
      expect(isAuthCallback()).toBe(false);
    });

    it('should return true when code is among multiple parameters', () => {
      window.location = { search: '?state=xyz&code=abc123&other=value' };
      expect(isAuthCallback()).toBe(true);
    });
  });

  describe('startAuth', () => {
    const originalLocation = window.location;
    let sessionStorageSetItemSpy;

    beforeEach(() => {
      vi.clearAllMocks();
      // Mock window.location
      delete window.location;
      window.location = {
        href: '',
        origin: 'https://saberloop.com',
      };
      // Spy on sessionStorage
      sessionStorageSetItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    });

    afterEach(() => {
      window.location = originalLocation;
      sessionStorageSetItemSpy.mockRestore();
    });

    it('should store code verifier in sessionStorage', async () => {
      await startAuth();

      expect(sessionStorageSetItemSpy).toHaveBeenCalledWith(
        'openrouter_code_verifier',
        expect.any(String)
      );
    });

    it('should store a valid code verifier (43 chars, URL-safe)', async () => {
      await startAuth();

      const storedVerifier = sessionStorageSetItemSpy.mock.calls[0][1];
      expect(storedVerifier.length).toBe(43);
      expect(storedVerifier).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should redirect to OpenRouter auth URL', async () => {
      await startAuth();

      expect(window.location.href).toContain('https://openrouter.ai/auth');
    });

    it('should include code_challenge parameter in redirect URL', async () => {
      await startAuth();

      expect(window.location.href).toContain('code_challenge=');
    });

    it('should include code_challenge_method=S256 in redirect URL', async () => {
      await startAuth();

      expect(window.location.href).toContain('code_challenge_method=S256');
    });

    it('should include callback_url in redirect URL', async () => {
      await startAuth();

      expect(window.location.href).toContain('callback_url=');
      expect(window.location.href).toContain(encodeURIComponent('/app/auth/callback'));
    });
  });

  describe('handleCallback', () => {
    const originalLocation = window.location;
    const originalHistory = window.history;
    let sessionStorageGetItemSpy;
    let sessionStorageRemoveItemSpy;
    let originalFetch;

    beforeEach(() => {
      vi.clearAllMocks();

      // Mock window.location
      delete window.location;
      window.location = {
        search: '?code=test-auth-code-123',
        pathname: '/app/auth/callback',
      };

      // Mock window.history
      window.history = {
        replaceState: vi.fn(),
      };

      // Spy on sessionStorage
      sessionStorageGetItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      sessionStorageRemoveItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

      // Store original fetch
      originalFetch = global.fetch;
    });

    afterEach(() => {
      window.location = originalLocation;
      window.history = originalHistory;
      sessionStorageGetItemSpy.mockRestore();
      sessionStorageRemoveItemSpy.mockRestore();
      global.fetch = originalFetch;
    });

    it('should throw error if no code in URL', async () => {
      window.location.search = '';

      await expect(handleCallback()).rejects.toThrow('No authorization code found in URL');
    });

    it('should throw error if no code verifier in sessionStorage', async () => {
      sessionStorageGetItemSpy.mockReturnValue(null);

      await expect(handleCallback()).rejects.toThrow('No code verifier found');
    });

    it('should call fetch with correct URL and body', async () => {
      sessionStorageGetItemSpy.mockReturnValue('test-code-verifier');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ key: 'sk-or-test-key' }),
      });

      await handleCallback();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/auth/keys',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('test-auth-code-123'),
        })
      );
    });

    it('should include code_verifier in request body', async () => {
      sessionStorageGetItemSpy.mockReturnValue('my-test-verifier');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ key: 'sk-or-test-key' }),
      });

      await handleCallback();

      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.code_verifier).toBe('my-test-verifier');
      expect(body.code_challenge_method).toBe('S256');
    });

    it('should return API key on successful exchange', async () => {
      sessionStorageGetItemSpy.mockReturnValue('test-verifier');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ key: 'sk-or-returned-key' }),
      });

      const key = await handleCallback();

      expect(key).toBe('sk-or-returned-key');
    });

    it('should throw error with message from failed response', async () => {
      sessionStorageGetItemSpy.mockReturnValue('test-verifier');
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Invalid authorization code' }),
      });

      await expect(handleCallback()).rejects.toThrow('Invalid authorization code');
    });

    it('should throw generic error if response has no message', async () => {
      sessionStorageGetItemSpy.mockReturnValue('test-verifier');
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(handleCallback()).rejects.toThrow('Failed to exchange code for API key');
    });

    it('should handle JSON parse error in error response', async () => {
      sessionStorageGetItemSpy.mockReturnValue('test-verifier');
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(handleCallback()).rejects.toThrow('Failed to exchange code for API key');
    });

    it('should remove code verifier from sessionStorage after success', async () => {
      sessionStorageGetItemSpy.mockReturnValue('test-verifier');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ key: 'sk-or-test-key' }),
      });

      await handleCallback();

      expect(sessionStorageRemoveItemSpy).toHaveBeenCalledWith('openrouter_code_verifier');
    });

    it('should clean URL by calling history.replaceState', async () => {
      sessionStorageGetItemSpy.mockReturnValue('test-verifier');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ key: 'sk-or-test-key' }),
      });

      await handleCallback();

      expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '/app/auth/callback');
    });

    it('should log debug messages during callback flow', async () => {
      sessionStorageGetItemSpy.mockReturnValue('test-verifier');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ key: 'sk-or-test-key' }),
      });

      await handleCallback();

      expect(logger.debug).toHaveBeenCalledWith('OAuth handleCallback called');
      expect(logger.debug).toHaveBeenCalledWith('Authorization code check', { found: true });
      expect(logger.debug).toHaveBeenCalledWith('Code verifier check', { found: true });
      expect(logger.debug).toHaveBeenCalledWith('Exchanging code for API key');
    });
  });
});
