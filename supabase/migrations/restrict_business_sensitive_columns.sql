-- FASE 19 security hardening.
-- Active businesses remain publicly discoverable, but legal identity fields are
-- no longer readable through the Data API by anonymous or signed-in clients.

revoke select on public.businesses from anon, authenticated;

grant select (
  id,
  category_id,
  slug,
  name,
  description,
  status,
  phone,
  email,
  website_url,
  logo_url,
  cover_url,
  created_at,
  updated_at,
  activated_at
)
on public.businesses
to anon, authenticated;

-- owner_profile_id, legal_name and nuit are intentionally excluded. Platform
-- administration continues through audited service-role RPCs.
