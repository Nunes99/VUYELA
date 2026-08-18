# VUYELA Migration Order

These migration files intentionally use descriptive names without numeric prefixes.

Apply them in this exact order:

1. `create_vuyela_core_schema.sql`
2. `enable_tenant_row_level_security.sql`
3. `create_loyalty_engine_rpcs.sql`
4. `create_pos_card_lookup_rpc.sql`
5. `create_business_dashboard_rpc.sql`
6. `add_branch_opening_hours.sql`
7. `create_campaign_management.sql`
8. `harden_function_privileges.sql`

Do not rely on alphabetical order. The Supabase plugin migration names should match the file names without `.sql`.
