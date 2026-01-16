 // db.test.js - Unit tests for IndexedDB wrapper

import { beforeEach, describe, expect, it } from 'vitest';

// Set up fake-indexeddb before importing db.js
import 'fake-indexeddb/auto';

// Import functions to test
import {
    initDatabase,
    saveTopic,
    getTopic,
    getAllTopics,
    saveSession,
    getSession,
    getAllSessions,
    getSessionsByTopic,
    getRecentSessions,
    updateSession,
    updateQuestionExplanation,
    deleteSession,
    deleteSampleSessions,
    getSetting,
    saveSetting,
    storeOpenRouterKey,
    getOpenRouterKey,
    removeOpenRouterKey,
    isOpenRouterConnected,
    clearAllUserData,
    DB_NAME,
    DB_VERSION
  } from './db.js';

  describe('Database Initialization', () => {
    it('should create database with all object stores', async () => {
        const db = await initDatabase();

        // First, verify db was returned
        expect(db).toBeDefined();
        expect(db).not.toBeNull();
 
        // Check if all object stores were created
        expect(db.objectStoreNames.contains('topics')).toBe(true);        
        expect(db.objectStoreNames.contains('sessions')).toBe(true);      
        expect(db.objectStoreNames.contains('settings')).toBe(true);  
    });
  });

   describe('Topics CRUD Operations', () => {
    beforeEach(async () => {
     // Clean slate before each test
      indexedDB.deleteDatabase(DB_NAME);
    });

    it('should save and retrieve a topic', async () => {
      //await initDatabase();

      const topic = {
        id: 'math',
        name: 'Mathematics',
        gradeLevel: '5th Grade',
        createdAt: Date.now(),
        lastPracticed: Date.now(),
        totalQuestions: 10,
        correctAnswers: 8
      };

      await saveTopic(topic);
      const retrieved = await getTopic('math');

      expect(retrieved).toEqual(topic);
    }); 

    it('should return undefined for non-existent topic', async () => {
      const retrieved = await getTopic('nonexistent');
      expect(retrieved).toBeUndefined();
    });

    it('should update existing topic using saveTopic', async () => {
      const topic = {
        id: 'science',
        name: 'Science',
        totalQuestions: 5,
        correctAnswers: 3
      };

      await saveTopic(topic);

      // Update with more questions
      const updated = {
        id: 'science',
        name: 'Science',
        totalQuestions: 10,
        correctAnswers: 7
      };

      await saveTopic(updated);
      const retrieved = await getTopic('science');

      expect(retrieved.totalQuestions).toBe(10);
      expect(retrieved.correctAnswers).toBe(7);
    });

    it('should retrieve all topics', async () => {
      await saveTopic({ id: 'math', name: 'Math' });
      await saveTopic({ id: 'science', name: 'Science' });
      await saveTopic({ id: 'history', name: 'History' });

      const allTopics = await getAllTopics();

      expect(allTopics).toHaveLength(3);
      expect(allTopics.map(t => t.id)).toContain('math');
      expect(allTopics.map(t => t.id)).toContain('science');
      expect(allTopics.map(t => t.id)).toContain('history');
    });

  });

