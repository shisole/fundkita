"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SpinnerIcon } from "@/components/icons";
import { Button, Input } from "@/components/ui";

interface FraudActionsProps {
  flagId: string;
  campaignId: string;
}

export default function FraudActions({ flagId, campaignId }: FraudActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [notes, setNotes] = useState("");
  const [pendingAction, setPendingAction] = useState<"resolve" | "dismiss" | "pause_campaign">(
    "resolve",
  );
  const [error, setError] = useState("");

  const handleAction = async (action: "resolve" | "dismiss" | "pause_campaign") => {
    if ((action === "resolve" || action === "pause_campaign") && !showNotesInput) {
      setPendingAction(action);
      setShowNotesInput(true);
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/fraud", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flag_id: flagId,
        action: action === "pause_campaign" ? action : pendingAction,
        notes: notes.trim() || undefined,
      }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- res.json() returns any
      const data: { error?: string } = await res.json();
      setError(typeof data.error === "string" ? data.error : "Something went wrong");
    }

    setLoading(false);
  };

  // campaignId used for identification in parent context
  void campaignId;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => void handleAction("resolve")}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {loading ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : "Resolve"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void handleAction("dismiss")}
          disabled={loading}
        >
          Dismiss
        </Button>
        <Button
          size="sm"
          onClick={() => void handleAction("pause_campaign")}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Pause Campaign
        </Button>
      </div>

      {showNotesInput && (
        <div className="flex gap-2">
          <Input
            placeholder="Notes (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-xs"
          />
          <Button
            size="sm"
            onClick={() => void handleAction(pendingAction)}
            disabled={loading}
            className="shrink-0"
          >
            Confirm
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
