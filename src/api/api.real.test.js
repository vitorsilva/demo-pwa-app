import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the dependencies before importing the module
vi.mock('./openrouter-client.js', () => ({
  callOpenRouter: vi.fn()
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    perf: vi.fn()
  }
}));

import { generateQuestions, generateExplanation } from './api.real.js';
import { callOpenRouter } from './openrouter-client.js';

// Helper to generate mock questions of a specific count
function generateMockQuestions(count) {
  return Array.from({ length: count }, (_, i) => ({
    question: `Q${i + 1}?`,
    options: ['A', 'B', 'C', 'D'],
    correct: i % 4,
    difficulty: ['easy', 'medium', 'challenging'][i % 3]
  }));
}

describe('generateQuestions prompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should include guidance for distinct answer options', async () => {
    // Arrange: Mock the API to capture the prompt
    let capturedPrompt = '';
    callOpenRouter.mockImplementation(async (apiKey, prompt) => {
      capturedPrompt = prompt;
      return {
        text: JSON.stringify({
          language: 'EN-US',
          questions: [
            { question: 'Q1?', options: ['A', 'B', 'C', 'D'], correct: 0, difficulty: 'easy' },
            { question: 'Q2?', options: ['A', 'B', 'C', 'D'], correct: 1, difficulty: 'easy' },
            { question: 'Q3?', options: ['A', 'B', 'C', 'D'], correct: 2, difficulty: 'medium' },
            { question: 'Q4?', options: ['A', 'B', 'C', 'D'], correct: 3, difficulty: 'medium' },
            { question: 'Q5?', options: ['A', 'B', 'C', 'D'], correct: 0, difficulty: 'challenging' }
          ]
        })
      };
    });

    // Act: Call the function
    await generateQuestions('Test Topic', 'middle school', 'fake-api-key');

    // Assert: Check that the prompt contains guidance for distinct options
    expect(capturedPrompt).toContain('DISTINCT');
    expect(capturedPrompt).toMatch(/logical.*inverse|inverse.*logical/i);
    expect(capturedPrompt).toMatch(/factually incorrect|genuinely incorrect/i);
  });

  it('should include previous questions in prompt when provided', async () => {
    // Arrange: Mock the API to capture the prompt
    let capturedPrompt = '';
    callOpenRouter.mockImplementation(async (apiKey, prompt) => {
      capturedPrompt = prompt;
      return {
        text: JSON.stringify({
          language: 'EN-US',
          questions: [
            { question: 'Q1?', options: ['A', 'B', 'C', 'D'], correct: 0, difficulty: 'easy' },
            { question: 'Q2?', options: ['A', 'B', 'C', 'D'], correct: 1, difficulty: 'easy' },
            { question: 'Q3?', options: ['A', 'B', 'C', 'D'], correct: 2, difficulty: 'medium' },
            { question: 'Q4?', options: ['A', 'B', 'C', 'D'], correct: 3, difficulty: 'medium' },
            { question: 'Q5?', options: ['A', 'B', 'C', 'D'], correct: 0, difficulty: 'challenging' }
          ]
        })
      };
    });

    // Act: Call with previous questions
    const previousQuestions = [
      'What is the capital of France?',
      'Who wrote Romeo and Juliet?'
    ];
    await generateQuestions('Test Topic', 'middle school', 'fake-api-key', { previousQuestions });

    // Assert: Check that previous questions are included
    expect(capturedPrompt).toContain('AVOID DUPLICATE QUESTIONS');
    expect(capturedPrompt).toContain('What is the capital of France?');
    expect(capturedPrompt).toContain('Who wrote Romeo and Juliet?');
  });

  it('should not include exclusion section when no previous questions', async () => {
    // Arrange: Mock the API to capture the prompt
    let capturedPrompt = '';
    callOpenRouter.mockImplementation(async (apiKey, prompt) => {
      capturedPrompt = prompt;
      return {
        text: JSON.stringify({
          language: 'EN-US',
          questions: [
            { question: 'Q1?', options: ['A', 'B', 'C', 'D'], correct: 0, difficulty: 'easy' },
            { question: 'Q2?', options: ['A', 'B', 'C', 'D'], correct: 1, difficulty: 'easy' },
            { question: 'Q3?', options: ['A', 'B', 'C', 'D'], correct: 2, difficulty: 'medium' },
            { question: 'Q4?', options: ['A', 'B', 'C', 'D'], correct: 3, difficulty: 'medium' },
            { question: 'Q5?', options: ['A', 'B', 'C', 'D'], correct: 0, difficulty: 'challenging' }
          ]
        })
      };
    });

    // Act: Call without previous questions
    await generateQuestions('Test Topic', 'middle school', 'fake-api-key');

    // Assert: Exclusion section should not be present
    expect(capturedPrompt).not.toContain('AVOID DUPLICATE QUESTIONS');
  });

  it('should use default questionCount of 5 in prompt', async () => {
    let capturedPrompt = '';
    callOpenRouter.mockImplementation(async (apiKey, prompt) => {
      capturedPrompt = prompt;
      return {
        text: JSON.stringify({
          language: 'EN-US',
          questions: generateMockQuestions(5)
        })
      };
    });

    await generateQuestions('Test Topic', 'middle school', 'fake-api-key');

    expect(capturedPrompt).toContain('Generate exactly 5');
  });

  it('should use custom questionCount in prompt', async () => {
    let capturedPrompt = '';
    callOpenRouter.mockImplementation(async (apiKey, prompt) => {
      capturedPrompt = prompt;
      return {
        text: JSON.stringify({
          language: 'EN-US',
          questions: generateMockQuestions(10)
        })
      };
    });

    await generateQuestions('Test Topic', 'middle school', 'fake-api-key', { questionCount: 10 });

    expect(capturedPrompt).toContain('Generate exactly 10');
  });

  it('should validate response has correct number of questions', async () => {
    callOpenRouter.mockImplementation(async () => {
      return {
        text: JSON.stringify({
          language: 'EN-US',
          questions: generateMockQuestions(3) // Wrong count
        })
      };
    });

    await expect(
      generateQuestions('Test Topic', 'middle school', 'fake-api-key', { questionCount: 5 })
    ).rejects.toThrow('Expected 5 questions, got 3');
  });

  it('should accept response with matching questionCount', async () => {
    callOpenRouter.mockImplementation(async () => {
      return {
        text: JSON.stringify({
          language: 'EN-US',
          questions: generateMockQuestions(15)
        })
      };
    });

    const result = await generateQuestions('Test Topic', 'middle school', 'fake-api-key', { questionCount: 15 });

    expect(result.questions).toHaveLength(15);
  });
});

