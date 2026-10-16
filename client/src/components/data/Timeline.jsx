import * as React from 'react';
import { cn } from 'cn';

const STATUS_DOT_COLORS = {
  ok: 'bg-ok-solid',
  active: 'bg-ok-solid',
  warn: 'bg-warn-solid',
  expiring: 'bg-warn-solid',
  bad: 'bg-bad-solid',
  expired: 'bg-bad-solid',
  accent: 'bg-accent',
  neutral: 'bg-fg-3',
};

/**
 * Timeline component
 * Step 9.8:
 * - Vertical line in `line` token
 * - 8px dots (status color)
 * - 13px text font-medium
 * - Relative time right-aligned in fg-3
 */
export function Timeline({ events = [], className }) {
  if (!events || events.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-fg-3">
        No recent activity recorded.
      </div>
    );
  }

  return (
    <div className={cn('relative flex flex-col', className)}>
      {events.map((event, idx) => {
        const isLast = idx === events.length - 1;
        const dotColor =
          STATUS_DOT_COLORS[event.status] ||
          event.dotColor ||
          'bg-accent';

        return (
          <div key={event.id || idx} className="relative flex gap-3 pb-5">
            {/* Vertical connector line */}
            {!isLast && (
              <span
                className="absolute left-[3.5px] top-2.5 h-[calc(100%-8px)] w-[1px] bg-line"
                aria-hidden="true"
              />
            )}

            {/* 8px Status Dot */}
            <div className="relative mt-1 flex size-2 shrink-0 items-center justify-center">
              <span
                className={cn('size-2 rounded-full ring-2 ring-surface', dotColor)}
              />
            </div>

            {/* Event content */}
            <div className="flex flex-1 flex-col justify-between sm:flex-row sm:items-baseline gap-1 min-w-0">
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium text-fg truncate">
                  {event.title}
                </span>
                {event.description && (
                  <span className="text-xs text-fg-2 leading-relaxed">
                    {event.description}
                  </span>
                )}
              </div>

              {event.time && (
                <span className="shrink-0 text-xs text-fg-3 tnum whitespace-nowrap">
                  {event.time}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Timeline;
