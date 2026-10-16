import * as React from 'react';

export const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'size-4 border-2',
    md: 'size-7 border-[2.5px]',
    lg: 'size-10 border-3',
  };

  return (
    <div className="flex items-center justify-center p-4" role="status">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-line border-t-accent animate-spin`}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