describe('generateExplanation JSON parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validExplanation = {
    rightAnswerExplanation: 'Paris is the capital of France.',
    wrongAnswerExplanation: 'London is the capital of the UK, not France.'
  };

  it('should parse clean JSON response', async () => {
    callOpenRouter.mockResolvedValue({
      text: JSON.stringify(validExplanation)
    });

    const result = await generateExplanation('What is the capital?', 'London', 'Paris', 'middle school', 'fake-api-key');

    expect(result.rightAnswerExplanation).toBe(validExplanation.rightAnswerExplanation);
    expect(result.wrongAnswerExplanation).toBe(validExplanation.wrongAnswerExplanation);
  });

  it('should parse JSON wrapped in markdown code block', async () => {
    callOpenRouter.mockResolvedValue({
      text: '```json\n' + JSON.stringify(validExplanation) + '\n```'
    });

    const result = await generateExplanation('What is the capital?', 'London', 'Paris', 'middle school', 'fake-api-key');

    expect(result.rightAnswerExplanation).toBe(validExplanation.rightAnswerExplanation);
    expect(result.wrongAnswerExplanation).toBe(validExplanation.wrongAnswerExplanation);
  });

  it('should parse JSON with leading/trailing whitespace', async () => {
    callOpenRouter.mockResolvedValue({
      text: '  \n\n' + JSON.stringify(validExplanation) + '\n\n  '
    });

    const result = await generateExplanation('What is the capital?', 'London', 'Paris', 'middle school', 'fake-api-key');

    expect(result.rightAnswerExplanation).toBe(validExplanation.rightAnswerExplanation);
    expect(result.wrongAnswerExplanation).toBe(validExplanation.wrongAnswerExplanation);
  });

  it('should parse JSON with smart quotes by normalizing them', async () => {
    // This test documents the bug - smart quotes cause JSON.parse to fail
    // The current fallback returns raw JSON as rightAnswerExplanation
    const jsonWithSmartQuotes = '{ "rightAnswerExplanation": "Paris is correct.", "wrongAnswerExplanation": "London is wrong." }';

    callOpenRouter.mockResolvedValue({
      text: jsonWithSmartQuotes
    });

    const result = await generateExplanation('What is the capital?', 'London', 'Paris', 'middle school', 'fake-api-key');

    // BUG: Should parse the content, not return raw JSON
    // Current behavior returns the raw JSON string as rightAnswerExplanation
    expect(result.rightAnswerExplanation).not.toContain('{');
    expect(result.rightAnswerExplanation).not.toContain('"rightAnswerExplanation"');
    expect(result.rightAnswerExplanation).toBe('Paris is correct.');
    expect(result.wrongAnswerExplanation).toBe('London is wrong.');
  });

  it('should parse JSON with extra text before it', async () => {
    // Some LLMs add conversational text before the JSON
    callOpenRouter.mockResolvedValue({
      text: 'Here is the explanation:\n' + JSON.stringify(validExplanation)
    });

    const result = await generateExplanation('What is the capital?', 'London', 'Paris', 'middle school', 'fake-api-key');

    // BUG: Should extract and parse the JSON
    expect(result.rightAnswerExplanation).not.toContain('{');
    expect(result.rightAnswerExplanation).toBe(validExplanation.rightAnswerExplanation);
    expect(result.wrongAnswerExplanation).toBe(validExplanation.wrongAnswerExplanation);
  });

  it('should parse JSON with extra text after it', async () => {
    callOpenRouter.mockResolvedValue({
      text: JSON.stringify(validExplanation) + '\n\nI hope this helps!'
    });

    const result = await generateExplanation('What is the capital?', 'London', 'Paris', 'middle school', 'fake-api-key');

    // BUG: Should extract and parse the JSON
    expect(result.rightAnswerExplanation).not.toContain('{');
    expect(result.rightAnswerExplanation).toBe(validExplanation.rightAnswerExplanation);
    expect(result.wrongAnswerExplanation).toBe(validExplanation.wrongAnswerExplanation);
  });

  it('should handle JSON with BOM character', async () => {
    // BOM (Byte Order Mark) can appear at the start of some text
    const BOM = '\uFEFF';
    callOpenRouter.mockResolvedValue({
      text: BOM + JSON.stringify(validExplanation)
    });

    const result = await generateExplanation('What is the capital?', 'London', 'Paris', 'middle school', 'fake-api-key');

    expect(result.rightAnswerExplanation).not.toContain('{');
    expect(result.rightAnswerExplanation).toBe(validExplanation.rightAnswerExplanation);
  });
});

