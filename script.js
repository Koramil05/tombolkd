// ===== KDKMP PORTAL - MAIN SCRIPT =====

// Global Variables
let deferredPrompt;
let currentTheme = localStorage.getItem('theme') || 'light';
let isOnline = navigator.onLine;

// DOM Elements
const loadingScreen = document.getElementById('loading');
const loadingProgress = document.querySelector('.loading-progress');
const toast = document.getElementById('toast');
const themeToggle = document.getElementById('themeToggle');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const installBtn = document.getElementById('installBtn');
const btnPemetaan = document.getElementById('btnPemetaan');
const btnPortal = document.getElementById('btnPortal');
const refreshBtn = document.getElementById('refreshBtn');
const infoBtn = document.getElementById('infoBtn');
const shareBtn = document.getElementById('shareBtn');
const connectionStatus = document.getElementById('connectionStatus');
const appVersion = document.getElementById('appVersion');
const privacyBtn = document.getElementById('privacyBtn');
const termsBtn = document.getElementById('termsBtn');
const helpBtn = document.getElementById('helpBtn');

// Configuration
const CONFIG = {
    version: '1.2.0',
    buttons: {
        pemetaan: {
            url: 'https://pemetaan-lahan.portalkdkmp.id',
            name: 'Pemetaan Lahan KDKMP',
            icon: '🗺️'
        },
        portal: {
            url: 'https://portalkdkmp.id',
            name: 'Portal Dashboard KDKMP',
            icon: '📊'
        }
    },
    cacheName: 'kdkmp-portal-v1.2',
    cacheUrls: [
        './',
        './index.html',
        './style.css',
        './script.js',
        './manifest.json',
        'https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg/earth.svg',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
    ]
};

// ===== UTILITY FUNCTIONS =====

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, info, warning)
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
    // Clear existing timeout
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    
    // Set message and type
    toast.textContent = message;
    toast.className = 'toast';
    
    // Add type class
    const typeIcons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };
    
    const icon = typeIcons[type] || 'ℹ';
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 
                                      type === 'error' ? 'exclamation-circle' : 
                                      type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i> ${message}`;
    
    // Add type class for styling
    toast.classList.add(type);
    toast.classList.add('show');
    
    // Auto hide
    toast.timeoutId = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
    
    return toast.timeoutId;
}

/**
 * Update loading progress
 * @param {number} percent - Progress percentage (0-100)
 */
function updateLoadingProgress(percent) {
    if (loadingProgress) {
        loadingProgress.style.width = `${Math.min(percent, 100)}%`;
    }
}

/**
 * Simulate loading sequence
 */
function simulateLoading() {
    let progress = 0;
    const steps = [
        { label: 'Memuat konfigurasi...', value: 20 },
        { label: 'Menyiapkan antarmuka...', value: 40 },
        { label: 'Memuat komponen...', value: 60 },
        { label: 'Menyiapkan PWA...', value: 80 },
        { label: 'Siap digunakan!', value: 100 }
    ];
    
    steps.forEach((step, index) => {
        setTimeout(() => {
            progress = step.value;
            updateLoadingProgress(progress);
            
            if (index === steps.length - 1) {
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    showToast('Portal KDKMP siap digunakan!', 'success', 2000);
                    
                    // Check PWA installation status
                    if (window.matchMedia('(display-mode: standalone)').matches) {
                        showToast('Berjalan sebagai aplikasi terinstal', 'info', 3000);
                    }
                }, 500);
            }
        }, index * 500);
    });
}

/**
 * Initialize theme
 */
function initTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Update theme toggle icon
    const icon = themeToggle.querySelector('i');
    if (currentTheme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        themeToggle.title = 'Mode terang';
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        themeToggle.title = 'Mode gelap';
    }
}

/**
 * Toggle theme between light/dark
 */
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    initTheme();
    showToast(`Mode ${currentTheme === 'dark' ? 'gelap' : 'terang'} diaktifkan`, 'success');
}

/**
 * Handle button click with animation
 * @param {HTMLElement} button - Button element
 * @param {Object} config - Button configuration
 */
function handleButtonClick(button, config) {
    // Create ripple effect
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        width: ${size}px;
        height: ${size}px;
        top: ${y}px;
        left: ${x}px;
        pointer-events: none;
    `;
    
    // Add ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    button.appendChild(ripple);
    
    // Button press animation
    button.style.transform = 'scale(0.95)';
    
    // Show loading state
    const originalText = button.querySelector('.btn-content h3').textContent;
    button.querySelector('.btn-content h3').textContent = 'Membuka...';
    button.disabled = true;
    
    // Show toast
    showToast(`Membuka ${config.name}`, 'info');
    
    // Open URL after animation
    setTimeout(() => {
        window.open(config.url, '_blank', 'noopener,noreferrer');
        
        // Reset button state
        setTimeout(() => {
            button.style.transform = '';
            button.querySelector('.btn-content h3').textContent = originalText;
            button.disabled = false;
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
                style.remove();
            }, 600);
        }, 1000);
    }, 500);
}

