-- Make approved businesses operational and allow authenticated customers to
-- join an active loyalty program through one tenant-safe transaction.

create or replace function public.provision_default_loyalty_program()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' then
    if tg_op = 'INSERT' or (tg_op = 'UPDATE' and old.status is distinct from new.status) then
      insert into public.loyalty_programs (
        business_id,
        name,
        status,
        earn_rate,
        point_value_mzn_minor,
        maximum_redemption_percent,
        terms
      )
      values (
        new.id,
        'Pontos ' || new.name,
        'active',
        0.0500,
        100,
        50.00,
        'Os pontos são promocionais, pertencem ao negócio emissor e não podem ser levantados ou transferidos.'
      )
      on conflict (business_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.provision_default_loyalty_program() from public, anon, authenticated;

drop trigger if exists businesses_provision_default_loyalty_program on public.businesses;
create trigger businesses_provision_default_loyalty_program
after insert or update of status on public.businesses
for each row execute function public.provision_default_loyalty_program();

insert into public.loyalty_programs (
  business_id,
  name,
  status,
  earn_rate,
  point_value_mzn_minor,
  maximum_redemption_percent,
  terms
)
select
  b.id,
  'Pontos ' || b.name,
  'active',
  0.0500,
  100,
  50.00,
  'Os pontos são promocionais, pertencem ao negócio emissor e não podem ser levantados ou transferidos.'
from public.businesses b
where b.status = 'active'
on conflict (business_id) do nothing;

create or replace function public.join_business_loyalty_program(
  p_business_id uuid
)
returns table (
  customer_card_id uuid,
  customer_card_number text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_program_id uuid;
  v_card_id uuid;
  v_card_number text;
begin
  if v_profile_id is null then
    raise exception 'Authentication required to join a loyalty program';
  end if;

  if p_business_id is null then
    raise exception 'Missing loyalty program business scope';
  end if;

  perform 1
  from public.profiles p
  where p.id = v_profile_id
  for update;

  if not found then
    raise exception 'Authenticated profile not found';
  end if;

  select lp.id
  into v_program_id
  from public.loyalty_programs lp
  join public.businesses b on b.id = lp.business_id
  where lp.business_id = p_business_id
    and lp.status = 'active'
    and b.status = 'active'
  order by lp.created_at desc
  limit 1;

  if v_program_id is null then
    raise exception 'Active loyalty program not found';
  end if;

  select cc.id, cc.card_number
  into v_card_id, v_card_number
  from public.customer_cards cc
  where cc.business_id = p_business_id
    and cc.customer_profile_id = v_profile_id;

  if v_card_id is null then
    v_card_number := 'VY-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16));

    insert into public.customer_cards (
      business_id,
      customer_profile_id,
      loyalty_program_id,
      card_number,
      status
    )
    values (
      p_business_id,
      v_profile_id,
      v_program_id,
      v_card_number,
      'active'
    )
    returning id into v_card_id;

    insert into public.point_wallets (
      business_id,
      customer_card_id
    )
    values (
      p_business_id,
      v_card_id
    );

    insert into public.audit_logs (
      business_id,
      actor_profile_id,
      action,
      entity_table,
      entity_id,
      after_data,
      context
    )
    values (
      p_business_id,
      v_profile_id,
      'create',
      'customer_cards',
      v_card_id,
      jsonb_build_object('status', 'active', 'loyaltyProgramId', v_program_id),
      jsonb_build_object('source', 'public_program_membership')
    );
  end if;

  return query
  select v_card_id, v_card_number;
end;
$$;

revoke all on function public.join_business_loyalty_program(uuid) from public, anon;
grant execute on function public.join_business_loyalty_program(uuid) to authenticated;
