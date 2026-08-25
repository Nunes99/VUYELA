-- FASE 30 complete platform operations.
-- Adds auditable account controls, support replies, fraud triage and non-secret settings.

alter table public.fraud_events
  add column triage_status text not null default 'pending',
  add column assigned_to_profile_id uuid references public.profiles(id) on delete set null,
  add column reviewed_at timestamptz;

update public.fraud_events
set triage_status = 'resolved',
    reviewed_at = coalesce(resolved_at, created_at)
where resolved_at is not null;

alter table public.fraud_events
  add constraint fraud_events_triage_status_supported check (
    triage_status in ('pending', 'reviewing', 'escalated', 'resolved', 'dismissed')
  ),
  add constraint fraud_events_triage_resolution_consistent check (
    (
      resolved_at is null
      and triage_status in ('pending', 'reviewing', 'escalated')
    )
    or (
      resolved_at is not null
      and triage_status in ('resolved', 'dismissed')
    )
  );

create index fraud_events_assigned_to_profile_id_idx
on public.fraud_events(assigned_to_profile_id)
where assigned_to_profile_id is not null;

create index fraud_events_triage_status_created_at_idx
on public.fraud_events(triage_status, created_at desc);

insert into public.platform_settings (key, value, description, is_public)
values
  ('platform.name', jsonb_build_object('value', 'VUYELA'), 'Nome público da plataforma.', true),
  ('platform.locale', jsonb_build_object('value', 'pt-MZ'), 'Idioma principal da plataforma.', true),
  ('platform.currency', jsonb_build_object('value', 'MZN'), 'Moeda principal da plataforma.', true),
  ('platform.timezone', jsonb_build_object('value', 'Africa/Maputo'), 'Fuso horário operacional.', false),
  ('security.contact_email', jsonb_build_object('value', 'seguranca@vuyela.co.mz'), 'Contacto para alertas de segurança.', false),
  ('security.privileged_mfa_required', jsonb_build_object('enabled', true), 'Exige MFA para funções privilegiadas.', false),
  ('notifications.fraud_alerts', jsonb_build_object('enabled', true), 'Ativa alertas internos de fraude.', false),
  ('notifications.support_alerts', jsonb_build_object('enabled', true), 'Ativa alertas internos de suporte.', false)
on conflict (key) do nothing;

create or replace function public.admin_set_profile_account_status(
  p_actor_profile_id uuid,
  p_target_profile_id uuid,
  p_status text,
  p_reason text,
  p_ip_address inet default null,
  p_user_agent text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role public.profile_role;
  v_before public.profiles;
  v_after public.profiles;
  v_status public.profile_account_status;
begin
  v_actor_role := public.assert_platform_actor(
    p_actor_profile_id,
    array['platform_admin', 'super_admin']::public.profile_role[]
  );

  if p_actor_profile_id = p_target_profile_id then
    raise exception 'Administrators cannot change their own account status';
  end if;

  if p_status not in ('active', 'suspended') then
    raise exception 'Unsupported account status';
  end if;

  if p_status = 'suspended' and char_length(coalesce(nullif(btrim(p_reason), ''), '')) < 4 then
    raise exception 'A suspension reason is required';
  end if;

  v_status := p_status::public.profile_account_status;

  select p.*
  into v_before
  from public.profiles p
  where p.id = p_target_profile_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_before.account_status = v_status then
    raise exception 'Profile already has this account status';
  end if;

  if v_actor_role = 'platform_admin'
    and v_before.role in ('platform_admin', 'super_admin') then
    raise exception 'Only a super admin can manage privileged platform accounts';
  end if;

  update public.profiles
  set account_status = v_status,
      suspended_at = case when v_status = 'suspended' then now() else null end,
      suspension_reason = case
        when v_status = 'suspended' then left(btrim(p_reason), 1000)
        else null
      end
  where id = p_target_profile_id
  returning * into v_after;

  insert into public.audit_logs (
    actor_profile_id, action, entity_table, entity_id, before_data, after_data,
    ip_address, user_agent, context
  )
  values (
    p_actor_profile_id,
    case when v_status = 'suspended'
      then 'suspension'::public.audit_action
      else 'update'::public.audit_action
    end,
    'profiles',
    p_target_profile_id,
    jsonb_build_object('accountStatus', v_before.account_status),
    jsonb_build_object('accountStatus', v_after.account_status),
    p_ip_address,
    left(p_user_agent, 500),
    jsonb_build_object(
      'operation', 'profile_account_status_change',
      'reason', nullif(left(btrim(p_reason), 1000), '')
    )
  );

  return v_after;
end;
$$;

create or replace function public.admin_add_support_ticket_message(
  p_actor_profile_id uuid,
  p_ticket_id uuid,
  p_body text,
  p_is_internal boolean default false,
  p_ip_address inet default null,
  p_user_agent text default null
)
returns public.support_ticket_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.support_tickets;
  v_message public.support_ticket_messages;
begin
  perform public.assert_platform_actor(
    p_actor_profile_id,
    array['support_agent', 'platform_admin', 'super_admin']::public.profile_role[]
  );

  if char_length(coalesce(nullif(btrim(p_body), ''), '')) < 2 then
    raise exception 'A support message is required';
  end if;

  select t.*
  into v_ticket
  from public.support_tickets t
  where t.id = p_ticket_id
  for update;

  if not found then
    raise exception 'Support ticket not found';
  end if;

  if v_ticket.status = 'closed' then
    raise exception 'Closed support tickets cannot receive replies';
  end if;

  insert into public.support_ticket_messages (
    ticket_id, business_id, author_profile_id, author_type, body,
    is_internal, delivery_status
  )
  values (
    p_ticket_id,
    v_ticket.business_id,
    p_actor_profile_id,
    'operator',
    left(btrim(p_body), 4000),
    p_is_internal,
    case when p_is_internal then 'internal' else 'queued' end
  )
  returning * into v_message;

  update public.support_tickets
  set status = case when status = 'open' then 'in_progress' else status end,
      assigned_to_profile_id = coalesce(assigned_to_profile_id, p_actor_profile_id)
  where id = p_ticket_id;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id,
    after_data, ip_address, user_agent, context
  )
  values (
    v_ticket.business_id,
    p_actor_profile_id,
    'create',
    'support_ticket_messages',
    v_message.id,
    jsonb_build_object(
      'ticketId', p_ticket_id,
      'isInternal', p_is_internal,
      'deliveryStatus', v_message.delivery_status
    ),
    p_ip_address,
    left(p_user_agent, 500),
    jsonb_build_object('operation', 'support_ticket_reply')
  );

  return v_message;
