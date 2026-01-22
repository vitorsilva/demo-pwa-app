<?php
require_once __DIR__ . '/../utils/ResponseSanitizer.php';

class GoogleProvider {

    private $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

    public function completion($apiKey, $messages, $model, $options = []) {
        // Convert messages to Google format
        $contents = array_map(function($msg) {
            return [
                'role' => $msg['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $msg['content']]]
            ];
        }, $messages);

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'maxOutputTokens' => $options['max_tokens'] ?? 2048,
                'temperature' => $options['temperature'] ?? 0.7
            ]
        ];

        // Google uses API key as query parameter
        $url = "{$this->baseUrl}/{$model}:generateContent?key={$apiKey}";

        $headers = [
            'Content-Type: application/json'
        ];

        $response = $this->makeRequest($url, $payload, $headers);

        return $this->normalizeResponse($response, $model);
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
            throw new Exception("Network error: Unable to connect to Google AI");
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
            case 400:
                if (strpos($errorMsg, 'API_KEY') !== false) {
                    throw new Exception("Invalid Google AI API key");
                }
                throw new Exception("Invalid request to Google AI: " . $errorMsg);
            case 403:
                throw new Exception("Google AI API key not authorized");
            case 429:
                throw new Exception("Google AI rate limit exceeded. Please try again later");
            default:
                throw new Exception("Google AI service error. Please try again");
        }
    }

    private function normalizeResponse($response, $model) {
        $text = $response['candidates'][0]['content']['parts'][0]['text'] ?? '';

        // Use ResponseSanitizer for consistent content handling
        $text = ResponseSanitizer::cleanText($text);

        if (empty($text)) {
            throw new Exception("Empty response from Google AI");
        }

        return [
            'text' => $text,
            'model' => $model,
            'provider' => 'google',
            'usage' => [
                'prompt_tokens' => $response['usageMetadata']['promptTokenCount'] ?? 0,
                'completion_tokens' => $response['usageMetadata']['candidatesTokenCount'] ?? 0,
                'total_tokens' => $response['usageMetadata']['totalTokenCount'] ?? 0
            ]
        ];
    }
}
