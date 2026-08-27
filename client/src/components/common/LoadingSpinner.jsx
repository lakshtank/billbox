const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-[2.5px]',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div className="flex items-center justify-center p-4" role="status">
      <div
        className={`${sizeClasses[size]} rounded-full border-slate-200 border-t-emerald-600 animate-spin`}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
