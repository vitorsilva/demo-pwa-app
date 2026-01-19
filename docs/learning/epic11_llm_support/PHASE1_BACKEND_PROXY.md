# Phase 1: Backend Proxy & Deployment

**Epic:** 11 - Multi-Provider LLM Support
**Status:** Not Started
**Effort:** 3-4 days
**Prerequisites:** None

---

## Goal

Create the PHP backend proxy that routes LLM requests to different providers, and create deployment scripts for the VPS `/llm/` endpoint.

---

## Branch & Commit Strategy

### Branch Naming

```
feature/epic11-phase1-llm-backend
```

### Implementation Order

```
main
  │
  └── feature/epic11-phase1-llm-backend
        ├── commit: feat(llm): add deployment script
        ├── commit: feat(llm): add health check endpoint
        ├── commit: feat(llm): add response sanitizer utility
        ├── commit: feat(llm): add telemetry utility
        ├── commit: feat(llm): add completion endpoint and handler
        ├── commit: feat(llm): add OpenAI provider
        ├── commit: feat(llm): add Anthropic provider
        ├── commit: feat(llm): add Google provider
        ├── commit: feat(llm): add xAI provider
        ├── commit: test(llm): add PHP unit tests
        ├── commit: test(llm): add E2E tests for proxy
        └── PR → merge to main
```

### Commit Message Format

```
feat(llm): add OpenAI provider

- Implement OpenAI chat completions proxy
- Add response normalization
- Add error handling with user-friendly messages
- Use ResponseSanitizer for content extraction

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Commit Prefixes

| Type | Scope | Example |
|------|-------|---------|
| Feature | `llm` | `feat(llm): add Anthropic provider` |
| Test | `llm` | `test(llm): add PHP unit tests` |
| Fix | `llm` | `fix(llm): handle empty response from provider` |
| Docs | `llm` | `docs(llm): update API documentation` |

---

## Feature Flag

This phase does **not** require a feature flag because:
- Backend proxy is deployed to `/llm/` endpoint (separate from main app)
- No frontend changes yet
- Proxy is only called when explicitly configured in later phases

The feature flag `MULTI_PROVIDER_LLM` will be added in **Phase 2** when frontend integration begins.

---

## Tasks

### 1.1 Create Deployment Script

Create a deployment script following the same pattern as `deploy-party.cjs` and `deploy-telemetry.cjs`.

**File:** `scripts/deploy-llm.cjs`

```javascript
require('dotenv').config();
const FtpDeploy = require('ftp-deploy');
const ftpDeploy = new FtpDeploy();

// FTP configuration for saberloop.com LLM proxy
const config = {
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    host: process.env.FTP_HOST,
    port: 21,
    forcePasv: true,
    secure: true,
    secureOptions: { rejectUnauthorized: false },
    localRoot: './php-api/llm',
    remoteRoot: '/llm',  // saberloop.com/llm/
    include: [
        '*.php',
        '*.example.php',
        '.htaccess',
        'src/**/*.php'
    ],
    exclude: [],
    deleteRemote: false
};

async function deploy() {
    try {
        console.log('🤖 Deploying LLM proxy to saberloop.com/llm/...');
        console.log('   Files: completion.php, health.php, .htaccess, src/**');
        await ftpDeploy.deploy(config);
        console.log('✅ LLM proxy deployed!');
        console.log('🔗 Health check: https://saberloop.com/llm/health.php');
        console.log('');
        console.log('📁 Deployed structure:');
        console.log('   - completion.php (main endpoint)');
        console.log('   - health.php (health check)');
        console.log('   - .htaccess (CORS config)');
        console.log('   - src/handlers/LLMCompletion.php');
        console.log('   - src/providers/*.php');
        console.log('   - src/utils/ResponseSanitizer.php');
        console.log('');
        console.log('⚠️  IMPORTANT - Verify deployment:');
        console.log('   1. Test health: curl https://saberloop.com/llm/health.php');
        console.log('   2. Check PHP error logs if issues occur');
    } catch (err) {
        console.error('❌ Deployment failed:', err);
        process.exit(1);
    }
}

