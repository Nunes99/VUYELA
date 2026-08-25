-- FASE 28: persistent POS configuration and reconciled manual payments.
-- Mobile-money providers remain unavailable until server-side credentials exist.

insert into public.pos_terminals (
  business_id,
  branch_id,
  code,
  name,
  status,
  activated_at,
  metadata
)
select
  br.business_id,
  br.id,
  'POS-' || upper(substr(replace(br.id::text, '-', ''), 1, 8)),
  case when br.is_primary then 'POS Principal' else 'POS ' || left(br.name, 80) end,
  'active',
  now(),
  jsonb_build_object('provisioned_by', 'phase_28')
from public.branches br
where br.is_active
  and not exists (
    select 1
    from public.pos_terminals pt
    where pt.business_id = br.business_id
      and pt.branch_id = br.id
      and pt.status <> 'revoked'
  );

insert into public.pos_terminal_settings (terminal_id, business_id)
select pt.id, pt.business_id
from public.pos_terminals pt
where not exists (
  select 1
  from public.pos_terminal_settings pts
  where pts.terminal_id = pt.id
);

insert into public.business_payment_channels (
  business_id,
  branch_id,
  method,
  mode,
  status,
  provider_key,
  public_settings
)
select
  br.business_id,
  br.id,
  methods.method,
  case
    when methods.method in ('cash'::public.transaction_payment_method, 'card'::public.transaction_payment_method)
      then 'manual'::public.payment_channel_mode
    else 'provider'::public.payment_channel_mode
  end,
  case
    when methods.method in ('cash'::public.transaction_payment_method, 'card'::public.transaction_payment_method)
      then 'active'::public.payment_channel_status
    else 'unconfigured'::public.payment_channel_status
  end,
  case
    when methods.method in ('cash'::public.transaction_payment_method, 'card'::public.transaction_payment_method)
      then null
    else methods.method::text
  end,
  case
    when methods.method = 'card'::public.transaction_payment_method
      then jsonb_build_object('requires_external_reference', true)
    else '{}'::jsonb
  end
from public.branches br
cross join (
  values
    ('cash'::public.transaction_payment_method),
    ('card'::public.transaction_payment_method),
    ('mpesa'::public.transaction_payment_method),
    ('emola'::public.transaction_payment_method),
    ('mkesh'::public.transaction_payment_method)
) as methods(method)
where br.is_active
  and not exists (
    select 1
    from public.business_payment_channels bpc
    where bpc.business_id = br.business_id
      and bpc.branch_id = br.id
      and bpc.method = methods.method
  );

create or replace function public.get_pos_operations(p_business_id uuid)
returns table (
  terminals jsonb,
  payment_channels jsonb,
  catalog_items jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_business_id is null
    or (select auth.uid()) is null
    or not public.is_business_member(p_business_id)
  then
    raise exception 'Not authorized to access POS operations';
  end if;

  return query
  select
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pt.id::text,
          'businessId', pt.business_id::text,
          'branchId', pt.branch_id::text,
          'code', pt.code,
          'name', pt.name,
          'status', pt.status::text,
          'lastSeenAt', pt.last_seen_at::text,
          'settings', coalesce((
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
            where pts.terminal_id = pt.id
          ), '{}'::jsonb),
          'devices', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', ptd.id::text,
                'type', ptd.device_type::text,
                'label', ptd.label,
                'deviceReference', ptd.device_reference,
                'status', ptd.status::text,
                'capabilities', ptd.capabilities,
                'lastSeenAt', ptd.last_seen_at::text
              )
              order by ptd.created_at
            )
            from public.pos_terminal_devices ptd
            where ptd.terminal_id = pt.id
          ), '[]'::jsonb)
        )
        order by
          case pt.status when 'active' then 0 when 'provisioning' then 1 when 'suspended' then 2 else 3 end,
          pt.name
      )
      from public.pos_terminals pt
      where pt.business_id = p_business_id
        and public.can_access_transaction(pt.business_id, pt.branch_id)
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', bpc.id::text,
          'businessId', bpc.business_id::text,
          'branchId', bpc.branch_id::text,
          'method', bpc.method::text,
          'mode', bpc.mode::text,
          'status', bpc.status::text,
          'providerKey', bpc.provider_key,
          'maskedIdentifier', bpc.masked_identifier,
          'credentialsConfigured', bpc.credentials_configured_at is not null,
          'publicSettings', bpc.public_settings
        )
        order by bpc.branch_id nulls first, bpc.method
      )
      from public.business_payment_channels bpc
      where bpc.business_id = p_business_id
        and (
          bpc.branch_id is null
          or public.can_access_transaction(bpc.business_id, bpc.branch_id)
        )
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', bci.id::text,
          'branchId', bci.branch_id::text,
          'kind', bci.kind::text,
          'sku', bci.sku,
          'name', bci.name,
          'description', bci.description,
          'priceMznMinor', bci.price_mzn_minor,
          'sortOrder', bci.sort_order
        )
        order by bci.sort_order, bci.name
      )
      from public.business_catalog_items bci
      where bci.business_id = p_business_id
        and bci.is_available
        and (
          bci.branch_id is null
          or public.can_access_transaction(bci.business_id, bci.branch_id)
        )
    ), '[]'::jsonb);
