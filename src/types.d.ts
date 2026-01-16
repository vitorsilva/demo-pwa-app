/**
 * Global type declarations for the Saberloop app.
 */

import type Router from './core/router.js';

declare global {
  interface Window {
    /** Router instance exposed for E2E testing (dev/localhost only) */
    __router?: Router;
  }
}

export {};
