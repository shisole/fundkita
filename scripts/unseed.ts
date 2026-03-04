import { createClient } from "@supabase/supabase-js";

// ── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("Make sure .env.local is loaded (run via: pnpm unseed)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Demo user emails ─────────────────────────────────────────────────────────

const DEMO_EMAILS = [
  "maria@demo.fundkita.ph",
  "juan@demo.fundkita.ph",
  "ana@demo.fundkita.ph",
  "admin@demo.fundkita.ph",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function findUserIds(): Promise<string[]> {
  const { data: users } = await supabase.from("users").select("id").in("email", DEMO_EMAILS);

  return users?.map((u) => u.id) ?? [];
}

async function findCampaignIds(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id")
    .in("organizer_id", userIds);

  return campaigns?.map((c) => c.id) ?? [];
}

// ── Unseed functions (reverse order) ─────────────────────────────────────────

async function deleteWithdrawalRequests(campaignIds: string[]): Promise<void> {
  if (campaignIds.length === 0) {
    console.log("  ⚠ No campaigns found, skipping withdrawal_requests");
    return;
  }

  const { error, count } = await supabase
    .from("withdrawal_requests")
    .delete({ count: "exact" })
    .in("campaign_id", campaignIds);

  if (error) {
    console.error(`  ⚠ Error deleting withdrawal_requests: ${error.message}`);
    return;
  }

  console.log(`✓ Deleted ${count ?? 0} withdrawal requests`);
}

async function deleteDonorBadges(userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    console.log("  ⚠ No users found, skipping donor_badges");
    return;
  }

  const { error, count } = await supabase
    .from("donor_badges")
    .delete({ count: "exact" })
    .in("user_id", userIds);

  if (error) {
    console.error(`  ⚠ Error deleting donor_badges: ${error.message}`);
    return;
  }

  console.log(`✓ Deleted ${count ?? 0} donor badges`);
}

async function deleteDonorStats(userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    console.log("  ⚠ No users found, skipping donor_stats");
    return;
  }

  const { error, count } = await supabase
    .from("donor_stats")
    .delete({ count: "exact" })
    .in("user_id", userIds);

  if (error) {
    console.error(`  ⚠ Error deleting donor_stats: ${error.message}`);
    return;
  }

  console.log(`✓ Deleted ${count ?? 0} donor stats`);
}

async function deleteDonations(campaignIds: string[]): Promise<void> {
  if (campaignIds.length === 0) {
    console.log("  ⚠ No campaigns found, skipping donations");
    return;
  }

  const { error, count } = await supabase
    .from("donations")
    .delete({ count: "exact" })
    .in("campaign_id", campaignIds);

  if (error) {
    console.error(`  ⚠ Error deleting donations: ${error.message}`);
    return;
  }

  console.log(`✓ Deleted ${count ?? 0} donations`);
}

async function deleteFraudFlags(campaignIds: string[]): Promise<void> {
  if (campaignIds.length === 0) {
    console.log("  ⚠ No campaigns found, skipping fraud_flags");
    return;
  }

  const { error, count } = await supabase
    .from("fraud_flags")
    .delete({ count: "exact" })
    .in("campaign_id", campaignIds);

  if (error) {
    console.error(`  ⚠ Error deleting fraud_flags: ${error.message}`);
    return;
  }

  console.log(`✓ Deleted ${count ?? 0} fraud flags`);
}

async function deleteCampaignUpdates(campaignIds: string[]): Promise<void> {
  if (campaignIds.length === 0) {
    console.log("  ⚠ No campaigns found, skipping campaign_updates");
    return;
  }

  const { error, count } = await supabase
    .from("campaign_updates")
    .delete({ count: "exact" })
    .in("campaign_id", campaignIds);

  if (error) {
    console.error(`  ⚠ Error deleting campaign_updates: ${error.message}`);
    return;
  }

  console.log(`✓ Deleted ${count ?? 0} campaign updates`);
}

async function deleteCampaigns(userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    console.log("  ⚠ No users found, skipping campaigns");
    return;
  }

  const { error, count } = await supabase
    .from("campaigns")
    .delete({ count: "exact" })
    .in("organizer_id", userIds);

  if (error) {
    console.error(`  ⚠ Error deleting campaigns: ${error.message}`);
    return;
  }

  console.log(`✓ Deleted ${count ?? 0} campaigns`);
}

async function deleteKycSubmissions(userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    console.log("  ⚠ No users found, skipping kyc_submissions");
    return;
  }

  const { error, count } = await supabase
    .from("kyc_submissions")
    .delete({ count: "exact" })
    .in("user_id", userIds);

  if (error) {
    console.error(`  ⚠ Error deleting kyc_submissions: ${error.message}`);
    return;
  }

  console.log(`✓ Deleted ${count ?? 0} KYC submissions`);
}

async function deleteUserRows(): Promise<void> {
  const { error, count } = await supabase
    .from("users")
    .delete({ count: "exact" })
    .in("email", DEMO_EMAILS);

  if (error) {
    console.error(`  ⚠ Error deleting user rows: ${error.message}`);
    return;
  }

  console.log(`✓ Deleted ${count ?? 0} user rows`);
}

async function deleteAuthUsers(): Promise<void> {
  const { data: listResult } = await supabase.auth.admin.listUsers();
  const authUsers =
    listResult?.users?.filter((u) => u.email && DEMO_EMAILS.includes(u.email)) ?? [];

  if (authUsers.length === 0) {
    console.log("  ⚠ No auth users found to delete");
    return;
  }

  let deleted = 0;
  for (const user of authUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.error(`  ⚠ Error deleting auth user ${user.email}: ${error.message}`);
      continue;
    }
    deleted++;
  }

  console.log(`✓ Deleted ${deleted} auth users`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n🧹 Unseeding FundKita database...\n");

  try {
    // Look up IDs before deleting anything
    const userIds = await findUserIds();
    const campaignIds = await findCampaignIds(userIds);

    console.log(`  Found ${userIds.length} seeded users, ${campaignIds.length} seeded campaigns\n`);

    // Delete in reverse dependency order
    await deleteWithdrawalRequests(campaignIds);
    await deleteDonorBadges(userIds);
    await deleteDonorStats(userIds);
    await deleteDonations(campaignIds);
    await deleteFraudFlags(campaignIds);
    await deleteCampaignUpdates(campaignIds);
    await deleteCampaigns(userIds);
    await deleteKycSubmissions(userIds);
    await deleteUserRows();
    await deleteAuthUsers();

    console.log("\n✅ Unseed completed successfully!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Unseed failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
