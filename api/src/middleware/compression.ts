import { Request, Response, NextFunction } from 'express';
import zlib from 'zlib';

// Compression middleware for API responses
export function compressionMiddleware(req: Request, res: Response, next: NextFunction) {
  const acceptEncoding = req.headers['accept-encoding'] || '';

  // Check if client accepts gzip
  if (!acceptEncoding.includes('gzip')) {
    return next();
  }

  // Store original methods
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // Override json method
  res.json = function (data: any) {
    const jsonString = JSON.stringify(data);
    
    // Only compress if response is large enough (> 1KB)
    if (jsonString.length < 1024) {
      return originalJson(data);
    }

    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Content-Type', 'application/json');

    zlib.gzip(jsonString, (err, compressed) => {
      if (err) {
        return originalJson(data);
      }
      res.send(compressed);
    });

    return res;
  };

  // Override send method
  res.send = function (data: any) {
    if (typeof data === 'string' && data.length > 1024) {
      res.setHeader('Content-Encoding', 'gzip');
      
      zlib.gzip(data, (err, compressed) => {
        if (err) {
          return originalSend(data);
        }
        originalSend(compressed);
      });

      return res;
    }

    return originalSend(data);
  };

  next();
}

// Helper to check if response should be compressed
export function shouldCompress(req: Request, res: Response): boolean {
  const contentType = res.getHeader('Content-Type') as string;
  
  // Don't compress images, videos, or already compressed files
  if (contentType) {
    if (contentType.includes('image/')) return false;
    if (contentType.includes('video/')) return false;
    if (contentType.includes('application/zip')) return false;
    if (contentType.includes('application/gzip')) return false;
  }

  return true;
}
