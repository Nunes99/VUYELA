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
