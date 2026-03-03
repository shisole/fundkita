import { type CampaignStatus, type PaymentStatus } from "@/lib/supabase/types";

import Badge from "./Badge";

type Status = CampaignStatus | PaymentStatus;

const STATUS_VARIANT_MAP: Record<Status, "default" | "success" | "warning" | "error" | "info"> = {
  // Campaign statuses
  draft: "default",
  pending_review: "warning",
  active: "success",
  paused: "warning",
  completed: "info",
  closed: "default",
  // Payment statuses
  pending: "warning",
  confirmed: "success",
  failed: "error",
  refunded: "info",
};

const STATUS_LABEL_MAP: Record<Status, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  closed: "Closed",
  pending: "Pending",
  confirmed: "Confirmed",
  failed: "Failed",
  refunded: "Refunded",
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT_MAP[status]} className={className}>
      {STATUS_LABEL_MAP[status]}
    </Badge>
  );
}
