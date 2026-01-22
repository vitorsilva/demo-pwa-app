import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateShareImage, getShareImageDimensions } from './share-image.js';

// Mock canvas context
const createMockContext = () => ({
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  fillStyle: '',
  font: '',
  textAlign: '',
  textBaseline: '',
});

describe('Share Image Generator', () => {
  let originalCreateElement;
  let mockCanvas;
  let mockContext;
  let mockBlob;

  beforeEach(() => {
    originalCreateElement = document.createElement;
    mockContext = createMockContext();
    mockBlob = new Blob(['test'], { type: 'image/png' });

    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext),
      toBlob: vi.fn((callback) => callback(mockBlob)),
    };

    document.createElement = vi.fn((tag) => {
      if (tag === 'canvas') {
        return mockCanvas;
      }
      return originalCreateElement.call(document, tag);
    });
  });

  afterEach(() => {
    document.createElement = originalCreateElement;
    vi.restoreAllMocks();
  });

  describe('generateShareImage', () => {
    it('should create canvas with correct dimensions', async () => {
      await generateShareImage({
        topic: 'History',
        score: 4,
        total: 5,
        percentage: 80,
      });

      expect(mockCanvas.width).toBe(600);
      expect(mockCanvas.height).toBe(400);
    });

    it('should get 2D context from canvas', async () => {
      await generateShareImage({
        topic: 'History',
        score: 4,
        total: 5,
        percentage: 80,
      });

      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });

    it('should create background gradient', async () => {
      await generateShareImage({
        topic: 'History',
        score: 4,
        total: 5,
        percentage: 80,
      });

      expect(mockContext.createLinearGradient).toHaveBeenCalledWith(0, 0, 600, 400);
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 600, 400);
    });

    it('should draw topic text', async () => {
      await generateShareImage({
        topic: 'History',
        score: 4,
        total: 5,
        percentage: 80,
      });

      expect(mockContext.fillText).toHaveBeenCalledWith(
        'History Quiz Master!',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should draw score', async () => {
      await generateShareImage({
        topic: 'History',
        score: 4,
        total: 5,
        percentage: 80,
      });

      expect(mockContext.fillText).toHaveBeenCalledWith(
        '4/5',
        expect.any(Number),
        expect.any(Number)
      );
      expect(mockContext.fillText).toHaveBeenCalledWith(
        '80%',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should draw challenge text', async () => {
      await generateShareImage({
        topic: 'History',
        score: 4,
        total: 5,
        percentage: 80,
      });

      expect(mockContext.fillText).toHaveBeenCalledWith(
        'Can you beat my score?',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should draw SABERLOOP badge', async () => {
      await generateShareImage({
        topic: 'History',
        score: 4,
        total: 5,
        percentage: 80,
      });

      expect(mockContext.fillText).toHaveBeenCalledWith(
        'SABERLOOP',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should truncate long topic names', async () => {
      await generateShareImage({
        topic: 'This is a very long topic name that should be truncated',
        score: 4,
        total: 5,
        percentage: 80,
      });

      // Should call fillText with truncated topic
      const fillTextCalls = mockContext.fillText.mock.calls;
      const topicCall = fillTextCalls.find(
        (call) => call[0].includes('Quiz Master') && call[0].includes('...')
      );
      expect(topicCall).toBeDefined();
    });

    it('should return PNG blob', async () => {
      const result = await generateShareImage({
        topic: 'History',
        score: 4,
        total: 5,
        percentage: 80,
      });

      expect(result).toBe(mockBlob);
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
    });

    it('should throw error when canvas context not available', async () => {
      mockCanvas.getContext = vi.fn(() => null);

      await expect(
        generateShareImage({
          topic: 'History',
          score: 4,
          total: 5,
          percentage: 80,
        })
      ).rejects.toThrow('Canvas not supported');
    });

    it('should reject when toBlob returns null', async () => {
      mockCanvas.toBlob = vi.fn((callback) => callback(null));

      await expect(
        generateShareImage({
          topic: 'History',
          score: 4,
          total: 5,
          percentage: 80,
        })
      ).rejects.toThrow('Failed to create image blob');
    });
  });

  describe('getShareImageDimensions', () => {
    it('should return correct dimensions', () => {
      const dimensions = getShareImageDimensions();

      expect(dimensions).toEqual({
        width: 600,
        height: 400,
      });
    });

    it('should return width of 600', () => {
      const dimensions = getShareImageDimensions();
      expect(dimensions.width).toBe(600);
    });

    it('should return height of 400', () => {
      const dimensions = getShareImageDimensions();
      expect(dimensions.height).toBe(400);
    });
  });

  describe('drawing functions coverage', () => {
    it('should draw rounded rect for badge', async () => {
      await generateShareImage({
        topic: 'Math',
        score: 3,
        total: 5,
        percentage: 60,
      });

      // Verify rounded rect drawing sequence
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.moveTo).toHaveBeenCalled();
      expect(mockContext.lineTo).toHaveBeenCalled();
      expect(mockContext.quadraticCurveTo).toHaveBeenCalled();
      expect(mockContext.closePath).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it('should draw trophy emoji', async () => {
      await generateShareImage({
        topic: 'Science',
        score: 5,
        total: 5,
        percentage: 100,
      });

      // Trophy emoji should be drawn
      const fillTextCalls = mockContext.fillText.mock.calls;
      const trophyCall = fillTextCalls.find((call) => call[0] === '\u{1F3C6}');
      expect(trophyCall).toBeDefined();
    });

    it('should not truncate short topic names', async () => {
      await generateShareImage({
        topic: 'Math',
        score: 4,
        total: 5,
        percentage: 80,
      });

      // Should call fillText with full topic (no ellipsis)
      const fillTextCalls = mockContext.fillText.mock.calls;
      const topicCall = fillTextCalls.find((call) => call[0] === 'Math Quiz Master!');
      expect(topicCall).toBeDefined();
    });

    it('should truncate topic at exactly 25 characters', async () => {
      // Topic that is exactly at the boundary
      const topic = '1234567890123456789012345'; // 25 chars
      await generateShareImage({
        topic,
        score: 3,
        total: 5,
        percentage: 60,
      });

      // Should not truncate (exact 25 chars)
      const fillTextCalls = mockContext.fillText.mock.calls;
      const topicCall = fillTextCalls.find(
        (call) => call[0].includes(topic) && !call[0].includes('...')
      );
      expect(topicCall).toBeDefined();
    });

    it('should truncate topic over 25 characters with ellipsis', async () => {
      // Topic that is over the boundary
      const topic = '12345678901234567890123456'; // 26 chars
      await generateShareImage({
        topic,
        score: 3,
        total: 5,
        percentage: 60,
      });

      // Should truncate with ellipsis (22 chars + ...)
      const fillTextCalls = mockContext.fillText.mock.calls;
      const topicCall = fillTextCalls.find(
        (call) => call[0].includes('...') && call[0].includes('Quiz Master')
      );
      expect(topicCall).toBeDefined();
      // Verify the truncated portion is correct length (22 + 3 = 25)
      const truncatedText = '1234567890123456789012...';
      expect(topicCall[0]).toContain(truncatedText);
    });

    it('should set canvas width before drawing', async () => {
      await generateShareImage({
        topic: 'Test',
        score: 1,
        total: 2,
        percentage: 50,
      });

      // Canvas dimensions should be set
      expect(mockCanvas.width).toBe(600);
    });

    it('should set canvas height before drawing', async () => {
      await generateShareImage({
        topic: 'Test',
        score: 1,
        total: 2,
        percentage: 50,
      });

      // Canvas dimensions should be set
      expect(mockCanvas.height).toBe(400);
    });

    it('should draw gradient with correct color stops', async () => {
      const mockGradient = {
        addColorStop: vi.fn(),
      };
      mockContext.createLinearGradient = vi.fn(() => mockGradient);

      await generateShareImage({
        topic: 'Colors',
        score: 2,
        total: 3,
        percentage: 67,
      });

      // Should add two color stops for gradient
      expect(mockGradient.addColorStop).toHaveBeenCalledWith(0, '#1a1a2e');
      expect(mockGradient.addColorStop).toHaveBeenCalledWith(1, '#16213e');
    });

    it('should draw score with correct format', async () => {
      await generateShareImage({
        topic: 'Format',
        score: 7,
        total: 10,
        percentage: 70,
      });

      expect(mockContext.fillText).toHaveBeenCalledWith(
        '7/10',
        expect.any(Number),
        expect.any(Number)
      );
      expect(mockContext.fillText).toHaveBeenCalledWith(
        '70%',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should draw all elements at specific Y positions', async () => {
      await generateShareImage({
        topic: 'Position',
        score: 5,
        total: 5,
        percentage: 100,
      });

      const fillTextCalls = mockContext.fillText.mock.calls;

      // Badge at y=30 + badgeHeight/2 = 30 + 18 = 48
      const badgeCall = fillTextCalls.find((call) => call[0] === 'SABERLOOP');
      expect(badgeCall[2]).toBe(48);

      // Trophy at y=110
      const trophyCall = fillTextCalls.find((call) => call[0] === '\u{1F3C6}');
      expect(trophyCall[2]).toBe(110);

      // Topic at y=170
      const topicCall = fillTextCalls.find((call) => call[0].includes('Quiz Master'));
      expect(topicCall[2]).toBe(170);

      // Score at y=260
      const scoreCall = fillTextCalls.find((call) => call[0] === '5/5');
      expect(scoreCall[2]).toBe(260);

      // Percentage at y=260+45=305
      const percentCall = fillTextCalls.find((call) => call[0] === '100%');
      expect(percentCall[2]).toBe(305);

      // Challenge at y=350
      const challengeCall = fillTextCalls.find((call) => call[0] === 'Can you beat my score?');
      expect(challengeCall[2]).toBe(350);
    });

    it('should draw elements at centerX=300', async () => {
      await generateShareImage({
        topic: 'Center',
        score: 2,
        total: 4,
        percentage: 50,
      });

      const fillTextCalls = mockContext.fillText.mock.calls;

      // All text should be centered at x=300 (600/2)
      fillTextCalls.forEach((call) => {
        expect(call[1]).toBe(300);
      });
    });

    it('should set correct font for score', async () => {
      // Track font assignments
      const fontAssignments = [];
      const originalFont = Object.getOwnPropertyDescriptor(mockContext, 'font');
      Object.defineProperty(mockContext, 'font', {
        set: (val) => fontAssignments.push(val),
        get: () => fontAssignments[fontAssignments.length - 1] || '',
      });

      await generateShareImage({
        topic: 'Font',
        score: 3,
        total: 5,
        percentage: 60,
      });

      // Score should use bold 64px font
      expect(fontAssignments).toContain('bold 64px system-ui, -apple-system, sans-serif');
    });

    it('should set correct fillStyle for accent color', async () => {
      const fillStyleAssignments = [];
      Object.defineProperty(mockContext, 'fillStyle', {
        set: (val) => fillStyleAssignments.push(val),
        get: () => fillStyleAssignments[fillStyleAssignments.length - 1] || '',
      });

      await generateShareImage({
        topic: 'Style',
        score: 4,
        total: 5,
        percentage: 80,
      });

      // Should use accent color for score
      expect(fillStyleAssignments).toContain('#e94560');
      // Should use secondary color
      expect(fillStyleAssignments).toContain('#a0a0a0');
      // Should use primary color
      expect(fillStyleAssignments).toContain('#ffffff');
      // Should use badge color
      expect(fillStyleAssignments).toContain('#0f3460');
    });
  });
});
