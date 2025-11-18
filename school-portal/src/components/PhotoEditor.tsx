import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { Upload, Camera, RotateCw, Sparkles, Crop, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from './ui/loading-spinner';
import { AdvancedCropOverlay } from './AdvancedCropOverlay';
import { ColorPicker } from './ColorPicker';
import {
  applyCSSFilters,
  applySharpnessFilter,
  calculateResizedDimensions,
  canvasToBlob,
  loadImage,
  loadImageFromFile,
} from '../utils/imageProcessing';

const BG_REMOVAL_URL = import.meta.env.VITE_BG_REMOVAL_URL || 'http://localhost:5000';

interface PhotoEditorProps {
  onClose: () => void;
  onSave: (blob: Blob) => void;
  initialImage?: string | null;
}

export const PhotoEditor = ({ onClose, onSave, initialImage }: PhotoEditorProps) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Image adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [sharpness, setSharpness] = useState(100);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  // Crop
  const [isCropping, setIsCropping] = useState(false);
  
  // Background
  const [hasTransparentBg, setHasTransparentBg] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  
  // Camera
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  // Loading states
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    if (initialImage) {
      loadImage(initialImage)
        .then((img) => {
          setImage(img);
          setOriginalImage(img);
        })
        .catch((error) => {
          console.error('Failed to load initial image:', error);
          toast.error('Failed to load image');
        });
    }
  }, [initialImage]);

  // Draw image effect
  useEffect(() => {
    if (image && canvasRef.current && !isCropping) {
      // Use a small timeout for debouncing
      const timeoutId = setTimeout(() => {
        drawImage();
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [image, brightness, contrast, saturation, blur, sharpness, scale, rotation, hasTransparentBg, backgroundColor, isCropping]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const drawImage = () => {
    console.log('drawImage called');
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) {
      console.log('drawImage skipped - canvas:', !!canvas, 'ctx:', !!ctx, 'image:', !!image);
      return;
    }
    console.log('Drawing image:', image.width, 'x', image.height);

    // Calculate canvas size
    const { width, height } = calculateResizedDimensions(image.width, image.height, 800);
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply background color if transparent
    if (hasTransparentBg) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Save context state
    ctx.save();

    // Apply transformations
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    // Apply CSS filters
    applyCSSFilters(ctx, { brightness, contrast, saturation, blur });

    // Draw image
    ctx.drawImage(image, 0, 0, width, height);

    // Restore context
    ctx.restore();

    // Apply sharpness (requires separate processing)
    if (sharpness > 100) {
      try {
        applySharpnessFilter(canvas, sharpness);
      } catch (error) {
        console.error('Sharpness filter error:', error);
      }
    }

    // Copy to display canvas
    const displayCanvas = document.getElementById('display-canvas') as HTMLCanvasElement;
    if (displayCanvas) {
      displayCanvas.width = width;
      displayCanvas.height = height;
      const displayCtx = displayCanvas.getContext('2d');
      if (displayCtx) {
        displayCtx.drawImage(canvas, 0, 0);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setIsProcessing(true);
      const img = await loadImageFromFile(file);
      
      // If file is large, show compression info
      if (file.size > 1024 * 1024) {
        toast.info('Optimizing image size...');
      }
      
      setImage(img);
      setOriginalImage(img);
      setHasTransparentBg(false);
      resetFilters();
    } catch (error) {
      console.error('File load error:', error);
      toast.error('Failed to load image');
    } finally {
      setIsProcessing(false);
    }
  };

  const startCamera = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        console.error('MediaDevices API not supported');
        return;
      }

      console.log('Requesting camera access...');
      console.log('Browser:', navigator.userAgent);
      console.log('Protocol:', window.location.protocol);
      
      // First, set camera active to show the video element
      setIsCameraActive(true);
      setIsCameraReady(false);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        }
      });
      
      console.log('Camera access granted!');
      console.log('Stream tracks:', mediaStream.getTracks().map(t => ({
        kind: t.kind,
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState
      })));
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        console.log('Setting video srcObject...');
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, attempting to play...');
          videoRef.current?.play()
            .then(() => {
              console.log('Video playing successfully!');
              setIsCameraReady(true);
              toast.success('Camera ready! Position yourself and click Capture.');
            })
            .catch((playError) => {
              console.error('Video play error:', playError);
              setIsCameraReady(false);
              toast.error('Failed to start video playback. Please try again.');
            });
        };
      } else {
        console.error('Video ref is null!');
        toast.error('Video element not ready. Please try again.');
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Reset camera state on error
      setIsCameraActive(false);
      setIsCameraReady(false);
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Camera access denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No camera found. Please connect a camera and try again.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error('Camera is already in use by another application. Please close other apps using the camera.');
      } else if (error.name === 'OverconstrainedError') {
        toast.error('Camera does not meet the requirements. Trying with default settings...');
        // Try again with simpler constraints
        try {
          setIsCameraActive(true);
          setIsCameraReady(false);
          const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true });
          console.log('Simple stream obtained:', simpleStream);
          setStream(simpleStream);
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream;
            await videoRef.current.play();
            console.log('Playing with simple constraints');
            setIsCameraReady(true);
          }
          toast.success('Camera started with default settings!');
        } catch (retryError) {
          console.error('Retry error:', retryError);
          setIsCameraActive(false);
          setIsCameraReady(false);
          toast.error('Failed to start camera with default settings.');
        }
      } else {
        toast.error(`Camera error: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const capturePhoto = async () => {
    console.log('capturePhoto called');
    console.log('videoRef.current:', videoRef.current);
    console.log('canvasRef.current:', canvasRef.current);
    
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      
      if (!ctx) {
        console.error('Failed to get canvas context');
        toast.error('Failed to get canvas context');
        return;
      }

      // Check if video is ready
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('Video not ready - dimensions are 0');
        toast.error('Camera is not ready yet. Please wait a moment.');
        return;
      }

      console.log('Setting canvas dimensions and drawing...');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      console.log('Converting to blob...');
      try {
        const blob = await canvasToBlob(canvas, 'image/jpeg', 0.95);
        console.log('Blob created:', blob);
        
        // Compress if needed
        const { compressImageIfNeeded } = await import('../utils/imageProcessing');
        const compressedBlob = await compressImageIfNeeded(blob);
        
        const img = new Image();
        img.onload = () => {
          console.log('Image loaded from blob');
          setImage(img);
          setOriginalImage(img);
          stopCamera();
          toast.success('Photo captured! You can now edit it.');
        };
        img.src = URL.createObjectURL(compressedBlob);
      } catch (error) {
        console.error('Capture error:', error);
        toast.error('Failed to capture photo. Please try again.');
      }
    } else {
      console.error('videoRef or canvasRef is null');
      console.log('videoRef.current:', videoRef.current);
      console.log('canvasRef.current:', canvasRef.current);
      toast.error('Camera or canvas not ready. Please try again.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setIsCameraReady(false);
  };

  const handleRemoveBackground = async () => {
    if (!canvasRef.current) return;

    setIsRemovingBg(true);
    try {
      const blob = await canvasToBlob(canvasRef.current, 'image/png');

      const formData = new FormData();
      formData.append('image', blob);

      const response = await fetch(`${BG_REMOVAL_URL}/remove-background`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Background removal failed');
      }

      const data = await response.json();
      
      if (data.success && data.image) {
        const img = await loadImage(data.image);
        setImage(img);
        setHasTransparentBg(true);
        setBackgroundColor('#FFFFFF');
        toast.success('Background removed! White background applied.');
      } else {
        throw new Error('Invalid response from background removal service');
      }
    } catch (error) {
      console.error('Background removal error:', error);
      toast.error('Background removal service is temporarily unavailable. Please try again later.');
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleCropStart = () => {
    setIsCropping(true);
  };

  const handleCropApply = async (croppedCanvas: HTMLCanvasElement) => {
    console.log('handleCropApply called');
    console.log('Cropped canvas dimensions:', croppedCanvas.width, 'x', croppedCanvas.height);
    
    setIsProcessing(true);
    try {
      // Create new image from cropped canvas
      const blob = await canvasToBlob(croppedCanvas, 'image/png');
      console.log('Blob created:', blob?.size, 'bytes');
      
      const imageUrl = URL.createObjectURL(blob);
      console.log('Image URL created:', imageUrl);
      
      const img = await loadImage(imageUrl);
      console.log('Image loaded:', img.width, 'x', img.height);
      
      // Close crop overlay first
      setIsCropping(false);
      
      // Then set the new image (this will trigger drawImage via useEffect)
      setImage(img);
      setOriginalImage(img);
      
      console.log('Image state updated');
      toast.success('Crop applied successfully!');
    } catch (error) {
      console.error('Crop error:', error);
      toast.error('Failed to apply crop. Please try again.');
      setIsCropping(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setSharpness(100);
    setScale(1);
    setRotation(0);
    toast.success('Filters reset to defaults');
  };

  const handleSave = async () => {
    if (!canvasRef.current) {
      toast.error('No image to save');
      return;
    }

    try {
      setIsProcessing(true);
      const blob = await canvasToBlob(canvasRef.current, 'image/jpeg', 0.9);
      
      // Compress if needed (target: 500KB - 1MB)
      const { compressImageIfNeeded } = await import('../utils/imageProcessing');
      const compressedBlob = await compressImageIfNeeded(blob);
      
      if (compressedBlob.size !== blob.size) {
        toast.success(`Photo optimized: ${(compressedBlob.size / 1024).toFixed(0)}KB`);
      }
      
      onSave(compressedBlob);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto md:max-w-full md:max-h-full md:h-screen md:m-0 md:rounded-none">
        <DialogHeader>
          <DialogTitle>Photo Editor</DialogTitle>
          <DialogDescription>
            Upload, capture, and edit student photos with filters and background removal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload/Camera Controls */}
          {!image && !isCameraActive && (
            <div className="flex flex-col gap-3 p-4">
              <p className="text-sm text-gray-600 text-center mb-2">
                Upload a photo or take one with your camera to get started
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full h-12"
                title="Upload a photo from your device"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Photo
              </Button>
              <Button
                onClick={() => {
                  console.log('Camera button clicked');
                  startCamera();
                }}
                variant="outline"
                className="w-full h-12"
                title="Take a photo with your camera"
              >
                <Camera className="w-5 h-5 mr-2" />
                Open Camera
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Click "Open Camera" to see live preview and capture
              </p>
              <p className="text-xs text-blue-600 text-center">
                Note: Camera requires HTTPS or localhost. Check browser console for details.
              </p>
            </div>
          )}

          {/* Camera View */}
          {isCameraActive && (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg overflow-hidden relative" style={{ minHeight: '400px' }}>
                <video
                  ref={videoRef}
                  className="w-full h-auto block"
                  autoPlay
                  playsInline
                  muted
                  style={{ 
                    maxHeight: '60vh',
                    objectFit: 'contain',
                    backgroundColor: '#000'
                  }}
                  onError={(e) => {
                    console.error('Video error:', e);
                    setIsCameraReady(false);
                    toast.error('Video playback error. Please try again.');
                  }}
                />
                {/* Loading indicator while camera initializes */}
                {!isCameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center text-white">
                      <LoadingSpinner className="mx-auto mb-2" />
                      <p>Initializing camera...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Position yourself in the frame and click Capture
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={capturePhoto} 
                    className="flex-1 h-12 text-base"
                    disabled={!isCameraReady}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Capture Photo
                  </Button>
                  <Button onClick={stopCamera} variant="outline" className="h-12">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Hidden canvas for camera capture - always available */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Image Editor */}
          {image && !isCameraActive && (
            <div className="space-y-4">
              {/* Canvas Display */}
              <div className="relative flex justify-center bg-gray-100 rounded-lg p-4 max-h-[50vh] md:max-h-[60vh] overflow-hidden">
                <canvas
                  id="display-canvas"
                  className="max-w-full h-auto border border-gray-300 rounded"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="bg-white p-4 rounded-lg flex items-center gap-3">
                      <LoadingSpinner />
                      <span>Processing...</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Advanced Crop Overlay (Full Screen) */}
              {isCropping && image && (
                <AdvancedCropOverlay
                  image={image.src}
                  aspectRatio={1} // Square crop for ID photos
                  onApply={handleCropApply}
                  onCancel={handleCropCancel}
                />
              )}

              {/* Controls */}
              <div className="space-y-4 max-h-[40vh] md:max-h-none overflow-y-auto md:overflow-visible px-1">
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleCropStart}
                    variant="outline"
                    size="sm"
                    disabled={isCropping}
                    title="Crop the image"
                    className="min-h-[44px]"
                  >
                    <Crop className="w-4 h-4 mr-2" />
                    Crop
                  </Button>
                  <Button
                    onClick={handleRotate}
                    variant="outline"
                    size="sm"
                    disabled={isCropping}
                    title="Rotate 90 degrees"
                    className="min-h-[44px]"
                  >
                    <RotateCw className="w-4 h-4 mr-2" />
                    Rotate
                  </Button>
                  <Button
                    onClick={handleRemoveBackground}
                    variant="outline"
                    size="sm"
                    disabled={isRemovingBg || isCropping}
                    title="Remove background using AI"
                    className="min-h-[44px]"
                  >
                    {isRemovingBg ? (
                      <>
                        <LoadingSpinner className="mr-2" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Remove Background
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    disabled={isCropping}
                    title="Change to a different photo"
                    className="min-h-[44px]"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Change Photo
                  </Button>
                  <Button
                    onClick={resetFilters}
                    variant="outline"
                    size="sm"
                    disabled={isCropping}
                    title="Reset all filters to default"
                    className="min-h-[44px]"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Filters
                  </Button>
                </div>

                {/* Background Color Picker */}
                {hasTransparentBg && !isCropping && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <ColorPicker
                      currentColor={backgroundColor}
                      onColorChange={setBackgroundColor}
                    />
                  </div>
                )}



                {/* Filter Sliders */}
                {!isCropping && (
                  <div className="space-y-3">
                    <div>
                      <Label>Brightness: {brightness}%</Label>
                      <Slider
                        value={[brightness]}
                        onValueChange={([value]) => setBrightness(value)}
                        min={50}
                        max={150}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Contrast: {contrast}%</Label>
                      <Slider
                        value={[contrast]}
                        onValueChange={([value]) => setContrast(value)}
                        min={50}
                        max={150}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Saturation: {saturation}%</Label>
                      <Slider
                        value={[saturation]}
                        onValueChange={([value]) => setSaturation(value)}
                        min={0}
                        max={200}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Blur: {blur}px</Label>
                      <Slider
                        value={[blur]}
                        onValueChange={([value]) => setBlur(value)}
                        min={0}
                        max={10}
                        step={0.5}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Sharpness: {sharpness}%</Label>
                      <Slider
                        value={[sharpness]}
                        onValueChange={([value]) => setSharpness(value)}
                        min={0}
                        max={200}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Zoom: {Math.round(scale * 100)}%</Label>
                      <Slider
                        value={[scale]}
                        onValueChange={([value]) => setScale(value)}
                        min={0.5}
                        max={2}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Save/Cancel Buttons */}
              {!isCropping && (
                <div className="flex gap-2 pt-4 border-t sticky bottom-0 bg-white md:relative">
                  <Button onClick={onClose} variant="outline" className="flex-1 h-12">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="flex-1 h-12">
                    Save Photo
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
