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
21. `extend_pos_customer_identification.sql`
22. `manage_business_configuration.sql`
23. `seed_business_categories.sql`
24. `fix_business_configuration_email_assignment.sql`
25. `manage_business_categories.sql`
26. `create_operational_flow_foundation.sql`
27. `secure_operational_flow_foundation.sql`
28. `restrict_operational_flow_privileges.sql`
29. `index_operational_foreign_keys.sql`
30. `implement_business_operations.sql`
31. `extend_business_campaign_management.sql`
32. `index_notification_campaign_tenant_fk.sql`
33. `implement_pos_terminal_operations.sql`
34. `implement_customer_engagement.sql`
35. `implement_platform_operations.sql`

Do not rely on alphabetical order. The Supabase plugin migration names should match the file names without `.sql`.
