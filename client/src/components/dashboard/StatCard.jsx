const StatCard = ({ label, value, comparisonText }) => {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs space-y-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
        {label}
      </span>
      <p className="font-bold text-2xl md:text-3xl text-[#0F172A] font-tabular tracking-tight">
        {value}
      </p>
      {comparisonText && (
        <p className="text-xs text-[#64748B] font-normal pt-1">
          {comparisonText}
        </p>
      )}
    </div>
  );
};

export default StatCard;
