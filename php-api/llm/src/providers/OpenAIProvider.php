<?php
require_once __DIR__ . '/../utils/ResponseSanitizer.php';

class OpenAIProvider {

    private $baseUrl = 'https://api.openai.com/v1/chat/completions';

    public function completion($apiKey, $messages, $model, $options = []) {
        $payload = [
            'model' => $model,
            'messages' => $messages,
            'max_tokens' => $options['max_tokens'] ?? 2048,
            'temperature' => $options['temperature'] ?? 0.7
        ];

        $headers = [
            'Authorization: Bearer ' . $apiKey,
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
            throw new Exception("Network error: Unable to connect to OpenAI");
        }

        $decoded = json_decode($response, true);

        if ($httpCode !== 200) {
            $this->handleError($httpCode, $decoded);
        }

        return $decoded;
    }

    private function handleError($httpCode, $decoded) {
        $errorMsg = $decoded['error']['message'] ?? 'Request failed';

        // Map to user-friendly messages
        switch ($httpCode) {
            case 401:
                throw new Exception("Invalid OpenAI API key");
            case 429:
                throw new Exception("OpenAI rate limit exceeded. Please try again later");
            case 402:
                throw new Exception("Insufficient OpenAI credits");
            case 400:
                throw new Exception("Invalid request to OpenAI: " . $errorMsg);
            default:
                throw new Exception("OpenAI service error. Please try again");
        }
    }

    private function normalizeResponse($response) {
        $message = $response['choices'][0]['message'] ?? [];

        // Use ResponseSanitizer for consistent content extraction
        $text = ResponseSanitizer::getContent($message);
        $text = ResponseSanitizer::cleanText($text);

        if (empty($text)) {
            throw new Exception("Empty response from OpenAI");
        }

        return [
            'text' => $text,
            'model' => $response['model'],
            'provider' => 'openai',
            'usage' => [
                'prompt_tokens' => $response['usage']['prompt_tokens'] ?? 0,
                'completion_tokens' => $response['usage']['completion_tokens'] ?? 0,
                'total_tokens' => $response['usage']['total_tokens'] ?? 0
            ]
        ];
    }
}
