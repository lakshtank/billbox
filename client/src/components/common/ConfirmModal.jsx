import * as React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onClose,
}) {
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
            {isDestructive ? (
              <Trash2 className="size-5 text-bad-fg" />
            ) : (
              <AlertTriangle className="size-5 text-accent" />
            )}
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
            className={isDestructive ? 'bg-bad hover:bg-bad/90 text-white font-medium shadow-xs border-none cursor-pointer' : ''}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmModal;
