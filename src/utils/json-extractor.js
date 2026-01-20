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
  return text
    .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas before } or ]
    .replace(/[\x00-\x1F]+/g, ' '); // Replace control chars with space (except in strings)
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
  if (cleaned.charCodeAt(0) === 0xFEFF) {
    cleaned = cleaned.slice(1);
  }

  // Step 2: Strip DeepSeek thinking tags (must happen before JSON extraction)
  // These models output <think>reasoning</think> before the actual response
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // Step 3: Normalize smart quotes to straight quotes
  cleaned = cleaned
    .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes " "
    .replace(/[\u2018\u2019]/g, "'"); // Smart single quotes ' '

  // Step 4: Try direct parse first (most common case)
  try {
    return JSON.parse(cleaned);
  } catch {
    // Continue to fallbacks
  }

  // Step 5: Try extracting from markdown code block
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    const jsonFromBlock = cleanJSON(codeBlockMatch[1].trim());
    try {
      return JSON.parse(jsonFromBlock);
    } catch {
      // Continue to other fallbacks
    }
  }

  // Step 6: Try to find JSON object in text
  // Match from first { to last } (greedy for nested objects)
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    const cleanedObject = cleanJSON(objectMatch[0]);
    try {
      return JSON.parse(cleanedObject);
    } catch {
      // Continue to array fallback
    }
  }

  // Step 7: Try to find JSON array in text
  // Match from first [ to last ] (greedy for nested arrays)
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    const cleanedArray = cleanJSON(arrayMatch[0]);
    try {
      return JSON.parse(cleanedArray);
    } catch {
      // All fallbacks failed
    }
  }

  // All strategies failed - log the raw text for debugging
  logger.error('JSON extraction failed', {
    rawText: text.substring(0, 500),
    textLength: text.length
  });

  throw new Error('Failed to extract valid JSON from response');
}