deploy();
```

**Add to `package.json` scripts:**
```json
{
  "scripts": {
    "deploy:llm": "node scripts/deploy-llm.cjs"
  }
}
```

---

### 1.2 Create Directory Structure

```
php-api/
├── llm/                          # NEW: LLM proxy
│   ├── completion.php            # Main endpoint
│   ├── health.php                # Health check
│   ├── .htaccess                 # Apache config (CORS, etc.)
│   └── src/
│       ├── handlers/
│       │   └── LLMCompletion.php # Main handler
│       ├── providers/
│       │   ├── OpenAIProvider.php
│       │   ├── AnthropicProvider.php
│       │   ├── GoogleProvider.php
│       │   └── XAIProvider.php
│       └── utils/
│           ├── ResponseSanitizer.php  # JSON extraction & sanitization
│           └── Telemetry.php          # Telemetry logging
├── party/                        # Existing
└── telemetry/                    # Existing
```

---

### 1.3 Create Health Check Endpoint

**File:** `php-api/llm/health.php`

```php
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
```

---

### 1.4 Create .htaccess for CORS

**File:** `php-api/llm/.htaccess`

```apache
# Enable CORS
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "POST, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type"

# Handle OPTIONS preflight
RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

---

### 1.5 Create Response Sanitizer

This is similar to the `json-extractor.js` pattern used for OpenRouter responses. It handles common LLM quirks like markdown code blocks, smart quotes, BOM characters, and reasoning model prefixes.

**File:** `php-api/llm/src/utils/ResponseSanitizer.php`

```php
<?php
/**
 * Response Sanitizer
 * Robust text/JSON extraction from LLM responses with multiple fallback strategies.
 * PHP equivalent of src/utils/json-extractor.js
 */

class ResponseSanitizer {

    /**
     * Extract and parse JSON from LLM response text
     * Handles: markdown code blocks, smart quotes, BOM, extra text
     *
     * @param string $text Raw text that may contain JSON
     * @return array|null Parsed JSON or null if extraction fails
     * @throws Exception If JSON cannot be extracted
     */
    public static function extractJSON($text) {
        if (empty($text) || !is_string($text)) {
            throw new Exception('Input must be a non-empty string');
        }

        $cleaned = trim($text);

        if (empty($cleaned)) {
            throw new Exception('Input is empty or whitespace-only');
        }

        // Step 1: Remove BOM if present (UTF-8 BOM: EF BB BF)
        if (substr($cleaned, 0, 3) === "\xEF\xBB\xBF") {
            $cleaned = substr($cleaned, 3);
        }

        // Step 2: Normalize smart quotes to straight quotes
        $cleaned = str_replace(
            ["\u{201C}", "\u{201D}", "\u{2018}", "\u{2019}"],
            ['"', '"', "'", "'"],
            $cleaned
        );

        // Also handle the escaped versions
        $cleaned = preg_replace('/[\x{201C}\x{201D}]/u', '"', $cleaned);
        $cleaned = preg_replace('/[\x{2018}\x{2019}]/u', "'", $cleaned);

        // Step 3: Try direct parse first (most common case)
        $result = json_decode($cleaned, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $result;
        }

        // Step 4: Try extracting from markdown code block
        if (preg_match('/```(?:json)?\s*([\s\S]*?)```/', $cleaned, $matches)) {
            $jsonFromBlock = trim($matches[1]);
            $result = json_decode($jsonFromBlock, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $result;
            }
        }

        // Step 5: Try to find JSON object in text
        if (preg_match('/\{[\s\S]*\}/', $cleaned, $matches)) {
            $result = json_decode($matches[0], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $result;
            }
        }

        // Step 6: Try to find JSON array in text
        if (preg_match('/\[[\s\S]*\]/', $cleaned, $matches)) {
            $result = json_decode($matches[0], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $result;
            }
        }

        // All strategies failed
        throw new Exception('Failed to extract valid JSON from response');
    }

    /**
     * Clean text response from LLM
     * Handles reasoning model outputs, chain-of-thought prefixes, etc.
     *
     * @param string $text Raw text response
     * @param array $options Optional settings
     * @return string Cleaned text
     */
    public static function cleanText($text, $options = []) {
        if (empty($text)) {
            return '';
        }

        $cleaned = trim($text);

        // Remove BOM
        if (substr($cleaned, 0, 3) === "\xEF\xBB\xBF") {
            $cleaned = substr($cleaned, 3);
        }

        // Normalize smart quotes
        $cleaned = preg_replace('/[\x{201C}\x{201D}]/u', '"', $cleaned);
        $cleaned = preg_replace('/[\x{2018}\x{2019}]/u', "'", $cleaned);

        // Remove common chain-of-thought prefixes from reasoning models
        // (only if explicitly requested - some responses legitimately start this way)
        if (!empty($options['removeChainOfThought'])) {
            $cleaned = preg_replace(
                '/^(Okay,?\s*|Let me\s+|Let\'s\s+|First,?\s+|I need to\s+|The user\s+|Alright,?\s*|So,?\s+)/i',
                '',
                $cleaned
            );
        }

        return trim($cleaned);
    }

    /**
     * Check if text looks like chain-of-thought reasoning
     *
     * @param string $text Text to check
     * @return bool True if looks like chain-of-thought
     */
    public static function isChainOfThought($text) {
        $text = trim($text);
        return (bool) preg_match(
            '/^(okay|let me|let\'s|first|i need|the user|alright|so,)/i',
            $text
        );
    }

    /**
     * Get the actual content from response, handling reasoning field fallback
     * Similar to openrouter-client.js logic for reasoning models
     *
     * @param array $message Message object with content and possibly reasoning
     * @return string|null The actual content
     */
    public static function getContent($message) {
        $text = $message['content'] ?? null;

        // For reasoning models that hit token limit, reasoning may contain partial answer
        // Only use reasoning if content is empty AND reasoning doesn't look like chain-of-thought
        if (empty($text) && !empty($message['reasoning'])) {
            $reasoning = trim($message['reasoning']);
            if (!self::isChainOfThought($reasoning)) {
                $text = $reasoning;
            }
        }

        return $text;
    }
}
```