describe('generateQuestions retry logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to generate valid mock questions
  function generateValidQuestions(count = 5) {
    return Array.from({ length: count }, (_, i) => ({
      question: `Question ${i + 1}?`,
      options: ['A) opt1', 'B) opt2', 'C) opt3', 'D) opt4'],
      correct: i % 4,
      difficulty: 'easy'
    }));
  }

  it('should succeed on first attempt when response is valid', async () => {
    callOpenRouter.mockResolvedValueOnce({
      text: JSON.stringify({ language: 'en', questions: generateValidQuestions(5) }),
      model: 'test-model',
      usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 }
    });

    const result = await generateQuestions('Test', 'middle school', 'fake-key');

    expect(result.questions).toHaveLength(5);
    expect(callOpenRouter).toHaveBeenCalledTimes(1);
  });

  it('should retry with stricter prompt on parse failure', async () => {
    let callCount = 0;
    callOpenRouter.mockImplementation(async (apiKey, prompt) => {
      callCount++;
      if (callCount === 1) {
        // First call: return invalid response
        return { text: 'This is not JSON at all' };
      }
      // Second call: return valid response
      return {
        text: JSON.stringify({ language: 'en', questions: generateValidQuestions(5) }),
        model: 'test-model',
        usage: {}
      };
    });

    const result = await generateQuestions('Test', 'middle school', 'fake-key');

    expect(result.questions).toHaveLength(5);
    expect(callOpenRouter).toHaveBeenCalledTimes(2);
    // Second call should have stricter prompt
    const secondCallPrompt = callOpenRouter.mock.calls[1][1];
    expect(secondCallPrompt).toContain('CRITICAL: Respond with ONLY valid JSON');
  });

  it('should retry on schema validation failure', async () => {
    let callCount = 0;
    callOpenRouter.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // First call: return JSON with missing 'correct' field
        return {
          text: JSON.stringify({
            language: 'en',
            questions: [
              { question: 'Q?', options: ['A', 'B', 'C', 'D'] } // missing 'correct'
            ]
          })
        };
      }
      // Second call: return valid response
      return {
        text: JSON.stringify({ language: 'en', questions: generateValidQuestions(5) }),
        model: 'test-model',
        usage: {}
      };
    });

    const result = await generateQuestions('Test', 'middle school', 'fake-key');

    expect(result.questions).toHaveLength(5);
    expect(callOpenRouter).toHaveBeenCalledTimes(2);
  });

  it('should NOT retry on rate limit error', async () => {
    callOpenRouter.mockRejectedValueOnce(new Error('Rate limit exceeded'));

    await expect(
      generateQuestions('Test', 'middle school', 'fake-key')
    ).rejects.toThrow('Rate limit exceeded');

    expect(callOpenRouter).toHaveBeenCalledTimes(1);
  });

  it('should NOT retry on authentication error', async () => {
    callOpenRouter.mockRejectedValueOnce(new Error('Invalid API key'));

    await expect(
      generateQuestions('Test', 'middle school', 'fake-key')
    ).rejects.toThrow('Invalid API key');

    expect(callOpenRouter).toHaveBeenCalledTimes(1);
  });

  it('should fail after max retry attempts', async () => {
    callOpenRouter.mockResolvedValue({
      text: 'Invalid JSON response'
    });

    await expect(
      generateQuestions('Test', 'middle school', 'fake-key')
    ).rejects.toThrow('Invalid response format from AI');

    expect(callOpenRouter).toHaveBeenCalledTimes(2); // 2 attempts max
  });

  it('should handle DeepSeek thinking tags in response', async () => {
    callOpenRouter.mockResolvedValueOnce({
      text: `<think>Let me create a quiz...</think>${JSON.stringify({ language: 'en', questions: generateValidQuestions(5) })}`,
      model: 'deepseek-r1',
      usage: {}
    });

    const result = await generateQuestions('Test', 'middle school', 'fake-key');

    expect(result.questions).toHaveLength(5);
    expect(callOpenRouter).toHaveBeenCalledTimes(1); // No retry needed
  });
});

