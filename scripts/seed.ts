import { createClient } from "@supabase/supabase-js";

// ── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("Make sure .env.local is loaded (run via: pnpm seed)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Demo user definitions ────────────────────────────────────────────────────

const DEMO_EMAILS = {
  maria: "maria@demo.fundkita.ph",
  juan: "juan@demo.fundkita.ph",
  ana: "ana@demo.fundkita.ph",
  admin: "admin@demo.fundkita.ph",
} as const;

const DEMO_PASSWORD = "demo123456";

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// ── Seed functions ───────────────────────────────────────────────────────────

async function createAuthUsers(): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};

  const authUsers = [
    { key: "maria", email: DEMO_EMAILS.maria },
    { key: "juan", email: DEMO_EMAILS.juan },
    { key: "ana", email: DEMO_EMAILS.ana },
    { key: "admin", email: DEMO_EMAILS.admin },
  ];

  for (const user of authUsers) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === user.email);

    if (existing) {
      console.log(`  ⚠ Auth user ${user.email} already exists, using existing ID`);
      ids[user.key] = existing.id;
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });

    if (error) {
      throw new Error(`Failed to create auth user ${user.email}: ${error.message}`);
    }

    ids[user.key] = data.user.id;
  }

  console.log("✓ Created auth users");
  return ids;
}

async function createUserRows(ids: Record<string, string>): Promise<void> {
  const users = [
    {
      id: ids.maria,
      email: DEMO_EMAILS.maria,
      full_name: "Maria Santos",
      username: "maria-santos",
      role: "organizer" as const,
      is_verified: true,
    },
    {
      id: ids.juan,
      email: DEMO_EMAILS.juan,
      full_name: "Juan Cruz",
      username: "juan-cruz",
      role: "donor" as const,
      is_verified: false,
    },
    {
      id: ids.ana,
      email: DEMO_EMAILS.ana,
      full_name: "Ana Reyes",
      username: "ana-reyes",
      role: "donor" as const,
      is_verified: false,
    },
    {
      id: ids.admin,
      email: DEMO_EMAILS.admin,
      full_name: "Admin User",
      username: "admin",
      role: "admin" as const,
      is_verified: true,
    },
  ];

  for (const user of users) {
    const { error } = await supabase.from("users").upsert(user, { onConflict: "id" });
    if (error) {
      throw new Error(`Failed to create user row ${user.email}: ${error.message}`);
    }
  }

  console.log("✓ Created user rows");
}

