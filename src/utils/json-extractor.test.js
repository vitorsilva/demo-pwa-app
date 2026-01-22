import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractJSON } from './json-extractor.js';

// Mock the logger to verify error logging
vi.mock('./logger.js', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('JSON Extractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe('extractJSON', () => {
    describe('clean JSON input', () => {
      it('should parse clean JSON object directly', () => {
        const input = '{"name": "test", "value": 42}';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test', value: 42 });
      });

      it('should parse clean JSON array directly', () => {
        const input = '[1, 2, 3]';
        const result = extractJSON(input);
        expect(result).toEqual([1, 2, 3]);
      });

      it('should handle JSON with whitespace', () => {
        const input = '  { "name": "test" }  ';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });
    });

    describe('markdown code blocks', () => {
      it('should extract JSON from ```json code block', () => {
        const input = '```json\n{"name": "test"}\n```';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });

      it('should extract JSON from ``` code block (no language)', () => {
        const input = '```\n{"name": "test"}\n```';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });

      it('should handle code block with extra whitespace', () => {
        const input = '```json\n\n  {"name": "test"}  \n\n```';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });

      it('should handle text before code block', () => {
        const input = 'Here is the JSON:\n```json\n{"name": "test"}\n```';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });

      it('should handle text after code block', () => {
        const input = '```json\n{"name": "test"}\n```\nHope this helps!';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });
    });

    describe('BOM and special characters', () => {
      it('should remove BOM character at start', () => {
        const bom = String.fromCharCode(0xfeff);
        const input = bom + '{"name": "test"}';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });

      it('should convert smart double quotes to straight quotes', () => {
        const input = '{"name": "test"}'; // Using smart quotes
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });

      it('should convert smart single quotes in values', () => {
        const input = '{"name": "it\'s a test"}'; // Smart single quote
        const result = extractJSON(input);
        expect(result).toEqual({ name: "it's a test" });
      });
    });

    describe('JSON extraction from text', () => {
      it('should extract JSON object from text with prefix', () => {
        const input = 'Sure! Here is the data:\n{"name": "test", "value": 42}';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test', value: 42 });
      });

      it('should extract JSON object from text with suffix', () => {
        const input = '{"name": "test", "value": 42}\n\nLet me know if you need more!';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test', value: 42 });
      });

      it('should extract JSON array from text', () => {
        const input = 'Here are the results: [1, 2, 3]';
        const result = extractJSON(input);
        expect(result).toEqual([1, 2, 3]);
      });

      it('should handle nested JSON objects', () => {
        const input = '{"outer": {"inner": "value"}}';
        const result = extractJSON(input);
        expect(result).toEqual({ outer: { inner: 'value' } });
      });

      it('should handle JSON with arrays inside objects', () => {
        const input = '{"items": [1, 2, 3], "name": "test"}';
        const result = extractJSON(input);
        expect(result).toEqual({ items: [1, 2, 3], name: 'test' });
      });
    });

    describe('DeepSeek thinking tags', () => {
      it('should strip <think> tags and extract JSON', () => {
        const input = `<think>Let me create a quiz about math...</think>{"language": "en", "questions": []}`;
        const result = extractJSON(input);
        expect(result).toEqual({ language: 'en', questions: [] });
      });

      it('should handle multiline <think> content', () => {
        const input = `<think>
First, I need to consider the topic.
Then, I'll generate questions.
Let me think about difficulty levels.
</think>
{"name": "test"}`;
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });

      it('should handle <think> tags with text after JSON', () => {
        const input = `<think>Processing...</think>{"value": 42}

I hope this helps!`;
        const result = extractJSON(input);
        expect(result).toEqual({ value: 42 });
      });

      it('should handle case-insensitive <THINK> tags', () => {
        const input = `<THINK>Some reasoning</THINK>{"name": "test"}`;
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });

      it('should handle multiple <think> blocks', () => {
        const input = `<think>First thought</think>Some text<think>Second thought</think>{"result": true}`;
        const result = extractJSON(input);
        expect(result).toEqual({ result: true });
      });
    });

    describe('JSON cleaning (trailing commas and control chars)', () => {
      it('should handle trailing comma in object', () => {
        const input = '{"name": "test", "value": 42,}';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test', value: 42 });
      });

      it('should handle trailing comma in array', () => {
        const input = '{"items": [1, 2, 3,]}';
        const result = extractJSON(input);
        expect(result).toEqual({ items: [1, 2, 3] });
      });

      it('should handle multiple trailing commas', () => {
        const input = '{"outer": {"inner": "value",}, "items": [1, 2,],}';
        const result = extractJSON(input);
        expect(result).toEqual({ outer: { inner: 'value' }, items: [1, 2] });
      });

      it('should handle control characters in JSON', () => {
        // Simulate control char (tab/newline in unexpected place)
        const input = '{"name":\t"test",\n"value": 42}';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test', value: 42 });
      });

      it('should handle JSON in code block with trailing comma', () => {
        const input = '```json\n{"name": "test",}\n```';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });
    });

    describe('real-world LLM response patterns', () => {
      it('should handle quiz generation response', () => {
        const input = `Here are the questions:
\`\`\`json
{
  "language": "en",
  "questions": [
    {
      "question": "What is 2+2?",
      "options": ["A) 3", "B) 4", "C) 5", "D) 6"],
      "correct": 1,
      "difficulty": "easy"
    }
  ]
}
\`\`\`
I hope these questions are helpful!`;
        const result = extractJSON(input);
        expect(result.language).toBe('en');
        expect(result.questions).toHaveLength(1);
        expect(result.questions[0].correct).toBe(1);
      });

      it('should handle explanation response', () => {
        const input = `{
  "rightAnswerExplanation": "The correct answer is B because...",
  "wrongAnswerExplanation": "Your answer A was incorrect because..."
}`;
        const result = extractJSON(input);
        expect(result.rightAnswerExplanation).toContain('correct answer is B');
        expect(result.wrongAnswerExplanation).toContain('answer A was incorrect');
      });

      it('should handle DeepSeek R1 quiz response with thinking', () => {
        const input = `<think>
The user wants a quiz about photosynthesis for middle school.
I should create 5 questions with varying difficulty.
Let me structure the JSON properly.
</think>
{
  "language": "en",
  "questions": [
    {
      "question": "What gas do plants absorb during photosynthesis?",
      "options": ["A) Oxygen", "B) Carbon dioxide", "C) Nitrogen", "D) Hydrogen"],
      "correct": 1,
      "difficulty": "easy"
    }
  ]
}`;
        const result = extractJSON(input);
        expect(result.language).toBe('en');
        expect(result.questions).toHaveLength(1);
        expect(result.questions[0].question).toContain('photosynthesis');
      });
    });

    describe('error handling', () => {
      it('should throw on truly invalid JSON', () => {
        const input = 'This is not JSON at all';
        expect(() => extractJSON(input)).toThrow();
      });

      it('should throw on malformed JSON', () => {
        const input = '{"name": "test"'; // Missing closing brace
        expect(() => extractJSON(input)).toThrow();
      });

      it('should throw on empty input', () => {
        expect(() => extractJSON('')).toThrow();
      });

      it('should throw on whitespace-only input', () => {
        expect(() => extractJSON('   ')).toThrow();
      });

      it('should throw on null input', () => {
        expect(() => extractJSON(null)).toThrow('Input must be a non-empty string');
      });

      it('should throw on undefined input', () => {
        expect(() => extractJSON(undefined)).toThrow('Input must be a non-empty string');
      });

      it('should throw on non-string input', () => {
        expect(() => extractJSON(123)).toThrow('Input must be a non-empty string');
        expect(() => extractJSON({})).toThrow('Input must be a non-empty string');
        expect(() => extractJSON([])).toThrow('Input must be a non-empty string');
      });

      it('should throw specific error for failed extraction', () => {
        const input = 'Some text without any JSON';
        expect(() => extractJSON(input)).toThrow('Failed to extract valid JSON from response');
      });
    });

    describe('cleanJSON function coverage', () => {
      it('should handle trailing comma in nested object', () => {
        const input = '{"a": {"b": 1,}}';
        const result = extractJSON(input);
        expect(result).toEqual({ a: { b: 1 } });
      });

      it('should handle trailing comma in nested array', () => {
        const input = '{"arr": [[1, 2,],]}';
        const result = extractJSON(input);
        expect(result).toEqual({ arr: [[1, 2]] });
      });

      it('should handle control characters in text extraction', () => {
        const input = 'prefix {"name": "test\u0001value"} suffix';
        // The control char should be replaced with space in extracted JSON
        const result = extractJSON(input);
        expect(result.name).toContain('test');
      });

      it('should handle null bytes in JSON', () => {
        const input = '{"name":\u0000"test"}';
        const result = extractJSON(input);
        expect(result.name).toBe('test');
      });

      it('should handle multiple control characters', () => {
        const input = '{"name":\u0001\u0002\u0003"test"}';
        const result = extractJSON(input);
        expect(result.name).toBe('test');
      });
    });

    describe('array extraction edge cases', () => {
      it('should extract standalone array from text', () => {
        const input = 'Here is an array: [1, 2, 3] and more text';
        const result = extractJSON(input);
        expect(result).toEqual([1, 2, 3]);
      });

      it('should extract nested array', () => {
        const input = '[[1, 2], [3, 4]]';
        const result = extractJSON(input);
        expect(result).toEqual([
          [1, 2],
          [3, 4],
        ]);
      });

      it('should extract array with objects', () => {
        const input = '[{"a": 1}, {"b": 2}]';
        const result = extractJSON(input);
        expect(result).toEqual([{ a: 1 }, { b: 2 }]);
      });

      it('should prefer object over array when both present', () => {
        const input = '[1, 2] and {"name": "test"}';
        const result = extractJSON(input);
        // Object should be found first due to order of matching
        expect(result).toEqual({ name: 'test' });
      });

      it('should extract array when no object present', () => {
        const input = 'text [1, 2, 3] more text';
        const result = extractJSON(input);
        expect(result).toEqual([1, 2, 3]);
      });

      it('should handle array with trailing comma', () => {
        const input = '[1, 2, 3,]';
        const result = extractJSON(input);
        expect(result).toEqual([1, 2, 3]);
      });
    });

    describe('object extraction edge cases', () => {
      it('should extract object with greedy matching', () => {
        // Greedy matching should get the entire object
        const input = '{"outer": {"inner": "value"}} extra';
        const result = extractJSON(input);
        expect(result).toEqual({ outer: { inner: 'value' } });
      });

      it('should handle object with braces in string values', () => {
        const input = '{"code": "function() { return {}; }"}';
        const result = extractJSON(input);
        expect(result.code).toContain('function');
      });

      it('should extract object with multiple nesting levels', () => {
        const input = '{"a": {"b": {"c": {"d": 1}}}}';
        const result = extractJSON(input);
        expect(result.a.b.c.d).toBe(1);
      });
    });

    describe('code block edge cases', () => {
      it('should prefer code block JSON over text JSON when both valid', () => {
        const input = '{"fallback": true}```json\n{"codeblock": true}\n```';
        const result = extractJSON(input);
        expect(result).toEqual({ codeblock: true });
      });

      it('should handle multiple code blocks', () => {
        // First code block should be used
        const input = '```json\n{"first": 1}\n```\n```json\n{"second": 2}\n```';
        const result = extractJSON(input);
        expect(result).toEqual({ first: 1 });
      });

      it('should handle code block with trailing comma', () => {
        const input = '```json\n{"name": "test",}\n```';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });
    });

    describe('smart quotes edge cases', () => {
      it('should convert left double smart quote', () => {
        const input = '{\u201Cname": "test"}'; // Left quote only
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });

      it('should convert right double smart quote', () => {
        const input = '{"name\u201D: "test"}'; // Right quote only
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });

      it('should convert left single smart quote', () => {
        const input = '{"name": "it\u2018s"}'; // Left single quote
        const result = extractJSON(input);
        expect(result.name).toContain('it');
      });

      it('should convert right single smart quote', () => {
        const input = '{"name": "it\u2019s"}'; // Right single quote
        const result = extractJSON(input);
        expect(result.name).toContain('it');
      });

      it('should handle mixed smart quotes', () => {
        const input = '{\u201Cname\u201D: \u201Cvalue\u201D}';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'value' });
      });
    });

    describe('BOM edge cases', () => {
      it('should handle BOM followed by object', () => {
        const input = '\uFEFF{"name": "test"}';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });

      it('should handle BOM followed by array', () => {
        const input = '\uFEFF[1, 2, 3]';
        const result = extractJSON(input);
        expect(result).toEqual([1, 2, 3]);
      });

      it('should handle BOM in code block', () => {
        const input = '\uFEFF```json\n{"name": "test"}\n```';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });
    });

    describe('DeepSeek thinking tags edge cases', () => {
      it('should handle <think> tag with no content after', () => {
        const input = '<think>Some thinking</think>{"result": true}';
        const result = extractJSON(input);
        expect(result).toEqual({ result: true });
      });

      it('should handle nested angle brackets in think content', () => {
        const input = '<think>I think <this> is important</think>{"value": 1}';
        const result = extractJSON(input);
        expect(result).toEqual({ value: 1 });
      });

      it('should handle <Think> with mixed case', () => {
        const input = '<Think>reasoning</Think>{"name": "test"}';
        const result = extractJSON(input);
        expect(result).toEqual({ name: 'test' });
      });
    });

    describe('mutation testing coverage', () => {
      it('should use direct parse for clean JSON (not fallback)', async () => {
        // This tests that the direct JSON.parse path works
        // If mutated to skip direct parse, this would fail or use different path
        const input = '{"direct": "parse"}';
        const result = extractJSON(input);
        expect(result).toEqual({ direct: 'parse' });
        // Clean JSON should NOT trigger error logging
        const { logger } = await import('./logger.js');
        expect(logger.error).not.toHaveBeenCalled();
      });

      it('should handle code block without json language specifier', () => {
        // Tests the optional (json)? part of the regex
        // Input: ``` without json
        const input = 'text```\n{"noLang": true}\n```more';
        const result = extractJSON(input);
        expect(result).toEqual({ noLang: true });
      });

      it('should handle code block with immediate content (no whitespace after ```)', () => {
        // Tests \s* (zero or more whitespace) - should work with zero whitespace
        const input = '```{"immediate": true}```';
        const result = extractJSON(input);
        expect(result).toEqual({ immediate: true });
      });

      it('should handle code block content that needs trimming', () => {
        // Tests the .trim() call on codeBlockMatch[1]
        const input = '```json\n   {"needsTrim": true}   \n```';
        const result = extractJSON(input);
        expect(result).toEqual({ needsTrim: true });
      });

      it('should trim leading whitespace in code block content', () => {
        // Critical: Without trim(), JSON.parse would fail on leading spaces
        // This specifically tests that trim() is called before parse
        const input = '```json\n\n\n   {"leadingSpaces": true}\n```';
        const result = extractJSON(input);
        expect(result).toEqual({ leadingSpaces: true });
      });

      it('should trim trailing whitespace in code block content', () => {
        // Tests trim() removes trailing whitespace
        const input = '```json\n{"trailingSpaces": true}   \n\n\n```';
        const result = extractJSON(input);
        expect(result).toEqual({ trailingSpaces: true });
      });

      it('should log error with correct message when extraction fails', async () => {
        const { logger } = await import('./logger.js');

        const input = 'not valid json at all';
        expect(() => extractJSON(input)).toThrow('Failed to extract valid JSON from response');

        // Verify logger.error was called with the correct message
        expect(logger.error).toHaveBeenCalledWith('JSON extraction failed', expect.any(Object));
      });

      it('should log error with rawText and textLength context', async () => {
        const { logger } = await import('./logger.js');

        const input = 'invalid json content here';
        expect(() => extractJSON(input)).toThrow();

        // Verify logger.error was called with context containing rawText and textLength
        expect(logger.error).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            rawText: expect.any(String),
            textLength: expect.any(Number),
          })
        );
      });

      it('should truncate rawText to 500 chars in error log for long input', async () => {
        const { logger } = await import('./logger.js');

        // Create input longer than 500 characters
        const longInput = 'x'.repeat(1000);
        expect(() => extractJSON(longInput)).toThrow();

        // Verify rawText is truncated to 500 characters
        const errorCall = logger.error.mock.calls[0];
        const context = errorCall[1];
        expect(context.rawText.length).toBe(500);
        expect(context.textLength).toBe(1000);
      });

      it('should include full text length in error context', async () => {
        const { logger } = await import('./logger.js');

        const input = 'short invalid';
        expect(() => extractJSON(input)).toThrow();

        const errorCall = logger.error.mock.calls[0];
        expect(errorCall[1].textLength).toBe(input.length);
      });

      it('should pass rawText as substring not full text for long input', async () => {
        const { logger } = await import('./logger.js');

        // Input that's exactly 600 chars
        const longInput = 'a'.repeat(600);
        expect(() => extractJSON(longInput)).toThrow();

        const errorCall = logger.error.mock.calls[0];
        // rawText should be substring(0, 500), not the full text
        expect(errorCall[1].rawText).toBe('a'.repeat(500));
        expect(errorCall[1].rawText.length).toBeLessThan(longInput.length);
      });

      it('should use code block path when direct parse fails', () => {
        // Input that fails direct parse but succeeds via code block
        const input = 'Some preamble text\n```json\n{"viaCodeBlock": true}\n```\nPostamble';
        const result = extractJSON(input);
        expect(result).toEqual({ viaCodeBlock: true });
      });

      it('should use object extraction path when code block fails', () => {
        // Input that fails both direct parse and code block, but has extractable object
        const input = 'Here is the data: {"viaObjectMatch": true} and more text';
        const result = extractJSON(input);
        expect(result).toEqual({ viaObjectMatch: true });
      });

      it('should use array extraction path when object extraction fails', () => {
        // Input that only has an array, no object
        const input = 'The array is: [1, 2, 3] here';
        const result = extractJSON(input);
        expect(result).toEqual([1, 2, 3]);
      });
    });
  });
});
