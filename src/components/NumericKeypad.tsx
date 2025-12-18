// src/components/NumericKeypad.tsx
import React from 'react';

interface NumericKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onConfirm: () => void;
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({ onDigit, onBackspace, onConfirm }) => {
  const digits = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', '←', '✓']
  ];

  const handleDigitClick = (digit: string) => {
    if (digit === '←') {
      onBackspace();
    } else if (digit === '✓') {
      onConfirm();
    } else {
      onDigit(digit);
    }
  };

  return (
    <div className="numeric-keypad">
      {digits.map((row, rowIndex) => (
        <div key={rowIndex} className="key-row">
          {row.map((digit, colIndex) => (
            <button
              key={colIndex}
              className={`key ${digit === '←' ? 'backspace' : digit === '✓' ? 'confirm' : ''}`}
              onClick={() => handleDigitClick(digit)}
              aria-label={digit === '←' ? 'Borrar' : digit === '✓' ? 'Aceptar' : `Número ${digit}`}
            >
              {digit === '←' ? (
                <span className="icon">←</span>
              ) : digit === '✓' ? (
                <span className="icon">✓</span>
              ) : (
                digit
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default NumericKeypad;
