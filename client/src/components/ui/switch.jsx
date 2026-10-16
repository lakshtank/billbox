import * as React from "react";
import { cn } from "cn";
import { Switch as SwitchPrimitive } from "radix-ui";

function Switch({ className, ...props }) {
  return (
    <div className="inline-flex items-center justify-center p-0.5 cursor-pointer min-h-[24px] min-w-[24px]">
      <SwitchPrimitive.Root
        data-slot="switch"
        className={cn(
          "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-colors duration-fast outline-none cursor-pointer",
          "bg-line-strong",
          "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-accent",
          className
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className={cn(
            "pointer-events-none block size-4 rounded-full bg-white shadow-xs transition-transform duration-fast",
            "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5"
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  );
}

export { Switch };
