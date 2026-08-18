-- VUYELA POS customer-card lookup.
-- Cashiers identify cards through a server-side boundary before transaction RPCs.

create or replace function public.lookup_pos_customer_card(
  p_business_id uuid,
  p_branch_id uuid,
  p_card_code text
)
returns table (
  customer_card_id uuid,
  customer_name text,
  card_number text,
  available_points integer,
  point_value_mzn_minor integer,
  maximum_redemption_percent numeric,
  earn_rate numeric,
  status public.card_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card_code text;
  v_qr_business_id text;
begin
  if p_business_id is null or p_card_code is null or btrim(p_card_code) = '' then
    raise exception 'Missing required POS card lookup fields';
  end if;

  if not public.can_access_transaction(p_business_id, p_branch_id) then
    raise exception 'Not authorized to identify POS cards for this business or branch';
  end if;

  v_card_code := upper(btrim(p_card_code));

  if v_card_code like 'VUYELA:CARD:%' then
    v_qr_business_id := lower(split_part(v_card_code, ':', 3));
    v_card_code := split_part(v_card_code, ':', 4);

    if v_qr_business_id <> p_business_id::text then
      return;
    end if;
  end if;

  return query
  select
    cc.id,
    coalesce(nullif(cc.display_name, ''), nullif(p.display_name, ''), p.email::text, p.phone, 'Cliente VUYELA'),
    cc.card_number,
    pw.available_balance,
    lp.point_value_mzn_minor,
    lp.maximum_redemption_percent,
    lp.earn_rate,
    cc.status
  from public.customer_cards cc
  join public.profiles p on p.id = cc.customer_profile_id
  join public.point_wallets pw on pw.customer_card_id = cc.id and pw.business_id = cc.business_id
  join public.loyalty_programs lp on lp.id = cc.loyalty_program_id and lp.business_id = cc.business_id
  where cc.business_id = p_business_id
    and cc.card_number = v_card_code
    and cc.status = 'active'
    and lp.status = 'active'
  limit 1;
end;
$$;

revoke all on function public.lookup_pos_customer_card(uuid, uuid, text) from public;
revoke all on function public.lookup_pos_customer_card(uuid, uuid, text) from anon;
grant execute on function public.lookup_pos_customer_card(uuid, uuid, text) to authenticated;
