"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "@/context/ThemeContext"
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      visibleToasts={3}
      duration={5000}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-fg group-[.toaster]:border-line group-[.toaster]:shadow-[var(--elevation-2)] group-[.toaster]:rounded-lg group-[.toaster]:p-3.5 group-[.toaster]:gap-2.5 group-[.toaster]:w-[360px] group-[.toaster]:text-sm",
          title: "text-[14px] font-medium text-fg",
          description: "text-[13px] text-fg-2",
          actionButton:
            "group-[.toast]:bg-accent group-[.toast]:text-on-accent text-xs font-medium px-3 py-1.5 rounded-md hover:bg-accent-hover transition-colors",
          cancelButton:
            "group-[.toast]:bg-hover group-[.toast]:text-fg-2 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
          success: "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-ok-solid",
          error: "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-bad-solid",
          warning: "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-warn-solid",
          info: "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-accent",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-ok-solid" />,
        info: <InfoIcon className="size-4 text-accent" />,
        warning: <TriangleAlertIcon className="size-4 text-warn-solid" />,
        error: <OctagonXIcon className="size-4 text-bad-solid" />,
        loading: <Loader2Icon className="size-4 animate-spin text-accent" />,
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
};

export { Toaster };
