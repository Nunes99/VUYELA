-- FASE 16 secure platform administration.
-- Privileged mutations are server-only, transactional, and append an audit entry.

alter table public.businesses
  add column reviewed_at timestamptz,
  add column reviewed_by_profile_id uuid references public.profiles(id) on delete set null,
  add column review_note text;

create index businesses_reviewed_by_profile_id_idx
on public.businesses(reviewed_by_profile_id)
where reviewed_by_profile_id is not null;

alter table public.support_tickets
  add column description text,
  add column assigned_to_profile_id uuid references public.profiles(id) on delete set null,
  add column resolution_note text,
  add column resolved_at timestamptz,
  add constraint support_tickets_supported_status check (
    status in ('open', 'in_progress', 'resolved', 'closed')
  ),
  add constraint support_tickets_supported_priority check (
    priority in ('low', 'normal', 'high', 'urgent')
  ),
  add constraint support_tickets_resolution_consistent check (
    (status in ('resolved', 'closed') and resolved_at is not null)
    or (status in ('open', 'in_progress') and resolved_at is null)
  );

create index support_tickets_assigned_to_profile_id_idx
on public.support_tickets(assigned_to_profile_id)
where assigned_to_profile_id is not null;

create index support_tickets_priority_created_at_idx
on public.support_tickets(priority, created_at desc);

alter table public.fraud_events
  add column resolved_by_profile_id uuid references public.profiles(id) on delete set null,
  add column resolution_note text,
  add constraint fraud_events_resolution_consistent check (
    (resolved_at is null and resolved_by_profile_id is null)
    or (resolved_at is not null and resolved_by_profile_id is not null)
  );

create index fraud_events_resolved_by_profile_id_idx
on public.fraud_events(resolved_by_profile_id)
where resolved_by_profile_id is not null;

create index fraud_events_unresolved_severity_idx
on public.fraud_events(severity, created_at desc)
where resolved_at is null;

revoke insert on public.support_tickets from authenticated;
grant insert (business_id, profile_id, subject, description)
on public.support_tickets
to authenticated;

create or replace function public.assert_platform_actor(
  p_actor_profile_id uuid,
  p_allowed_roles public.profile_role[]
)
returns public.profile_role
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.profile_role;
begin
  select p.role
  into v_role
  from public.profiles p
  where p.id = p_actor_profile_id;

  if v_role is null or not (v_role = any(p_allowed_roles)) then
    raise exception 'Administrative permission denied';
  end if;

  return v_role;
end;
$$;

create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'audit_logs is append-only';
end;
$$;

create trigger audit_logs_prevent_mutation
before update or delete on public.audit_logs
for each row execute function public.prevent_audit_log_mutation();

