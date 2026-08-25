-- FASE 29: customer favorites, notification preferences and offer activation.

create or replace function public.get_customer_engagement()
returns table (
  preferences jsonb,
  offer_claims jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := (select auth.uid());
begin
  if v_profile_id is null then raise exception 'Authentication is required'; end if;

  return query
  select
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'businessId', cbp.business_id::text,
          'preferredBranchId', cbp.preferred_branch_id::text,
          'isFavorite', cbp.is_favorite,
          'offerNotificationsEnabled', cbp.offer_notifications_enabled
        )
        order by cbp.updated_at desc
      )
      from public.customer_business_preferences cbp
      where cbp.profile_id = v_profile_id
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', oc.id::text,
          'businessId', oc.business_id::text,
          'offerId', oc.offer_id::text,
          'customerCardId', oc.customer_card_id::text,
          'claimCode', oc.claim_code,
          'status', case
            when oc.status = 'activated' and oc.expires_at <= now() then 'expired'
            else oc.status::text
          end,
          'activatedAt', oc.activated_at::text,
          'expiresAt', oc.expires_at::text
        )
        order by oc.activated_at desc
      )
      from public.offer_claims oc
      where oc.profile_id = v_profile_id
    ), '[]'::jsonb);
end;
$$;

create or replace function public.update_customer_business_preference(
  p_business_id uuid,
  p_preferred_branch_id uuid,
  p_is_favorite boolean,
  p_offer_notifications_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := (select auth.uid());
begin
  if v_profile_id is null or p_business_id is null then
    raise exception 'Authentication and business are required';
  end if;
  if not exists (
    select 1
    from public.customer_cards cc
    where cc.business_id = p_business_id
      and cc.customer_profile_id = v_profile_id
      and cc.status = 'active'
  ) then
    raise exception 'An active customer card is required';
  end if;
  if p_preferred_branch_id is not null and not exists (
    select 1
    from public.branches br
    where br.id = p_preferred_branch_id
      and br.business_id = p_business_id
      and br.is_active
  ) then
    raise exception 'Preferred branch is not active for this business';
  end if;

  insert into public.customer_business_preferences (
    business_id,
    profile_id,
    preferred_branch_id,
    is_favorite,
    offer_notifications_enabled
  ) values (
    p_business_id,
    v_profile_id,
    p_preferred_branch_id,
    coalesce(p_is_favorite, false),
    coalesce(p_offer_notifications_enabled, true)
  )
  on conflict (business_id, profile_id) do update set
    preferred_branch_id = excluded.preferred_branch_id,
    is_favorite = excluded.is_favorite,
    offer_notifications_enabled = excluded.offer_notifications_enabled;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, after_data, context
  ) values (
    p_business_id,
    v_profile_id,
    'update',
    'customer_business_preferences',
    jsonb_build_object(
      'preferred_branch_id', p_preferred_branch_id,
      'is_favorite', coalesce(p_is_favorite, false),
      'offer_notifications_enabled', coalesce(p_offer_notifications_enabled, true)
    ),
    jsonb_build_object('source', 'customer_area')
  );
end;
$$;

create or replace function public.activate_customer_offer(
  p_offer_id uuid,
  p_customer_card_id uuid
)
returns table (
  claim_id uuid,
  claim_code text,
  claim_status text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := (select auth.uid());
  v_offer public.offers;
  v_card public.customer_cards;
  v_claim public.offer_claims;
  v_claim_code text;
  v_expires_at timestamptz;
begin
  if v_profile_id is null or p_offer_id is null or p_customer_card_id is null then
    raise exception 'Offer and customer card are required';
  end if;

  select o.* into v_offer
  from public.offers o
  where o.id = p_offer_id
    and o.is_public
    and o.is_active
    and (o.starts_at is null or o.starts_at <= now())
    and (o.ends_at is null or o.ends_at > now())
  for share;
  if not found then raise exception 'Offer is not available'; end if;

  select cc.* into v_card
  from public.customer_cards cc
  where cc.id = p_customer_card_id
    and cc.business_id = v_offer.business_id
    and cc.customer_profile_id = v_profile_id
    and cc.status = 'active'
  for share;
  if not found then raise exception 'Active customer card not found for this offer'; end if;

  select oc.* into v_claim
  from public.offer_claims oc
  where oc.offer_id = v_offer.id and oc.customer_card_id = v_card.id
  for update;

  if found and v_claim.status = 'activated' and (v_claim.expires_at is null or v_claim.expires_at > now()) then
    return query select v_claim.id, v_claim.claim_code, v_claim.status::text, v_claim.expires_at;
    return;
  end if;
  if found and v_claim.status = 'redeemed' then
    raise exception 'Offer has already been redeemed';
  end if;

  v_claim_code := 'OF-' || upper(substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 12));
  v_expires_at := coalesce(v_offer.ends_at, now() + interval '30 days');

  if found then
    update public.offer_claims
    set
      claim_code = v_claim_code,
      status = 'activated',
      activated_at = now(),
      redeemed_at = null,
      transaction_id = null,
      expires_at = v_expires_at,
      cancelled_at = null,
      metadata = jsonb_build_object('reactivated', true)
    where id = v_claim.id
    returning * into v_claim;
  else
    insert into public.offer_claims (
      business_id,
      offer_id,
      customer_card_id,
      profile_id,
      claim_code,
      status,
      expires_at,
      metadata
    ) values (
      v_offer.business_id,
      v_offer.id,
      v_card.id,
      v_profile_id,
      v_claim_code,
      'activated',
      v_expires_at,
      jsonb_build_object('source', 'customer_area')
    ) returning * into v_claim;
  end if;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, after_data, context
  ) values (
    v_offer.business_id,
    v_profile_id,
    'create',
    'offer_claims',
    v_claim.id,
    jsonb_build_object('offer_id', v_offer.id, 'status', v_claim.status, 'expires_at', v_claim.expires_at),
    jsonb_build_object('source', 'customer_area')
  );

  return query select v_claim.id, v_claim.claim_code, v_claim.status::text, v_claim.expires_at;
end;
$$;

create or replace function public.cancel_customer_offer_claim(p_claim_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := (select auth.uid());
  v_claim public.offer_claims;
begin
  if v_profile_id is null then raise exception 'Authentication is required'; end if;

  select oc.* into v_claim
  from public.offer_claims oc
  where oc.id = p_claim_id and oc.profile_id = v_profile_id
  for update;
  if not found or v_claim.status <> 'activated' then
    raise exception 'Active offer claim not found';
  end if;

  update public.offer_claims
  set status = 'cancelled', cancelled_at = now()
  where id = v_claim.id;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, before_data, after_data, context
  ) values (
    v_claim.business_id,
    v_profile_id,
    'update',
    'offer_claims',
    v_claim.id,
    to_jsonb(v_claim),
    jsonb_build_object('status', 'cancelled', 'cancelled_at', now()),
    jsonb_build_object('source', 'customer_area')
  );
end;
$$;

revoke all on function public.get_customer_engagement() from public, anon;
grant execute on function public.get_customer_engagement() to authenticated;

revoke all on function public.update_customer_business_preference(uuid, uuid, boolean, boolean) from public, anon;
grant execute on function public.update_customer_business_preference(uuid, uuid, boolean, boolean) to authenticated;

revoke all on function public.activate_customer_offer(uuid, uuid) from public, anon;
grant execute on function public.activate_customer_offer(uuid, uuid) to authenticated;

revoke all on function public.cancel_customer_offer_claim(uuid) from public, anon;
grant execute on function public.cancel_customer_offer_claim(uuid) to authenticated;