async function createCampaigns(
  mariaId: string,
): Promise<{ id: string; slug: string; goal: number; raised: number }[]> {
  const campaigns = [
    {
      organizer_id: mariaId,
      title: "Help Maria's Family",
      slug: "help-marias-family",
      description:
        "Maria's family needs urgent financial assistance for medical treatment. " +
        "Her mother has been diagnosed with a condition requiring specialized care. " +
        "Every contribution, no matter how small, brings us closer to getting her the help she needs.",
      category: "medical" as const,
      location: "Manila, Philippines",
      goal_amount: 100_000,
      amount_raised: 60_000,
      donor_count: 8,
      status: "active" as const,
      is_verified: true,
      created_at: daysAgo(30),
    },
    {
      organizer_id: mariaId,
      title: "Typhoon Relief Fund",
      slug: "typhoon-relief-fund",
      description:
        "A devastating typhoon has displaced thousands of families in the Visayas region. " +
        "This fund provides immediate relief — food, clean water, shelter materials, and " +
        "medical supplies to those affected. Help us rebuild lives and communities.",
      category: "disaster_relief" as const,
      location: "Tacloban, Leyte",
      goal_amount: 500_000,
      amount_raised: 450_000,
      donor_count: 6,
      status: "active" as const,
      is_verified: true,
      created_at: daysAgo(21),
    },
    {
      organizer_id: mariaId,
      title: "Scholars for Tomorrow",
      slug: "scholars-for-tomorrow",
      description:
        "Education is the key to breaking the cycle of poverty. This campaign supports " +
        "scholarships for underprivileged students in rural Mindanao, covering tuition, " +
        "books, and school supplies for the upcoming academic year.",
      category: "education" as const,
      location: "Davao City, Philippines",
      goal_amount: 200_000,
      amount_raised: 60_000,
      donor_count: 4,
      status: "active" as const,
      is_verified: true,
      created_at: daysAgo(14),
    },
    {
      organizer_id: mariaId,
      title: "Community Kitchen Project",
      slug: "community-kitchen",
      description:
        "Setting up a community kitchen in Tondo, Manila to serve free meals to " +
        "families in need. The kitchen will operate daily, providing nutritious food " +
        "to over 200 families. Funds cover equipment, ingredients, and volunteer supplies.",
      category: "community" as const,
      location: "Tondo, Manila",
      goal_amount: 50_000,
      amount_raised: 55_000,
      donor_count: 5,
      status: "active" as const,
      is_verified: true,
      created_at: daysAgo(45),
    },
  ];

  const results: { id: string; slug: string; goal: number; raised: number }[] = [];

  for (const campaign of campaigns) {
    // Check if campaign with this slug already exists
    const { data: existing } = await supabase
      .from("campaigns")
      .select("id")
      .eq("slug", campaign.slug)
      .single();

    if (existing) {
      console.log(`  ⚠ Campaign "${campaign.slug}" already exists, skipping`);
      results.push({
        id: existing.id,
        slug: campaign.slug,
        goal: campaign.goal_amount,
        raised: campaign.amount_raised,
      });
      continue;
    }

    const { data, error } = await supabase.from("campaigns").insert(campaign).select("id").single();

    if (error) {
      throw new Error(`Failed to create campaign "${campaign.title}": ${error.message}`);
    }

    results.push({
      id: data.id,
      slug: campaign.slug,
      goal: campaign.goal_amount,
      raised: campaign.amount_raised,
    });
  }

  console.log("✓ Created campaigns");
  return results;
}

