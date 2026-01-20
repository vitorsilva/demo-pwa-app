  /**
   * Quiz Serializer Service
   * Handles encoding/decoding quizzes for URL sharing.
   *
   * Flow: Quiz Object → Short Keys → JSON → LZ Compress → Base64 URL-safe
   */

  import LZString from 'lz-string';

  // Short keys for smaller JSON payload
  const QUIZ_KEY_MAP = {
    topic: 't',
    gradeLevel: 'g',
    creator: 'c',
    mode: 'm',
    questions: 'q',
  };

  const QUESTION_KEY_MAP = {
    question: 'q',
    options: 'o',
    correct: 'c',
    difficulty: 'd',
  };

  // Maximum URL length for safe sharing
  const MAX_URL_LENGTH = 2000;

  /**
   * Convert quiz object to use short keys for compression.
   * @param {Object} quiz - Full quiz object
   * @returns {Object} Quiz with short keys
   */
  function toShortKeys(quiz) {
    const short = {};

    // Map quiz-level fields
    if (quiz.topic) short[QUIZ_KEY_MAP.topic] = quiz.topic;
    if (quiz.gradeLevel) short[QUIZ_KEY_MAP.gradeLevel] = quiz.gradeLevel;
    if (quiz.creator) short[QUIZ_KEY_MAP.creator] = quiz.creator;
    if (quiz.mode) short[QUIZ_KEY_MAP.mode] = quiz.mode;

    // Map questions array
    if (quiz.questions) {
      short[QUIZ_KEY_MAP.questions] = quiz.questions.map(q => {
        const shortQ = {};
        shortQ[QUESTION_KEY_MAP.question] = q.question;
        shortQ[QUESTION_KEY_MAP.options] = q.options;
        shortQ[QUESTION_KEY_MAP.correct] = q.correct;
        if (q.difficulty) shortQ[QUESTION_KEY_MAP.difficulty] = q.difficulty;
        // Note: explanations are intentionally excluded to keep URLs short
        return shortQ;
      });
    }

    return short;
  }

  /**
   * Convert short-key quiz back to full property names.
   * @param {Object} short - Quiz with short keys
   * @returns {Object} Quiz with full keys
   */
  function toFullKeys(short) {
    const quiz = {};

    // Map quiz-level fields
    if (short.t) quiz.topic = short.t;
    if (short.g) quiz.gradeLevel = short.g;
    if (short.c) quiz.creator = short.c;
    if (short.m) quiz.mode = short.m;

    // Map questions array
    if (short.q) {
      quiz.questions = short.q.map(sq => {
        const question = {
          question: sq.q,
          options: sq.o,
          correct: sq.c,
        };
        if (sq.d) question.difficulty = sq.d;
        return question;
      });
    }

    return quiz;
  }  

  /**
   * Serializes a quiz object to a URL-safe string.
   * Uses short keys, LZ-string compression, and Base64 encoding.
   *
   * @param {Object} quiz - The quiz object to serialize
   * @param {string} quiz.topic - Quiz topic
   * @param {string} [quiz.gradeLevel] - Education level
   * @param {string} [quiz.creator] - Creator name
   * @param {string} [quiz.mode] - Quiz mode
   * @param {Array<Object>} quiz.questions - Array of question objects
   * @returns {{success: boolean, data?: string, error?: string, length?: number}}
   *
   * @example
   * const result = serializeQuiz(myQuiz);
   * if (result.success) {
   *   const url = `https://saberloop.com/app/quiz#${result.data}`;
   * }
   */
  export function serializeQuiz(quiz) {
    try {
      // Validate input
      if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        return { success: false, error: 'Quiz must have at least one question' };
      }

      // Convert to short keys (also strips explanations)
      const shortQuiz = toShortKeys(quiz);

      // Convert to JSON
      const json = JSON.stringify(shortQuiz);

      // Compress and make truly URL-safe (replace + with -)
      const compressed = LZString.compressToEncodedURIComponent(json)
        .replace(/\+/g, '_');

      // Check length
      if (compressed.length > MAX_URL_LENGTH) {
        return {
          success: false,
          error: 'Quiz too large to share',
          length: compressed.length,
        };
      }

      return {
        success: true,
        data: compressed,
        length: compressed.length,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Deserializes a URL-safe string back to a quiz object.
   *
   * @param {string} encoded - The Base64+LZ compressed string from URL
   * @returns {{success: boolean, quiz?: Object, error?: string}}
   *
   * @example
   * const result = deserializeQuiz(hashFromUrl);
   * if (result.success) {
   *   console.log(result.quiz.topic);
   * }
   */
  export function deserializeQuiz(encoded) {
    try {
      // Validate input
      if (!encoded || typeof encoded !== 'string') {
        return { success: false, error: 'Invalid encoded data' };
      }

      // Restore + before decompressing (we replaced with - for URL safety)
      const safeEncoded = encoded.replace(/_/g, '+');
      const json = LZString.decompressFromEncodedURIComponent(safeEncoded);
      if (!json) {
        return { success: false, error: 'Decompression failed' };
      }

      // Parse JSON
      const shortQuiz = JSON.parse(json);

      // Convert to full keys
      const quiz = toFullKeys(shortQuiz);

      // Basic validation
      if (!quiz.questions || quiz.questions.length === 0) {
        return { success: false, error: 'Quiz has no questions' };
      }

      return { success: true, quiz };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }  

  /**
   * Estimates if a quiz can be shared based on size.
   * Useful for showing warnings before user attempts to share.
   *
   * @param {Object} quiz - The quiz to check
   * @returns {{canShare: boolean, estimatedLength: number, maxLength: number}}
   */
  export function canShareQuiz(quiz) {
    if (!quiz || !quiz.questions) {
      return { canShare: false, estimatedLength: 0, maxLength: MAX_URL_LENGTH };
    }

    const result = serializeQuiz(quiz);

    return {
      canShare: result.success,
      estimatedLength: result.length || 0,
      maxLength: MAX_URL_LENGTH,
    };
  }

  /**
   * Gets the maximum recommended questions for sharing.
   * Based on typical question sizes.
   * @returns {number}
   */
  export function getMaxShareableQuestions() {
    return 10; // Conservative estimate based on ~200 chars per question
  }  