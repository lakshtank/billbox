import * as React from "react";
import { cn } from "cn";
import { Check } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

function Checkbox({ className, ...props }) {
  return (
    <div className="inline-flex items-center justify-center p-1 cursor-pointer">
      <CheckboxPrimitive.Root
        data-slot="checkbox"
        className={cn(
          "peer size-4 shrink-0 rounded-[4px] border border-line bg-surface shadow-2xs transition-colors duration-fast outline-none cursor-pointer",
          "hover:border-line-strong",
          "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-on-accent",
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          data-slot="checkbox-indicator"
          className="grid place-content-center text-current"
        >
          <Check className="size-3 text-white stroke-[2.5]" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </div>
  );
}

export { Checkbox };
