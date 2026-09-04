# Public Homepage

## NEW PHAS public flow

The public VUYELA experience implements the approved Figma family as one shared system rather than
six independent page copies:

- `/` presents the product, customer value, business value, public partners, database plans and
  core FAQs;
- `/como-funciona` explains the complete earn-and-return journey;
- `/clientes` presents the customer value and reads active offers from the public marketplace;
- `/negocios` presents the operational dashboard, POS and management capabilities;
- `/precos` reads the public plan catalogue and compares database-owned entitlements;
- `/ajuda` provides searchable, category-filtered FAQs and working support destinations;
- `/estabelecimentos`, `/categorias`, `/locais`, `/ofertas` and `/pesquisar` reuse the same public
  shell and provide the discovery layer for published marketplace content.

All public pages reuse `PublicSiteShell`, the official `VuyelaLogo`, the exported Capulana textures,
Outfit for public display typography and Inter for body copy. Navigation links resolve to real
routes, while unavailable payment-provider integrations are not advertised as active capabilities.

The primary navigation has one `Descobrir` entry. Inside discovery routes, a compact contextual
navigation exposes establishments, categories, locations, offers and search. The mobile version
uses five stable icon-and-label destinations so the complete public flow remains visible without
page-level horizontal overflow.

The mobile layouts follow the approved 390 px Figma frames (nodes `546:4269`, `546:4441`,
`546:4546`, `546:4670`, `546:4843`, `546:5042` and `552:4266`). The menu is a full-screen surface,
and each public page uses the texture exported for its corresponding design rather than a generic
repeating substitute.

## Experience direction

The public homepage is product-led and keeps the VUYELA message, services, and Mozambican identity
intact. It uses the real customer product visual as the first-viewport signal instead of introducing
generic financial imagery.

The information order is:

1. core promise and customer/business entry points;
2. verified public counts and direct discovery of establishments, categories, locations, offers,
   and search;
3. the four-step loyalty loop;
4. customer benefits and partner proof;
5. dedicated customer and business paths;
6. pricing, programme rules, resources, and footer.

Public metrics must be derived from published marketplace records. Uploaded promotional images
and active public offers are reused on the homepage, the customer page and marketplace routes;
private campaign audiences, rules and internal workflow data must never be projected publicly.

The visual composition is intentionally editorial rather than a sequence of identical card grids:

- the hero combines concise copy with the real VUYELA product visual and keeps the cultural pattern
  concentrated as a signature field;
- the discovery rail provides direct routes to establishments, offers, categories and search;
- public campaigns appear near the top of the page so the visitor sees live value before product
  explanation;
- process and capability sections use connected steps, dividers and data rails instead of floating
  cards with decorative shadows;
- reward gold communicates value, teal communicates action and coral is reserved for small visual
  accents.

Capulana geometry must support hierarchy rather than behave as a permanent wallpaper. On wide
screens it can occupy one side of a hero or define the edge of a section. On small screens it may
fill a dark surface at low opacity, provided that contrast and content legibility remain intact.

## Interaction rules

- Keep discovery destinations visible and fully readable from 320px upwards.
- Leave a visible hint of the discovery navigation below the mobile hero.
- Use solid brand surfaces and the VUYELA product image; do not introduce unrelated banking
  imagery or another company's visual identity.
- Preserve one dominant registration action and a clear secondary business action.
- Keep the public experience visually related to the customer application through the same dark
  indigo, teal, reward gold, typography, borders, and compact geometry.
- Prefer real public content, product demonstrations, timelines and data rails to generic feature
  cards or ornamental dashboard mock-ups.
- Use compact corner radii, visible focus states and restrained motion. Public navigation must
  remain usable without horizontal page scrolling at 320 px.

## Reference principles

The structure is informed by mature loyalty experiences that prioritize unified navigation,
immediate benefit comprehension, scan/earn/redeem clarity, and quick access to a digital member
card. References are used for information architecture only; VUYELA assets and tokens remain the
visual source of truth.
