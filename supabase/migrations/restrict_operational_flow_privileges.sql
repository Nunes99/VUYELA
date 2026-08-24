-- Remove broad API privileges assigned automatically when the Phase 26 tables
-- were created, then restore only the explicit operational access contract.

revoke all on table
  public.business_catalog_items,
  public.pos_terminals,
  public.pos_terminal_settings,
  public.pos_terminal_devices,
  public.business_payment_channels,
  public.payment_attempts,
  public.business_member_invitations,
  public.customer_business_preferences,
  public.offer_claims,
  public.support_ticket_messages,
  public.platform_settings
from public, anon, authenticated;

grant select on public.business_catalog_items,
  public.pos_terminals,
  public.pos_terminal_settings,
  public.pos_terminal_devices,
  public.business_payment_channels,
  public.payment_attempts,
  public.customer_business_preferences,
  public.offer_claims,
  public.support_ticket_messages
to authenticated;

grant select (
  id,
  business_id,
  branch_id,
  email,
  phone,
  role,
  status,
  invited_by,
  expires_at,
  accepted_by,
  accepted_at,
  revoked_at,
  created_at,
  updated_at
)
on public.business_member_invitations
to authenticated;

grant insert (
  business_id,
  branch_id,
  kind,
  sku,
  name,
  description,
  price_mzn_minor,
  is_available,
  sort_order
)
on public.business_catalog_items
to authenticated;

grant update (
  branch_id,
  kind,
  sku,
  name,
  description,
  price_mzn_minor,
  is_available,
  sort_order
)
on public.business_catalog_items
to authenticated;

grant delete on public.business_catalog_items to authenticated;

grant insert (
  business_id,
  profile_id,
  preferred_branch_id,
  is_favorite,
  offer_notifications_enabled
)
on public.customer_business_preferences
to authenticated;

grant update (
  preferred_branch_id,
  is_favorite,
  offer_notifications_enabled
)
on public.customer_business_preferences
to authenticated;

grant delete on public.customer_business_preferences to authenticated;

grant insert (
  ticket_id,
  business_id,
  author_profile_id,
  author_type,
  body,
  is_internal,
  delivery_status
)
on public.support_ticket_messages
to authenticated;

comment on table public.platform_settings is
  'No API table privileges or authenticated policy; audited service-role operations only.';
