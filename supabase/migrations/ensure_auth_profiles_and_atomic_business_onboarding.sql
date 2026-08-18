-- Keep application profiles synchronized with Supabase Auth and make business onboarding atomic.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    phone,
    email
  )
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    new.phone,
    new.email
  )
  on conflict (id) do update
  set
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    phone = coalesce(public.profiles.phone, excluded.phone),
    email = coalesce(public.profiles.email, excluded.email),
    updated_at = now();

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.handle_new_auth_user() from anon;
revoke all on function public.handle_new_auth_user() from authenticated;

drop trigger if exists auth_user_created_create_profile on auth.users;

create trigger auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

insert into public.profiles (
  id,
  display_name,
  phone,
  email
)
select
  users.id,
  nullif(btrim(users.raw_user_meta_data ->> 'display_name'), ''),
  users.phone,
  users.email
from auth.users as users
on conflict (id) do update
set
  display_name = coalesce(public.profiles.display_name, excluded.display_name),
  phone = coalesce(public.profiles.phone, excluded.phone),
  email = coalesce(public.profiles.email, excluded.email),
  updated_at = now();

create or replace function public.submit_business_onboarding(
  p_slug text,
  p_name text,
  p_legal_name text default null,
  p_nuit text default null,
  p_description text default null,
  p_phone text default null,
  p_email text default null,
  p_city text default null,
  p_province text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_business_id uuid;
begin
  if v_actor_id is null then
    raise exception 'Authentication required for business onboarding';
  end if;

  if nullif(btrim(p_slug), '') is null
    or nullif(btrim(p_name), '') is null
    or nullif(btrim(p_city), '') is null
  then
    raise exception 'Missing required business onboarding fields';
  end if;

  insert into public.profiles (
    id,
    display_name,
    phone,
    email
  )
  select
    users.id,
    nullif(btrim(users.raw_user_meta_data ->> 'display_name'), ''),
    users.phone,
    users.email
  from auth.users as users
  where users.id = v_actor_id
  on conflict (id) do nothing;

  if not exists (
    select 1
    from public.profiles
    where id = v_actor_id
  ) then
    raise exception 'Authenticated profile not found';
  end if;

  insert into public.businesses (
    owner_profile_id,
    slug,
    name,
    legal_name,
    nuit,
    description,
    phone,
    email,
    status
  )
  values (
    v_actor_id,
    btrim(p_slug),
    btrim(p_name),
    nullif(btrim(p_legal_name), ''),
    nullif(btrim(p_nuit), ''),
    nullif(btrim(p_description), ''),
    nullif(btrim(p_phone), ''),
    nullif(btrim(p_email), ''),
    'pending_review'
  )
  returning id into v_business_id;

  insert into public.branches (
    business_id,
    slug,
    name,
    city,
    province,
    is_primary
  )
  values (
    v_business_id,
    'principal',
    'Principal',
    btrim(p_city),
    nullif(btrim(p_province), ''),
    true
  );

  insert into public.business_members (
    business_id,
    profile_id,
    role,
    status,
    joined_at
  )
  values (
    v_business_id,
    v_actor_id,
    'business_owner',
    'active',
    now()
  );

  insert into public.audit_logs (
    business_id,
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    context
  )
  values (
    v_business_id,
    v_actor_id,
    'create',
    'businesses',
    v_business_id,
    jsonb_build_object('source', 'business_onboarding')
  );

  return v_business_id;
end;
$$;

revoke all on function public.submit_business_onboarding(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from public;
revoke all on function public.submit_business_onboarding(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from anon;
grant execute on function public.submit_business_onboarding(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;

-- Supabase installs this event-trigger helper to protect newly created public tables.
-- It must remain callable only by the database event trigger itself.
revoke all on function public.rls_auto_enable() from public;
revoke all on function public.rls_auto_enable() from anon;
revoke all on function public.rls_auto_enable() from authenticated;

create schema if not exists extensions;
alter extension citext set schema extensions;

alter policy profiles_select_own
on public.profiles
using (id = (select auth.uid()));

alter policy profiles_insert_own
on public.profiles
with check (id = (select auth.uid()));

alter policy profiles_update_own
on public.profiles
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

alter policy business_members_select_self
on public.business_members
using (profile_id = (select auth.uid()));

alter policy customer_cards_select_own
on public.customer_cards
using (customer_profile_id = (select auth.uid()));

alter policy notifications_select_recipient_or_manager
on public.notifications
using (
  profile_id = (select auth.uid())
  or public.owns_customer_card(customer_card_id)
  or (
    business_id is not null
    and public.can_manage_business(business_id)
  )
);

alter policy support_tickets_select_own
on public.support_tickets
using (profile_id = (select auth.uid()));

alter policy support_tickets_insert_own
on public.support_tickets
with check (
  profile_id = (select auth.uid())
  and (
    business_id is null
    or public.can_manage_business(business_id)
  )
);

create index if not exists business_members_branch_business_fk_idx
on public.business_members(branch_id, business_id);
create index if not exists business_members_invited_by_idx
on public.business_members(invited_by);
create index if not exists campaign_audiences_campaign_business_fk_idx
on public.campaign_audiences(campaign_id, business_id);
create index if not exists campaign_audiences_card_business_fk_idx
on public.campaign_audiences(customer_card_id, business_id);
create index if not exists campaigns_created_by_idx
on public.campaigns(created_by);
create index if not exists customer_cards_program_business_fk_idx
on public.customer_cards(loyalty_program_id, business_id);
create index if not exists fraud_events_card_business_fk_idx
on public.fraud_events(customer_card_id, business_id);
create index if not exists fraud_events_transaction_business_fk_idx
on public.fraud_events(transaction_id, business_id);
create index if not exists notifications_card_business_fk_idx
on public.notifications(customer_card_id, business_id);
create index if not exists offers_campaign_business_fk_idx
on public.offers(campaign_id, business_id);
create index if not exists point_ledger_created_by_idx
on public.point_ledger(created_by);
create index if not exists point_ledger_transaction_business_fk_idx
on public.point_ledger(transaction_id, business_id);
create index if not exists point_ledger_wallet_card_business_fk_idx
on public.point_ledger(wallet_id, customer_card_id, business_id);
create index if not exists point_wallets_card_business_fk_idx
on public.point_wallets(customer_card_id, business_id);
create index if not exists referrals_referred_card_business_fk_idx
on public.referrals(referred_card_id, business_id);
create index if not exists referrals_referred_profile_id_idx
on public.referrals(referred_profile_id);
create index if not exists referrals_referrer_card_business_fk_idx
on public.referrals(referrer_card_id, business_id);
create index if not exists transactions_branch_business_fk_idx
on public.transactions(branch_id, business_id);
create index if not exists transactions_card_business_fk_idx
on public.transactions(customer_card_id, business_id);
create index if not exists transactions_cashier_business_fk_idx
on public.transactions(cashier_member_id, business_id);
