import * as React from "react";
import { cn } from "cn";
import { Popover as PopoverPrimitive } from "radix-ui";

function Popover({ ...props }) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ asChild, children, ...props }) {
  const isSingleChild =
    React.isValidElement(children) && React.Children.count(children) === 1;
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      asChild={asChild && isSingleChild}
      {...props}
    >
      {children}
    </PopoverPrimitive.Trigger>
  );
}

function PopoverAnchor({ ...props }) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-dropdown w-72 rounded-[8px] border border-line bg-surface p-3 text-fg shadow-[var(--elevation-2)] outline-none duration-140",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverHeader({ className, ...props }) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-1 text-sm border-b border-line pb-2 mb-2", className)}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }) {
  return (
    <div
      data-slot="popover-title"
      className={cn("font-semibold text-fg text-sm", className)}
      {...props}
    />
  );
}

function PopoverDescription({ className, ...props }) {
  return (
    <p
      data-slot="popover-description"
      className={cn("text-xs text-fg-3", className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
};
