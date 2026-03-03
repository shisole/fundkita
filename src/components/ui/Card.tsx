import { type HTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 hover:shadow-lg transition-shadow",
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";

export default Card;
