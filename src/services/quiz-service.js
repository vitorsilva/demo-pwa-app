/**
 * Quiz Service - Business logic for quiz operations
 * Views should use this instead of importing db or api directly
 */
import { getRecentSessions, getSession, saveSession, updateSession, deleteSession, updateQuestionExplanation as dbUpdateQuestionExplanation, quizExistsBySourceId as dbQuizExistsBySourceId } from '../core/db.js';
import { generateQuestions as apiGenerateQuestions, generateExplanation as apiGenerateExplanation, generateWrongAnswerExplanation as apiGenerateWrongAnswerExplanation } from '../api/index.js';

/**
 * Get quiz history (recent sessions)
 * @param {number} limit - Maximum sessions to return
 * @returns {Promise<Array>} Recent quiz sessions
 */
export async function getQuizHistory(limit = 10) {
  return getRecentSessions(limit);
}

/**
 * Get a specific quiz session by ID
 * @param {number} id - Session ID
 * @returns {Promise<Object|null>} Quiz session or null
 */
export async function getQuizSession(id) {
  return getSession(id);
}

/**
 * Save a new quiz session
 * @param {Object} sessionData - Quiz session data
 * @returns {Promise<number>} New session ID
 */
export async function saveQuizSession(sessionData) {
  return saveSession(sessionData);
}

/**
 * Update an existing quiz session
 * @param {number} id - Session ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateQuizSession(id, updates) {
  return updateSession(id, updates);
}

/**
 * Generate quiz questions using AI
 * @param {string} topic - Quiz topic
 * @param {string} gradeLevel - Education level
 * @param {string} apiKey - OpenRouter API key
 * @param {Object} [options] - Optional settings
 * @param {Array<string>} [options.previousQuestions] - Questions to exclude (for continue feature)
 * @param {string} [options.language] - Language code for content generation (e.g., 'en', 'pt-PT')
 * @param {number} [options.questionCount] - Number of questions to generate (default: 5)
 * @returns {Promise<{language: string, questions: Array, model: string, usage: {promptTokens: number, completionTokens: number, totalTokens: number, costUsd: number}}>}
 */
export async function generateQuestions(topic, gradeLevel, apiKey, options = {}) {
  return apiGenerateQuestions(topic, gradeLevel, apiKey, options);
}

/**
 * Generate a structured explanation for an incorrect answer.
 * Returns both the general explanation (cacheable) and personalized feedback.
 * @param {string} question - The question text
 * @param {string} userAnswer - User's incorrect answer
 * @param {string} correctAnswer - The correct answer
 * @param {Object} options - Configuration options
 * @param {string} [options.gradeLevel] - Education level
 * @param {string} options.apiKey - OpenRouter API key (required)
 * @param {string} [options.language='en'] - Language code for the explanation
 * @returns {Promise<{rightAnswerExplanation: string, wrongAnswerExplanation: string}>} Structured explanation
 */
export async function generateExplanation(question, userAnswer, correctAnswer, { gradeLevel, apiKey, language = 'en' } = {}) {
  return apiGenerateExplanation(question, userAnswer, correctAnswer, { gradeLevel, apiKey, language });
}

/**
 * Generate only the wrong answer explanation (when right answer explanation is already cached).
 * @param {string} question - The question text
 * @param {string} userAnswer - User's incorrect answer
 * @param {string} correctAnswer - The correct answer
 * @param {Object} options - Configuration options
 * @param {string} [options.gradeLevel] - Education level
 * @param {string} options.apiKey - OpenRouter API key (required)
 * @param {string} [options.language='en'] - Language code for the explanation
 * @returns {Promise<string>} Wrong answer explanation text
 */
export async function generateWrongAnswerExplanation(question, userAnswer, correctAnswer, { gradeLevel, apiKey, language = 'en' } = {}) {
  return apiGenerateWrongAnswerExplanation(question, userAnswer, correctAnswer, { gradeLevel, apiKey, language });
}

/**
 * Update a question's cached explanation in a session.
 * Used to cache the rightAnswerExplanation for performance.
 * @param {number} sessionId - The session ID
 * @param {number} questionIndex - Index of the question in the session's questions array
 * @param {string} rightAnswerExplanation - The explanation to cache
 * @returns {Promise<Object|null>} Updated session or null if not found
 */
export async function updateQuestionExplanation(sessionId, questionIndex, rightAnswerExplanation) {
  return dbUpdateQuestionExplanation(sessionId, questionIndex, rightAnswerExplanation);
}

/**
 * Delete a quiz from history
 * @param {number} id - Quiz session ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export async function deleteQuiz(id) {
  const session = await getSession(id);
  if (!session) {
    return false;
  }
  await deleteSession(id);
  return true;
}

/**
 * Check if a quiz with the given source ID already exists.
 * Used to detect duplicates when saving party quizzes.
 * @param {string} sourceQuizId - The original quiz ID to check for
 * @returns {Promise<boolean>} True if quiz exists, false otherwise
 */
export async function quizExists(sourceQuizId) {
  return dbQuizExistsBySourceId(sourceQuizId);
}
