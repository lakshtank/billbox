import React from 'react';

/**
 * Step 6: Merchant Avatar
 * 28px square, radius 8 (rounded-md), flat bg-subtle,
 * 2-letter initials in fg-secondary 12px/500 (text-caption font-medium).
 * Strict Rule: No colour hashing, no gradients.
 */
function getInitials(name = '') {
  if (!name || typeof name !== 'string') return '--';
  const clean = name.trim();
  if (!clean) return '--';

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export const MerchantAvatar = ({ name = '', size = 'md', className = '' }) => {
  const initials = getInitials(name);

  // Default is 28px square (w-7 h-7) per Step 6 specification
  const sizeClasses = {
    sm: 'w-6 h-6 rounded-[6px] text-[11px]',
    md: 'w-7 h-7 rounded-[8px] text-xs',     // 28px square, radius 8, 12px text
    lg: 'w-9 h-9 rounded-[10px] text-sm',
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center bg-subtle text-fg-2 font-medium font-sans select-none border border-line-subtle ${selectedSize} ${className}`}
      aria-label={name ? `Merchant: ${name}` : 'Merchant avatar'}
      title={name}
    >
      <span className="leading-none tracking-normal font-medium">{initials}</span>
    </div>
  );
};

export default MerchantAvatar;
