/**
 * Shuffle utility for answer randomization
 * Prevents position memorization on quiz replays
 */

/**
 * Standard answer option labels (A, B, C, D)
 * @type {readonly string[]}
 */
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

/**
 * Regex pattern to match answer option prefixes
 * Handles formats: "A) text", "A. text", "a) text", "a. text"
 * @type {RegExp}
 */
const PREFIX_PATTERN = /^[A-Da-d][).]\s*/;

/**
 * Strip letter prefix from an option string
 * @param {string} option - Option text potentially with prefix
 * @returns {string} - Option text without prefix
 * @example
 * stripPrefix('A) Paris') // returns 'Paris'
 * stripPrefix('b. London') // returns 'London'
 * stripPrefix('Berlin') // returns 'Berlin'
 */
export function stripPrefix(option) {
  if (typeof option !== 'string') return option;
  return option.replace(PREFIX_PATTERN, '');
}

/**
 * Add letter prefix to an option based on its position
 * @param {string} option - Clean option text (without prefix)
 * @param {number} index - Position index (0=A, 1=B, 2=C, 3=D)
 * @returns {string} - Option with prefix like "A) text"
 * @example
 * addPrefix('Paris', 0) // returns 'A) Paris'
 * addPrefix('London', 1) // returns 'B) London'
 */
export function addPrefix(option, index) {
  const label = OPTION_LABELS[index] || String.fromCharCode(65 + index);
  return `${label}) ${option}`;
}

/**
 * Fisher-Yates shuffle algorithm
 * Creates a new shuffled array without mutating the original
 * @param {Array} array - Array to shuffle
 * @returns {Array} - New shuffled array
 */
function fisherYatesShuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Shuffle answer options for a question
 * Returns a new question object with shuffled options and updated correct index.
 * Labels are normalized to sequential A, B, C, D after shuffling (fixes Issue #79).
 *
 * @param {Object} question - Question object with options and correct index
 * @param {string} question.question - The question text
 * @param {Array<string>} question.options - Array of answer options
 * @param {number} question.correct - Index of correct answer (0-3)
 * @param {string} [question.difficulty] - Optional difficulty level
 * @returns {Object} - New question object with shuffled options and updated correct index
 */
export function shuffleQuestionOptions(question) {
  const { options, correct, ...rest } = question;

  // Handle edge cases
  if (!options || options.length === 0) {
    return question;
  }

  if (options.length === 1) {
    return question;
  }

  // Strip existing prefixes to get clean answer text
  const cleanOptions = options.map((opt) => stripPrefix(opt));

  // Create indices array and shuffle it
  const indices = options.map((_, i) => i);
  const shuffledIndices = fisherYatesShuffle(indices);

  // Reorder clean options based on shuffled indices, then add sequential labels
  const shuffledOptions = shuffledIndices.map((originalIndex, newIndex) =>
    addPrefix(cleanOptions[originalIndex], newIndex)
  );

  // Find new position of correct answer
  const newCorrectIndex = shuffledIndices.indexOf(correct);

  return {
    ...rest,
    options: shuffledOptions,
    correct: newCorrectIndex,
  };
}

/**
 * Shuffle all questions in an array
 * Each question gets its options shuffled independently
 *
 * @param {Array<Object>} questions - Array of question objects
 * @returns {Array<Object>} - New array with shuffled options in each question
 */
export function shuffleAllQuestions(questions) {
  if (!questions || !Array.isArray(questions)) {
    return questions;
  }

  return questions.map((q) => shuffleQuestionOptions(q));
}

/**
 * Shuffle options and return mapping for answer tracking.
 * Used by PartyQuizView to shuffle options while tracking original indices.
 *
 * @param {Array<string>} options - Array of answer options
 * @param {number} correctIndex - Index of correct answer in original array
 * @returns {{shuffledOptions: Array<string>, shuffleMap: Array<number>, newCorrectIndex: number}}
 */
export function shuffleOptions(options, correctIndex) {
  if (!options || options.length === 0) {
    return {
      shuffledOptions: options || [],
      shuffleMap: [],
      newCorrectIndex: correctIndex,
    };
  }

  // Strip existing prefixes to get clean answer text
  const cleanOptions = options.map((opt) => stripPrefix(opt));

  // Create indices array and shuffle it
  const indices = options.map((_, i) => i);
  const shuffledIndices = fisherYatesShuffle(indices);

  // Reorder clean options based on shuffled indices, then add sequential labels
  const shuffledOptions = shuffledIndices.map((originalIndex, newIndex) =>
    addPrefix(cleanOptions[originalIndex], newIndex)
  );

  // shuffleMap[newIndex] = originalIndex
  // Find new position of correct answer
  const newCorrectIndex = shuffledIndices.indexOf(correctIndex);

  return {
    shuffledOptions,
    shuffleMap: shuffledIndices,
    newCorrectIndex,
  };
}
