/**
 * Party API Client
 *
 * HTTP client for party room operations.
 * Handles room creation, joining, leaving, and state management.
 *
 * @module services/party-api
 */

import { logger } from '../utils/logger.js';
import { getSignalingBaseUrl } from './signaling-client.js';

const log = logger.child({ module: 'party-api' });

/**
 * A participant's answer submission.
 * @typedef {Object} Answer
 * @property {string} participantId - Who submitted the answer
 * @property {number} questionIndex - Which question (0-based index)
 * @property {number} answerIndex - Selected answer index (-1 for timeout/no answer)
 * @property {number} timeMs - Response time in milliseconds
 */

/**
 * Generate a unique participant ID.
 *
 * @returns {string} UUID-like participant ID
 */
export function generateParticipantId() {
  return 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Create a new party room.
 *
 * @param {Object} options - Room options
 * @param {string} options.hostId - Host's participant ID
 * @param {string} options.hostName - Host's display name
 * @param {Object} [options.quizData] - Quiz data to share with participants
 * @param {number} [options.secondsPerQuestion] - Time per question (default: 30)
 * @returns {Promise<Object>} Created room data with code
 */
export async function createRoom({ hostId, hostName, quizData = null, secondsPerQuestion = 30 }) {
  const baseUrl = getSignalingBaseUrl();
  const url = `${baseUrl}/endpoints/rooms.php`;

  log.info('Creating room', { hostId, hostName });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hostId,
      hostName,
      quizData,
      secondsPerQuestion,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  log.info('Room created', { code: result.data?.code });
  return result.data;
}

/**
 * Get room information.
 *
 * @param {string} code - Room code
 * @returns {Promise<Object>} Room data with participants
 */
export async function getRoom(code) {
  const baseUrl = getSignalingBaseUrl();
  const url = `${baseUrl}/endpoints/rooms.php/${code.toUpperCase()}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 404) {
      throw new Error('ROOM_NOT_FOUND');
    }
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Join an existing room.
 *
 * @param {string} code - Room code
 * @param {string} participantId - Participant's unique ID
 * @param {string} name - Participant's display name
 * @returns {Promise<Object>} Room data with updated participants
 */
export async function joinRoom(code, participantId, name) {
  const baseUrl = getSignalingBaseUrl();
  const url = `${baseUrl}/endpoints/rooms.php/${code.toUpperCase()}/join`;

  log.info('Joining room', { code, participantId, name });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      participantId,
      name,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 404) {
      throw new Error('ROOM_NOT_FOUND');
    }
    if (error.error?.code === 'ROOM_FULL') {
      throw new Error('ROOM_FULL');
    }
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  log.info('Joined room', { code, participantCount: result.data?.participants?.length });
  return result.data;
}

/**
 * Leave a room.
 *
 * @param {string} code - Room code
 * @param {string} participantId - Participant's unique ID
 * @returns {Promise<void>}
 */
export async function leaveRoom(code, participantId) {
  const baseUrl = getSignalingBaseUrl();
  const url = `${baseUrl}/endpoints/rooms.php/${code.toUpperCase()}/leave`;

  log.info('Leaving room', { code, participantId });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ participantId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  log.info('Left room', { code });
}

/**
 * Start the quiz (host only).
 *
 * @param {string} code - Room code
 * @param {string} hostId - Host's participant ID
 * @returns {Promise<Object>} Updated room data
 */
export async function startQuiz(code, hostId) {
  const baseUrl = getSignalingBaseUrl();
  const url = `${baseUrl}/endpoints/rooms.php/${code.toUpperCase()}/start`;

  log.info('Starting quiz', { code, hostId });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  log.info('Quiz started', { code });
  return result.data;
}

/**
 * End a room (host only).
 *
 * @param {string} code - Room code
 * @param {string} hostId - Host's participant ID
 * @returns {Promise<void>}
 */
export async function endRoom(code, hostId) {
  const baseUrl = getSignalingBaseUrl();
  const url = `${baseUrl}/endpoints/rooms.php/${code.toUpperCase()}`;

  log.info('Ending room', { code, hostId });

  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  log.info('Room ended', { code });
}

/**
 * Advance to the next question (host only).
 *
 * @param {string} code - Room code
 * @param {string} hostId - Host's participant ID
 * @returns {Promise<Object>} Updated room data
 */
export async function advanceQuestion(code, hostId) {
  const baseUrl = getSignalingBaseUrl();
  const url = `${baseUrl}/endpoints/rooms.php/${code.toUpperCase()}/next`;

  log.info('Advancing question', { code, hostId });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  log.info('Question advanced', { code, currentQuestion: result.data?.current_question });
  return result.data;
}

/**
 * Submit an answer for the current question.
 *
 * @param {string} code - Room code
 * @param {Answer} answer - The answer submission
 * @returns {Promise<Object>} Updated participant data with score
 */
export async function submitAnswer(code, answer) {
  const { participantId, questionIndex, answerIndex, timeMs } = answer;
  const baseUrl = getSignalingBaseUrl();
  const url = `${baseUrl}/endpoints/rooms.php/${code.toUpperCase()}/answer`;

  log.info('Submitting answer', { code, participantId, questionIndex, answerIndex, timeMs });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answer),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  log.info('Answer submitted', { code, score: result.data?.score });
  return result.data;
}
