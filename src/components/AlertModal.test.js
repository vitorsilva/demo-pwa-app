/**
 * AlertModal Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showAlertModal } from './AlertModal.js';

// Mock i18n
vi.mock('../core/i18n.js', () => ({
  t: (key) => {
    const translations = {
      'common.ok': 'OK',
      'modal.errorTitle': 'Error',
      'modal.warningTitle': 'Warning',
      'modal.infoTitle': 'Information',
    };
    return translations[key] || key;
  },
}));

describe('AlertModal', () => {
  let originalBody;

  beforeEach(() => {
    vi.clearAllMocks();
    originalBody = document.body.innerHTML;
    document.body.innerHTML = '';
  });

  afterEach(() => {
    const modal = document.getElementById('alertModal');
    if (modal) modal.remove();
    document.body.innerHTML = originalBody;
  });

  describe('modal creation', () => {
    it('should create modal with correct structure', async () => {
      const modalPromise = showAlertModal({
        title: 'Test Title',
        message: 'Test Message',
      });

      const modal = document.getElementById('alertModal');
      expect(modal).not.toBeNull();
      expect(modal.className).toContain('fixed');
      expect(modal.className).toContain('inset-0');

      // Close modal
      const okBtn = modal.querySelector('#alertOkBtn');
      okBtn.click();

      await modalPromise;
    });

    it('should display title and message', async () => {
      const modalPromise = showAlertModal({
        title: 'Test Title',
        message: 'Test Message',
      });

      const modal = document.getElementById('alertModal');
      expect(modal.textContent).toContain('Test Title');
      expect(modal.textContent).toContain('Test Message');

      const okBtn = modal.querySelector('#alertOkBtn');
      okBtn.click();

      await modalPromise;
    });

    it('should use default OK button text', async () => {
      const modalPromise = showAlertModal({
        title: 'Title',
        message: 'Message',
      });

      const modal = document.getElementById('alertModal');
      const okBtn = modal.querySelector('#alertOkBtn');
      expect(okBtn.textContent.trim()).toBe('OK');

      okBtn.click();
      await modalPromise;
    });

    it('should use custom button text when provided', async () => {
      const modalPromise = showAlertModal({
        title: 'Title',
        message: 'Message',
        buttonText: 'Got It',
      });

      const modal = document.getElementById('alertModal');
      const okBtn = modal.querySelector('#alertOkBtn');
      expect(okBtn.textContent.trim()).toBe('Got It');

      okBtn.click();
      await modalPromise;
    });
  });

  describe('icon variants', () => {
    it('should display error icon by default', async () => {
      const modalPromise = showAlertModal({
        title: 'Error',
        message: 'Something went wrong',
      });

      const modal = document.getElementById('alertModal');
      const icon = modal.querySelector('.material-symbols-outlined');
      expect(icon.textContent).toBe('error');
      expect(icon.className).toContain('text-red-500');

      modal.querySelector('#alertOkBtn').click();
      await modalPromise;
    });

    it('should display warning icon', async () => {
      const modalPromise = showAlertModal({
        title: 'Warning',
        message: 'Be careful',
        icon: 'warning',
      });

      const modal = document.getElementById('alertModal');
      const icon = modal.querySelector('.material-symbols-outlined');
      expect(icon.textContent).toBe('warning');
      expect(icon.className).toContain('text-yellow-500');

      modal.querySelector('#alertOkBtn').click();
      await modalPromise;
    });

    it('should display info icon', async () => {
      const modalPromise = showAlertModal({
        title: 'Info',
        message: 'FYI',
        icon: 'info',
      });

      const modal = document.getElementById('alertModal');
      const icon = modal.querySelector('.material-symbols-outlined');
      expect(icon.textContent).toBe('info');
      expect(icon.className).toContain('text-blue-500');

      modal.querySelector('#alertOkBtn').click();
      await modalPromise;
    });

    it('should display success icon', async () => {
      const modalPromise = showAlertModal({
        title: 'Success',
        message: 'Done!',
        icon: 'success',
      });

      const modal = document.getElementById('alertModal');
      const icon = modal.querySelector('.material-symbols-outlined');
      expect(icon.textContent).toBe('check_circle');
      expect(icon.className).toContain('text-green-500');

      modal.querySelector('#alertOkBtn').click();
      await modalPromise;
    });
  });

  describe('closing behavior', () => {
    it('should resolve promise when OK clicked', async () => {
      const modalPromise = showAlertModal({
        title: 'Title',
        message: 'Message',
      });

      const modal = document.getElementById('alertModal');
      modal.querySelector('#alertOkBtn').click();

      await expect(modalPromise).resolves.toBeUndefined();
    });

    it('should close on backdrop click', async () => {
      const modalPromise = showAlertModal({
        title: 'Title',
        message: 'Message',
      });

      const modal = document.getElementById('alertModal');
      // Click on backdrop (the modal element itself, not the inner content)
      modal.click();

      await expect(modalPromise).resolves.toBeUndefined();
      expect(document.getElementById('alertModal')).toBeNull();
    });

    it('should close on Escape key', async () => {
      const modalPromise = showAlertModal({
        title: 'Title',
        message: 'Message',
      });

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      await expect(modalPromise).resolves.toBeUndefined();
      expect(document.getElementById('alertModal')).toBeNull();
    });

    it('should close on Enter key', async () => {
      const modalPromise = showAlertModal({
        title: 'Title',
        message: 'Message',
      });

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      await expect(modalPromise).resolves.toBeUndefined();
      expect(document.getElementById('alertModal')).toBeNull();
    });

    it('should remove modal from DOM after closing', async () => {
      const modalPromise = showAlertModal({
        title: 'Title',
        message: 'Message',
      });

      expect(document.getElementById('alertModal')).not.toBeNull();

      const modal = document.getElementById('alertModal');
      modal.querySelector('#alertOkBtn').click();

      await modalPromise;
      expect(document.getElementById('alertModal')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('should have alertdialog role', async () => {
      const modalPromise = showAlertModal({
        title: 'Title',
        message: 'Message',
      });

      const modal = document.getElementById('alertModal');
      const dialog = modal.querySelector('[role="alertdialog"]');
      expect(dialog).not.toBeNull();

      modal.querySelector('#alertOkBtn').click();
      await modalPromise;
    });

    it('should have aria-modal attribute', async () => {
      const modalPromise = showAlertModal({
        title: 'Title',
        message: 'Message',
      });

      const modal = document.getElementById('alertModal');
      const dialog = modal.querySelector('[aria-modal="true"]');
      expect(dialog).not.toBeNull();

      modal.querySelector('#alertOkBtn').click();
      await modalPromise;
    });

    it('should have data-testid for testing', async () => {
      const modalPromise = showAlertModal({
        title: 'Title',
        message: 'Message',
      });

      const modal = document.getElementById('alertModal');
      expect(modal.querySelector('[data-testid="alert-modal"]')).not.toBeNull();
      expect(modal.querySelector('[data-testid="alert-ok-btn"]')).not.toBeNull();

      modal.querySelector('#alertOkBtn').click();
      await modalPromise;
    });
  });
});
