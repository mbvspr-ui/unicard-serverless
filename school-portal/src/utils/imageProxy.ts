const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

/**
 * Get proxied image URL to avoid CORS issues
 * @param imageUrl - The original R2 image URL
 * @returns Proxied URL through our API
 */
export const getProxiedImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;
  
  // If it's already a blob URL or data URL, return as is
  if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // If it's from our R2 bucket, proxy it
  if (imageUrl.includes('r2.dev') || imageUrl.includes('r2.cloudflarestorage.com')) {
    return `${API_URL}/api/proxy/image?url=${encodeURIComponent(imageUrl)}`;
  }
  
  // Otherwise return as is
  return imageUrl;
};
