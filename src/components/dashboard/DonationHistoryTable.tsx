"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { SortIcon, SpinnerIcon } from "@/components/icons";
import { Button, EmptyState, StatusBadge } from "@/components/ui";
import { type PaymentMethod, type PaymentStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface DonationWithCampaign {
  id: string;
  campaign_id: string;
  amount_php: number;
  original_amount: number;
  original_currency: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  is_anonymous: boolean;
  created_at: string;
  campaigns: { title: string; slug: string } | null;
}

interface HistoryResponse {
  donations: DonationWithCampaign[];
  total: number;
  page: number;
  limit: number;
}

type SortField = "created_at" | "amount_php" | "payment_status";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 20;

const METHOD_LABELS: Record<PaymentMethod, string> = {
  gcash: "GCash",
  maya: "Maya",
  card: "Card",
  bank_transfer: "Bank Transfer",
  gotyme: "GoTyme",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function DonationHistoryTable() {
  const [donations, setDonations] = useState<DonationWithCampaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchDonations = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/donations/history?page=${String(pageNum)}&limit=${String(PAGE_SIZE)}`,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data: HistoryResponse = await res.json();
      setDonations(data.donations);
      setTotal(data.total);
      setPage(data.page);
    } catch {
      // Fetch error — leave empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDonations(page);
  }, [fetchDonations, page]);

  const sortedDonations = [...donations].sort((a, b) => {
    const dir = sortDirection === "asc" ? 1 : -1;
    if (sortField === "created_at") {
      return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    if (sortField === "amount_php") {
      return dir * (a.amount_php - b.amount_php);
    }
    return dir * a.payment_status.localeCompare(b.payment_status);
  });

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <SpinnerIcon className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <EmptyState
        title="No donations yet"
        description="Your donation history will appear here once you make your first contribution."
      />
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <SortableHeader
                label="Date"
                field="created_at"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Campaign
              </th>
              <SortableHeader
                label="Amount"
                field="amount_php"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Currency
              </th>
              <SortableHeader
                label="Status"
                field="payment_status"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Method
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Anonymous?
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {sortedDonations.map((donation) => (
              <tr key={donation.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {new Date(donation.created_at).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-sm">
                  {donation.campaigns ? (
                    <Link
                      href={`/campaigns/${donation.campaigns.slug}`}
                      className="font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                    >
                      {donation.campaigns.title}
                    </Link>
                  ) : (
                    <span className="text-gray-400">Unknown campaign</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  PHP {donation.amount_php.toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {donation.original_currency}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <StatusBadge status={donation.payment_status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {METHOD_LABELS[donation.payment_method]}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                  {donation.is_anonymous ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                setPage((p) => p - 1);
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => {
                setPage((p) => p + 1);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sortable header helper ───────────────────────────────────────────────────

interface SortableHeaderProps {
  label: string;
  field: SortField;
  activeField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}

function SortableHeader({ label, field, activeField, direction, onSort }: SortableHeaderProps) {
  const isActive = field === activeField;

  return (
    <th
      className="cursor-pointer select-none px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      onClick={() => {
        onSort(field);
      }}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon className={cn("h-3.5 w-3.5", isActive ? "text-teal-500" : "text-gray-300")} />
        {isActive && (
          <span className="text-teal-500">{direction === "asc" ? "\u2191" : "\u2193"}</span>
        )}
      </span>
    </th>
  );
}
