/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createParticipantList, createParticipantItem } from './ParticipantList.js';

// Mock dependencies
vi.mock('../core/i18n.js', () => ({
  t: (key) => {
    const translations = {
      'party.participants': 'Participants',
      'party.host': 'host',
      'party.you': 'You',
      'party.answered': 'answered',
      'party.thinking': 'thinking',
    };
    return translations[key] || key;
  },
}));

describe('ParticipantList', () => {
  const mockParticipants = [
    { id: '1', name: 'Alice', isHost: true, status: 'connected' },
    { id: '2', name: 'Bob', isHost: false, isYou: true, status: 'connected' },
    { id: '3', name: 'Charlie', isHost: false, status: 'answered' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createParticipantItem', () => {
    it('should create item with participant name', () => {
      const item = createParticipantItem({ id: '1', name: 'Alice' });

      expect(item.textContent).toContain('Alice');
    });

    it('should show host badge for host', () => {
      const item = createParticipantItem({
        id: '1',
        name: 'Alice',
        isHost: true,
      });

      expect(item.textContent).toContain('host');
    });

    it('should not show host badge for non-host', () => {
      const item = createParticipantItem({
        id: '1',
        name: 'Bob',
        isHost: false,
      });

      const hostBadge = item.querySelector('[data-testid="host-badge"]');
      expect(hostBadge).toBeNull();
    });

    it('should show "You" indicator for current user', () => {
      const item = createParticipantItem({
        id: '1',
        name: 'Bob',
        isYou: true,
      });

      expect(item.textContent).toContain('You');
    });

    it('should show score when provided', () => {
      const item = createParticipantItem(
        {
          id: '1',
          name: 'Alice',
          score: 100,
        },
        { showScore: true }
      );

      expect(item.textContent).toContain('100');
    });

    it('should show status indicator when showStatus is true', () => {
      const item = createParticipantItem(
        { id: '1', name: 'Alice', status: 'connected' },
        { showStatus: true }
      );

      const statusIndicator = item.querySelector('[data-testid="status-indicator"]');
      expect(statusIndicator).not.toBeNull();
    });

    it('should not show status indicator when showStatus is false', () => {
      const item = createParticipantItem(
        { id: '1', name: 'Alice', status: 'connected' },
        { showStatus: false }
      );

      const statusIndicator = item.querySelector('[data-testid="status-indicator"]');
      expect(statusIndicator).toBeNull();
    });

    it('should show answered status', () => {
      const item = createParticipantItem(
        { id: '1', name: 'Alice', status: 'answered' },
        { showStatus: true }
      );

      expect(item.textContent).toContain('answered');
    });

    it('should show thinking status', () => {
      const item = createParticipantItem(
        { id: '1', name: 'Alice', status: 'thinking' },
        { showStatus: true }
      );

      expect(item.textContent).toContain('thinking');
    });
  });

  describe('createParticipantList', () => {
    it('should create list container', () => {
      const list = createParticipantList(mockParticipants);

      expect(list).toBeInstanceOf(HTMLElement);
    });

    it('should show participants header', () => {
      const list = createParticipantList(mockParticipants);

      expect(list.textContent).toContain('Participants');
    });

    it('should show participant count', () => {
      const list = createParticipantList(mockParticipants);

      expect(list.textContent).toContain('3');
    });

    it('should create item for each participant', () => {
      const list = createParticipantList(mockParticipants);

      expect(list.textContent).toContain('Alice');
      expect(list.textContent).toContain('Bob');
      expect(list.textContent).toContain('Charlie');
    });

    it('should handle empty participant list', () => {
      const list = createParticipantList([]);

      expect(list).toBeInstanceOf(HTMLElement);
      expect(list.textContent).toContain('0');
    });

    it('should pass showStatus option to items', () => {
      const list = createParticipantList(mockParticipants, { showStatus: true });

      const statusIndicators = list.querySelectorAll('[data-testid="status-indicator"]');
      expect(statusIndicators.length).toBeGreaterThan(0);
    });

    it('should pass showScore option to items', () => {
      const participantsWithScores = mockParticipants.map((p, i) => ({
        ...p,
        score: i * 100,
      }));

      const list = createParticipantList(participantsWithScores, { showScore: true });

      expect(list.textContent).toContain('0');
      expect(list.textContent).toContain('100');
      expect(list.textContent).toContain('200');
    });

    it('should not show scores when showScore is false', () => {
      const participantsWithScores = [{ id: '1', name: 'Alice', score: 999 }];

      const list = createParticipantList(participantsWithScores, { showScore: false });

      // Score should not appear when showScore is false
      const scoreElements = list.querySelectorAll('[data-testid="participant-score"]');
      expect(scoreElements.length).toBe(0);
    });

    it('should mark host first if present', () => {
      const unorderedParticipants = [
        { id: '2', name: 'Bob', isHost: false },
        { id: '1', name: 'Alice', isHost: true },
      ];

      const list = createParticipantList(unorderedParticipants);
      const items = list.querySelectorAll('[data-testid="participant-item"]');

      // First item should be Alice (the host)
      expect(items[0].textContent).toContain('Alice');
    });
  });
});
