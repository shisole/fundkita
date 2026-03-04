import { redirect } from "next/navigation";

import DonationHistoryTable from "@/components/dashboard/DonationHistoryTable";
import { Breadcrumbs } from "@/components/ui";
import { getCurrentUser } from "@/lib/supabase/queries";

export default async function DonationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard/donations");
  }

  return (
    <div>
      <Breadcrumbs
        className="mb-4"
        items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Donations" }]}
      />

      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100">
          Donation History
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          View all your past donations and their statuses.
        </p>
      </div>

      <DonationHistoryTable />
    </div>
  );
}
