import * as React from "react";
import { cn } from "cn";

/**
 * CurrencyInput component
 * - Right-aligned text
 * - Tabular numbers (.tnum)
 * - Prefix displays currency code (e.g. INR, USD)
 * - Number grouping applied on blur only, raw numeric editable on focus
 */
const CurrencyInput = React.forwardRef(
  (
    {
      className,
      value,
      onChange,
      currency = "INR",
      error = false,
      placeholder = "0.00",
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [displayValue, setDisplayValue] = React.useState("");

    // Helper to format currency grouping
    const formatGrouping = React.useCallback((val) => {
      if (val === "" || val === null || val === undefined) return "";
      const num = Number(val);
      if (Number.isNaN(num)) return String(val);
      try {
        return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num);
      } catch {
        return num.toFixed(2);
      }
    }, [currency]);

    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(value !== undefined && value !== null && value !== "" ? formatGrouping(value) : "");
      } else {
        setDisplayValue(value !== undefined && value !== null ? String(value) : "");
      }
    }, [value, isFocused, formatGrouping]);

    const handleFocus = (e) => {
      setIsFocused(true);
      setDisplayValue(value !== undefined && value !== null ? String(value) : "");
      props.onFocus?.(e);
    };

    const handleBlur = (e) => {
      setIsFocused(false);
      setDisplayValue(value !== undefined && value !== null && value !== "" ? formatGrouping(value) : "");
      props.onBlur?.(e);
    };

    const handleChange = (e) => {
      const raw = e.target.value.replace(/[^0-9.-]/g, "");
      setDisplayValue(raw);
      onChange?.(raw);
    };

    return (
      <div className={cn("relative flex items-center w-full min-w-0", className)}>
        <span className="absolute left-3 text-xs font-semibold text-fg-3 select-none pointer-events-none">
          {currency}
        </span>
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          data-error={error}
          className={cn(
            "h-10 w-full rounded-[8px] border border-line bg-surface pl-12 pr-3 py-2 text-right text-sm text-fg shadow-2xs transition-colors duration-fast outline-none focus:outline-none focus-visible:outline-none tnum font-tabular",
            "placeholder:text-fg-3 hover:border-line-strong",
            "focus:border-line-focus focus-visible:border-line-focus focus:ring-0 focus-visible:ring-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-bad-solid focus:border-bad-solid focus-visible:border-bad-solid focus:ring-0 focus-visible:ring-0"
          )}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
