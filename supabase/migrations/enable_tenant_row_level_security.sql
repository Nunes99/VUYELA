-- VUYELA Row Level Security policies.
-- Platform and support staff do not get direct client-side policy bypasses here.
-- Privileged platform operations must use audited server-side service-role paths.

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.profile_id = auth.uid()
      and bm.status = 'active'
  );
$$;

create or replace function public.has_business_role(
  target_business_id uuid,
  allowed_roles public.business_member_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.profile_id = auth.uid()
      and bm.status = 'active'
      and bm.role = any(allowed_roles)
  );
$$;

create or replace function public.can_manage_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_business_role(
    target_business_id,
    array['business_admin', 'business_owner']::public.business_member_role[]
  );
$$;

create or replace function public.can_own_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_business_role(
    target_business_id,
    array['business_owner']::public.business_member_role[]
  );
$$;

create or replace function public.can_manage_customers(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_business_role(
    target_business_id,
    array['business_admin', 'business_owner']::public.business_member_role[]
  );
$$;

create or replace function public.can_access_branch(target_business_id uuid, target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.profile_id = auth.uid()
      and bm.status = 'active'
      and (
        bm.role = any(array['business_admin', 'business_owner']::public.business_member_role[])
        or (
          target_branch_id is not null
          and bm.branch_id = target_branch_id
          and bm.role = any(array['branch_manager', 'cashier']::public.business_member_role[])
        )
      )
  );
$$;

create or replace function public.can_manage_branch(target_business_id uuid, target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.profile_id = auth.uid()
      and bm.status = 'active'
      and (
        bm.role = any(array['business_admin', 'business_owner']::public.business_member_role[])
        or (
          target_branch_id is not null
          and bm.branch_id = target_branch_id
          and bm.role = 'branch_manager'
        )
      )
  );
$$;

create or replace function public.can_access_transaction(
  target_business_id uuid,
  target_branch_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_access_branch(target_business_id, target_branch_id);
$$;

create or replace function public.owns_customer_card(target_customer_card_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.customer_cards cc
    where cc.id = target_customer_card_id
      and cc.customer_profile_id = auth.uid()
  );
$$;

create or replace function public.can_access_customer_card(
  target_business_id uuid,
  target_customer_card_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.owns_customer_card(target_customer_card_id)
    or public.can_manage_customers(target_business_id);
$$;

create or replace function public.can_access_transaction_id(target_transaction_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.transactions tx
    where tx.id = target_transaction_id
      and (
        (
          tx.customer_card_id is not null
          and public.owns_customer_card(tx.customer_card_id)
        )
        or public.can_access_transaction(tx.business_id, tx.branch_id)
      )
  );
$$;

create or replace function public.can_access_loyalty_program(target_loyalty_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.loyalty_programs lp
    join public.businesses b on b.id = lp.business_id
    where lp.id = target_loyalty_program_id
      and (
        (
          lp.status = 'active'
          and b.status = 'active'
        )
        or public.is_business_member(lp.business_id)
      )
  );
$$;

create or replace function public.can_manage_loyalty_program(target_loyalty_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.loyalty_programs lp
    where lp.id = target_loyalty_program_id
      and public.can_manage_business(lp.business_id)
  );
$$;

create or replace function public.can_manage_campaign(target_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaigns c
    where c.id = target_campaign_id
      and public.can_manage_business(c.business_id)
  );
$$;

revoke all on function public.is_business_member(uuid) from public;
revoke all on function public.has_business_role(uuid, public.business_member_role[]) from public;
revoke all on function public.can_manage_business(uuid) from public;
revoke all on function public.can_own_business(uuid) from public;
revoke all on function public.can_manage_customers(uuid) from public;
revoke all on function public.can_access_branch(uuid, uuid) from public;
revoke all on function public.can_manage_branch(uuid, uuid) from public;
revoke all on function public.can_access_transaction(uuid, uuid) from public;
revoke all on function public.owns_customer_card(uuid) from public;
revoke all on function public.can_access_customer_card(uuid, uuid) from public;
revoke all on function public.can_access_transaction_id(uuid) from public;
revoke all on function public.can_access_loyalty_program(uuid) from public;
revoke all on function public.can_manage_loyalty_program(uuid) from public;
revoke all on function public.can_manage_campaign(uuid) from public;

revoke all on function public.is_business_member(uuid) from anon;
revoke all on function public.has_business_role(uuid, public.business_member_role[]) from anon;
revoke all on function public.can_manage_business(uuid) from anon;
revoke all on function public.can_own_business(uuid) from anon;
revoke all on function public.can_manage_customers(uuid) from anon;
revoke all on function public.can_access_branch(uuid, uuid) from anon;
revoke all on function public.can_manage_branch(uuid, uuid) from anon;
revoke all on function public.can_access_transaction(uuid, uuid) from anon;
revoke all on function public.owns_customer_card(uuid) from anon;
revoke all on function public.can_access_customer_card(uuid, uuid) from anon;
revoke all on function public.can_access_transaction_id(uuid) from anon;
revoke all on function public.can_access_loyalty_program(uuid) from anon;
revoke all on function public.can_manage_loyalty_program(uuid) from anon;
revoke all on function public.can_manage_campaign(uuid) from anon;

grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.has_business_role(uuid, public.business_member_role[]) to authenticated;
grant execute on function public.can_manage_business(uuid) to authenticated;
grant execute on function public.can_own_business(uuid) to authenticated;
grant execute on function public.can_manage_customers(uuid) to authenticated;
grant execute on function public.can_access_branch(uuid, uuid) to authenticated;
grant execute on function public.can_manage_branch(uuid, uuid) to authenticated;
grant execute on function public.can_access_transaction(uuid, uuid) to authenticated;
grant execute on function public.owns_customer_card(uuid) to authenticated;
grant execute on function public.can_access_customer_card(uuid, uuid) to authenticated;
grant execute on function public.can_access_transaction_id(uuid) to authenticated;
grant execute on function public.can_access_loyalty_program(uuid) to authenticated;
grant execute on function public.can_manage_loyalty_program(uuid) to authenticated;
grant execute on function public.can_manage_campaign(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.business_categories enable row level security;
alter table public.businesses enable row level security;
alter table public.branches enable row level security;
alter table public.business_members enable row level security;
alter table public.loyalty_programs enable row level security;
alter table public.loyalty_tiers enable row level security;
alter table public.customer_cards enable row level security;
alter table public.point_wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_payments enable row level security;
alter table public.point_ledger enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_audiences enable row level security;
alter table public.offers enable row level security;
alter table public.notifications enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.referrals enable row level security;
alter table public.support_tickets enable row level security;
alter table public.audit_logs enable row level security;
alter table public.fraud_events enable row level security;

grant usage on schema public to anon, authenticated;

grant select on public.business_categories, public.businesses, public.branches,
  public.loyalty_programs, public.loyalty_tiers, public.offers, public.plans
to anon;

grant select on public.profiles, public.business_categories, public.businesses,
  public.branches, public.business_members, public.loyalty_programs,
  public.loyalty_tiers, public.customer_cards, public.point_wallets,
  public.transactions, public.transaction_payments, public.point_ledger,
  public.campaigns, public.campaign_audiences, public.offers,
  public.notifications, public.plans, public.subscriptions, public.referrals,
  public.support_tickets, public.audit_logs, public.fraud_events
to authenticated;

grant insert (id, display_name, phone, email, locale, marketing_consent_at, terms_accepted_at)
on public.profiles
to authenticated;

grant update (display_name, phone, email, locale, marketing_consent_at, terms_accepted_at)
on public.profiles
to authenticated;

grant update (
  category_id,
  slug,
  name,
  legal_name,
  nuit,
  description,
  phone,
  email,
  website_url,
  logo_url,
  cover_url
)
on public.businesses
to authenticated;
grant insert, update, delete on public.branches, public.business_members,
  public.loyalty_programs, public.loyalty_tiers, public.campaigns,
  public.campaign_audiences, public.offers
to authenticated;
grant insert on public.support_tickets to authenticated;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy business_categories_public_select
on public.business_categories
for select
to anon, authenticated
using (is_active);

create policy businesses_public_select
on public.businesses
for select
to anon, authenticated
using (status = 'active');

create policy businesses_member_select
on public.businesses
for select
to authenticated
using (public.is_business_member(id));

create policy businesses_manager_update
on public.businesses
for update
to authenticated
using (public.can_manage_business(id))
with check (public.can_manage_business(id));

create policy branches_public_select
on public.branches
for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.status = 'active'
  )
);

create policy branches_member_select
on public.branches
for select
to authenticated
using (public.can_access_branch(business_id, id));

create policy branches_manager_insert
on public.branches
for insert
to authenticated
with check (public.can_manage_business(business_id));

create policy branches_manager_update
on public.branches
for update
to authenticated
using (public.can_manage_branch(business_id, id))
with check (public.can_manage_branch(business_id, id));

create policy branches_manager_delete
on public.branches
for delete
to authenticated
using (public.can_manage_business(business_id));

create policy business_members_select_self
on public.business_members
for select
to authenticated
using (profile_id = auth.uid());

create policy business_members_manager_select
on public.business_members
for select
to authenticated
using (public.can_manage_business(business_id));

create policy business_members_manager_insert
on public.business_members
for insert
to authenticated
with check (
  public.can_manage_business(business_id)
  and (
    role <> 'business_owner'
    or public.can_own_business(business_id)
  )
);

create policy business_members_manager_update
on public.business_members
for update
to authenticated
using (
  public.can_manage_business(business_id)
  and (
    role <> 'business_owner'
    or public.can_own_business(business_id)
  )
)
with check (
  public.can_manage_business(business_id)
  and (
    role <> 'business_owner'
    or public.can_own_business(business_id)
  )
);

create policy business_members_manager_delete
on public.business_members
for delete
to authenticated
using (
  public.can_manage_business(business_id)
  and (
    role <> 'business_owner'
    or public.can_own_business(business_id)
  )
);

create policy loyalty_programs_public_select
on public.loyalty_programs
for select
to anon, authenticated
using (
  status = 'active'
  and exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.status = 'active'
  )
);

create policy loyalty_programs_member_select
on public.loyalty_programs
for select
to authenticated
using (public.is_business_member(business_id));

create policy loyalty_programs_manager_insert
on public.loyalty_programs
for insert
to authenticated
with check (public.can_manage_business(business_id));

create policy loyalty_programs_manager_update
on public.loyalty_programs
for update
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy loyalty_programs_manager_delete
on public.loyalty_programs
for delete
to authenticated
using (public.can_manage_business(business_id));

create policy loyalty_tiers_public_select
on public.loyalty_tiers
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.loyalty_programs lp
    join public.businesses b on b.id = lp.business_id
    where lp.id = loyalty_program_id
      and lp.status = 'active'
      and b.status = 'active'
  )
);

