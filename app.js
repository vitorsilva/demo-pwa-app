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

  const statusElement = document.getElementById('status');

  function updateOnlineStatus() {
      if (navigator.onLine) {
          statusElement.textContent = 'Online';
          statusElement.className = 'status online';
      } else {
          statusElement.textContent = 'Offline';
          statusElement.className = 'status offline';
      }
  }

    window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  updateOnlineStatus();

    // Register Service Worker
  if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
              .then(registration => {
                  console.log('Service Worker registered successfully:', registration);
              })
              .catch(error => {
                  console.log('Service Worker registration failed:', error);
              });
      });
  }