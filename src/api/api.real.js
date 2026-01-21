  // api.real.js - Uses OpenRouter for LLM calls (client-side)

  import { callOpenRouter } from './openrouter-client.js';
  import { logger } from '../utils/logger.js';
  import { getSelectedModel } from '../services/model-service.js';
  import { extractJSON } from '../utils/json-extractor.js';

  /**
   * Validate explanation schema - checks that parsed JSON has correct structure
   * @param {Object} explanation - Parsed explanation object
   * @throws {Error} If schema is invalid with specific field info
   */
  function validateExplanationSchema(explanation) {
    if (!explanation || typeof explanation !== 'object') {
      throw new Error('Explanation must be an object');
    }
    if (typeof explanation.rightAnswerExplanation !== 'string') {
      throw new Error('Missing or invalid rightAnswerExplanation field');
    }
    if (typeof explanation.wrongAnswerExplanation !== 'string') {
      throw new Error('Missing or invalid wrongAnswerExplanation field');
    }
    if (explanation.rightAnswerExplanation.trim() === '') {
      throw new Error('rightAnswerExplanation cannot be empty');
    }
    if (explanation.wrongAnswerExplanation.trim() === '') {
      throw new Error('wrongAnswerExplanation cannot be empty');
    }
  }

  /**
   * Validate quiz schema - checks that parsed JSON has correct structure
   * @param {Object} quiz - Parsed quiz object
   * @param {number} expectedCount - Expected number of questions
   * @throws {Error} If schema is invalid with specific field info
   */
  function validateQuizSchema(quiz, expectedCount) {
    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      throw new Error('Missing or invalid questions array');
    }
    if (quiz.questions.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} questions, got ${quiz.questions.length}`);
    }

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      if (!q.question || typeof q.question !== 'string') {
        throw new Error(`Question ${i + 1}: missing question text`);
      }
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${i + 1}: must have exactly 4 options`);
      }
      if (typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3) {
        throw new Error(`Question ${i + 1}: correct must be 0-3`);
      }
    }
  }

  /**
   * Check if an error is a parse/validation error (should retry) vs API error (should not retry)
   * @param {Error} error - The error to check
   * @returns {boolean} True if this is a parse/validation error that should trigger retry
   */
  function isParseOrValidationError(error) {
    const message = error.message || '';
    // API errors that should NOT trigger retry
    const apiErrors = [
      'rate limit',
      'rate_limit',
      'insufficient_quota',
      'invalid_api_key',
      'invalid api key',
      'authentication',
      'unauthorized',
      'network',
      'timeout',
      'ECONNREFUSED',
      'ENOTFOUND'
    ];
    const isApiError = apiErrors.some(e => message.toLowerCase().includes(e.toLowerCase()));
    return !isApiError;
  }

  // Language code to full name mapping
  const LANGUAGE_NAMES = {
    'en': 'English',
    'pt-PT': 'Portuguese (European)',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'nl': 'Dutch',
    'no': 'Norwegian (Bokmål)',
    'ru': 'Russian'
  };

  /**
   * Generate quiz questions using OpenRouter
   * @param {string} topic - The topic to generate questions about
   * @param {string} gradeLevel - The grade level for the questions
   * @param {string} apiKey - The OpenRouter API key
   * @param {Object} [options] - Optional settings
   * @param {Array<string>} [options.previousQuestions] - Questions to exclude (for continue feature)
   * @param {string} [options.language] - Language code for content generation (e.g., 'en', 'pt-PT')
   * @param {number} [options.questionCount] - Number of questions to generate (default: 5)
   * @returns {Promise<{language: string, questions: Array, model: string, usage: {promptTokens: number, completionTokens: number, totalTokens: number, costUsd: number}}>} Object with language, questions, model, and usage data
   */
  export async function generateQuestions(topic, gradeLevel = 'middle school', apiKey, options = {}) {
    const startTime = performance.now();
    const { previousQuestions = [], language = 'en', questionCount = 5 } = options;
    const languageName = LANGUAGE_NAMES[language] || 'English';
    logger.debug('Generating questions', { topic, gradeLevel, language, previousQuestionsCount: previousQuestions.length });

    if (!apiKey) {
      throw new Error('API key is required');
    }

    // Build exclusion section if there are previous questions
    const exclusionSection = previousQuestions.length > 0
      ? `
IMPORTANT - AVOID DUPLICATE QUESTIONS:
The following questions have already been asked. Generate NEW questions
that cover DIFFERENT aspects of the topic:

Previously asked questions:
${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

If you cannot generate 5 completely new questions, generate as many new
ones as possible and note any that might overlap.
`
      : '';

    // Build the prompt for question generation
    const prompt = `You are an expert educational content creator. Generate exactly ${questionCount}
  multiple-choice questions about "${topic}" appropriate for ${gradeLevel} students.
${exclusionSection}

  LANGUAGE REQUIREMENT (CRITICAL):
  - Generate ALL content in ${languageName} (${language})
  - The questions, ALL answer options, and any text must be in ${languageName}
  - Do NOT auto-detect language from the topic
  - Even if the topic is written in a different language, respond in ${languageName}
  - Do NOT mix languages - everything must be in ${languageName}

  Requirements:
  - Each question should have 4 answer options (A, B, C, D)
  - Only one correct answer per question
  - Include a mix of difficulty levels: easy, medium, and challenging
  - Questions should test understanding, not just memorization
  - Use clear, concise language appropriate for ${gradeLevel}
  - Avoid ambiguous phrasing
  - No trick questions

  CRITICAL - Answer Option Quality:
  - Each answer option must represent a DISTINCT claim
  - Wrong answers must be factually incorrect, not alternative phrasings of the correct answer
  - NEVER generate logical inverse pairs (e.g., "X increases Y" and "not-X decreases Y" are the same fact)
  - Each wrong answer (distractor) should test a different misconception

  CORRECT ANSWER DISTRIBUTION:
  - Distribute correct answers across positions A, B, C, D
  - Vary which position has the correct answer across all questions
  - Do NOT cluster all correct answers in the same position

  Return your response as a JSON object with this exact structure:
  {
    "language": "XX-XX",
    "questions": [
      {
        "question": "The question text here?",
        "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
        "correct": 0,
        "difficulty": "easy"
      }
    ]
  }

  IMPORTANT:
  - The "correct" field must be a NUMBER (0 for first option, 1 for second option, 2 for third
  option, 3 for fourth option)
  - ALL text must be in ${languageName}
  - The "language" field should be "${language}"
  - Return ONLY the JSON object, no other text before or after.`;

    // Retry logic: attempt up to 2 times on parse/validation errors
    const maxAttempts = 2;
    let lastError;
    let lastResult;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // On retry, add stricter JSON instruction to prompt
        const currentPrompt = attempt === 1 ? prompt : `${prompt}

CRITICAL: Respond with ONLY valid JSON. No explanation, no thinking, no markdown. Start your response with { and end with }`;

        // Call OpenRouter
        const result = await callOpenRouter(apiKey, currentPrompt, {
          maxTokens: 2048,
          temperature: 0.7
        });
        lastResult = result;

        logger.debug('OpenRouter raw response received', { attempt });

        // Parse JSON from response using robust extractor
        let data;
        try {
          data = extractJSON(result.text);
        } catch (parseError) {
          logger.error('Failed to parse questions JSON', { parseError: parseError.message, attempt });
          throw new Error('Invalid response format from AI');
        }

        // Validate schema with detailed error messages
        try {
          validateQuizSchema(data, questionCount);
        } catch (validationError) {
          logger.error('Quiz schema validation failed', { error: validationError.message, attempt });
          throw validationError;
        }

        const duration = Math.round(performance.now() - startTime);
        logger.debug('Questions generated successfully', {
          language: data.language,
          count: data.questions.length,
          model: result.model,
          attempt
        });
        logger.perf('quiz_generation', { value: duration, status: 'success', topic, model: result.model });

        return {
          language: data.language || 'EN-US',
          questions: data.questions,
          model: result.model,
          usage: result.usage
        };

      } catch (error) {
        lastError = error;

        // Check if we should retry (only for parse/validation errors, not API errors)
        if (attempt < maxAttempts && isParseOrValidationError(error)) {
          logger.warn('Parse/validation failed, retrying with stricter prompt', {
            attempt,
            error: error.message
          });
          continue;
        }

        // Don't retry API errors or if we've exhausted attempts
        break;
      }
    }

    // All attempts failed
    const duration = Math.round(performance.now() - startTime);
    const model = lastResult?.model || getSelectedModel();
    logger.error('Question generation failed after all attempts', { error: lastError.message, model });
    logger.perf('quiz_generation', { value: duration, status: 'error', topic, model, error: lastError.message });
    throw lastError;
  }

