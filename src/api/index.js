import { logger } from '../utils/logger.js';

const USE_REAL_API =
  import.meta.env.VITE_USE_REAL_API === 'false'
    ? false
    : import.meta.env.PROD || import.meta.env.VITE_USE_REAL_API === 'true';

let api;

if (USE_REAL_API) {
  api = await import('./api.real.js');
  logger.info('Using real API via OpenRouter');
} else {
  api = await import('./api.mock.js');
  logger.info('Using mock API (development mode)');
}

export const { generateQuestions } = api;
/** @public */
export const { generateExplanation } = api;
export const { generateWrongAnswerExplanation } = api;
