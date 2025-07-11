// Service Worker Auto-Update Handler
class PWAUpdater {
  constructor() {
    this.registration = null;
    this.refreshing = false;
    this.init();
  }

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registered successfully');
        
        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          console.log('New service worker found');
          const newWorker = this.registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker installed and there's an existing one
              this.showUpdatePrompt();
            }
          });
        });

        // Listen for the controlling service worker changing
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (this.refreshing) return;
          this.refreshing = true;
          window.location.reload();
        });

        // Check for updates every 60 seconds
        setInterval(() => {
          this.checkForUpdates();
        }, 60000);

        // Check for updates when the page becomes visible
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            this.checkForUpdates();
          }
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async checkForUpdates() {
    if (this.registration) {
      try {
        await this.registration.update();
        console.log('Checked for service worker updates');
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    }
  }

  showUpdatePrompt() {
    // Create a simple update notification
    const updateBanner = document.createElement('div');
    updateBanner.id = 'update-banner';
    updateBanner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #007bff;
      color: white;
      padding: 12px;
      text-align: center;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    
    updateBanner.innerHTML = `
      <span>A new version is available!</span>
      <button id="update-btn" style="
        background: white;
        color: #007bff;
        border: none;
        padding: 6px 12px;
        margin-left: 12px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
      ">Update Now</button>
      <button id="dismiss-btn" style="
        background: transparent;
        color: white;
        border: 1px solid white;
        padding: 6px 12px;
        margin-left: 8px;
        border-radius: 4px;
        cursor: pointer;
      ">Later</button>
    `;

    document.body.appendChild(updateBanner);

    // Handle update button click
    document.getElementById('update-btn').addEventListener('click', () => {
      this.applyUpdate();
    });

    // Handle dismiss button click
    document.getElementById('dismiss-btn').addEventListener('click', () => {
      updateBanner.remove();
    });

    // Auto-apply update after 10 seconds if user doesn't interact
    setTimeout(() => {
      if (document.getElementById('update-banner')) {
        this.applyUpdate();
      }
    }, 10000);
  }

  applyUpdate() {
    const updateBanner = document.getElementById('update-banner');
    if (updateBanner) {
      updateBanner.remove();
    }

    if (this.registration && this.registration.waiting) {
      // Tell the new service worker to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
}

// Initialize the PWA updater
const pwaUpdater = new PWAUpdater();

// Export for use in other scripts if needed
window.PWAUpdater = PWAUpdater;
