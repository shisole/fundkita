import Image from "next/image";

import { CAMPAIGN_CATEGORIES } from "@/lib/constants/categories";

const ORIGIN_IMAGE_URL = "/images/origin-story.jpg";

export default function OriginStory() {
  return (
    <section className="py-16 sm:py-20">
      <div className="grid items-center gap-10 px-4 lg:grid-cols-[3fr_2fr] lg:gap-0 lg:px-0">
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden lg:rounded-r-2xl lg:rounded-l-none">
          <Image
            src={ORIGIN_IMAGE_URL}
            alt="Young Filipino athletes competing together"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        {/* Content */}
        <div className="lg:w-4/5 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Talented Kids, Limited Resources
          </h2>

          <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400">
            Across the Philippines, kids with real talent can&apos;t compete because their families
            can&apos;t afford the trip. FundKita helps communities rally behind them — and every
            other Filipino cause that needs a hand.
          </p>

          {/* Category pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {CAMPAIGN_CATEGORIES.map((cat) => (
              <span
                key={cat.value}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {cat.icon} {cat.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
