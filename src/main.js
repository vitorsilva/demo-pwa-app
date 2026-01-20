import './styles/main.css';
import { initDatabase, storeOpenRouterKey } from './core/db.js';
import router from './core/router.js';
import HomeView from './views/HomeView.js';
import TopicInputView from './views/TopicInputView.js';
import QuizView from './views/QuizView.js';
import ResultsView from './views/ResultsView.js';
import { initNetworkMonitoring } from './utils/network.js';
import { registerSW } from 'virtual:pwa-register';
import LoadingView from './views/LoadingView.js';
import SettingsView from './views/SettingsView.js';
import TopicsView from './views/TopicsView.js';
import { isAuthCallback, handleCallback } from './api/openrouter-auth.js';
import WelcomeView from './views/WelcomeView.js';
import HelpView from './views/HelpView.js';
import ImportView from './views/ImportView.js';
import OpenRouterGuideView from './views/OpenRouterGuideView.js';
import ConnectionConfirmedView from './views/ConnectionConfirmedView.js';
import CreatePartyView from './views/CreatePartyView.js';
import JoinPartyView from './views/JoinPartyView.js';
import PartyLobbyView from './views/PartyLobbyView.js';
import PartyQuizView from './views/PartyQuizView.js';
import PartyResultsView from './views/PartyResultsView.js';
import { loadSamplesIfNeeded } from './features/sample-loader.js';
import { prefetchModelPricing } from './services/model-service.js';
import { shouldShowWelcome, markWelcomeSeen } from './features/onboarding.js';
import { logger } from './utils/logger.js';
import { initErrorHandling } from './utils/errorHandler.js';
import { initPerformanceMonitoring } from './utils/performance.js'
import { telemetry } from './utils/telemetry.js';
import { initI18n, t } from './core/i18n.js';
import state from './core/state.js';
import { initAdManager } from './utils/adManager.js';
import { initTheme } from './services/theme-manager.js';
import { showConfirmModal } from './components/ConfirmModal.js';

logger.info('Saberloop initializing');
initErrorHandling();
initPerformanceMonitoring();
initTheme();

// Log telemetry status
if (telemetry.isEnabled()) {
  logger.info('Telemetry initialized');
} else {
  logger.debug('Telemetry disabled');
}

// Initialize database
async function init() {
  try {
    // Initialize i18n first (translations needed for UI)
    await initI18n();
    logger.info('i18n initialized');

    await initDatabase();
    logger.info('Database initialized');

    // Load sample quizzes if needed
    await loadSamplesIfNeeded();

    // Prefetch model pricing in background (for cost estimates)
    prefetchModelPricing();

    // Check if this is an OAuth callback BEFORE router starts
    if (isAuthCallback()) {
      logger.debug('OAuth callback detected');
      await handleOAuthCallback();
      return; // Don't continue with normal init
    }

    // Handle deep links (e.g., ?topic=History)
    handleDeepLinks();

    // Register routes
    router.addRoute('/', HomeView);
    router.addRoute('/topic-input', TopicInputView);
    router.addRoute('/quiz', QuizView);
    router.addRoute('/results', ResultsView);
    router.addRoute('/loading', LoadingView)
    router.addRoute('/settings', SettingsView);
    router.addRoute('/history', TopicsView);
    router.addRoute('/welcome', WelcomeView);
    router.addRoute('/help', HelpView);
    router.addRoute('/setup-openrouter', OpenRouterGuideView);
    router.addRoute('/connection-confirmed', ConnectionConfirmedView);
    router.addRoute('/import', ImportView);

    // Party routes (requires PARTY_SESSION feature flag)
    router.addRoute('/party/create', CreatePartyView);
    router.addRoute('/party/join', JoinPartyView);
    router.addRoute('/party/lobby', PartyLobbyView);
    router.addRoute('/party/quiz', PartyQuizView);
    router.addRoute('/party/results', PartyResultsView);

    // Start the router
    router.init();
    logger.info('Router initialized');

    // Expose router for E2E testing (access current view)
    if (import.meta.env.DEV || window.location.hostname === 'localhost') {
      window.__router = router;
    }

    // Initialize network status monitoring
    initNetworkMonitoring();

    // Initialize ad manager (for AdSense integration)
    initAdManager();

    // Check if current URL should bypass onboarding
    // These are externally shared links, so new users arriving via these
    // should go directly to their destination, not onboarding
    const hash = window.location.hash.slice(1) || '/';
    const isPartyJoinRoute = hash.startsWith('/party/join/');
    const isSharedQuizRoute = hash.startsWith('/quiz/') && hash.length > 6;

    // Redirect to welcome if needed (after router init)
    // Skip redirect if user arrived via shared link (party join or shared quiz)
    const showWelcome = await shouldShowWelcome();
    logger.debug('Show welcome check', { showWelcome, isPartyJoinRoute, isSharedQuizRoute });
    if (showWelcome && !isPartyJoinRoute && !isSharedQuizRoute) {
      window.location.hash = '#/welcome';
    }    

  } catch (error) {
    logger.error('Initialization failed', { error: error.message });
  }
}