describe('generateQuestions schema validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject question missing question text', async () => {
    callOpenRouter.mockResolvedValue({
      text: JSON.stringify({
        language: 'en',
        questions: [
          { options: ['A', 'B', 'C', 'D'], correct: 0 } // missing 'question'
        ]
      })
    });

    await expect(
      generateQuestions('Test', 'middle school', 'fake-key', { questionCount: 1 })
    ).rejects.toThrow('Question 1: missing question text');
  });

  it('should reject question with wrong number of options', async () => {
    callOpenRouter.mockResolvedValue({
      text: JSON.stringify({
        language: 'en',
        questions: [
          { question: 'Q?', options: ['A', 'B', 'C'], correct: 0 } // only 3 options
        ]
      })
    });

    await expect(
      generateQuestions('Test', 'middle school', 'fake-key', { questionCount: 1 })
    ).rejects.toThrow('Question 1: must have exactly 4 options');
  });

  it('should reject question with invalid correct index', async () => {
    callOpenRouter.mockResolvedValue({
      text: JSON.stringify({
        language: 'en',
        questions: [
          { question: 'Q?', options: ['A', 'B', 'C', 'D'], correct: 5 } // invalid index
        ]
      })
    });

    await expect(
      generateQuestions('Test', 'middle school', 'fake-key', { questionCount: 1 })
    ).rejects.toThrow('Question 1: correct must be 0-3');
  });

  it('should reject question with string correct value', async () => {
    callOpenRouter.mockResolvedValue({
      text: JSON.stringify({
        language: 'en',
        questions: [
          { question: 'Q?', options: ['A', 'B', 'C', 'D'], correct: '0' } // string instead of number
        ]
      })
    });

    await expect(
      generateQuestions('Test', 'middle school', 'fake-key', { questionCount: 1 })
    ).rejects.toThrow('Question 1: correct must be 0-3');
  });

  it('should accept valid quiz with all required fields', async () => {
    callOpenRouter.mockResolvedValue({
      text: JSON.stringify({
        language: 'en',
        questions: [
          { question: 'What is 2+2?', options: ['A) 3', 'B) 4', 'C) 5', 'D) 6'], correct: 1, difficulty: 'easy' }
        ]
      }),
      model: 'test',
      usage: {}
    });

    const result = await generateQuestions('Test', 'middle school', 'fake-key', { questionCount: 1 });

    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].correct).toBe(1);
  });
});

