// Router - Handles navigation between views

import { logger } from '../utils/logger.js';

class Router {
  constructor() {
    this.routes = new Map(); // Store route → ViewClass mappings
    this.currentView = null; // Currently displayed view
  }

  /**
   * Register a route
   * @param {string} path - Route path (e.g., '/home')
   * @param {new (options?: Object) => Object} ViewClass - View class constructor to render
   */
  addRoute(path, ViewClass) {
    this.routes.set(path, ViewClass);
  }

  /**
   * Navigate to a route programmatically
   * @param {string} path - Route path to navigate to
   */
  navigateTo(path) {
    window.location.hash = path;
  }

  /**
   * Handle route changes (triggered by hash change)
   */
  handleRoute() {
    // Get current hash, default to '/' if empty
    const hash = window.location.hash.slice(1) || '/';

    // Check for shared quiz URL pattern: /quiz/<encoded_data>
    if (hash.startsWith('/quiz/') && hash.length > 7) {
      const encodedData = hash.slice(6); // Remove '/quiz/' prefix
      this.handleSharedQuiz(encodedData);
      return;
    }

    // Check for party join with code: /party/join/<code>
    if (hash.startsWith('/party/join/') && hash.length > 12) {
      const code = hash.slice(12); // Remove '/party/join/' prefix
      this.handlePartyJoin(code);
      return;
    }

    // Check for party lobby with code: /party/lobby/<code>
    if (hash.startsWith('/party/lobby/') && hash.length > 13) {
      const code = hash.slice(13); // Remove '/party/lobby/' prefix
      this.handlePartyLobby(code);
      return;
    }

    // Check for party quiz with code: /party/quiz/<code>
    if (hash.startsWith('/party/quiz/') && hash.length > 12) {
      const code = hash.slice(12); // Remove '/party/quiz/' prefix
      this.handlePartyQuiz(code);
      return;
    }

    // Check for party results with code: /party/results/<code>
    if (hash.startsWith('/party/results/') && hash.length > 15) {
      const code = hash.slice(15); // Remove '/party/results/' prefix
      this.handlePartyResults(code);
      return;
    }

    // Find the view class for this route
    const ViewClass = this.routes.get(hash);

    if (ViewClass) {
      this.render(ViewClass);
    } else {
      // Route not found, go to default route
      logger.warn('Route not found, redirecting to /', { hash });
      this.navigateTo('/');
    }
  }

  /**
   * Handle shared quiz import from URL
   * @param {string} encodedData - The encoded quiz data from URL
   */
  handleSharedQuiz(encodedData) {
    logger.info('Detected shared quiz URL', { dataLength: encodedData.length });

    // Store the encoded data for the import view to access
    this.sharedQuizData = encodedData;

    // Render the import view (will be registered as '/import')
    const ImportView = this.routes.get('/import');
    if (ImportView) {
      this.render(ImportView);
    } else {
      logger.warn('Import view not registered, redirecting to home');
      this.navigateTo('/');
    }
  }

  /**
   * Get and clear shared quiz data (called by ImportView)
   * @returns {string|null} The encoded quiz data or null
   */
  getSharedQuizData() {
    const data = this.sharedQuizData;
    this.sharedQuizData = null;
    return data;
  }

  /**
   * Handle party join with prefilled code
   * @param {string} code - The room code from URL
   */
  handlePartyJoin(code) {
    logger.info('Detected party join URL', { code });

    // Store the code for the join view to access
    this.partyJoinCode = code;

    // Render the join party view
    const JoinPartyView = this.routes.get('/party/join');
    if (JoinPartyView) {
      this.render(JoinPartyView, { prefillCode: code });
    } else {
      logger.warn('JoinPartyView not registered, redirecting to home');
      this.navigateTo('/');
    }
  }

  /**
   * Handle party lobby with room code
   * @param {string} code - The room code from URL
   */
  handlePartyLobby(code) {
    logger.info('Detected party lobby URL', { code });

    // Store the code for the lobby view to access
    this.partyLobbyCode = code;

    // Render the lobby view
    const PartyLobbyView = this.routes.get('/party/lobby');
    if (PartyLobbyView) {
      this.render(PartyLobbyView, { roomCode: code });
    } else {
      logger.warn('PartyLobbyView not registered, redirecting to home');
      this.navigateTo('/');
    }
  }

  /**
   * Get and clear party join code (called by JoinPartyView)
   * @returns {string|null} The room code or null
   */
  getPartyJoinCode() {
    const code = this.partyJoinCode;
    this.partyJoinCode = null;
    return code;
  }

  /**
   * Get and clear party lobby code (called by PartyLobbyView)
   * @returns {string|null} The room code or null
   */
  getPartyLobbyCode() {
    const code = this.partyLobbyCode;
    this.partyLobbyCode = null;
    return code;
  }

  /**
   * Handle party quiz with room code
   * @param {string} code - The room code from URL
   */
  handlePartyQuiz(code) {
    logger.info('Detected party quiz URL', { code });

    // Store the code for the quiz view to access
    this.partyQuizCode = code;

    // Render the quiz view
    const PartyQuizView = this.routes.get('/party/quiz');
    if (PartyQuizView) {
      this.render(PartyQuizView, { roomCode: code });
    } else {
      logger.warn('PartyQuizView not registered, redirecting to home');
      this.navigateTo('/');
    }
  }

  /**
   * Get and clear party quiz code (called by PartyQuizView)
   * @returns {string|null} The room code or null
   */
  getPartyQuizCode() {
    const code = this.partyQuizCode;
    this.partyQuizCode = null;
    return code;
  }

  /**
   * Handle party results with room code
   * @param {string} code - The room code from URL
   */
  handlePartyResults(code) {
    logger.info('Detected party results URL', { code });

    // Store the code for the results view to access
    this.partyResultsCode = code;

    // Render the results view
    const PartyResultsView = this.routes.get('/party/results');
    if (PartyResultsView) {
      this.render(PartyResultsView, { roomCode: code });
    } else {
      logger.warn('PartyResultsView not registered, redirecting to home');
      this.navigateTo('/');
    }
  }

  /**
   * Get and clear party results code (called by PartyResultsView)
   * @returns {string|null} The room code or null
   */
  getPartyResultsCode() {
    const code = this.partyResultsCode;
    this.partyResultsCode = null;
    return code;
  }

  /**
   * Render a view
   * @param {new (options?: Object) => Object} ViewClass - View class constructor to instantiate
   * @param {Object} [options] - Optional options to pass to view constructor
   */
  render(ViewClass, options = {}) {
    // Clean up previous view
    if (this.currentView && this.currentView.destroy) {
      this.currentView.destroy();
    }

    // Create and render new view (pass options if provided)
    this.currentView = new ViewClass(options);
    this.currentView.render();
  }

  /**
   * Initialize the router
   */
  init() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRoute());

    // Handle initial page load
    this.handleRoute();
  }
}

// Export singleton instance
export default new Router();
