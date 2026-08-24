-- Security boundary for the NEW PHAS operational foundation.
-- Provider writes, payment reconciliation, offer redemption and privileged
-- administration remain service-side operations introduced by later phases.

create or replace function public.can_access_pos_terminal(target_terminal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.pos_terminals pt
    where pt.id = target_terminal_id
      and pt.status <> 'revoked'
      and public.can_access_transaction(pt.business_id, pt.branch_id)
  );
$$;

create or replace function public.can_access_support_ticket(target_ticket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.support_tickets st
    where st.id = target_ticket_id
      and (
        st.profile_id = (select auth.uid())
        or (
          st.business_id is not null
          and public.can_manage_business(st.business_id)
        )
      )
  );
$$;

create or replace function public.enforce_business_catalog_item_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    new.created_by := (select auth.uid());
  end if;

  return new;
end;
$$;

create trigger business_catalog_items_enforce_actor
before insert on public.business_catalog_items
for each row execute function public.enforce_business_catalog_item_actor();

create or replace function public.enforce_support_ticket_message_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket_business_id uuid;
  v_ticket_profile_id uuid;
begin
  select st.business_id, st.profile_id
  into v_ticket_business_id, v_ticket_profile_id
  from public.support_tickets st
  where st.id = new.ticket_id;

  if not found then
    raise exception 'Support ticket not found';
  end if;

  if new.business_id is distinct from v_ticket_business_id then
    raise exception 'Support message business scope mismatch';
  end if;

  if new.author_type = 'requester' then
    if new.author_profile_id is distinct from v_ticket_profile_id or new.is_internal then
      raise exception 'Requester message identity mismatch';
    end if;
  elsif new.author_type = 'operator' and new.author_profile_id is null then
    raise exception 'Operator identity is required';
  elsif new.author_type = 'system' and new.author_profile_id is not null then
    raise exception 'System messages cannot impersonate a profile';
  end if;

  return new;
end;
$$;

create trigger support_ticket_messages_enforce_scope
before insert or update of ticket_id, business_id, author_profile_id, author_type, is_internal
on public.support_ticket_messages
for each row execute function public.enforce_support_ticket_message_scope();

create or replace function public.get_pos_terminal_configuration(p_terminal_id uuid)
returns table (
  terminal jsonb,
  terminal_settings jsonb,
  devices jsonb,
  payment_channels jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_terminal public.pos_terminals;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  if not public.can_access_pos_terminal(p_terminal_id) then
    raise exception 'Not authorized to access this POS terminal';
  end if;

  select pt.*
  into v_terminal
  from public.pos_terminals pt
  where pt.id = p_terminal_id;

  if not found then
    raise exception 'POS terminal not found';
  end if;

  return query
  select
    jsonb_build_object(
      'id', v_terminal.id,
      'businessId', v_terminal.business_id,
      'branchId', v_terminal.branch_id,
      'code', v_terminal.code,
      'name', v_terminal.name,
      'status', v_terminal.status,
      'lastSeenAt', v_terminal.last_seen_at
    ),
    coalesce(
      (
        select jsonb_build_object(
          'locale', pts.locale,
          'currency', pts.currency,
          'timezone', pts.timezone,
          'requireCustomerAuthorization', pts.require_customer_authorization,
          'printReceiptAutomatically', pts.print_receipt_automatically,
          'showPointsBalance', pts.show_points_balance,
          'showMznEquivalent', pts.show_mzn_equivalent,
          'inactivityTimeoutMinutes', pts.inactivity_timeout_minutes,
          'allowedLookupMethods', pts.allowed_lookup_methods,
          'settings', pts.settings
        )
        from public.pos_terminal_settings pts
        where pts.terminal_id = v_terminal.id
      ),
      '{}'::jsonb
    ),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', ptd.id,
            'type', ptd.device_type,
            'label', ptd.label,
            'status', ptd.status,
            'capabilities', ptd.capabilities,
            'lastSeenAt', ptd.last_seen_at
          )
          order by ptd.created_at
        )
        from public.pos_terminal_devices ptd
        where ptd.terminal_id = v_terminal.id
      ),
      '[]'::jsonb
    ),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', bpc.id,
            'method', bpc.method,
            'mode', bpc.mode,
            'status', bpc.status,
            'provider', bpc.provider_key,
            'maskedIdentifier', bpc.masked_identifier,
            'credentialsConfigured', bpc.credentials_configured_at is not null,
            'settings', bpc.public_settings
          )
          order by bpc.method
        )
        from public.business_payment_channels bpc
        where bpc.business_id = v_terminal.business_id
          and (bpc.branch_id is null or bpc.branch_id = v_terminal.branch_id)
      ),
      '[]'::jsonb
    );
end;
$$;

revoke all on function public.can_access_pos_terminal(uuid) from public, anon;
grant execute on function public.can_access_pos_terminal(uuid) to authenticated;

