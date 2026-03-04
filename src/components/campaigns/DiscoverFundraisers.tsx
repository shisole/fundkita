"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import BentoCompactCard from "@/components/campaigns/BentoCompactCard";
import BentoFeaturedCard from "@/components/campaigns/BentoFeaturedCard";
import { type CampaignWithOrganizer } from "@/components/campaigns/CampaignCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { Button, Skeleton } from "@/components/ui";
import { CAMPAIGN_CATEGORIES } from "@/lib/constants/categories";
import { type CampaignCategory } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;
const SKELETON_DURATION = 400;

interface DiscoverFundraisersProps {
  campaigns: CampaignWithOrganizer[];
}

type CategoryFilter = "all" | CampaignCategory;

const CATEGORY_TABS: { value: CategoryFilter; label: string; icon?: string }[] = [
  { value: "all", label: "All" },
  ...CAMPAIGN_CATEGORIES.map((c) => {
    const tab: { value: CategoryFilter; label: string; icon: string } = {
      value: c.value,
      label: c.label,
      icon: c.icon,
    };
    return tab;
  }),
];

type SwipeDirection = "left" | "right";
type TransitionPhase = "idle" | "exit" | "skeleton" | "enter";

export default function DiscoverFundraisers({ campaigns }: DiscoverFundraisersProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [direction, setDirection] = useState<SwipeDirection>("left");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return campaigns;
    return campaigns.filter((c) => c.category === activeCategory);
  }, [campaigns, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = filtered.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE);
  const featured = currentPage[0];
  const compacts = currentPage.slice(1);

  const isAnimating = phase !== "idle";

  const triggerSwipe = useCallback((dir: SwipeDirection, action: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDirection(dir);
    setPhase("exit");

    // Exit animation (250ms) → show skeleton
    timerRef.current = setTimeout(() => {
      action();
      setPhase("skeleton");

      // Skeleton visible (400ms) → enter animation
      timerRef.current = setTimeout(() => {
        setPhase("enter");

        // Enter animation done (350ms) → idle
        timerRef.current = setTimeout(() => {
          setPhase("idle");
        }, 350);
      }, SKELETON_DURATION);
    }, 250);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleCategoryChange(cat: CategoryFilter) {
    if (cat === activeCategory || isAnimating) return;
    triggerSwipe("left", () => {
      setActiveCategory(cat);
      setPageIndex(0);
    });
  }

  function handlePrev() {
    triggerSwipe("right", () => setPageIndex((p) => p - 1));
  }

  function handleNext() {
    triggerSwipe("left", () => setPageIndex((p) => p + 1));
  }

  // Pick animation class based on phase + direction
  const gridAnimationClass =
    phase === "exit"
      ? direction === "left"
        ? "animate-slide-out-left"
        : "animate-slide-out-right"
      : phase === "enter"
        ? direction === "left"
          ? "animate-slide-in-right"
          : "animate-slide-in-left"
        : "";

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {/* Header + Nav arrows */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">
          Discover Fundraisers
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={pageIndex === 0 || isAnimating}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={pageIndex >= totalPages - 1 || isAnimating}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Next page"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleCategoryChange(tab.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activeCategory === tab.value
                ? "bg-teal-500 text-white"
                : "border border-gray-200 bg-white text-gray-700 hover:border-teal-300 hover:text-teal-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-teal-600",
            )}
          >
            {tab.icon ? `${tab.icon} ${tab.label}` : tab.label}
          </button>
        ))}
      </div>

      {/* Bento grid */}
      <div className="overflow-hidden">
        {phase === "skeleton" ? (
          <BentoSkeleton direction={direction} />
        ) : currentPage.length > 0 ? (
          <div
            key={`${activeCategory}-${String(pageIndex)}`}
            className={cn(
              "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2",
              gridAnimationClass,
            )}
          >
            {/* Featured card — spans 2 rows on desktop */}
            <div className="min-h-[280px] sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:min-h-0">
              <BentoFeaturedCard campaign={featured} />
            </div>

            {/* Compact cards */}
            {compacts.map((campaign) => (
              <BentoCompactCard key={campaign.id} campaign={campaign} />
            ))}

            {/* Fill empty slots so grid doesn't collapse */}
            {compacts.length < 4 &&
              Array.from({ length: 4 - compacts.length }).map((_, i) => (
                <div key={`empty-${String(i)}`} className="hidden lg:block" />
              ))}
          </div>
        ) : (
          <div
            className={cn(
              "flex h-48 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-gray-500 dark:border-gray-700 dark:text-gray-400",
              gridAnimationClass,
            )}
          >
            No campaigns found in this category.
          </div>
        )}
      </div>

      {/* View all CTA */}
      <div className="mt-8 text-center">
        <Link href="/campaigns">
          <Button variant="outline" size="md">
            View all campaigns
          </Button>
        </Link>
      </div>
    </section>
  );
}

// ── Skeleton grid shown during transitions ──────────────────────────────────────

function BentoSkeleton({ direction }: { direction: SwipeDirection }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2",
        direction === "left" ? "animate-slide-in-right" : "animate-slide-in-left",
      )}
    >
      {/* Featured skeleton */}
      <div className="min-h-[280px] overflow-hidden rounded-2xl sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:min-h-0">
        <Skeleton className="h-full w-full rounded-2xl" />
      </div>
      {/* 4 compact skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={`skel-${String(i)}`} className="overflow-hidden rounded-xl">
          <Skeleton className="aspect-[16/10] w-full" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-1.5 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
