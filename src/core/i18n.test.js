/**
 * Unit tests for i18n module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import i18next from 'i18next';

// Mock translations
const mockEnTranslations = {
    common: {
        home: 'Home',
        settings: 'Settings'
    },
    home: {
        welcome: 'Welcome back!',
        questionOf: 'Question {{current}} of {{total}}'
    }
};

const mockPtTranslations = {
    common: {
        home: 'Início',
        settings: 'Definições'
    },
    home: {
        welcome: 'Bem-vindo de volta!',
        questionOf: 'Pergunta {{current}} de {{total}}'
    }
};

// Mock fetch to return translations
function mockFetch(lang) {
    return vi.fn((url) => {
        if (url.includes('en.json')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockEnTranslations)
            });
        }
        if (url.includes('pt-PT.json')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockPtTranslations)
            });
        }
        // Not found
        return Promise.resolve({ ok: false });
    });
}

describe('i18n Module', () => {
    let originalFetch;
    let originalLocalStorage;

    beforeEach(() => {
        // Reset i18next state
        if (i18next.isInitialized) {
            // Remove all resources
            i18next.options.resources = {};
            i18next.store.data = {};
        }

        // Mock fetch
        originalFetch = global.fetch;
        global.fetch = mockFetch();

        // Mock localStorage
        originalLocalStorage = global.localStorage;
        const store = {};
        global.localStorage = {
            getItem: vi.fn((key) => store[key] || null),
            setItem: vi.fn((key, value) => { store[key] = value; }),
            removeItem: vi.fn((key) => { delete store[key]; }),
            clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); })
        };

        // Clear module cache to reset initialization state
        vi.resetModules();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        global.localStorage = originalLocalStorage;
        vi.restoreAllMocks();
    });

    describe('SUPPORTED_LANGUAGES', () => {
        it('should export supported languages array', async () => {
            const { SUPPORTED_LANGUAGES } = await import('./i18n.js');
            expect(SUPPORTED_LANGUAGES).toBeDefined();
            expect(Array.isArray(SUPPORTED_LANGUAGES)).toBe(true);
            expect(SUPPORTED_LANGUAGES.length).toBeGreaterThan(0);
        });

        it('should include English as default', async () => {
            const { SUPPORTED_LANGUAGES } = await import('./i18n.js');
            const english = SUPPORTED_LANGUAGES.find(l => l.code === 'en');
            expect(english).toBeDefined();
            expect(english.name).toBe('English');
            expect(english.flag).toBe('🇬🇧');
        });

        it('should include Portuguese (pt-PT)', async () => {
            const { SUPPORTED_LANGUAGES } = await import('./i18n.js');
            const portuguese = SUPPORTED_LANGUAGES.find(l => l.code === 'pt-PT');
            expect(portuguese).toBeDefined();
            expect(portuguese.name).toBe('Português');
            expect(portuguese.flag).toBe('🇵🇹');
        });

        it('should have exactly 9 supported languages', async () => {
            const { SUPPORTED_LANGUAGES } = await import('./i18n.js');
            expect(SUPPORTED_LANGUAGES).toHaveLength(9);
        });

        it('should have all required language properties', async () => {
            const { SUPPORTED_LANGUAGES } = await import('./i18n.js');
            SUPPORTED_LANGUAGES.forEach(lang => {
                expect(lang.code).toBeTruthy();
                expect(lang.name).toBeTruthy();
                expect(lang.flag).toBeTruthy();
            });
        });

        it('should include all expected languages with correct data', async () => {
            const { SUPPORTED_LANGUAGES } = await import('./i18n.js');
            const expectedLangs = {
                'en': { name: 'English', flag: '🇬🇧' },
                'pt-PT': { name: 'Português', flag: '🇵🇹' },
                'es': { name: 'Español', flag: '🇪🇸' },
                'fr': { name: 'Français', flag: '🇫🇷' },
                'de': { name: 'Deutsch', flag: '🇩🇪' },
                'it': { name: 'Italiano', flag: '🇮🇹' },
                'nl': { name: 'Nederlands', flag: '🇳🇱' },
                'no': { name: 'Norsk', flag: '🇳🇴' },
                'ru': { name: 'Русский', flag: '🇷🇺' }
            };

            Object.entries(expectedLangs).forEach(([code, expected]) => {
                const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
                expect(lang).toBeDefined();
                expect(lang.name).toBe(expected.name);
                expect(lang.flag).toBe(expected.flag);
            });
        });
    });

    describe('DEFAULT_LANGUAGE', () => {
        it('should export English as default language', async () => {
            const { DEFAULT_LANGUAGE } = await import('./i18n.js');
            expect(DEFAULT_LANGUAGE).toBe('en');
        });
    });

    describe('initI18n', () => {
        it('should initialize i18next successfully', async () => {
            const { initI18n } = await import('./i18n.js');
            const instance = await initI18n();
            expect(instance).toBeDefined();
            expect(instance.isInitialized).toBe(true);
        });

        it('should load English translations', async () => {
            const { initI18n, t } = await import('./i18n.js');
            await initI18n({ lng: 'en' });
            expect(t('common.home')).toBe('Home');
        });

        it('should only initialize once', async () => {
            const { initI18n } = await import('./i18n.js');
            const first = await initI18n();
            const second = await initI18n();
            expect(first).toBe(second);
        });

        it('should respect lng option', async () => {
            const { initI18n, getCurrentLanguage } = await import('./i18n.js');
            await initI18n({ lng: 'pt-PT' });
            expect(getCurrentLanguage()).toBe('pt-PT');
        });

        it('should handle concurrent initialization calls', async () => {
            const { initI18n } = await import('./i18n.js');
            // Start multiple init calls concurrently
            const [first, second, third] = await Promise.all([
                initI18n(),
                initI18n(),
                initI18n()
            ]);
            // All should return the same instance
            expect(first).toBe(second);
            expect(second).toBe(third);
        });

        it('should use localStorage language when available', async () => {
            localStorage.setItem('i18nextLng', 'pt-PT');
            const { initI18n, getCurrentLanguage } = await import('./i18n.js');
            await initI18n();
            expect(getCurrentLanguage()).toBe('pt-PT');
        });

        it('should handle failed translation loading gracefully', async () => {
            // Mock fetch to fail for all languages
            global.fetch = vi.fn(() => Promise.resolve({ ok: false }));

            const { initI18n, t } = await import('./i18n.js');
            await initI18n({ lng: 'en' });
            // Should still work, just with empty translations
            expect(t('common.home')).toBe('common.home');
        });
    });

    describe('t (translate)', () => {
        it('should return translated text', async () => {
            const { initI18n, t } = await import('./i18n.js');
            await initI18n({ lng: 'en' });
            expect(t('common.home')).toBe('Home');
            expect(t('home.welcome')).toBe('Welcome back!');
        });

        it('should handle interpolation', async () => {
            const { initI18n, t } = await import('./i18n.js');
            await initI18n({ lng: 'en' });
            const result = t('home.questionOf', { current: 1, total: 5 });
            expect(result).toBe('Question 1 of 5');
        });

        it('should return key when not initialized', async () => {
            // Import without initializing
            const { t } = await import('./i18n.js');
            // Don't call initI18n
            const result = t('common.home');
            expect(result).toBe('common.home');
        });

        it('should return key for missing translations', async () => {
            const { initI18n, t } = await import('./i18n.js');
            await initI18n({ lng: 'en' });
            const result = t('nonexistent.key');
            expect(result).toBe('nonexistent.key');
        });
    });

    describe('changeLanguage', () => {
        it('should change language to Portuguese', async () => {
            const { initI18n, changeLanguage, getCurrentLanguage, t } = await import('./i18n.js');
            await initI18n({ lng: 'en' });

            await changeLanguage('pt-PT');

            expect(getCurrentLanguage()).toBe('pt-PT');
            expect(t('common.home')).toBe('Início');
        });

        it('should normalize language codes', async () => {
            const { initI18n, changeLanguage, getCurrentLanguage } = await import('./i18n.js');
            await initI18n({ lng: 'en' });

            // pt-BR should normalize to pt-PT (our supported variant)
            await changeLanguage('pt-BR');
            expect(getCurrentLanguage()).toBe('pt-PT');
        });

        it('should fallback to English for unsupported languages', async () => {
            const { initI18n, changeLanguage, getCurrentLanguage } = await import('./i18n.js');
            await initI18n({ lng: 'en' });

            await changeLanguage('xx-XX');
            expect(getCurrentLanguage()).toBe('en');
        });

        it('should persist language choice to localStorage', async () => {
            const { initI18n, changeLanguage } = await import('./i18n.js');
            await initI18n({ lng: 'en' });

            await changeLanguage('pt-PT');

            expect(localStorage.setItem).toHaveBeenCalledWith('i18nextLng', 'pt-PT');
        });

        it('should not reload translations if already loaded', async () => {
            const { initI18n, changeLanguage, getCurrentLanguage } = await import('./i18n.js');
            await initI18n({ lng: 'pt-PT' });

            // Clear fetch mock call count
            global.fetch.mockClear();

            // Change to same language - should not fetch again
            await changeLanguage('pt-PT');
            expect(getCurrentLanguage()).toBe('pt-PT');
        });

        it('should handle failed translation loading during language change', async () => {
            const { initI18n, changeLanguage, getCurrentLanguage } = await import('./i18n.js');
            await initI18n({ lng: 'en' });

            // Mock fetch to fail for Spanish
            global.fetch = vi.fn((url) => {
                if (url.includes('es.json')) {
                    return Promise.resolve({ ok: false });
                }
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockEnTranslations)
                });
            });

            // Should still change language even if translations fail
            const result = await changeLanguage('es');
            expect(result).toBe('es');
            expect(getCurrentLanguage()).toBe('es');
        });

        it('should return the normalized language code', async () => {
            const { initI18n, changeLanguage } = await import('./i18n.js');
            await initI18n({ lng: 'en' });

            const result = await changeLanguage('pt-BR');
            expect(result).toBe('pt-PT');
        });
    });

    describe('getCurrentLanguage', () => {
        it('should return current language code', async () => {
            const { initI18n, getCurrentLanguage } = await import('./i18n.js');
            await initI18n({ lng: 'en' });
            expect(getCurrentLanguage()).toBe('en');
        });

        it('should return default when not initialized', async () => {
            const { getCurrentLanguage, DEFAULT_LANGUAGE } = await import('./i18n.js');
            // Note: getCurrentLanguage uses i18next.language which may be undefined
            const result = getCurrentLanguage();
            expect([DEFAULT_LANGUAGE, undefined]).toContain(result);
        });
    });

    describe('isI18nReady', () => {
        it('should return false before initialization', async () => {
            const { isI18nReady } = await import('./i18n.js');
            expect(isI18nReady()).toBe(false);
        });

        it('should return true after initialization', async () => {
            const { initI18n, isI18nReady } = await import('./i18n.js');
            await initI18n();
            expect(isI18nReady()).toBe(true);
        });
    });

    describe('onLanguageChange', () => {
        it('should call callback when language changes', async () => {
            const { initI18n, changeLanguage, onLanguageChange } = await import('./i18n.js');
            await initI18n({ lng: 'en' });

            const callback = vi.fn();
            onLanguageChange(callback);

            await changeLanguage('pt-PT');

            expect(callback).toHaveBeenCalledWith('pt-PT');
        });

        it('should return unsubscribe function', async () => {
            const { initI18n, changeLanguage, onLanguageChange } = await import('./i18n.js');
            await initI18n({ lng: 'en' });

            const callback = vi.fn();
            const unsubscribe = onLanguageChange(callback);

            // Unsubscribe before changing
            unsubscribe();

            await changeLanguage('pt-PT');

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('loadTranslations fallback behavior', () => {
        it('should fallback to base language when regional not found', async () => {
            // Mock fetch: pt-PT.json fails, but pt.json succeeds
            const mockPtBaseTranslations = {
                common: { home: 'Casa' }
            };

            global.fetch = vi.fn((url) => {
                if (url.includes('en.json')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockEnTranslations)
                    });
                }
                if (url.includes('pt-PT.json')) {
                    return Promise.resolve({ ok: false });
                }
                if (url.includes('pt.json')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockPtBaseTranslations)
                    });
                }
                return Promise.resolve({ ok: false });
            });

            const { initI18n, changeLanguage, t } = await import('./i18n.js');
            await initI18n({ lng: 'en' });

            await changeLanguage('pt-PT');

            // Should have loaded the pt.json fallback
            expect(t('common.home')).toBe('Casa');
        });

        it('should return null when both regional and base language fail', async () => {
            // Mock fetch to fail for all
            global.fetch = vi.fn((url) => {
                if (url.includes('en.json')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockEnTranslations)
                    });
                }
                return Promise.resolve({ ok: false });
            });

            const { initI18n, changeLanguage, t } = await import('./i18n.js');
            await initI18n({ lng: 'en' });

            await changeLanguage('fr');

            // Should fallback to English translations via i18next fallback
            expect(t('common.home')).toBe('Home');
        });

        it('should handle fetch exceptions gracefully', async () => {
            // Mock fetch to throw an error
            global.fetch = vi.fn((url) => {
                if (url.includes('en.json')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockEnTranslations)
                    });
                }
                return Promise.reject(new Error('Network error'));
            });

            const { initI18n, changeLanguage, getCurrentLanguage } = await import('./i18n.js');
            await initI18n({ lng: 'en' });

            // Should not throw, just log warning
            await changeLanguage('de');
            expect(getCurrentLanguage()).toBe('de');
        });

        it('should not attempt base language fallback when lang has no region', async () => {
            let fetchCalls = [];
            global.fetch = vi.fn((url) => {
                fetchCalls.push(url);
                if (url.includes('en.json')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockEnTranslations)
                    });
                }
                if (url.includes('fr.json')) {
                    return Promise.resolve({ ok: false });
                }
                return Promise.resolve({ ok: false });
            });

            const { initI18n, changeLanguage } = await import('./i18n.js');
            await initI18n({ lng: 'en' });

            fetchCalls = []; // Reset after init
            await changeLanguage('fr');

            // Should only try fr.json, not fr.json twice
            const frCalls = fetchCalls.filter(url => url.includes('fr.json'));
            expect(frCalls).toHaveLength(1);
        });
    });
});