/**
 * Generate a structured explanation for wrong answer using OpenRouter.
 * Returns both the general explanation (cacheable) and personalized feedback.
 * @param {string} question - The question text
 * @param {string} userAnswer - The user's answer
 * @param {string} correctAnswer - The correct answer
 * @param {Object} options - Configuration options
 * @param {string} [options.gradeLevel='middle school'] - The grade level
 * @param {string} options.apiKey - The OpenRouter API key (required)
 * @param {string} [options.language='en'] - Language code for the explanation
 * @returns {Promise<{rightAnswerExplanation: string, wrongAnswerExplanation: string}>} Structured explanation
 */
export async function generateExplanation(question, userAnswer, correctAnswer, { gradeLevel = 'middle school', apiKey, language = 'en' } = {}) {
  const languageName = LANGUAGE_NAMES[language] || 'English';
  logger.debug('Generating structured explanation for incorrect answer', { language });

  if (!apiKey) {
    throw new Error('API key is required');
  }

  const prompt = `A ${gradeLevel} student answered a quiz question incorrectly. Provide an explanation in JSON format.

Question: ${question}
Student's answer: ${userAnswer}
Correct answer: ${correctAnswer}

Return a JSON object with exactly these two fields:
{
  "rightAnswerExplanation": "Why the correct answer is right (2-3 sentences, educational, encouraging)",
  "wrongAnswerExplanation": "Why the student's specific answer was incorrect (1-2 sentences, helpful)"
}

Requirements:
- Be encouraging and supportive
- Use language appropriate for ${gradeLevel} level
- Write in ${languageName} (${language})
- Return ONLY the JSON object, no other text`;

  // Retry logic: attempt up to 2 times on parse/validation errors
  const maxAttempts = 2;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // On retry, add stricter JSON instruction to prompt
      const currentPrompt = attempt === 1 ? prompt : `${prompt}

CRITICAL: Respond with ONLY valid JSON. No explanation, no thinking, no markdown. Start your response with { and end with }`;

      const result = await callOpenRouter(apiKey, currentPrompt, {
        maxTokens: 500,
        temperature: 0.7
      });

      // Parse JSON response using robust extractor
      let data;
      try {
        data = extractJSON(result.text);
      } catch (parseError) {
        logger.error('Failed to parse explanation JSON', { parseError: parseError.message, attempt });
        throw new Error('Invalid response format from AI');
      }

      // Validate schema
      try {
        validateExplanationSchema(data);
      } catch (validationError) {
        logger.error('Explanation schema validation failed', { error: validationError.message, attempt });
        throw validationError;
      }

      logger.debug('Structured explanation generated successfully', { attempt });

      return {
        rightAnswerExplanation: data.rightAnswerExplanation,
        wrongAnswerExplanation: data.wrongAnswerExplanation
      };

    } catch (error) {
      lastError = error;

      // Check if we should retry (only for parse/validation errors, not API errors)
      if (attempt < maxAttempts && isParseOrValidationError(error)) {
        logger.warn('Explanation parse/validation failed, retrying with stricter prompt', {
          attempt,
          error: error.message
        });
        continue;
      }

      // Don't retry API errors or if we've exhausted attempts
      break;
    }
  }

  // All attempts failed
  logger.error('Explanation generation failed after all attempts', { error: lastError.message });
  throw lastError;
}

