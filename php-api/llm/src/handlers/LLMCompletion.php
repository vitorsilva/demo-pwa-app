<?php
require_once __DIR__ . '/../providers/OpenAIProvider.php';
require_once __DIR__ . '/../providers/AnthropicProvider.php';
require_once __DIR__ . '/../providers/GoogleProvider.php';
require_once __DIR__ . '/../providers/XAIProvider.php';
require_once __DIR__ . '/../utils/ResponseSanitizer.php';

class LLMCompletion {

    private $providers;

    public function __construct() {
        $this->providers = [
            'openai' => new OpenAIProvider(),
            'anthropic' => new AnthropicProvider(),
            'google' => new GoogleProvider(),
            'xai' => new XAIProvider()
        ];
    }

    public function handle($request) {
        // Validate required fields
        $this->validateRequest($request);

        $provider = $request['provider'];
        $apiKey = $request['api_key'];
        $messages = $request['messages'];
        $model = $request['model'];
        $options = $request['options'] ?? [];

        // Get provider handler
        if (!isset($this->providers[$provider])) {
            throw new Exception("Unsupported provider: $provider");
        }

        $providerHandler = $this->providers[$provider];

        // Make request to provider
        $response = $providerHandler->completion($apiKey, $messages, $model, $options);

        return $response;
    }

    private function validateRequest($request) {
        $required = ['provider', 'api_key', 'messages', 'model'];

        foreach ($required as $field) {
            if (!isset($request[$field]) || empty($request[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }

        // Validate provider
        $validProviders = ['openai', 'anthropic', 'google', 'xai'];
        if (!in_array($request['provider'], $validProviders)) {
            throw new Exception("Invalid provider: {$request['provider']}");
        }

        // Validate messages is array
        if (!is_array($request['messages'])) {
            throw new Exception("Messages must be an array");
        }
    }
}