/**
 * Check network connection
 */
function checkConnection() {
    const wasOnline = isOnline;
    isOnline = navigator.onLine;
    
    if (wasOnline !== isOnline) {
        const statusText = isOnline ? 'Terhubung' : 'Offline';
        const statusType = isOnline ? 'success' : 'warning';
        
        if (connectionStatus) {
            connectionStatus.innerHTML = `<i class="fas fa-${isOnline ? 'wifi' : 'exclamation-triangle'}"></i> ${statusText}`;
        }
        
        showToast(
            isOnline ? 'Koneksi internet pulih' : 'Kehilangan koneksi internet',
            statusType,
            3000
        );
    }
    
    return isOnline;
}

/**
 * Share portal
 */
async function sharePortal() {
    const shareData = {
        title: 'KDKMP Portal',
        text: 'Akses cepat ke sistem Pemetaan Lahan dan Dashboard KDKMP',
        url: window.location.href
    };
    
    try {
        if (navigator.share && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            showToast('Portal berhasil dibagikan!', 'success');
        } else {
            // Fallback: Copy to clipboard
            await navigator.clipboard.writeText(window.location.href);
            showToast('Link disalin ke clipboard!', 'success');
        }
    } catch (err) {
        console.log('Share error:', err);
        showToast('Gagal membagikan', 'error');
    }
}

/**
 * Show information modal
 */
function showInfo() {
    const info = `
        🚀 <strong>KDKMP PORTAL v${CONFIG.version}</strong>
        
        <br><br>
        <strong>Fitur Utama:</strong>
        • Akses cepat ke Pemetaan Lahan KDKMP
        • Dashboard monitoring real-time
        • Mode PWA (Install sebagai aplikasi)
        • Tema gelap/terang
        • Dukungan offline
        
        <br><br>
        <strong>Teknologi:</strong>
        • Progressive Web App (PWA)
        • Service Worker
        • Web App Manifest
        • Modern CSS & JavaScript
        
        <br><br>
        © 2024 KDKMP Portal
    `;
    
    // Create modal
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div class="modal-overlay" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 10000; display: flex;
            align-items: center; justify-content: center; padding: 20px;
        ">
            <div class="modal-content" style="
                background: var(--surface); color: var(--text-primary);
                padding: 30px; border-radius: var(--radius); max-width: 500px;
                width: 100%; box-shadow: var(--shadow-hover); position: relative;
            ">
                <button class="modal-close" style="
                    position: absolute; top: 15px; right: 15px;
                    background: none; border: none; color: var(--text-secondary);
                    font-size: 1.5rem; cursor: pointer; padding: 5px;
                ">&times;</button>
                <div class="modal-body" style="margin-top: 20px;">
                    ${info}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal on click
    const overlay = modal.querySelector('.modal-overlay');
    const closeBtn = modal.querySelector('.modal-close');
    
    function closeModal() {
        document.body.removeChild(modal);
    }
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    
    closeBtn.addEventListener('click', closeModal);
}

// ===== PWA FUNCTIONS =====

