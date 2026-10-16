import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { AlertTriangle } from "lucide-react";

/**
 * ConfirmDialog component (replaces window.confirm)
 * Step 8.9:
 * - Title states action ("Delete 3 receipts?")
 * - Body states consequence ("Their documents and linked products are removed. This can't be undone.")
 * - Buttons: "Cancel" (secondary left) / "Delete" (danger right)
 * - Optional confirmKeyword for account-level destruction
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

        {confirmKeyword && (
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
        )}

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
