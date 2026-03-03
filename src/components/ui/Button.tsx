import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-teal-500 hover:bg-teal-400 text-white": variant === "primary",
            "bg-forest-500 hover:bg-forest-600 text-white": variant === "secondary",
            "border-2 border-teal-500 text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950":
              variant === "outline",
            "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800":
              variant === "ghost",
          },
          {
            "py-2 px-4 text-sm": size === "sm",
            "py-3 px-6 text-base": size === "md",
            "py-4 px-8 text-lg": size === "lg",
          },
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export default Button;
