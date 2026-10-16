import React from 'react';
import { ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Step 6: BillBox Logo Mark
 * 24x24 rounded square (radius 7) in solid accent,
 * containing a white receipt glyph (Lucide ReceiptText outline, 14px).
 * Enhanced: 32x32 for md with bold 18px crisp glyph and subtle ring highlight.
 */
export const LogoMark = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: { box: 'w-6 h-6 rounded-[7px]', icon: 14, stroke: 2 },
    md: { box: 'w-8 h-8 rounded-[9px]', icon: 18, stroke: 2.2 },
    lg: { box: 'w-10 h-10 rounded-[11px]', icon: 22, stroke: 2.2 },
    xl: { box: 'w-12 h-12 rounded-[13px]', icon: 26, stroke: 2.2 },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center bg-accent text-white shadow-xs ring-1 ring-white/20 rounded-[7px] ${current.box} ${className}`}
      aria-hidden="true"
    >
      <ReceiptText
        size={current.icon}
        strokeWidth={current.stroke}
        className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]"
      />
    </div>
  );
};

/**
 * Step 6: BillBox Wordmark
 * "BillBox" in Geist 700, -0.02em, fg-primary.
 * Two-tone brand accent: "Bill" in text-fg, "Box" in signature text-accent.
 */
export const Wordmark = ({ size = 'md', className = '' }) => {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-[17px]',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <span
      className={`font-sans font-bold tracking-[-0.02em] text-fg select-none flex items-center leading-none ${textSizes[size] || textSizes.md} ${className}`}
    >
      <span>Bill</span>
      <span className="text-accent">Box</span>
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
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showWordmark && <Wordmark size={size} />}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex items-center no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md group"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
