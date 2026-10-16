import * as React from "react";
import { cn } from "cn";

function Input({
  className,
  type = "text",
  error = false,
  size = "default",
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      data-error={error}
      data-size={size}
      className={cn(
        "flex w-full min-w-0 rounded-[8px] border border-line bg-surface text-sm text-fg shadow-2xs transition-colors duration-fast outline-none",
        "placeholder:text-fg-3 selection:bg-accent-tint",
        "hover:border-line-strong",
        "focus-visible:border-line-focus focus-visible:ring-2 focus-visible:ring-accent/20",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-subtle/40",
        // Sizes: sm (32px), default/md (40px), lg (48px)
        size === "sm" && "h-8 px-2.5 text-xs",
        (size === "default" || size === "md") && "h-10 px-3 py-2 text-sm",
        size === "lg" && "h-12 px-4 text-base md:text-sm",
        // Error state: border bad-solid + ring at bad-solid/20
        (error || props["aria-invalid"] === true || props["aria-invalid"] === "true") &&
          "border-bad-solid hover:border-bad-solid focus-visible:border-bad-solid focus-visible:ring-bad-solid/20",
        className
      )}
      {...props}
    />
  );
}

export { Input };
