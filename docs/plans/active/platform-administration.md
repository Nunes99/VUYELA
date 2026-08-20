# Fase 16 - Administracao da plataforma

## Scope

- Secure platform dashboard behind platform role and MFA gates.
- Separate capabilities for support agents, platform admins, and super admins.
- Business approval and suspension workflows.
- User role management without self-escalation or final-super-admin removal.
- Subscription visibility.
- Support ticket assignment and resolution.
- Fraud review and reopening.
- Platform metrics and append-only audit history.

## Security Decisions

- Platform data is read with the Supabase service-role client only in server-only modules.
- Every route still validates the authenticated platform role and Supabase Auth AAL2 session.
- Every mutation validates a distinct administrative capability before creating a service-role client.
- Database mutation functions are executable only by `service_role`.
- Mutation functions lock their target row and append an audit record in the same transaction.
- Audit rows cannot be updated or deleted.
- Platform admins cannot modify platform-admin or super-admin roles.
- Only a super admin can assign privileged platform roles, and the final super admin cannot be demoted.

## Verification

- Unit tests cover capability and role-assignment rules.
- Integration tests cover RPC privileges, locking, audit entries, and server-side gates.
- Playwright covers every protected admin view on desktop and mobile projects.
- Supabase advisors are run after the remote migration.
