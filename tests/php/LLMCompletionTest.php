<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../php-api/llm/src/handlers/LLMCompletion.php';

class LLMCompletionTest extends TestCase {

    public function test_validates_required_fields() {
        $handler = new LLMCompletion();

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Missing required field: provider');

        $handler->handle([]);
    }

    public function test_rejects_unsupported_provider() {
        $handler = new LLMCompletion();

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Invalid provider: invalid');

        $handler->handle([
            'provider' => 'invalid',
            'api_key' => 'test',
            'messages' => [['role' => 'user', 'content' => 'test']],
            'model' => 'test'
        ]);
    }

    public function test_validates_messages_is_array() {
        $handler = new LLMCompletion();

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Messages must be an array');

        $handler->handle([
            'provider' => 'openai',
            'api_key' => 'test',
            'messages' => 'not an array',
            'model' => 'test'
        ]);
    }
}
