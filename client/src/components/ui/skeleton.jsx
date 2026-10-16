import * as React from "react";
import { cn } from "cn";

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "skeleton rounded-[8px] bg-subtle animate-[pulse_1.4s_cubic-bezier(0.4,0,0.6,1)_infinite] select-none",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
