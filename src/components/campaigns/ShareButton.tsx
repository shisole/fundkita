"use client";

import { useCallback, useState } from "react";

import { ShareIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  title: string;
  slug: string;
}

export default function ShareButton({ title, slug }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = `${globalThis.location.origin}/campaigns/${slug}`;

    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
    setCopied(true);
    globalThis.setTimeout(() => setCopied(false), 2000);
  }, [title, slug]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-gray-700 dark:text-gray-300 dark:hover:border-teal-600 dark:hover:bg-teal-950 dark:hover:text-teal-400"
      >
        <ShareIcon className="h-4 w-4" />
        Share
      </button>

      {/* Copied toast */}
      <div
        className={cn(
          "absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-all dark:bg-gray-100 dark:text-gray-900",
          copied ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 pointer-events-none",
        )}
      >
        Link copied!
      </div>
    </div>
  );
}
