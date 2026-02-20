// Version management for cache busting
// Update this version number whenever you deploy changes
export const APP_VERSION = '1.1.4';
export const VERSION_KEY = 'app_version';

export const checkVersion = (): boolean => {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  
  if (storedVersion !== APP_VERSION) {
    return false; // Version mismatch - needs update
  }
  
  return true; // Version matches
};

export const updateVersion = (): void => {
  localStorage.setItem(VERSION_KEY, APP_VERSION);
};

export const clearAppCache = async (): Promise<void> => {
  // Clear localStorage except auth token
  const authToken = localStorage.getItem('auth_token');
  const loginTime = localStorage.getItem('login_time');
  
  localStorage.clear();
  
  // Restore auth if exists
  if (authToken) localStorage.setItem('auth_token', authToken);
  if (loginTime) localStorage.setItem('login_time', loginTime);
  
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
