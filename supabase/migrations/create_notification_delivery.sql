-- FASE 14 notification delivery foundation.
-- Campaign audience inserts create channel-specific, idempotent delivery records.

alter type public.notification_channel add value if not exists 'push';

alter table public.notifications
  add column campaign_id uuid,
  add column idempotency_key text,
  add column attempt_count integer not null default 0,
  add column max_attempts integer not null default 5,
  add column next_attempt_at timestamptz,
  add column last_attempt_at timestamptz,
  add column delivered_at timestamptz,
  add column failed_at timestamptz,
  add column read_at timestamptz,
  add column locked_at timestamptz,
  add column lock_token uuid,
  add column provider_message_id text,
  add column last_error text,
  add constraint notifications_campaign_business_fk foreign key (campaign_id, business_id)
    references public.campaigns(id, business_id)
    on delete cascade,
  add constraint notifications_campaign_requires_business check (
    campaign_id is null
    or business_id is not null
  ),
  add constraint notifications_idempotency_key_length check (
    idempotency_key is null
    or length(idempotency_key) between 1 and 256
  ),
  add constraint notifications_attempt_count_valid check (attempt_count >= 0),
  add constraint notifications_max_attempts_valid check (max_attempts between 1 and 20),
  add constraint notifications_metadata_object check (jsonb_typeof(metadata) = 'object');

update public.notifications
set next_attempt_at = coalesce(scheduled_at, created_at)
where next_attempt_at is null;

alter table public.notifications
  alter column next_attempt_at set default now(),
  alter column next_attempt_at set not null;

create unique index notifications_idempotency_key_unique_idx
on public.notifications(idempotency_key)
where idempotency_key is not null;

create index notifications_delivery_queue_idx
on public.notifications(next_attempt_at, created_at)
where status = 'queued';

create index notifications_campaign_id_idx
on public.notifications(campaign_id)
where campaign_id is not null;

create index notifications_profile_unread_idx
on public.notifications(profile_id, created_at desc)
where channel = 'in_app' and read_at is null and status in ('sent', 'delivered');

create or replace function public.queue_campaign_audience_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign public.campaigns%rowtype;
  v_profile_id uuid;
  v_email text;
  v_marketing_consent_at timestamptz;
  v_channel text;
  v_subject text;
  v_body text;
  v_scheduled_at timestamptz;
  v_status public.notification_status;
  v_last_error text;
begin
  select c.*
  into v_campaign
  from public.campaigns c
  where c.id = new.campaign_id
    and c.business_id = new.business_id;

  if not found or new.customer_card_id is null then
    return new;
  end if;

  if v_campaign.status in ('draft', 'paused', 'completed', 'cancelled') then
    return new;
  end if;

  v_channel := coalesce(nullif(v_campaign.rules ->> 'plannedChannel', ''), 'in_app');

  if v_channel not in ('in_app', 'email') then
    return new;
  end if;

  select
    cc.customer_profile_id,
    p.email::text,
    p.marketing_consent_at
  into
    v_profile_id,
    v_email,
    v_marketing_consent_at
  from public.customer_cards cc
  left join public.profiles p on p.id = cc.customer_profile_id
  where cc.id = new.customer_card_id
    and cc.business_id = new.business_id;

  v_subject := left(
    coalesce(nullif(trim(v_campaign.rules ->> 'notificationSubject'), ''), v_campaign.name),
    120
  );
  v_body := left(
    coalesce(
      nullif(trim(v_campaign.rules ->> 'notificationBody'), ''),
      concat('Tem uma nova campanha VUYELA: ', v_campaign.name, '.')
    ),
    2000
  );
  v_scheduled_at := greatest(coalesce(v_campaign.starts_at, now()), now());
  v_status := 'queued';
  v_last_error := null;

  if v_campaign.ends_at is not null and v_campaign.ends_at <= now() then
    v_status := 'cancelled';
    v_last_error := 'campaign_expired';
  elsif v_channel = 'email' and v_marketing_consent_at is null then
    v_status := 'cancelled';
    v_last_error := 'marketing_consent_missing';
  elsif v_channel = 'email' and nullif(trim(coalesce(v_email, '')), '') is null then
    v_status := 'cancelled';
    v_last_error := 'recipient_email_missing';
  elsif v_channel = 'in_app' and v_scheduled_at <= now() then
    v_status := 'delivered';
  end if;

  insert into public.notifications (
    business_id,
    profile_id,
    customer_card_id,
    campaign_id,
    channel,
    status,
    subject,
    body,
    scheduled_at,
    sent_at,
    delivered_at,
    idempotency_key,
    next_attempt_at,
    last_error,
    metadata
  )
  values (
    new.business_id,
    v_profile_id,
    new.customer_card_id,
    new.campaign_id,
    v_channel::public.notification_channel,
    v_status,
    v_subject,
    v_body,
    v_scheduled_at,
    case when v_status = 'delivered' then now() else null end,
    case when v_status = 'delivered' then now() else null end,
    concat(
      'campaign:', new.campaign_id::text,
      ':card:', new.customer_card_id::text,
      ':channel:', v_channel
    ),
    v_scheduled_at,
    v_last_error,
    jsonb_build_object(
      'source', 'campaign',
      'campaignId', new.campaign_id::text,
      'segmentKey', new.segment_key
    )
  )
  on conflict (idempotency_key) where idempotency_key is not null do nothing;

  return new;
