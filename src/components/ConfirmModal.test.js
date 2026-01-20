/**
 * ConfirmModal Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showConfirmModal } from './ConfirmModal.js';

// Mock i18n
vi.mock('../core/i18n.js', () => ({
  t: (key) => {
    const translations = {
      'common.ok': 'OK',
      'common.cancel': 'Cancel',
      'common.confirm': 'Confirm',
      'modal.errorTitle': 'Error',
      'modal.warningTitle': 'Warning',
      'modal.infoTitle': 'Information',
    };
    return translations[key] || key;
  },
}));

describe('ConfirmModal', () => {
  let originalBody;

  beforeEach(() => {
    vi.clearAllMocks();
    originalBody = document.body.innerHTML;
    document.body.innerHTML = '';
  });

  afterEach(() => {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.remove();
    document.body.innerHTML = originalBody;
  });

  describe('modal creation', () => {
    it('should create modal with correct structure', async () => {
      const modalPromise = showConfirmModal({
        title: 'Test Title',
        message: 'Test Message',
      });

      const modal = document.getElementById('confirmModal');
      expect(modal).not.toBeNull();
      expect(modal.className).toContain('fixed');
      expect(modal.className).toContain('inset-0');

      // Close modal
      const cancelBtn = modal.querySelector('#confirmCancelBtn');
      cancelBtn.click();

      await modalPromise;
    });

    it('should display title and message', async () => {
      const modalPromise = showConfirmModal({
        title: 'Confirm Action',
        message: 'Are you sure?',
      });

      const modal = document.getElementById('confirmModal');
      expect(modal.textContent).toContain('Confirm Action');
      expect(modal.textContent).toContain('Are you sure?');

      modal.querySelector('#confirmCancelBtn').click();
      await modalPromise;
    });

    it('should use default button texts', async () => {
      const modalPromise = showConfirmModal({
        title: 'Title',
        message: 'Message',
      });

      const modal = document.getElementById('confirmModal');
      const cancelBtn = modal.querySelector('#confirmCancelBtn');
      const confirmBtn = modal.querySelector('#confirmOkBtn');

      expect(cancelBtn.textContent.trim()).toBe('Cancel');
      expect(confirmBtn.textContent.trim()).toBe('Confirm');

      cancelBtn.click();
      await modalPromise;
    });

    it('should use custom button texts when provided', async () => {
      const modalPromise = showConfirmModal({
        title: 'Title',
        message: 'Message',
        confirmText: 'Yes, Delete',
        cancelText: 'No, Keep',
      });

      const modal = document.getElementById('confirmModal');
      const cancelBtn = modal.querySelector('#confirmCancelBtn');
      const confirmBtn = modal.querySelector('#confirmOkBtn');

      expect(cancelBtn.textContent.trim()).toBe('No, Keep');
      expect(confirmBtn.textContent.trim()).toBe('Yes, Delete');

      cancelBtn.click();
      await modalPromise;
    });
  });

  describe('icon variants', () => {
    it('should display warning icon by default', async () => {
      const modalPromise = showConfirmModal({
        title: 'Confirm',
        message: 'Are you sure?',
      });

      const modal = document.getElementById('confirmModal');
      const icon = modal.querySelector('.material-symbols-outlined');
      expect(icon.textContent).toBe('warning');
      expect(icon.className).toContain('text-yellow-500');

      modal.querySelector('#confirmCancelBtn').click();
      await modalPromise;
    });

    it('should display error icon', async () => {
      const modalPromise = showConfirmModal({
        title: 'Delete',
        message: 'Delete this item?',
        icon: 'error',
      });

      const modal = document.getElementById('confirmModal');
      const icon = modal.querySelector('.material-symbols-outlined');
      expect(icon.textContent).toBe('error');
      expect(icon.className).toContain('text-red-500');

      modal.querySelector('#confirmCancelBtn').click();
      await modalPromise;
    });

    it('should display info icon', async () => {
      const modalPromise = showConfirmModal({
        title: 'Update',
        message: 'Update available',
        icon: 'info',
      });

      const modal = document.getElementById('confirmModal');
      const icon = modal.querySelector('.material-symbols-outlined');
      expect(icon.textContent).toBe('info');
      expect(icon.className).toContain('text-blue-500');

      modal.querySelector('#confirmCancelBtn').click();
      await modalPromise;
    });
  });

  describe('destructive mode', () => {
    it('should use primary button style by default', async () => {
      const modalPromise = showConfirmModal({
        title: 'Title',
        message: 'Message',
      });

      const modal = document.getElementById('confirmModal');
      const confirmBtn = modal.querySelector('#confirmOkBtn');
      expect(confirmBtn.className).toContain('bg-primary');
      expect(confirmBtn.className).not.toContain('bg-red-500');

      modal.querySelector('#confirmCancelBtn').click();
      await modalPromise;
    });

    it('should use red button style when destructive', async () => {
      const modalPromise = showConfirmModal({
        title: 'Delete',
        message: 'This cannot be undone',
        destructive: true,
      });

      const modal = document.getElementById('confirmModal');
      const confirmBtn = modal.querySelector('#confirmOkBtn');
      expect(confirmBtn.className).toContain('bg-red-500');
      expect(confirmBtn.className).not.toContain('bg-primary');

      modal.querySelector('#confirmCancelBtn').click();
      await modalPromise;
    });
  });

  describe('closing behavior', () => {
    it('should resolve true when confirm clicked', async () => {
      const modalPromise = showConfirmModal({
        title: 'Title',
        message: 'Message',
      });

      const modal = document.getElementById('confirmModal');
      modal.querySelector('#confirmOkBtn').click();

      await expect(modalPromise).resolves.toBe(true);
    });

    it('should resolve false when cancel clicked', async () => {
      const modalPromise = showConfirmModal({
        title: 'Title',
        message: 'Message',
      });

      const modal = document.getElementById('confirmModal');
      modal.querySelector('#confirmCancelBtn').click();

      await expect(modalPromise).resolves.toBe(false);
    });

    it('should resolve false on backdrop click', async () => {
      const modalPromise = showConfirmModal({
        title: 'Title',
        message: 'Message',
      });

      const modal = document.getElementById('confirmModal');
      // Click on backdrop (the modal element itself, not the inner content)
      modal.click();

      await expect(modalPromise).resolves.toBe(false);
      expect(document.getElementById('confirmModal')).toBeNull();
    });

    it('should resolve false on Escape key', async () => {
      const modalPromise = showConfirmModal({
        title: 'Title',
        message: 'Message',
      });

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      await expect(modalPromise).resolves.toBe(false);
      expect(document.getElementById('confirmModal')).toBeNull();
    });

    it('should remove modal from DOM after closing', async () => {
      const modalPromise = showConfirmModal({
        title: 'Title',
        message: 'Message',
      });

      expect(document.getElementById('confirmModal')).not.toBeNull();

      const modal = document.getElementById('confirmModal');
      modal.querySelector('#confirmOkBtn').click();

      await modalPromise;
      expect(document.getElementById('confirmModal')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('should have dialog role', async () => {
      const modalPromise = showConfirmModal({
        title: 'Title',
        message: 'Message',
      });

      const modal = document.getElementById('confirmModal');
      const dialog = modal.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();

      modal.querySelector('#confirmCancelBtn').click();
      await modalPromise;
    });

    it('should have aria-modal attribute', async () => {
      const modalPromise = showConfirmModal({
        title: 'Title',
        message: 'Message',
      });

      const modal = document.getElementById('confirmModal');
      const dialog = modal.querySelector('[aria-modal="true"]');
      expect(dialog).not.toBeNull();

      modal.querySelector('#confirmCancelBtn').click();
      await modalPromise;
    });

    it('should have data-testid for testing', async () => {
      const modalPromise = showConfirmModal({
        title: 'Title',
        message: 'Message',
      });

      const modal = document.getElementById('confirmModal');
      expect(modal.querySelector('[data-testid="confirm-modal"]')).not.toBeNull();
      expect(modal.querySelector('[data-testid="confirm-cancel-btn"]')).not.toBeNull();
      expect(modal.querySelector('[data-testid="confirm-ok-btn"]')).not.toBeNull();

      modal.querySelector('#confirmCancelBtn').click();
      await modalPromise;
    });
  });
});
