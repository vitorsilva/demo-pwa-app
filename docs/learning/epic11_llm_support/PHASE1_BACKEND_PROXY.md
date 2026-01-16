# Phase 1: Backend Proxy & Deployment

**Epic:** 11 - Multi-Provider LLM Support
**Status:** Not Started
**Effort:** 3-4 days
**Prerequisites:** None

---

## Goal

Create the PHP backend proxy that routes LLM requests to different providers, and create deployment scripts for the VPS `/llm/` endpoint.

---

## Tasks

### 1.1 Create Deployment Script

Create a deployment script similar to `party/` deployment.

**File:** `scripts/deploy-llm.sh`

```bash
#!/bin/bash
# Deploy LLM proxy to VPS

set -e

echo "🚀 Deploying LLM proxy..."

# Variables
REMOTE_USER="your-user"
REMOTE_HOST="saberloop.com"
REMOTE_PATH="/var/www/saberloop.com/llm"
LOCAL_PATH="php-api/llm"

# Create remote directory if not exists
ssh $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_PATH/src/handlers"

# Upload files
rsync -avz --delete \
  $LOCAL_PATH/ \
  $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

# Set permissions
ssh $REMOTE_USER@$REMOTE_HOST "chmod -R 755 $REMOTE_PATH"

echo "✅ LLM proxy deployed successfully"
echo "🔗 Health check: https://saberloop.com/llm/health.php"
```

**Testing:**
```bash
# Make executable
chmod +x scripts/deploy-llm.sh

# Test deployment (dry run first)
# ./scripts/deploy-llm.sh
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
│       └── providers/
│           ├── OpenAIProvider.php
│           ├── AnthropicProvider.php
│           ├── GoogleProvider.php
│           └── XAIProvider.php
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

### 1.5 Create Main Completion Endpoint

**File:** `php-api/llm/completion.php`

```php
<?php
require_once __DIR__ . '/src/handlers/LLMCompletion.php';

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

try {
    $request = json_decode(file_get_contents('php://input'), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    $handler = new LLMCompletion();
    $response = $handler->handle($request);

    echo json_encode($response);

} catch (Exception $e) {
    error_log('LLM Proxy Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
```

---

### 1.6 Create LLM Completion Handler

**File:** `php-api/llm/src/handlers/LLMCompletion.php`

```php
<?php
require_once __DIR__ . '/../providers/OpenAIProvider.php';
require_once __DIR__ . '/../providers/AnthropicProvider.php';
require_once __DIR__ . '/../providers/GoogleProvider.php';
require_once __DIR__ . '/../providers/XAIProvider.php';

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

### 1.7 Create Provider Classes

#### OpenAI Provider

**File:** `php-api/llm/src/providers/OpenAIProvider.php`

```php
<?php
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
            throw new Exception("cURL error: $error");
        }

        $decoded = json_decode($response, true);

        if ($httpCode !== 200) {
            $errorMsg = $decoded['error']['message'] ?? 'API request failed';
            throw new Exception("OpenAI API error: $errorMsg");
        }

        return $decoded;
    }

    private function normalizeResponse($response) {
        return [
            'text' => $response['choices'][0]['message']['content'],
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
            throw new Exception("cURL error: $error");
        }

        $decoded = json_decode($response, true);

        if ($httpCode !== 200) {
            $errorMsg = $decoded['error']['message'] ?? 'API request failed';
            throw new Exception("Anthropic API error: $errorMsg");
        }

        return $decoded;
    }

    private function normalizeResponse($response) {
        return [
            'text' => $response['content'][0]['text'],
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
            throw new Exception("cURL error: $error");
        }

        $decoded = json_decode($response, true);

        if ($httpCode !== 200) {
            $errorMsg = $decoded['error']['message'] ?? 'API request failed';
            throw new Exception("Google API error: $errorMsg");
        }

        return $decoded;
    }

    private function normalizeResponse($response, $model) {
        return [
            'text' => $response['candidates'][0]['content']['parts'][0]['text'],
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
            throw new Exception("cURL error: $error");
        }

        $decoded = json_decode($response, true);

        if ($httpCode !== 200) {
            $errorMsg = $decoded['error']['message'] ?? 'API request failed';
            throw new Exception("xAI API error: $errorMsg");
        }

        return $decoded;
    }

    private function normalizeResponse($response) {
        return [
            'text' => $response['choices'][0]['message']['content'],
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

### Unit Tests

**File:** `tests/php/LLMCompletionTest.php`

```php
<?php
use PHPUnit\Framework\TestCase;

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

### Manual Testing

```bash
# 1. Deploy to VPS
./scripts/deploy-llm.sh

# 2. Test health check
curl https://saberloop.com/llm/health.php

# Expected: {"status":"healthy","service":"llm-proxy",...}

# 3. Test completion endpoint (with valid API key)
curl -X POST https://saberloop.com/llm/completion.php \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "api_key": "sk-your-test-key",
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Say hello"}]
  }'

# 4. Test error handling (invalid provider)
curl -X POST https://saberloop.com/llm/completion.php \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "invalid",
    "api_key": "test",
    "model": "test",
    "messages": []
  }'

# Expected: {"error":"Invalid provider: invalid"}
```

---

## Acceptance Criteria

- [ ] Deployment script created and tested
- [ ] Health check endpoint returns correct response
- [ ] Completion endpoint handles all 4 providers
- [ ] Requests are properly validated
- [ ] Responses are normalized to common format
- [ ] Error messages are user-friendly (no internal details exposed)
- [ ] API keys are NOT logged
- [ ] CORS headers are set correctly
- [ ] Unit tests pass

---

## Notes

- Do NOT log request bodies (contain API keys)
- Timeout set to 120 seconds for long completions
- All providers normalize to same response format
- Google uses query param for API key, others use headers

---

*Next Phase: [PHASE2_FRONTEND_ROUTER.md](./PHASE2_FRONTEND_ROUTER.md)*