end;
$$;

create or replace function public.manage_pos_terminal(
  p_business_id uuid,
  p_terminal_id uuid,
  p_action text,
  p_branch_id uuid default null,
  p_name text default null,
  p_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_terminal public.pos_terminals;
  v_terminal_id uuid;
  v_code text;
begin
  if p_business_id is null or v_actor is null or not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to manage POS terminals';
  end if;

  if p_action = 'create' then
    if p_branch_id is null
      or not exists (
        select 1 from public.branches br
        where br.id = p_branch_id and br.business_id = p_business_id and br.is_active
      )
    then
      raise exception 'An active branch is required';
    end if;
    if char_length(btrim(coalesce(p_name, ''))) not between 2 and 100 then
      raise exception 'Invalid terminal name';
    end if;

    v_code := upper(coalesce(nullif(btrim(p_code), ''), 'POS-' || substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 8)));
    insert into public.pos_terminals (
      business_id, branch_id, code, name, status, registered_by
    ) values (
      p_business_id, p_branch_id, v_code, btrim(p_name), 'provisioning', v_actor
    ) returning id into v_terminal_id;

    insert into public.pos_terminal_settings (terminal_id, business_id)
    values (v_terminal_id, p_business_id);
  else
    select pt.* into v_terminal
    from public.pos_terminals pt
    where pt.id = p_terminal_id and pt.business_id = p_business_id
    for update;

    if not found then raise exception 'POS terminal not found'; end if;
    v_terminal_id := v_terminal.id;

    if p_action = 'update' then
      if char_length(btrim(coalesce(p_name, ''))) not between 2 and 100 then
        raise exception 'Invalid terminal name';
      end if;
      if p_branch_id is null
        or not exists (
          select 1 from public.branches br
          where br.id = p_branch_id and br.business_id = p_business_id and br.is_active
        )
      then
        raise exception 'An active branch is required';
      end if;
      update public.pos_terminals
      set branch_id = p_branch_id, name = btrim(p_name)
      where id = v_terminal.id;
    elsif p_action = 'activate' then
      update public.pos_terminals
      set status = 'active', activated_at = coalesce(activated_at, now()), suspended_at = null
      where id = v_terminal.id and status <> 'revoked';
    elsif p_action = 'suspend' then
      update public.pos_terminals
      set status = 'suspended', suspended_at = now()
      where id = v_terminal.id and status = 'active';
    elsif p_action = 'revoke' then
      update public.pos_terminals
      set status = 'revoked', revoked_at = now()
      where id = v_terminal.id and status <> 'revoked';
    else
      raise exception 'Unsupported POS terminal action';
    end if;
  end if;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, before_data, after_data, context
  ) values (
    p_business_id,
    v_actor,
    case when p_action = 'create' then 'create'::public.audit_action else 'update'::public.audit_action end,
    'pos_terminals',
    v_terminal_id,
    case when p_action = 'create' then null else to_jsonb(v_terminal) end,
    (select to_jsonb(pt) from public.pos_terminals pt where pt.id = v_terminal_id),
    jsonb_build_object('source', 'pos_settings', 'operation', p_action)
  );

  return v_terminal_id;
end;
$$;

