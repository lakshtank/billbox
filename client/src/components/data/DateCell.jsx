import * as React from 'react';
import { cn } from 'cn';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

/**
 * Format a Date object to "DD MMM YYYY" (e.g. "12 Oct 2026")
 */
function formatDefaultDate(date) {
  try {
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return date.toLocaleDateString();
  }
}

/**
 * DateCell component
 * Step 9.3:
 * - Formats dates into semantic <time datetime="...">12 Oct 2026</time>
 * - Relative mode for warranties: "in 12 days" / "3 days ago", exact date in tooltip
 * - Prioritizes server-provided `daysRemaining` for single-source-of-truth accuracy
 */
export function DateCell({
  value,
  format,
  relative = false,
  daysRemaining,
  className,
}) {
  if (!value) {
    return <span className={cn('text-fg-3 select-none', className)}>—</span>;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return <span className={cn('text-fg-3 select-none', className)}>—</span>;
  }

  const iso = date.toISOString();
  const exactDate = format ? date.toLocaleDateString() : formatDefaultDate(date);

  if (relative) {
    let relativeText = '';
    let isUrgent = false;
    let isExpired = false;

    if (daysRemaining !== undefined && daysRemaining !== null) {
      const d = Number(daysRemaining);
      if (d <= 0) {
        isExpired = true;
        relativeText = d === 0 ? 'Expires today' : `${Math.abs(d)}d ago`;
      } else {
        isUrgent = d <= 30;
        relativeText = d === 1 ? 'in 1 day' : `in ${d} days`;
      }
    } else {
      // Fallback relative diff if daysRemaining is omitted
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        isExpired = true;
        relativeText = diffDays === 0 ? 'Expires today' : `${Math.abs(diffDays)}d ago`;
      } else {
        isUrgent = diffDays <= 30;
        relativeText = diffDays === 1 ? 'in 1 day' : `in ${diffDays} days`;
      }
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <time
            dateTime={iso}
            className={cn(
              'tnum cursor-help whitespace-nowrap text-sm font-medium',
              isExpired && 'text-bad-fg font-semibold',
              isUrgent && !isExpired && 'text-warn-fg font-semibold',
              !isUrgent && !isExpired && 'text-fg-2',
              className
            )}
          >
            {relativeText}
          </time>
        </TooltipTrigger>
        <TooltipContent>
          <span>{exactDate}</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <time
      dateTime={iso}
      className={cn('tnum whitespace-nowrap text-sm text-fg-2 font-normal', className)}
    >
      {exactDate}
    </time>
  );
}

export default DateCell;
