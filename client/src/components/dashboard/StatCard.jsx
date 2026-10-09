const StatCard = ({ label, value, comparisonText }) => {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-2xs space-y-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-primary block">
        {label}
      </span>
      <p className="font-bold text-2xl md:text-3xl text-brand-navy font-tabular tracking-tight">
        {value}
      </p>
      {comparisonText && (
        <p className="text-xs text-slate-500 font-normal pt-1">
          {comparisonText}
        </p>
      )}
    </div>
  );
};

export default StatCard;