end;
$$;

create or replace function public.admin_triage_fraud_event(
  p_actor_profile_id uuid,
  p_fraud_event_id uuid,
  p_decision text,
  p_assigned_to_profile_id uuid default null,
  p_note text default null,
  p_ip_address inet default null,
  p_user_agent text default null
)
returns public.fraud_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.fraud_events;
  v_after public.fraud_events;
  v_assignee uuid;
begin
  perform public.assert_platform_actor(
    p_actor_profile_id,
    array['support_agent', 'platform_admin', 'super_admin']::public.profile_role[]
  );

  if p_decision not in ('review', 'escalate', 'resolve', 'dismiss', 'reopen') then
    raise exception 'Unsupported fraud triage decision';
  end if;

  if p_decision in ('escalate', 'resolve', 'dismiss')
    and char_length(coalesce(nullif(btrim(p_note), ''), '')) < 4 then
    raise exception 'A fraud triage note is required';
  end if;

  v_assignee := coalesce(p_assigned_to_profile_id, p_actor_profile_id);
  if not exists (
    select 1 from public.profiles p
    where p.id = v_assignee
      and p.role in ('support_agent', 'platform_admin', 'super_admin')
      and p.account_status = 'active'
  ) then
    raise exception 'Fraud assignee is not an active platform operator';
  end if;

  select f.*
  into v_before
  from public.fraud_events f
  where f.id = p_fraud_event_id
  for update;

  if not found then
    raise exception 'Fraud event not found';
  end if;

  update public.fraud_events
  set triage_status = case p_decision
        when 'review' then 'reviewing'
        when 'escalate' then 'escalated'
        when 'resolve' then 'resolved'
        when 'dismiss' then 'dismissed'
        else 'pending'
      end,
      assigned_to_profile_id = case when p_decision = 'reopen' then null else v_assignee end,
      reviewed_at = now(),
      resolved_at = case when p_decision in ('resolve', 'dismiss') then now() else null end,
      resolved_by_profile_id = case
        when p_decision in ('resolve', 'dismiss') then p_actor_profile_id
        else null
      end,
      resolution_note = case
        when p_decision in ('resolve', 'dismiss') then left(btrim(p_note), 2000)
        else null
      end
  where id = p_fraud_event_id
  returning * into v_after;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id,
    before_data, after_data, ip_address, user_agent, context
  )
  values (
    v_after.business_id,
    p_actor_profile_id,
    'update',
    'fraud_events',
    p_fraud_event_id,
    jsonb_build_object(
      'triageStatus', v_before.triage_status,
      'assignedToProfileId', v_before.assigned_to_profile_id
    ),
    jsonb_build_object(
      'triageStatus', v_after.triage_status,
      'assignedToProfileId', v_after.assigned_to_profile_id
    ),
    p_ip_address,
    left(p_user_agent, 500),
    jsonb_build_object(
      'operation', 'fraud_event_triage',
      'decision', p_decision,
      'note', nullif(left(btrim(p_note), 2000), '')
    )
  );

  return v_after;
