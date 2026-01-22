<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'status' => 'healthy',
    'service' => 'llm-proxy',
    'timestamp' => date('c'),
    'version' => '1.0.0',
    'providers' => ['openai', 'anthropic', 'google', 'xai']
]);
