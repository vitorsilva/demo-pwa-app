/**
 * Tests for party-connection-store.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setConnection,
  getConnection,
  clearConnection,
  hasConnection,
} from './party-connection-store.js';

// Mock PartyConnectionManager
function createMockManager(roomCode = 'ABC123') {
  return {
    roomCode,
    destroy: vi.fn(),
  };
}

describe('party-connection-store', () => {
  beforeEach(() => {
    // Clear any existing connection before each test
    clearConnection();
  });

  describe('setConnection', () => {
    it('should store a connection manager', () => {
      const manager = createMockManager();

      setConnection(manager);

      expect(getConnection()).toBe(manager);
    });

    it('should destroy existing connection when replacing', () => {
      const oldManager = createMockManager('OLD123');
      const newManager = createMockManager('NEW456');

      setConnection(oldManager);
      setConnection(newManager);

      expect(oldManager.destroy).toHaveBeenCalled();
      expect(getConnection()).toBe(newManager);
    });

    it('should not destroy if setting same manager', () => {
      const manager = createMockManager();

      setConnection(manager);
      setConnection(manager);

      expect(manager.destroy).not.toHaveBeenCalled();
    });
  });

  describe('getConnection', () => {
    it('should return null when no connection stored', () => {
      expect(getConnection()).toBeNull();
    });

    it('should return stored connection', () => {
      const manager = createMockManager();
      setConnection(manager);

      expect(getConnection()).toBe(manager);
    });
  });

  describe('clearConnection', () => {
    it('should destroy and clear the connection', () => {
      const manager = createMockManager();
      setConnection(manager);

      clearConnection();

      expect(manager.destroy).toHaveBeenCalled();
      expect(getConnection()).toBeNull();
    });

    it('should do nothing if no connection exists', () => {
      // Should not throw
      expect(() => clearConnection()).not.toThrow();
    });
  });

  describe('hasConnection', () => {
    it('should return false when no connection', () => {
      expect(hasConnection()).toBe(false);
    });

    it('should return true when connection exists', () => {
      setConnection(createMockManager());

      expect(hasConnection()).toBe(true);
    });

    it('should return false after clearing', () => {
      setConnection(createMockManager());
      clearConnection();

      expect(hasConnection()).toBe(false);
    });
  });
});
