-- FundKita Initial Schema
-- Run this in the Supabase SQL Editor

-- ══════════════════════════════════════════════════════════════════════════════
-- EXTENSIONS
-- ══════════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLES
-- ══════════════════════════════════════════════════════════════════════════════

-- ── users ───────────────────────────────────────────────────────────────────

create table public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  username   text unique,
  avatar_url text,
  role       text not null default 'donor'
             check (role in ('donor', 'organizer', 'admin')),
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users: public read"
  on public.users for select using (true);

create policy "Users: update own"
  on public.users for update using (auth.uid() = id);

create policy "Users: insert own"
  on public.users for insert with check (auth.uid() = id);

-- ── kyc_submissions ─────────────────────────────────────────────────────────

create table public.kyc_submissions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  id_type          text not null
                   check (id_type in ('national_id', 'passport', 'drivers_license', 'philsys')),
  id_front_url     text not null,
  id_back_url      text not null,
  selfie_url       text not null,
  status           text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by      uuid references public.users(id),
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now()
);

alter table public.kyc_submissions enable row level security;

create policy "KYC: read own"
  on public.kyc_submissions for select
  using (auth.uid() = user_id or exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  ));

create policy "KYC: insert own"
  on public.kyc_submissions for insert
  with check (auth.uid() = user_id);

create policy "KYC: admin update"
  on public.kyc_submissions for update
  using (exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  ));

-- ── campaigns ───────────────────────────────────────────────────────────────

create table public.campaigns (
  id                 uuid primary key default gen_random_uuid(),
  organizer_id       uuid not null references public.users(id) on delete cascade,
  title              text not null,
  slug               text not null unique,
  description        text not null,
  category           text not null
                     check (category in ('medical', 'disaster_relief', 'education', 'community', 'emergency', 'personal', 'other')),
  location           text not null,
  goal_amount        numeric not null check (goal_amount > 0),
  amount_raised      numeric not null default 0,
  donor_count        integer not null default 0,
  status             text not null default 'draft'
                     check (status in ('draft', 'pending_review', 'active', 'paused', 'completed', 'closed')),
  is_verified        boolean not null default false,
  featured_image_url text,
  end_date           timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.campaigns enable row level security;

create policy "Campaigns: public read active"
  on public.campaigns for select
  using (
    status = 'active' or status = 'completed'
    or auth.uid() = organizer_id
    or exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Campaigns: organizer insert"
  on public.campaigns for insert
  with check (auth.uid() = organizer_id);

create policy "Campaigns: organizer update own"
  on public.campaigns for update
  using (
    auth.uid() = organizer_id
    or exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create index idx_campaigns_slug on public.campaigns(slug);
create index idx_campaigns_status on public.campaigns(status);
create index idx_campaigns_category on public.campaigns(category);
create index idx_campaigns_organizer on public.campaigns(organizer_id);
create index idx_campaigns_fts on public.campaigns
  using gin(to_tsvector('english', title || ' ' || coalesce(description, '')));

-- ── campaign_images ─────────────────────────────────────────────────────────

create table public.campaign_images (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  image_url   text not null,
  sort_order  integer not null default 0
);

alter table public.campaign_images enable row level security;

create policy "Campaign images: public read"
  on public.campaign_images for select using (true);

create policy "Campaign images: organizer insert"
  on public.campaign_images for insert
  with check (exists (
    select 1 from public.campaigns where id = campaign_id and organizer_id = auth.uid()
  ));

create policy "Campaign images: organizer delete"
  on public.campaign_images for delete
  using (exists (
    select 1 from public.campaigns where id = campaign_id and organizer_id = auth.uid()
  ));

-- ── campaign_updates ────────────────────────────────────────────────────────

create table public.campaign_updates (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  title       text not null,
  content     text not null,
  created_at  timestamptz not null default now()
);

alter table public.campaign_updates enable row level security;

create policy "Campaign updates: public read"
  on public.campaign_updates for select using (true);

create policy "Campaign updates: organizer insert"
  on public.campaign_updates for insert
  with check (exists (
    select 1 from public.campaigns where id = campaign_id and organizer_id = auth.uid()
  ));

-- ── donations ───────────────────────────────────────────────────────────────

create table public.donations (
  id                  uuid primary key default gen_random_uuid(),
  campaign_id         uuid not null references public.campaigns(id) on delete cascade,
  donor_id            uuid references public.users(id),
  donor_name          text not null,
  donor_email         text not null,
  amount_php          numeric not null check (amount_php > 0),
  original_amount     numeric not null check (original_amount > 0),
  original_currency   text not null default 'PHP' check (original_currency in ('PHP', 'USD')),
  exchange_rate       numeric not null default 1,
  platform_tip        numeric not null default 0,
  processing_fee      numeric not null default 0,
  fee_covered_by_donor boolean not null default false,
  payment_method      text not null
                      check (payment_method in ('gcash', 'maya', 'card', 'bank_transfer', 'gotyme')),
  payment_status      text not null default 'pending'
                      check (payment_status in ('pending', 'confirmed', 'failed', 'refunded')),
  is_anonymous        boolean not null default false,
  dragonpay_txn_id    text,
  created_at          timestamptz not null default now()
);

alter table public.donations enable row level security;

-- Anyone can create a donation (guest donors have no auth)
create policy "Donations: insert"
  on public.donations for insert
  with check (true);

-- Donors can see own donations; organizers can see donations to their campaigns; admins see all
create policy "Donations: read"
  on public.donations for select
  using (
    donor_id = auth.uid()
    or exists (
      select 1 from public.campaigns where id = campaign_id and organizer_id = auth.uid()
    )
    or exists (
      select 1 from public.users where id = auth.uid() and role = 'admin'
    )
    -- Public: allow reading confirmed donations for campaign pages (donor list)
    or (payment_status = 'confirmed')
  );

-- Only service role updates donations (webhook)
create policy "Donations: service update"
  on public.donations for update
  using (exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  ));

create index idx_donations_campaign on public.donations(campaign_id);
create index idx_donations_donor on public.donations(donor_id);
create index idx_donations_status on public.donations(payment_status);

-- ── donor_stats ─────────────────────────────────────────────────────────────

create table public.donor_stats (
  user_id               uuid primary key references public.users(id) on delete cascade,
  lifetime_donations_php numeric not null default 0,
  donation_count        integer not null default 0,
  current_tier          integer not null default 0
);

alter table public.donor_stats enable row level security;

create policy "Donor stats: public read"
  on public.donor_stats for select using (true);

create index idx_donor_stats_lifetime on public.donor_stats(lifetime_donations_php desc);

-- ── donor_badges ────────────────────────────────────────────────────────────

create table public.donor_badges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  badge_tier integer not null check (badge_tier between 1 and 10),
  badge_name text not null,
  awarded_at timestamptz not null default now()
);

alter table public.donor_badges enable row level security;

create policy "Donor badges: public read"
  on public.donor_badges for select using (true);

-- ── fraud_flags ─────────────────────────────────────────────────────────────

create table public.fraud_flags (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  reason      text not null,
  flagged_by  uuid not null references public.users(id),
  status      text not null default 'open'
              check (status in ('open', 'resolved', 'dismissed')),
  created_at  timestamptz not null default now()
);

alter table public.fraud_flags enable row level security;

create policy "Fraud flags: admin only"
  on public.fraud_flags for all
  using (exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  ));

