// db.js - IndexedDB wrapper for Saberloop

import { openDB } from 'idb';

export const DB_NAME = 'quizmaster';
export const DB_VERSION = 1;

let dbPromise;

// Initialize database and create object stores
export async function initDatabase() {
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create 'topics' object store
      if (!db.objectStoreNames.contains('topics')) {
        const topicStore = db.createObjectStore('topics', { keyPath: 'id' });
        topicStore.createIndex('byName', 'name');
      }

      // Create 'sessions' object store
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionStore = db.createObjectStore('sessions', {
          keyPath: 'id',
          autoIncrement: true,
        });
        sessionStore.createIndex('byTopicId', 'topicId');
        sessionStore.createIndex('byTimestamp', 'timestamp');
      }

      // Create 'settings' object store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
  return dbPromise;
}

// Get a reference to the database
async function getDB() {
  if (!dbPromise) {
    dbPromise = initDatabase();
  }
  return dbPromise;
}

// ========== TOPICS ==========

export async function saveTopic(topic) {
  const db = await getDB();
  return db.put('topics', topic);
}

export async function getTopic(id) {
  const db = await getDB();
  return db.get('topics', id);
}

export async function getAllTopics() {
  const db = await getDB();
  return db.getAll('topics');
}

// ========== SESSIONS ==========

export async function saveSession(session) {
  const db = await getDB();
  return db.add('sessions', session);
}

export async function getSession(id) {
  const db = await getDB();
  return db.get('sessions', id);
}

export async function getSessionsByTopic(topicId) {
  const db = await getDB();
  return db.getAllFromIndex('sessions', 'byTopicId', topicId);
}

/**
 * Get all sessions from the database
 * @returns {Promise<Array>} All session objects
 */
export async function getAllSessions() {
  const db = await getDB();
  return db.getAll('sessions');
}

/**
 * Normalize timestamp to numeric milliseconds.
 * Handles: numbers, ISO strings, null, undefined, 0
 * @param {number|string|null|undefined} ts - Timestamp value
 * @returns {number} Normalized timestamp in milliseconds
 */
export function normalizeTimestamp(ts) {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export async function getRecentSessions(limit = 10) {
  const db = await getDB();
  const all = await db.getAll('sessions');

  // Normalize and sort by timestamp descending (newest first)
  all.sort((a, b) => {
    const tsA = normalizeTimestamp(a.timestamp);
    const tsB = normalizeTimestamp(b.timestamp);
    return tsB - tsA;
  });

  return all.slice(0, limit);
}

export async function updateSession(id, updates) {
  const db = await getDB();
  const session = await db.get('sessions', id);
  if (!session) return null;

  const updatedSession = { ...session, ...updates };
  await db.put('sessions', updatedSession);
  return updatedSession;
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
  const db = await getDB();
  const session = await db.get('sessions', sessionId);
  if (!session) return null;

  // Ensure questions array exists and index is valid
  if (!session.questions || questionIndex < 0 || questionIndex >= session.questions.length) {
    return null;
  }

  // Update the specific question's rightAnswerExplanation
  session.questions[questionIndex] = {
    ...session.questions[questionIndex],
    rightAnswerExplanation,
  };

  await db.put('sessions', session);
  return session;
}

/**
 * Delete a single quiz session by ID
 * @param {number} id - Session ID to delete
 * @returns {Promise<void>}
 */
export async function deleteSession(id) {
  const db = await getDB();
  return db.delete('sessions', id);
}

/**
 * Check if a quiz with the given source ID already exists.
 * Used to detect duplicates when saving party quizzes.
 * @param {string} sourceQuizId - The original quiz ID to check for
 * @returns {Promise<boolean>} True if quiz exists, false otherwise
 */
export async function quizExistsBySourceId(sourceQuizId) {
  const db = await getDB();
  const allSessions = await db.getAll('sessions');
  return allSessions.some((session) => session.sourceQuizId === sourceQuizId);
}

/**
 * Delete all sample sessions (used when reloading samples)
 */
export async function deleteSampleSessions() {
  const db = await getDB();
  const allSessions = await db.getAll('sessions');

  for (const session of allSessions) {
    if (session.isSample) {
      await db.delete('sessions', session.id);
    }
  }
}

// ========== SETTINGS ==========

export async function getSetting(key) {
  const db = await getDB();
  const setting = await db.get('settings', key);
  return setting?.value;
}

export async function saveSetting(key, value) {
  const db = await getDB();
  return db.put('settings', { key, value });
}

// ========== OPENROUTER ==========

const OPENROUTER_KEY = 'openrouter_api_key';

/**
 * Store OpenRouter API key
 * @param {string} apiKey - The API key to store
 */
export async function storeOpenRouterKey(apiKey) {
  return saveSetting(OPENROUTER_KEY, {
    key: apiKey,
    storedAt: new Date().toISOString(),
  });
}

/**
 * Get stored OpenRouter API key
 * @returns {Promise<string|null>} The API key or null if not found
 */
export async function getOpenRouterKey() {
  const data = await getSetting(OPENROUTER_KEY);
  return data?.key || null;
}

/**
 * Remove OpenRouter API key (disconnect)
 */
export async function removeOpenRouterKey() {
  const db = await getDB();
  return db.delete('settings', OPENROUTER_KEY);
}

/**
 * Check if user is connected to OpenRouter
 * @returns {Promise<boolean>}
 */
export async function isOpenRouterConnected() {
  const key = await getOpenRouterKey();
  return !!key;
}

// ========== DATA MANAGEMENT ==========

/**
 * Clear all user data from IndexedDB.
 * Preserves sample sessions but clears all user-created data.
 * @returns {Promise<void>}
 */
export async function clearAllUserData() {
  const db = await getDB();

  // Delete all non-sample sessions
  const allSessions = await db.getAll('sessions');
  for (const session of allSessions) {
    if (!session.isSample) {
      await db.delete('sessions', session.id);
    }
  }

  // Clear all topics
  const allTopics = await db.getAll('topics');
  for (const topic of allTopics) {
    await db.delete('topics', topic.id);
  }

  // Clear all settings
  const tx = db.transaction('settings', 'readwrite');
  await tx.store.clear();
  await tx.done;
}
