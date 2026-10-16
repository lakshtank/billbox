import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

const badgeVariants = cva(
  "inline-flex h-[22px] w-fit shrink-0 items-center justify-center gap-1.5 rounded-[6px] border px-2 text-[12px] font-medium leading-none whitespace-nowrap transition-colors select-none [&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "bg-subtle text-fg-2 border-line",
        default: "bg-subtle text-fg-2 border-line",
        secondary: "bg-subtle text-fg-2 border-line",
        outline: "bg-surface text-fg-2 border-line",
        accent: "bg-accent-tint text-accent border-accent/25",
        ok: "bg-ok-bg text-ok-fg border-ok-border",
        warn: "bg-warn-bg text-warn-fg border-warn-border",
        bad: "bg-bad-bg text-bad-fg border-bad-border",
        destructive: "bg-bad-bg text-bad-fg border-bad-border",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

const Badge = React.forwardRef(function Badge(
  {
    className,
    variant = "neutral",
    asChild = false,
    icon: Icon,
    children,
    ...props
  },
  ref
) {
  const isSingleChild =
    React.isValidElement(children) && React.Children.count(children) === 1;

  if (asChild && isSingleChild) {
    return (
      <Slot.Root
        ref={ref}
        data-slot="badge"
        data-variant={variant}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <span
      ref={ref}
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {Icon && <Icon className="size-3 shrink-0" />}
      {children}
    </span>
  );
});

Badge.displayName = "Badge";

export { Badge, badgeVariants };
