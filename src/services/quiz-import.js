/**
 * Quiz Import Service
 * Handles importing quizzes from shared URLs.
 */

import { deserializeQuiz } from './quiz-serializer.js';
import { saveSession } from '../core/db.js';
import { telemetry } from '../utils/telemetry.js';

/**
 * Imports a quiz from a shared URL hash.
 * Decodes, validates, and prepares the quiz for use.
 *
 * @param {string} encodedData - The encoded quiz data from URL hash
 * @returns {Promise<{success: boolean, quiz?: Object, error?: string}>}
 *
 * @example
 * const result = await importQuizFromUrl(window.location.hash.slice(1));
 * if (result.success) {
 *   // Show preview or start quiz
 * }
 */
export async function importQuizFromUrl(encodedData) {
  telemetry.track('event', { name: 'quiz_import_started' });

  // Use deserializer to decode
  const result = deserializeQuiz(encodedData);

  if (!result.success) {
    telemetry.track('event', { name: 'quiz_import_failed', error: result.error });
    return { success: false, error: result.error };
  }

  const quiz = result.quiz;

  // Add import metadata
  quiz.isImported = true;
  quiz.importedAt = Date.now();
  quiz.originalCreator = quiz.creator || 'Anonymous';
  quiz.mode = quiz.mode || 'learning';

  // Remove creator from quiz object (it's now in originalCreator)
  delete quiz.creator;

  telemetry.track('event', {
    name: 'quiz_import_parsed',
    questionCount: quiz.questions.length,
    topic: quiz.topic,
  });

  return { success: true, quiz };
}

/**
 * Saves an imported quiz to IndexedDB.
 * Generates a new local ID and timestamp.
 *
 * @param {Object} quiz - The validated quiz object from importQuizFromUrl
 * @returns {Promise<{success: boolean, id?: number, error?: string}>}
 */
export async function saveImportedQuiz(quiz) {
  try {
    // Prepare session data for IndexedDB
    const session = {
      ...quiz,
      timestamp: Date.now(),
      userAnswers: [],
      score: 0,
      totalQuestions: quiz.questions.length,
    };

    // Save to IndexedDB (returns auto-generated ID)
    const id = await saveSession(session);

    telemetry.track('event', { name: 'quiz_import_saved', id, topic: quiz.topic });

    return { success: true, id };
  } catch (err) {
    telemetry.track('event', { name: 'quiz_import_save_failed', error: err.message });
    return { success: false, error: err.message };
  }
}