revoke all on function public.can_access_support_ticket(uuid) from public, anon;
grant execute on function public.can_access_support_ticket(uuid) to authenticated;

revoke all on function public.enforce_business_catalog_item_actor() from public, anon, authenticated;

revoke all on function public.enforce_support_ticket_message_scope() from public, anon, authenticated;

revoke all on function public.get_pos_terminal_configuration(uuid) from public, anon;
grant execute on function public.get_pos_terminal_configuration(uuid) to authenticated;

alter table public.business_catalog_items enable row level security;
alter table public.pos_terminals enable row level security;
alter table public.pos_terminal_settings enable row level security;
alter table public.pos_terminal_devices enable row level security;
alter table public.business_payment_channels enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.business_member_invitations enable row level security;
alter table public.customer_business_preferences enable row level security;
alter table public.offer_claims enable row level security;
alter table public.support_ticket_messages enable row level security;
alter table public.platform_settings enable row level security;

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

grant update (date_of_birth) on public.profiles to authenticated;

create policy business_catalog_items_member_select
on public.business_catalog_items
for select
to authenticated
using (
  public.is_business_member(business_id)
  and (branch_id is null or public.can_access_branch(business_id, branch_id))
);

create policy business_catalog_items_manager_insert
on public.business_catalog_items
for insert
to authenticated
with check (public.can_manage_business(business_id));

create policy business_catalog_items_manager_update
on public.business_catalog_items
for update
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

create policy business_catalog_items_manager_delete
on public.business_catalog_items
for delete
to authenticated
using (public.can_manage_business(business_id));

create policy pos_terminals_member_select
on public.pos_terminals
for select
to authenticated
using (public.can_access_pos_terminal(id));

create policy pos_terminal_settings_member_select
on public.pos_terminal_settings
for select
to authenticated
using (public.can_access_pos_terminal(terminal_id));

create policy pos_terminal_devices_member_select
on public.pos_terminal_devices
for select
to authenticated
using (public.can_access_pos_terminal(terminal_id));

create policy business_payment_channels_member_select
on public.business_payment_channels
for select
to authenticated
using (
  public.is_business_member(business_id)
  and (branch_id is null or public.can_access_branch(business_id, branch_id))
);

create policy payment_attempts_operator_select
on public.payment_attempts
for select
to authenticated
using (public.can_access_transaction(business_id, branch_id));

create policy business_member_invitations_manager_select
on public.business_member_invitations
for select
to authenticated
using (public.can_manage_business(business_id));

create policy customer_business_preferences_select_own
on public.customer_business_preferences
for select
to authenticated
using (profile_id = (select auth.uid()));

create policy customer_business_preferences_insert_own
on public.customer_business_preferences
for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  and exists (
    select 1
    from public.customer_cards cc
    where cc.business_id = customer_business_preferences.business_id
      and cc.customer_profile_id = (select auth.uid())
      and cc.status = 'active'
  )
);

create policy customer_business_preferences_update_own
on public.customer_business_preferences
for update
to authenticated
using (profile_id = (select auth.uid()))
with check (
  profile_id = (select auth.uid())
  and exists (
    select 1
    from public.customer_cards cc
    where cc.business_id = customer_business_preferences.business_id
      and cc.customer_profile_id = (select auth.uid())
      and cc.status = 'active'
  )
);

create policy customer_business_preferences_delete_own
on public.customer_business_preferences
for delete
to authenticated
using (profile_id = (select auth.uid()));

create policy offer_claims_customer_or_manager_select
on public.offer_claims
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or public.can_manage_customers(business_id)
);

create policy support_ticket_messages_participant_select
on public.support_ticket_messages
for select
to authenticated
using (
  public.can_access_support_ticket(ticket_id)
  and (
    not is_internal
    or (
      business_id is not null
      and public.can_manage_business(business_id)
    )
  )
);

create policy support_ticket_messages_participant_insert
on public.support_ticket_messages
for insert
to authenticated
with check (
  (
    author_type = 'requester'
    and author_profile_id = (select auth.uid())
    and not is_internal
    and delivery_status = 'queued'
    and exists (
      select 1
      from public.support_tickets st
      where st.id = support_ticket_messages.ticket_id
        and st.profile_id = (select auth.uid())
        and st.business_id is not distinct from support_ticket_messages.business_id
    )
  )
  or (
    author_type = 'operator'
    and author_profile_id = (select auth.uid())
    and business_id is not null
    and public.can_manage_business(business_id)
    and exists (
      select 1
      from public.support_tickets st
      where st.id = support_ticket_messages.ticket_id
        and st.business_id = support_ticket_messages.business_id
    )
  )
);

comment on function public.get_pos_terminal_configuration(uuid) is
  'Returns browser-safe terminal configuration after tenant and branch authorization.';
comment on table public.platform_settings is
  'No authenticated policy is intentional; platform settings use audited service-role operations.';
