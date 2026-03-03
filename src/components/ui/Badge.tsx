import { type HTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          {
            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200": variant === "default",
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200":
              variant === "success",
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200":
              variant === "warning",
            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200": variant === "error",
            "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200": variant === "info",
          },
          className,
        )}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";

export default Badge;
