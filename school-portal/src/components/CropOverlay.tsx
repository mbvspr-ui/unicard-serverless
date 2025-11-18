import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Check, X } from 'lucide-react';
import { CropArea, AspectRatio, constrainCropArea, calculateCropWithAspectRatio } from '../utils/imageProcessing';

interface CropOverlayProps {
  imageWidth: number;
  imageHeight: number;
  cropArea: CropArea;
  aspectRatio: AspectRatio;
  onCropChange: (area: CropArea) => void;
  onApply: () => void;
  onCancel: () => void;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move';

export const CropOverlay = ({
  imageWidth,
  imageHeight,
  cropArea,
  aspectRatio,
  onCropChange,
  onApply,
  onCancel,
}: CropOverlayProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<ResizeHandle | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState<CropArea>(cropArea);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !dragHandle) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;

      let newCrop = { ...initialCrop };

      if (dragHandle === 'move') {
        // Move entire crop area
        newCrop.x = initialCrop.x + deltaX;
        newCrop.y = initialCrop.y + deltaY;
      } else {
        // Resize based on handle
        if (dragHandle.includes('n')) {
          newCrop.y = initialCrop.y + deltaY;
          newCrop.height = initialCrop.height - deltaY;
        }
        if (dragHandle.includes('s')) {
          newCrop.height = initialCrop.height + deltaY;
        }
        if (dragHandle.includes('w')) {
          newCrop.x = initialCrop.x + deltaX;
          newCrop.width = initialCrop.width - deltaX;
        }
        if (dragHandle.includes('e')) {
          newCrop.width = initialCrop.width + deltaX;
        }
      }

      // Apply aspect ratio constraint
      if (aspectRatio !== 'free' && dragHandle !== 'move') {
        newCrop = calculateCropWithAspectRatio(newCrop, aspectRatio, imageWidth, imageHeight);
      }

      // Constrain to image bounds
      newCrop = constrainCropArea(newCrop, imageWidth, imageHeight);

      onCropChange(newCrop);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragHandle(null);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleMouseMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, dragHandle, dragStart, initialCrop, aspectRatio, imageWidth, imageHeight, onCropChange]);

  const handleMouseDown = (handle: ResizeHandle) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    setDragHandle(handle);
    setDragStart({ x: clientX, y: clientY });
    setInitialCrop(cropArea);
  };

  const handleStyle = 'w-12 h-12 bg-white border-3 border-blue-500 rounded-full cursor-pointer hover:bg-blue-50 active:bg-blue-100 transition-all hover:scale-110 shadow-lg';
  const edgeHandleStyle = 'w-10 h-10 bg-white border-2 border-blue-400 rounded-full cursor-pointer hover:bg-blue-50 active:bg-blue-100 transition-all hover:scale-110 shadow-md';

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-50"
      style={{ touchAction: 'none' }}
    >
      {/* Darkened overlay outside crop area */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="crop-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={cropArea.x}
              y={cropArea.y}
              width={cropArea.width}
              height={cropArea.height}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="black"
          opacity="0.5"
          mask="url(#crop-mask)"
        />
      </svg>

      {/* Crop area border and grid */}
      <div
        className="absolute border-2 border-blue-500 pointer-events-none"
        style={{
          left: cropArea.x,
          top: cropArea.y,
          width: cropArea.width,
          height: cropArea.height,
        }}
      >
        {/* Rule of thirds grid */}
        <svg className="w-full h-full">
          <line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="66.66%" y1="0" x2="66.66%" y2="100%" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="0" y1="33.33%" x2="100%" y2="33.33%" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="0" y1="66.66%" x2="100%" y2="66.66%" stroke="white" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>

      {/* Move handle (center of crop area) */}
      <div
        className="absolute cursor-move"
        style={{
          left: cropArea.x,
          top: cropArea.y,
          width: cropArea.width,
          height: cropArea.height,
        }}
        onMouseDown={handleMouseDown('move')}
        onTouchStart={handleMouseDown('move')}
      />

      {/* Corner handles */}
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 ${handleStyle}`}
        style={{ left: cropArea.x, top: cropArea.y }}
        onMouseDown={handleMouseDown('nw')}
        onTouchStart={handleMouseDown('nw')}
      />
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 ${handleStyle}`}
        style={{ left: cropArea.x + cropArea.width, top: cropArea.y }}
        onMouseDown={handleMouseDown('ne')}
        onTouchStart={handleMouseDown('ne')}
      />
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 ${handleStyle}`}
        style={{ left: cropArea.x, top: cropArea.y + cropArea.height }}
        onMouseDown={handleMouseDown('sw')}
        onTouchStart={handleMouseDown('sw')}
      />
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 ${handleStyle}`}
        style={{ left: cropArea.x + cropArea.width, top: cropArea.y + cropArea.height }}
        onMouseDown={handleMouseDown('se')}
        onTouchStart={handleMouseDown('se')}
      />

      {/* Edge handles */}
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 ${edgeHandleStyle}`}
        style={{ left: cropArea.x + cropArea.width / 2, top: cropArea.y }}
        onMouseDown={handleMouseDown('n')}
        onTouchStart={handleMouseDown('n')}
      />
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 ${edgeHandleStyle}`}
        style={{ left: cropArea.x + cropArea.width, top: cropArea.y + cropArea.height / 2 }}
        onMouseDown={handleMouseDown('e')}
        onTouchStart={handleMouseDown('e')}
      />
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 ${edgeHandleStyle}`}
        style={{ left: cropArea.x + cropArea.width / 2, top: cropArea.y + cropArea.height }}
        onMouseDown={handleMouseDown('s')}
        onTouchStart={handleMouseDown('s')}
      />
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 ${edgeHandleStyle}`}
        style={{ left: cropArea.x, top: cropArea.y + cropArea.height / 2 }}
        onMouseDown={handleMouseDown('w')}
        onTouchStart={handleMouseDown('w')}
      />

      {/* Action buttons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        <Button
          onClick={onCancel}
          variant="outline"
          size="lg"
          className="bg-white hover:bg-gray-100 min-w-[120px] h-12 text-base shadow-lg"
        >
          <X className="w-5 h-5 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={onApply}
          size="lg"
          className="min-w-[120px] h-12 text-base shadow-lg"
        >
          <Check className="w-5 h-5 mr-2" />
          Apply Crop
        </Button>
      </div>
    </div>
  );
};