-- ── withdrawal_requests ─────────────────────────────────────────────────────

create table public.withdrawal_requests (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references public.campaigns(id) on delete cascade,
  organizer_id   uuid not null references public.users(id),
  amount         numeric not null check (amount > 0),
  status         text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected', 'processed')),
  payout_method  text not null
                 check (payout_method in ('gcash', 'maya', 'bank_transfer')),
  payout_details jsonb not null default '{}',
  reviewed_by    uuid references public.users(id),
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);

alter table public.withdrawal_requests enable row level security;

create policy "Withdrawals: read own or admin"
  on public.withdrawal_requests for select
  using (
    auth.uid() = organizer_id
    or exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Withdrawals: organizer insert"
  on public.withdrawal_requests for insert
  with check (auth.uid() = organizer_id);

create policy "Withdrawals: admin update"
  on public.withdrawal_requests for update
  using (exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  ));

-- ── exchange_rates ──────────────────────────────────────────────────────────

create table public.exchange_rates (
  id            uuid primary key default gen_random_uuid(),
  from_currency text not null,
  to_currency   text not null,
  rate          numeric not null,
  fetched_at    timestamptz not null default now()
);

alter table public.exchange_rates enable row level security;

create policy "Exchange rates: public read"
  on public.exchange_rates for select using (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Auto-create user row on signup ──────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Generate campaign slug ──────────────────────────────────────────────────

create or replace function public.generate_campaign_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  -- Convert title to URL-friendly slug
  base_slug := lower(regexp_replace(new.title, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  -- Truncate to reasonable length
  base_slug := left(base_slug, 60);

  final_slug := base_slug;

  -- Check for duplicates and append suffix
  while exists (select 1 from public.campaigns where slug = final_slug and id != new.id) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;

  new.slug := final_slug;
  return new;
end;
$$;

create trigger before_campaign_insert_slug
  before insert on public.campaigns
  for each row
  when (new.slug is null or new.slug = '')
  execute function public.generate_campaign_slug();

-- ── Update campaign updated_at ──────────────────────────────────────────────

create or replace function public.update_campaign_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger before_campaign_update_timestamp
  before update on public.campaigns
  for each row execute function public.update_campaign_timestamp();

-- ── Badge tier check ────────────────────────────────────────────────────────

create or replace function public.check_badge_tier(p_user_id uuid)
returns void
language plpgsql security definer
as $$
declare
  v_total numeric;
  v_current_tier integer;
  v_new_tier integer := 0;
  v_badge_name text;
  v_thresholds numeric[] := array[100, 500, 1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000];
  v_names text[] := array['First Step', 'Supporter', 'Helper', 'Advocate', 'Champion', 'Patron', 'Legacy Builder', 'Humanitarian', 'Benefactor', 'Philanthropist'];
begin
  select lifetime_donations_php, current_tier
  into v_total, v_current_tier
  from public.donor_stats
  where user_id = p_user_id;

  if not found then return; end if;

  -- Determine highest eligible tier
  for i in 1..10 loop
    if v_total >= v_thresholds[i] then
      v_new_tier := i;
      v_badge_name := v_names[i];
    end if;
  end loop;

  -- Award new badge if tier increased
  if v_new_tier > v_current_tier then
    update public.donor_stats set current_tier = v_new_tier where user_id = p_user_id;

    -- Insert badge for each new tier reached
    for i in (v_current_tier + 1)..v_new_tier loop
      insert into public.donor_badges (user_id, badge_tier, badge_name)
      values (p_user_id, i, v_names[i])
      on conflict do nothing;
    end loop;
  end if;
end;
$$;

-- ── Handle donation confirmed ───────────────────────────────────────────────

create or replace function public.handle_donation_confirmed()
returns trigger
language plpgsql security definer
as $$
begin
  -- Only fire when status changes to 'confirmed'
  if new.payment_status = 'confirmed' and old.payment_status != 'confirmed' then
    -- Update campaign totals
    update public.campaigns
    set amount_raised = amount_raised + new.amount_php,
        donor_count = donor_count + 1
    where id = new.campaign_id;

    -- Update donor stats (only for registered donors)
    if new.donor_id is not null then
      insert into public.donor_stats (user_id, lifetime_donations_php, donation_count, current_tier)
      values (new.donor_id, new.amount_php, 1, 0)
      on conflict (user_id) do update
      set lifetime_donations_php = donor_stats.lifetime_donations_php + new.amount_php,
          donation_count = donor_stats.donation_count + 1;

      -- Check badge tier
      perform public.check_badge_tier(new.donor_id);
    end if;
  end if;

  return new;
end;
$$;

create trigger after_donation_status_change
  after update of payment_status on public.donations
  for each row execute function public.handle_donation_confirmed();

-- ── Handle donation refunded ────────────────────────────────────────────────

create or replace function public.handle_donation_refunded()
returns trigger
language plpgsql security definer
as $$
begin
  -- Only fire when status changes to 'refunded'
  if new.payment_status = 'refunded' and old.payment_status = 'confirmed' then
    -- Decrement campaign totals
    update public.campaigns
    set amount_raised = greatest(0, amount_raised - new.amount_php),
        donor_count = greatest(0, donor_count - 1)
    where id = new.campaign_id;

    -- Decrement donor stats (badges NOT revoked — grace policy)
    if new.donor_id is not null then
      update public.donor_stats
      set lifetime_donations_php = greatest(0, lifetime_donations_php - new.amount_php),
          donation_count = greatest(0, donation_count - 1)
      where user_id = new.donor_id;
    end if;
  end if;

  return new;
end;
$$;

create trigger after_donation_refunded
  after update of payment_status on public.donations
  for each row execute function public.handle_donation_refunded();

-- ══════════════════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ══════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public) values ('campaign-images', 'campaign-images', true);
insert into storage.buckets (id, name, public) values ('kyc-documents', 'kyc-documents', false);
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- Storage policies: campaign-images (public read, auth write)
create policy "Campaign images: public read" on storage.objects
  for select using (bucket_id = 'campaign-images');

create policy "Campaign images: auth upload" on storage.objects
  for insert with check (bucket_id = 'campaign-images' and auth.role() = 'authenticated');

create policy "Campaign images: auth delete" on storage.objects
  for delete using (bucket_id = 'campaign-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: kyc-documents (private, auth write, admin read)
create policy "KYC docs: auth upload" on storage.objects
  for insert with check (bucket_id = 'kyc-documents' and auth.role() = 'authenticated');

create policy "KYC docs: owner or admin read" on storage.objects
  for select using (
    bucket_id = 'kyc-documents' and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (select 1 from public.users where id = auth.uid() and role = 'admin')
    )
  );

-- Storage policies: avatars (public read, auth write)
create policy "Avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Avatars: auth upload" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Avatars: owner delete" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
