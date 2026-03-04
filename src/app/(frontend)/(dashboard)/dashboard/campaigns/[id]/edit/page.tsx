import { notFound, redirect } from "next/navigation";

import CampaignForm from "@/components/campaigns/CampaignForm";
import { Breadcrumbs } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { type TableRow } from "@/lib/supabase/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCampaignPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/campaigns");

  // Fetch current user's role
  const { data: dbUser } = await supabase.from("users").select("role").eq("id", user.id).single();
  const isAdmin = dbUser && (dbUser as TableRow<"users">).role === "admin";

  // Fetch campaign
  const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", id).single();

  if (!campaign) notFound();

  const typedCampaign = campaign as TableRow<"campaigns">;

  // Verify ownership (unless admin)
  if (typedCampaign.organizer_id !== user.id && !isAdmin) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Campaigns", href: "/dashboard/campaigns" },
          { label: typedCampaign.title, href: `/dashboard/campaigns/${id}` },
          { label: "Edit" },
        ]}
        className="mb-4"
      />
      <h1 className="font-heading mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Edit Campaign
      </h1>
      <CampaignForm mode="edit" initialData={typedCampaign} />
    </div>
  );
}
