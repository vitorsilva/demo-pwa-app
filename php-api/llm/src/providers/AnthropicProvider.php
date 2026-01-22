<?php
require_once __DIR__ . '/../utils/ResponseSanitizer.php';

class AnthropicProvider {

    private $baseUrl = 'https://api.anthropic.com/v1/messages';

    public function completion($apiKey, $messages, $model, $options = []) {
        $payload = [
            'model' => $model,
            'messages' => $messages,
            'max_tokens' => $options['max_tokens'] ?? 2048
        ];

        $headers = [
            'x-api-key: ' . $apiKey,
            'anthropic-version: 2023-06-01',
            'Content-Type: application/json'
        ];

        $response = $this->makeRequest($this->baseUrl, $payload, $headers);

        return $this->normalizeResponse($response);
    }

    private function makeRequest($url, $payload, $headers) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 120,
            CURLOPT_SSL_VERIFYPEER => true
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("Network error: Unable to connect to Anthropic");
        }

        $decoded = json_decode($response, true);

        if ($httpCode !== 200) {
            $this->handleError($httpCode, $decoded);
        }

        return $decoded;
    }

    private function handleError($httpCode, $decoded) {
        $errorMsg = $decoded['error']['message'] ?? 'Request failed';

        switch ($httpCode) {
            case 401:
                throw new Exception("Invalid Anthropic API key");
            case 429:
                throw new Exception("Anthropic rate limit exceeded. Please try again later");
            case 400:
                throw new Exception("Invalid request to Anthropic: " . $errorMsg);
            default:
                throw new Exception("Anthropic service error. Please try again");
        }
    }

    private function normalizeResponse($response) {
        $text = $response['content'][0]['text'] ?? '';

        // Use ResponseSanitizer for consistent content handling
        $text = ResponseSanitizer::cleanText($text);

        if (empty($text)) {
            throw new Exception("Empty response from Anthropic");
        }

        return [
            'text' => $text,
            'model' => $response['model'],
            'provider' => 'anthropic',
            'usage' => [
                'prompt_tokens' => $response['usage']['input_tokens'] ?? 0,
                'completion_tokens' => $response['usage']['output_tokens'] ?? 0,
                'total_tokens' => ($response['usage']['input_tokens'] ?? 0) +
                                 ($response['usage']['output_tokens'] ?? 0)
            ]
        ];
    }
}
