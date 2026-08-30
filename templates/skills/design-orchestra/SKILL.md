---
name: design-orchestra
description: Chat-native entry point for evidence-led React landing-page creation, redesign, critique, and polish. Use whenever a user asks to make, redesign, improve, critique, or polish a landing page.
---

# Design Orchestra

Route the request to one of four modes: **create**, **redesign**, **critique**,
or **polish**. This skill governs the workflow; do not skip its gates.

## Non-negotiable flow

1. Inspect the repository, framework, existing component system, brand assets,
   DESIGN.md, page content, and any supplied evidence.
2. Research the product idea and its category. Look for the product's existing
   moodboards, brand references, or visual language before creating something
   new. Synthesize findings; never imitate a competitor.
3. Ask one structured question round for only unresolved facts: goal, audience,
   offer, CTA, proof, brand constraints, desired feeling, anti-references,
   media preference, palette, and animation technology.
4. Give a user-supplied palette priority. If none is supplied, research
   product-appropriate palettes using Color Hunt or another current curated
   palette source when web access is available. Record the source, test the
   applied pairs for contrast, and present the selected palette for approval.
5. Explicitly ask the user to choose **CSS-only**, **Framer Motion**, **GSAP**,
   **3D**, or **no motion**. CSS is the safe default only after the user agrees.
6. Create a valid BriefV1, a cryptographically random seed (unless supplied),
   and exactly three diverse DirectionV1 candidates. Use the visual-direction
   skill and render a self-contained gallery.
7. Present the three candidates and wait for an explicit selection. Do not edit
   the landing page before selection.
8. Implement the selected system, then run independent strategy, visual,
   accessibility, responsive, and performance review.
9. Iterate until quality gates pass. If all directions are rejected, use
   feedback plus a fresh seed and create three new candidates.

Where subagents exist, delegate strategy, exploration, and review independently.
On hosts without subagents, perform the same phases sequentially and label the
independence of each review.

## Redesign rules

Treat existing DESIGN.md as authority. Never overwrite it; create a
page-specific specification unless the user explicitly asks for a merge.
Preserve real brand assets and the existing component system. Separate observed
problems from assumptions and never fabricate proof.

## Required artifacts

- BriefV1 before concepts.
- One DirectionV1 for every candidate.
- SelectionV1 before implementation.
- AssetLedgerV1 for all non-CSS visual assets.
- A page-specific design specification that records the approved direction and
  chosen animation technology.
