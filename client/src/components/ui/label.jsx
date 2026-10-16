import * as React from "react";
import { cn } from "cn";
import { Label as LabelPrimitive } from "radix-ui";

function Label({
  className,
  required = false,
  children,
  ...props
}) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center text-[13px] font-medium text-fg leading-none select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-[12px] font-normal text-fg-3 ml-1.5" aria-hidden="true">
          (required)
        </span>
      )}
    </LabelPrimitive.Root>
  );
}

export { Label };