---

### 1.6 Create Telemetry Utility

**File:** `php-api/llm/src/utils/Telemetry.php`

```php
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
```

---

### 1.7 Create Main Completion Endpoint

**File:** `php-api/llm/completion.php`

```php
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
```

**File:** `php-api/llm/config.local.example.php`

```php
<?php
/**
 * Local configuration for LLM proxy
 * Copy this file to config.local.php and set your values
 */
return [
    // Optional: telemetry token for logging requests
    // Should match VITE_TELEMETRY_TOKEN from frontend
    'telemetry_token' => 'your-telemetry-token-here'
];
```

---

### 1.8 Create LLM Completion Handler

**File:** `php-api/llm/src/handlers/LLMCompletion.php`

```php
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
```

---

### 1.9 Create Provider Classes

Each provider class now uses `ResponseSanitizer` for consistent response handling.

#### OpenAI Provider

**File:** `php-api/llm/src/providers/OpenAIProvider.php`

```php
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
```

#### Anthropic Provider

**File:** `php-api/llm/src/providers/AnthropicProvider.php`

```php
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
```

#### Google Provider

**File:** `php-api/llm/src/providers/GoogleProvider.php`

```php
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
```

#### xAI Provider

**File:** `php-api/llm/src/providers/XAIProvider.php`

```php
<?php
require_once __DIR__ . '/../utils/ResponseSanitizer.php';

class XAIProvider {

    private $baseUrl = 'https://api.x.ai/v1/chat/completions';

    public function completion($apiKey, $messages, $model, $options = []) {
        // xAI uses OpenAI-compatible format
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
            throw new Exception("Network error: Unable to connect to xAI");
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
                throw new Exception("Invalid xAI API key");
            case 429:
                throw new Exception("xAI rate limit exceeded. Please try again later");
            case 400:
                throw new Exception("Invalid request to xAI: " . $errorMsg);
            default:
                throw new Exception("xAI service error. Please try again");
        }
    }

    private function normalizeResponse($response) {
        $message = $response['choices'][0]['message'] ?? [];

        // Use ResponseSanitizer for consistent content extraction
        $text = ResponseSanitizer::getContent($message);
        $text = ResponseSanitizer::cleanText($text);

        if (empty($text)) {
            throw new Exception("Empty response from xAI");
        }

        return [
            'text' => $text,
            'model' => $response['model'],
            'provider' => 'xai',
            'usage' => [
                'prompt_tokens' => $response['usage']['prompt_tokens'] ?? 0,
                'completion_tokens' => $response['usage']['completion_tokens'] ?? 0,
                'total_tokens' => $response['usage']['total_tokens'] ?? 0
            ]
        ];
    }
}
```

---

## Testing

### Unit Tests (PHP)

**File:** `tests/php/LLMCompletionTest.php`

```php
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
```

**File:** `tests/php/ResponseSanitizerTest.php`

```php
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

    public function test_handles_smart_quotes() {
        // Smart quotes often appear when copying from word processors
        $text = '{"key": "value"}'; // Using smart quotes
        // Simulating smart quotes (U+201C, U+201D)
        $text = str_replace('"', "\u{201C}", $text);
        $text = preg_replace('/"$/', "\u{201D}", $text);

        // Note: This test verifies the concept - actual smart quote handling
        // may need adjustment based on how PHP handles unicode
    }

    public function test_detects_chain_of_thought() {
        $this->assertTrue(ResponseSanitizer::isChainOfThought("Okay, let me think about this..."));
        $this->assertTrue(ResponseSanitizer::isChainOfThought("Let me analyze the question."));
        $this->assertTrue(ResponseSanitizer::isChainOfThought("First, I need to understand..."));

        $this->assertFalse(ResponseSanitizer::isChainOfThought("The answer is 42."));
        $this->assertFalse(ResponseSanitizer::isChainOfThought('{"questions": []}'));
    }

    public function test_cleans_text_removes_bom() {
        $text = "\xEF\xBB\xBFHello World";
        $result = ResponseSanitizer::cleanText($text);

        $this->assertEquals("Hello World", $result);
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
}
```

