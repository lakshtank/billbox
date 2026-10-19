import * as React from "react";
import { cn } from "cn";
import { Check, ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";

function Select({ ...props }) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({ ...props }) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({ ...props }) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  error = false,
  children,
  ...props
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      data-error={error}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-[8px] border border-line bg-surface px-3 py-2 text-sm text-fg shadow-2xs transition-colors duration-fast outline-none focus:outline-none focus-visible:outline-none cursor-pointer",
        "placeholder:text-fg-3 hover:border-line-strong",
        "focus:border-line-focus focus-visible:border-line-focus focus:ring-0 focus-visible:ring-0",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-subtle/40",
        size === "sm" ? "h-8 px-2.5 text-xs" : "h-10 px-3 py-2 text-sm",
        (error || props["aria-invalid"] === true || props["aria-invalid"] === "true") &&
          "border-bad-solid hover:border-bad-solid focus:border-bad-solid focus-visible:border-bad-solid focus:ring-0 focus-visible:ring-0",
        className
      )}
      {...props}
    >
      <span className="line-clamp-1 flex items-center gap-2 truncate">
        {children}
      </span>
      <SelectPrimitive.Icon asChild>
        <ChevronsUpDown className="size-4 shrink-0 text-fg-3" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  sideOffset = 4,
  ...props
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={sideOffset}
        className={cn(
          "relative z-dropdown min-w-[8rem] max-h-80 overflow-hidden rounded-[8px] border border-line bg-surface p-1 text-fg shadow-[var(--elevation-2)] outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-xs font-semibold text-fg-3", className)}
      {...props}
    />
  );
}

function SelectItem({ className, children, ...props }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex h-8 w-full cursor-pointer select-none items-center rounded-[6px] py-1.5 pl-2 pr-8 text-sm text-fg outline-none transition-colors",
        "hover:bg-hover focus:bg-hover focus:text-fg",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4 text-accent" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("-mx-1 my-1 h-px bg-line-subtle", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn("flex cursor-default items-center justify-center py-1 text-fg-3", className)}
      {...props}
    >
      <ChevronUp className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn("flex cursor-default items-center justify-center py-1 text-fg-3", className)}
      {...props}
    >
      <ChevronDown className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
