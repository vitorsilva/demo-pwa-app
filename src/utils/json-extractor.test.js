import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractJSON } from './json-extractor.js';

describe('JSON Extractor', () => {
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
        const bom = String.fromCharCode(0xFEFF);
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
    });
  });
});
