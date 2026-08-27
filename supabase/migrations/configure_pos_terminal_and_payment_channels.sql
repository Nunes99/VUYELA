-- Persist the complete POS settings flow from the NEW PHAS designs.
-- Provider credentials are encrypted with Supabase Vault and are never returned
-- by an application-facing RPC.

create extension if not exists supabase_vault with schema vault;

create or replace function public.configure_pos_terminal_section(
  p_business_id uuid,
  p_terminal_id uuid,
  p_section text,
  p_settings jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_before public.pos_terminal_settings;
  v_allowed_keys text[];
begin
  if p_business_id is null
    or p_terminal_id is null
    or v_actor is null
    or not public.can_manage_business(p_business_id)
  then
    raise exception 'Not authorized to configure this POS terminal';
  end if;

  if not exists (
    select 1
    from public.pos_terminals pt
    where pt.id = p_terminal_id
      and pt.business_id = p_business_id
      and pt.status <> 'revoked'
  ) then
    raise exception 'POS terminal not found';
  end if;

  if p_settings is null
    or jsonb_typeof(p_settings) <> 'object'
    or octet_length(p_settings::text) > 16384
  then
    raise exception 'Invalid POS settings payload';
  end if;

  v_allowed_keys := case p_section
    when 'general' then array[
      'dateFormat', 'locale', 'receiptFooter', 'receiptLogoEnabled',
      'thankYouMessage', 'timezone'
    ]::text[]
    when 'devices' then array[
      'aztec', 'code128', 'continuousReading', 'dataMatrix', 'ean13',
      'pdf417', 'qrCode', 'readTimeoutSeconds', 'scannerSensitivity',
      'soundConfirmation', 'vibration'
    ]::text[]
    when 'printer' then array[
      'fontSize', 'paperWidth', 'printAutomatically', 'printLogo',
      'receiptCopies'
    ]::text[]
    when 'network' then array[
      'allowOfflineSales', 'apiBaseUrl', 'syncIntervalMinutes'
    ]::text[]
    when 'security' then array[
      'automaticCloudBackup', 'backupFrequency', 'forcePinChangeDays',
      'inactivityTimeoutMinutes', 'requireQuickAccessPin'
    ]::text[]
    else null
  end;

  if v_allowed_keys is null then
    raise exception 'Unsupported POS settings section';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(p_settings) as setting_keys(key_name)
    where not (key_name = any(v_allowed_keys))
  ) then
    raise exception 'Unsupported POS setting';
  end if;

  if p_section = 'general' and (
    coalesce(p_settings ->> 'locale', 'pt-MZ') not in ('pt-MZ', 'en-MZ')
    or coalesce(p_settings ->> 'timezone', 'Africa/Maputo') <> 'Africa/Maputo'
    or coalesce(p_settings ->> 'dateFormat', 'DD/MM/AAAA') not in ('DD/MM/AAAA', 'AAAA-MM-DD')
  ) then
    raise exception 'Invalid general POS settings';
  end if;

  if p_section = 'devices' and (
    coalesce((p_settings ->> 'scannerSensitivity')::integer, 75) not between 1 and 100
    or coalesce((p_settings ->> 'readTimeoutSeconds')::integer, 5) not between 1 and 60
  ) then
    raise exception 'Invalid scanner settings';
  end if;

  if p_section = 'printer' and (
    coalesce((p_settings ->> 'receiptCopies')::integer, 1) not between 1 and 5
    or coalesce(p_settings ->> 'paperWidth', '80mm') not in ('58mm', '80mm')
  ) then
    raise exception 'Invalid printer settings';
  end if;

  if p_section = 'network' and (
    coalesce((p_settings ->> 'syncIntervalMinutes')::integer, 5) not between 1 and 120
    or char_length(coalesce(p_settings ->> 'apiBaseUrl', '')) > 300
  ) then
    raise exception 'Invalid network settings';
  end if;

  if p_section = 'security' and
    (
      coalesce((p_settings ->> 'forcePinChangeDays')::integer, 90) not between 30 and 365
      or coalesce((p_settings ->> 'inactivityTimeoutMinutes')::integer, 30) not between 5 and 480
    )
  then
    raise exception 'Invalid security settings';
  end if;

  select pts.* into v_before
  from public.pos_terminal_settings pts
  where pts.terminal_id = p_terminal_id
    and pts.business_id = p_business_id
  for update;

  if not found then
    raise exception 'POS terminal settings not found';
  end if;

  update public.pos_terminal_settings pts
  set
    locale = case
      when p_section = 'general' then coalesce(nullif(p_settings ->> 'locale', ''), pts.locale)
      else pts.locale
    end,
    timezone = case
      when p_section = 'general' then coalesce(nullif(p_settings ->> 'timezone', ''), pts.timezone)
      else pts.timezone
    end,
    print_receipt_automatically = case
      when p_section = 'printer' and p_settings ? 'printAutomatically'
        then (p_settings ->> 'printAutomatically')::boolean
      else pts.print_receipt_automatically
    end,
    inactivity_timeout_minutes = case
      when p_section = 'security' and p_settings ? 'inactivityTimeoutMinutes'
        then (p_settings ->> 'inactivityTimeoutMinutes')::integer
      else pts.inactivity_timeout_minutes
    end,
    settings = jsonb_set(pts.settings, array[p_section], jsonb_strip_nulls(p_settings), true)
  where pts.terminal_id = p_terminal_id;

  insert into public.audit_logs (
    business_id,
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data,
    context
  ) values (
    p_business_id,
    v_actor,
    'update',
    'pos_terminal_settings',
    p_terminal_id,
    to_jsonb(v_before),
    (select to_jsonb(pts) from public.pos_terminal_settings pts where pts.terminal_id = p_terminal_id),
    jsonb_build_object('source', 'pos_settings', 'section', p_section)
  );
