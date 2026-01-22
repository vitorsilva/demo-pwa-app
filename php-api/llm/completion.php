<?php
require_once __DIR__ . '/src/handlers/LLMCompletion.php';
require_once __DIR__ . '/src/utils/Telemetry.php';

// Load config if exists
$config = [];
if (file_exists(__DIR__ . '/config.local.php')) {
    $config = require __DIR__ . '/config.local.php';
}

// Initialize telemetry if configured
if (!empty($config['telemetry_token'])) {
    Telemetry::init($config['telemetry_token']);
}

// CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$startTime = microtime(true);

try {
    $request = json_decode(file_get_contents('php://input'), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    $handler = new LLMCompletion();
    $response = $handler->handle($request);

    // Log successful request to telemetry
    $duration = round((microtime(true) - $startTime) * 1000);
    Telemetry::logRequest([
        'provider' => $request['provider'] ?? 'unknown',
        'model' => $request['model'] ?? 'unknown',
        'duration_ms' => $duration,
        'status' => 'success',
        'prompt_tokens' => $response['usage']['prompt_tokens'] ?? 0,
        'completion_tokens' => $response['usage']['completion_tokens'] ?? 0
    ]);

    echo json_encode($response);

} catch (Exception $e) {
    $duration = round((microtime(true) - $startTime) * 1000);

    // Log error to telemetry (NOT the full error message which might contain sensitive info)
    Telemetry::logError(
        $request['provider'] ?? 'unknown',
        'Request failed', // Generic message
        null
    );

    // Log full error server-side only
    error_log('LLM Proxy Error: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
