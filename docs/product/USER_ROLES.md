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

## Authorization Direction

RBAC must be centralized. Do not duplicate permission logic across UI components. Tenant isolation is enforced in database policies and server-side operations, not only in client navigation.
