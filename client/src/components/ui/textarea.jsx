import * as React from "react";
import { cn } from "cn";

function Textarea({
  className,
  error = false,
  ...props
}) {
  return (
    <textarea
      data-slot="textarea"
      data-error={error}
      className={cn(
        "flex min-h-20 w-full rounded-[8px] border border-line bg-surface px-3 py-2 text-sm text-fg shadow-2xs transition-colors duration-fast outline-none",
        "placeholder:text-fg-3 selection:bg-accent-tint",
        "hover:border-line-strong",
        "focus-visible:border-line-focus focus-visible:ring-2 focus-visible:ring-accent/20",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-subtle/40",
        (error || props["aria-invalid"] === true || props["aria-invalid"] === "true") &&
          "border-bad-solid hover:border-bad-solid focus-visible:border-bad-solid focus-visible:ring-bad-solid/20",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
