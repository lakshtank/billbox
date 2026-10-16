import * as React from "react";
import { cn } from "cn";
import { X } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";

function Sheet({ ...props }) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ asChild, children, ...props }) {
  const isSingleChild =
    React.isValidElement(children) && React.Children.count(children) === 1;
  return (
    <SheetPrimitive.Trigger
      data-slot="sheet-trigger"
      asChild={asChild && isSingleChild}
      {...props}
    >
      {children}
    </SheetPrimitive.Trigger>
  );
}

function SheetClose({ ...props }) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-scrim bg-scrim data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-260",
        className
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-modal flex flex-col gap-4 bg-surface border-line shadow-[var(--elevation-3)] transition ease-out duration-260 outline-none",
          side === "right" &&
            "inset-y-0 right-0 h-full w-full sm:w-[480px] lg:w-[560px] border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          side === "left" &&
            "inset-y-0 left-0 h-full w-full sm:w-[480px] lg:w-[560px] border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
          side === "bottom" &&
            "inset-x-0 bottom-0 h-auto max-h-[85vh] rounded-t-[16px] border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          className
        )}
        {...props}
      >
        {/* Mobile bottom sheet drag handle */}
        {side === "bottom" && (
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line-strong select-none" />
        )}

        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            className="absolute top-5 right-5 rounded-md p-1 text-fg-3 hover:text-fg hover:bg-hover transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-6 border-b border-line", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col sm:flex-row sm:justify-end gap-3 p-6 border-t border-line", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-[18px] font-semibold text-fg leading-snug", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-fg-2 leading-relaxed", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
