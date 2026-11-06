# Accessibility

WCAG 2.2 AA is the baseline.

Requirements:

- keyboard navigation;
- visible focus states;
- semantic HTML;
- persistent labels for form fields;
- ARIA only when needed;
- contrast of at least 4.5:1 for normal text;
- state is not communicated by color alone;
- reduced-motion support;
- modals close with Escape and restore focus;
- QR codes provide manual fallback codes or numbers.

Automated testing is not enough. Representative flows need interactive inspection.

Fluid materials are opt-in and solid by default. Reduced transparency and forced colours disable
blur. `MotionPreferences` can further reduce effects, never override OS reductions. The shared
Modal contains Tab/Shift+Tab focus, closes with Escape, restores the invoking control, and restores
the previous body overflow. Review light/dark examples and actual image backgrounds visually;
automated checks alone do not establish WCAG conformance.

Material button boundaries use the semantic muted-text colour for stronger contrast. Material
navigation exposes the active item through an underline as well as `aria-current`, and Navbar
links use the shared 44px touch target. Tabs support roving focus, arrows and Home/End.

The public footer provides persistent visual comfort controls. JavaScript-driven offer/demo
carousels respond to OS preference changes and manual reductions, including cancellation of
autoplay. Manual navigation remains available with instant scrolling when motion is reduced.
The business dashboard illustration visibly identifies its data as demonstrative and does not
announce rotating mock metrics as live activity.
