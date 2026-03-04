"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FlagIcon, SpinnerIcon } from "@/components/icons";
import { Button, Input, Select } from "@/components/ui";

interface CreateFraudFlagProps {
  campaigns: { value: string; label: string }[];
}

export default function CreateFraudFlag({ campaigns }: CreateFraudFlagProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [campaignId, setCampaignId] = useState(campaigns[0]?.value ?? "");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");

    if (!campaignId) {
      setError("Please select a campaign");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a reason for the flag");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/admin/fraud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaign_id: campaignId,
        reason: reason.trim(),
      }),
    });

    if (res.ok) {
      setReason("");
      setIsOpen(false);
      router.refresh();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- res.json() returns any
      const data: { error?: string } = await res.json();
      setError(typeof data.error === "string" ? data.error : "Something went wrong");
    }

    setLoading(false);
  };

  if (!isOpen) {
    return (
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        <FlagIcon className="mr-2 h-4 w-4" />
        Create Fraud Flag
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10"
    >
      <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Create New Fraud Flag</h3>

      {error && (
        <div className="mb-3 rounded-lg bg-red-100 p-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Select
            id="flagCampaign"
            label="Campaign"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            options={[{ value: "", label: "Select a campaign..." }, ...campaigns]}
          />
        </div>
        <div className="flex-1">
          <Input
            id="flagReason"
            label="Reason"
            placeholder="Describe the suspected fraud..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : "Submit Flag"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setIsOpen(false);
            setError("");
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
