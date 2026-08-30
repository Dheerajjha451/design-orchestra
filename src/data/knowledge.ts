export const DESIGN_FOUNDATIONS = {
  hierarchy: [
    "Make one primary action unmistakable at each decision point.",
    "Use size, contrast, position, and grouping together; color alone is not hierarchy.",
    "Let the offer and audience understanding precede decoration."
  ],
  accessibility: [
    "Meet WCAG AA contrast; never communicate state with color alone.",
    "Support keyboard access, visible focus, semantic landmarks, and 320px reflow.",
    "Respect prefers-reduced-motion and keep motion supplemental."
  ],
  responsive: [
    "Design the narrow layout intentionally instead of shrinking desktop.",
    "Reserve image dimensions, use responsive sources, and prevent horizontal overflow.",
    "Test long content and 200% zoom before calling a page complete."
  ],
  evidence: [
    "Never invent testimonials, logos, awards, customer counts, or performance claims.",
    "Use only verified assets with local copies, provenance, license, and useful alt text.",
    "Use a single coherent icon family; Lucide React or React Icons are acceptable."
  ]
} as const;