/**
 * Register Service Worker
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.worker.register('./sw.js');
            console.log('Service Worker registered:', registration);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showToast('Update tersedia! Segarkan halaman.', 'info', 5000);
                    }
                });
            });
            
            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            showToast('Mode offline tidak tersedia', 'warning');
        }
    }
    return null;
}

/**
 * Handle PWA installation
 */
function handlePWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install button
        if (installBtn) {
            installBtn.style.display = 'flex';
            
            installBtn.addEventListener('click', async () => {
                if (!deferredPrompt) return;
                
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    showToast('Aplikasi sedang diinstal...', 'success');
                    installBtn.style.display = 'none';
                } else {
                    showToast('Instalasi dibatalkan', 'warning');
                }
                
                deferredPrompt = null;
            });
        }
        
        // Auto show prompt after 5 seconds
        setTimeout(() => {
            if (deferredPrompt && !localStorage.getItem('installPromptShown')) {
                const shouldPrompt = confirm('Ingin install KDKMP Portal sebagai aplikasi?');
                if (shouldPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            localStorage.setItem('installPromptShown', 'true');
                        }
                        deferredPrompt = null;
                    });
                }
            }
        }, 5000);
    });
    
    // Detect if app is already installed
    window.addEventListener('appinstalled', () => {
        console.log('PWA installed successfully');
        if (installBtn) installBtn.style.display = 'none';
        showToast('Aplikasi berhasil diinstal!', 'success', 3000);
    });
}

// ===== EVENT LISTENERS =====

/**
 * Initialize all event listeners
 */
function initEventListeners() {
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Fullscreen toggle
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                showToast('Mode layar penuh', 'success');
            } else {
                document.exitFullscreen();
                showToast('Keluar layar penuh', 'info');
            }
        });
    }
    
    // Main buttons
    if (btnPemetaan) {
        btnPemetaan.addEventListener('click', (e) => 
            handleButtonClick(btnPemetaan, CONFIG.buttons.pemetaan));
    }
    
    if (btnPortal) {
        btnPortal.addEventListener('click', (e) => 
            handleButtonClick(btnPortal, CONFIG.buttons.portal));
    }
    
    // Action buttons
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            showToast('Memperbarui data...', 'info');
            setTimeout(() => {
                showToast('Data diperbarui', 'success');
            }, 1000);
        });
    }
    
    if (infoBtn) {
        infoBtn.addEventListener('click', showInfo);
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', sharePortal);
    }
    
    // Footer links
    if (privacyBtn) {
        privacyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Kebijakan Privasi', 'info');
        });
    }
    
    if (termsBtn) {
        termsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Syarat & Ketentuan', 'info');
        });
    }
    
    if (helpBtn) {
        helpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showInfo();
        });
    }
    
    // Network events
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    
    // Fullscreen change
    document.addEventListener('fullscreenchange', () => {
        const icon = fullscreenBtn.querySelector('i');
        if (document.fullscreenElement) {
            icon.classList.remove('fa-expand');
            icon.classList.add('fa-compress');
            fullscreenBtn.title = 'Keluar layar penuh';
        } else {
            icon.classList.remove('fa-compress');
            icon.classList.add('fa-expand');
            fullscreenBtn.title = 'Layar penuh';
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + 1 for Pemetaan Lahan
        if ((e.ctrlKey || e.metaKey) && e.key === '1') {
            e.preventDefault();
            btnPemetaan?.click();
        }
        
        // Ctrl/Cmd + 2 for Portal KDKMP
        if ((e.ctrlKey || e.metaKey) && e.key === '2') {
            e.preventDefault();
            btnPortal?.click();
        }
        
        // Escape to exit fullscreen
        if (e.key === 'Escape' && document.fullscreenElement) {
            document.exitFullscreen();
        }
        
        // F11 for fullscreen
        if (e.key === 'F11') {
            e.preventDefault();
            fullscreenBtn?.click();
        }
    });
}

// ===== INITIALIZATION =====

/**
 * Initialize application
 */
