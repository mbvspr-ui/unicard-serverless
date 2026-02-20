/**
 * Image Processing Utilities
 * Provides functions for crop calculations, filter applications, and background color handling
 */

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AspectRatio = 'free' | '1:1' | '3:4' | '4:3';

/**
 * Calculate crop area with aspect ratio constraint
 */
export function calculateCropWithAspectRatio(
  cropArea: CropArea,
  aspectRatio: AspectRatio,
  imageWidth: number,
  imageHeight: number
): CropArea {
  if (aspectRatio === 'free') return cropArea;

  const ratios: Record<Exclude<AspectRatio, 'free'>, number> = {
    '1:1': 1,
    '3:4': 3 / 4,
    '4:3': 4 / 3,
  };

  const ratio = ratios[aspectRatio];
  const currentRatio = cropArea.width / cropArea.height;

  let result = { ...cropArea };

  if (currentRatio > ratio) {
    // Width is too large, adjust it
    const newWidth = cropArea.height * ratio;
    result.width = Math.min(newWidth, imageWidth - cropArea.x);
  } else {
    // Height is too large, adjust it
    const newHeight = cropArea.width / ratio;
    result.height = Math.min(newHeight, imageHeight - cropArea.y);
  }

  // Ensure the result doesn't exceed image bounds
  if (result.x + result.width > imageWidth) {
    result.width = imageWidth - result.x;
    // Recalculate height to maintain aspect ratio
    result.height = result.width / ratio;
  }
  if (result.y + result.height > imageHeight) {
    result.height = imageHeight - result.y;
    // Recalculate width to maintain aspect ratio
    result.width = result.height * ratio;
  }

  return result;
}

/**
 * Validate crop area meets minimum size requirements
 */
export function validateCropArea(cropArea: CropArea, minSize: number = 50): boolean {
  return cropArea.width >= minSize && cropArea.height >= minSize;
}

/**
 * Initialize crop area centered at 80% of image size
 */
export function initializeCropArea(imageWidth: number, imageHeight: number): CropArea {
  const width = imageWidth * 0.8;
  const height = imageHeight * 0.8;
  const x = (imageWidth - width) / 2;
  const y = (imageHeight - height) / 2;

  return { x, y, width, height };
}

/**
 * Constrain crop area within image bounds
 */
export function constrainCropArea(
  cropArea: CropArea,
  imageWidth: number,
  imageHeight: number
): CropArea {
  const constrained = { ...cropArea };

  // Ensure crop doesn't go outside image bounds
  if (constrained.x < 0) {
    constrained.width += constrained.x;
    constrained.x = 0;
  }
  if (constrained.y < 0) {
    constrained.height += constrained.y;
    constrained.y = 0;
  }
  if (constrained.x + constrained.width > imageWidth) {
    constrained.width = imageWidth - constrained.x;
  }
  if (constrained.y + constrained.height > imageHeight) {
    constrained.height = imageHeight - constrained.y;
  }

  // Ensure minimum size
  constrained.width = Math.max(50, constrained.width);
  constrained.height = Math.max(50, constrained.height);

  return constrained;
}

/**
 * Apply crop to canvas
 */
export function applyCropToCanvas(
  sourceCanvas: HTMLCanvasElement,
  cropArea: CropArea
): HTMLCanvasElement {
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropArea.width;
  croppedCanvas.height = cropArea.height;

  const ctx = croppedCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Draw cropped portion
  ctx.drawImage(
    sourceCanvas,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  );

  return croppedCanvas;
}

/**
 * Apply background color to transparent image
 */
export function applyBackgroundColor(
  image: HTMLImageElement,
  color: string,
  targetCanvas: HTMLCanvasElement
): void {
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Set canvas size
  targetCanvas.width = image.width;
  targetCanvas.height = image.height;

  // Fill with background color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

  // Draw image with transparency on top
  ctx.drawImage(image, 0, 0);
}

/**
 * Apply CSS filters to canvas context
 */
export function applyCSSFilters(
  ctx: CanvasRenderingContext2D,
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
  }
): void {
  ctx.filter = `
    brightness(${filters.brightness}%)
    contrast(${filters.contrast}%)
    saturate(${filters.saturation}%)
    blur(${filters.blur}px)
  `.trim().replace(/\s+/g, ' ');
}

/**
 * Apply sharpness filter using convolution matrix
 */
export function applySharpnessFilter(
  canvas: HTMLCanvasElement,
  amount: number
): void {
  if (amount <= 100) return; // No sharpening needed

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  const factor = (amount - 100) / 100; // 0-1 range

  // Sharpening convolution kernel
  const kernel = [
    0, -factor, 0,
    -factor, 1 + 4 * factor, -factor,
    0, -factor, 0
  ];

  const output = new Uint8ClampedArray(pixels);

  // Apply convolution
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels only
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            sum += pixels[pixelIndex] * kernel[kernelIndex];
          }
        }
        const outputIndex = (y * width + x) * 4 + c;
        output[outputIndex] = Math.max(0, Math.min(255, sum));
      }
    }
  }

  // Copy sharpened data back
  for (let i = 0; i < pixels.length; i++) {
    if (i % 4 !== 3) { // Skip alpha channel
      pixels[i] = output[i];
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Resize image to fit within max dimensions while maintaining aspect ratio
 */
export function calculateResizedDimensions(
  width: number,
  height: number,
  maxSize: number = 800
): { width: number; height: number } {
  if (width <= maxSize && height <= maxSize) {
    return { width, height };
  }

  if (width > height) {
    return {
      width: maxSize,
      height: (height / width) * maxSize,
    };
  } else {
    return {
      width: (width / height) * maxSize,
      height: maxSize,
    };
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Convert canvas to blob with quality settings
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string = 'image/jpeg',
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * Load image from URL with CORS support
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Load image from File object
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image from file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress image to target size range (500KB - 1MB)
 * If image is already under 1MB, returns it as-is
 * If over 1MB, compresses to between 500KB and 1MB
 */
export async function compressImageIfNeeded(
  blob: Blob,
  targetMinSize: number = 500 * 1024, // 500KB
  targetMaxSize: number = 1024 * 1024  // 1MB
): Promise<Blob> {
  // If already under max size, return as-is
  if (blob.size <= targetMaxSize) {
    return blob;
  }

  // Load image from blob
  const img = await loadImage(URL.createObjectURL(blob));
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  ctx.drawImage(img, 0, 0);

  // Binary search for optimal quality
  let minQuality = 0.1;
  let maxQuality = 0.95;
  let bestBlob: Blob = blob;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts && maxQuality - minQuality > 0.05) {
    const quality = (minQuality + maxQuality) / 2;
    const testBlob = await canvasToBlob(canvas, 'image/jpeg', quality);
    
    if (testBlob.size <= targetMaxSize && testBlob.size >= targetMinSize) {
      // Perfect! Within target range
      bestBlob = testBlob;
      break;
    } else if (testBlob.size > targetMaxSize) {
      // Too large, reduce quality
      maxQuality = quality;
    } else {
      // Too small, increase quality
      minQuality = quality;
      bestBlob = testBlob; // Keep this as best so far
    }
    
    attempts++;
  }

  // If we couldn't get into range, use the best we found
  if (bestBlob.size > targetMaxSize) {
    // One more attempt with lower quality
    bestBlob = await canvasToBlob(canvas, 'image/jpeg', minQuality);
  }
  
  return bestBlob;
}
