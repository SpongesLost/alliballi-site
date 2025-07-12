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
        console.log('PWAUpdater: Registering service worker...');
        this.registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('PWAUpdater: Service Worker registered successfully', this.registration);
        
        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          console.log('PWAUpdater: New service worker found');
          const newWorker = this.registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            console.log('PWAUpdater: Service worker state changed to', newWorker.state);
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker installed and there's an existing one
              console.log('PWAUpdater: Showing update prompt');
              this.showUpdatePrompt();
            }
          });
        });

        // Listen for the controlling service worker changing
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('PWAUpdater: Controller changed, refreshing page');
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
            console.log('PWAUpdater: Page became visible, checking for updates');
            this.checkForUpdates();
          }
        });

      } catch (error) {
        console.error('PWAUpdater: Service Worker registration failed:', error);
      }
    } else {
      console.warn('PWAUpdater: Service workers not supported');
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
    // Remove existing banner if it exists
    const existingBanner = document.getElementById('update-banner');
    if (existingBanner) {
      existingBanner.remove();
    }

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
      animation: slideDown 0.3s ease-out;
    `;
    
    // Add CSS animation
    if (!document.getElementById('update-banner-styles')) {
      const style = document.createElement('style');
      style.id = 'update-banner-styles';
      style.textContent = `
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(0); }
          to { transform: translateY(-100%); }
        }
        .slide-up {
          animation: slideUp 0.3s ease-in forwards;
        }
      `;
      document.head.appendChild(style);
    }
    
    updateBanner.innerHTML = `
      <div style="max-width: 600px; margin: 0 auto;">
        <span style="display: inline-block; margin-right: 16px;">
          🚀 A new version is available with improvements!
        </span>
        <button id="update-btn" style="
          background: white;
          color: #007bff;
          border: none;
          padding: 8px 16px;
          margin: 0 4px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          Update Now
        </button>
        <button id="dismiss-btn" style="
          background: transparent;
          color: white;
          border: 1px solid rgba(255,255,255,0.7);
          padding: 8px 16px;
          margin: 0 4px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
          Maybe Later
        </button>
      </div>
    `;

    document.body.appendChild(updateBanner);

    // Handle update button click
    document.getElementById('update-btn').addEventListener('click', () => {
      console.log('PWAUpdater: User chose to update now');
      this.applyUpdate();
    });

    // Handle dismiss button click
    document.getElementById('dismiss-btn').addEventListener('click', () => {
      console.log('PWAUpdater: User dismissed update');
      this.dismissUpdate();
    });

    // Optional: Auto-dismiss after 30 seconds (without applying update)
    setTimeout(() => {
      const banner = document.getElementById('update-banner');
      if (banner) {
        console.log('PWAUpdater: Auto-dismissing update prompt');
        this.dismissUpdate();
      }
    }, 30000);
  }

  dismissUpdate() {
    const updateBanner = document.getElementById('update-banner');
    if (updateBanner) {
      updateBanner.classList.add('slide-up');
      setTimeout(() => {
        updateBanner.remove();
      }, 300);
    }
  }

  applyUpdate() {
    const updateBanner = document.getElementById('update-banner');
    if (updateBanner) {
      // Show loading state
      updateBanner.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto;">
          <span>🔄 Updating... Please wait</span>
        </div>
      `;
    }

    if (this.registration && this.registration.waiting) {
      // Tell the new service worker to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Fallback: just reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }
}

// Initialize the PWA updater
const pwaUpdater = new PWAUpdater();

// Export for use in other scripts if needed
window.PWAUpdater = PWAUpdater;
