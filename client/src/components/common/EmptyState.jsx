const EmptyState = ({
  title = 'No items found',
  description = 'Get started by adding your first record.',
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="surface-card flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon ? (
        <div className="text-slate-400 mb-4">{icon}</div>
      ) : (
        <div className="w-12 h-12 mb-4 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        </div>
      )}
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary text-xs">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
