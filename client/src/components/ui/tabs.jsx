import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "cn";
import { Tabs as TabsPrimitive } from "radix-ui";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex items-center select-none",
  {
    variants: {
      variant: {
        // Underline style (default) — 40px tall, border-b line
        underline: "h-10 w-full justify-start gap-6 border-b border-line bg-transparent p-0",
        default: "h-10 w-full justify-start gap-6 border-b border-line bg-transparent p-0",
        // Segmented pill group on bg-subtle
        segmented: "h-10 rounded-[8px] bg-subtle p-1 gap-1 border border-line-subtle",
      },
    },
    defaultVariants: {
      variant: "underline",
    },
  }
);

function TabsList({
  className,
  variant = "underline",
  ...props
}) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  count,
  children,
  ...props
}) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex items-center justify-center font-medium whitespace-nowrap outline-none cursor-pointer transition-colors duration-fast",
        "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
        // Underline variant styles:
        "group-data-[variant=underline]/tabs-list:h-10 group-data-[variant=underline]/tabs-list:px-1 group-data-[variant=underline]/tabs-list:text-sm group-data-[variant=underline]/tabs-list:text-fg-2 group-data-[variant=underline]/tabs-list:hover:text-fg",
        "group-data-[variant=underline]/tabs-list:data-[state=active]:text-fg",
        "group-data-[variant=underline]/tabs-list:after:absolute group-data-[variant=underline]/tabs-list:after:bottom-0 group-data-[variant=underline]/tabs-list:after:left-0 group-data-[variant=underline]/tabs-list:after:right-0 group-data-[variant=underline]/tabs-list:after:h-[2px] group-data-[variant=underline]/tabs-list:after:bg-transparent",
        "group-data-[variant=underline]/tabs-list:data-[state=active]:after:bg-accent",
        // Default variant fallback:
        "group-data-[variant=default]/tabs-list:h-10 group-data-[variant=default]/tabs-list:px-1 group-data-[variant=default]/tabs-list:text-sm group-data-[variant=default]/tabs-list:text-fg-2 group-data-[variant=default]/tabs-list:hover:text-fg",
        "group-data-[variant=default]/tabs-list:data-[state=active]:text-fg",
        "group-data-[variant=default]/tabs-list:after:absolute group-data-[variant=default]/tabs-list:after:bottom-0 group-data-[variant=default]/tabs-list:after:left-0 group-data-[variant=default]/tabs-list:after:right-0 group-data-[variant=default]/tabs-list:after:h-[2px] group-data-[variant=default]/tabs-list:after:bg-transparent",
        "group-data-[variant=default]/tabs-list:data-[state=active]:after:bg-accent",
        // Segmented variant styles:
        "group-data-[variant=segmented]/tabs-list:h-8 group-data-[variant=segmented]/tabs-list:px-3 group-data-[variant=segmented]/tabs-list:rounded-[6px] group-data-[variant=segmented]/tabs-list:text-xs group-data-[variant=segmented]/tabs-list:text-fg-2 group-data-[variant=segmented]/tabs-list:hover:text-fg",
        "group-data-[variant=segmented]/tabs-list:data-[state=active]:bg-surface group-data-[variant=segmented]/tabs-list:data-[state=active]:text-fg group-data-[variant=segmented]/tabs-list:data-[state=active]:shadow-2xs group-data-[variant=segmented]/tabs-list:data-[state=active]:border group-data-[variant=segmented]/tabs-list:data-[state=active]:border-line",
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-1.5">{children}</span>
      {count !== undefined && count !== null && (
        <span className="ml-1.5 inline-flex items-center rounded-full bg-subtle px-1.5 py-0.2 text-[12px] font-semibold text-fg-3 tnum group-data-[state=active]/tabs-trigger:bg-accent-tint group-data-[state=active]/tabs-trigger:text-accent">
          {count}
        </span>
      )}
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none pt-4", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