create or replace function public.admin_get_platform_metrics(
  p_actor_profile_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_platform_actor(
    p_actor_profile_id,
    array['support_agent', 'platform_admin', 'super_admin']::public.profile_role[]
  );

  return jsonb_build_object(
    'totalBusinesses', (select count(*) from public.businesses),
    'pendingBusinesses', (
      select count(*) from public.businesses where status = 'pending_review'
    ),
    'activeBusinesses', (select count(*) from public.businesses where status = 'active'),
    'totalProfiles', (select count(*) from public.profiles),
    'activeSubscriptions', (
      select count(*)
      from public.subscriptions
      where status in ('trialing', 'active')
    ),
    'openSupportTickets', (
      select count(*)
      from public.support_tickets
      where status in ('open', 'in_progress')
    ),
    'unresolvedFraudEvents', (
      select count(*) from public.fraud_events where resolved_at is null
    ),
    'completedTransactions', (
      select count(*) from public.transactions where status = 'completed'
    ),
    'grossVolumeMznMinor', (
      select coalesce(sum(gross_amount_mzn_minor), 0)
      from public.transactions
      where status = 'completed'
    ),
    'pointsIssued', (
      select coalesce(sum(amount), 0)
      from public.point_ledger
      where amount > 0
    ),
    'businessesCreatedLast30Days', (
      select count(*)
      from public.businesses
      where created_at >= now() - interval '30 days'
    ),
    'transactionsLast30Days', (
      select count(*)
      from public.transactions
      where status = 'completed'
        and completed_at >= now() - interval '30 days'
    )
  );
end;
$$;

create or replace function public.admin_review_business(
  p_actor_profile_id uuid,
  p_business_id uuid,
  p_decision text,
  p_note text default null,
  p_ip_address inet default null,
  p_user_agent text default null
)
returns public.businesses
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.businesses;
  v_after public.businesses;
  v_new_status public.business_status;
begin
  perform public.assert_platform_actor(
    p_actor_profile_id,
    array['platform_admin', 'super_admin']::public.profile_role[]
  );

  select b.*
  into v_before
  from public.businesses b
  where b.id = p_business_id
  for update;

  if not found then
    raise exception 'Business not found';
  end if;

  if p_decision = 'approve' and v_before.status = 'pending_review' then
    v_new_status := 'active';
  elsif p_decision = 'reject' and v_before.status = 'pending_review' then
    v_new_status := 'draft';
  elsif p_decision = 'suspend' and v_before.status = 'active' then
    v_new_status := 'suspended';
  elsif p_decision = 'reactivate' and v_before.status = 'suspended' then
    v_new_status := 'active';
  else
    raise exception 'Invalid business review transition';
  end if;

  if p_decision in ('reject', 'suspend') and nullif(btrim(p_note), '') is null then
    raise exception 'A review note is required';
  end if;

  update public.businesses
  set status = v_new_status,
      reviewed_at = now(),
      reviewed_by_profile_id = p_actor_profile_id,
      review_note = nullif(left(btrim(p_note), 1000), ''),
      activated_at = case
        when v_new_status = 'active' then coalesce(activated_at, now())
        else activated_at
      end
  where id = p_business_id
  returning * into v_after;

  insert into public.audit_logs (
    business_id,
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data,
    ip_address,
    user_agent,
    context
  )
  values (
    p_business_id,
    p_actor_profile_id,
    case
      when p_decision = 'suspend' then 'suspension'::public.audit_action
      else 'update'::public.audit_action
    end,
    'businesses',
    p_business_id,
    jsonb_build_object('status', v_before.status),
    jsonb_build_object('status', v_after.status),
    p_ip_address,
    left(p_user_agent, 500),
    jsonb_build_object(
      'operation', 'business_review',
      'decision', p_decision,
      'note', nullif(left(btrim(p_note), 1000), '')
    )
  );

  return v_after;
end;
$$;

create or replace function public.admin_update_profile_role(
  p_actor_profile_id uuid,
  p_target_profile_id uuid,
  p_new_role text,
  p_note text,
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
  v_new_role public.profile_role;
  v_before public.profiles;
  v_after public.profiles;
begin
  v_actor_role := public.assert_platform_actor(
    p_actor_profile_id,
    array['platform_admin', 'super_admin']::public.profile_role[]
  );

  if p_actor_profile_id = p_target_profile_id then
    raise exception 'Administrators cannot change their own role';
  end if;

  if nullif(btrim(p_note), '') is null then
    raise exception 'A permission-change note is required';
  end if;

  begin
    v_new_role := p_new_role::public.profile_role;
  exception when invalid_text_representation then
    raise exception 'Unsupported profile role';
  end;

  select p.*
  into v_before
  from public.profiles p
  where p.id = p_target_profile_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_before.role = v_new_role then
    raise exception 'Profile already has this role';
  end if;

  if v_actor_role = 'platform_admin'
    and (
      v_before.role in ('platform_admin', 'super_admin')
      or v_new_role in ('platform_admin', 'super_admin')
    ) then
    raise exception 'Only a super admin can manage privileged platform roles';
  end if;

  if v_before.role = 'super_admin'
    and v_new_role <> 'super_admin'
    and (select count(*) from public.profiles where role = 'super_admin') <= 1 then
    raise exception 'The final super admin cannot be demoted';
  end if;

  update public.profiles
  set role = v_new_role
  where id = p_target_profile_id
  returning * into v_after;

  insert into public.audit_logs (
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data,
    ip_address,
    user_agent,
    context
  )
  values (
    p_actor_profile_id,
    'permission_change',
    'profiles',
    p_target_profile_id,
    jsonb_build_object('role', v_before.role),
    jsonb_build_object('role', v_after.role),
    p_ip_address,
    left(p_user_agent, 500),
    jsonb_build_object(
      'operation', 'profile_role_change',
      'note', left(btrim(p_note), 1000)
    )
  );

  return v_after;
end;
$$;

create or replace function public.admin_update_support_ticket(
  p_actor_profile_id uuid,
  p_ticket_id uuid,
  p_status text,
  p_priority text,
  p_assigned_to_profile_id uuid default null,
  p_resolution_note text default null,
  p_note text default null,
  p_ip_address inet default null,
  p_user_agent text default null
)
returns public.support_tickets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.support_tickets;
  v_after public.support_tickets;
begin
  perform public.assert_platform_actor(
    p_actor_profile_id,
    array['support_agent', 'platform_admin', 'super_admin']::public.profile_role[]
  );

  if p_status not in ('open', 'in_progress', 'resolved', 'closed')
    or p_priority not in ('low', 'normal', 'high', 'urgent') then
    raise exception 'Unsupported support state';
  end if;

  if p_status in ('resolved', 'closed')
    and nullif(btrim(p_resolution_note), '') is null then
    raise exception 'A resolution note is required';
  end if;

  if p_assigned_to_profile_id is not null
    and not exists (
      select 1
      from public.profiles p
      where p.id = p_assigned_to_profile_id
        and p.role in ('support_agent', 'platform_admin', 'super_admin')
    ) then
    raise exception 'Ticket assignee is not a platform operator';
  end if;

  select t.*
  into v_before
  from public.support_tickets t
  where t.id = p_ticket_id
  for update;

  if not found then
    raise exception 'Support ticket not found';
  end if;

  update public.support_tickets
  set status = p_status,
      priority = p_priority,
      assigned_to_profile_id = p_assigned_to_profile_id,
      resolution_note = case
        when p_status in ('resolved', 'closed')
          then left(btrim(p_resolution_note), 2000)
        else null
      end,
      resolved_at = case
        when p_status in ('resolved', 'closed') then coalesce(resolved_at, now())
        else null
      end
  where id = p_ticket_id
  returning * into v_after;

  insert into public.audit_logs (
    business_id,
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data,
    ip_address,
    user_agent,
    context
  )
  values (
    v_after.business_id,
    p_actor_profile_id,
    'update',
    'support_tickets',
    p_ticket_id,
    jsonb_build_object(
      'status', v_before.status,
      'priority', v_before.priority,
      'assignedToProfileId', v_before.assigned_to_profile_id
    ),
    jsonb_build_object(
      'status', v_after.status,
      'priority', v_after.priority,
      'assignedToProfileId', v_after.assigned_to_profile_id
    ),
    p_ip_address,
    left(p_user_agent, 500),
    jsonb_build_object(
      'operation', 'support_ticket_update',
      'note', nullif(left(btrim(p_note), 1000), '')
    )
  );

  return v_after;
end;
$$;

create or replace function public.admin_review_fraud_event(
  p_actor_profile_id uuid,
  p_fraud_event_id uuid,
  p_resolution text,
  p_note text,
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
begin
  perform public.assert_platform_actor(
    p_actor_profile_id,
    array['support_agent', 'platform_admin', 'super_admin']::public.profile_role[]
  );

  if p_resolution not in ('resolve', 'reopen') then
    raise exception 'Unsupported fraud review outcome';
  end if;

  if nullif(btrim(p_note), '') is null then
    raise exception 'A fraud review note is required';
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
  set resolved_at = case when p_resolution = 'resolve' then now() else null end,
      resolved_by_profile_id = case
        when p_resolution = 'resolve' then p_actor_profile_id
        else null
      end,
      resolution_note = case
        when p_resolution = 'resolve' then left(btrim(p_note), 2000)
        else null
      end
  where id = p_fraud_event_id
  returning * into v_after;

  insert into public.audit_logs (
    business_id,
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data,
    ip_address,
    user_agent,
    context
  )
  values (
    v_after.business_id,
    p_actor_profile_id,
    'update',
    'fraud_events',
    p_fraud_event_id,
    jsonb_build_object(
      'resolvedAt', v_before.resolved_at,
      'resolvedByProfileId', v_before.resolved_by_profile_id
    ),
    jsonb_build_object(
      'resolvedAt', v_after.resolved_at,
      'resolvedByProfileId', v_after.resolved_by_profile_id
    ),
    p_ip_address,
    left(p_user_agent, 500),
    jsonb_build_object(
      'operation', 'fraud_review',
      'resolution', p_resolution,
      'note', left(btrim(p_note), 2000)
    )
  );

  return v_after;
end;
$$;

revoke all privileges on function public.assert_platform_actor(uuid, public.profile_role[])
from public, anon, authenticated;
revoke all privileges on function public.prevent_audit_log_mutation()
from public, anon, authenticated;
revoke all privileges on function public.admin_get_platform_metrics(uuid)
from public, anon, authenticated;
revoke all privileges on function public.admin_review_business(uuid, uuid, text, text, inet, text)
from public, anon, authenticated;
revoke all privileges on function public.admin_update_profile_role(uuid, uuid, text, text, inet, text)
from public, anon, authenticated;
revoke all privileges on function public.admin_update_support_ticket(uuid, uuid, text, text, uuid, text, text, inet, text)
from public, anon, authenticated;
revoke all privileges on function public.admin_review_fraud_event(uuid, uuid, text, text, inet, text)
from public, anon, authenticated;

grant execute on function public.admin_get_platform_metrics(uuid) to service_role;
grant execute on function public.admin_review_business(uuid, uuid, text, text, inet, text)
to service_role;
grant execute on function public.admin_update_profile_role(uuid, uuid, text, text, inet, text)
to service_role;
grant execute on function public.admin_update_support_ticket(uuid, uuid, text, text, uuid, text, text, inet, text)
to service_role;
grant execute on function public.admin_review_fraud_event(uuid, uuid, text, text, inet, text)
to service_role;
