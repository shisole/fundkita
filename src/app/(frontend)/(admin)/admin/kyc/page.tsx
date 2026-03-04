import Image from "next/image";
import Link from "next/link";

import { Badge, Breadcrumbs, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { type KycIdType, type KycStatus, type TableRow } from "@/lib/supabase/types";

import KycActions from "./KycActions";

export const metadata = {
  title: "KYC Review | Admin | FundKita",
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const ID_TYPE_LABELS: Record<KycIdType, string> = {
  national_id: "National ID",
  passport: "Passport",
  drivers_license: "Driver's License",
  philsys: "PhilSys ID",
};

const STATUS_VARIANT_MAP: Record<KycStatus, "warning" | "success" | "error"> = {
  pending: "warning",
  approved: "success",
  rejected: "error",
};

interface KycSubmissionWithUser extends TableRow<"kyc_submissions"> {
  users: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminKycPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status ?? "pending";
  const supabase = await createClient();

  let query = supabase
    .from("kyc_submissions")
    .select("*, users(full_name, email, avatar_url)")
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter as KycStatus);
  }

  const { data, error } = await query;

  const submissions: KycSubmissionWithUser[] = error ? [] : (data as KycSubmissionWithUser[]);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "KYC Review" }]} />

      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">
          KYC Review
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review identity verification submissions from organizers.
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;

          return (
            <Link
              key={tab.value}
              href={`/admin/kyc?status=${tab.value}`}
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

      {/* Submissions Table */}
      {submissions.length === 0 ? (
        <EmptyState
          title="No submissions found"
          description={`There are no ${statusFilter === "all" ? "" : statusFilter + " "}KYC submissions.`}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">User</th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Email</th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  ID Type
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Submitted
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Documents
                </th>
                {statusFilter !== "approved" && statusFilter !== "rejected" && (
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {submissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {submission.users?.full_name ?? "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {submission.users?.email ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {ID_TYPE_LABELS[submission.id_type]}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT_MAP[submission.status]}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {new Date(submission.created_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <a
                        href={submission.id_front_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative h-10 w-14 overflow-hidden rounded border border-gray-200 dark:border-gray-700"
                      >
                        <Image
                          src={submission.id_front_url}
                          alt="ID Front"
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </a>
                      <a
                        href={submission.id_back_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative h-10 w-14 overflow-hidden rounded border border-gray-200 dark:border-gray-700"
                      >
                        <Image
                          src={submission.id_back_url}
                          alt="ID Back"
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </a>
                      <a
                        href={submission.selfie_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative h-10 w-14 overflow-hidden rounded border border-gray-200 dark:border-gray-700"
                      >
                        <Image
                          src={submission.selfie_url}
                          alt="Selfie"
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </a>
                    </div>
                  </td>
                  {statusFilter !== "approved" && statusFilter !== "rejected" && (
                    <td className="px-4 py-3">
                      {submission.status === "pending" ? (
                        <KycActions submissionId={submission.id} />
                      ) : (
                        <span className="text-xs text-gray-400">
                          {submission.status === "rejected" && submission.rejection_reason
                            ? `Rejected: ${submission.rejection_reason}`
                            : "Reviewed"}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
