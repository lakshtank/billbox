import * as React from "react";
import { cn } from "cn";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import * as m from "motion/react-m";

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
          <svg viewBox="0 0 16 16" className="size-3 text-white">
            <m.path
              d="M3.5 8.5l3 3 6-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </div>
  );
}

export { Checkbox };
export default Checkbox;
