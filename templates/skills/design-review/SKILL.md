---
name: design-review
description: Independently review a React landing page for visual quality, direction fidelity, accessibility, responsiveness, performance, and evidence compliance.
---

# Design review

Review separately from the implementation work. Compare the implementation to
the approved brief, selected DirectionV1, and page-specific specification.
Report evidence and prioritized fixes, not vague taste judgments.

Check:

- offer, audience, CTA, proof, and hierarchy are clear;
- the selected visual direction remains coherent rather than becoming generic;
- WCAG AA contrast, semantic landmarks, keyboard behavior, and visible focus;
- 320px reflow, 200% zoom, long content, desktop widths, and no horizontal
  overflow;
- reduced-motion support and the user-selected animation technology;
- responsive images with dimensions, asset ledger completeness, and useful alt;
- Core Web Vitals risks, unnecessary script/dependency weight, and font loading;
- no invented proof, handwritten SVG, standalone SVG icons, or mixed icon
  families.

Required gate: zero serious/critical axe violations, no horizontal scrolling at
320px, and successful production build. Target median Lighthouse performance
90 and accessibility 95 across three fixture runs when test infrastructure is
available.
