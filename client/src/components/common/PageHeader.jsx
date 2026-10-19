import * as React from 'react';
import { cn } from '../../lib/utils';

/**
 * PageHeader component
 * Step 10.6:
 * - Title (`title-1` 24px/600 font-sans tracking-tight text-fg)
 * - Optional one-line description (`text-sm text-fg-2`)
 * - Actions right-aligned (max one primary)
 * - Tabs directly beneath with 16px gap
 * - 24px margin-bottom before page content
 */
export function PageHeader({
  title,
  description,
  actions,
  tabs,
  className,
  ...props
}) {
  return (
    <header className={cn('mb-2.5 sm:mb-6 font-sans', className)} {...props}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="space-y-0.5 sm:space-y-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold sm:font-semibold tracking-tight text-fg truncate">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-fg-3 sm:text-fg-2 line-clamp-1 sm:line-clamp-2">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
            {actions}
          </div>
        )}
      </div>
      {tabs && <div className="mt-2.5 sm:mt-4">{tabs}</div>}
    </header>
  );
}

export default PageHeader;
