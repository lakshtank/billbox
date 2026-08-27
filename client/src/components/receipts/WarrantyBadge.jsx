import React from 'react';

/**
 * Stripe / Linear style subtle status chip for warranty status.
 * States: 'active' | 'expiring_soon' | 'expired' | 'none'
 */
const WarrantyBadge = ({ status, size = 'normal', showIcon = true }) => {
  const normalizedStatus = status || 'none';

  const config = {
    active: {
      label: 'Active Warranty',
      dotColor: 'bg-emerald-500',
      classes: 'bg-emerald-50/70 text-emerald-800 border-emerald-200/80',
    },
    expiring_soon: {
      label: 'Expiring Soon',
      dotColor: 'bg-amber-500',
      classes: 'bg-amber-50/80 text-amber-800 border-amber-200/80 font-medium',
    },
    expired: {
      label: 'Expired',
      dotColor: 'bg-slate-400',
      classes: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    none: {
      label: 'No Warranty',
      dotColor: 'bg-slate-300',
      classes: 'bg-slate-50 text-slate-500 border-slate-200/60',
    },
  };

  const { label, dotColor, classes } = config[normalizedStatus] || config.none;

  const sizeClasses =
    size === 'small'
      ? 'text-[11px] px-2 py-0.5'
      : size === 'large'
      ? 'text-xs px-2.5 py-1 font-semibold'
      : 'text-[11px] px-2 py-0.5 font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${classes} ${sizeClasses}`}
    >
      {showIcon && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />}
      <span className="truncate">{label}</span>
    </span>
  );
};

export default WarrantyBadge;