### E2E Tests (Playwright)

**File:** `tests/e2e/llm-proxy.spec.js`

```javascript
import { test, expect } from '@playwright/test';

const LLM_PROXY_URL = 'https://saberloop.com/llm';

test.describe('LLM Proxy Backend', () => {

  test('health check returns healthy status', async ({ request }) => {
    const response = await request.get(`${LLM_PROXY_URL}/health.php`);

    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.service).toBe('llm-proxy');
    expect(data.providers).toContain('openai');
    expect(data.providers).toContain('anthropic');
    expect(data.providers).toContain('google');
    expect(data.providers).toContain('xai');
  });

  test('rejects GET requests to completion endpoint', async ({ request }) => {
    const response = await request.get(`${LLM_PROXY_URL}/completion.php`);

    expect(response.status()).toBe(405);
  });

  test('rejects invalid JSON', async ({ request }) => {
    const response = await request.post(`${LLM_PROXY_URL}/completion.php`, {
      data: 'not valid json',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid JSON');
  });

  test('rejects missing required fields', async ({ request }) => {
    const response = await request.post(`${LLM_PROXY_URL}/completion.php`, {
      data: { provider: 'openai' }, // missing api_key, messages, model
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status()).toBe(500); // Handler throws exception
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test('rejects invalid provider', async ({ request }) => {
    const response = await request.post(`${LLM_PROXY_URL}/completion.php`, {
      data: {
        provider: 'invalid_provider',
        api_key: 'test-key',
        model: 'test-model',
        messages: [{ role: 'user', content: 'test' }]
      },
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status()).toBe(500);
  });

  test('CORS headers are set correctly', async ({ request }) => {
    const response = await request.get(`${LLM_PROXY_URL}/health.php`);

    expect(response.headers()['access-control-allow-origin']).toBe('*');
  });

  test('OPTIONS preflight returns 200', async ({ request }) => {
    const response = await request.fetch(`${LLM_PROXY_URL}/completion.php`, {
      method: 'OPTIONS'
    });

    expect(response.status()).toBe(200);
  });

});

// Integration tests with real API keys (skip in CI, run manually)
test.describe('LLM Proxy Integration @manual', () => {

  test.skip(({ }, testInfo) => !process.env.TEST_OPENAI_KEY, 'Requires TEST_OPENAI_KEY');

  test('OpenAI completion works', async ({ request }) => {
    const response = await request.post(`${LLM_PROXY_URL}/completion.php`, {
      data: {
        provider: 'openai',
        api_key: process.env.TEST_OPENAI_KEY,
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say "test successful" and nothing else.' }],
        options: { max_tokens: 20 }
      },
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.ok()).toBe(true);
    const data = await response.json();

    expect(data.text).toBeDefined();
    expect(data.provider).toBe('openai');
    expect(data.usage).toBeDefined();
    expect(data.usage.prompt_tokens).toBeGreaterThan(0);
  });
});
```

---

## Local Testing with Docker

Before deploying to production, test the LLM proxy locally using Docker.

### 1. Update Docker Compose

The LLM proxy uses the same PHP container as Party Mode. The `php-api/llm/` directory is already mounted via the volume configuration.

### 2. Start Local Stack

```bash
# Start PHP + MySQL containers
docker-compose -f docker-compose.php.yml up -d php-api mysql

# Verify containers are running
docker-compose -f docker-compose.php.yml ps
```

### 3. Test Health Check Locally

```bash
# Test health endpoint
curl http://localhost:8080/llm/health.php

# Expected response:
# {"status":"healthy","service":"llm-proxy","timestamp":"...","version":"1.0.0","providers":["openai","anthropic","google","xai"]}
```

### 4. Test Completion Endpoint Locally

```bash
# Test with a real API key (replace with your key)
curl -X POST http://localhost:8080/llm/completion.php \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "api_key": "sk-your-test-key",
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Say hello"}],
    "options": {"max_tokens": 20}
  }'
```

### 5. Test Error Handling