async function createDonations(
  juanId: string,
  anaId: string,
  campaigns: { id: string; slug: string; goal: number; raised: number }[],
): Promise<void> {
  const [helpMaria, typhoon, scholars, kitchen] = campaigns;

  const donations = [
    // Help Maria's Family — ₱60,000 raised, 8 donors
    {
      campaign_id: helpMaria.id,
      donor_id: juanId,
      donor_name: "Juan Cruz",
      donor_email: DEMO_EMAILS.juan,
      amount_php: 15_000,
      original_amount: 15_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 750,
      processing_fee: 300,
      fee_covered_by_donor: true,
      payment_method: "gcash" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(28),
    },
    {
      campaign_id: helpMaria.id,
      donor_id: juanId,
      donor_name: "Juan Cruz",
      donor_email: DEMO_EMAILS.juan,
      amount_php: 10_000,
      original_amount: 10_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 500,
      processing_fee: 200,
      fee_covered_by_donor: false,
      payment_method: "maya" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(20),
    },
    {
      campaign_id: helpMaria.id,
      donor_id: anaId,
      donor_name: "Ana Reyes",
      donor_email: DEMO_EMAILS.ana,
      amount_php: 5_000,
      original_amount: 5_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 250,
      processing_fee: 100,
      fee_covered_by_donor: true,
      payment_method: "gcash" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(25),
    },
    {
      campaign_id: helpMaria.id,
      donor_id: juanId,
      donor_name: "Anonymous",
      donor_email: DEMO_EMAILS.juan,
      amount_php: 5_000,
      original_amount: 5_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 0,
      processing_fee: 100,
      fee_covered_by_donor: false,
      payment_method: "bank_transfer" as const,
      payment_status: "confirmed" as const,
      is_anonymous: true,
      created_at: daysAgo(15),
    },
    {
      campaign_id: helpMaria.id,
      donor_id: null,
      donor_name: "Guest Donor",
      donor_email: "guest1@example.com",
      amount_php: 10_000,
      original_amount: 10_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 500,
      processing_fee: 200,
      fee_covered_by_donor: true,
      payment_method: "card" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(12),
    },
    {
      campaign_id: helpMaria.id,
      donor_id: null,
      donor_name: "Guest Donor 2",
      donor_email: "guest2@example.com",
      amount_php: 5_000,
      original_amount: 5_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 250,
      processing_fee: 100,
      fee_covered_by_donor: false,
      payment_method: "gcash" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(10),
    },
    {
      campaign_id: helpMaria.id,
      donor_id: null,
      donor_name: "Anonymous Guest",
      donor_email: "guest3@example.com",
      amount_php: 5_000,
      original_amount: 5_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 0,
      processing_fee: 100,
      fee_covered_by_donor: true,
      payment_method: "maya" as const,
      payment_status: "confirmed" as const,
      is_anonymous: true,
      created_at: daysAgo(8),
    },
    {
      campaign_id: helpMaria.id,
      donor_id: null,
      donor_name: "Pending Donor",
      donor_email: "guest4@example.com",
      amount_php: 5_000,
      original_amount: 5_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 250,
      processing_fee: 100,
      fee_covered_by_donor: false,
      payment_method: "gcash" as const,
      payment_status: "pending" as const,
      is_anonymous: false,
      created_at: daysAgo(2),
    },

    // Typhoon Relief Fund — ₱450,000 raised, 6 donors
    {
      campaign_id: typhoon.id,
      donor_id: juanId,
      donor_name: "Juan Cruz",
      donor_email: DEMO_EMAILS.juan,
      amount_php: 5_000,
      original_amount: 5_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 250,
      processing_fee: 100,
      fee_covered_by_donor: true,
      payment_method: "gcash" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(19),
    },
    {
      campaign_id: typhoon.id,
      donor_id: null,
      donor_name: "Corporate Sponsor",
      donor_email: "corp@example.com",
      amount_php: 200_000,
      original_amount: 200_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 10_000,
      processing_fee: 4_000,
      fee_covered_by_donor: true,
      payment_method: "bank_transfer" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(18),
    },
    {
      campaign_id: typhoon.id,
      donor_id: null,
      donor_name: "Overseas Filipino",
      donor_email: "ofw@example.com",
      amount_php: 140_000,
      original_amount: 2_500,
      original_currency: "USD" as const,
      exchange_rate: 56,
      platform_tip: 7_000,
      processing_fee: 2_800,
      fee_covered_by_donor: true,
      payment_method: "card" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(17),
    },
    {
      campaign_id: typhoon.id,
      donor_id: null,
      donor_name: "Anonymous Corporate",
      donor_email: "anoncorp@example.com",
      amount_php: 50_000,
      original_amount: 50_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 2_500,
      processing_fee: 1_000,
      fee_covered_by_donor: false,
      payment_method: "bank_transfer" as const,
      payment_status: "confirmed" as const,
      is_anonymous: true,
      created_at: daysAgo(16),
    },
    {
      campaign_id: typhoon.id,
      donor_id: null,
      donor_name: "Community Group",
      donor_email: "community@example.com",
      amount_php: 30_000,
      original_amount: 30_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 1_500,
      processing_fee: 600,
      fee_covered_by_donor: true,
      payment_method: "maya" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(14),
    },
    {
      campaign_id: typhoon.id,
      donor_id: null,
      donor_name: "Pending Large Donor",
      donor_email: "pending@example.com",
      amount_php: 25_000,
      original_amount: 25_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 1_250,
      processing_fee: 500,
      fee_covered_by_donor: false,
      payment_method: "bank_transfer" as const,
      payment_status: "pending" as const,
      is_anonymous: false,
      created_at: daysAgo(5),
    },

    // Scholars for Tomorrow — ₱60,000 raised, 4 donors
    {
      campaign_id: scholars.id,
      donor_id: anaId,
      donor_name: "Anonymous",
      donor_email: DEMO_EMAILS.ana,
      amount_php: 2_000,
      original_amount: 2_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 100,
      processing_fee: 40,
      fee_covered_by_donor: true,
      payment_method: "gcash" as const,
      payment_status: "confirmed" as const,
      is_anonymous: true,
      created_at: daysAgo(12),
    },
    {
      campaign_id: scholars.id,
      donor_id: null,
      donor_name: "School Alumni",
      donor_email: "alumni@example.com",
      amount_php: 25_000,
      original_amount: 25_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 1_250,
      processing_fee: 500,
      fee_covered_by_donor: true,
      payment_method: "bank_transfer" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(11),
    },
    {
      campaign_id: scholars.id,
      donor_id: null,
      donor_name: "Teacher Association",
      donor_email: "teachers@example.com",
      amount_php: 18_000,
      original_amount: 18_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 900,
      processing_fee: 360,
      fee_covered_by_donor: false,
      payment_method: "maya" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(9),
    },
    {
      campaign_id: scholars.id,
      donor_id: null,
      donor_name: "Education NGO",
      donor_email: "ngo@example.com",
      amount_php: 15_000,
      original_amount: 15_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 750,
      processing_fee: 300,
      fee_covered_by_donor: true,
      payment_method: "bank_transfer" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(7),
    },

    // Community Kitchen — ₱55,000 raised, 5 donors
    {
      campaign_id: kitchen.id,
      donor_id: juanId,
      donor_name: "Juan Cruz",
      donor_email: DEMO_EMAILS.juan,
      amount_php: 3_000,
      original_amount: 3_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 150,
      processing_fee: 60,
      fee_covered_by_donor: true,
      payment_method: "gcash" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(40),
    },
    {
      campaign_id: kitchen.id,
      donor_id: anaId,
      donor_name: "Ana Reyes",
      donor_email: DEMO_EMAILS.ana,
      amount_php: 2_000,
      original_amount: 2_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 100,
      processing_fee: 40,
      fee_covered_by_donor: false,
      payment_method: "maya" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(38),
    },
    {
      campaign_id: kitchen.id,
      donor_id: null,
      donor_name: "Local Business Owner",
      donor_email: "business@example.com",
      amount_php: 20_000,
      original_amount: 20_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 1_000,
      processing_fee: 400,
      fee_covered_by_donor: true,
      payment_method: "bank_transfer" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(35),
    },
    {
      campaign_id: kitchen.id,
      donor_id: null,
      donor_name: "Barangay Council",
      donor_email: "barangay@example.com",
      amount_php: 15_000,
      original_amount: 15_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 750,
      processing_fee: 300,
      fee_covered_by_donor: true,
      payment_method: "bank_transfer" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(30),
    },
    {
      campaign_id: kitchen.id,
      donor_id: null,
      donor_name: "Volunteer Group",
      donor_email: "volunteers@example.com",
      amount_php: 15_000,
      original_amount: 15_000,
      original_currency: "PHP" as const,
      exchange_rate: 1,
      platform_tip: 750,
      processing_fee: 300,
      fee_covered_by_donor: false,
      payment_method: "gcash" as const,
      payment_status: "confirmed" as const,
      is_anonymous: false,
      created_at: daysAgo(25),
    },
  ];

  const { error } = await supabase.from("donations").insert(donations);
  if (error) {
    throw new Error(`Failed to create donations: ${error.message}`);
  }

  console.log(`✓ Created ${donations.length} donations`);
}

