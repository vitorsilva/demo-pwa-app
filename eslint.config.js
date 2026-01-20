import js from '@eslint/js';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  js.configs.recommended,
  sonarjs.configs.recommended,
  {
    languageOptions: {
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        sessionStorage: 'readonly',
        localStorage: 'readonly',
        crypto: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        HTMLElement: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        AbortController: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        Image: 'readonly',
        Audio: 'readonly',
        MediaRecorder: 'readonly',
        RTCPeerConnection: 'readonly',
        RTCSessionDescription: 'readonly',
        RTCIceCandidate: 'readonly',
        WebSocket: 'readonly',
        Worker: 'readonly',
        ServiceWorker: 'readonly',
        BroadcastChannel: 'readonly',
        indexedDB: 'readonly',
        queueMicrotask: 'readonly',
        structuredClone: 'readonly',
        // Common patterns
        globalThis: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        ClipboardItem: 'readonly',
        RTCDataChannel: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
      }
    },
    rules: {
      // Allow unused vars prefixed with _ (common pattern for intentionally unused params)
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      // Disable SonarJS duplicate rule (ESLint's no-unused-vars handles it)
      'sonarjs/no-unused-vars': 'off',

      // Complexity thresholds - review violations periodically
      'complexity': ['warn', 10],
      'max-depth': ['warn', 4],
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-params': ['warn', 4],

      // SonarJS cognitive complexity
      'sonarjs/cognitive-complexity': ['warn', 15],

      // Downgrade some rules that are too strict for this codebase
      'sonarjs/pseudo-random': 'warn', // Math.random is fine for non-crypto uses
    }
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.test.js',
      '**/*.spec.js',
      'php-api/**',
      'scripts/**',
      'public/**',
    ]
  }
];