end;
$$;

create trigger campaign_audiences_queue_notification
after insert on public.campaign_audiences
for each row execute function public.queue_campaign_audience_notification();

create or replace function public.mark_notification_read(
  p_notification_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_read_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.notifications n
  set read_at = coalesce(n.read_at, now())
  where n.id = p_notification_id
    and n.channel = 'in_app'
    and n.status in ('sent', 'delivered')
    and (
      n.profile_id = auth.uid()
      or public.owns_customer_card(n.customer_card_id)
    )
  returning n.read_at into v_read_at;

  if v_read_at is null then
    raise exception 'Notification not found or not accessible';
  end if;

  return v_read_at;
end;
$$;

create or replace function public.claim_notification_deliveries(
  p_limit integer default 25,
  p_lock_token uuid default gen_random_uuid()
)
returns table (
  id uuid,
  channel text,
  subject text,
  body text,
  idempotency_key text,
  attempt_count integer,
  max_attempts integer,
  recipient_email text,
  business_name text,
  metadata jsonb,
  lock_token uuid
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select n.id
    from public.notifications n
    where n.status = 'queued'
      and n.next_attempt_at <= now()
      and (n.locked_at is null or n.locked_at < now() - interval '5 minutes')
    order by n.next_attempt_at asc, n.created_at asc
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 25), 100))
  ),
  claimed as (
    update public.notifications n
    set
      attempt_count = n.attempt_count + 1,
      last_attempt_at = now(),
      locked_at = now(),
      lock_token = p_lock_token
    from candidates c
    where n.id = c.id
    returning n.*
  )
  select
    c.id,
    c.channel::text,
    c.subject,
    c.body,
    c.idempotency_key,
    c.attempt_count,
    c.max_attempts,
    p.email::text,
    b.name,
    c.metadata,
    c.lock_token
  from claimed c
  left join public.profiles p on p.id = c.profile_id
  left join public.businesses b on b.id = c.business_id;
end;
$$;

