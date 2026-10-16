import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "./drawer";
import { Button } from "./button";
import { Input } from "./input";
import { AlertTriangle } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/**
 * ConfirmDialog component (replaces window.confirm)
 * Responsive modal (Vaul Drawer on mobile, Dialog on desktop)
 */
function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  confirmKeyword,
  onConfirm,
  onCancel,
  loading = false,
}) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const [typedKeyword, setTypedKeyword] = React.useState("");
  const isKeywordMatching = !confirmKeyword || typedKeyword.trim().toLowerCase() === confirmKeyword.trim().toLowerCase();

  // Reset typed keyword when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setTypedKeyword("");
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!isKeywordMatching) return;
    if (onConfirm) {
      await onConfirm();
    }
  };

  const handleCancel = () => {
    onOpenChange?.(false);
    onCancel?.();
  };

  const keywordInput = confirmKeyword && (
    <div className="flex flex-col gap-2 py-2">
      <p className="text-xs text-fg-2">
        Type <strong className="font-mono text-fg select-all bg-subtle px-1 py-0.5 rounded border border-line">{confirmKeyword}</strong> to confirm:
      </p>
      <Input
        type="text"
        value={typedKeyword}
        onChange={(e) => setTypedKeyword(e.target.value)}
        placeholder={confirmKeyword}
        disabled={loading}
        autoFocus
      />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        shouldScaleBackground
      >
        <DrawerContent className="px-5 pt-2 pb-[calc(20px+env(safe-area-inset-bottom))] gap-3">
          <DrawerHeader className="gap-2 px-0 pt-1 pb-1">
            <div className="flex items-center gap-2.5">
              {variant === "danger" && (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bad-bg text-bad-solid">
                  <AlertTriangle className="size-4.5" />
                </div>
              )}
              <DrawerTitle className="text-base font-semibold">{title}</DrawerTitle>
            </div>
            {description && <DrawerDescription className="text-xs text-fg-2">{description}</DrawerDescription>}
          </DrawerHeader>

          {keywordInput}

          <DrawerFooter className="flex-col gap-2 p-0 pt-3 border-t border-line-subtle">
            <Button
              type="button"
              variant={variant === "danger" ? "danger" : "primary"}
              onClick={handleConfirm}
              loading={loading}
              disabled={!isKeywordMatching || loading}
              className="w-full"
            >
              {confirmText}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={loading}
              className="w-full"
            >
              {cancelText}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" showCloseButton={!loading}>
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-2.5">
            {variant === "danger" && (
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bad-bg text-bad-solid">
                <AlertTriangle className="size-4.5" />
              </div>
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {keywordInput}

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={handleConfirm}
            loading={loading}
            disabled={!isKeywordMatching || loading}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ConfirmDialog };
export default ConfirmDialog;
