import { Request, Response } from 'express';
import fetch from 'node-fetch';

/**
 * Proxy images from R2 to avoid CORS issues
 */
export const proxyImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const imageUrl = req.query.url as string;
    
    if (!imageUrl) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_URL', message: 'Image URL is required' },
      });
      return;
    }

    // Validate URL is from our R2 bucket
    const allowedDomains = [
      'pub-af43128f82384d28a2d12815bcc09389.r2.dev',
      process.env.R2_PUBLIC_URL?.replace('https://', ''),
    ].filter(Boolean);

    const url = new URL(imageUrl);
    if (!allowedDomains.some(domain => url.hostname.includes(domain as string))) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Invalid image URL' },
      });
      return;
    }

    // Fetch image from R2
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      res.status(response.status).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch image' },
      });
      return;
    }

    // Get content type
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Stream image to response
    const buffer = await response.buffer();
    res.send(buffer);
  } catch (error) {
    console.error('Proxy image error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to proxy image' },
    });
  }
};
