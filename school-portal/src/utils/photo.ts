/**
 * Add cache-busting parameter to photo URL
 * This forces the browser to reload the image instead of using cached version
 */
export const addCacheBuster = (url: string | null | undefined): string => {
  if (!url) return '';
  
  // Add timestamp as query parameter to bust cache
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
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