/**
 * Handle deep links from shared URLs
 * Parses query params and stores prefilled topic in state
 */
function handleDeepLinks() {
  const params = new URLSearchParams(window.location.search);
  const topic = params.get('topic');

  if (topic) {
    const decodedTopic = decodeURIComponent(topic);
    state.set('prefilledTopic', decodedTopic);
    logger.debug('Deep link handled', { topic: decodedTopic });

    // Track telemetry
    telemetry.track('deep_link_opened', { topic: decodedTopic });

    // Clear query params and navigate to topic input
    const cleanUrl = window.location.pathname + '#/topic-input';
    window.history.replaceState({}, '', cleanUrl);
  }
}

  /**
   * Handle OAuth callback from OpenRouter
   */
  async function handleOAuthCallback() {
    const appContainer = document.getElementById('app');

    // Show loading state
    appContainer.innerHTML = `
      <div class="flex min-h-screen items-center justify-center
  bg-background-light dark:bg-background-dark">
        <div class="text-center">
          <span class="material-symbols-outlined text-5xl text-primary
  animate-spin">progress_activity</span>
          <p class="mt-4 text-lg font-medium text-text-light
  dark:text-text-dark">
            Completing connection...
          </p>
        </div>
      </div>
    `;

    try {
      // Exchange code for API key
      const apiKey = await handleCallback();

      // Store the key
      await storeOpenRouterKey(apiKey);

      // Mark welcome as seen so user goes to home
      await markWelcomeSeen();

      logger.info('OpenRouter connected successfully');

      // Redirect to connection confirmed page
      window.location.href = window.location.origin + '/app/#/connection-confirmed';

    } catch (error) {
      logger.error('OAuth callback failed', { error: error.message });

      // Show error
      appContainer.innerHTML = `
        <div class="flex min-h-screen items-center justify-center
  bg-background-light dark:bg-background-dark p-6">
          <div class="text-center max-w-sm">
            <span class="material-symbols-outlined text-5xl
  text-red-500">error</span>
            <p class="mt-4 text-lg font-medium text-text-light
  dark:text-text-dark">
              Connection Failed
            </p>
            <p class="mt-2 text-sm text-subtext-light dark:text-subtext-dark">       
              ${error.message}
            </p>
            <button
              onclick="window.location.href = '/app/'"
              class="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-medium     
  hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      `;
    }
  }

init();

// Register service worker with Vite PWA Plugin
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    async onNeedRefresh() {
      // New version available
      const confirmed = await showConfirmModal({
        title: t('app.updateAvailable'),
        message: t('app.updateMessage'),
        icon: 'info',
        confirmText: t('app.reload'),
        destructive: false
      });
      if (confirmed) {
        updateSW(true); // Force reload with new version
      }
    },
    onOfflineReady() {
      logger.info('App ready to work offline');
      telemetry.track('sw_offline_ready');
    },
    onRegistered(registration) {
      logger.info('Service Worker registered', {
        scope: registration?.scope
      });
      telemetry.track('sw_registered', {
        scope: registration?.scope
      });
    },
    onRegisterError(error) {
      // Capture detailed context for debugging (issue #90)
      const errorContext = {
        error: error.message,
        stack: error.stack?.substring(0, 500),
        userAgent: navigator.userAgent,
        url: window.location.href,
        online: navigator.onLine,
        timestamp: new Date().toISOString()
      };

      logger.error('Service Worker registration failed', errorContext);

      // Track in telemetry for pattern analysis
      telemetry.track('sw_registration_failed', {
        error: error.message,
        userAgent: navigator.userAgent,
        online: navigator.onLine
      });
    }
  });
} else {
  // Browser doesn't support service workers
  // Type assertion needed because TypeScript narrows navigator to 'never' in else branch
  const nav = /** @type {Navigator} */ (navigator);
  logger.warn('Service Worker not supported', {
    userAgent: nav.userAgent
  });
  telemetry.track('sw_not_supported', {
    userAgent: nav.userAgent
  });
}