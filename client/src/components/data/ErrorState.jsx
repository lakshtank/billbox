import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from 'cn';

/**
 * ErrorState Component
 * Step 9.10:
 * - Centered layout
 * - 40px icon tile in bad-bg with 20px AlertCircle icon in bad-solid
 * - Title 15/600 in fg
 * - 14px description in fg-2 (max 2 lines)
 * - Exactly one primary action (default: "Try again")
 * - No emoji, no illustration
 */
export function ErrorState({
  title = 'Unable to load content',
  description = 'An error occurred while communicating with the server. Please check your network connection and retry.',
  actionLabel = 'Try again',
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center border border-line bg-surface rounded-[12px] select-none',
        className
      )}
      role="alert"
    >
      {/* 40px Icon Tile */}
      <div className="size-10 mb-3.5 rounded-[8px] bg-bad-bg flex items-center justify-center text-bad-solid border border-bad-border shrink-0">
        <AlertCircle className="size-5 stroke-[1.75]" />
      </div>

      {/* Title 15/600 */}
      <h3 className="text-[15px] font-semibold text-fg mb-1">
        {title}
      </h3>

      {/* 14px Description fg-2 */}
      <p className="text-sm text-fg-2 max-w-[44ch] mb-5 leading-relaxed line-clamp-2">
        {description}
      </p>

      {/* Exactly One Primary Action */}
      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="default"
          onClick={onAction}
          className="h-10 px-5 text-sm"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