create or replace function public.get_business_campaigns(
  p_business_id uuid
)
returns table (
  campaigns jsonb,
  analytics jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_business_id is null then
    raise exception 'Missing campaign business scope';
  end if;

  if not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to read business campaigns';
  end if;

  return query
  with campaign_rows as (
    select
      c.id,
      c.business_id,
      c.name,
      c.status,
      c.campaign_type,
      c.starts_at,
      c.ends_at,
      c.rules,
      c.audience,
      c.created_at,
      count(ca.id)::integer as audience_count,
      count(ca.id) filter (where p.marketing_consent_at is not null)::integer as consented_audience_count,
      coalesce(ns.notification_count, 0)::integer as notification_count,
      coalesce(ns.queued_count, 0)::integer as queued_notification_count,
      coalesce(ns.delivered_count, 0)::integer as delivered_notification_count,
      coalesce(ns.failed_count, 0)::integer as failed_notification_count
    from public.campaigns c
    left join public.campaign_audiences ca
      on ca.campaign_id = c.id
      and ca.business_id = c.business_id
    left join public.customer_cards cc
      on cc.id = ca.customer_card_id
      and cc.business_id = ca.business_id
    left join public.profiles p on p.id = cc.customer_profile_id
    left join lateral (
      select
        count(n.id)::integer as notification_count,
        count(n.id) filter (where n.status = 'queued')::integer as queued_count,
        count(n.id) filter (where n.status in ('sent', 'delivered'))::integer as delivered_count,
        count(n.id) filter (where n.status in ('failed', 'cancelled'))::integer as failed_count
      from public.notifications n
      where n.campaign_id = c.id
        and n.business_id = c.business_id
    ) ns on true
    where c.business_id = p_business_id
    group by
      c.id,
      ns.notification_count,
      ns.queued_count,
      ns.delivered_count,
      ns.failed_count
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', cr.id::text,
          'businessId', cr.business_id::text,
          'name', cr.name,
          'status', cr.status::text,
          'campaignType', cr.campaign_type,
          'startsAt', cr.starts_at::text,
          'endsAt', cr.ends_at::text,
          'rules', cr.rules,
          'audience', cr.audience,
          'audienceCount', cr.audience_count,
          'consentedAudienceCount', cr.consented_audience_count,
          'notificationCount', cr.notification_count,
          'queuedNotificationCount', cr.queued_notification_count,
          'deliveredNotificationCount', cr.delivered_notification_count,
          'failedNotificationCount', cr.failed_notification_count,
          'createdAt', cr.created_at::text
        )
        order by cr.created_at desc
      ),
      '[]'::jsonb
    ) as campaigns,
    jsonb_build_object(
      'totalCampaigns', count(cr.id)::integer,
      'draftCampaigns', count(cr.id) filter (where cr.status = 'draft')::integer,
      'scheduledCampaigns', count(cr.id) filter (where cr.status = 'scheduled')::integer,
      'activeCampaigns', count(cr.id) filter (where cr.status = 'active')::integer,
      'completedCampaigns', count(cr.id) filter (where cr.status = 'completed')::integer,
      'totalAudienceCount', coalesce(sum(cr.audience_count), 0)::integer,
      'consentedAudienceCount', coalesce(sum(cr.consented_audience_count), 0)::integer,
      'averageAudienceCount', case
        when count(cr.id) = 0 then 0
        else round(coalesce(sum(cr.audience_count), 0)::numeric / count(cr.id))::integer
      end,
      'consentCoverageRate', case
        when coalesce(sum(cr.audience_count), 0) = 0 then 0
        else coalesce(sum(cr.consented_audience_count), 0)::numeric / sum(cr.audience_count)
      end,
      'notificationCount', coalesce(sum(cr.notification_count), 0)::integer,
      'queuedNotificationCount', coalesce(sum(cr.queued_notification_count), 0)::integer,
      'deliveredNotificationCount', coalesce(sum(cr.delivered_notification_count), 0)::integer,
      'failedNotificationCount', coalesce(sum(cr.failed_notification_count), 0)::integer
    ) as analytics
  from campaign_rows cr;
end;
$$;

revoke all on function public.queue_campaign_audience_notification() from public, anon, authenticated;
revoke all on function public.mark_notification_read(uuid) from public, anon;
revoke all on function public.claim_notification_deliveries(integer, uuid) from public, anon, authenticated;

grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.claim_notification_deliveries(integer, uuid) to service_role;