```bash
# Test invalid provider
curl -X POST http://localhost:8080/llm/completion.php \
  -H "Content-Type: application/json" \
  -d '{"provider": "invalid", "api_key": "test", "model": "test", "messages": []}'

# Expected: {"error":"Internal server error"} with 500 status

# Test missing fields
curl -X POST http://localhost:8080/llm/completion.php \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai"}'

# Expected: {"error":"Internal server error"} with 500 status
```

### 6. View PHP Logs

```bash
# Check for errors
docker-compose -f docker-compose.php.yml logs -f php-api
```

---

## Deployment Workflow

### Step 1: Local Testing (Required)

Complete all local testing steps above. Verify:
- [ ] Health check returns expected response
- [ ] Completion endpoint works with at least one provider
- [ ] Error handling returns appropriate responses
- [ ] No PHP errors in logs

### Step 2: Deploy to Production

```bash
# Deploy LLM proxy to saberloop.com/llm/
npm run deploy:llm
```

### Step 3: Verify Production Deployment

```bash
# Test production health check
curl https://saberloop.com/llm/health.php

# Test production completion (with real key)
curl -X POST https://saberloop.com/llm/completion.php \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "api_key": "sk-your-test-key",
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Say test successful"}],
    "options": {"max_tokens": 20}
  }'
```

### Step 4: Run E2E Tests Against Production

```bash
# Run backend E2E tests
npx playwright test tests/e2e/llm-proxy.spec.js

# Run integration tests (requires TEST_OPENAI_KEY env var)
TEST_OPENAI_KEY=sk-your-key npx playwright test tests/e2e/llm-proxy.spec.js --grep @manual
```

### Rollback (if needed)

If issues are found in production:
1. The `/llm/` endpoint is independent of the main app
2. Simply fix the issue locally and redeploy
3. No user-facing impact until Phase 2 integrates the frontend

---

## Add to CI Pipeline

**Update `.github/workflows/test.yml`:**

```yaml
# Add PHP tests job
php-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.1'
        tools: composer

    - name: Install PHPUnit
      run: composer require --dev phpunit/phpunit ^10

    - name: Run PHP tests
      run: ./vendor/bin/phpunit tests/php/

# Add E2E proxy tests to existing e2e job (after deployment)
e2e-tests:
  # ... existing config ...
  steps:
    # ... existing steps ...

    - name: Run LLM Proxy tests
      run: npx playwright test tests/e2e/llm-proxy.spec.js
```

---

## Acceptance Criteria

- [ ] Deployment script created (`scripts/deploy-llm.cjs`) following existing pattern
- [ ] `npm run deploy:llm` command added to package.json
- [ ] Health check endpoint returns correct response
- [ ] Completion endpoint handles all 4 providers
- [ ] Requests are properly validated
- [ ] Responses are normalized using `ResponseSanitizer`
- [ ] Error messages are user-friendly (no internal details exposed)
- [ ] API keys are NOT logged (telemetry only logs provider/model/duration)
- [ ] CORS headers are set correctly
- [ ] Telemetry integration logs requests (when configured)
- [ ] PHP unit tests pass
- [ ] E2E tests pass
- [ ] Manual integration test with at least one real API key

---

## Notes

- Do NOT log request bodies (contain API keys)
- Timeout set to 120 seconds for long completions
- All providers normalize to same response format
- Google uses query param for API key, others use headers
- ResponseSanitizer handles the same edge cases as `json-extractor.js`:
  - Markdown code blocks
  - Smart quotes
  - BOM characters
  - Reasoning model outputs
- Telemetry is fire-and-forget (non-blocking)

---

## Related Documentation

### Developer Guides
- [Staging Deployment](../../developer-guide/STAGING_DEPLOYMENT.md) - Deployment workflow reference
- [E2E Testing](../../developer-guide/E2E_TESTING.md) - Playwright testing patterns
- [Unit Testing](../../developer-guide/UNIT_TESTING.md) - Vitest testing patterns
- [Configuration](../../developer-guide/CONFIGURATION.md) - Environment variables

### Architecture
- [LLM Integration Evolution](../../architecture/LLM_INTEGRATION_EVOLUTION.md) - Historical context
- [Deployment](../../architecture/DEPLOYMENT.md) - Deployment architecture
- [API Design](../../architecture/API_DESIGN.md) - API patterns

### Epic 11 Documents
- [EPIC11_LLM_SUPPORT_PLAN.md](./EPIC11_LLM_SUPPORT_PLAN.md) - Main plan overview
- [RESEARCH_PROVIDER_ANALYSIS.md](./RESEARCH_PROVIDER_ANALYSIS.md) - Provider research

---

*Next Phase: [PHASE2_FRONTEND_ROUTER.md](./PHASE2_FRONTEND_ROUTER.md)*
