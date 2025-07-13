function createNotificationElement(message) {
    // Remove existing notification if it exists
    const existingNotification = document.getElementById('sw-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification container
    const notification = document.createElement('div');
    notification.id = 'sw-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 350px;
        z-index: 10000;
        cursor: pointer;
        transition: all 0.3s ease;
        animation: slideInRight 0.4s ease-out;
        border: 1px solid rgba(255,255,255,0.2);
    `;

    // Add animation styles
    if (!document.getElementById('sw-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'sw-notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { 
                    opacity: 0;
                    transform: translateX(100%);
                }
                to { 
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes slideOutRight {
                from { 
                    opacity: 1;
                    transform: translateX(0);
                }
                to { 
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
            #sw-notification:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 35px rgba(0,0,0,0.3);
            }
        `;
        document.head.appendChild(style);
    }

    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 24px;">🚀</div>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">App Update Available</div>
                <div style="opacity: 0.9; font-size: 13px;">${message}</div>
            </div>
            <div style="font-size: 18px; opacity: 0.7;">✨</div>
        </div>
        <div style="margin-top: 12px; display: flex; gap: 8px;">
            <button id="sw-update-btn" style="
                background: rgba(255,255,255,0.2);
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                flex: 1;
                transition: all 0.2s ease;
            ">Update Now</button>
            <button id="sw-dismiss-btn" style="
                background: transparent;
                color: rgba(255,255,255,0.8);
                border: 1px solid rgba(255,255,255,0.2);
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                flex: 1;
                transition: all 0.2s ease;
            ">Later</button>
        </div>
    `;

    // Add hover effects
    const updateBtn = notification.querySelector('#sw-update-btn');
    const dismissBtn = notification.querySelector('#sw-dismiss-btn');
    
    updateBtn.addEventListener('mouseenter', () => {
        updateBtn.style.background = 'rgba(255,255,255,0.3)';
        updateBtn.style.transform = 'scale(1.02)';
    });
    updateBtn.addEventListener('mouseleave', () => {
        updateBtn.style.background = 'rgba(255,255,255,0.2)';
        updateBtn.style.transform = 'scale(1)';
    });

    dismissBtn.addEventListener('mouseenter', () => {
        dismissBtn.style.background = 'rgba(255,255,255,0.1)';
        dismissBtn.style.transform = 'scale(1.02)';
    });
    dismissBtn.addEventListener('mouseleave', () => {
        dismissBtn.style.background = 'transparent';
        dismissBtn.style.transform = 'scale(1)';
    });

    document.body.appendChild(notification);
    return notification;
}

function showNotification(message) {
    return createNotificationElement(message);
}

function hideNotification() {
    const notification = document.getElementById('sw-notification');
    if (notification) {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
}

function invokeServiceWorkerUpdateFlow(registration) {
    // Prevent multiple notifications
    if (document.getElementById('sw-notification')) {
        console.log('Update notification already visible, skipping');
        return;
    }

    const notification = showNotification("Click to refresh and get the latest features!");
    
    // Handle update button click
    notification.querySelector('#sw-update-btn').addEventListener('click', () => {
        console.log('User clicked update button');
        
        // Show loading state
        const updateBtn = notification.querySelector('#sw-update-btn');
        updateBtn.textContent = 'Updating...';
        updateBtn.style.opacity = '0.7';
        updateBtn.disabled = true;
        
        if (registration.waiting) {
            // let waiting Service Worker know it should became active
            registration.waiting.postMessage('SKIP_WAITING');
        } else {
            // Fallback: force reload after short delay
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
        
        // Don't hide immediately, let the controllerchange event handle the reload
    });

    // Handle dismiss button click
    notification.querySelector('#sw-dismiss-btn').addEventListener('click', () => {
        console.log('User dismissed update notification');
        hideNotification();
    });

    // Auto-hide after 30 seconds (increased from 15)
    const autoHideTimeout = setTimeout(() => {
        console.log('Auto-hiding update notification after timeout');
        hideNotification();
    }, 30000);

    // Clear timeout if user interacts
    notification.addEventListener('click', () => {
        clearTimeout(autoHideTimeout);
    });
}

// check if the browser supports serviceWorker at all
if ('serviceWorker' in navigator) {
    // wait for the page to load
    window.addEventListener('load', async () => {
        try {
            // register the service worker from the file specified
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered successfully:', registration);

            // ensure the case when the updatefound event was missed is also handled
            // by re-invoking the prompt when there's a waiting Service Worker
            if (registration.waiting) {
                invokeServiceWorkerUpdateFlow(registration);
            }

            // detect Service Worker update available and wait for it to become installed
            registration.addEventListener('updatefound', () => {
                console.log('Service Worker update found');
                if (registration.installing) {
                    const newWorker = registration.installing;
                    
                    // wait until the new Service worker is actually installed (ready to take over)
                    newWorker.addEventListener('statechange', () => {
                        console.log('Service Worker state changed to:', newWorker.state);
                        
                        if (newWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // if there's an existing controller (previous Service Worker), show the prompt
                                console.log('New Service Worker available, showing update prompt');
                                invokeServiceWorkerUpdateFlow(registration);
                            } else {
                                // otherwise it's the first install, nothing to do
                                console.log('Service Worker initialized for the first time');
                            }
                        }
                    });
                }
            });

            // Check for updates periodically (every 20 seconds)
            setInterval(async () => {
                try {
                    await registration.update();
                    console.log('Checked for Service Worker updates');
                } catch (error) {
                    console.error('Failed to check for updates:', error);
                }
            }, 20000);

            // Check for updates when page becomes visible
            document.addEventListener('visibilitychange', async () => {
                if (!document.hidden && registration) {
                    try {
                        await registration.update();
                        console.log('Checked for updates on visibility change');
                    } catch (error) {
                        console.error('Failed to check for updates on visibility change:', error);
                    }
                }
            });

        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }

        let refreshing = false;

        // detect controller change and refresh the page
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker controller changed');
            if (!refreshing) {
                console.log('Reloading page due to Service Worker update');
                window.location.reload();
                refreshing = true;
            }
        });
    });
} else {
    console.warn('Service Workers are not supported in this browser');
}