create policy loyalty_tiers_member_select
on public.loyalty_tiers
for select
to authenticated
using (public.can_access_loyalty_program(loyalty_program_id));

create policy loyalty_tiers_manager_insert
on public.loyalty_tiers
for insert
to authenticated
with check (public.can_manage_loyalty_program(loyalty_program_id));

create policy loyalty_tiers_manager_update
on public.loyalty_tiers
for update
to authenticated
using (public.can_manage_loyalty_program(loyalty_program_id))
with check (public.can_manage_loyalty_program(loyalty_program_id));

create policy loyalty_tiers_manager_delete
on public.loyalty_tiers
for delete
to authenticated
using (public.can_manage_loyalty_program(loyalty_program_id));

create policy customer_cards_select_own
on public.customer_cards
for select
to authenticated
using (customer_profile_id = auth.uid());

create policy customer_cards_manager_select
on public.customer_cards
for select
to authenticated
using (public.can_manage_customers(business_id));

create policy point_wallets_select_customer_or_manager
on public.point_wallets
for select
to authenticated
using (public.can_access_customer_card(business_id, customer_card_id));

create policy transactions_select_customer
on public.transactions
for select
to authenticated
using (
  customer_card_id is not null
  and public.owns_customer_card(customer_card_id)
);

create policy transactions_select_branch_member
on public.transactions
for select
to authenticated
using (public.can_access_transaction(business_id, branch_id));

