// src/components/menu/ColorPicker.jsx
import React, { useState } from 'react';

const predefinedColors = [
  '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', 
  '#22c55e', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
  '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
  '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e'
];

export default function ColorPicker({ color, onChange }) {
  const [customColor, setCustomColor] = useState(color);

  const handleCustomColorChange = (e) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-5 gap-2 mb-4">
        {predefinedColors.map((colorOption) => (
          <button
            key={colorOption}
            className={`w-8 h-8 rounded-full border-2 ${color === colorOption ? 'border-gray-800' : 'border-gray-300'}`}
            style={{ backgroundColor: colorOption }}
            onClick={() => onChange(colorOption)}
            title={colorOption}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span>Personalizado:</span>
        <input
          type="color"
          value={customColor}
          onChange={handleCustomColorChange}
          className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
        />
        <input
          type="text"
          value={customColor}
          onChange={(e) => {
            const val = e.target.value;
            setCustomColor(val);
            onChange(val);
          }}
          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
        />
      </div>
    </div>
  );
}