end;
$$;

create or replace function public.configure_business_payment_channel(
  p_business_id uuid,
  p_channel_id uuid,
  p_public_settings jsonb,
  p_credentials jsonb default '{}'::jsonb
)
returns public.payment_channel_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_channel public.business_payment_channels;
  v_allowed_public text[];
  v_allowed_credentials text[];
  v_secret_id uuid;
  v_secret_name text;
  v_identifier text;
  v_next_status public.payment_channel_status;
begin
  if p_business_id is null
    or p_channel_id is null
    or v_actor is null
    or not public.can_manage_business(p_business_id)
  then
    raise exception 'Not authorized to configure payment channels';
  end if;

  select bpc.* into v_channel
  from public.business_payment_channels bpc
  where bpc.id = p_channel_id
    and bpc.business_id = p_business_id
  for update;

  if not found then
    raise exception 'Payment channel not found';
  end if;

  if p_public_settings is null
    or jsonb_typeof(p_public_settings) <> 'object'
    or octet_length(p_public_settings::text) > 16384
    or p_credentials is null
    or jsonb_typeof(p_credentials) <> 'object'
    or octet_length(p_credentials::text) > 8192
  then
    raise exception 'Invalid payment configuration payload';
  end if;

  v_allowed_public := case v_channel.method
    when 'mpesa' then array[
      'autoReconciliation', 'confirmationNumber', 'environment', 'merchantId',
      'maximumAmount', 'minimumAmount', 'reconciliationFrequency', 'reportEmail',
      'smsNotifications', 'timeoutSeconds', 'ussdShortcode'
    ]::text[]
    when 'emola' then array[
      'callbackUrl', 'dailyTransactionLimit', 'maximumAmount', 'minimumAmount',
      'partnerCode', 'pushNotifications', 'smsFallback', 'supportEmail'
    ]::text[]
    when 'mkesh' then array[
      'automaticRetry', 'environment', 'failureUrl', 'maximumRetries', 'merchantId',
      'qrValidityMinutes', 'referencePrefix', 'staticQrCode', 'successUrl'
    ]::text[]
    when 'cash' then array[
      'automaticClosingTime', 'automaticRounding', 'emailClosingReport',
      'initialFloat', 'logChange', 'lowFundAlert', 'managerApprovalThreshold',
      'mandatoryCloseCount', 'maximumCashBalance', 'printClosingReport',
      'roundingUnit', 'safeDepositThreshold'
    ]::text[]
    when 'card' then array[
      'americanExpress', 'connectionType', 'contactless', 'contactlessLimit',
      'fixedFee', 'maestro', 'mastercard', 'pinThreshold', 'preAuthorization',
      'processingRate', 'terminalModel', 'terminalSerialNumber', 'unionPay', 'visa'
    ]::text[]
    else null
  end;

  v_allowed_credentials := case v_channel.method
    when 'mpesa' then array['apiKey', 'apiSecret']::text[]
    when 'emola' then array['integrationToken']::text[]
    when 'mkesh' then array['rsaPublicKey']::text[]
    else array[]::text[]
  end;

  if v_allowed_public is null
    or exists (
      select 1 from jsonb_object_keys(p_public_settings) as public_keys(key_name)
      where not (key_name = any(v_allowed_public))
    )
    or exists (
      select 1 from jsonb_object_keys(p_credentials) as credential_keys(key_name)
      where not (key_name = any(v_allowed_credentials))
    )
  then
    raise exception 'Unsupported payment configuration field';
  end if;

  if p_public_settings ?| array[
    'apiKey', 'apiSecret', 'clientSecret', 'integrationToken', 'password',
    'privateKey', 'rsaPublicKey', 'secret', 'token'
  ] then
    raise exception 'Secrets cannot be stored in public settings';
  end if;

  if p_credentials <> '{}'::jsonb then
    if exists (
      select 1
      from jsonb_each_text(p_credentials) credential
      where char_length(btrim(credential.value)) < 8
    ) then
      raise exception 'Provider credentials are incomplete';
    end if;

    if v_channel.method = 'mpesa'
      and not (p_credentials ? 'apiKey' and p_credentials ? 'apiSecret')
    then
      raise exception 'M-Pesa API key and secret are required';
    end if;

    if v_channel.method = 'emola' and not (p_credentials ? 'integrationToken') then
      raise exception 'e-Mola integration token is required';
    end if;

    if v_channel.method = 'mkesh' and not (p_credentials ? 'rsaPublicKey') then
      raise exception 'mKesh RSA public key is required';
    end if;

    v_secret_name := 'vuyela_payment_' || replace(v_channel.id::text, '-', '_');

    select secret.id into v_secret_id
    from vault.secrets secret
    where secret.name = v_secret_name;

    if v_secret_id is null then
      select vault.create_secret(
        p_credentials::text,
        v_secret_name,
        'VUYELA payment provider credentials for channel ' || v_channel.id::text
      ) into v_secret_id;
    else
      perform vault.update_secret(
        v_secret_id,
        p_credentials::text,
        v_secret_name,
        'VUYELA payment provider credentials for channel ' || v_channel.id::text
      );
    end if;
  end if;

  v_identifier := coalesce(
    nullif(p_public_settings ->> 'merchantId', ''),
    nullif(p_public_settings ->> 'partnerCode', ''),
    nullif(p_public_settings ->> 'terminalSerialNumber', '')
  );

  if v_channel.mode = 'manual' then
    v_next_status := 'active';
  elsif p_credentials <> '{}'::jsonb then
    v_next_status := 'testing';
  elsif v_channel.credentials_configured_at is null then
    v_next_status := 'unconfigured';
  else
    v_next_status := v_channel.status;
  end if;

  update public.business_payment_channels bpc
  set
    public_settings = jsonb_strip_nulls(p_public_settings),
    masked_identifier = case
      when v_identifier is null then bpc.masked_identifier
      when char_length(v_identifier) <= 4 then '••••' || v_identifier
      else repeat('•', least(char_length(v_identifier) - 4, 12)) || right(v_identifier, 4)
    end,
    credentials_configured_at = case
      when p_credentials <> '{}'::jsonb then now()
      else bpc.credentials_configured_at
    end,
    status = v_next_status
  where bpc.id = v_channel.id;

  insert into public.audit_logs (
    business_id,
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data,
    context
  ) values (
    p_business_id,
    v_actor,
    'update',
    'business_payment_channels',
    v_channel.id,
    to_jsonb(v_channel),
    (select to_jsonb(bpc) from public.business_payment_channels bpc where bpc.id = v_channel.id),
    jsonb_build_object(
      'source', 'pos_payment_settings',
      'method', v_channel.method::text,
      'credential_keys_updated', coalesce((
        select jsonb_agg(key_name)
        from jsonb_object_keys(p_credentials) as credential_keys(key_name)
      ), '[]'::jsonb)
    )
  );

  return v_next_status;
end;
$$;

revoke all on function public.configure_pos_terminal_section(uuid, uuid, text, jsonb)
from public, anon;
grant execute on function public.configure_pos_terminal_section(uuid, uuid, text, jsonb)
to authenticated;

revoke all on function public.configure_business_payment_channel(uuid, uuid, jsonb, jsonb)
from public, anon;
grant execute on function public.configure_business_payment_channel(uuid, uuid, jsonb, jsonb)
to authenticated;

comment on function public.configure_pos_terminal_section(uuid, uuid, text, jsonb) is
  'Persists one validated POS settings section and records an immutable tenant audit event.';

comment on function public.configure_business_payment_channel(uuid, uuid, jsonb, jsonb) is
  'Persists non-secret payment settings and stores provider credentials encrypted in Supabase Vault.';