describe('generateExplanation retry logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validExplanation = {
    rightAnswerExplanation: 'The correct answer is B because Paris is the capital of France.',
    wrongAnswerExplanation: 'London is the capital of the UK, not France.'
  };

  it('should succeed on first attempt when response is valid', async () => {
    callOpenRouter.mockResolvedValueOnce({
      text: JSON.stringify(validExplanation)
    });

    const result = await generateExplanation('What is the capital?', 'London', 'Paris', 'middle school', 'fake-key');

    expect(result.rightAnswerExplanation).toBe(validExplanation.rightAnswerExplanation);
    expect(result.wrongAnswerExplanation).toBe(validExplanation.wrongAnswerExplanation);
    expect(callOpenRouter).toHaveBeenCalledTimes(1);
  });

  it('should retry with stricter prompt on parse failure', async () => {
    let callCount = 0;
    callOpenRouter.mockImplementation(async (apiKey, prompt) => {
      callCount++;
      if (callCount === 1) {
        return { text: 'This is not JSON at all' };
      }
      return { text: JSON.stringify(validExplanation) };
    });

    const result = await generateExplanation('What is the capital?', 'London', 'Paris', 'middle school', 'fake-key');

    expect(result.rightAnswerExplanation).toBe(validExplanation.rightAnswerExplanation);
    expect(callOpenRouter).toHaveBeenCalledTimes(2);
    const secondCallPrompt = callOpenRouter.mock.calls[1][1];
    expect(secondCallPrompt).toContain('CRITICAL: Respond with ONLY valid JSON');
  });

  it('should retry on schema validation failure', async () => {
    let callCount = 0;
    callOpenRouter.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // Missing wrongAnswerExplanation
        return { text: JSON.stringify({ rightAnswerExplanation: 'Something' }) };
      }
      return { text: JSON.stringify(validExplanation) };
    });

    const result = await generateExplanation('What is the capital?', 'London', 'Paris', 'middle school', 'fake-key');

    expect(result.rightAnswerExplanation).toBe(validExplanation.rightAnswerExplanation);
    expect(callOpenRouter).toHaveBeenCalledTimes(2);
  });

  it('should NOT retry on rate limit error', async () => {
    callOpenRouter.mockRejectedValueOnce(new Error('Rate limit exceeded'));

    await expect(
      generateExplanation('What is the capital?', 'London', 'Paris', 'middle school', 'fake-key')
    ).rejects.toThrow('Rate limit exceeded');

    expect(callOpenRouter).toHaveBeenCalledTimes(1);
  });

  it('should fail after max retry attempts', async () => {
    callOpenRouter.mockResolvedValue({
      text: 'Invalid JSON response'
    });

    await expect(
      generateExplanation('What is the capital?', 'London', 'Paris', 'middle school', 'fake-key')
    ).rejects.toThrow('Invalid response format from AI');

    expect(callOpenRouter).toHaveBeenCalledTimes(2);
  });

  it('should handle DeepSeek thinking tags in response', async () => {
    callOpenRouter.mockResolvedValueOnce({
      text: `<think>Let me explain this...</think>${JSON.stringify(validExplanation)}`
    });

    const result = await generateExplanation('What is the capital?', 'London', 'Paris', 'middle school', 'fake-key');

    expect(result.rightAnswerExplanation).toBe(validExplanation.rightAnswerExplanation);
    expect(callOpenRouter).toHaveBeenCalledTimes(1);
  });
});

