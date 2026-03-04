"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SearchIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export default function CampaignSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialValue = searchParams.get("search") ?? "";
  const [value, setValue] = useState(initialValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Sync state when URL changes externally (e.g. browser back/forward)
    const urlValue = searchParams.get("search") ?? "";
    setValue(urlValue);
  }, [searchParams]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setValue(newValue);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (newValue.trim()) {
        params.set("search", newValue.trim());
      } else {
        params.delete("search");
      }

      // Reset to page 1 when search changes
      params.delete("page");

      const query = params.toString();
      router.replace(query ? `?${query}` : "/campaigns", { scroll: false });
    }, 300);
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <SearchIcon
        className={cn(
          "absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400",
          "dark:text-gray-500",
        )}
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search campaigns..."
        className={cn(
          "w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900",
          "placeholder:text-gray-400",
          "focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20",
          "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500",
        )}
      />
    </div>
  );
}
