/**
 * Internationalization (i18n) Module
 *
 * Provides translation functionality using i18next.
 * Supports multiple languages with automatic browser detection.
 *
 * Usage:
 *   import { t, changeLanguage, getCurrentLanguage } from '../core/i18n.js';
 *
 *   // Translate a key
 *   const text = t('home.welcome');
 *
 *   // With interpolation
 *   const text = t('quiz.questionOf', { current: 1, total: 5 });
 *
 *   // Change language
 *   await changeLanguage('pt-PT');
 */

import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pt-PT', name: 'Português', flag: '🇵🇹' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

// Default/fallback language
export const DEFAULT_LANGUAGE = 'en';

// Track initialization state
let isInitialized = false;
let initPromise = null;

/**
 * Load translations for a language
 * Fetches from /locales/{lang}.json
 */
async function loadTranslations(lang) {
  try {
    // Handle language codes with regions (e.g., pt-PT -> pt-PT.json)
    const response = await fetch(`${import.meta.env.BASE_URL}locales/${lang}.json`);
    if (!response.ok) {
      // Try base language if regional not found (e.g., pt-PT -> pt)
      const baseLang = lang.split('-')[0];
      if (baseLang !== lang) {
        const baseResponse = await fetch(`${import.meta.env.BASE_URL}locales/${baseLang}.json`);
        if (baseResponse.ok) {
          return await baseResponse.json();
        }
      }
      throw new Error(`Translation file not found: ${lang}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`[i18n] Failed to load translations for ${lang}:`, error.message);
    return null;
  }
}

/**
 * Initialize i18next with configuration
 * Called automatically on first use
 */
export async function initI18n(options = {}) {
  if (isInitialized) return i18next;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Load English translations (always available as fallback)
    const enTranslations = await loadTranslations('en');

    // Detect initial language
    const detectedLang =
      options.lng || localStorage.getItem('i18nextLng') || navigator.language || DEFAULT_LANGUAGE;

    // Normalize language code
    const normalizedLang = normalizeLanguageCode(detectedLang);

    // Load translations for detected language if not English
    let langTranslations = null;
    if (normalizedLang !== 'en') {
      langTranslations = await loadTranslations(normalizedLang);
    }

    // Build resources object
    const resources = {
      en: { translation: enTranslations || {} },
    };

    if (langTranslations && normalizedLang !== 'en') {
      resources[normalizedLang] = { translation: langTranslations };
    }

    await i18next.use(LanguageDetector).init({
      resources,
      fallbackLng: DEFAULT_LANGUAGE,
      lng: normalizedLang,
      interpolation: {
        escapeValue: false, // Not needed for vanilla JS (no XSS risk like React)
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
      },
      ...options,
    });

    isInitialized = true;
    return i18next;
  })();

  return initPromise;
}

/**
 * Normalize language codes to supported format
 * e.g., 'pt-BR' -> 'pt-PT', 'en-US' -> 'en'
 */
function normalizeLanguageCode(code) {
  if (!code) return DEFAULT_LANGUAGE;

  // Check exact match first
  const exactMatch = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  if (exactMatch) return exactMatch.code;

  // Check base language match
  const baseLang = code.split('-')[0];
  const baseMatch = SUPPORTED_LANGUAGES.find((l) => l.code.split('-')[0] === baseLang);
  if (baseMatch) return baseMatch.code;

  return DEFAULT_LANGUAGE;
}

/**
 * Translate a key
 * Auto-initializes i18next if not already done
 */
export function t(key, options) {
  if (!isInitialized) {
    // Return key as fallback if not initialized
    // This prevents errors during initial render
    console.warn(`[i18n] Not initialized, returning key: ${key}`);
    return key;
  }
  return i18next.t(key, options);
}

/**
 * Change the current language
 * Loads translations if not already loaded
 */
export async function changeLanguage(lang) {
  const normalizedLang = normalizeLanguageCode(lang);

  // Load translations if not already loaded
  if (!i18next.hasResourceBundle(normalizedLang, 'translation')) {
    const translations = await loadTranslations(normalizedLang);
    if (translations) {
      i18next.addResourceBundle(normalizedLang, 'translation', translations);
    }
  }

  await i18next.changeLanguage(normalizedLang);
  localStorage.setItem('i18nextLng', normalizedLang);

  return normalizedLang;
}

/**
 * Get the current language code
 */
export function getCurrentLanguage() {
  return i18next.language || DEFAULT_LANGUAGE;
}

/**
 * Check if i18n is initialized
 */
export function isI18nReady() {
  return isInitialized;
}

/**
 * Subscribe to language changes
 * Returns unsubscribe function
 */
export function onLanguageChange(callback) {
  i18next.on('languageChanged', callback);
  return () => i18next.off('languageChanged', callback);
}

// Export i18next instance for advanced usage
export default i18next;
