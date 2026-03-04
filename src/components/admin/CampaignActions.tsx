"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Modal, Textarea } from "@/components/ui";
import { type CampaignStatus } from "@/lib/supabase/types";

interface CampaignActionsProps {
  campaignId: string;
  currentStatus: CampaignStatus;
}

export default function CampaignActions({ campaignId, currentStatus }: CampaignActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");

  const handleAction = async (action: "approve" | "reject" | "pause" | "unpause") => {
    setIsLoading(true);
    setError("");

    try {
      const body: { action: string; reason?: string } = { action };
      if (action === "reject" && rejectReason.trim()) {
        body.reason = rejectReason.trim();
      }

      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data: { error?: string } = await response.json();
        throw new Error(data.error ?? "Action failed");
      }

      setShowRejectModal(false);
      setRejectReason("");
      router.refresh();
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : "An error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const canApprove = currentStatus === "pending_review";
  const canReject = currentStatus === "pending_review";
  const canPause = currentStatus === "active";
  const canUnpause = currentStatus === "paused";

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {canApprove && (
          <Button
            onClick={() => handleAction("approve")}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-500"
          >
            {isLoading ? "Processing..." : "Approve"}
          </Button>
        )}

        {canReject && (
          <Button
            onClick={() => setShowRejectModal(true)}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-500"
          >
            Reject
          </Button>
        )}

        {canPause && (
          <Button
            onClick={() => handleAction("pause")}
            disabled={isLoading}
            variant="outline"
            className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-950"
          >
            {isLoading ? "Processing..." : "Pause"}
          </Button>
        )}

        {canUnpause && (
          <Button
            onClick={() => handleAction("unpause")}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-500"
          >
            {isLoading ? "Processing..." : "Unpause"}
          </Button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Campaign"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please provide a reason for rejecting this campaign. This will be visible to the
            organizer.
          </p>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows={4}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowRejectModal(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => handleAction("reject")}
              disabled={isLoading || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-500"
            >
              {isLoading ? "Rejecting..." : "Confirm Reject"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