describe('Sessions CRUD Operations', () => {
    beforeEach(async () => {
     // Clean slate before each test
      indexedDB.deleteDatabase(DB_NAME);
    });

    it('should save session and auto-generate ID', async () => {      
      const session = {
        topicId: 'math',
        timestamp: Date.now(),
        score: 4,
        totalQuestions: 5,
        questions: []
      };

      const id = await saveSession(session);

      expect(id).toBe(1);  // First session gets ID 1
    });
 
    it('should generate sequential IDs for multiple sessions',        
  async () => {
      const session1 = { topicId: 'math', timestamp: Date.now(),      
  score: 3, totalQuestions: 5 };
      const session2 = { topicId: 'science', timestamp:
  Date.now(), score: 4, totalQuestions: 5 };
      const session3 = { topicId: 'math', timestamp: Date.now(),      
  score: 5, totalQuestions: 5 };

      const id1 = await saveSession(session1);
      const id2 = await saveSession(session2);
      const id3 = await saveSession(session3);

      //expect(id1).toBe(1);
      expect(id2).toBe(Number(id1) + 1);
      expect(id3).toBe(Number(id1) + 2);
    });

    it('should retrieve session by ID', async () => {
      const session = {
        topicId: 'history',
        timestamp: Date.now(),
        score: 5,
        totalQuestions: 5
      };

      const id = await saveSession(session);
      const retrieved = await getSession(id);

      expect(retrieved.id).toBe(id);
      expect(retrieved.topicId).toBe('history');
      expect(retrieved.score).toBe(5);
    });

    it('should get all sessions for a specific topic', async () =>    
   {
     indexedDB.deleteDatabase(DB_NAME);

      await saveSession({ topicId: 'math1', timestamp: Date.now(), score: 4 });
      await saveSession({ topicId: 'science', timestamp: Date.now(), score: 3 });
      await saveSession({ topicId: 'math1', timestamp: Date.now(), score: 5 });
      await saveSession({ topicId: 'history', timestamp: Date.now(), score: 4 });

      const mathSessions = await getSessionsByTopic('math1');

      expect(mathSessions).toHaveLength(2);
      expect(mathSessions.every(s => s.topicId === 'math1')).toBe(true);
    });

    it('should get recent sessions sorted by timestamp', async () => {
      const now = Date.now();

      await saveSession({ topicId: 'math', timestamp: now + 10000, score: 3 });
      await saveSession({ topicId: 'science', timestamp: now + 5000, score: 4 });
      await saveSession({ topicId: 'history', timestamp: now + 3000, score: 5 });

      const recent = await getRecentSessions(10);

      // Most recent first
      expect(recent[0].timestamp).toBeGreaterThan(recent[1].timestamp);
      expect(recent[1].timestamp).toBeGreaterThan(recent[2].timestamp);
    });


    it('should limit recent sessions to specified amount', async () => {
      const now = Date.now();

      for (let i = 0; i < 10; i++) {
        await saveSession({ topicId: 'math', timestamp: now + i, score: 5 });
      }

      const recent = await getRecentSessions(5);

      expect(recent).toHaveLength(5);
    });
  });  
  
    describe('updateSession - Quiz Replay', () => {
      beforeEach(async () => {
        // Clean slate before each test
        indexedDB.deleteDatabase(DB_NAME);
      });

      it('should update existing session with new data', async () => {
        // Arrange: Create a session
        const session = {
          topicId: 'math',
          topic: 'Mathematics',
          timestamp: Date.now(),
          score: 3,
          totalQuestions: 5,
          questions: [],
          userAnswers: [0, 1, 2, 0, 1]
        };

        const sessionId = await saveSession(session);

        // Act: Update the session with better score
        const updated = await updateSession(sessionId, {
          score: 5,
          userAnswers: [0, 1, 2, 3, 4]
        });

        // Assert: Score should be updated
        expect(updated).not.toBeNull();
        expect(updated.score).toBe(5);
        expect(updated.topic).toBe('Mathematics'); // Other fields unchanged
        expect(updated.userAnswers).toEqual([0, 1, 2, 3, 4]);
      });

      it('should return null for non-existent session', async () => {
        // Act: Try to update a session that doesn't exist
        const result = await updateSession(99999, { score: 5 });

        // Assert: Should return null gracefully
        expect(result).toBeNull();
      });

      it('should update timestamp on replay', async () => {
        const originalTimestamp = Date.now() - 10000; // 10 seconds ago

        const sessionId = await saveSession({
          topicId: 'science',
          topic: 'Science',
          score: 4,
          totalQuestions: 5,
          timestamp: originalTimestamp,
          questions: [],
          userAnswers: []
        });

        // Wait a tiny bit to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 10));

        const newTimestamp = Date.now();

        // Act: Update timestamp
        await updateSession(sessionId, { timestamp: newTimestamp });

        // Assert: Timestamp should be updated
        const session = await getSession(sessionId);
        expect(session.timestamp).toBe(newTimestamp);
        expect(session.timestamp).toBeGreaterThan(originalTimestamp);
      });
    });

  describe('Settings CRUD Operations', () => {
    beforeEach(async () => {
     // Clean slate before each test
      indexedDB.deleteDatabase(DB_NAME);
    });

    it('should save and retrieve a setting', async () => {
      await saveSetting('apiKey', 'sk-ant-test123');
      const value = await getSetting('apiKey');

      expect(value).toBe('sk-ant-test123');
    });
  
    it('should return undefined for non-existent setting', async () => {
      const value = await getSetting('nonexistent');
      expect(value).toBeUndefined();
    });

    it('should update existing setting', async () => {
      await saveSetting('apiKey', 'old-key');
      await saveSetting('apiKey', 'new-key');

      const value = await getSetting('apiKey');
      expect(value).toBe('new-key');
    });

    it('should store different setting types', async () => {
      await saveSetting('apiKey', 'sk-ant-abc123');
      await saveSetting('defaultGradeLevel', 'High School');
      await saveSetting('darkMode', true);
      await saveSetting('maxQuestions', 10);

      expect(await getSetting('apiKey')).toBe('sk-ant-abc123');       
      expect(await getSetting('defaultGradeLevel')).toBe('High School');
      expect(await getSetting('darkMode')).toBe(true);
      expect(await getSetting('maxQuestions')).toBe(10);
    });

   });

   describe('database initialization', () => {
        it('should initialize database lazily when not initialized',        
        async () => {
            // Don't call initDatabase in beforeEach for this test
            // Call a db function directly
            const topic = { id: 'test', name: 'Test' };
            await saveTopic(topic);  // This will trigger line 39

            const retrieved = await getTopic('test');
            expect(retrieved).toEqual(topic);
        });

   });

     describe('OpenRouter Key Storage', () => {

      it('should store and retrieve OpenRouter API key', async () => {
        await storeOpenRouterKey('sk-or-v1-test123');
        const key = await getOpenRouterKey();
        expect(key).toBe('sk-or-v1-test123');
      });

      it('should store timestamp with the key', async () => {
        const beforeStore = new Date().toISOString();
        await storeOpenRouterKey('sk-or-v1-timestamp-test');

        const data = await getSetting('openrouter_api_key');

        expect(data.storedAt).toBeDefined();
        expect(data.storedAt >= beforeStore).toBe(true);
      });

      it('should remove OpenRouter key', async () => {
        await storeOpenRouterKey('sk-or-v1-to-remove');

        let key = await getOpenRouterKey();
        expect(key).toBe('sk-or-v1-to-remove');

        await removeOpenRouterKey();

        key = await getOpenRouterKey();
        expect(key).toBeNull();
      });

      it('should report connected status correctly', async () => {
        // First remove any existing key
        await removeOpenRouterKey();

        // Should be disconnected
        let connected = await isOpenRouterConnected();
        expect(connected).toBe(false);

        // Connect
        await storeOpenRouterKey('sk-or-v1-connect-test');
        connected = await isOpenRouterConnected();
        expect(connected).toBe(true);

        // Disconnect
        await removeOpenRouterKey();
        connected = await isOpenRouterConnected();
        expect(connected).toBe(false);
      });

      it('should overwrite existing key when storing new one', async () => {
        await storeOpenRouterKey('sk-or-v1-old-key');
        await storeOpenRouterKey('sk-or-v1-new-key');

        const key = await getOpenRouterKey();
        expect(key).toBe('sk-or-v1-new-key');
      });
    });

    describe('getAllSessions', () => {
      it('should return all sessions', async () => {
        // Clear first using clearAllUserData, then add test data
        await clearAllUserData();

        await saveSession({ topicId: 'math', timestamp: Date.now(), score: 5 });
        await saveSession({ topicId: 'science', timestamp: Date.now(), score: 8 });
        await saveSession({ topicId: 'history', timestamp: Date.now(), score: 7 });

        const sessions = await getAllSessions();
        expect(sessions).toHaveLength(3);
      });

      it('should only contain sample sessions after clearAllUserData', async () => {
        await clearAllUserData();
        const sessions = await getAllSessions();
        // After clearing, only sample sessions remain (if any from previous tests)
        expect(sessions.every(s => s.isSample)).toBe(true);
      });
    });

    describe('clearAllUserData', () => {
      it('should clear all non-sample sessions', async () => {
        // Clear any existing data first
        await clearAllUserData();

        // Create user sessions
        await saveSession({ topicId: 'math', timestamp: Date.now(), score: 5 });
        await saveSession({ topicId: 'science', timestamp: Date.now(), score: 8 });

        // Create sample session
        await saveSession({ topicId: 'sample', timestamp: Date.now(), score: 10, isSample: true });

        // Verify sessions exist
        let sessions = await getAllSessions();
        expect(sessions).toHaveLength(3);

        // Clear user data
        await clearAllUserData();

        // Verify only sample session remains
        sessions = await getAllSessions();
        expect(sessions).toHaveLength(1);
        expect(sessions[0].isSample).toBe(true);
      });

      it('should clear all topics', async () => {
        await clearAllUserData();

        await saveTopic({ id: 'math', name: 'Mathematics' });
        await saveTopic({ id: 'science', name: 'Science' });

        let topics = await getAllTopics();
        expect(topics).toHaveLength(2);

        await clearAllUserData();

        topics = await getAllTopics();
        expect(topics).toHaveLength(0);
      });

      it('should clear all settings', async () => {
        await saveSetting('apiKey', 'test-key');
        await saveSetting('theme', 'dark');

        expect(await getSetting('apiKey')).toBe('test-key');
        expect(await getSetting('theme')).toBe('dark');

        await clearAllUserData();

        expect(await getSetting('apiKey')).toBeUndefined();
        expect(await getSetting('theme')).toBeUndefined();
      });

      it('should preserve sample sessions', async () => {
        await clearAllUserData();

        // Count existing sample sessions
        const beforeSamples = (await getAllSessions()).filter(s => s.isSample).length;

        // Create new sample sessions
        await saveSession({ topicId: 'sample1', timestamp: Date.now(), score: 10, isSample: true });
        await saveSession({ topicId: 'sample2', timestamp: Date.now(), score: 8, isSample: true });

        // Also create a non-sample session
        await saveSession({ topicId: 'user-session', timestamp: Date.now(), score: 5 });

        await clearAllUserData();

        const sessions = await getAllSessions();
        // Should have the new samples plus any existing ones
        expect(sessions.length).toBe(beforeSamples + 2);
        expect(sessions.every(s => s.isSample)).toBe(true);
      });

      it('should handle database with only samples gracefully', async () => {
        // clearAllUserData preserves sample sessions, so after clearing
        // we may still have samples from previous tests
        await clearAllUserData();

        // Should not throw
        const sessions = await getAllSessions();
        const topics = await getAllTopics();

        // All remaining sessions should be samples (if any)
        expect(sessions.every(s => s.isSample)).toBe(true);
        // Topics should be empty
        expect(topics).toEqual([]);
      });
  }); 

      describe('updateQuestionExplanation', () => {
        beforeEach(async () => {
          indexedDB.deleteDatabase(DB_NAME);
        });

        it('should update a question explanation', async () => {
          // Create session with questions
          const sessionId = await saveSession({
            topicId: 'math',
            timestamp: Date.now(),
            score: 3,
            totalQuestions: 2,
            questions: [
              { question: 'What is 2+2?', options: ['3', '4', '5', '6'], correct: 1 },
              { question: 'What is 3+3?', options: ['5', '6', '7', '8'], correct: 1 }
            ]
          });

          // Update first question's explanation
          const updated = await updateQuestionExplanation(sessionId, 0, 'Because 2+2=4');

          expect(updated).not.toBeNull();
          expect(updated.questions[0].rightAnswerExplanation).toBe('Because 2+2=4');
          expect(updated.questions[1].rightAnswerExplanation).toBeUndefined();
        });

        it('should return null for non-existent session', async () => {
          const result = await updateQuestionExplanation(99999, 0, 'Explanation');
          expect(result).toBeNull();
        });

        it('should return null for invalid question index (negative)', async () => {
          const sessionId = await saveSession({
            topicId: 'math',
            timestamp: Date.now(),
            score: 1,
            totalQuestions: 1,
            questions: [{ question: 'Q1', options: ['A'], correct: 0 }]
          });

          const result = await updateQuestionExplanation(sessionId, -1, 'Explanation');
          expect(result).toBeNull();
        });

        it('should return null for invalid question index (out of bounds)', async () => {
          const sessionId = await saveSession({
            topicId: 'math',
            timestamp: Date.now(),
            score: 1,
            totalQuestions: 1,
            questions: [{ question: 'Q1', options: ['A'], correct: 0 }]
          });

          const result = await updateQuestionExplanation(sessionId, 5, 'Explanation');
          expect(result).toBeNull();
        });

        it('should return null when session has no questions array', async () => {
          const sessionId = await saveSession({
            topicId: 'math',
            timestamp: Date.now(),
            score: 0,
            totalQuestions: 0
            // No questions array
          });

          const result = await updateQuestionExplanation(sessionId, 0, 'Explanation');
          expect(result).toBeNull();
        });

        it('should preserve other question properties when adding explanation', async () => {
          const sessionId = await saveSession({
            topicId: 'science',
            timestamp: Date.now(),
            score: 1,
            totalQuestions: 1,
            questions: [{
              question: 'What is H2O?',
              options: ['Water', 'Air', 'Fire', 'Earth'],
              correct: 0,
              userAnswer: 0
            }]
          });

          await updateQuestionExplanation(sessionId, 0, 'H2O is the chemical formula for water');

          const session = await getSession(sessionId);
          expect(session.questions[0].question).toBe('What is H2O?');
          expect(session.questions[0].correct).toBe(0);
          expect(session.questions[0].userAnswer).toBe(0);
          expect(session.questions[0].rightAnswerExplanation).toBe('H2O is the chemical formula for water');
        });
      });

      describe('deleteSession', () => {
        beforeEach(async () => {
          indexedDB.deleteDatabase(DB_NAME);
        });

        it('should delete a session by ID', async () => {
          const sessionId = await saveSession({
            topicId: 'math',
            topic: 'Mathematics',
            timestamp: Date.now(),
            score: 5,
            totalQuestions: 5
          });

          // Verify session exists
          let session = await getSession(sessionId);
          expect(session).toBeDefined();

          // Delete the session
          await deleteSession(sessionId);

          // Verify session is gone
          session = await getSession(sessionId);
          expect(session).toBeUndefined();
        });

        it('should not throw if session does not exist', async () => {
          // Should not throw when deleting non-existent session
          await expect(deleteSession(99999)).resolves.not.toThrow();
        });

        it('should only delete the specified session', async () => {
          // Clear any leftover data first
          await clearAllUserData();
          await deleteSampleSessions();

          const id1 = await saveSession({ topicId: 'math', timestamp: Date.now(), score: 5 });
          const id2 = await saveSession({ topicId: 'science', timestamp: Date.now(), score: 8 });
          const id3 = await saveSession({ topicId: 'history', timestamp: Date.now(), score: 7 });

          // Delete only the second session
          await deleteSession(id2);

          // Verify only id2 is deleted
          expect(await getSession(id1)).toBeDefined();
          expect(await getSession(id2)).toBeUndefined();
          expect(await getSession(id3)).toBeDefined();

          // Verify total count
          const allSessions = await getAllSessions();
          expect(allSessions).toHaveLength(2);
        });

        it('should delete sample sessions too', async () => {
          const sampleId = await saveSession({
            topicId: 'sample',
            timestamp: Date.now(),
            score: 10,
            isSample: true
          });

          // Verify sample session exists
          let session = await getSession(sampleId);
          expect(session).toBeDefined();
          expect(session.isSample).toBe(true);

          // Delete the sample session
          await deleteSession(sampleId);

          // Verify it's gone
          session = await getSession(sampleId);
          expect(session).toBeUndefined();
        });
      });

      describe('deleteSampleSessions', () => {
        beforeEach(async () => {
          // Clear everything including samples for a clean slate
          await clearAllUserData();
          await deleteSampleSessions();
        });

        it('should delete all sample sessions', async () => {
          // Create mix of sample and non-sample sessions
          await saveSession({ topicId: 'user1', timestamp: Date.now(), score: 5 });
          await saveSession({ topicId: 'sample1', timestamp: Date.now(), score: 10, isSample: true });   
          await saveSession({ topicId: 'sample2', timestamp: Date.now(), score: 8, isSample: true });    
          await saveSession({ topicId: 'user2', timestamp: Date.now(), score: 7 });

          let sessions = await getAllSessions();
          expect(sessions).toHaveLength(4);

          await deleteSampleSessions();

          sessions = await getAllSessions();
          expect(sessions).toHaveLength(2);
          expect(sessions.every(s => !s.isSample)).toBe(true);
        });

        it('should do nothing when no sample sessions exist', async () => {
          await saveSession({ topicId: 'user1', timestamp: Date.now(), score: 5 });
          await saveSession({ topicId: 'user2', timestamp: Date.now(), score: 7 });

          await deleteSampleSessions();

          const sessions = await getAllSessions();
          expect(sessions).toHaveLength(2);
        });

        it('should handle empty database', async () => {
          // Should not throw
          await deleteSampleSessions();

          const sessions = await getAllSessions();
          expect(sessions).toHaveLength(0);
        });
      });

      describe('quizExistsBySourceId', () => {
        beforeEach(async () => {
          indexedDB.deleteDatabase(DB_NAME);
        });

        it('should return true when quiz with sourceQuizId exists', async () => {
          // Import the function
          const { quizExistsBySourceId } = await import('./db.js');

          // Save a session with a sourceQuizId
          await saveSession({
            sourceQuizId: 'party-quiz-123',
            topicId: 'math',
            timestamp: Date.now(),
            score: 5
          });

          const exists = await quizExistsBySourceId('party-quiz-123');
          expect(exists).toBe(true);
        });

        it('should return false when quiz with sourceQuizId does not exist', async () => {
          const { quizExistsBySourceId } = await import('./db.js');

          // Save a session without sourceQuizId
          await saveSession({
            topicId: 'math',
            timestamp: Date.now(),
            score: 5
          });

          const exists = await quizExistsBySourceId('nonexistent-quiz-id');
          expect(exists).toBe(false);
        });

        it('should return false for empty database', async () => {
          const { quizExistsBySourceId } = await import('./db.js');

          const exists = await quizExistsBySourceId('any-quiz-id');
          expect(exists).toBe(false);
        });

        it('should distinguish between different sourceQuizIds', async () => {
          const { quizExistsBySourceId } = await import('./db.js');

          await saveSession({
            sourceQuizId: 'quiz-A',
            topicId: 'math',
            timestamp: Date.now(),
            score: 5
          });

          await saveSession({
            sourceQuizId: 'quiz-B',
            topicId: 'science',
            timestamp: Date.now(),
            score: 8
          });

          expect(await quizExistsBySourceId('quiz-A')).toBe(true);
          expect(await quizExistsBySourceId('quiz-B')).toBe(true);
          expect(await quizExistsBySourceId('quiz-C')).toBe(false);
        });
      });
