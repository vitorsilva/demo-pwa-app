/**
 * OpenRouter OAuth PKCE Authentication
 *
 * PKCE Flow:
 * 1. Generate code_verifier (random string, stays in browser)
 * 2. Generate code_challenge (SHA-256 hash of verifier)
 * 3. Redirect user to OpenRouter with code_challenge
 * 4. User authorizes, comes back with authorization code
 * 5. Exchange code + code_verifier for API key
 */

import { logger } from '../utils/logger.js';

const OPENROUTER_AUTH_URL = 'https://openrouter.ai/auth';
const OPENROUTER_KEY_URL = 'https://openrouter.ai/api/v1/auth/keys';

// Callback URL - where OpenRouter sends the user after login
const CALLBACK_URL = window.location.origin + '/app/auth/callback';

/**
 * Generate a random code_verifier for PKCE
 * Must be 43-128 characters, URL-safe
 */
export function generateCodeVerifier() {
  // Create 32 random bytes
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);

  // Convert to base64, then make URL-safe
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-') // + becomes -
    .replace(/\//g, '_') // / becomes _
    .replace(/=/g, ''); // remove padding
}

/**
 * Generate code_challenge from code_verifier
 * This is a SHA-256 hash, base64url encoded
 */
export async function generateCodeChallenge(verifier) {
  // Convert string to bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);

  // Hash with SHA-256
  const hash = await crypto.subtle.digest('SHA-256', data);

  // Convert hash to base64url
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Start OAuth PKCE flow
 * Redirects user to OpenRouter for authentication
 */
export async function startAuth() {
  // Step 1: Generate PKCE values
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Step 2: Store verifier for later (we'll need it after redirect)
  sessionStorage.setItem('openrouter_code_verifier', codeVerifier);

  // Step 3: Build the authorization URL
  const authUrl = new URL(OPENROUTER_AUTH_URL);
  authUrl.searchParams.set('callback_url', CALLBACK_URL);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  // Step 4: Redirect to OpenRouter
  window.location.href = authUrl.toString();
}

export async function handleCallback() {
  logger.debug('OAuth handleCallback called');

  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  logger.debug('Authorization code check', { found: !!code });

  if (!code) {
    throw new Error('No authorization code found in URL');
  }

  const codeVerifier = sessionStorage.getItem('openrouter_code_verifier');

  logger.debug('Code verifier check', { found: !!codeVerifier });

  if (!codeVerifier) {
    throw new Error('No code verifier found. Please try logging in again.');
  }

  logger.debug('Exchanging code for API key');

  const response = await fetch(OPENROUTER_KEY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: code,
      code_verifier: codeVerifier,
      code_challenge_method: 'S256',
    }),
  });

  logger.debug('Token exchange response', { status: response.status });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    logger.error('Token exchange failed', { status: response.status });
    throw new Error(error.message || 'Failed to exchange code for API key');
  }

  const data = await response.json();

  logger.debug('API key received', { success: !!data.key });

  sessionStorage.removeItem('openrouter_code_verifier');
  window.history.replaceState({}, '', window.location.pathname);

  return data.key;
}

/**
 * Check if current URL is an OAuth callback
 * Used by router to detect when user returns from OpenRouter
 */
export function isAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('code');
}
