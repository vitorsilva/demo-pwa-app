  /**
   * Party Connection Store
   *
   * Simple module-level store for PartyConnectionManager.
   * Allows connection to persist across view navigation.
   *
   * @module services/party-connection-store
   */

  import { logger } from '../utils/logger.js';

  const log = logger.child({ module: 'party-connection-store' });

  /** @type {import('./party-connection-manager.js').PartyConnectionManager|null} */
  let currentConnection = null;

  /**
   * Store a connection manager.
   * @param {import('./party-connection-manager.js').PartyConnectionManager} manager
   */
  export function setConnection(manager) {
    // Clean up any existing connection first
    if (currentConnection && currentConnection !== manager) {
      log.warn('Replacing existing connection');
      currentConnection.destroy();
    }
    currentConnection = manager;
    log.info('Connection stored', { roomCode: manager.roomCode });
  }

  /**
   * Get the current connection manager.
   * @returns {import('./party-connection-manager.js').PartyConnectionManager|null}
   */
  export function getConnection() {
    return currentConnection;
  }

  /**
   * Clear and destroy the current connection.
   */
  export function clearConnection() {
    if (currentConnection) {
      log.info('Clearing connection', { roomCode: currentConnection.roomCode });
      currentConnection.destroy();
      currentConnection = null;
    }
  }

  /**
   * Check if a connection exists.
   * @returns {boolean}
   */
  export function hasConnection() {
    return currentConnection !== null;
  }