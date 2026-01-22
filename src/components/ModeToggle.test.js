import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createModeToggle } from './ModeToggle.js';
import { getCurrentMode, setMode } from '../services/theme-manager.js';
import { t } from '../core/i18n.js';

// Mock dependencies
vi.mock('../services/theme-manager.js', () => ({
  getCurrentMode: vi.fn(),
  setMode: vi.fn(),
}));

vi.mock('../core/i18n.js', () => ({
  t: vi.fn((key) => {
    const translations = {
      'mode.learn': 'Learn',
      'mode.party': 'Party',
      'mode.switchToLearn': 'Switch to Learning Mode',
      'mode.switchToParty': 'Switch to Party Mode',
    };
    return translations[key] || key;
  }),
}));

describe('ModeToggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentMode.mockReturnValue('learning');
  });

  describe('createModeToggle', () => {
    it('should return an HTML element', () => {
      const toggle = createModeToggle();

      expect(toggle).toBeInstanceOf(HTMLElement);
      expect(toggle.tagName).toBe('DIV');
    });

    it('should have correct container classes', () => {
      const toggle = createModeToggle();

      expect(toggle.classList.contains('mode-toggle')).toBe(true);
      expect(toggle.classList.contains('flex')).toBe(true);
      expect(toggle.classList.contains('rounded-lg')).toBe(true);
    });

    it('should have correct ARIA attributes on container', () => {
      const toggle = createModeToggle();

      expect(toggle.getAttribute('role')).toBe('tablist');
      expect(toggle.getAttribute('aria-label')).toBe('App mode');
    });

    it('should contain two buttons', () => {
      const toggle = createModeToggle();
      const buttons = toggle.querySelectorAll('button');

      expect(buttons.length).toBe(2);
    });

    it('should have learning button with correct data-mode', () => {
      const toggle = createModeToggle();
      const learnBtn = toggle.querySelector('[data-mode="learning"]');

      expect(learnBtn).not.toBeNull();
      expect(learnBtn.tagName).toBe('BUTTON');
    });

    it('should have party button with correct data-mode', () => {
      const toggle = createModeToggle();
      const partyBtn = toggle.querySelector('[data-mode="party"]');

      expect(partyBtn).not.toBeNull();
      expect(partyBtn.tagName).toBe('BUTTON');
    });

    it('should display translated labels', () => {
      const toggle = createModeToggle();

      expect(toggle.textContent).toContain('Learn');
      expect(toggle.textContent).toContain('Party');
    });

    it('should display emojis', () => {
      const toggle = createModeToggle();

      expect(toggle.textContent).toContain('📚');
      expect(toggle.textContent).toContain('🎉');
    });
  });

  describe('initial state - learning mode', () => {
    beforeEach(() => {
      getCurrentMode.mockReturnValue('learning');
    });

    it('should highlight learning button when mode is learning', () => {
      const toggle = createModeToggle();
      const learnBtn = toggle.querySelector('[data-mode="learning"]');

      expect(learnBtn.classList.contains('bg-white')).toBe(true);
      expect(learnBtn.classList.contains('text-primary')).toBe(true);
    });

    it('should not highlight party button when mode is learning', () => {
      const toggle = createModeToggle();
      const partyBtn = toggle.querySelector('[data-mode="party"]');

      expect(partyBtn.classList.contains('bg-white')).toBe(false);
      expect(partyBtn.classList.contains('text-subtext-light')).toBe(true);
    });

    it('should set aria-selected correctly for learning mode', () => {
      const toggle = createModeToggle();
      const learnBtn = toggle.querySelector('[data-mode="learning"]');
      const partyBtn = toggle.querySelector('[data-mode="party"]');

      expect(learnBtn.getAttribute('aria-selected')).toBe('true');
      expect(partyBtn.getAttribute('aria-selected')).toBe('false');
    });
  });

  describe('initial state - party mode', () => {
    beforeEach(() => {
      getCurrentMode.mockReturnValue('party');
    });

    it('should highlight party button when mode is party', () => {
      const toggle = createModeToggle();
      const partyBtn = toggle.querySelector('[data-mode="party"]');

      expect(partyBtn.classList.contains('bg-white')).toBe(true);
      expect(partyBtn.classList.contains('text-primary')).toBe(true);
    });

    it('should not highlight learning button when mode is party', () => {
      const toggle = createModeToggle();
      const learnBtn = toggle.querySelector('[data-mode="learning"]');

      expect(learnBtn.classList.contains('bg-white')).toBe(false);
      expect(learnBtn.classList.contains('text-subtext-light')).toBe(true);
    });

    it('should set aria-selected correctly for party mode', () => {
      const toggle = createModeToggle();
      const learnBtn = toggle.querySelector('[data-mode="learning"]');
      const partyBtn = toggle.querySelector('[data-mode="party"]');

      expect(learnBtn.getAttribute('aria-selected')).toBe('false');
      expect(partyBtn.getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('click interactions', () => {
    beforeEach(() => {
      getCurrentMode.mockReturnValue('learning');
    });

    it('should call setMode when party button is clicked', () => {
      const toggle = createModeToggle();
      const partyBtn = toggle.querySelector('[data-mode="party"]');

      partyBtn.click();

      expect(setMode).toHaveBeenCalledWith('party');
    });

    it('should call setMode when learning button is clicked', () => {
      getCurrentMode.mockReturnValue('party');
      const toggle = createModeToggle();
      const learnBtn = toggle.querySelector('[data-mode="learning"]');

      learnBtn.click();

      expect(setMode).toHaveBeenCalledWith('learning');
    });

    it('should update UI after clicking party button', () => {
      const toggle = createModeToggle();
      const partyBtn = toggle.querySelector('[data-mode="party"]');
      const learnBtn = toggle.querySelector('[data-mode="learning"]');

      partyBtn.click();

      // Party should now be highlighted
      expect(partyBtn.classList.contains('bg-white')).toBe(true);
      expect(partyBtn.classList.contains('text-primary')).toBe(true);
      expect(partyBtn.getAttribute('aria-selected')).toBe('true');

      // Learning should no longer be highlighted
      expect(learnBtn.classList.contains('bg-white')).toBe(false);
      expect(learnBtn.classList.contains('text-subtext-light')).toBe(true);
      expect(learnBtn.getAttribute('aria-selected')).toBe('false');
    });

    it('should update UI after clicking learning button', () => {
      getCurrentMode.mockReturnValue('party');
      const toggle = createModeToggle();
      const learnBtn = toggle.querySelector('[data-mode="learning"]');
      const partyBtn = toggle.querySelector('[data-mode="party"]');

      learnBtn.click();

      // Learning should now be highlighted
      expect(learnBtn.classList.contains('bg-white')).toBe(true);
      expect(learnBtn.classList.contains('text-primary')).toBe(true);
      expect(learnBtn.getAttribute('aria-selected')).toBe('true');

      // Party should no longer be highlighted
      expect(partyBtn.classList.contains('bg-white')).toBe(false);
      expect(partyBtn.classList.contains('text-subtext-light')).toBe(true);
      expect(partyBtn.getAttribute('aria-selected')).toBe('false');
    });

    it('should not call setMode when clicking outside buttons', () => {
      const toggle = createModeToggle();

      // Click on the container itself, not a button
      toggle.click();

      expect(setMode).not.toHaveBeenCalled();
    });

    it('should handle clicking on emoji inside button', () => {
      const toggle = createModeToggle();
      const partyBtn = toggle.querySelector('[data-mode="party"]');
      const emoji = partyBtn.querySelector('span');

      // Simulate clicking on the emoji span
      emoji.click();

      expect(setMode).toHaveBeenCalledWith('party');
    });
  });

  describe('accessibility', () => {
    it('should have role="tab" on buttons', () => {
      const toggle = createModeToggle();
      const buttons = toggle.querySelectorAll('button');

      buttons.forEach((btn) => {
        expect(btn.getAttribute('role')).toBe('tab');
      });
    });

    it('should have aria-label on buttons', () => {
      const toggle = createModeToggle();
      const learnBtn = toggle.querySelector('[data-mode="learning"]');
      const partyBtn = toggle.querySelector('[data-mode="party"]');

      expect(learnBtn.getAttribute('aria-label')).toBe('Switch to Learning Mode');
      expect(partyBtn.getAttribute('aria-label')).toBe('Switch to Party Mode');
    });
  });
});
