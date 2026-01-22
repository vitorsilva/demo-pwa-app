<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../php-api/llm/src/utils/ResponseSanitizer.php';

class ResponseSanitizerTest extends TestCase {

    public function test_extracts_clean_json() {
        $text = '{"key": "value"}';
        $result = ResponseSanitizer::extractJSON($text);

        $this->assertEquals(['key' => 'value'], $result);
    }

    public function test_extracts_json_from_markdown_code_block() {
        $text = "Here's the JSON:\n```json\n{\"key\": \"value\"}\n```";
        $result = ResponseSanitizer::extractJSON($text);

        $this->assertEquals(['key' => 'value'], $result);
    }

    public function test_extracts_json_with_surrounding_text() {
        $text = "Sure! Here's your answer: {\"key\": \"value\"} Hope that helps!";
        $result = ResponseSanitizer::extractJSON($text);

        $this->assertEquals(['key' => 'value'], $result);
    }

    public function test_extracts_json_array() {
        $text = "Here are the items: [1, 2, 3]";
        $result = ResponseSanitizer::extractJSON($text);

        $this->assertEquals([1, 2, 3], $result);
    }

    public function test_throws_on_empty_input() {
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Input must be a non-empty string');

        ResponseSanitizer::extractJSON('');
    }

    public function test_throws_on_invalid_json() {
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Failed to extract valid JSON from response');

        ResponseSanitizer::extractJSON('This is just plain text without any JSON');
    }

    public function test_detects_chain_of_thought() {
        $this->assertTrue(ResponseSanitizer::isChainOfThought("Okay, let me think about this..."));
        $this->assertTrue(ResponseSanitizer::isChainOfThought("Let me analyze the question."));
        $this->assertTrue(ResponseSanitizer::isChainOfThought("First, I need to understand..."));
        $this->assertTrue(ResponseSanitizer::isChainOfThought("Let's break this down."));
        $this->assertTrue(ResponseSanitizer::isChainOfThought("I need to consider..."));
        $this->assertTrue(ResponseSanitizer::isChainOfThought("The user wants..."));
        $this->assertTrue(ResponseSanitizer::isChainOfThought("Alright, here we go."));
        $this->assertTrue(ResponseSanitizer::isChainOfThought("So, the answer is..."));

        $this->assertFalse(ResponseSanitizer::isChainOfThought("The answer is 42."));
        $this->assertFalse(ResponseSanitizer::isChainOfThought('{"questions": []}'));
        $this->assertFalse(ResponseSanitizer::isChainOfThought("Here is the result."));
    }

    public function test_cleans_text_removes_bom() {
        $text = "\xEF\xBB\xBFHello World";
        $result = ResponseSanitizer::cleanText($text);

        $this->assertEquals("Hello World", $result);
    }

    public function test_cleans_text_trims_whitespace() {
        $text = "  Hello World  ";
        $result = ResponseSanitizer::cleanText($text);

        $this->assertEquals("Hello World", $result);
    }

    public function test_cleans_text_handles_empty_input() {
        $this->assertEquals('', ResponseSanitizer::cleanText(''));
        $this->assertEquals('', ResponseSanitizer::cleanText(null));
    }

    public function test_get_content_prefers_content_over_reasoning() {
        $message = [
            'content' => 'The actual answer',
            'reasoning' => 'Let me think about this first...'
        ];

        $result = ResponseSanitizer::getContent($message);
        $this->assertEquals('The actual answer', $result);
    }

    public function test_get_content_uses_reasoning_if_content_empty_and_not_chain_of_thought() {
        $message = [
            'content' => '',
            'reasoning' => 'The answer is 42.'
        ];

        $result = ResponseSanitizer::getContent($message);
        $this->assertEquals('The answer is 42.', $result);
    }

    public function test_get_content_ignores_chain_of_thought_reasoning() {
        $message = [
            'content' => '',
            'reasoning' => 'Okay, let me think about this step by step...'
        ];

        $result = ResponseSanitizer::getContent($message);
        $this->assertNull($result);
    }

    public function test_get_content_handles_missing_fields() {
        $message = [];
        $result = ResponseSanitizer::getContent($message);
        $this->assertNull($result);
    }
}
