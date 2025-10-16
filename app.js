  // Get references to DOM elements
  const textInput = document.getElementById('textInput');
  const textOutput = document.getElementById('textOutput');

    // Function to update output text
  function updateOutput() {
      const inputValue = textInput.value;

      if (inputValue.trim() === '') {
          textOutput.innerHTML = '<span class="placeholder">Your text will appear here...</span>';
      } else {
          textOutput.textContent = inputValue;
      }
  }

   // Listen for input events
  textInput.addEventListener('input', updateOutput);