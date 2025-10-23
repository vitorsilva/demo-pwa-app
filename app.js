
// Function to update output text
  export function updateOutput() {
    // Get references to DOM elements
    const textInput = document.getElementById('textInput');
    const textOutput = document.getElementById('textOutput');
    const inputValue = textInput.value;

    if (inputValue.trim() === '') {
        textOutput.innerHTML = '<span class="placeholder">Your text will appear here...</span>';
    } else {
        textOutput.textContent = inputValue;
    }
  }

  if (typeof document !== 'undefined' && document.getElementById('textInput')) {
    // Listen for input events
    textInput.addEventListener('input', updateOutput);

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    updateOnlineStatus();

    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
  const installBtn = document.getElementById('installBtn');
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
  }

  export function updateOnlineStatus() {
    const statusElement = document.getElementById('status');

    if (!statusElement) return; // Safety check
        if (navigator.onLine) {
            statusElement.textContent = 'Online';
            statusElement.className = 'status online';
        } else {
            statusElement.textContent = 'Offline';
            statusElement.className = 'status offline';
        }
  }

  // Register Service Worker
  if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
          navigator.serviceWorker.register('sw.js')
              .then(registration => {
                  console.log('Service Worker registered successfully:', registration);
              })
              .catch(error => {
                  console.log('Service Worker registration failed:', error);
              });
      });
  }