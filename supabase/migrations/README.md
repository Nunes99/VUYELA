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
9. `ensure_auth_profiles_and_atomic_business_onboarding.sql`
10. `consolidate_select_policies.sql`
11. `create_notification_delivery.sql`
12. `secure_notification_read_updates.sql`
13. `restrict_notification_read_column.sql`
14. `implement_referral_programs.sql`
15. `harden_referral_programs.sql`
16. `implement_platform_administration.sql`
17. `harden_platform_administration.sql`
18. `implement_subscription_entitlements.sql`
19. `restrict_business_sensitive_columns.sql`
20. `provision_loyalty_programs_and_card_membership.sql`

Do not rely on alphabetical order. The Supabase plugin migration names should match the file names without `.sql`.