create or replace function public.update_pos_terminal_settings(
  p_business_id uuid,
  p_terminal_id uuid,
  p_require_customer_authorization boolean,
  p_print_receipt_automatically boolean,
  p_show_points_balance boolean,
  p_show_mzn_equivalent boolean,
  p_inactivity_timeout_minutes integer,
  p_allowed_lookup_methods text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_before public.pos_terminal_settings;
begin
  if p_business_id is null or v_actor is null or not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to update POS settings';
  end if;
  if not exists (
    select 1 from public.pos_terminals pt
    where pt.id = p_terminal_id and pt.business_id = p_business_id and pt.status <> 'revoked'
  ) then
    raise exception 'POS terminal not found';
  end if;
  if p_inactivity_timeout_minutes not between 5 and 480
    or cardinality(p_allowed_lookup_methods) = 0
    or not (p_allowed_lookup_methods <@ array['qr', 'card', 'phone']::text[])
  then
    raise exception 'Invalid POS settings';
  end if;

  select pts.* into v_before
  from public.pos_terminal_settings pts
  where pts.terminal_id = p_terminal_id;

  insert into public.pos_terminal_settings (
    terminal_id,
    business_id,
    require_customer_authorization,
    print_receipt_automatically,
    show_points_balance,
    show_mzn_equivalent,
    inactivity_timeout_minutes,
    allowed_lookup_methods
  ) values (
    p_terminal_id,
    p_business_id,
    coalesce(p_require_customer_authorization, true),
    coalesce(p_print_receipt_automatically, false),
    coalesce(p_show_points_balance, true),
    coalesce(p_show_mzn_equivalent, true),
    p_inactivity_timeout_minutes,
    p_allowed_lookup_methods
  )
  on conflict (terminal_id) do update set
    require_customer_authorization = excluded.require_customer_authorization,
    print_receipt_automatically = excluded.print_receipt_automatically,
    show_points_balance = excluded.show_points_balance,
    show_mzn_equivalent = excluded.show_mzn_equivalent,
    inactivity_timeout_minutes = excluded.inactivity_timeout_minutes,
    allowed_lookup_methods = excluded.allowed_lookup_methods;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, before_data, after_data, context
  ) values (
    p_business_id,
    v_actor,
    'update',
    'pos_terminal_settings',
    p_terminal_id,
    to_jsonb(v_before),
    (select to_jsonb(pts) from public.pos_terminal_settings pts where pts.terminal_id = p_terminal_id),
    jsonb_build_object('source', 'pos_settings')
  );
end;
$$;

create or replace function public.manage_pos_terminal_device(
  p_business_id uuid,
  p_terminal_id uuid,
  p_device_id uuid,
  p_action text,
  p_device_type public.pos_device_type default 'other',
  p_label text default null,
  p_device_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_device public.pos_terminal_devices;
  v_device_id uuid;
begin
  if p_business_id is null or v_actor is null or not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to manage POS devices';
  end if;
  if not exists (
    select 1 from public.pos_terminals pt
    where pt.id = p_terminal_id and pt.business_id = p_business_id and pt.status <> 'revoked'
  ) then
    raise exception 'POS terminal not found';
  end if;

  if p_action = 'create' then
    if char_length(btrim(coalesce(p_label, ''))) not between 2 and 100
      or char_length(btrim(coalesce(p_device_reference, ''))) not between 8 and 200
    then
      raise exception 'Invalid POS device details';
    end if;
    insert into public.pos_terminal_devices (
      terminal_id, business_id, device_type, label, device_reference, status
    ) values (
      p_terminal_id, p_business_id, p_device_type, btrim(p_label), btrim(p_device_reference), 'pending'
    ) returning id into v_device_id;
  else
    select ptd.* into v_device
    from public.pos_terminal_devices ptd
    where ptd.id = p_device_id
      and ptd.terminal_id = p_terminal_id
      and ptd.business_id = p_business_id
    for update;
    if not found then raise exception 'POS device not found'; end if;
    v_device_id := v_device.id;

    if p_action = 'update' then
      if char_length(btrim(coalesce(p_label, ''))) not between 2 and 100 then
        raise exception 'Invalid POS device label';
      end if;
      update public.pos_terminal_devices
      set device_type = p_device_type, label = btrim(p_label)
      where id = v_device.id;
    elsif p_action = 'activate' then
      update public.pos_terminal_devices
      set status = 'active', activated_at = coalesce(activated_at, now()), revoked_at = null
      where id = v_device.id and status <> 'revoked';
    elsif p_action = 'revoke' then
      update public.pos_terminal_devices
      set status = 'revoked', revoked_at = now()
      where id = v_device.id;
    elsif p_action = 'delete' then
      delete from public.pos_terminal_devices where id = v_device.id and status <> 'active';
    else
      raise exception 'Unsupported POS device action';
    end if;
  end if;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, before_data, after_data, context
  ) values (
    p_business_id,
    v_actor,
    case when p_action = 'create' then 'create'::public.audit_action
      when p_action = 'delete' then 'delete'::public.audit_action
      else 'update'::public.audit_action end,
    'pos_terminal_devices',
    v_device_id,
    case when p_action = 'create' then null else to_jsonb(v_device) end,
    (select to_jsonb(ptd) from public.pos_terminal_devices ptd where ptd.id = v_device_id),
    jsonb_build_object('source', 'pos_settings', 'operation', p_action)
  );

  return v_device_id;
