import * as React from "react";
import { cn } from "cn";
import { Tooltip as TooltipPrimitive } from "radix-ui";

function TooltipProvider({
  delayDuration = 400,
  ...props
}) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({ ...props }) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ asChild, children, ...props }) {
  const isSingleChild =
    React.isValidElement(children) && React.Children.count(children) === 1;
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      asChild={asChild && isSingleChild}
      {...props}
    >
      {children}
    </TooltipPrimitive.Trigger>
  );
}

function TooltipContent({
  className,
  sideOffset = 4,
  children,
  ...props
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-tooltip w-fit origin-(--radix-tooltip-content-transform-origin) animate-in fade-in-0 zoom-in-95 rounded-[6px] px-2.5 py-1 text-[12px] font-medium leading-tight shadow-xs outline-none select-none",
          "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-tooltip size-2 translate-y-[calc(-50%_-_1px)] rotate-45 rounded-[1px] bg-slate-900 fill-slate-900 dark:bg-slate-100 dark:fill-slate-100" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
