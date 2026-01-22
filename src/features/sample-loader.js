import { getSetting, saveSetting, saveSession, deleteSampleSessions } from '../core/db.js';
import sampleData from '../data/sample-quizzes.json';
import { logger } from '../utils/logger.js';

const SAMPLES_VERSION_KEY = 'samplesVersion';

/**
 * Load sample quizzes into IndexedDB if not already loaded
 * or if the samples version has changed.
 */
export async function loadSamplesIfNeeded() {
  const storedVersion = await getSetting(SAMPLES_VERSION_KEY);
  const currentVersion = sampleData.version;

  if (storedVersion === currentVersion) {
    logger.debug('Samples already loaded', { version: storedVersion });
    return;
  }

  logger.debug('Loading samples', { version: currentVersion });

  // Clear old samples before loading new ones
  await deleteSampleSessions();

  // Load each sample quiz into the sessions store
  for (const sample of sampleData.samples) {
    const session = {
      topic: sample.topic,
      gradeLevel: sample.gradeLevel,
      totalQuestions: sample.totalQuestions,
      questions: sample.questions,
      isSample: true,
      answers: null,
      score: null,
      timestamp: 0,
    };

    try {
      await saveSession(session);
      logger.debug('Sample loaded', { topic: sample.topic });
    } catch (error) {
      logger.error('Failed to load sample', { topic: sample.topic, error: error.message });
    }
  }

  await saveSetting(SAMPLES_VERSION_KEY, currentVersion);
  logger.info('All samples loaded successfully');
}