end;
$$;

create or replace function public.manage_business_payment_channel(
  p_business_id uuid,
  p_channel_id uuid,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_channel public.business_payment_channels;
begin
  if p_business_id is null or v_actor is null or not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to manage payment channels';
  end if;

  select bpc.* into v_channel
  from public.business_payment_channels bpc
  where bpc.id = p_channel_id and bpc.business_id = p_business_id
  for update;
  if not found then raise exception 'Payment channel not found'; end if;

  if p_action = 'activate' then
    if v_channel.mode = 'provider' and v_channel.credentials_configured_at is null then
      raise exception 'Provider credentials are required before activation';
    end if;
    update public.business_payment_channels set status = 'active' where id = v_channel.id;
  elsif p_action = 'suspend' then
    update public.business_payment_channels set status = 'suspended' where id = v_channel.id;
  else
    raise exception 'Unsupported payment channel action';
  end if;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, before_data, after_data, context
  ) values (
    p_business_id,
    v_actor,
    'update',
    'business_payment_channels',
    v_channel.id,
    to_jsonb(v_channel),
    (select to_jsonb(bpc) from public.business_payment_channels bpc where bpc.id = v_channel.id),
    jsonb_build_object('source', 'pos_payment_settings', 'operation', p_action)
  );
end;
$$;

