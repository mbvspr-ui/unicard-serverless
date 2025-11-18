// Simple in-memory cache for location data and other static content
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache: Map<string, CacheEntry> = new Map();

  set(key: string, data: any, ttl: number = 3600000): void {
    // Default TTL: 1 hour
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new Cache();

// Run cleanup every 10 minutes
setInterval(() => {
  cache.cleanup();
}, 600000);

// Cache middleware for Express routes
export function cacheMiddleware(ttl: number = 3600000) {
  return (req: any, res: any, next: any) => {
    const key = `cache:${req.method}:${req.originalUrl}`;
    const cachedData = cache.get(key);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = (data: any) => {
      cache.set(key, data, ttl);
      return originalJson(data);
    };

    next();
  };
}
