---
name: image-art-direction
description: Source or generate original, usable landing-page imagery with provenance, licensing, art direction, responsive dimensions, and alt text.
---

# Image art direction

Start with the approved direction, brand assets, and product research. Decide
whether imagery should demonstrate the product, establish context, add human
credibility, or be omitted entirely. Do not use decorative placeholders when
CSS, typography, gradients, or geometry can better serve the chosen direction.

Use host-provided image generation or image/web search without assuming package
API keys. For searched assets, verify reuse terms, download a local copy, do
not hotlink, and capture the source and attribution. For generated assets,
record provider, concise prompt summary, seed if available, and creation date.

Every visual asset must have an AssetLedgerV1 entry:

- local path, origin, license, any attribution;
- generation metadata where applicable;
- useful contextual alt text; and
- explicit width and height when it is rendered.

Never use a standalone SVG icon asset or handwrite an inline SVG icon. Use one
installed icon family, normally Lucide React or React Icons, consistently.
