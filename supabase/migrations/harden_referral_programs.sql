-- Phase 15 post-deployment hardening.
-- Cover new foreign keys and keep auth lookups as RLS init plans.

create index if not exists referral_programs_created_by_idx
on public.referral_programs(created_by)
where created_by is not null;

create index if not exists referral_programs_updated_by_idx
on public.referral_programs(updated_by)
where updated_by is not null;

create index if not exists referrals_qualifying_transaction_business_fk_idx
on public.referrals(qualifying_transaction_id, business_id)
where qualifying_transaction_id is not null;

drop policy if exists referral_programs_select_customer_or_manager
on public.referral_programs;

create policy referral_programs_select_customer_or_manager
on public.referral_programs
for select
to authenticated
using (
  public.can_manage_business(business_id)
  or (
    is_active
    and exists (
      select 1
      from public.customer_cards cc
      where cc.business_id = referral_programs.business_id
        and cc.customer_profile_id = (select auth.uid())
        and cc.status = 'active'
    )
  )
);

drop policy if exists referrals_select_customer_or_manager
on public.referrals;

create policy referrals_select_customer_or_manager
on public.referrals
for select
to authenticated
using (
  referred_profile_id = (select auth.uid())
  or public.owns_customer_card(referrer_card_id)
  or public.owns_customer_card(referred_card_id)
  or public.can_manage_customers(business_id)
);
