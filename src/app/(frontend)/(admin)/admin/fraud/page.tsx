import Link from "next/link";

import { Badge, Breadcrumbs, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { type CampaignStatus, type FraudFlagStatus, type TableRow } from "@/lib/supabase/types";

import CreateFraudFlag from "./CreateFraudFlag";
import FraudActions from "./FraudActions";

export const metadata = {
  title: "Fraud Flags | Admin | FundKita",
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

const STATUS_VARIANT_MAP: Record<FraudFlagStatus, "warning" | "success" | "default"> = {
  open: "warning",
  resolved: "success",
  dismissed: "default",
};

interface FraudFlagWithCampaign extends TableRow<"fraud_flags"> {
  campaigns: {
    title: string;
    status: CampaignStatus;
    organizer_id: string;
  } | null;
}

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminFraudPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status ?? "open";
  const supabase = await createClient();

  let query = supabase
    .from("fraud_flags")
    .select("*, campaigns(title, status, organizer_id)")
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter as FraudFlagStatus);
  }

  const { data, error } = await query;

  const flags: FraudFlagWithCampaign[] = error ? [] : (data as FraudFlagWithCampaign[]);

  // Fetch campaigns for the create form
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, title")
    .in("status", ["active", "pending_review", "paused"])
    .order("title", { ascending: true });

  const campaignOptions: { value: string; label: string }[] =
    (campaigns as Pick<TableRow<"campaigns">, "id" | "title">[] | null)?.map((c) => ({
      value: c.id,
      label: c.title,
    })) ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Fraud Flags" }]} />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">
            Fraud Flags
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor and manage suspected fraudulent campaigns.
          </p>
        </div>
      </div>

      {/* Create new flag form */}
      <CreateFraudFlag campaigns={campaignOptions} />

      {/* Status Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;

          return (
            <Link
              key={tab.value}
              href={`/admin/fraud?status=${tab.value}`}
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

      {/* Flags Table */}
      {flags.length === 0 ? (
        <EmptyState
          title="No fraud flags"
          description={`There are no ${statusFilter === "all" ? "" : statusFilter + " "}fraud flags.`}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Campaign
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Reason</th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Campaign Status
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Flag Status
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Flagged
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {flags.map((flag) => (
                <tr key={flag.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {flag.campaigns?.title ?? "Unknown"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-gray-600 dark:text-gray-400">
                    {flag.reason}
                  </td>
                  <td className="px-4 py-3">
                    {flag.campaigns?.status ? (
                      <Badge
                        variant={
                          flag.campaigns.status === "paused"
                            ? "warning"
                            : flag.campaigns.status === "active"
                              ? "success"
                              : "default"
                        }
                      >
                        {flag.campaigns.status.charAt(0).toUpperCase() +
                          flag.campaigns.status.slice(1).replaceAll("_", " ")}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT_MAP[flag.status]}>
                      {flag.status.charAt(0).toUpperCase() + flag.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {new Date(flag.created_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {flag.status === "open" ? (
                      <FraudActions flagId={flag.id} campaignId={flag.campaign_id} />
                    ) : (
                      <span className="text-xs text-gray-400">
                        {flag.status === "resolved" ? "Resolved" : "Dismissed"}
                      </span>
                    )}
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
