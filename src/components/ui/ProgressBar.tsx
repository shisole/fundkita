import { type HTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  variant?: "default" | "success" | "warning";
  size?: "sm" | "md";
  showLabel?: boolean;
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, variant = "default", size = "md", showLabel = false, ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
      <div className={cn("flex items-center gap-3", className)} ref={ref} {...props}>
        <div
          className={cn("w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700", {
            "h-2": size === "sm",
            "h-3": size === "md",
          })}
        >
          <div
            className={cn("h-full transition-all duration-300", {
              "bg-teal-500": variant === "default" || variant === "success",
              "bg-golden-500": variant === "warning",
            })}
            style={{ width: `${String(clampedValue)}%` }}
          />
        </div>
        {showLabel && (
          <span className="min-w-[3ch] text-sm font-medium text-gray-700 dark:text-gray-300">
            {Math.round(clampedValue)}%
          </span>
        )}
      </div>
    );
  },
);

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;