async function createDonorStats(juanId: string, anaId: string): Promise<void> {
  const stats = [
    {
      user_id: juanId,
      lifetime_donations_php: 38_000,
      donation_count: 5,
      current_tier: 6,
    },
    {
      user_id: anaId,
      lifetime_donations_php: 9_000,
      donation_count: 3,
      current_tier: 1,
    },
  ];

  for (const stat of stats) {
    const { error } = await supabase.from("donor_stats").upsert(stat, { onConflict: "user_id" });
    if (error) {
      throw new Error(`Failed to create donor_stats: ${error.message}`);
    }
  }

  console.log("✓ Created donor stats");
}

async function createDonorBadges(juanId: string, anaId: string): Promise<void> {
  const badges = [
    {
      user_id: juanId,
      badge_tier: 6,
      badge_name: "Champion",
      awarded_at: daysAgo(15),
    },
    {
      user_id: anaId,
      badge_tier: 1,
      badge_name: "First Step",
      awarded_at: daysAgo(25),
    },
  ];

  // Delete existing badges for these users first to avoid duplicates
  await supabase.from("donor_badges").delete().in("user_id", [juanId, anaId]);

  const { error } = await supabase.from("donor_badges").insert(badges);
  if (error) {
    throw new Error(`Failed to create donor_badges: ${error.message}`);
  }

  console.log("✓ Created donor badges");
}

