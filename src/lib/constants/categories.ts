import { type CampaignCategory } from "@/lib/supabase/types";

export interface CategoryMeta {
  value: CampaignCategory;
  label: string;
  icon: string;
}

export const CAMPAIGN_CATEGORIES: readonly CategoryMeta[] = [
  { value: "medical", label: "Medical", icon: "\u{1F3E5}" },
  { value: "disaster_relief", label: "Disaster Relief", icon: "\u{1F30A}" },
  { value: "education", label: "Education", icon: "\u{1F4DA}" },
  { value: "community", label: "Community", icon: "\u{1F3D8}\uFE0F" },
  { value: "emergency", label: "Emergency", icon: "\u{1F6A8}" },
  { value: "personal", label: "Personal", icon: "\u{1F64B}" },
  { value: "other", label: "Other", icon: "\u{1F4A1}" },
] as const;

/** Look up category metadata by value. */
export function getCategoryMeta(value: CampaignCategory): CategoryMeta {
  const found = CAMPAIGN_CATEGORIES.find((c) => c.value === value);
  if (!found) throw new Error(`Unknown category: ${value}`);
  return found;
}
