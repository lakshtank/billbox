import * as React from 'react';
import { cn } from 'cn';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from './drawer';

/**
 * ResponsiveModal - Renders as a Vaul bottom Drawer under 640px (with drag dismiss,
 * background scaling, and safe-area insets) and as a centered Radix Dialog on desktop.
 *
 * Implements Step 11.2 of animation_instruction.md.
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  snapPoints,
  className,
  contentClassName,
  showCloseButton = true,
  size = 'default',
}) {
  const isMobile = useMediaQuery('(max-width: 639px)');

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        shouldScaleBackground
        snapPoints={snapPoints}
      >
        <DrawerContent className={cn("max-h-[92dvh] rounded-t-2xl", className)}>
          {(title || description) && (
            <DrawerHeader className="text-left px-5 pt-2 pb-2">
              {title && <DrawerTitle>{title}</DrawerTitle>}
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
          )}
          <div className={cn("overflow-y-auto px-5 pb-[calc(20px+env(safe-area-inset-bottom))]", contentClassName)}>
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size={size} showCloseButton={showCloseButton} className={className}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <div className={contentClassName}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ResponsiveModal;
