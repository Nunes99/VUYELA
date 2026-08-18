-- Consolidate equivalent permissive SELECT policies to avoid duplicate policy evaluation.

alter policy branches_public_select
on public.branches
to anon;
drop policy branches_member_select on public.branches;
create policy branches_authenticated_select
on public.branches
for select
to authenticated
using (
  (
    is_active
    and exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.status = 'active'
    )
  )
  or public.can_access_branch(business_id, id)
);

alter policy businesses_public_select
on public.businesses
to anon;
drop policy businesses_member_select on public.businesses;
create policy businesses_authenticated_select
on public.businesses
for select
to authenticated
using (
  status = 'active'
  or public.is_business_member(id)
);

drop policy business_members_select_self on public.business_members;
drop policy business_members_manager_select on public.business_members;
create policy business_members_authenticated_select
on public.business_members
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or public.can_manage_business(business_id)
);

drop policy customer_cards_select_own on public.customer_cards;
drop policy customer_cards_manager_select on public.customer_cards;
create policy customer_cards_authenticated_select
on public.customer_cards
for select
to authenticated
using (
  customer_profile_id = (select auth.uid())
  or public.can_manage_customers(business_id)
);

alter policy loyalty_programs_public_select
on public.loyalty_programs
to anon;
drop policy loyalty_programs_member_select on public.loyalty_programs;
create policy loyalty_programs_authenticated_select
on public.loyalty_programs
for select
to authenticated
using (
  (
    status = 'active'
    and exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.status = 'active'
    )
  )
  or public.is_business_member(business_id)
);

alter policy loyalty_tiers_public_select
on public.loyalty_tiers
to anon;
drop policy loyalty_tiers_member_select on public.loyalty_tiers;
create policy loyalty_tiers_authenticated_select
on public.loyalty_tiers
for select
to authenticated
using (
  exists (
    select 1
    from public.loyalty_programs lp
    join public.businesses b on b.id = lp.business_id
    where lp.id = loyalty_program_id
      and (
        (lp.status = 'active' and b.status = 'active')
        or public.is_business_member(lp.business_id)
      )
  )
);

alter policy offers_public_select
on public.offers
to anon;
drop policy offers_manager_select on public.offers;
create policy offers_authenticated_select
on public.offers
for select
to authenticated
using (
  (
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
  )
  or public.can_manage_business(business_id)
);

drop policy support_tickets_select_own on public.support_tickets;
drop policy support_tickets_manager_select on public.support_tickets;
create policy support_tickets_authenticated_select
on public.support_tickets
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or (
    business_id is not null
    and public.can_manage_business(business_id)
  )
);

drop policy transactions_select_customer on public.transactions;
drop policy transactions_select_branch_member on public.transactions;
create policy transactions_authenticated_select
on public.transactions
for select
to authenticated
using (
  (
    customer_card_id is not null
    and public.owns_customer_card(customer_card_id)
  )
  or public.can_access_transaction(business_id, branch_id)
);
