import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  canShare,
  canShareFiles,
  shareContent,
  shareWithImage,
  copyToClipboard,
  generateShareUrl,
  generateShareText,
  shareToTwitter,
  shareToFacebook,
} from './share.js';

// Mock telemetry
vi.mock('./telemetry.js', () => ({
  telemetry: {
    trackEvent: vi.fn(),
    track: vi.fn(),
  },
}));

describe('Share Utilities', () => {
  let originalNavigator;
  let originalWindow;

  beforeEach(() => {
    originalNavigator = global.navigator;
    originalWindow = global.window;
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    global.window = originalWindow;
    vi.restoreAllMocks();
  });

  describe('canShare', () => {
    it('should return true when Web Share API is available', () => {
      global.navigator = { share: vi.fn() };
      expect(canShare()).toBe(true);
    });

    it('should return false when navigator is undefined', () => {
      global.navigator = undefined;
      expect(canShare()).toBe(false);
    });

    it('should return false when share is not a function', () => {
      global.navigator = { share: 'not a function' };
      expect(canShare()).toBe(false);
    });
  });

  describe('canShareFiles', () => {
    it('should return true when canShare is available', () => {
      global.navigator = { share: vi.fn(), canShare: vi.fn() };
      expect(canShareFiles()).toBe(true);
    });

    it('should return false when canShare is not available', () => {
      global.navigator = { share: vi.fn() };
      expect(canShareFiles()).toBe(false);
    });
  });

  describe('shareContent', () => {
    it('should call navigator.share with correct options', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      global.navigator = { share: mockShare };

      const result = await shareContent({
        title: 'Test Title',
        text: 'Test text',
        url: 'https://example.com',
      });

      expect(mockShare).toHaveBeenCalledWith({
        title: 'Test Title',
        text: 'Test text',
        url: 'https://example.com',
      });
      expect(result).toBe(true);
    });

    it('should return false when Web Share API is not available', async () => {
      global.navigator = {};
      const result = await shareContent({ title: 'Test', text: 'Test' });
      expect(result).toBe(false);
    });

    it('should return false when user cancels share', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      global.navigator = { share: vi.fn().mockRejectedValue(abortError) };

      const result = await shareContent({ title: 'Test', text: 'Test' });
      expect(result).toBe(false);
    });

    it('should return false when share fails', async () => {
      global.navigator = { share: vi.fn().mockRejectedValue(new Error('Share failed')) };

      const result = await shareContent({ title: 'Test', text: 'Test' });
      expect(result).toBe(false);
    });
  });

  describe('shareWithImage', () => {
    it('should share with image when supported', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      const mockCanShare = vi.fn().mockReturnValue(true);
      global.navigator = { share: mockShare, canShare: mockCanShare };

      const imageBlob = new Blob(['test'], { type: 'image/png' });
      const result = await shareWithImage({
        title: 'Test',
        text: 'Test text',
        url: 'https://example.com',
        imageBlob,
      });

      expect(mockCanShare).toHaveBeenCalled();
      expect(mockShare).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should fall back to text share when file sharing not supported', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      global.navigator = { share: mockShare };

      const imageBlob = new Blob(['test'], { type: 'image/png' });
      const result = await shareWithImage({
        title: 'Test',
        text: 'Test text',
        url: 'https://example.com',
        imageBlob,
      });

      expect(mockShare).toHaveBeenCalledWith({
        title: 'Test',
        text: 'Test text',
        url: 'https://example.com',
      });
      expect(result).toBe(true);
    });

    it('should fall back when canShare returns false for files', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      const mockCanShare = vi.fn().mockReturnValue(false);
      global.navigator = { share: mockShare, canShare: mockCanShare };

      const imageBlob = new Blob(['test'], { type: 'image/png' });
      const result = await shareWithImage({
        title: 'Test',
        text: 'Test text',
        url: 'https://example.com',
        imageBlob,
      });

      // Should call share with text only (fallback)
      expect(result).toBe(true);
    });
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      global.navigator = { clipboard: { writeText: mockWriteText } };

      const result = await copyToClipboard('Test text');

      expect(mockWriteText).toHaveBeenCalledWith('Test text');
      expect(result).toBe(true);
    });

    it('should return false when clipboard API is not available', async () => {
      global.navigator = {};
      const result = await copyToClipboard('Test text');
      expect(result).toBe(false);
    });

    it('should return false when copy fails', async () => {
      global.navigator = {
        clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Copy failed')) },
      };

      const result = await copyToClipboard('Test text');
      expect(result).toBe(false);
    });
  });

  describe('generateShareUrl', () => {
    it('should generate correct share URL', () => {
      const url = generateShareUrl('World History');
      expect(url).toBe('https://saberloop.com/app/?topic=World%20History');
    });

    it('should encode special characters', () => {
      const url = generateShareUrl('Math & Science');
      expect(url).toBe('https://saberloop.com/app/?topic=Math%20%26%20Science');
    });
  });

  describe('generateShareText', () => {
    it('should generate correct share text', () => {
      const text = generateShareText({
        topic: 'History',
        score: 4,
        total: 5,
        percentage: 80,
      });

      expect(text).toContain('History Quiz Master');
      expect(text).toContain('4/5');
      expect(text).toContain('80%');
      expect(text).toContain('Can you beat my score?');
    });
  });

  describe('shareToTwitter', () => {
    it('should open Twitter intent URL', () => {
      const mockOpen = vi.fn();
      global.window = { open: mockOpen };

      shareToTwitter('Test tweet', 'https://example.com');

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        'width=550,height=420'
      );
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('text=Test%20tweet'),
        '_blank',
        'width=550,height=420'
      );
    });
  });

  describe('shareToFacebook', () => {
    it('should open Facebook share URL', () => {
      const mockOpen = vi.fn();
      global.window = { open: mockOpen };

      shareToFacebook('https://example.com');

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer'),
        '_blank',
        'width=550,height=420'
      );
    });

    it('should include quote when provided', () => {
      const mockOpen = vi.fn();
      global.window = { open: mockOpen };

      shareToFacebook('https://example.com', 'Check this out!');

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('quote=Check%20this%20out'),
        '_blank',
        'width=550,height=420'
      );
    });

    it('should not include quote when not provided', () => {
      const mockOpen = vi.fn();
      global.window = { open: mockOpen };

      shareToFacebook('https://example.com');

      const call = mockOpen.mock.calls[0][0];
      expect(call).not.toContain('quote=');
    });

    it('should encode URL correctly', () => {
      const mockOpen = vi.fn();
      global.window = { open: mockOpen };

      shareToFacebook('https://example.com/path?param=value');

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('u=https%3A%2F%2Fexample.com'),
        '_blank',
        'width=550,height=420'
      );
    });
  });

  describe('additional edge cases', () => {
    describe('canShare additional', () => {
      it('should return false when navigator.share is null', () => {
        global.navigator = { share: null };
        expect(canShare()).toBe(false);
      });

      it('should check that share is specifically a function', () => {
        global.navigator = { share: {} };
        expect(canShare()).toBe(false);
      });
    });

    describe('canShareFiles additional', () => {
      it('should return false when canShare is not a function', () => {
        global.navigator = { share: vi.fn(), canShare: 'not a function' };
        expect(canShareFiles()).toBe(false);
      });

      it('should return false when canShare is null', () => {
        global.navigator = { share: vi.fn(), canShare: null };
        expect(canShareFiles()).toBe(false);
      });

      it('should check that canShare is specifically a function type', () => {
        global.navigator = { share: vi.fn(), canShare: {} };
        expect(canShareFiles()).toBe(false);
      });
    });

    describe('shareContent telemetry', () => {
      it('should track share_completed on success', async () => {
        const { telemetry } = await import('./telemetry.js');
        const mockShare = vi.fn().mockResolvedValue(undefined);
        global.navigator = { share: mockShare };

        await shareContent({ title: 'Test', text: 'Test' });

        expect(telemetry.track).toHaveBeenCalledWith('share_completed', { method: 'native' });
      });

      it('should track share_cancelled when user aborts', async () => {
        const { telemetry } = await import('./telemetry.js');
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        global.navigator = { share: vi.fn().mockRejectedValue(abortError) };

        await shareContent({ title: 'Test', text: 'Test' });

        expect(telemetry.track).toHaveBeenCalledWith('share_cancelled', { method: 'native' });
      });

      it('should track share_failed when share fails with error', async () => {
        const { telemetry } = await import('./telemetry.js');
        const error = new Error('Network error');
        global.navigator = { share: vi.fn().mockRejectedValue(error) };

        await shareContent({ title: 'Test', text: 'Test' });

        expect(telemetry.track).toHaveBeenCalledWith('share_failed', {
          method: 'native',
          error: 'Network error',
        });
      });
    });

    describe('shareWithImage additional', () => {
      it('should use default filename when not provided', async () => {
        const mockShare = vi.fn().mockResolvedValue(undefined);
        const mockCanShare = vi.fn().mockReturnValue(true);
        global.navigator = { share: mockShare, canShare: mockCanShare };

        const imageBlob = new Blob(['test'], { type: 'image/png' });
        await shareWithImage({
          title: 'Test',
          text: 'Test text',
          url: 'https://example.com',
          imageBlob,
        });

        const shareCall = mockShare.mock.calls[0][0];
        expect(shareCall.files[0].name).toBe('saberloop-score.png');
      });

      it('should use custom filename when provided', async () => {
        const mockShare = vi.fn().mockResolvedValue(undefined);
        const mockCanShare = vi.fn().mockReturnValue(true);
        global.navigator = { share: mockShare, canShare: mockCanShare };

        const imageBlob = new Blob(['test'], { type: 'image/png' });
        await shareWithImage({
          title: 'Test',
          text: 'Test text',
          url: 'https://example.com',
          imageBlob,
          fileName: 'custom-image.png',
        });

        const shareCall = mockShare.mock.calls[0][0];
        expect(shareCall.files[0].name).toBe('custom-image.png');
      });

      it('should track share_completed with native_with_image method', async () => {
        const { telemetry } = await import('./telemetry.js');
        const mockShare = vi.fn().mockResolvedValue(undefined);
        const mockCanShare = vi.fn().mockReturnValue(true);
        global.navigator = { share: mockShare, canShare: mockCanShare };

        const imageBlob = new Blob(['test'], { type: 'image/png' });
        await shareWithImage({
          title: 'Test',
          text: 'Test text',
          url: 'https://example.com',
          imageBlob,
        });

        expect(telemetry.track).toHaveBeenCalledWith('share_completed', {
          method: 'native_with_image',
        });
      });

      it('should track share_cancelled with native_with_image method on abort', async () => {
        const { telemetry } = await import('./telemetry.js');
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        const mockCanShare = vi.fn().mockReturnValue(true);
        global.navigator = { share: vi.fn().mockRejectedValue(abortError), canShare: mockCanShare };

        const imageBlob = new Blob(['test'], { type: 'image/png' });
        await shareWithImage({
          title: 'Test',
          text: 'Test text',
          url: 'https://example.com',
          imageBlob,
        });

        expect(telemetry.track).toHaveBeenCalledWith('share_cancelled', {
          method: 'native_with_image',
        });
      });

      it('should track share_failed with native_with_image method on error', async () => {
        const { telemetry } = await import('./telemetry.js');
        const error = new Error('Share failed');
        const mockCanShare = vi.fn().mockReturnValue(true);
        global.navigator = { share: vi.fn().mockRejectedValue(error), canShare: mockCanShare };

        const imageBlob = new Blob(['test'], { type: 'image/png' });
        await shareWithImage({
          title: 'Test',
          text: 'Test text',
          url: 'https://example.com',
          imageBlob,
        });

        expect(telemetry.track).toHaveBeenCalledWith('share_failed', {
          method: 'native_with_image',
          error: 'Share failed',
        });
      });

      it('should return false on image share failure', async () => {
        const error = new Error('Share failed');
        const mockCanShare = vi.fn().mockReturnValue(true);
        global.navigator = { share: vi.fn().mockRejectedValue(error), canShare: mockCanShare };

        const imageBlob = new Blob(['test'], { type: 'image/png' });
        const result = await shareWithImage({
          title: 'Test',
          text: 'Test text',
          url: 'https://example.com',
          imageBlob,
        });

        expect(result).toBe(false);
      });
    });

    describe('copyToClipboard additional', () => {
      it('should return false when navigator is undefined', async () => {
        global.navigator = undefined;
        const result = await copyToClipboard('Test');
        expect(result).toBe(false);
      });

      it('should track share_completed on clipboard success', async () => {
        const { telemetry } = await import('./telemetry.js');
        global.navigator = { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } };

        await copyToClipboard('Test');

        expect(telemetry.track).toHaveBeenCalledWith('share_completed', { method: 'clipboard' });
      });

      it('should track share_failed on clipboard error', async () => {
        const { telemetry } = await import('./telemetry.js');
        global.navigator = {
          clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Permission denied')) },
        };

        await copyToClipboard('Test');

        expect(telemetry.track).toHaveBeenCalledWith('share_failed', {
          method: 'clipboard',
          error: 'Permission denied',
        });
      });
    });

    describe('generateShareUrl additional', () => {
      it('should use saberloop.com base URL', () => {
        const url = generateShareUrl('Test');
        expect(url.startsWith('https://saberloop.com/app/')).toBe(true);
      });

      it('should have topic query parameter', () => {
        const url = generateShareUrl('Test');
        expect(url).toContain('?topic=');
      });

      it('should encode unicode characters', () => {
        const url = generateShareUrl('日本語');
        expect(url).toContain('%');
      });
    });

    describe('generateShareText additional', () => {
      it('should include trophy emoji', () => {
        const text = generateShareText({
          topic: 'Test',
          score: 1,
          total: 2,
          percentage: 50,
        });
        expect(text).toContain('🏆');
      });

      it('should include Saberloop brand', () => {
        const text = generateShareText({
          topic: 'Test',
          score: 1,
          total: 2,
          percentage: 50,
        });
        expect(text).toContain('Saberloop');
      });

      it('should format score correctly', () => {
        const text = generateShareText({
          topic: 'Math',
          score: 10,
          total: 10,
          percentage: 100,
        });
        expect(text).toContain('10/10');
        expect(text).toContain('100%');
      });
    });

    describe('shareToTwitter additional', () => {
      it('should include URL in Twitter intent', () => {
        const mockOpen = vi.fn();
        global.window = { open: mockOpen };

        shareToTwitter('Test', 'https://example.com/path');

        expect(mockOpen).toHaveBeenCalledWith(
          expect.stringContaining('url=https%3A%2F%2Fexample.com'),
          '_blank',
          'width=550,height=420'
        );
      });

      it('should track share_completed for twitter', async () => {
        const { telemetry } = await import('./telemetry.js');
        const mockOpen = vi.fn();
        global.window = { open: mockOpen };

        shareToTwitter('Test', 'https://example.com');

        expect(telemetry.track).toHaveBeenCalledWith('share_completed', { method: 'twitter' });
      });

      it('should use correct window dimensions', () => {
        const mockOpen = vi.fn();
        global.window = { open: mockOpen };

        shareToTwitter('Test', 'https://example.com');

        expect(mockOpen).toHaveBeenCalledWith(expect.any(String), '_blank', 'width=550,height=420');
      });
    });

    describe('shareToFacebook additional', () => {
      it('should track share_completed for facebook', async () => {
        const { telemetry } = await import('./telemetry.js');
        const mockOpen = vi.fn();
        global.window = { open: mockOpen };

        shareToFacebook('https://example.com');

        expect(telemetry.track).toHaveBeenCalledWith('share_completed', { method: 'facebook' });
      });

      it('should use correct window dimensions', () => {
        const mockOpen = vi.fn();
        global.window = { open: mockOpen };

        shareToFacebook('https://example.com');

        expect(mockOpen).toHaveBeenCalledWith(expect.any(String), '_blank', 'width=550,height=420');
      });

      it('should construct URL with correct base', () => {
        const mockOpen = vi.fn();
        global.window = { open: mockOpen };

        shareToFacebook('https://example.com');

        expect(mockOpen).toHaveBeenCalledWith(
          expect.stringContaining('https://www.facebook.com/sharer/sharer.php'),
          '_blank',
          expect.any(String)
        );
      });
    });
  });
});
