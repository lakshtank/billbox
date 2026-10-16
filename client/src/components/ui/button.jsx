import * as React from "react";
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "cn";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors duration-fast rounded-[8px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed select-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-accent text-on-accent hover:bg-accent-hover active:brightness-95 border-none",
        default: "bg-accent text-on-accent hover:bg-accent-hover active:brightness-95 border-none",
        secondary: "bg-surface text-fg border border-line hover:bg-hover hover:border-line-strong active:bg-subtle",
        outline: "bg-surface text-fg border border-line hover:bg-hover hover:border-line-strong active:bg-subtle",
        ghost: "bg-transparent text-fg-2 hover:bg-hover hover:text-fg active:bg-subtle border-none",
        danger: "bg-bad bg-bad-solid text-white hover:brightness-110 active:brightness-95 border-none shadow-2xs",
        destructive: "bg-bad bg-bad-solid text-white hover:brightness-110 active:brightness-95 border-none shadow-2xs",
        "danger-ghost": "bg-transparent text-bad-fg hover:bg-bad-bg active:bg-bad-tint border-none",
        link: "bg-transparent text-accent p-0 h-auto hover:underline border-none",
      },
      size: {
        sm: "h-8 px-3 text-xs gap-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-10 px-4 text-sm gap-2 [&_svg:not([class*='size-'])]:size-4",
        md: "h-10 px-4 text-sm gap-2 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-12 px-5 text-sm gap-2.5 [&_svg:not([class*='size-'])]:size-4.5",
        "icon-sm": "h-8 w-8 p-0 [&_svg:not([class*='size-'])]:size-3.5",
        icon: "h-10 w-10 p-0 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "h-12 w-12 p-0 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

const Button = React.forwardRef(function Button(
  {
    className,
    variant = "primary",
    size = "default",
    loading = false,
    disabled = false,
    asChild = false,
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
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
