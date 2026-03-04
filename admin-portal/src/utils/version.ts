// Version management for cache busting
// Update this version number whenever you deploy changes
export const APP_VERSION = '1.2.4';
export const VERSION_KEY = 'admin_app_version';

export const checkVersion = (): boolean => {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  
  if (storedVersion !== APP_VERSION) {
    return false; // Version mismatch - needs update
  }
  
  return true; // Version matches
};

// Check remote version from server
export const checkRemoteVersion = async (): Promise<boolean> => {
  try {
    const response = await fetch('/version.json?t=' + Date.now(), {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      return true; // If can't fetch, assume no update needed
    }
    
    const data = await response.json();
    const remoteVersion = data.version;
    
    // Compare with stored version
    const storedVersion = localStorage.getItem(VERSION_KEY);
    
    if (storedVersion && storedVersion !== remoteVersion) {
      return false; // Version mismatch - update needed
    }
    
    return true; // Versions match
  } catch (error) {
    // If fetch fails, fall back to local check
    return checkVersion();
  }
};

export const updateVersion = (): void => {
  localStorage.setItem(VERSION_KEY, APP_VERSION);
};

export const clearAppCache = async (): Promise<void> => {
  // Clear localStorage except auth token
  const authToken = localStorage.getItem('admin_token');
  const rememberMe = localStorage.getItem('admin_remember_me');
  
  localStorage.clear();
  
  // Restore auth if exists
  if (authToken) localStorage.setItem('admin_token', authToken);
  if (rememberMe) localStorage.setItem('admin_remember_me', rememberMe);
  
  // Clear all caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
  
  // Unregister service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.unregister()));
  }
};
