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

  let deferredPrompt;
  const installBtn = document.getElementById('installBtn');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      installBtn.classList.remove('hidden');
  });

  installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) {
          return;
      }
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
      } else {
          console.log('User dismissed the install prompt');
      }

      deferredPrompt = null;
      installBtn.classList.add('hidden');
  });

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