/**
 * Generate only the wrong answer explanation (when right answer explanation is already cached).
 * @param {string} question - The question text
 * @param {string} userAnswer - The user's answer
 * @param {string} correctAnswer - The correct answer
 * @param {Object} options - Configuration options
 * @param {string} [options.gradeLevel='middle school'] - The grade level
 * @param {string} options.apiKey - The OpenRouter API key (required)
 * @param {string} [options.language='en'] - Language code for the explanation
 * @returns {Promise<string>} Wrong answer explanation text
 */
export async function generateWrongAnswerExplanation(question, userAnswer, correctAnswer, { gradeLevel = 'middle school', apiKey, language = 'en' } = {}) {
  const languageName = LANGUAGE_NAMES[language] || 'English';
  logger.debug('Generating wrong answer explanation only', { language });

  if (!apiKey) {
    throw new Error('API key is required');
  }

  const prompt = `A ${gradeLevel} student answered a quiz question incorrectly.

Question: ${question}
Student's answer: ${userAnswer}
Correct answer: ${correctAnswer}

Explain briefly (1-2 sentences) why the student's specific answer "${userAnswer}" was incorrect.
Be helpful and encouraging. Write in ${languageName} (${language}).
Provide only the explanation, no other text.`;

  try {
    // Use higher maxTokens for reasoning models that need tokens for chain-of-thought
    const result = await callOpenRouter(apiKey, prompt, {
      maxTokens: 500,
      temperature: 0.7
    });

    logger.debug('Wrong answer explanation generated successfully');

    return result.text.trim();

  } catch (error) {
    logger.error('Wrong answer explanation generation failed', { error: error.message });
    throw error;
  }
}