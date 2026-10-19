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
        "flex min-h-20 w-full rounded-[8px] border border-line bg-surface px-3 py-2 text-sm text-fg shadow-2xs transition-colors duration-fast outline-none focus:outline-none focus-visible:outline-none",
        "placeholder:text-fg-3 selection:bg-accent-tint",
        "hover:border-line-strong",
        "focus:border-line-focus focus-visible:border-line-focus focus:ring-0 focus-visible:ring-0",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-subtle/40",
        (error || props["aria-invalid"] === true || props["aria-invalid"] === "true") &&
          "border-bad-solid hover:border-bad-solid focus:border-bad-solid focus-visible:border-bad-solid focus:ring-0 focus-visible:ring-0",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
