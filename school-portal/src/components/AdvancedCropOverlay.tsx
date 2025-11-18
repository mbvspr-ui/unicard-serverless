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
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Compact Header with aspect ratio controls */}
      <div className="px-2 py-2 sm:px-4 sm:py-3 bg-gray-900 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-white text-sm sm:text-base font-medium flex-shrink-0">Crop</h3>
          <div className="flex gap-1 sm:gap-2">
            {aspectRatioPresets.map((preset) => (
              <Button
                key={preset.label}
                onClick={() => setCurrentAspectRatio(preset.ratio)}
                variant={currentAspectRatio === preset.ratio ? "default" : "outline"}
                size="sm"
                className="h-8 px-2 sm:px-3 text-xs touch-manipulation"
              >
                {preset.icon}
                <span className="ml-1 hidden sm:inline">{preset.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Cropper - Takes remaining space */}
      <div className="flex-1 relative touch-none overflow-hidden">
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

      {/* Compact Footer with buttons - Above bottom nav on mobile */}
      <div className="px-2 py-2 sm:px-4 sm:py-3 bg-gray-900 border-t border-gray-700 flex-shrink-0 mb-16 sm:mb-0">
        <p className="text-gray-400 text-xs text-center mb-2">
          Drag to move • Pinch to resize
        </p>
        <div className="flex gap-2 max-w-md mx-auto">
          <Button
            onClick={onCancel}
            variant="outline"
            size="lg"
            className="flex-1 h-10 sm:h-11 text-sm touch-manipulation"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            size="lg"
            className="flex-1 h-10 sm:h-11 text-sm bg-blue-600 hover:bg-blue-700 touch-manipulation"
          >
            <Check className="w-4 h-4 mr-1" />
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};
