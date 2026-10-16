import * as React from "react";
import { cn } from "cn";
import { Circle } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

function RadioGroup({ className, ...props }) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-2.5", className)}
      {...props}
    />
  );
}

function RadioGroupItem({ className, ...props }) {
  return (
    <div className="inline-flex items-center justify-center p-1 cursor-pointer min-h-[24px] min-w-[24px]">
      <RadioGroupPrimitive.Item
        data-slot="radio-group-item"
        className={cn(
          "aspect-square size-4 shrink-0 rounded-full border border-line bg-surface shadow-2xs transition-colors duration-fast outline-none cursor-pointer",
          "hover:border-line-strong",
          "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:border-accent data-[state=checked]:text-accent",
          className
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator
          data-slot="radio-group-indicator"
          className="relative flex items-center justify-center"
        >
          <Circle className="size-2 fill-accent text-accent" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    </div>
  );
}

export { RadioGroup, RadioGroupItem };
