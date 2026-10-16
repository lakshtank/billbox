import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Step 6: EmptyState
 * - No stock imagery, illustrations, blobs or mascots.
 * - Empty states use a 20-24px Lucide icon in a 40px bg-subtle rounded square (radius 8).
 * - Typography: title-3 for heading, body for helper text, centered.
 * - Step 1: Optional ShimmerButton on first-run CTA.
 */
const EmptyState = ({
  title = 'No items found',
  description = 'Get started by adding your first record.',
  actionLabel,
  onAction,
  icon: CustomIcon,
  _useShimmer,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center border border-line bg-surface rounded-lg">
      <div className="w-10 h-10 mb-3.5 rounded-md bg-subtle flex items-center justify-center text-fg-2 border border-line-subtle shrink-0">
        {CustomIcon ? (
          <CustomIcon className="w-5 h-5 stroke-[1.75]" />
        ) : (
          <FileText className="w-5 h-5 stroke-[1.75]" />
        )}
      </div>

      <h3 className="text-title-3 font-semibold text-fg mb-1">
        {title}
      </h3>

      <p className="text-body text-fg-3 max-w-[42ch] mb-5 leading-normal">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          type="button"
          onClick={onAction}
          variant="primary"
          size="sm"
          className="h-9 px-4 text-xs font-semibold rounded-[8px]"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export { EmptyState };
export default EmptyState;
