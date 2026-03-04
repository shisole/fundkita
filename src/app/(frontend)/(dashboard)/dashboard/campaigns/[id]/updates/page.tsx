import { notFound, redirect } from "next/navigation";

import { Breadcrumbs } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { type TableRow } from "@/lib/supabase/types";

import UpdateForm from "./UpdateForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignUpdatesPage({ params }: PageProps) {
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

  // Fetch existing updates
  const { data: updatesData } = await supabase
    .from("campaign_updates")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false });

  const updates = (updatesData ?? []) as TableRow<"campaign_updates">[];

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Campaigns", href: "/dashboard/campaigns" },
          { label: typedCampaign.title, href: `/dashboard/campaigns/${id}` },
          { label: "Updates" },
        ]}
        className="mb-4"
      />

      <h1 className="font-heading mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Campaign Updates
      </h1>

      {/* New Update Form */}
      <div className="mb-8 rounded-xl border border-gray-200 p-6 dark:border-gray-700">
        <h2 className="mb-4 font-heading text-lg font-semibold text-gray-900 dark:text-gray-100">
          Post a New Update
        </h2>
        <UpdateForm campaignId={id} />
      </div>

      {/* Previous Updates */}
      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold text-gray-900 dark:text-gray-100">
          Previous Updates
        </h2>
        {updates.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No updates posted yet. Share progress with your donors!
          </p>
        ) : (
          <div className="space-y-4">
            {updates.map((update) => (
              <div
                key={update.id}
                className="rounded-xl border border-gray-200 p-5 dark:border-gray-700"
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{update.title}</h3>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {new Date(update.created_at).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                  {update.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
