import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import WithdrawalForm from "@/components/dashboard/WithdrawalForm";
import { AlertIcon, ShieldIcon } from "@/components/icons";
import { Breadcrumbs, Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { type TableRow, type WithdrawalStatus } from "@/lib/supabase/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WithdrawPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/campaigns");

  // Fetch campaign
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, organizer_id, title, amount_raised")
    .eq("id", id)
    .single();

  if (!campaign) notFound();

  const typedCampaign = campaign as Pick<
    TableRow<"campaigns">,
    "id" | "organizer_id" | "title" | "amount_raised"
  >;

  // Verify ownership
  if (typedCampaign.organizer_id !== user.id) {
    notFound();
  }

  // Check KYC status
  const { data: kycSubmission } = await supabase
    .from("kyc_submissions")
    .select("status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const kycStatus = kycSubmission ? (kycSubmission as TableRow<"kyc_submissions">).status : null;
  const isKycApproved = kycStatus === "approved";

  // Fetch previous withdrawals for this campaign
  const { data: withdrawalsData } = await supabase
    .from("withdrawal_requests")
    .select("amount, status")
    .eq("campaign_id", id);

  const nonRejectedStatuses = new Set<WithdrawalStatus>(["pending", "approved", "processed"]);
  const totalWithdrawn = (withdrawalsData ?? [])
    .filter((w) => {
      const typed = w as TableRow<"withdrawal_requests">;
      return nonRejectedStatuses.has(typed.status);
    })
    .reduce((sum, w) => sum + (w as TableRow<"withdrawal_requests">).amount, 0);

  const availableBalance = typedCampaign.amount_raised - totalWithdrawn;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Campaigns", href: "/dashboard/campaigns" },
          { label: typedCampaign.title, href: `/dashboard/campaigns/${id}` },
          { label: "Withdraw" },
        ]}
        className="mb-4"
      />

      <h1 className="mb-6 font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">
        Withdraw Funds
      </h1>

      {/* Balance summary */}
      <div className="mb-6 rounded-xl border border-gray-200 p-6 dark:border-gray-700">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Raised</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {typedCampaign.amount_raised.toLocaleString()} PHP
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Withdrawn</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {totalWithdrawn.toLocaleString()} PHP
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Available Balance</p>
            <p className="text-xl font-bold text-teal-600 dark:text-teal-400">
              {availableBalance.toLocaleString()} PHP
            </p>
          </div>
        </div>
      </div>

      {isKycApproved ? (
        availableBalance > 0 ? (
          <WithdrawalForm
            campaignId={id}
            campaignTitle={typedCampaign.title}
            availableBalance={availableBalance}
          />
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20">
            <AlertIcon className="h-6 w-6 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
                No funds available
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                There are no funds available for withdrawal at this time.
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20">
          <ShieldIcon className="h-6 w-6 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
              KYC verification required
            </h3>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
              You must complete identity verification before you can withdraw funds.
            </p>
            <Link href="/dashboard/settings" className="mt-3 inline-block">
              <Button size="sm">Go to Settings</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