end;
$$;

create or replace function public.admin_update_platform_settings(
  p_actor_profile_id uuid,
  p_platform_name text,
  p_locale text,
  p_currency text,
  p_timezone text,
  p_security_email text,
  p_privileged_mfa_required boolean,
  p_fraud_alerts boolean,
  p_support_alerts boolean,
  p_note text,
  p_ip_address inet default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb;
  v_after jsonb;
begin
  perform public.assert_platform_actor(
    p_actor_profile_id,
    array['platform_admin', 'super_admin']::public.profile_role[]
  );

  if char_length(btrim(p_platform_name)) < 2
    or p_locale !~ '^[a-z]{2}-[A-Z]{2}$'
    or p_currency !~ '^[A-Z]{3}$'
    or char_length(btrim(p_timezone)) < 3
    or p_security_email !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    or char_length(coalesce(nullif(btrim(p_note), ''), '')) < 4 then
    raise exception 'Invalid platform settings';
  end if;

  select coalesce(jsonb_object_agg(ps.key, ps.value), '{}'::jsonb)
  into v_before
  from public.platform_settings ps
  where ps.key in (
    'platform.name', 'platform.locale', 'platform.currency', 'platform.timezone',
    'security.contact_email', 'security.privileged_mfa_required',
    'notifications.fraud_alerts', 'notifications.support_alerts'
  );

  insert into public.platform_settings (key, value, description, is_public, updated_by)
  values
    ('platform.name', jsonb_build_object('value', left(btrim(p_platform_name), 100)), 'Nome público da plataforma.', true, p_actor_profile_id),
    ('platform.locale', jsonb_build_object('value', p_locale), 'Idioma principal da plataforma.', true, p_actor_profile_id),
    ('platform.currency', jsonb_build_object('value', p_currency), 'Moeda principal da plataforma.', true, p_actor_profile_id),
    ('platform.timezone', jsonb_build_object('value', left(btrim(p_timezone), 100)), 'Fuso horário operacional.', false, p_actor_profile_id),
    ('security.contact_email', jsonb_build_object('value', lower(btrim(p_security_email))), 'Contacto para alertas de segurança.', false, p_actor_profile_id),
    ('security.privileged_mfa_required', jsonb_build_object('enabled', p_privileged_mfa_required), 'Exige MFA para funções privilegiadas.', false, p_actor_profile_id),
    ('notifications.fraud_alerts', jsonb_build_object('enabled', p_fraud_alerts), 'Ativa alertas internos de fraude.', false, p_actor_profile_id),
    ('notifications.support_alerts', jsonb_build_object('enabled', p_support_alerts), 'Ativa alertas internos de suporte.', false, p_actor_profile_id)
  on conflict (key) do update
  set value = excluded.value,
      description = excluded.description,
      is_public = excluded.is_public,
      updated_by = excluded.updated_by;

  select coalesce(jsonb_object_agg(ps.key, ps.value), '{}'::jsonb)
  into v_after
  from public.platform_settings ps
  where ps.key in (
    'platform.name', 'platform.locale', 'platform.currency', 'platform.timezone',
    'security.contact_email', 'security.privileged_mfa_required',
    'notifications.fraud_alerts', 'notifications.support_alerts'
  );

  insert into public.audit_logs (
    actor_profile_id, action, entity_table, before_data, after_data,
    ip_address, user_agent, context
  )
  values (
    p_actor_profile_id,
    'update',
    'platform_settings',
    v_before,
    v_after,
    p_ip_address,
    left(p_user_agent, 500),
    jsonb_build_object(
      'operation', 'platform_settings_update',
      'note', left(btrim(p_note), 1000)
    )
  );

  return v_after;
end;
$$;

revoke all privileges on function public.admin_set_profile_account_status(uuid, uuid, text, text, inet, text)
from public, anon, authenticated;
revoke all privileges on function public.admin_add_support_ticket_message(uuid, uuid, text, boolean, inet, text)
from public, anon, authenticated;
revoke all privileges on function public.admin_triage_fraud_event(uuid, uuid, text, uuid, text, inet, text)
from public, anon, authenticated;
revoke all privileges on function public.admin_update_platform_settings(uuid, text, text, text, text, text, boolean, boolean, boolean, text, inet, text)
from public, anon, authenticated;

grant execute on function public.admin_set_profile_account_status(uuid, uuid, text, text, inet, text)
to service_role;
grant execute on function public.admin_add_support_ticket_message(uuid, uuid, text, boolean, inet, text)
to service_role;
grant execute on function public.admin_triage_fraud_event(uuid, uuid, text, uuid, text, inet, text)
to service_role;
grant execute on function public.admin_update_platform_settings(uuid, text, text, text, text, text, boolean, boolean, boolean, text, inet, text)
to service_role;
