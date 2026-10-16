import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "cn";

const SearchInput = React.forwardRef(
  (
    {
      className,
      inputClassName,
      size = "default",
      value,
      onChange,
      onClear,
      placeholder = "Search...",
      showShortcut = true,
      onShortcutClick,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState("");
    const currentValue = isControlled ? value : internalValue;

    const handleChange = (e) => {
      if (!isControlled) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    };

    const handleClear = () => {
      if (!isControlled) {
        setInternalValue("");
      }
      if (onClear) {
        onClear();
      } else if (onChange) {
        onChange({ target: { value: "" } });
      }
    };

    return (
      <div className={cn("relative flex items-center w-full min-w-0", className)}>
        <Search className="absolute left-3 size-4 text-fg-3 pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={currentValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            size === "sm" ? "h-9 text-xs" : "h-10 text-sm",
            "w-full rounded-[8px] border border-line bg-surface pl-9 pr-14 text-fg shadow-2xs transition-colors duration-fast outline-none",
            "placeholder:text-fg-3 hover:border-line-strong",
            "focus-visible:border-line-focus focus-visible:ring-2 focus-visible:ring-accent/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            inputClassName
          )}
          {...props}
        />
        <div className="absolute right-2.5 flex items-center gap-1">
          {currentValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-fg-3 hover:text-fg hover:bg-hover transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : showShortcut ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={onShortcutClick}
              className="hidden md:inline-flex items-center gap-0.5 rounded border border-line bg-subtle px-1.5 py-0.5 font-mono text-[10px] font-medium text-fg-3 select-none"
            >
              <span>⌘</span>K
            </button>
          ) : null}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
