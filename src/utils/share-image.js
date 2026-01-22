/**
 * Share Image Generator for Saberloop
 * Creates shareable achievement cards using Canvas API
 */

import { logger } from './logger.js';

/**
 * Rectangle dimensions for canvas drawing.
 * @typedef {Object} Rect
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} width - Width
 * @property {number} height - Height
 * @property {number} radius - Corner radius
 */

/**
 * Score display data.
 * @typedef {Object} ScoreData
 * @property {number} score - Points scored
 * @property {number} total - Total possible points
 * @property {number} percentage - Score as percentage
 */

/** @type {number} Canvas width for share images */
const CANVAS_WIDTH = 600;

/** @type {number} Canvas height for share images */
const CANVAS_HEIGHT = 400;

/**
 * Brand colors for the share image
 * @type {Object}
 */
const COLORS = {
  gradientStart: '#1a1a2e',
  gradientEnd: '#16213e',
  accent: '#e94560',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  badge: '#0f3460',
};

/**
 * Draw rounded rectangle on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Rect} rect - Rectangle dimensions
 */
function drawRoundedRect(ctx, rect) {
  const { x, y, width, height, radius } = rect;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draw the background gradient
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
function drawBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, COLORS.gradientStart);
  gradient.addColorStop(1, COLORS.gradientEnd);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw the Saberloop logo badge
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} centerX - Center X position
 * @param {number} y - Y position
 */
function drawLogoBadge(ctx, centerX, y) {
  const badgeWidth = 180;
  const badgeHeight = 36;
  const x = centerX - badgeWidth / 2;

  // Badge background
  ctx.fillStyle = COLORS.badge;
  const badgeRect = { x, y, width: badgeWidth, height: badgeHeight, radius: 18 };
  drawRoundedRect(ctx, badgeRect);
  ctx.fill();

  // Badge text
  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SABERLOOP', centerX, y + badgeHeight / 2);
}

/**
 * Draw the trophy icon (emoji-style)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} centerX - Center X position
 * @param {number} y - Y position
 */
function drawTrophy(ctx, centerX, y) {
  ctx.font = '48px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u{1F3C6}', centerX, y);
}

/**
 * Draw the topic title
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} topic - Quiz topic
 * @param {number} centerX - Center X position
 * @param {number} y - Y position
 */
function drawTopic(ctx, topic, centerX, y) {
  // Truncate topic if too long
  const maxLength = 25;
  const displayTopic = topic.length > maxLength ? topic.substring(0, maxLength - 3) + '...' : topic;

  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${displayTopic} Quiz Master!`, centerX, y);
}

/**
 * Draw the score display
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {ScoreData} scoreData - Score information
 * @param {number} centerX - Center X position
 * @param {number} y - Y position
 */
function drawScore(ctx, scoreData, centerX, y) {
  const { score, total, percentage } = scoreData;
  // Main score
  ctx.fillStyle = COLORS.accent;
  ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${score}/${total}`, centerX, y);

  // Percentage below
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '24px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${percentage}%`, centerX, y + 45);
}

/**
 * Draw the challenge text
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} centerX - Center X position
 * @param {number} y - Y position
 */
function drawChallenge(ctx, centerX, y) {
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '20px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Can you beat my score?', centerX, y);
}

/**
 * Generate a shareable image for quiz results
 * @param {Object} options - Image options
 * @param {string} options.topic - Quiz topic
 * @param {number} options.score - Number of correct answers
 * @param {number} options.total - Total number of questions
 * @param {number} options.percentage - Score percentage
 * @returns {Promise<Blob>} PNG image blob
 */
export async function generateShareImage({ topic, score, total, percentage }) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    logger.error('Failed to get canvas 2D context');
    throw new Error('Canvas not supported');
  }

  const centerX = CANVAS_WIDTH / 2;

  // Draw all elements
  drawBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawLogoBadge(ctx, centerX, 30);
  drawTrophy(ctx, centerX, 110);
  drawTopic(ctx, topic, centerX, 170);
  const scoreData = { score, total, percentage };
  drawScore(ctx, scoreData, centerX, 260);
  drawChallenge(ctx, centerX, 350);

  logger.debug('Share image generated', { topic, score, total });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create image blob'));
      }
    }, 'image/png');
  });
}

/**
 * Get the dimensions used for share images
 * @returns {{width: number, height: number}} Image dimensions
 */
export function getShareImageDimensions() {
  return {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  };
}