create or replace function public.confirm_pos_transaction(
  p_business_id uuid,
  p_branch_id uuid,
  p_terminal_id uuid,
  p_customer_card_id uuid,
  p_gross_amount_mzn_minor integer,
  p_discount_amount_mzn_minor integer,
  p_points_to_redeem integer,
  p_expected_net_amount_mzn_minor integer,
  p_payment_method public.transaction_payment_method,
  p_payment_reference text,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  transaction_id uuid,
  available_balance integer,
  payment_attempt_id uuid,
  payment_status text,
  receipt_number text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_terminal public.pos_terminals;
  v_channel public.business_payment_channels;
  v_existing_attempt public.payment_attempts;
  v_existing_transaction public.transactions;
  v_cashier_member_id uuid;
  v_attempt_id uuid;
  v_provider_reference text;
  v_loyalty record;
  v_transaction public.transactions;
  v_balance integer;
begin
  if v_actor is null
    or p_business_id is null
    or p_branch_id is null
    or p_terminal_id is null
    or p_customer_card_id is null
  then
    raise exception 'Required POS transaction fields are missing';
  end if;
  if not public.can_access_transaction(p_business_id, p_branch_id) then
    raise exception 'Not authorized to operate this branch';
  end if;
  if char_length(btrim(coalesce(p_idempotency_key, ''))) not between 12 and 200 then
    raise exception 'Invalid idempotency key';
  end if;
  if p_gross_amount_mzn_minor <= 0
    or coalesce(p_discount_amount_mzn_minor, 0) < 0
    or coalesce(p_discount_amount_mzn_minor, 0) > p_gross_amount_mzn_minor
    or coalesce(p_points_to_redeem, 0) < 0
    or p_expected_net_amount_mzn_minor < 0
  then
    raise exception 'Invalid POS transaction values';
  end if;
  if jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'POS metadata must be an object';
  end if;

  select pt.* into v_terminal
  from public.pos_terminals pt
  where pt.id = p_terminal_id
    and pt.business_id = p_business_id
    and pt.branch_id = p_branch_id
    and pt.status = 'active'
  for update;
  if not found then raise exception 'An active POS terminal is required'; end if;

  select bm.id into v_cashier_member_id
  from public.business_members bm
  where bm.business_id = p_business_id
    and bm.profile_id = v_actor
    and bm.status = 'active'
    and (
      bm.role in ('business_admin', 'business_owner')
      or (bm.branch_id = p_branch_id and bm.role in ('branch_manager', 'cashier'))
    )
  order by case when bm.branch_id = p_branch_id then 0 else 1 end, bm.joined_at
  limit 1;
  if v_cashier_member_id is null then raise exception 'Active POS operator not found'; end if;

  if p_expected_net_amount_mzn_minor = 0 then
    if p_payment_method <> 'points' then
      raise exception 'A zero-balance purchase must use points';
    end if;
    select tx.* into v_existing_transaction
    from public.transactions tx
    where tx.business_id = p_business_id and tx.external_reference = p_idempotency_key;
    if found then
      select pw.available_balance into v_balance
      from public.point_wallets pw
      where pw.business_id = p_business_id and pw.customer_card_id = p_customer_card_id;
      return query select
        v_existing_transaction.id,
        coalesce(v_balance, 0),
        null::uuid,
        'not_required'::text,
        'VY-' || upper(substr(replace(v_existing_transaction.id::text, '-', ''), 1, 10));
      return;
    end if;
  else
    if p_payment_method not in ('cash', 'card') then
      raise exception 'This payment provider is not configured for server confirmation';
    end if;

    select bpc.* into v_channel
    from public.business_payment_channels bpc
    where bpc.business_id = p_business_id
      and bpc.method = p_payment_method
      and bpc.mode = 'manual'
      and bpc.status = 'active'
      and (bpc.branch_id = p_branch_id or bpc.branch_id is null)
    order by case when bpc.branch_id = p_branch_id then 0 else 1 end
    limit 1;
    if not found then raise exception 'Payment channel is not active for this branch'; end if;

    if p_payment_method = 'card'
      and char_length(btrim(coalesce(p_payment_reference, ''))) not between 4 and 100
    then
      raise exception 'Card terminal reference is required';
    end if;

    select pa.* into v_existing_attempt
    from public.payment_attempts pa
    where pa.business_id = p_business_id and pa.idempotency_key = p_idempotency_key
    for update;
    if found then
      if v_existing_attempt.status = 'reconciled' and v_existing_attempt.transaction_id is not null then
        select pw.available_balance into v_balance
        from public.transactions tx
        join public.point_wallets pw
          on pw.business_id = tx.business_id and pw.customer_card_id = tx.customer_card_id
        where tx.id = v_existing_attempt.transaction_id;
        return query select
          v_existing_attempt.transaction_id,
          coalesce(v_balance, 0),
          v_existing_attempt.id,
          v_existing_attempt.status::text,
          'VY-' || upper(substr(replace(v_existing_attempt.transaction_id::text, '-', ''), 1, 10));
        return;
      end if;
      raise exception 'Payment attempt already exists and requires review';
    end if;

    v_provider_reference := case
      when p_payment_method = 'card' then upper(btrim(p_payment_reference))
      else 'CASH-' || upper(substr(encode(extensions.digest(convert_to(p_idempotency_key, 'utf8'), 'sha256'), 'hex'), 1, 16))
    end;

    insert into public.payment_attempts (
      business_id,
      branch_id,
      terminal_id,
      payment_channel_id,
      method,
      status,
      amount_mzn_minor,
      idempotency_key,
      provider_reference,
      requested_by,
      authorized_at,
      public_metadata
    ) values (
      p_business_id,
      p_branch_id,
      p_terminal_id,
      v_channel.id,
      p_payment_method,
      'authorized',
      p_expected_net_amount_mzn_minor,
      p_idempotency_key,
      v_provider_reference,
      v_actor,
      now(),
      jsonb_build_object('confirmation', 'manual', 'terminal_code', v_terminal.code)
    ) returning id into v_attempt_id;
  end if;

  if coalesce(p_points_to_redeem, 0) > 0 then
    select * into v_loyalty
    from public.redeem_purchase_points(
      p_business_id,
      p_branch_id,
      p_customer_card_id,
      p_gross_amount_mzn_minor,
      p_discount_amount_mzn_minor,
      p_points_to_redeem,
      v_cashier_member_id,
      p_idempotency_key,
      coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'source', 'pos',
        'terminal_id', p_terminal_id,
        'payment_method', p_payment_method
      )
    );
  else
    select * into v_loyalty
    from public.record_purchase_points(
      p_business_id,
      p_branch_id,
      p_customer_card_id,
      p_gross_amount_mzn_minor,
      p_discount_amount_mzn_minor,
      v_cashier_member_id,
      p_idempotency_key,
      coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'source', 'pos',
        'terminal_id', p_terminal_id,
        'payment_method', p_payment_method
      )
    );
  end if;

  select tx.* into v_transaction
  from public.transactions tx
  where tx.id = v_loyalty.transaction_id;
  if not found or v_transaction.net_amount_mzn_minor <> p_expected_net_amount_mzn_minor then
    raise exception 'Payment amount does not match the loyalty transaction';
  end if;

  if v_attempt_id is not null then
    update public.payment_attempts
    set
      transaction_id = v_transaction.id,
      status = 'reconciled',
      reconciled_at = now()
    where id = v_attempt_id;

    insert into public.transaction_payments (
      transaction_id,
      business_id,
      payment_attempt_id,
      method,
      amount_mzn_minor,
      provider_reference,
      reconciled_at
    ) values (
      v_transaction.id,
      p_business_id,
      v_attempt_id,
      p_payment_method,
      v_transaction.net_amount_mzn_minor,
      v_provider_reference,
      now()
    );
  end if;

  update public.pos_terminals
  set last_seen_at = now()
  where id = p_terminal_id;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, after_data, context
  ) values (
    p_business_id,
    v_actor,
    'create',
    'transaction_payments',
    v_attempt_id,
    jsonb_build_object(
      'transaction_id', v_transaction.id,
      'payment_attempt_id', v_attempt_id,
      'method', p_payment_method,
      'amount_mzn_minor', v_transaction.net_amount_mzn_minor,
      'status', case when v_attempt_id is null then 'not_required' else 'reconciled' end
    ),
    jsonb_build_object('source', 'pos', 'terminal_id', p_terminal_id)
  );

  return query select
    v_transaction.id,
    v_loyalty.available_balance::integer,
    v_attempt_id,
    case when v_attempt_id is null then 'not_required'::text else 'reconciled'::text end,
    'VY-' || upper(substr(replace(v_transaction.id::text, '-', ''), 1, 10));
