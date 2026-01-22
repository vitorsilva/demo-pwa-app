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
