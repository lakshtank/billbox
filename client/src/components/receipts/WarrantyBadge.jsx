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
      dotColor: 'bg-brand-primary',
      classes: 'bg-brand-border/60 text-brand-navy border-brand-border',
    },
    expiring_soon: {
      label: 'Expiring Soon',
      dotColor: 'bg-brand-primary',
      classes: 'bg-brand-border text-brand-navy border-brand-primary/50 font-semibold',
    },
    expired: {
      label: 'Expired',
      dotColor: 'bg-brand-navy/40',
      classes: 'bg-brand-canvas text-brand-navy/70 border-brand-border',
    },
    none: {
      label: 'No Warranty',
      dotColor: 'bg-slate-300',
      classes: 'bg-brand-canvas text-slate-500 border-brand-border',
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