async function createKycSubmission(mariaId: string, adminId: string): Promise<void> {
  // Check if KYC already exists for Maria
  const { data: existing } = await supabase
    .from("kyc_submissions")
    .select("id")
    .eq("user_id", mariaId)
    .single();

  if (existing) {
    console.log("  ⚠ KYC submission for Maria already exists, skipping");
    return;
  }

  const { error } = await supabase.from("kyc_submissions").insert({
    user_id: mariaId,
    id_type: "national_id" as const,
    id_front_url: "https://placehold.co/600x400?text=ID+Front",
    id_back_url: "https://placehold.co/600x400?text=ID+Back",
    selfie_url: "https://placehold.co/600x400?text=Selfie",
    status: "approved" as const,
    reviewed_by: adminId,
    reviewed_at: daysAgo(28),
  });

  if (error) {
    throw new Error(`Failed to create KYC submission: ${error.message}`);
  }

  console.log("✓ Created KYC submission");
}

async function createWithdrawalRequest(mariaId: string, kitchenCampaignId: string): Promise<void> {
  // Check if withdrawal already exists for this campaign
  const { data: existing } = await supabase
    .from("withdrawal_requests")
    .select("id")
    .eq("campaign_id", kitchenCampaignId)
    .single();

  if (existing) {
    console.log("  ⚠ Withdrawal request for Community Kitchen already exists, skipping");
    return;
  }

  const { error } = await supabase.from("withdrawal_requests").insert({
    campaign_id: kitchenCampaignId,
    organizer_id: mariaId,
    amount: 25_000,
    status: "pending" as const,
    payout_method: "gcash" as const,
    payout_details: { account_name: "Maria Santos", account_number: "09171234567" },
  });

  if (error) {
    throw new Error(`Failed to create withdrawal request: ${error.message}`);
  }

  console.log("✓ Created withdrawal request");
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n🌱 Seeding FundKita database...\n");

  try {
    // 1. Create auth users
    const ids = await createAuthUsers();

    // 2. Create user rows
    await createUserRows(ids);

    // 3. Create campaigns
    const campaigns = await createCampaigns(ids.maria);

    // 4. Create donations
    await createDonations(ids.juan, ids.ana, campaigns);

    // 5. Create donor stats
    await createDonorStats(ids.juan, ids.ana);

    // 6. Create donor badges
    await createDonorBadges(ids.juan, ids.ana);

    // 7. Create KYC submission for Maria
    await createKycSubmission(ids.maria, ids.admin);

    // 8. Create withdrawal request for Community Kitchen
    const kitchenCampaign = campaigns.find((c) => c.slug === "community-kitchen");
    if (kitchenCampaign) {
      await createWithdrawalRequest(ids.maria, kitchenCampaign.id);
    }

    console.log("\n✅ Seed completed successfully!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seed failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
