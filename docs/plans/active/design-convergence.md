# Design Convergence Review

## Goal

Bring every implemented VUYELA surface back to the approved brand and UX specification before
starting Phase 19.

## Reference

- `docs/design/BRAND.md`
- `docs/design/DESIGN_SYSTEM.md`
- `docs/design/RESPONSIVE.md`
- `docs/design/ACCESSIBILITY.md`
- `VUYELA - MASTER DEVELOPMENT FLOW FOR CODEX.md`

## Decisions

- Self-host Sora and Inter so the declared typography is rendered consistently.
- Use the approved VUYELA mark and geometric pattern instead of page-specific text logos.
- Keep the cultural pattern between 3% and 8% effective opacity.
- Reserve gold for rewards and commercial reward actions.
- Use light, quiet work surfaces for dashboards, POS, and administration.
- Keep the customer mobile navigation aligned to Inicio, Cartoes, Explorar, Actividade, and Perfil.
- Present the complete business and administration navigation as an in-page grid on small screens
  instead of an overlapping fixed bar.
- Adopt the `Rede Viva` public direction: authentic full-bleed commerce photography, a compact
  discovery dock, real public business identities and offers, and Capulana used as a signature
  accent instead of permanent wallpaper.
- Use YELAS (`YL`) with the MZN equivalent in customer-facing product imagery and copy.
- Keep the customer, business, POS and administration applications operationally independent while
  aligning their surface geometry, typography and navigation states through shared tokens.

## Verification

- Automated contract tests cover typography, brand assets, homepage benefits, and customer mobile
  navigation.
- Playwright checks the homepage at 320, 375, 390, 430, 768, 1024, 1280, and 1440 pixels.
- Visual review covers homepage, authentication, marketplace, customer, business, POS, admin, and
  offline surfaces on desktop and mobile.
- Homepage interaction coverage includes manual dashboard indicator switching and reduced-motion
  behaviour.
