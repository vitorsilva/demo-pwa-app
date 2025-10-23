import { describe, it, expect, beforeEach } from 'vitest';
import { updateOutput, updateOnlineStatus } from './app.js';

  describe('updateOutput function', () => {

    beforeEach(() => {
      document.body.innerHTML = `
        <input type="text" id="textInput" value="">
        <div id="textOutput"></div>
      `;
    });

    it('should display input text in output div', () => {
      // Arrange: Get the elements
      const input = document.getElementById('textInput');
      const output = document.getElementById('textOutput');

      // Act: Simulate typing
      input.value = 'Hello World';
      updateOutput();

      // Assert: Check result
      expect(output.textContent).toBe('Hello World');
    });

    it('should show placeholder when input is empty', () => {
      const input = document.getElementById('textInput');
      const output = document.getElementById('textOutput');

      input.value = '';
      updateOutput();

      expect(output.textContent).toBe('Your text will appear here...');
    });    

  });