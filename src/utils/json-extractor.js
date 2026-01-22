/**
 * JSON Extractor Utility
 * Robust JSON extraction from LLM responses with multiple fallback strategies
 */

import { logger } from './logger.js';

/**
 * Clean JSON string by removing common issues that cause parse failures
 * @param {string} text - JSON string to clean
 * @returns {string} Cleaned JSON string
 */
function cleanJSON(text) {
  return (
    text
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas before } or ]
      // eslint-disable-next-line no-control-regex, sonarjs/no-control-regex -- Intentionally removing control chars from JSON
      .replace(/[\u0000-\u001F]+/g, ' ')
  );
}

/**
 * Extract JSON from text with multiple fallback strategies
 * Handles common LLM response patterns like markdown code blocks,
 * extra text, smart quotes, BOM characters, and DeepSeek thinking tags.
 *
 * @param {string} text - Raw text that may contain JSON
 * @returns {Object|Array} Parsed JSON object or array
 * @throws {Error} If JSON cannot be extracted
 */
export function extractJSON(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  let cleaned = text.trim();

  if (!cleaned) {
    throw new Error('Input is empty or whitespace-only');
  }

  // Step 1: Remove BOM if present
  if (cleaned.charCodeAt(0) === 0xfeff) {
    cleaned = cleaned.slice(1);
  }

  // Step 2: Strip DeepSeek thinking tags (must happen before JSON extraction)
  // These models output <think>reasoning</think> before the actual response
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // Step 3: Normalize smart quotes to straight quotes
  cleaned = cleaned
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes " "
    .replace(/[\u2018\u2019]/g, "'"); // Smart single quotes ' '

  // Step 4: Try direct parse first (most common case)
  try {
    return JSON.parse(cleaned);
  } catch {
    // Continue to fallbacks
  }

  // Step 5: Try extracting from markdown code block
  // Use indexOf instead of regex to avoid ReDoS vulnerability
  const codeBlockStart = cleaned.indexOf('```');
  if (codeBlockStart !== -1) {
    const codeBlockEnd = cleaned.indexOf('```', codeBlockStart + 3);
    if (codeBlockEnd !== -1) {
      let blockContent = cleaned.slice(codeBlockStart + 3, codeBlockEnd);
      // Remove optional 'json' language identifier
      if (blockContent.startsWith('json')) {
        blockContent = blockContent.slice(4);
      }
      const jsonFromBlock = cleanJSON(blockContent.trim());
      try {
        return JSON.parse(jsonFromBlock);
      } catch {
        // Continue to other fallbacks
      }
    }
  }

  // Step 6: Try to find JSON object in text
  // Use indexOf/lastIndexOf instead of regex to avoid ReDoS vulnerability
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const cleanedObject = cleanJSON(cleaned.slice(firstBrace, lastBrace + 1));
    try {
      return JSON.parse(cleanedObject);
    } catch {
      // Continue to array fallback
    }
  }

  // Step 7: Try to find JSON array in text
  // Use indexOf/lastIndexOf instead of regex to avoid ReDoS vulnerability
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const cleanedArray = cleanJSON(cleaned.slice(firstBracket, lastBracket + 1));
    try {
      return JSON.parse(cleanedArray);
    } catch {
      // All fallbacks failed
    }
  }

  // All strategies failed - log the raw text for debugging
  logger.error('JSON extraction failed', {
    rawText: text.substring(0, 500),
    textLength: text.length,
  });

  throw new Error('Failed to extract valid JSON from response');
}
