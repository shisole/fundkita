"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const showFallback = !src || imageError;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full",
        {
          "h-8 w-8": size === "sm",
          "h-10 w-10": size === "md",
          "h-14 w-14": size === "lg",
        },
        showFallback && "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200",
        className,
      )}
    >
      {showFallback ? (
        <div
          className={cn("flex h-full w-full items-center justify-center font-semibold", {
            "text-xs": size === "sm",
            "text-sm": size === "md",
            "text-base": size === "lg",
          })}
        >
          {getInitials(alt)}
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}
