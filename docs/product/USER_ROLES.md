# User Roles

## Public

- Visitor: access public pages and marketplace.

## Customer

- Customer: owns customer profile, cards, wallet visibility, activity, offers, and notifications.

## Business

- Cashier: can operate assigned POS flows.
- Branch Manager: manages an assigned branch and branch reports.
- Business Admin: manages settings, employees, campaigns, and reports for a business.
- Business Owner: full business-level access.

## Platform

- Support Agent: support workflows with audited access.
- Platform Admin: platform management through privileged server-side paths.
- Super Admin: maximum platform privileges, reserved for exceptional administrative work.

Support agents can manage support queues and review fraud alerts, with read-only business, user, subscription, and platform metrics context. Platform admins can additionally approve or suspend businesses, manage non-privileged platform roles, and inspect the global audit trail. Super admins alone can assign or remove platform-admin and super-admin roles.

## Authorization Direction

RBAC must be centralized. Do not duplicate permission logic across UI components. Tenant isolation is enforced in database policies and server-side operations, not only in client navigation.