end;
$$;

revoke all on function public.get_pos_operations(uuid) from public, anon;
grant execute on function public.get_pos_operations(uuid) to authenticated;

revoke all on function public.manage_pos_terminal(uuid, uuid, text, uuid, text, text) from public, anon;
grant execute on function public.manage_pos_terminal(uuid, uuid, text, uuid, text, text) to authenticated;

revoke all on function public.update_pos_terminal_settings(uuid, uuid, boolean, boolean, boolean, boolean, integer, text[]) from public, anon;
grant execute on function public.update_pos_terminal_settings(uuid, uuid, boolean, boolean, boolean, boolean, integer, text[]) to authenticated;

revoke all on function public.manage_pos_terminal_device(uuid, uuid, uuid, text, public.pos_device_type, text, text) from public, anon;
grant execute on function public.manage_pos_terminal_device(uuid, uuid, uuid, text, public.pos_device_type, text, text) to authenticated;

revoke all on function public.manage_business_payment_channel(uuid, uuid, text) from public, anon;
grant execute on function public.manage_business_payment_channel(uuid, uuid, text) to authenticated;

revoke all on function public.confirm_pos_transaction(uuid, uuid, uuid, uuid, integer, integer, integer, integer, public.transaction_payment_method, text, text, jsonb) from public, anon;
grant execute on function public.confirm_pos_transaction(uuid, uuid, uuid, uuid, integer, integer, integer, integer, public.transaction_payment_method, text, text, jsonb) to authenticated;

comment on function public.confirm_pos_transaction(uuid, uuid, uuid, uuid, integer, integer, integer, integer, public.transaction_payment_method, text, text, jsonb) is
  'Atomically reconciles a confirmed manual payment with one loyalty transaction and one transaction_payments row.';
