import { useRef, useState } from 'react';
import { Cropper, CropperRef } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import { Button } from './ui/button';
import { Check, X, Square, Maximize, RotateCw, Move } from 'lucide-react';

interface AdvancedCropOverlayProps {
  image: string;
  aspectRatio?: number;
  onApply: (canvas: HTMLCanvasElement) => void;
  onCancel: () => void;
}

type AspectRatioPreset = {
  label: string;
  ratio: number | undefined;
  icon: React.ReactNode;
};

const aspectRatioPresets: AspectRatioPreset[] = [
  { label: 'Free', ratio: undefined, icon: <Move className="w-4 h-4" /> },
  { label: 'Square', ratio: 1, icon: <Square className="w-4 h-4" /> },
  { label: 'Portrait', ratio: 3/4, icon: <RotateCw className="w-4 h-4" /> },
  { label: 'Landscape', ratio: 4/3, icon: <Maximize className="w-4 h-4" /> },
];

export const AdvancedCropOverlay = ({
  image,
  aspectRatio: initialAspectRatio,
  onApply,
  onCancel,
}: AdvancedCropOverlayProps) => {
  const cropperRef = useRef<CropperRef>(null);
  const [currentAspectRatio, setCurrentAspectRatio] = useState<number | undefined>(initialAspectRatio || 1);

  const handleApply = () => {
    console.log('AdvancedCropOverlay handleApply clicked');
    const cropper = cropperRef.current;
    console.log('Cropper ref:', cropper);
    
    if (cropper) {
      const canvas = cropper.getCanvas();
      console.log('Canvas from cropper:', canvas);
      
      if (canvas) {
        console.log('Calling onApply with canvas');
        onApply(canvas);
      } else {
        console.error('Canvas is null from cropper.getCanvas()');
      }
    } else {
      console.error('Cropper ref is null');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="h-full flex flex-col">
        {/* Header with aspect ratio controls */}
        <div className="p-3 sm:p-4 bg-gray-900 border-b border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-white text-base sm:text-lg font-medium">Crop Photo</h3>
            <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
              {aspectRatioPresets.map((preset) => (
                <Button
                  key={preset.label}
                  onClick={() => setCurrentAspectRatio(preset.ratio)}
                  variant={currentAspectRatio === preset.ratio ? "default" : "outline"}
                  size="sm"
                  className="min-w-[70px] sm:min-w-[80px] h-9 text-xs sm:text-sm touch-manipulation"
                >
                  {preset.icon}
                  <span className="ml-1">{preset.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Cropper */}
        <div className="flex-1 relative touch-none">
          <Cropper
            ref={cropperRef}
            src={image}
            className="h-full w-full"
            stencilProps={{
              aspectRatio: currentAspectRatio,
              grid: true,
              movable: true,
              resizable: true,
            }}
            backgroundClassName="bg-black"
          />
        </div>

        {/* Instructions and action buttons */}
        <div className="p-3 sm:p-4 bg-gray-900 border-t border-gray-700 safe-area-bottom">
          <div className="text-center mb-3 sm:mb-4">
            <p className="text-gray-300 text-xs sm:text-sm mb-1">
              <span className="hidden sm:inline">Drag to move • Resize corners to adjust • Choose aspect ratio above</span>
              <span className="sm:hidden">Drag to move • Pinch to resize</span>
            </p>
            <p className="text-gray-400 text-xs hidden sm:block">
              Perfect for ID photos: Use Square ratio for best results
            </p>
          </div>
          
          <div className="flex gap-2 sm:gap-3 max-w-md mx-auto">
            <Button
              onClick={onCancel}
              variant="outline"
              size="lg"
              className="flex-1 h-11 sm:h-12 text-sm sm:text-base touch-manipulation"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              size="lg"
              className="flex-1 h-11 sm:h-12 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 touch-manipulation"
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
