-- VUYELA function privilege hardening.
-- Keep SECURITY DEFINER helpers/RPCs unavailable to anonymous API callers.

alter function public.set_updated_at() set search_path = public;
alter function public.prevent_point_ledger_mutation() set search_path = public;

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

revoke all on function public.calculate_loyalty_points(integer, numeric) from anon;
revoke all on function public.calculate_points_value_mzn_minor(integer, integer) from anon;
revoke all on function public.calculate_max_redeemable_points(
  integer,
  integer,
  integer,
  integer,
  numeric
) from anon;
revoke all on function public.record_purchase_points(
  uuid,
  uuid,
  uuid,
  integer,
  integer,
  uuid,
  text,
  jsonb
) from anon;
revoke all on function public.redeem_purchase_points(
  uuid,
  uuid,
  uuid,
  integer,
  integer,
  integer,
  uuid,
  text,
  jsonb
) from anon;
revoke all on function public.refund_loyalty_transaction(uuid, text) from anon;
revoke all on function public.lookup_pos_customer_card(uuid, uuid, text) from anon;
revoke all on function public.get_business_dashboard(uuid, uuid, integer) from anon;
revoke all on function public.calculate_campaign_eligibility(uuid, text, jsonb, jsonb, timestamptz) from anon;
revoke all on function public.create_campaign_with_audience(uuid, text, text, timestamptz, timestamptz, jsonb, jsonb, boolean) from anon;
revoke all on function public.get_business_campaigns(uuid) from anon;
