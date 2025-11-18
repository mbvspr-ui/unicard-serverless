import { describe, it, expect } from 'vitest';
import {
  calculateCropWithAspectRatio,
  validateCropArea,
  initializeCropArea,
  constrainCropArea,
  calculateResizedDimensions,
  type CropArea,
  type AspectRatio,
} from '../imageProcessing';

describe('imageProcessing utilities', () => {
  describe('calculateCropWithAspectRatio', () => {
    it('should maintain free aspect ratio', () => {
      const cropArea: CropArea = { x: 10, y: 10, width: 100, height: 80 };
      const result = calculateCropWithAspectRatio(cropArea, 'free', 500, 500);
      expect(result).toEqual(cropArea);
    });

    it('should enforce 1:1 aspect ratio', () => {
      const cropArea: CropArea = { x: 10, y: 10, width: 100, height: 80 };
      const result = calculateCropWithAspectRatio(cropArea, '1:1', 500, 500);
      expect(result.width).toBe(result.height);
    });

    it('should enforce 3:4 aspect ratio', () => {
      const cropArea: CropArea = { x: 10, y: 10, width: 120, height: 100 };
      const result = calculateCropWithAspectRatio(cropArea, '3:4', 500, 500);
      const ratio = result.width / result.height;
      expect(ratio).toBeCloseTo(0.75, 2);
    });

    it('should enforce 4:3 aspect ratio', () => {
      const cropArea: CropArea = { x: 10, y: 10, width: 100, height: 120 };
      const result = calculateCropWithAspectRatio(cropArea, '4:3', 500, 500);
      const ratio = result.width / result.height;
      expect(ratio).toBeCloseTo(1.333, 2);
    });

    it('should not exceed image bounds', () => {
      const cropArea: CropArea = { x: 400, y: 400, width: 200, height: 200 };
      const result = calculateCropWithAspectRatio(cropArea, '1:1', 500, 500);
      expect(result.x + result.width).toBeLessThanOrEqual(500);
      expect(result.y + result.height).toBeLessThanOrEqual(500);
    });
  });

  describe('validateCropArea', () => {
    it('should validate crop area with sufficient size', () => {
      const cropArea: CropArea = { x: 0, y: 0, width: 100, height: 100 };
      expect(validateCropArea(cropArea, 50)).toBe(true);
    });

    it('should reject crop area below minimum width', () => {
      const cropArea: CropArea = { x: 0, y: 0, width: 40, height: 100 };
      expect(validateCropArea(cropArea, 50)).toBe(false);
    });

    it('should reject crop area below minimum height', () => {
      const cropArea: CropArea = { x: 0, y: 0, width: 100, height: 40 };
      expect(validateCropArea(cropArea, 50)).toBe(false);
    });

    it('should use default minimum size of 50', () => {
      const cropArea: CropArea = { x: 0, y: 0, width: 49, height: 49 };
      expect(validateCropArea(cropArea)).toBe(false);
    });

    it('should accept crop area at exactly minimum size', () => {
      const cropArea: CropArea = { x: 0, y: 0, width: 50, height: 50 };
      expect(validateCropArea(cropArea)).toBe(true);
    });
  });

  describe('initializeCropArea', () => {
    it('should create crop area at 80% of image size', () => {
      const result = initializeCropArea(1000, 800);
      expect(result.width).toBe(800);
      expect(result.height).toBe(640);
    });

    it('should center the crop area', () => {
      const result = initializeCropArea(1000, 800);
      expect(result.x).toBe(100); // (1000 - 800) / 2
      expect(result.y).toBe(80);  // (800 - 640) / 2
    });

    it('should work with small images', () => {
      const result = initializeCropArea(100, 100);
      expect(result.width).toBe(80);
      expect(result.height).toBe(80);
      expect(result.x).toBe(10);
      expect(result.y).toBe(10);
    });

    it('should work with non-square images', () => {
      const result = initializeCropArea(1600, 900);
      expect(result.width).toBe(1280);
      expect(result.height).toBe(720);
    });
  });

  describe('constrainCropArea', () => {
    it('should constrain crop area within image bounds', () => {
      const cropArea: CropArea = { x: -10, y: -10, width: 100, height: 100 };
      const result = constrainCropArea(cropArea, 500, 500);
      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.y).toBeGreaterThanOrEqual(0);
    });

    it('should adjust width when exceeding right boundary', () => {
      const cropArea: CropArea = { x: 450, y: 0, width: 100, height: 100 };
      const result = constrainCropArea(cropArea, 500, 500);
      expect(result.x + result.width).toBeLessThanOrEqual(500);
    });

    it('should adjust height when exceeding bottom boundary', () => {
      const cropArea: CropArea = { x: 0, y: 450, width: 100, height: 100 };
      const result = constrainCropArea(cropArea, 500, 500);
      expect(result.y + result.height).toBeLessThanOrEqual(500);
    });

    it('should enforce minimum size of 50', () => {
      const cropArea: CropArea = { x: 0, y: 0, width: 10, height: 10 };
      const result = constrainCropArea(cropArea, 500, 500);
      expect(result.width).toBeGreaterThanOrEqual(50);
      expect(result.height).toBeGreaterThanOrEqual(50);
    });

    it('should handle crop area at edge of image', () => {
      const cropArea: CropArea = { x: 400, y: 400, width: 150, height: 150 };
      const result = constrainCropArea(cropArea, 500, 500);
      expect(result.x + result.width).toBeLessThanOrEqual(500);
      expect(result.y + result.height).toBeLessThanOrEqual(500);
    });

    it('should not modify valid crop area', () => {
      const cropArea: CropArea = { x: 100, y: 100, width: 200, height: 200 };
      const result = constrainCropArea(cropArea, 500, 500);
      expect(result).toEqual(cropArea);
    });
  });

  describe('calculateResizedDimensions', () => {
    it('should not resize if within max size', () => {
      const result = calculateResizedDimensions(600, 400, 800);
      expect(result).toEqual({ width: 600, height: 400 });
    });

    it('should resize width when exceeding max size', () => {
      const result = calculateResizedDimensions(1000, 500, 800);
      expect(result.width).toBe(800);
      expect(result.height).toBe(400);
    });

    it('should resize height when exceeding max size', () => {
      const result = calculateResizedDimensions(500, 1000, 800);
      expect(result.width).toBe(400);
      expect(result.height).toBe(800);
    });

    it('should maintain aspect ratio', () => {
      const result = calculateResizedDimensions(1600, 1200, 800);
      const originalRatio = 1600 / 1200;
      const newRatio = result.width / result.height;
      expect(newRatio).toBeCloseTo(originalRatio, 2);
    });

    it('should handle square images', () => {
      const result = calculateResizedDimensions(1000, 1000, 800);
      expect(result.width).toBe(800);
      expect(result.height).toBe(800);
    });

    it('should handle very wide images', () => {
      const result = calculateResizedDimensions(2000, 500, 800);
      expect(result.width).toBe(800);
      expect(result.height).toBe(200);
    });

    it('should handle very tall images', () => {
      const result = calculateResizedDimensions(500, 2000, 800);
      expect(result.width).toBe(200);
      expect(result.height).toBe(800);
    });

    it('should use default max size of 800', () => {
      const result = calculateResizedDimensions(1000, 1000);
      expect(result.width).toBe(800);
      expect(result.height).toBe(800);
    });
  });
});
