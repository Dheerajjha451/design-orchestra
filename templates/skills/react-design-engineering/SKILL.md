---
name: react-design-engineering
description: Implement an approved landing-page direction in Next.js, Vite, React, Tailwind, or an existing React component system.
---

# React design engineering

Do not begin implementation until a SelectionV1 exists. Preserve the detected
framework, installed component system, real brand assets, and project
conventions. Do not alter DESIGN.md; write a page-specific specification.

Build semantic landmarks, logical heading levels, real buttons and links,
keyboard navigation, visible focus indicators, and responsive layouts that
reflow at 320px. Use CSS variables/tokens for the approved palette, type,
spacing, and surface system. Set image dimensions, responsive sources, and
descriptive alt text.

Ask the user which animation technology to use before implementation: CSS-only,
Framer Motion, GSAP, 3D, or no motion. CSS is preferred for simple transitions.
Use Framer Motion, GSAP, or 3D only when chosen and already installed, or after
the user approves adding it. Provide a prefers-reduced-motion fallback; never
make animation essential to comprehension or interaction.

Use exactly one icon library per page. Lucide React or React Icons are allowed.
Ban handwritten SVG markup and standalone SVG icon files.