create policy transaction_payments_select_transaction_access
on public.transaction_payments
for select
to authenticated
using (public.can_access_transaction_id(transaction_id));

create policy point_ledger_select_customer_or_manager
on public.point_ledger
for select
to authenticated
using (public.can_access_customer_card(business_id, customer_card_id));

create policy campaigns_manager_select
on public.campaigns
for select
to authenticated
using (public.can_manage_business(business_id));

create policy campaigns_manager_insert
on public.campaigns
for insert
to authenticated
with check (public.can_manage_business(business_id));

create policy campaigns_manager_update
on public.campaigns
for update
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy campaigns_manager_delete
on public.campaigns
for delete
to authenticated
using (public.can_manage_business(business_id));

create policy campaign_audiences_manager_select
on public.campaign_audiences
for select
to authenticated
using (public.can_manage_campaign(campaign_id));

create policy campaign_audiences_manager_insert
on public.campaign_audiences
for insert
to authenticated
with check (public.can_manage_campaign(campaign_id));

create policy campaign_audiences_manager_update
on public.campaign_audiences
for update
to authenticated
using (public.can_manage_campaign(campaign_id))
with check (public.can_manage_campaign(campaign_id));

create policy campaign_audiences_manager_delete
on public.campaign_audiences
for delete
to authenticated
using (public.can_manage_campaign(campaign_id));