describe('generateExplanation schema validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject response missing rightAnswerExplanation', async () => {
    callOpenRouter.mockResolvedValue({
      text: JSON.stringify({ wrongAnswerExplanation: 'Something' })
    });

    await expect(
      generateExplanation('Q?', 'A', 'B', 'middle school', 'fake-key')
    ).rejects.toThrow('Missing or invalid rightAnswerExplanation field');
  });

  it('should reject response missing wrongAnswerExplanation', async () => {
    callOpenRouter.mockResolvedValue({
      text: JSON.stringify({ rightAnswerExplanation: 'Something' })
    });

    await expect(
      generateExplanation('Q?', 'A', 'B', 'middle school', 'fake-key')
    ).rejects.toThrow('Missing or invalid wrongAnswerExplanation field');
  });

  it('should reject empty rightAnswerExplanation', async () => {
    callOpenRouter.mockResolvedValue({
      text: JSON.stringify({ rightAnswerExplanation: '', wrongAnswerExplanation: 'Something' })
    });

    await expect(
      generateExplanation('Q?', 'A', 'B', 'middle school', 'fake-key')
    ).rejects.toThrow('rightAnswerExplanation cannot be empty');
  });

  it('should reject empty wrongAnswerExplanation', async () => {
    callOpenRouter.mockResolvedValue({
      text: JSON.stringify({ rightAnswerExplanation: 'Something', wrongAnswerExplanation: '  ' })
    });

    await expect(
      generateExplanation('Q?', 'A', 'B', 'middle school', 'fake-key')
    ).rejects.toThrow('wrongAnswerExplanation cannot be empty');
  });

  it('should accept valid explanation with all required fields', async () => {
    const validExplanation = {
      rightAnswerExplanation: 'The answer is correct because...',
      wrongAnswerExplanation: 'Your answer was incorrect because...'
    };

    callOpenRouter.mockResolvedValue({
      text: JSON.stringify(validExplanation)
    });

    const result = await generateExplanation('Q?', 'A', 'B', 'middle school', 'fake-key');

    expect(result.rightAnswerExplanation).toBe(validExplanation.rightAnswerExplanation);
    expect(result.wrongAnswerExplanation).toBe(validExplanation.wrongAnswerExplanation);
  });
});
