"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SpinnerIcon } from "@/components/icons";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { CAMPAIGN_CATEGORIES } from "@/lib/constants/categories";
import { type CampaignCategory, type TableRow } from "@/lib/supabase/types";

import ImageUploader from "./ImageUploader";

type CampaignData = TableRow<"campaigns">;

interface CampaignFormProps {
  initialData?: CampaignData;
  mode: "create" | "edit";
}

export default function CampaignForm({ initialData, mode }: CampaignFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [category, setCategory] = useState<CampaignCategory>(initialData?.category ?? "medical");
  const [goalAmount, setGoalAmount] = useState(
    initialData?.goal_amount === undefined ? "" : String(initialData.goal_amount),
  );
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [endDate, setEndDate] = useState(initialData?.end_date ?? "");
  const [featuredImage, setFeaturedImage] = useState<string[]>(
    initialData?.featured_image_url ? [initialData.featured_image_url] : [],
  );

  const categoryOptions = CAMPAIGN_CATEGORIES.map((c) => ({
    value: c.value,
    label: `${c.icon} ${c.label}`,
  }));

  const handleSubmit = async (e: React.SyntheticEvent, draft = false) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    const amount = Number(goalAmount);
    if (!amount || amount <= 0) {
      setError("Goal amount must be a positive number");
      return;
    }
    if (!location.trim()) {
      setError("Location is required");
      return;
    }

    setLoading(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      goal_amount: amount,
      location: location.trim(),
      end_date: endDate || null,
      featured_image_url: featuredImage[0] ?? null,
      draft,
    };

    const url =
      mode === "edit" && initialData ? `/api/campaigns/${initialData.id}` : "/api/campaigns";
    const method = mode === "edit" ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- res.json() returns any
    const resBody: Record<string, unknown> = await res.json();

    if (!res.ok) {
      const errMsg = typeof resBody.error === "string" ? resBody.error : "Something went wrong";
      setError(errMsg);
      setLoading(false);
      return;
    }

    router.push(`/dashboard/campaigns/${String(resBody.id)}`);
    router.refresh();
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <Input
        id="title"
        label="Campaign title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Help rebuild after Typhoon..."
        required
      />

      <Textarea
        id="description"
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Tell your story. Why are you raising funds?"
        rows={6}
        showCount
        maxLength={5000}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="category"
          label="Category"
          value={category}
          onChange={(e) => {
            const match = CAMPAIGN_CATEGORIES.find((c) => c.value === e.target.value);
            if (match) setCategory(match.value);
          }}
          options={categoryOptions}
        />

        <Input
          id="location"
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Manila, Philippines"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="goalAmount"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Goal amount (PHP)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₱</span>
            <input
              id="goalAmount"
              type="number"
              min="100"
              step="1"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              placeholder="10,000"
              required
              className="block w-full rounded-xl border border-gray-300 bg-white py-3 pl-8 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <Input
          id="endDate"
          label="End date (optional)"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Featured image
        </label>
        <ImageUploader value={featuredImage} onChange={setFeaturedImage} bucket="campaign-images" />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <SpinnerIcon className="h-5 w-5 animate-spin" />
          ) : mode === "edit" ? (
            "Save changes"
          ) : (
            "Submit for review"
          )}
        </Button>
        {mode === "create" && (
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={(e) => void handleSubmit(e, true)}
          >
            Save as draft
          </Button>
        )}
      </div>
    </form>
  );
}