async function initApp() {
    console.log('🚀 Initializing KDKMP Portal v' + CONFIG.version);
    
    // Set app version
    if (appVersion) {
        appVersion.textContent = `v${CONFIG.version}`;
    }
    
    // Initialize theme
    initTheme();
    
    // Initialize event listeners
    initEventListeners();
    
    // Check initial connection
    checkConnection();
    
    // Register Service Worker
    await registerServiceWorker();
    
    // Handle PWA installation
    handlePWAInstall();
    
    // Start loading simulation
    simulateLoading();
    
    // Log initialization complete
    console.log('✅ KDKMP Portal initialized successfully');
}

// ===== SERVICE WORKER CONTENT =====
// Create Service Worker dynamically if needed
if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
    const swContent = `
        const CACHE_NAME = '${CONFIG.cacheName}';
        const urlsToCache = ${JSON.stringify(CONFIG.cacheUrls)};

        // Install event
        self.addEventListener('install', event => {
            console.log('Service Worker: Installing...');
            event.waitUntil(
                caches.open(CACHE_NAME)
                    .then(cache => {
                        console.log('Service Worker: Caching files');
                        return cache.addAll(urlsToCache);
                    })
                    .then(() => self.skipWaiting())
            );
        });

        // Activate event
        self.addEventListener('activate', event => {
            console.log('Service Worker: Activating...');
            event.waitUntil(
                caches.keys().then(cacheNames => {
                    return Promise.all(
                        cacheNames.map(cacheName => {
                            if (cacheName !== CACHE_NAME) {
                                console.log('Service Worker: Clearing old cache');
                                return caches.delete(cacheName);
                            }
                        })
                    );
                }).then(() => self.clients.claim())
            );
        });

        // Fetch event
        self.addEventListener('fetch', event => {
            if (event.request.method !== 'GET') return;
            
            event.respondWith(
                caches.match(event.request)
                    .then(response => {
                        // Return cached response if found
                        if (response) {
                            return response;
                        }
                        
                        // Clone the request
                        const fetchRequest = event.request.clone();
                        
                        // Make network request
                        return fetch(fetchRequest)
                            .then(response => {
                                // Check if valid response
                                if (!response || response.status !== 200 || response.type !== 'basic') {
                                    return response;
                                }
                                
                                // Clone the response
                                const responseToCache = response.clone();
                                
                                // Cache the new response
                                caches.open(CACHE_NAME)
                                    .then(cache => {
                                        cache.put(event.request, responseToCache);
                                    });
                                
                                return response;
                            })
                            .catch(() => {
                                // If both cache and network fail, show offline page
                                return caches.match('./index.html');
                            });
                    })
            );
        });

        // Background sync (if supported)
        if ('sync' in self.registration) {
            self.addEventListener('sync', event => {
                if (event.tag === 'sync-data') {
                    console.log('Background sync triggered');
                }
            });
        }

        // Push notifications (if supported)
        self.addEventListener('push', event => {
            const options = {
                body: event.data?.text() || 'Update dari KDKMP Portal',
                icon: 'https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg/earth.svg',
                badge: 'https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg/earth.svg',
                vibrate: [200, 100, 200],
                tag: 'kdkmp-update'
            };
            
            event.waitUntil(
                self.registration.showNotification('KDKMP Portal', options)
            );
        });

        // Notification click
        self.addEventListener('notificationclick', event => {
            event.notification.close();
            event.waitUntil(
                clients.matchAll({ type: 'window' })
                    .then(clientList => {
                        for (const client of clientList) {
                            if (client.url === '/' && 'focus' in client) {
                                return client.focus();
                            }
                        }
                        if (clients.openWindow) {
                            return clients.openWindow('/');
                        }
                    })
            );
        });
    `;
    
    // Create Service Worker blob
    const swBlob = new Blob([swContent], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(swBlob);
    
    // Register it
    navigator.serviceWorker.register(swUrl)
        .then(reg => console.log('Dynamic Service Worker registered'))
        .catch(err => console.error('Dynamic Service Worker failed:', err));
}

// ===== START APPLICATION =====
// Wait for DOM to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showToast,
        checkConnection,
        toggleTheme
    };
}
