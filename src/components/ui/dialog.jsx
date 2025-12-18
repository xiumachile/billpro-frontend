import React from 'react';

export const Dialog = ({ children, open, onOpenChange }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={() => onOpenChange(false)}>
      {children}
    </div>
  );
};

export const DialogContent = ({ children, className }) => (
  <div
    className={`bg-white p-4 rounded shadow ${className || ''}`}
    onClick={(e) => e.stopPropagation()}
  >
    {children}
  </div>
);

export const DialogHeader = ({ children }) => <div className="border-b p-2">{children}</div>;
export const DialogTitle = ({ children }) => <h3 className="text-lg font-semibold">{children}</h3>;
export const DialogFooter = ({ children, className }) => (
  <div className={`p-2 flex justify-end gap-2 ${className || ''}`}>{children}</div>
);


