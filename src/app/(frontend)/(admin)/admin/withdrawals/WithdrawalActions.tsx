"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SpinnerIcon } from "@/components/icons";
import { Button, Input } from "@/components/ui";
import { type WithdrawalStatus } from "@/lib/supabase/types";

interface WithdrawalActionsProps {
  withdrawalId: string;
  currentStatus: WithdrawalStatus;
}

export default function WithdrawalActions({ withdrawalId, currentStatus }: WithdrawalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");

  const handleAction = async (status: WithdrawalStatus) => {
    if (status === "rejected" && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (status === "rejected" && !rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`/api/withdrawals/${withdrawalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        rejection_reason: status === "rejected" ? rejectionReason.trim() : undefined,
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

  // No actions for already processed or rejected
  if (currentStatus === "processed" || currentStatus === "rejected") {
    return (
      <span className="text-xs text-gray-400">
        {currentStatus === "processed" ? "Completed" : "Rejected"}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {currentStatus === "pending" && (
          <Button
            size="sm"
            onClick={() => void handleAction("approved")}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : "Approve"}
          </Button>
        )}

        {currentStatus === "approved" && (
          <Button
            size="sm"
            onClick={() => void handleAction("processed")}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {loading ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : "Mark Processed"}
          </Button>
        )}

        {currentStatus === "pending" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleAction("rejected")}
            disabled={loading}
            className="border-red-500 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            Reject
          </Button>
        )}
      </div>

      {showRejectInput && (
        <div className="flex gap-2">
          <Input
            placeholder="Rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="text-xs"
          />
          <Button
            size="sm"
            onClick={() => void handleAction("rejected")}
            disabled={loading || !rejectionReason.trim()}
            className="shrink-0 bg-red-600 hover:bg-red-700 text-white"
          >
            Confirm
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
