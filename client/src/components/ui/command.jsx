import * as React from "react";
import { Command as CommandPrimitive, useCommandState } from "cmdk";
import * as m from "motion/react-m";
import { cn } from "cn";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { spring } from "@/lib/motion";

function Command({ className, ...props }) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-[16px] bg-surface text-fg outline-none",
        className
      )}
      {...props}
    />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command, receipt, product, or action...",
  children,
  className,
  open,
  onOpenChange,
  ...props
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn(
          "max-w-[560px] p-0 overflow-hidden rounded-[16px] border border-line bg-surface shadow-[var(--elevation-3)]",
          "duration-140 data-[state=closed]:duration-100 data-[state=open]:slide-in-from-top-2 data-[state=open]:zoom-in-[0.97] data-[state=closed]:zoom-in-100",
          className
        )}
        showCloseButton={false}
      >
        <Command className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-fg-3">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({ className, ...props }) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-12 items-center gap-3 border-b border-line px-4"
    >
      <Search className="size-4 shrink-0 text-fg-3 pointer-events-none" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "flex h-full w-full rounded-md bg-transparent text-sm text-fg outline-none placeholder:text-fg-3 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-[340px] scroll-py-2 overflow-x-hidden overflow-y-auto p-2",
        className
      )}
      {...props}
    />
  );
}

function CommandEmpty({ ...props }) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-8 text-center text-sm text-fg-3"
      {...props}
    />
  );
}

function CommandGroup({ className, ...props }) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-fg",
        className
      )}
      {...props}
    />
  );
}

function CommandSeparator({ className, ...props }) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-2 my-1 h-px bg-line", className)}
      {...props}
    />
  );
}

function PaletteActiveIndicator({ itemId }) {
  const isSelected = useCommandState((state) => Boolean(itemId && state.selectedItemId === itemId));
  if (!isSelected) return null;
  return (
    <m.span
      layoutId="palette-active"
      className="absolute inset-0 rounded-[8px] bg-hover pointer-events-none"
      transition={spring.snappy}
    />
  );
}

function CommandItem({ className, children, ...props }) {
  const [itemId, setItemId] = React.useState(null);
  const refCallback = React.useCallback((node) => {
    if (node?.id && node.id !== itemId) {
      setItemId(node.id);
    }
  }, [itemId]);

  return (
    <CommandPrimitive.Item
      ref={refCallback}
      data-slot="command-item"
      className={cn(
        "relative flex h-10 cursor-pointer select-none items-center gap-3 rounded-[8px] px-3 text-sm text-fg outline-none transition-colors duration-fast",
        "data-[selected=true]:text-fg",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-3 data-[selected=true]:[&_svg]:text-accent",
        className
      )}
      {...props}
    >
      <PaletteActiveIndicator itemId={itemId} />
      <span className="relative z-10 flex items-center gap-3 w-full min-w-0">
        {children}
      </span>
    </CommandPrimitive.Item>
  );
}

function CommandShortcut({ className, ...props }) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-[11px] font-mono tracking-wider text-fg-3 bg-subtle px-1.5 py-0.5 rounded border border-line",
        className
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
