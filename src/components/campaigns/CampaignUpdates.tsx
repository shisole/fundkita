import { type TableRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface CampaignUpdatesProps {
  updates: TableRow<"campaign_updates">[];
  className?: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function CampaignUpdates({ updates, className }: CampaignUpdatesProps) {
  if (updates.length === 0) {
    return (
      <p className={cn("text-sm text-gray-500 dark:text-gray-400", className)}>
        No updates yet. Check back later!
      </p>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Vertical timeline line */}
      <div className="absolute bottom-0 left-3 top-0 w-px bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-6">
        {updates.map((update) => (
          <div key={update.id} className="relative pl-8">
            {/* Timeline dot */}
            <div className="absolute left-1.5 top-1 h-3 w-3 rounded-full border-2 border-teal-500 bg-white dark:bg-gray-900" />

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">{update.title}</h4>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {formatDate(update.created_at)}
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {update.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
