// api.mock.js - Mock API for testing without real Claude API calls
import { logger } from '../utils/logger.js';

  /**
   * Settings for generating explanations.
   * @typedef {Object} ExplanationSettings
   * @property {string} [gradeLevel='middle school'] - Education level for the explanation
   * @property {string} [apiKey] - API key (unused in mock, accepted for interface consistency)
   * @property {string} [language='en'] - Language code (unused in mock, accepted for interface consistency)
   */

  /**
   * Mock question generation - returns fake but realistic questions
   * @param {string} topic - The topic to generate questions about
   * @param {string} gradeLevel - The grade level for the questions
   * @param {string} _apiKey - The API key (unused in mock, accepted for interface consistency)
   * @param {Object} [options] - Optional settings
   * @param {Array<string>} [options.previousQuestions] - Questions to exclude (for continue feature)
   * @param {string} [options.language] - Language code (unused in mock, accepted for interface consistency)
   * @param {number} [options.questionCount] - Number of questions to generate (default: 5)
   * @returns {Promise<{language: string, questions: Array, model: string, usage: {promptTokens: number, completionTokens: number, totalTokens: number, costUsd: number}}>} Object with language, questions, model, and usage data
   */
  export async function generateQuestions(topic, gradeLevel = 'middle school', _apiKey, options = {}) {
    // Simulate network delay (real APIs take time)
    // Can be overridden via window.MOCK_API_DELAY_MS for testing
    const delay = (typeof window !== 'undefined' && /** @type {*} */ (window).MOCK_API_DELAY_MS) || 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Set window.__MOCK_GENERATION_ERROR__ = { message: '...' } to simulate errors
    if (typeof window !== 'undefined' && /** @type {*} */ (window).__MOCK_GENERATION_ERROR__) {
      const errorConfig = /** @type {*} */ (window).__MOCK_GENERATION_ERROR__;
      throw new Error(errorConfig.message || 'Mock generation error');
    }

    const { previousQuestions = [], questionCount = 5 } = options;
    logger.debug('Mock API generating questions', { topic, gradeLevel, questionCount, previousQuestionsCount: previousQuestions.length });

    // Question templates to cycle through
    const questionTemplates = [
      {
        question: `What is the main concept behind ${topic}?`,
        options: [
          "A) The first option about the topic",
          "B) The correct answer explaining the core concept",
          "C) A common misconception",
          "D) An unrelated distractor"
        ],
        correct: 1,
        difficulty: "easy"
      },
      {
        question: `How would you apply ${topic} in a real-world scenario?`,
        options: [
          "A) By ignoring the basic principles",
          "B) By understanding and applying the underlying concepts",
          "C) By using only memorized facts",
          "D) By guessing randomly"
        ],
        correct: 1,
        difficulty: "medium"
      },
      {
        question: `Which of the following best describes ${topic}?`,
        options: [
          "A) A complex theory with no practical use",
          "B) A fundamental concept used in many areas",
          "C) An outdated idea no longer relevant",
          "D) A simple fact that requires no understanding"
        ],
        correct: 1,
        difficulty: "easy"
      },
      {
        question: `What is a common mistake students make when learning ${topic}?`,
        options: [
          "A) They understand it too well",
          "B) They confuse it with a related but different concept",
          "C) They never make mistakes with this topic",
          "D) They always get it right on the first try"
        ],
        correct: 1,
        difficulty: "medium"
      },
      {
        question: `In advanced applications, how does ${topic} connect to other concepts?`,
        options: [
          "A) It exists in complete isolation from everything else",
          "B) It serves as a foundation for more complex ideas",
          "C) It contradicts all other known concepts",
          "D) It has no relationship to anything else"
        ],
        correct: 1,
        difficulty: "challenging"
      }
    ];

    // Generate requested number of questions by cycling through templates
    const mockQuestions = [];
    for (let i = 0; i < questionCount; i++) {
      const template = questionTemplates[i % questionTemplates.length];
      mockQuestions.push({
        ...template,
        question: template.question + (i >= questionTemplates.length ? ` (Part ${Math.floor(i / questionTemplates.length) + 1})` : '')
      });
    }

    logger.debug('Mock API questions generated', { count: mockQuestions.length, language: 'EN-US' });

    // Simulate realistic usage data for mock API
    const mockUsage = {
      promptTokens: 150 + Math.floor(Math.random() * 50),
      completionTokens: 400 + Math.floor(Math.random() * 200),
      totalTokens: 0,
      costUsd: 0  // Mock uses "free" model
    };
    mockUsage.totalTokens = mockUsage.promptTokens + mockUsage.completionTokens;

    return {
      language: 'EN-US',
      questions: mockQuestions,
      model: 'mock/demo-model:free',
      usage: mockUsage
    };
  }

  /**
   * Mock explanation generation - returns structured explanation with both parts
   * @param {string} _question - The question text
   * @param {string} userAnswer - The user's answer
   * @param {string} correctAnswer - The correct answer
   * @param {ExplanationSettings} settings - API and content settings (mostly unused in mock)
   * @returns {Promise<{rightAnswerExplanation: string, wrongAnswerExplanation: string}>} Structured explanation
   */
  export async function generateExplanation(_question, userAnswer, correctAnswer, settings = {}) {
    const { gradeLevel: _gradeLevel = 'middle school', apiKey: _apiKey, language: _language = 'en' } = settings;
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Support error simulation for E2E testing
    // Set window.__MOCK_EXPLANATION_ERROR__ = { message: '...', code: '...' } to simulate errors
    if (typeof window !== 'undefined' && /** @type {*} */ (window).__MOCK_EXPLANATION_ERROR__) {
      const errorConfig = /** @type {*} */ (window).__MOCK_EXPLANATION_ERROR__;
      const error = /** @type {Error & {code?: string}} */ (new Error(errorConfig.message || 'Mock error'));
      if (errorConfig.code) {
        error.code = errorConfig.code;
      }
      logger.debug('Mock API simulating explanation error', { code: errorConfig.code });
      throw error;
    }

    logger.debug('Mock API generating structured explanation');

    const result = {
      rightAnswerExplanation: `The correct answer is ${correctAnswer}. This is because the concept works differently than you might have initially thought. Understanding the foundations helps everything else make sense.`,
      wrongAnswerExplanation: `Your answer "${userAnswer}" wasn't quite right. This is a common misconception - keep practicing and you'll get it!`
    };

    logger.debug('Mock API structured explanation generated');

    return result;
  }

  /**
   * Mock wrong answer explanation generation - returns explanation for why user's answer was wrong
   * @param {string} _question - The question text
   * @param {string} userAnswer - The user's answer
   * @param {string} _correctAnswer - The correct answer
   * @param {ExplanationSettings} settings - API and content settings (mostly unused in mock)
   * @returns {Promise<string>} Wrong answer explanation text
   */
  export async function generateWrongAnswerExplanation(_question, userAnswer, _correctAnswer, settings = {}) {
    const { gradeLevel: _gradeLevel = 'middle school', apiKey: _apiKey, language: _language = 'en' } = settings;
    // Simulate network delay (shorter since it's just partial generation)
    await new Promise(resolve => setTimeout(resolve, 300));

    // Support error simulation for E2E testing (uses same flag as generateExplanation)
    if (typeof window !== 'undefined' && /** @type {*} */ (window).__MOCK_EXPLANATION_ERROR__) {
      const errorConfig = /** @type {*} */ (window).__MOCK_EXPLANATION_ERROR__;
      const error = /** @type {Error & {code?: string}} */ (new Error(errorConfig.message || 'Mock error'));
      if (errorConfig.code) {
        error.code = errorConfig.code;
      }
      logger.debug('Mock API simulating wrong answer explanation error', { code: errorConfig.code });
      throw error;
    }

    logger.debug('Mock API generating wrong answer explanation only');

    const mockExplanation = `Your answer "${userAnswer}" wasn't quite right. This is a common misconception that many students have - keep practicing and you'll master this concept!`;

    logger.debug('Mock API wrong answer explanation generated');

    return mockExplanation;
  }