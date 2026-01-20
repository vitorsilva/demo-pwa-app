/**
 * Participant List Component
 *
 * Displays party participants with their status.
 */

import { t } from '../core/i18n.js';

/**
 * @typedef {Object} Participant
 * @property {string} id - Participant ID
 * @property {string} name - Display name
 * @property {boolean} [isHost] - Whether this participant is the host
 * @property {boolean} [isYou] - Whether this is the current user
 * @property {'connected' | 'connecting' | 'disconnected' | 'answered' | 'thinking'} [status] - Status
 * @property {number} [score] - Current score
 */

/**
 * Creates a single participant item element.
 * @param {Participant} participant - Participant data
 * @param {Object} [options] - Display options
 * @param {boolean} [options.showStatus=false] - Show status indicator
 * @param {boolean} [options.showScore=false] - Show score
 * @returns {HTMLElement}
 */
export function createParticipantItem(participant, options = {}) {
  const { showStatus = false, showScore = false } = options;

  const item = document.createElement('li');
  item.className =
    'flex items-center gap-2 py-2 px-3 rounded-lg bg-card-light dark:bg-card-dark';
  item.setAttribute('data-testid', 'participant-item');
  item.setAttribute('data-participant-id', participant.id);

  // Status indicator (if enabled)
  if (showStatus && participant.status) {
    const statusContainer = document.createElement('div');
    statusContainer.className = 'flex items-center gap-1';
    statusContainer.setAttribute('data-testid', 'status-indicator');

    const statusDot = document.createElement('span');
    statusDot.className = `w-2 h-2 rounded-full ${getStatusColor(participant.status)}`;
    statusContainer.appendChild(statusDot);

    // Add status text for answered/thinking
    if (participant.status === 'answered' || participant.status === 'thinking') {
      const statusText = document.createElement('span');
      statusText.className = 'text-xs text-subtext-light dark:text-subtext-dark';
      statusText.textContent = t(`party.${participant.status}`);
      statusContainer.appendChild(statusText);
    }

    item.appendChild(statusContainer);
  }

  // Avatar placeholder
  const avatar = document.createElement('span');
  avatar.className =
    'w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold';
  avatar.textContent = participant.name.charAt(0).toUpperCase();
  item.appendChild(avatar);

  // Name
  const name = document.createElement('span');
  name.className = 'text-text-light dark:text-text-dark text-sm flex-1';

  if (participant.isYou) {
    name.innerHTML = `${participant.name} <span class="text-subtext-light dark:text-subtext-dark">(${t('party.you')})</span>`;
  } else {
    name.textContent = participant.name;
  }
  item.appendChild(name);

  // Host badge
  if (participant.isHost) {
    const badge = document.createElement('span');
    badge.className =
      'text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium';
    badge.textContent = t('party.host');
    badge.setAttribute('data-testid', 'host-badge');
    item.appendChild(badge);
  }

  // Score (if enabled and present)
  if (showScore && participant.score !== undefined) {
    const scoreEl = document.createElement('span');
    scoreEl.className = 'text-sm font-bold text-primary';
    scoreEl.textContent = String(participant.score);
    scoreEl.setAttribute('data-testid', 'participant-score');
    item.appendChild(scoreEl);
  }

  return item;
}

/**
 * Creates a participant list element.
 * @param {Participant[]} participants - List of participants
 * @param {Object} [options] - Display options
 * @param {boolean} [options.showStatus=false] - Show connection status indicators
 * @param {boolean} [options.showScore=false] - Show participant scores
 * @param {string} [options.currentUserId] - ID of the current user (to mark as "You")
 * @returns {HTMLElement}
 */
export function createParticipantList(participants, options = {}) {
  const { showStatus = false, showScore = false, currentUserId } = options;

  const container = document.createElement('div');
  container.className = 'participant-list flex flex-col gap-2';

  // Header
  const header = document.createElement('h4');
  header.className =
    'text-subtext-light dark:text-subtext-dark text-sm font-medium';
  header.textContent = `${t('party.participants')} (${participants.length})`;
  container.appendChild(header);

  // Sort participants: hosts first
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;
    return 0;
  });

  // List
  const list = document.createElement('ul');
  list.className = 'flex flex-col gap-1';
  list.setAttribute('data-testid', 'participant-list');

  sortedParticipants.forEach((participant) => {
    // Mark as "You" if matching currentUserId
    const participantWithYou = {
      ...participant,
      isYou: participant.isYou || participant.id === currentUserId,
    };

    const item = createParticipantItem(participantWithYou, {
      showStatus,
      showScore,
    });
    list.appendChild(item);
  });

  container.appendChild(list);

  return container;
}

/**
 * Gets the Tailwind color class for a status.
 * @param {'connected' | 'connecting' | 'disconnected' | 'answered' | 'thinking'} status
 * @returns {string}
 */
function getStatusColor(status) {
  switch (status) {
    case 'connected':
      return 'bg-green-500';
    case 'connecting':
      return 'bg-yellow-500';
    case 'disconnected':
      return 'bg-red-500';
    case 'answered':
      return 'bg-green-500';
    case 'thinking':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}

