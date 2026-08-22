-- Extend POS identification with explicit QR, card-number and phone lookup.
-- Every lookup remains tenant-scoped and requires an active POS membership.

create or replace function public.lookup_pos_customer(
  p_business_id uuid,
  p_branch_id uuid,
  p_lookup_method text,
  p_lookup_value text
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
  v_lookup_method text := lower(btrim(coalesce(p_lookup_method, '')));
  v_lookup_value text := btrim(coalesce(p_lookup_value, ''));
  v_card_number text;
  v_phone_digits text;
  v_qr_business_id text;
begin
  if p_business_id is null or v_lookup_value = '' then
    raise exception 'Missing required POS customer lookup fields';
  end if;

  if v_lookup_method not in ('qr', 'card', 'phone') then
    raise exception 'Unsupported POS customer lookup method';
  end if;

  if not public.can_access_transaction(p_business_id, p_branch_id) then
    raise exception 'Not authorized to identify POS customers for this business or branch';
  end if;

  if v_lookup_method = 'qr' then
    v_lookup_value := upper(v_lookup_value);

    if v_lookup_value not like 'VUYELA:CARD:%' then
      raise exception 'Invalid VUYELA card QR payload';
    end if;

    v_qr_business_id := lower(split_part(v_lookup_value, ':', 3));
    v_card_number := split_part(v_lookup_value, ':', 4);

    if v_qr_business_id <> p_business_id::text then
      return;
    end if;
  elsif v_lookup_method = 'card' then
    v_card_number := upper(v_lookup_value);
  else
    v_phone_digits := regexp_replace(v_lookup_value, '[^0-9]', '', 'g');

    if length(v_phone_digits) < 8 or length(v_phone_digits) > 15 then
      raise exception 'Invalid POS customer phone number';
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
    and cc.status = 'active'
    and lp.status = 'active'
    and (
      (v_lookup_method in ('qr', 'card') and cc.card_number = v_card_number)
      or (
        v_lookup_method = 'phone'
        and p.phone is not null
        and (
          regexp_replace(p.phone, '[^0-9]', '', 'g') = v_phone_digits
          or (
            length(v_phone_digits) = 9
            and right(regexp_replace(p.phone, '[^0-9]', '', 'g'), 9) = v_phone_digits
          )
        )
      )
    )
  order by cc.joined_at desc
  limit 1;
end;
$$;

revoke all on function public.lookup_pos_customer(uuid, uuid, text, text) from public, anon;
grant execute on function public.lookup_pos_customer(uuid, uuid, text, text) to authenticated;
