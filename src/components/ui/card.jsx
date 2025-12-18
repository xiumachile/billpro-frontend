import React from 'react';

export const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white shadow rounded p-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`border-b pb-2 mb-2 ${className}`} {...props}>{children}</div>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>{children}</div>
);

