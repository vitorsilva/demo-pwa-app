/**
 * LiveScoreboard Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLiveScoreboard } from './LiveScoreboard.js';

// Mock i18n
vi.mock('../core/i18n.js', () => ({
  t: (key) => {
    const translations = {
      'party.liveScores': 'Live Scores',
      'party.you': 'You',
    };
    return translations[key] || key;
  },
}));

describe('LiveScoreboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createLiveScoreboard', () => {
    it('should create a scoreboard container with correct structure', () => {
      const scores = [
        { id: '1', name: 'Alice', score: 5 },
        { id: '2', name: 'Bob', score: 3 },
      ];

      const element = createLiveScoreboard(scores);

      expect(element.className).toBe('live-scoreboard');
      expect(element.getAttribute('data-testid')).toBe('live-scoreboard');
      expect(element.querySelector('h3').textContent).toBe('Live Scores');
    });

    it('should render score list with correct testid', () => {
      const scores = [{ id: '1', name: 'Alice', score: 5 }];

      const element = createLiveScoreboard(scores);
      const list = element.querySelector('[data-testid="score-list"]');

      expect(list).not.toBeNull();
    });

    it('should render all participants', () => {
      const scores = [
        { id: '1', name: 'Alice', score: 5 },
        { id: '2', name: 'Bob', score: 3 },
        { id: '3', name: 'Charlie', score: 7 },
      ];

      const element = createLiveScoreboard(scores);
      const items = element.querySelectorAll('[data-testid="score-item"]');

      expect(items.length).toBe(3);
    });
  });

  describe('score sorting', () => {
    it('should sort scores by highest first', () => {
      const scores = [
        { id: '1', name: 'Alice', score: 3 },
        { id: '2', name: 'Bob', score: 7 },
        { id: '3', name: 'Charlie', score: 5 },
      ];

      const element = createLiveScoreboard(scores);
      const items = element.querySelectorAll('[data-testid="score-item"]');

      // Bob (7) should be first
      expect(items[0].getAttribute('data-participant-id')).toBe('2');
      // Charlie (5) should be second
      expect(items[1].getAttribute('data-participant-id')).toBe('3');
      // Alice (3) should be third
      expect(items[2].getAttribute('data-participant-id')).toBe('1');
    });

    it('should handle equal scores', () => {
      const scores = [
        { id: '1', name: 'Alice', score: 5 },
        { id: '2', name: 'Bob', score: 5 },
      ];

      const element = createLiveScoreboard(scores);
      const items = element.querySelectorAll('[data-testid="score-item"]');

      expect(items.length).toBe(2);
    });

    it('should handle empty scores array', () => {
      const element = createLiveScoreboard([]);
      const items = element.querySelectorAll('[data-testid="score-item"]');

      expect(items.length).toBe(0);
    });
  });

  describe('rank styling', () => {
    it('should apply gold styling to first place', () => {
      const scores = [
        { id: '1', name: 'Alice', score: 10 },
        { id: '2', name: 'Bob', score: 5 },
      ];

      const element = createLiveScoreboard(scores);
      const firstItem = element.querySelector('[data-testid="score-item"]');
      const rankEl = firstItem.querySelector('span');

      expect(rankEl.textContent).toBe('1');
      expect(rankEl.className).toContain('bg-yellow-500');
    });

    it('should apply silver styling to second place', () => {
      const scores = [
        { id: '1', name: 'Alice', score: 10 },
        { id: '2', name: 'Bob', score: 5 },
      ];

      const element = createLiveScoreboard(scores);
      const items = element.querySelectorAll('[data-testid="score-item"]');
      const rankEl = items[1].querySelector('span');

      expect(rankEl.textContent).toBe('2');
      expect(rankEl.className).toContain('bg-gray-400');
    });

    it('should apply bronze styling to third place', () => {
      const scores = [
        { id: '1', name: 'Alice', score: 10 },
        { id: '2', name: 'Bob', score: 7 },
        { id: '3', name: 'Charlie', score: 5 },
      ];

      const element = createLiveScoreboard(scores);
      const items = element.querySelectorAll('[data-testid="score-item"]');
      const rankEl = items[2].querySelector('span');

      expect(rankEl.textContent).toBe('3');
      expect(rankEl.className).toContain('bg-amber-700');
    });

    it('should apply default styling to fourth place and beyond', () => {
      const scores = [
        { id: '1', name: 'Alice', score: 10 },
        { id: '2', name: 'Bob', score: 7 },
        { id: '3', name: 'Charlie', score: 5 },
        { id: '4', name: 'Diana', score: 3 },
      ];

      const element = createLiveScoreboard(scores);
      const items = element.querySelectorAll('[data-testid="score-item"]');
      const rankEl = items[3].querySelector('span');

      expect(rankEl.textContent).toBe('4');
      expect(rankEl.className).toContain('bg-gray-200');
    });
  });

  describe('status indicator', () => {
    it('should show status indicator when showStatus is true and status exists', () => {
      const scores = [{ id: '1', name: 'Alice', score: 5, status: 'answered' }];

      const element = createLiveScoreboard(scores, { showStatus: true });
      const statusDot = element.querySelector('[data-testid="status-indicator"]');

      expect(statusDot).not.toBeNull();
      expect(statusDot.className).toContain('bg-green-500');
    });

    it('should not show status indicator when showStatus is false', () => {
      const scores = [{ id: '1', name: 'Alice', score: 5, status: 'answered' }];

      const element = createLiveScoreboard(scores, { showStatus: false });
      const statusDot = element.querySelector('[data-testid="status-indicator"]');

      expect(statusDot).toBeNull();
    });

    it('should show correct color for thinking status', () => {
      const scores = [{ id: '1', name: 'Alice', score: 5, status: 'thinking' }];

      const element = createLiveScoreboard(scores, { showStatus: true });
      const statusDot = element.querySelector('[data-testid="status-indicator"]');

      expect(statusDot.className).toContain('bg-yellow-500');
      expect(statusDot.className).toContain('animate-pulse');
    });

    it('should show correct color for disconnected status', () => {
      const scores = [{ id: '1', name: 'Alice', score: 5, status: 'disconnected' }];

      const element = createLiveScoreboard(scores, { showStatus: true });
      const statusDot = element.querySelector('[data-testid="status-indicator"]');

      expect(statusDot.className).toContain('bg-red-500');
    });

    it('should show default color for unknown status', () => {
      const scores = [{ id: '1', name: 'Alice', score: 5, status: 'unknown' }];

      const element = createLiveScoreboard(scores, { showStatus: true });
      const statusDot = element.querySelector('[data-testid="status-indicator"]');

      expect(statusDot.className).toContain('bg-gray-500');
    });

    it('should default showStatus to true', () => {
      const scores = [{ id: '1', name: 'Alice', score: 5, status: 'answered' }];

      const element = createLiveScoreboard(scores);
      const statusDot = element.querySelector('[data-testid="status-indicator"]');

      expect(statusDot).not.toBeNull();
    });
  });

  describe('highlighting', () => {
    it('should highlight participant when isYou is true', () => {
      const scores = [
        { id: '1', name: 'Alice', score: 5, isYou: true },
        { id: '2', name: 'Bob', score: 3 },
      ];

      const element = createLiveScoreboard(scores);
      const items = element.querySelectorAll('[data-testid="score-item"]');

      expect(items[0].className).toContain('bg-primary/10');
      expect(items[0].className).toContain('border-primary/30');
      expect(items[1].className).not.toContain('bg-primary/10');
    });

    it('should highlight participant when highlightId matches', () => {
      const scores = [
        { id: '1', name: 'Alice', score: 5 },
        { id: '2', name: 'Bob', score: 3 },
      ];

      const element = createLiveScoreboard(scores, { highlightId: '2' });
      const items = element.querySelectorAll('[data-testid="score-item"]');

      // Bob should be highlighted (but Alice is first due to higher score)
      expect(items[1].className).toContain('bg-primary/10');
    });

    it('should show "(You)" badge for current user', () => {
      const scores = [{ id: '1', name: 'Alice', score: 5, isYou: true }];

      const element = createLiveScoreboard(scores);

      expect(element.textContent).toContain('(You)');
    });

    it('should not show "(You)" badge for other participants', () => {
      const scores = [{ id: '1', name: 'Alice', score: 5, isYou: false }];

      const element = createLiveScoreboard(scores);
      const items = element.querySelectorAll('[data-testid="score-item"]');

      expect(items[0].textContent).not.toContain('(You)');
    });
  });

  describe('compact mode', () => {
    it('should use compact layout when compact is true', () => {
      const scores = [
        { id: '1', name: 'Alice', score: 5 },
        { id: '2', name: 'Bob', score: 3 },
      ];

      const element = createLiveScoreboard(scores, { compact: true });
      const list = element.querySelector('[data-testid="score-list"]');

      expect(list.className).toContain('flex-wrap');
    });

    it('should use full layout when compact is false', () => {
      const scores = [
        { id: '1', name: 'Alice', score: 5 },
        { id: '2', name: 'Bob', score: 3 },
      ];

      const element = createLiveScoreboard(scores, { compact: false });
      const list = element.querySelector('[data-testid="score-list"]');

      expect(list.className).toContain('flex-col');
    });

    it('should render compact score items with medals for top 3', () => {
      const scores = [
        { id: '1', name: 'Alice', score: 10 },
        { id: '2', name: 'Bob', score: 7 },
        { id: '3', name: 'Charlie', score: 5 },
        { id: '4', name: 'Diana', score: 3 },
      ];

      const element = createLiveScoreboard(scores, { compact: true });
      const items = element.querySelectorAll('[data-testid="score-item-compact"]');

      expect(items[0].textContent).toContain('🥇');
      expect(items[1].textContent).toContain('🥈');
      expect(items[2].textContent).toContain('🥉');
      expect(items[3].textContent).not.toContain('🥇');
      expect(items[3].textContent).not.toContain('🥈');
      expect(items[3].textContent).not.toContain('🥉');
    });

    it('should highlight in compact mode when isYou is true', () => {
      const scores = [{ id: '1', name: 'Alice', score: 5, isYou: true }];

      const element = createLiveScoreboard(scores, { compact: true });
      const item = element.querySelector('[data-testid="score-item-compact"]');

      expect(item.className).toContain('bg-primary/20');
    });
  });

  describe('score display', () => {
    it('should display participant score correctly', () => {
      const scores = [{ id: '1', name: 'Alice', score: 42 }];

      const element = createLiveScoreboard(scores);
      const scoreEl = element.querySelector('[data-testid="participant-score"]');

      expect(scoreEl.textContent).toBe('42');
    });

    it('should display zero score', () => {
      const scores = [{ id: '1', name: 'Alice', score: 0 }];

      const element = createLiveScoreboard(scores);
      const scoreEl = element.querySelector('[data-testid="participant-score"]');

      expect(scoreEl.textContent).toBe('0');
    });

    it('should display participant name', () => {
      const scores = [{ id: '1', name: 'Alice', score: 5 }];

      const element = createLiveScoreboard(scores);

      expect(element.textContent).toContain('Alice');
    });
  });

  describe('participant id tracking', () => {
    it('should set data-participant-id attribute on items', () => {
      const scores = [
        { id: 'user-123', name: 'Alice', score: 5 },
        { id: 'user-456', name: 'Bob', score: 3 },
      ];

      const element = createLiveScoreboard(scores);
      const items = element.querySelectorAll('[data-testid="score-item"]');

      expect(items[0].getAttribute('data-participant-id')).toBe('user-123');
      expect(items[1].getAttribute('data-participant-id')).toBe('user-456');
    });
  });
});
