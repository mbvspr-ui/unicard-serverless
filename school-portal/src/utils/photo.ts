/**
 * Add cache-busting parameter to photo URL
 * This forces the browser to reload the image instead of using cached version
 */
export const addCacheBuster = (url: string | null | undefined): string => {
  if (!url) return '';
  
  // Remove any existing cache buster
  const baseUrl = url.split('?')[0].split('&t=')[0];
  
  // Add timestamp as query parameter to bust cache
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}t=${Date.now()}`;
};

/**
 * Get photo URL with cache buster for display
 * Use this when displaying photos that might have been recently updated
 */
export const getPhotoUrl = (url: string | null | undefined, bustCache: boolean = false): string => {
  if (!url) return '';
  
  if (bustCache) {
    return addCacheBuster(url);
  }
  
  return url;
};

/**
 * Clear photo from browser cache
 * Call this after uploading a new photo to ensure immediate reflection
 */
export const clearPhotoCache = async (url: string | null | undefined): Promise<void> => {
  if (!url) return;
  
  const baseUrl = url.split('?')[0];
  
  // Clear from browser cache
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (name) => {
          const cache = await caches.open(name);
          await cache.delete(baseUrl);
          // Also try with common variations
          await cache.delete(url);
          await cache.delete(baseUrl + '/');
        })
      );
    } catch (error) {
      console.error('Error clearing photo cache:', error);
    }
  }
};

