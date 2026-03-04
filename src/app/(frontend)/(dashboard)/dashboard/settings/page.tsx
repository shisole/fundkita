import { redirect } from "next/navigation";

import { Breadcrumbs } from "@/components/ui";
import { getCurrentUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { type TableRow } from "@/lib/supabase/types";

import SettingsTabs from "./SettingsTabs";

export const metadata = {
  title: "Settings | FundKita",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch latest KYC submission if user is an organizer
  let kycSubmission: Pick<
    TableRow<"kyc_submissions">,
    "id" | "id_type" | "status" | "rejection_reason" | "created_at"
  > | null = null;

  if (user.role === "organizer" || user.role === "admin") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("kyc_submissions")
      .select("id, id_type, status, rejection_reason, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const row = data?.[0];
    if (row) {
      kycSubmission = row as unknown as typeof kycSubmission;
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]} />

      <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      <SettingsTabs
        user={{
          id: user.id,
          full_name: user.full_name,
          username: user.username,
          avatar_url: user.avatar_url,
        }}
        userRole={user.role}
        kycSubmission={kycSubmission}
      />
    </div>
  );
}