create policy offers_public_select
on public.offers
for select
to anon, authenticated
using (
  is_public
  and is_active
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
  and exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.status = 'active'
  )
);

create policy offers_manager_select
on public.offers
for select
to authenticated
using (public.can_manage_business(business_id));

create policy offers_manager_insert
on public.offers
for insert
to authenticated
with check (public.can_manage_business(business_id));

create policy offers_manager_update
on public.offers
for update
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy offers_manager_delete
on public.offers
for delete
to authenticated
using (public.can_manage_business(business_id));

create policy notifications_select_recipient_or_manager
on public.notifications
for select
to authenticated
using (
  profile_id = auth.uid()
  or public.owns_customer_card(customer_card_id)
  or (
    business_id is not null
    and public.can_manage_business(business_id)
  )
);

create policy plans_public_select
on public.plans
for select
to anon, authenticated
using (
  is_public
  and is_active
);

create policy subscriptions_manager_select
on public.subscriptions
for select
to authenticated
using (public.can_manage_business(business_id));

create policy referrals_select_customer_or_manager
on public.referrals
for select
to authenticated
using (
  public.owns_customer_card(referrer_card_id)
  or public.owns_customer_card(referred_card_id)
  or public.can_manage_customers(business_id)
);

create policy support_tickets_select_own
on public.support_tickets
for select
to authenticated
using (profile_id = auth.uid());

create policy support_tickets_manager_select
on public.support_tickets
for select
to authenticated
using (
  business_id is not null
  and public.can_manage_business(business_id)
);

create policy support_tickets_insert_own
on public.support_tickets
for insert
to authenticated
with check (
  profile_id = auth.uid()
  and (
    business_id is null
    or public.can_manage_business(business_id)
  )
);

create policy audit_logs_manager_select
on public.audit_logs
for select
to authenticated
using (
  business_id is not null
  and public.can_manage_business(business_id)
);

create policy fraud_events_manager_select
on public.fraud_events
for select
to authenticated
using (
  business_id is not null
  and public.can_manage_business(business_id)
);
