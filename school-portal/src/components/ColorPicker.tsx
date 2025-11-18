import { useState } from 'react';
import { Label } from './ui/label';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  presetColors?: string[];
}

const DEFAULT_PRESETS = [
  { color: '#FFFFFF', name: 'White' },
  { color: '#F3F4F6', name: 'Light Gray' },
  { color: '#DBEAFE', name: 'Light Blue' },
  { color: '#D1FAE5', name: 'Light Green' },
  { color: '#FEF3C7', name: 'Light Yellow' },
  { color: '#FCE7F3', name: 'Light Pink' },
  { color: '#E0E7FF', name: 'Light Indigo' },
  { color: '#FED7AA', name: 'Light Orange' },
];

export const ColorPicker = ({
  currentColor,
  onColorChange,
  presetColors,
}: ColorPickerProps) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState(currentColor);

  const presets = presetColors
    ? presetColors.map((color, index) => ({ color, name: `Color ${index + 1}` }))
    : DEFAULT_PRESETS;

  const handlePresetClick = (color: string) => {
    onColorChange(color);
    setShowCustomPicker(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onColorChange(color);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Background Color</Label>

      {/* Preset Colors */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.color}
            type="button"
            onClick={() => handlePresetClick(preset.color)}
            className="relative w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 active:scale-95 min-h-[44px]"
            style={{
              backgroundColor: preset.color,
              borderColor: currentColor === preset.color ? '#3B82F6' : '#E5E7EB',
            }}
            title={preset.name}
            aria-label={`Select ${preset.name} background`}
          >
            {currentColor === preset.color && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="w-5 h-5 text-blue-600 drop-shadow-md" strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom Color Picker */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          {showCustomPicker ? 'Hide' : 'Show'} Custom Color Picker
        </button>

        {showCustomPicker && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="custom-color" className="text-sm mb-2 block">
                Custom Color
              </Label>
              <div className="flex items-center gap-2">
                <input
                  id="custom-color"
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="w-16 h-12 rounded border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={customColor.toUpperCase()}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^#[0-9A-F]{0,6}$/i.test(value)) {
                      setCustomColor(value);
                      if (value.length === 7) {
                        onColorChange(value);
                      }
                    }
                  }}
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500"
                  placeholder="#FFFFFF"
                  maxLength={7}
                />
              </div>
            </div>
            <div
              className="w-16 h-16 rounded-lg border-2 border-gray-300 flex-shrink-0"
              style={{ backgroundColor: customColor }}
              title="Preview"
            />
          </div>
        )}
      </div>

      {/* Current Color Display */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Current:</span>
        <div
          className="w-6 h-6 rounded border-2 border-gray-300"
          style={{ backgroundColor: currentColor }}
        />
        <span className="font-mono">{currentColor.toUpperCase()}</span>
      </div>
    </div>
  );
};
