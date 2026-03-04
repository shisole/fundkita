import Link from "next/link";

import { Badge, Breadcrumbs, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { type PayoutMethod, type TableRow, type WithdrawalStatus } from "@/lib/supabase/types";

import WithdrawalActions from "./WithdrawalActions";

export const metadata = {
  title: "Withdrawals | Admin | FundKita",
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "processed", label: "Processed" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const STATUS_VARIANT_MAP: Record<WithdrawalStatus, "warning" | "success" | "info" | "error"> = {
  pending: "warning",
  approved: "info",
  processed: "success",
  rejected: "error",
};

const PAYOUT_LABELS: Record<PayoutMethod, string> = {
  gcash: "GCash",
  maya: "Maya",
  bank_transfer: "Bank Transfer",
};

interface WithdrawalWithRelations extends TableRow<"withdrawal_requests"> {
  campaigns: {
    title: string;
  } | null;
  users: {
    full_name: string | null;
    email: string;
  } | null;
}

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminWithdrawalsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status ?? "pending";
  const supabase = await createClient();

  let query = supabase
    .from("withdrawal_requests")
    .select("*, campaigns(title), users:organizer_id(full_name, email)")
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter as WithdrawalStatus);
  }

  const { data, error } = await query;

  const withdrawals: WithdrawalWithRelations[] = error ? [] : (data as WithdrawalWithRelations[]);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Withdrawals" }]} />

      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">
          Withdrawal Requests
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage withdrawal requests from campaign organizers.
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;

          return (
            <Link
              key={tab.value}
              href={`/admin/withdrawals?status=${tab.value}`}
              className={`relative px-4 py-2 text-sm transition-colors ${
                isActive
                  ? "font-semibold text-red-600 dark:text-red-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 dark:bg-red-400" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Withdrawals Table */}
      {withdrawals.length === 0 ? (
        <EmptyState
          title="No withdrawal requests"
          description={`There are no ${statusFilter === "all" ? "" : statusFilter + " "}withdrawal requests.`}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Campaign
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Organizer
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Payout Method
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Requested
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {withdrawal.campaigns?.title ?? "Unknown Campaign"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    <div>{withdrawal.users?.full_name ?? "Unknown"}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {withdrawal.users?.email ?? ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {new Intl.NumberFormat("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    }).format(withdrawal.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {PAYOUT_LABELS[withdrawal.payout_method]}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT_MAP[withdrawal.status]}>
                      {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {new Date(withdrawal.created_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <WithdrawalActions
                      withdrawalId={withdrawal.id}
                      currentStatus={withdrawal.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
