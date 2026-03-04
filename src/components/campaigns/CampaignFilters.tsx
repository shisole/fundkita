"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { SortIcon } from "@/components/icons";
import { CAMPAIGN_CATEGORIES } from "@/lib/constants/categories";
import { type CampaignCategory } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "most_recent", label: "Most Recent" },
  { value: "most_funded", label: "Most Funded" },
  { value: "ending_soon", label: "Ending Soon" },
  { value: "near_goal", label: "Near Goal" },
] as const;

export default function CampaignFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory: string = searchParams.get("category") ?? "";
  const activeSort = searchParams.get("sort") ?? "most_recent";

  function handleCategoryClick(category: CampaignCategory) {
    const params = new URLSearchParams(searchParams.toString());

    if (activeCategory === category) {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    // Reset to page 1 when filters change
    params.delete("page");

    const query = params.toString();
    router.replace(query ? `?${query}` : "/campaigns", { scroll: false });
  }

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    const sortValue = e.target.value;

    if (sortValue === "most_recent") {
      params.delete("sort");
    } else {
      params.set("sort", sortValue);
    }

    // Reset to page 1 when sort changes
    params.delete("page");

    const query = params.toString();
    router.replace(query ? `?${query}` : "/campaigns", { scroll: false });
  }

  return (
    <div className="space-y-4">
      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CAMPAIGN_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => {
              handleCategoryClick(cat.value);
            }}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              activeCategory === cat.value
                ? "border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-400 dark:bg-teal-950 dark:text-teal-300"
                : "border-gray-200 bg-white text-gray-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-teal-600 dark:hover:bg-teal-950 dark:hover:text-teal-400",
            )}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <div className="flex items-center gap-2">
        <SortIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <div className="relative">
          <select
            value={activeSort}
            onChange={handleSortChange}
            className={cn(
              "appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700",
              "focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20",
              "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300",
              "dark:focus:border-teal-400 dark:focus:ring-teal-400/20",
            )}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <svg
              className="h-4 w-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
