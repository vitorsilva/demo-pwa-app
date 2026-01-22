/**
 * Live Scoreboard Component
 *
 * Real-time score display during party quiz.
 * Shows participant rankings with live updates.
 */

import { t } from '../core/i18n.js';

/**
 * Gets CSS classes for rank badge background.
 * @param {number} rank - 0-based rank
 * @returns {string} Tailwind classes
 */
function getRankBadgeClasses(rank) {
  if (rank === 0) return 'bg-yellow-500 text-white';
  if (rank === 1) return 'bg-gray-400 text-white';
  if (rank === 2) return 'bg-amber-700 text-white';
  return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
}

/**
 * Gets medal emoji for top 3 ranks.
 * @param {number} rank - 0-based rank
 * @returns {string} Medal emoji
 */
function getMedalEmoji(rank) {
  if (rank === 0) return '🥇';
  if (rank === 1) return '🥈';
  return '🥉';
}

/**
 * @typedef {Object} ScoreEntry
 * @property {string} id - Participant ID
 * @property {string} name - Participant name
 * @property {number} score - Current score
 * @property {boolean} [isHost] - Whether this is the host
 * @property {boolean} [isYou] - Whether this is the current user
 * @property {'connected'|'answered'|'thinking'|'disconnected'} [status] - Current status
 */

/**
 * Creates a live scoreboard element.
 *
 * @param {ScoreEntry[]} scores - Sorted scores array
 * @param {Object} [options] - Display options
 * @param {boolean} [options.compact=false] - Use compact display
 * @param {boolean} [options.showStatus=true] - Show answer status
 * @param {string} [options.highlightId] - ID to highlight
 * @returns {HTMLElement}
 */
export function createLiveScoreboard(scores, options = {}) {
  const { compact = false, showStatus = true, highlightId } = options;

  const container = document.createElement('div');
  container.className = 'live-scoreboard';
  container.setAttribute('data-testid', 'live-scoreboard');

  // Header
  const header = document.createElement('h3');
  header.className = 'text-subtext-light dark:text-subtext-dark text-sm font-medium mb-2';
  header.textContent = t('party.liveScores');
  container.appendChild(header);

  // Score list
  const list = document.createElement('div');
  list.className = compact ? 'flex flex-wrap gap-2' : 'flex flex-col gap-1';
  list.setAttribute('data-testid', 'score-list');

  // Sort by score (highest first)
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  sortedScores.forEach((entry, index) => {
    const item = compact
      ? createCompactScoreItem(entry, index, { showStatus, highlightId })
      : createScoreItem(entry, index, { showStatus, highlightId });
    list.appendChild(item);
  });

  container.appendChild(list);

  return container;
}

/**
 * Creates a full score item.
 *
 * @param {ScoreEntry} entry - Score entry
 * @param {number} rank - Rank (0-based)
 * @param {Object} options - Display options
 * @returns {HTMLElement}
 */
function createScoreItem(entry, rank, options) {
  const { showStatus, highlightId } = options;
  const isHighlighted = entry.id === highlightId || entry.isYou;

  const item = document.createElement('div');
  item.className = `
    flex items-center gap-2 py-2 px-3 rounded-lg
    ${isHighlighted ? 'bg-primary/10 border border-primary/30' : 'bg-card-light dark:bg-card-dark'}
    transition-all duration-300
  `.trim();
  item.setAttribute('data-testid', 'score-item');
  item.setAttribute('data-participant-id', entry.id);

  // Rank
  const rankEl = document.createElement('span');
  rankEl.className = `
    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
    ${getRankBadgeClasses(rank)}
  `.trim();
  rankEl.textContent = String(rank + 1);
  item.appendChild(rankEl);

  // Status indicator
  if (showStatus && entry.status) {
    const statusDot = document.createElement('span');
    statusDot.className = `w-2 h-2 rounded-full ${getStatusColor(entry.status)}`;
    statusDot.setAttribute('data-testid', 'status-indicator');
    item.appendChild(statusDot);
  }

  // Name
  const nameContainer = document.createElement('div');
  nameContainer.className = 'flex-1 min-w-0';

  const name = document.createElement('span');
  name.className = `text-sm ${isHighlighted ? 'font-bold text-primary' : 'text-text-light dark:text-text-dark'}`;
  name.textContent = entry.name;
  nameContainer.appendChild(name);

  if (entry.isYou) {
    const youBadge = document.createElement('span');
    youBadge.className = 'ml-1 text-xs text-subtext-light dark:text-subtext-dark';
    youBadge.textContent = `(${t('party.you')})`;
    nameContainer.appendChild(youBadge);
  }

  item.appendChild(nameContainer);

  // Score
  const score = document.createElement('span');
  score.className = `text-lg font-bold ${isHighlighted ? 'text-primary' : 'text-text-light dark:text-text-dark'}`;
  score.textContent = String(entry.score);
  score.setAttribute('data-testid', 'participant-score');
  item.appendChild(score);

  return item;
}

/**
 * Creates a compact score item (for inline display).
 *
 * @param {ScoreEntry} entry - Score entry
 * @param {number} rank - Rank (0-based)
 * @param {Object} options - Display options
 * @returns {HTMLElement}
 */
function createCompactScoreItem(entry, rank, options) {
  const { highlightId } = options;
  const isHighlighted = entry.id === highlightId || entry.isYou;

  const item = document.createElement('div');
  item.className = `
    flex items-center gap-1 px-2 py-1 rounded-full text-xs
    ${isHighlighted ? 'bg-primary/20 text-primary' : 'bg-gray-200 dark:bg-gray-700 text-text-light dark:text-text-dark'}
  `.trim();
  item.setAttribute('data-testid', 'score-item-compact');

  // Medal for top 3
  if (rank < 3) {
    const medal = document.createElement('span');
    medal.textContent = getMedalEmoji(rank);
    item.appendChild(medal);
  }

  // Name (truncated)
  const name = document.createElement('span');
  name.className = 'font-medium truncate max-w-[60px]';
  name.textContent = entry.name;
  item.appendChild(name);

  // Score
  const score = document.createElement('span');
  score.className = 'font-bold';
  score.textContent = String(entry.score);
  item.appendChild(score);

  return item;
}

/**
 * Gets CSS class for status color.
 *
 * @param {string} status - Status string
 * @returns {string} Tailwind color class
 */
function getStatusColor(status) {
  switch (status) {
    case 'answered':
      return 'bg-green-500';
    case 'thinking':
      return 'bg-yellow-500 animate-pulse';
    case 'disconnected':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}
