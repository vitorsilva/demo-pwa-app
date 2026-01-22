<?php
/**
 * Telemetry Utility for LLM Proxy
 * Sends telemetry data to the existing telemetry endpoint
 */

class Telemetry {

    private static $endpoint = 'https://saberloop.com/telemetry/ingest.php';
    private static $token = null;

    /**
     * Initialize telemetry with token
     */
    public static function init($token) {
        self::$token = $token;
    }

    /**
     * Log an LLM request for monitoring
     *
     * @param array $data Telemetry data
     */
    public static function logRequest($data) {
        if (empty(self::$token)) {
            return; // Telemetry not configured
        }

        $event = [
            'level' => 'info',
            'message' => 'llm_proxy_request',
            'context' => [
                'provider' => $data['provider'] ?? 'unknown',
                'model' => $data['model'] ?? 'unknown',
                'duration_ms' => $data['duration_ms'] ?? 0,
                'status' => $data['status'] ?? 'success',
                'prompt_tokens' => $data['prompt_tokens'] ?? 0,
                'completion_tokens' => $data['completion_tokens'] ?? 0,
                // NEVER log api_key or request content
            ],
            'timestamp' => date('c')
        ];

        // Fire and forget - don't block on telemetry
        self::sendAsync($event);
    }

    /**
     * Log an error
     */
    public static function logError($provider, $errorMessage, $httpCode = null) {
        if (empty(self::$token)) {
            return;
        }

        $event = [
            'level' => 'error',
            'message' => 'llm_proxy_error',
            'context' => [
                'provider' => $provider,
                'error' => $errorMessage,
                'http_code' => $httpCode
            ],
            'timestamp' => date('c')
        ];

        self::sendAsync($event);
    }

    /**
     * Send telemetry asynchronously (non-blocking)
     */
    private static function sendAsync($event) {
        $payload = json_encode([
            'events' => [$event]
        ]);

        // Use file_get_contents with stream context for non-blocking
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\n" .
                           "Authorization: Bearer " . self::$token . "\r\n",
                'content' => $payload,
                'timeout' => 1 // 1 second timeout - don't wait long
            ]
        ]);

        // Suppress errors - telemetry should never break the main flow
        @file_get_contents(self::$endpoint, false, $context);
    }
}
