  import { describe, it, expect } from 'vitest';
  import {
    createConnectionModeIndicator,
    updateConnectionModeIndicator,
    MODE_CONFIG,
  } from './ConnectionModeIndicator.js';
  import { CONNECTION_MODES } from '../services/party-connection-manager.js';

  describe('ConnectionModeIndicator', () => {
    describe('createConnectionModeIndicator', () => {
      it('creates an element with the correct ID', () => {
        const indicator = createConnectionModeIndicator(CONNECTION_MODES.CONNECTING);
        expect(indicator.id).toBe('connectionModeIndicator');
      });

      it('applies correct styling for P2P mode', () => {
        const indicator = createConnectionModeIndicator(CONNECTION_MODES.P2P);
        expect(indicator.className).toContain(MODE_CONFIG[CONNECTION_MODES.P2P].bgClass);
      });

      it('applies correct styling for HTTP fallback mode', () => {      
        const indicator = createConnectionModeIndicator(CONNECTION_MODES.HTTP_FALLBACK);
        expect(indicator.className).toContain(MODE_CONFIG[CONNECTION_MODES.HTTP_FALLBACK].bgClass);
      });

      it('applies correct styling for connecting mode', () => {
        const indicator = createConnectionModeIndicator(CONNECTION_MODES.CONNECTING);
        expect(indicator.className).toContain(MODE_CONFIG[CONNECTION_MODES.CONNECTING].bgClass);
      });

      it('defaults to connecting mode when no mode provided', () => {   
        const indicator = createConnectionModeIndicator();
        expect(indicator.className).toContain(MODE_CONFIG[CONNECTION_MODES.CONNECTING].bgClass);
      });
    });

    describe('updateConnectionModeIndicator', () => {
      it('updates existing element to new mode', () => {
        const indicator = createConnectionModeIndicator(CONNECTION_MODES.CONNECTING);
        expect(indicator.className).toContain(MODE_CONFIG[CONNECTION_MODES.CONNECTING].bgClass);

        updateConnectionModeIndicator(indicator, CONNECTION_MODES.P2P); 
        expect(indicator.className).toContain(MODE_CONFIG[CONNECTION_MODES.P2P].bgClass);
        expect(indicator.className).not.toContain(MODE_CONFIG[CONNECTION_MODES.CONNECTING].bgClass);
      });

      it('handles null indicator gracefully', () => {
        expect(() => updateConnectionModeIndicator(null, CONNECTION_MODES.P2P)).not.toThrow();
      });

      it('handles invalid mode gracefully', () => {
        const indicator = createConnectionModeIndicator(CONNECTION_MODES.P2P);
        expect(() => updateConnectionModeIndicator(indicator, 'invalid-mode')).not.toThrow();
      });
    });
  });