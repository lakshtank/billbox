import * as React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Toaster as Sonner } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import * as m from "motion/react-m";
import {
  AlertTriangle,
  XCircle,
  Info,
  Loader2,
} from "lucide-react";

/**
 * Animated Check Icon for Success Toasts:
 * Draws SVG pathLength over 220ms and springs from scale 0.6 -> 1
 */
function SuccessToastIcon() {
  return (
    <m.span
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex items-center justify-center shrink-0"
    >
      <svg
        className="size-4 text-ok-solid"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <m.path
          d="M20 6L9 17L4 12"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </m.span>
  );
}

function SpringIcon({ children }) {
  return (
    <m.span
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex items-center justify-center shrink-0"
    >
      {children}
    </m.span>
  );
}

export function Toaster({ ...props }) {
  const { theme = "light" } = useTheme();
  const isMobile = useMediaQuery("(max-width: 639px)");
  const sonnerTheme = theme === 'dark' || theme === 'gentle' ? 'dark' : 'light';

  return (
    <Sonner
      theme={sonnerTheme}
      position={isMobile ? "top-center" : "bottom-right"}
      /* position="bottom-right" on desktop, top-center on mobile */
      visibleToasts={3}
      gap={8}
      offset={{ bottom: 24, right: 24 }}
      mobileOffset={{ top: "calc(env(safe-area-inset-top) + 8px)", left: 12, right: 12 }}
      closeButton
      expand={false}
      duration={5000}
      swipeDirections={isMobile ? ["up"] : ["right"]}
      className="toaster group"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "toast group relative flex w-full items-start gap-3 rounded-lg border border-line bg-surface p-3 pr-9 shadow-[var(--elevation-2)] text-sm text-fg",
          title: "font-medium leading-5 text-fg",
          description: "mt-0.5 text-[13px] leading-[18px] text-fg-2",
          actionButton:
            "ml-auto shrink-0 rounded-md px-2.5 h-7 text-[13px] font-medium text-accent hover:bg-accent-tint transition-colors cursor-pointer",
          cancelButton:
            "rounded-md px-2.5 h-7 text-[13px] text-fg-2 hover:bg-hover transition-colors cursor-pointer",
          closeButton:
            "absolute right-2 top-2 size-6 rounded-md text-fg-3 hover:text-fg hover:bg-hover flex items-center justify-center transition-colors cursor-pointer",
          success: "toast-ok border-l-[3px] border-l-ok-solid",
          error: "toast-bad border-l-[3px] border-l-bad-solid",
          warning: "toast-warn border-l-[3px] border-l-warn-solid",
          info: "toast-info border-l-[3px] border-l-accent",
        },
      }}
      icons={{
        success: <SuccessToastIcon />,
        info: (
          <SpringIcon>
            <Info className="size-4 text-accent" />
          </SpringIcon>
        ),
        warning: (
          <SpringIcon>
            <AlertTriangle className="size-4 text-warn-solid" />
          </SpringIcon>
        ),
        error: (
          <SpringIcon>
            <XCircle className="size-4 text-bad-solid" />
          </SpringIcon>
        ),
        loading: <Loader2 className="size-4 animate-spin text-accent" />,
      }}
      style={{
        "--normal-bg": "var(--bg-surface)",
        "--normal-text": "var(--fg-primary)",
        "--normal-border": "var(--line-default)",
        "--border-radius": "var(--radius-md)",
      }}
      {...props}
    />
  );
}

export default Toaster;
