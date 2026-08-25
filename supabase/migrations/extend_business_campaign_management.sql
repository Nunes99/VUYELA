-- Complete the editable campaign lifecycle introduced in FASE 27.

create or replace function public.update_business_campaign(
  p_business_id uuid,
  p_campaign_id uuid,
  p_name text,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_campaign public.campaigns%rowtype;
  v_next_status public.campaign_status;
begin
  if p_business_id is null or v_actor is null or not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to update campaigns';
  end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 3 and 120
    or (p_starts_at is not null and p_ends_at is not null and p_ends_at <= p_starts_at) then
    raise exception 'Invalid campaign details';
  end if;

  select * into v_campaign
  from public.campaigns
  where id = p_campaign_id and business_id = p_business_id
  for update;
  if not found then raise exception 'Campaign not found'; end if;
  if v_campaign.status in ('completed', 'cancelled') then
    raise exception 'Closed campaigns cannot be edited';
  end if;

  v_next_status := case
    when v_campaign.status = 'draft' then 'draft'::public.campaign_status
    when v_campaign.status = 'paused' then 'paused'::public.campaign_status
    when p_starts_at is not null and p_starts_at > now() then 'scheduled'::public.campaign_status
    else 'active'::public.campaign_status
  end;

  update public.campaigns
  set name = btrim(p_name), starts_at = p_starts_at, ends_at = p_ends_at, status = v_next_status
  where id = p_campaign_id and business_id = p_business_id;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, before_data, after_data, context
  ) values (
    p_business_id,
    v_actor,
    'update',
    'campaigns',
    p_campaign_id,
    to_jsonb(v_campaign),
    (select to_jsonb(c.*) from public.campaigns c where c.id = p_campaign_id),
    jsonb_build_object('source', 'business_operations', 'operation', 'edit')
  );
end;
$$;

revoke all on function public.update_business_campaign(uuid, uuid, text, timestamptz, timestamptz)
from public, anon;
grant execute on function public.update_business_campaign(uuid, uuid, text, timestamptz, timestamptz)
to authenticated;
