import * as React from "react";
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "cn";
import { Slot } from "radix-ui";
import * as m from "motion/react-m";
import { spring } from "@/lib/motion";

const buttonVariants = cva(
  "group relative z-0 inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap rounded-[100px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed select-none overflow-hidden transition-all duration-fast [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white border border-white/20 hover:border-white/30 active:brightness-95 shadow-xs",
        default: "bg-accent text-white border border-white/20 hover:border-white/30 active:brightness-95 shadow-xs",
        secondary: "bg-surface text-fg border border-line hover:border-line-strong active:bg-subtle",
        outline: "bg-surface text-fg border border-line hover:border-line-strong active:bg-subtle",
        ghost: "bg-transparent text-fg-2 hover:bg-hover hover:text-fg active:bg-subtle border-none rounded-[8px]",
        danger: "bg-bad-solid text-white border border-white/20 hover:brightness-110 active:brightness-95 shadow-2xs",
        destructive: "bg-bad-solid text-white border border-white/20 hover:brightness-110 active:brightness-95 shadow-2xs",
        "danger-ghost": "bg-transparent text-bad-fg hover:bg-bad-bg active:bg-bad-tint border-none rounded-[8px]",
        link: "bg-transparent text-accent p-0 h-auto hover:underline border-none rounded-none",
      },
      size: {
        sm: "h-8 px-3.5 text-xs gap-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-10 px-4.5 text-sm gap-2 [&_svg:not([class*='size-'])]:size-4",
        md: "h-10 px-4.5 text-sm gap-2 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-12 px-6 text-sm gap-2.5 [&_svg:not([class*='size-'])]:size-4.5",
        "icon-sm": "h-8 w-8 p-0 rounded-full [&_svg:not([class*='size-'])]:size-3.5",
        icon: "h-10 w-10 p-0 rounded-full [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "h-12 w-12 p-0 rounded-full [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

const getShimmerConfig = (variant) => {
  switch (variant) {
    case "danger":
    case "destructive":
      return {
        bg: "var(--bad-solid, #D4291F)",
        shimmerColor: "rgba(255, 255, 255, 0.9)",
        highlight: "shadow-[inset_0_-8px_10px_rgba(255,255,255,0.22)]",
        hoverHighlight: "group-hover:shadow-[inset_0_-6px_10px_rgba(255,255,255,0.35)]",
        activeHighlight: "group-active:shadow-[inset_0_-10px_10px_rgba(255,255,255,0.35)]",
      };
    case "secondary":
    case "outline":
      return {
        bg: "var(--bg-surface)",
        shimmerColor: "rgba(18, 78, 102, 0.75)",
        highlight: "shadow-[inset_0_-6px_8px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_-6px_8px_rgba(255,255,255,0.06)]",
        hoverHighlight: "group-hover:shadow-[inset_0_-5px_8px_rgba(0,0,0,0.05)] dark:group-hover:shadow-[inset_0_-5px_8px_rgba(255,255,255,0.1)]",
        activeHighlight: "group-active:shadow-[inset_0_-8px_8px_rgba(0,0,0,0.06)] dark:group-active:shadow-[inset_0_-8px_8px_rgba(255,255,255,0.12)]",
      };
    case "primary":
    case "default":
    default:
      return {
        bg: "var(--accent, #124E66)",
        shimmerColor: "rgba(255, 255, 255, 0.95)",
        highlight: "shadow-[inset_0_-8px_10px_rgba(255,255,255,0.18)]",
        hoverHighlight: "group-hover:shadow-[inset_0_-6px_10px_rgba(255,255,255,0.35)]",
        activeHighlight: "group-active:shadow-[inset_0_-10px_10px_rgba(255,255,255,0.35)]",
      };
  }
};

const Button = React.forwardRef(function Button(
  {
    className,
    variant = "primary",
    size = "default",
    loading = false,
    disabled = false,
    asChild = false,
    shimmer,
    children,
    style,
    ...props
  },
  ref
) {
  const isSingleChild =
    React.isValidElement(children) && React.Children.count(children) === 1;

  const shouldShimmer =
    shimmer !== false &&
    variant !== "ghost" &&
    variant !== "danger-ghost" &&
    variant !== "link";

  const config = shouldShimmer ? getShimmerConfig(variant) : null;

  const shimmerStyle = shouldShimmer
    ? {
        "--spread": "90deg",
        "--shimmer-color": config.shimmerColor,
        "--speed": "3s",
        "--cut": "1px",
        "--bg": config.bg,
        background: config.bg,
        ...style,
      }
    : style;

  if (asChild && isSingleChild) {
    const child = React.Children.only(children);
    return (
      <Slot.Root
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        style={shimmerStyle}
        {...props}
      >
        {React.cloneElement(
          child,
          {
            className: cn(child.props.className, "relative z-0 overflow-hidden"),
          },
          <>
            {shouldShimmer && (
              <>
                {/* 1. Spark Container */}
                <div
                  className="-z-30 blur-[2px] @container-[size] absolute inset-0 overflow-visible pointer-events-none"
                  style={{ containerType: "size" }}
                >
                  <div className="animate-shimmer-slide absolute inset-0 aspect-[1] h-[100cqh] rounded-none [mask:none]">
                    <div className="animate-spin-around absolute -inset-full w-auto [translate:0_0] rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread,90deg)*0.5)),transparent_0,var(--shimmer-color)_var(--spread,90deg),transparent_var(--spread,90deg))]" />
                  </div>
                </div>

                {/* 2. Backdrop */}
                <div
                  className="absolute inset-[1px] -z-20 rounded-[inherit] pointer-events-none transition-colors duration-fast"
                  style={{ background: config.bg }}
                />

                {/* 3. Liquid Specular Highlight */}
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 size-full rounded-[inherit] transform-gpu transition-all duration-300 ease-in-out",
                    config.highlight,
                    config.hoverHighlight,
                    config.activeHighlight
                  )}
                />
              </>
            )}
            <span className="relative z-10 inline-flex items-center justify-center gap-[inherit] whitespace-nowrap w-full h-full">
              {child.props.children}
            </span>
          </>
        )}
      </Slot.Root>
    );
  }

  return (
    <m.button
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={spring.snappy}
      className={cn(buttonVariants({ variant, size, className }))}
      style={shimmerStyle}
      {...props}
    >
      {shouldShimmer && (
        <>
          {/* 1. Spark Container */}
          <div
            className="-z-30 blur-[2px] @container-[size] absolute inset-0 overflow-visible pointer-events-none"
            style={{ containerType: "size" }}
          >
            <div className="animate-shimmer-slide absolute inset-0 aspect-[1] h-[100cqh] rounded-none [mask:none]">
              <div className="animate-spin-around absolute -inset-full w-auto [translate:0_0] rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread,90deg)*0.5)),transparent_0,var(--shimmer-color)_var(--spread,90deg),transparent_var(--spread,90deg))]" />
            </div>
          </div>

          {/* 2. Backdrop */}
          <div
            className="absolute inset-[1px] -z-20 rounded-[inherit] pointer-events-none transition-colors duration-fast"
            style={{ background: config.bg }}
          />

          {/* 3. Liquid Specular Highlight */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 size-full rounded-[inherit] transform-gpu transition-all duration-300 ease-in-out",
              config.highlight,
              config.hoverHighlight,
              config.activeHighlight
            )}
          />
        </>
      )}

      {/* 4. Content */}
      <span className="relative z-10 inline-flex items-center justify-center gap-[inherit] whitespace-nowrap">
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </span>
    </m.button>
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
