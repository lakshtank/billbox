import React from 'react';
import { ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Step 6: BillBox Logo Mark
 * 24x24 rounded square (radius 7) in solid accent,
 * containing a white receipt glyph (Lucide ReceiptText outline, 14px).
 * Flat. No gradient, no shadow.
 */
export const LogoMark = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: { box: 'w-5 h-5 rounded-[6px]', icon: 12 },
    md: { box: 'w-6 h-6 rounded-[7px]', icon: 14 },
    lg: { box: 'w-8 h-8 rounded-[9px]', icon: 18 },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center bg-accent text-white ${current.box} ${className}`}
      aria-hidden="true"
    >
      <ReceiptText
        size={current.icon}
        strokeWidth={1.85}
        className="text-white"
      />
    </div>
  );
};

/**
 * Step 6: BillBox Wordmark
 * "BillBox" in Geist 700, -0.02em, fg-primary.
 */
export const Wordmark = ({ size = 'md', className = '' }) => {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <span
      className={`font-sans font-bold tracking-[-0.02em] text-fg select-none ${textSizes[size] || textSizes.md} ${className}`}
    >
      BillBox
    </span>
  );
};

/**
 * Combined Logo (Mark + Wordmark)
 */
export const Logo = ({
  size = 'md',
  showWordmark = true,
  to = '/',
  className = '',
}) => {
  const content = (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {showWordmark && <Wordmark size={size} />}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
