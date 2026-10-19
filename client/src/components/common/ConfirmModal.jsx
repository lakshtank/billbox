import * as React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from 'cn';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

export function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
  icon: CustomIcon,
  onConfirm,
  onClose,
}) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const IconComponent = CustomIcon || (isDestructive ? Trash2 : AlertTriangle);

  const bodyContent = (
    <div className="flex items-start gap-3.5">
      <div
        className={`size-10 rounded-[10px] flex items-center justify-center shrink-0 border ${
          isDestructive
            ? 'bg-bad-bg border-bad-line text-bad-fg'
            : 'bg-accent-tint border-accent-line text-accent'
        }`}
      >
        <IconComponent className={`size-5 ${isDestructive ? 'text-bad-fg' : 'text-accent'}`} />
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <h3 className="text-base font-semibold text-fg tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-fg-2 leading-relaxed font-normal mt-1">
          {message}
        </p>
      </div>
    </div>
  );

  const actionButtons = (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-line-subtle">
      <Button
        type="button"
        variant="outline"
        size={isMobile ? 'default' : 'sm'}
        onClick={onClose}
        disabled={isLoading}
        className="w-full sm:w-auto"
      >
        {cancelText}
      </Button>

      <Button
        type="button"
        variant={isDestructive ? 'destructive' : 'default'}
        size={isMobile ? 'default' : 'sm'}
        onClick={onConfirm}
        disabled={isLoading}
        className={cn(
          'w-full sm:w-auto',
          isDestructive
            ? 'bg-bad hover:bg-bad/90 text-white font-medium shadow-xs border-none cursor-pointer'
            : ''
        )}
      >
        {isLoading ? 'Processing...' : confirmText}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        open={isOpen}
        onOpenChange={(open) => !open && !isLoading && onClose()}
        shouldScaleBackground
      >
        <DrawerContent className="px-5 pt-1 pb-[calc(20px+env(safe-area-inset-bottom))] gap-4">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{message}</DrawerDescription>
          </DrawerHeader>
          <div className="pt-2">{bodyContent}</div>
          {actionButtons}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent size="sm" showCloseButton={!isLoading}>
        <div className="flex items-start gap-3.5">
          <div
            className={`size-10 rounded-[10px] flex items-center justify-center shrink-0 border ${
              isDestructive
                ? 'bg-bad-bg border-bad-line text-bad-fg'
                : 'bg-accent-tint border-accent-line text-accent'
            }`}
          >
            <IconComponent className={`size-5 ${isDestructive ? 'text-bad-fg' : 'text-accent'}`} />
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <DialogTitle className="text-base font-semibold text-fg tracking-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-fg-2 leading-relaxed font-normal mt-1">
              {message}
            </DialogDescription>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-line-subtle sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={isDestructive ? 'destructive' : 'default'}
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className={
              isDestructive
                ? 'bg-bad hover:bg-bad/90 text-white font-medium shadow-xs border-none cursor-pointer'
                : ''
            }
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmModal;
