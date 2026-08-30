import { createHash, randomBytes } from "node:crypto";
import type {
  AssetLedgerV1,
  BriefV1,
  ConfigV1,
  DesignArchetype,
  DirectionV1,
  StyleFingerprint,
  ValidationResult,
} from "./types.js";
import { ARCHETYPES } from "./data/archetypes.js";

export { ARCHETYPES } from "./data/archetypes.js";
export type {
  AssetLedgerV1,
  BriefV1,
  ConfigV1,
  DesignArchetype,
  DirectionV1,
  SelectionV1,
  StyleFingerprint,
} from "./types.js";

export const DEFAULT_CONFIG: ConfigV1 = {
  version: 1,
  providers: [],
  scope: "project",
  framework: { detected: "unknown", autoDetect: true },
  mediaPolicy: {
    allowGeneratedImages: true,
    allowWebSearch: true,
    requireVerifiedReuseTerms: true,
    requireLocalCopies: true,
  },
  approvedIconLibraries: ["lucide-react", "react-icons"],
  qualityThresholds: {
    wcagLevel: "AA",
    minContrastText: 4.5,
    minLighthousePerformance: 90,
    minLighthouseAccessibility: 95,
    maxSeriousAxeViolations: 0,
  },
};

export function createRandomSeed(): string {
  return randomBytes(16).toString("hex");
}

function digest(input: string): number {
  return createHash("sha256").update(input).digest().readUInt32BE(0);
}

function randomAt(seed: string, position: number): number {
  return digest(`${seed}:${position}`) / 0xffffffff;
}

function pick<T>(items: readonly T[], seed: string, position: number): T {
  return items[Math.floor(randomAt(seed, position) * items.length)]!;
}

export function styleDistance(a: StyleFingerprint, b: StyleFingerprint): number {
  return (
    Math.abs(a.composition - b.composition) +
    Math.abs(a.density - b.density) +
    Math.abs(a.geometry - b.geometry) +
    Math.abs(a.typography - b.typography) +
    Math.abs(a.color - b.color) +
    Math.abs(a.imagery - b.imagery) +
    Math.abs(a.motion - b.motion)
  );
}

export function compatible(a: DesignArchetype, b: DesignArchetype): boolean {
  return a.id === b.id || a.compatibleWith.includes(b.id) || b.compatibleWith.includes(a.id);
}

function keywords(brief: BriefV1): string {
  return [brief.audience, brief.offer, brief.brand, brief.tone, brief.emotionalResponse ?? "", ...(brief.constraints ?? [])]
    .join(" ")
    .toLowerCase();
}

function suitable(archetype: DesignArchetype, brief: BriefV1): number {
  const source = keywords(brief);
  return archetype.suitability.reduce((score, phrase) => score + (source.includes(phrase.toLowerCase()) ? 10 : 0), 0);
}

function orderedArchetypes(seed: string, brief: BriefV1): DesignArchetype[] {
  return [...ARCHETYPES].sort((a, b) => {
    const scoreDiff = suitable(b, brief) - suitable(a, brief);
    return scoreDiff || randomAt(seed, ARCHETYPES.indexOf(b)) - randomAt(seed, ARCHETYPES.indexOf(a));
  });
}

const PALETTES = [
  ["#0B1020", "#F7F5EF", "#FF6B35", "#5EEAD4"],
  ["#101213", "#F6F0E8", "#C95D3A", "#D9A441"],
  ["#F4F3EE", "#161616", "#2855D9", "#D5FF3F"],
  ["#120D1E", "#F5E9FF", "#FF3DAB", "#73F5FF"],
  ["#14281D", "#FAF7F0", "#DBA159", "#D9E76C"],
  ["#F5F2EA", "#241E1B", "#B7183B", "#2C5BDB"],
];
const TYPE_PAIRS = [
  ["Space Grotesk", "Inter", "Compressed display with calm supporting text"],
  ["DM Serif Display", "Manrope", "Editorial contrast with a practical reading voice"],
  ["IBM Plex Mono", "IBM Plex Sans", "Measured technical utility and clear scanning"],
  ["Archivo Black", "Archivo", "Poster-scale statements with robust body copy"],
  ["Fraunces", "Source Sans 3", "Warmly expressive headlines and neutral detail"],
  ["Sora", "DM Sans", "Crisp contemporary product language"],
];
const COMPOSITIONS = [
  "A single decisive hero, proof immediately beneath it, then alternating evidence and action sections.",
  "An asymmetric grid with a dominant message column and modular evidence cards that create a deliberate reading path.",
  "A full-bleed visual interruption followed by an editorial sequence: proposition, proof, process, invitation.",
  "A bento-led product narrative where one large task outcome anchors smaller supporting capabilities.",
  "A typographic poster layout with a quiet utility bar, an oversized promise, and a focused conversion rail.",
  "A warm narrative rhythm: human need, tangible outcome, credible proof, practical next step."
];
const IMAGERY = [
  "Use a generated, art-directed hero image with a quiet negative-space area reserved for copy; record prompt, seed, and dimensions.",
  "Use verified, locally copied documentary photography that shows the audience's real context; avoid generic handshakes and fake dashboards.",
  "Use product UI captures only when they demonstrate the promised outcome; reserve dimensions and write descriptive alt text.",
  "Use no raster hero image: create the visual signature with typography, CSS gradients, texture, and geometric composition.",
  "Use a small set of tightly art-directed still-life images with consistent crop, temperature, and subject distance."
];
const MOTION = [
  "No essential motion. Use a short CSS opacity/transform entrance and a visible reduced-motion fallback.",
  "Use CSS-only staggered reveals for supporting details; never make motion carry meaning or block interaction.",
  "Use a restrained hover elevation and progress-aware section reveal. Disable both under prefers-reduced-motion.",
  "Keep the page still at rest; use a single purposeful transition when the primary CTA changes state."
];

function makeDirection(seed: string, brief: BriefV1, index: number, primary: DesignArchetype, companion: DesignArchetype): DirectionV1 {
  const requestedPalette = brief.colorPalette?.colors.filter((color) => /^#[0-9a-f]{6}$/i.test(color));
  const palette = requestedPalette && requestedPalette.length >= 2 ? requestedPalette : pick(PALETTES, seed, index * 11 + 1);
  const type = pick(TYPE_PAIRS, seed, index * 11 + 2);
  const motionPreference = brief.motionPreference === "none" ? MOTION[0] : pick(MOTION, seed, index * 11 + 3);
  const title = `${primary.name} / ${companion.name}`;
  return {
    version: 1,
    id: `direction-${index + 1}`,
    name: title,
    seed,
    archetypes: [primary.id, companion.id],
    fingerprint: primary.fingerprint,
    tokens: {
      palette,
      paletteSource: requestedPalette && requestedPalette.length >= 2
        ? (brief.colorPalette?.source ?? "User-provided palette")
        : "Package fallback only — replace after product-specific palette research or user approval.",
      radius: primary.id.includes("brutalist") ? "0px" : primary.id === "glass" ? "24px" : "12px",
      spacing: primary.fingerprint.density >= 4 ? "8px baseline, compact clusters" : "8px baseline, generous section rhythm",
      border: primary.id === "glass" ? "1px translucent surface edge" : "1px intentional contrast edge",
    },
    typography: { display: type[0], body: type[1], scale: "clamp(2.75rem, 7vw, 6.5rem)", treatment: type[2] },
    composition: pick(COMPOSITIONS, seed, index * 11 + 4),
    imagery: brief.mediaPreference === "no-images" ? IMAGERY[3] : pick(IMAGERY, seed, index * 11 + 5),
    motion: motionPreference,
    conversionStructure: [
      "Promise and primary CTA",
      "Credible proof already supplied by the project",
      "Outcome or product demonstration",
      "How it works / objection handling",
      "Final contextual CTA",
    ],
    rationale: `Chosen for ${brief.audience}: it combines ${primary.name.toLowerCase()} clarity with ${companion.name.toLowerCase()} character while keeping ${brief.cta} dominant.`,
    risks: [
      ...primary.antiPatterns.slice(0, 1),
      ...(primary.accessibilityRisk !== "low" ? ["Validate contrast, focus visibility, and reduced-motion behavior before approval."] : []),
    ],
  };
}

/**
 * Produces exactly three candidates. The selection algorithm uses an increasing
 * distance threshold; its fallback still maximises separation, avoiding three
 * cosmetic variants even for a constrained brief.
 */
export function createDirections(brief: BriefV1, seed = createRandomSeed()): DirectionV1[] {
  const ordered = orderedArchetypes(seed, brief);
  const minDistance = 12;
  const triples: Array<{ items: [DesignArchetype, DesignArchetype, DesignArchetype]; distance: number; relevance: number }> = [];
  for (let a = 0; a < ordered.length - 2; a += 1) for (let b = a + 1; b < ordered.length - 1; b += 1) for (let c = b + 1; c < ordered.length; c += 1) {
    const items = [ordered[a]!, ordered[b]!, ordered[c]!] as [DesignArchetype, DesignArchetype, DesignArchetype];
    const distance = Math.min(
      styleDistance(items[0].fingerprint, items[1].fingerprint),
      styleDistance(items[0].fingerprint, items[2].fingerprint),
      styleDistance(items[1].fingerprint, items[2].fingerprint),
    );
    const relevance = items.reduce((total, item) => total + suitable(item, brief), 0);
    triples.push({ items, distance, relevance });
  }
  const eligible = triples.filter((triple) => triple.distance >= minDistance);
  const best = (eligible.length ? eligible : triples).sort((a, b) => b.distance - a.distance || b.relevance - a.relevance)[0];
  if (!best) throw new Error("Unable to select three design directions.");
  const chosen = best.items;
  return chosen.map((primary, index) => {
    const companion = ordered.find((candidate) => candidate !== primary && compatible(primary, candidate)) ?? primary;
    return makeDirection(seed, brief, index, primary, companion);
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
}

export function renderMoodboardHtml(brief: BriefV1, directions: DirectionV1[]): string {
  if (directions.length !== 3) throw new Error("A Design Orchestra concept round must contain exactly three directions.");
  const cards = directions.map((direction, index) => {
    const palette = direction.tokens.palette.map((color) => `<span class="swatch" style="--swatch:${color}">${color}</span>`).join("");
    const sections = direction.conversionStructure.map((item, itemIndex) => `<li><b>0${itemIndex + 1}</b> ${escapeHtml(item)}</li>`).join("");
    return `<article class="direction ${index === 0 ? "active" : ""}" data-direction="${index}">
      <div class="label">Direction 0${index + 1} · ${escapeHtml(direction.name)}</div>
      <section class="layout">
        <div class="device desktop">
          <div class="nav">ORCHESTRA <span>Work &nbsp; Method &nbsp; About</span><button>Start here</button></div>
          <div class="hero" style="--ink:${direction.tokens.palette[0]};--paper:${direction.tokens.palette[1]};--accent:${direction.tokens.palette[2]}">
            <p>For ${escapeHtml(brief.audience)}</p><h1>${escapeHtml(brief.offer)}</h1><div class="hero-row"><button>${escapeHtml(brief.cta)}</button><small>Evidence-led, not invented</small></div>
          </div>
          <div class="proof"><strong>Proof</strong><span>Use only project-supplied facts, assets, and customer evidence.</span></div>
        </div>
        <div class="device mobile">
          <div class="mobile-bar">ORCHESTRA <button>Menu</button></div>
          <div class="mobile-hero" style="--ink:${direction.tokens.palette[0]};--paper:${direction.tokens.palette[1]};--accent:${direction.tokens.palette[2]}"><p>For ${escapeHtml(brief.audience)}</p><h2>${escapeHtml(brief.offer)}</h2><button>${escapeHtml(brief.cta)}</button></div>
        </div>
      </section>
      <section class="details">
        <div><h3>Palette</h3><div class="palette">${palette}</div></div>
        <div><h3>Type</h3><p class="type"><em>${escapeHtml(direction.typography.display)}</em> + ${escapeHtml(direction.typography.body)}</p><p>${escapeHtml(direction.typography.treatment)}</p></div>
        <div><h3>Art direction</h3><p>${escapeHtml(direction.imagery)}</p></div>
        <div><h3>Motion</h3><p>${escapeHtml(direction.motion)}</p></div>
      </section>
      <section class="sequence"><h3>Conversion sequence</h3><ol>${sections}</ol></section>
      <p class="rationale"><b>Why this works:</b> ${escapeHtml(direction.rationale)}</p>
      <p class="risk"><b>Guardrail:</b> ${escapeHtml(direction.risks.join(" "))}</p>
      <button class="select" data-select="${escapeHtml(direction.id)}">Select this direction in chat →</button>
    </article>`;
  }).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Design Orchestra · Three directions</title>
  <style>
  :root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#171719;background:#efede7;line-height:1.5}*{box-sizing:border-box}body{margin:0;padding:clamp(20px,5vw,72px)}header{max-width:1260px;margin:auto;border-bottom:1px solid #c9c5bb;padding-bottom:28px}h1{font-size:clamp(2.4rem,6vw,5rem);line-height:.92;letter-spacing:-.06em;max-width:850px;margin:24px 0}.eyebrow,.label{text-transform:uppercase;letter-spacing:.12em;font-size:.72rem;font-weight:700}.intro{max-width:650px}.controls{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}.controls button,.select,button{font:inherit;cursor:pointer;border:1px solid currentColor;background:transparent;padding:9px 13px;border-radius:999px}.controls button[aria-pressed=true],.select{background:#171719;color:#fff}.direction{display:none;max-width:1260px;margin:44px auto}.direction.active{display:block}.layout{display:grid;grid-template-columns:minmax(0,3fr) minmax(220px,1fr);gap:26px;align-items:end}.device{background:#fff;box-shadow:0 12px 36px #2222;border:1px solid #c9c5bb;overflow:hidden}.nav,.mobile-bar{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;font-size:.75rem;letter-spacing:.06em;font-weight:800}.nav span{font-weight:500;letter-spacing:0}.nav button,.mobile-bar button{padding:6px 10px}.hero{min-height:420px;padding:clamp(26px,6vw,86px);background:var(--paper);color:var(--ink);display:flex;flex-direction:column;justify-content:end;position:relative;isolation:isolate}.hero:before{content:"";position:absolute;width:45%;aspect-ratio:1;right:9%;top:13%;border-radius:50% 20% 50% 10%;background:var(--accent);opacity:.88;z-index:-1}.hero p,.mobile-hero p{font-weight:700;text-transform:uppercase;letter-spacing:.1em;font-size:.75rem}.hero h1{font-size:clamp(3.2rem,7vw,7rem);max-width:900px;margin:8px 0 26px}.hero-row{display:flex;gap:18px;align-items:center}.hero button,.mobile-hero button{background:var(--ink);color:var(--paper);border-color:var(--ink)}.proof{padding:22px;display:flex;gap:28px;border-top:1px solid #c9c5bb}.proof span{max-width:430px}.mobile{max-width:330px;margin-left:auto}.mobile-bar{font-size:.62rem}.mobile-hero{background:var(--paper);color:var(--ink);padding:70px 20px 24px;min-height:425px;display:flex;flex-direction:column;justify-content:end}.mobile-hero h2{font-size:2.8rem;line-height:.93;letter-spacing:-.06em;margin:5px 0 22px}.details{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin:30px 0}.details>div,.sequence{border-top:1px solid #76726a;padding-top:10px}.details h3,.sequence h3{font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;margin:0 0 10px}.details p{font-size:.88rem;margin:0}.type em{font-family:Georgia,serif;font-size:1.25rem}.palette{display:flex;gap:5px;flex-wrap:wrap}.swatch{background:var(--swatch);color:#fff;padding:5px 7px;font-size:.62rem;border-radius:3px;text-shadow:0 1px 2px #0008}.sequence ol{padding:0;list-style:none;display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.sequence li{font-size:.82rem}.sequence b{color:#777}.rationale,.risk{max-width:800px}.risk{color:#7a281d}.select{margin-top:10px}.footer-note{max-width:1260px;margin:60px auto 0;font-size:.78rem;color:#5f5b54}@media(max-width:760px){body{padding:20px}.layout{grid-template-columns:1fr}.desktop{order:2}.mobile{order:1;margin:0;max-width:100%}.details{grid-template-columns:1fr 1fr}.sequence ol{grid-template-columns:1fr 1fr}.nav span{display:none}.proof{display:block}.proof span{display:block;margin-top:8px}}@media(max-width:420px){.details{grid-template-columns:1fr}.sequence ol{grid-template-columns:1fr}}@media(prefers-reduced-motion:no-preference){.direction.active{animation:enter .36s ease-out}@keyframes enter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}}
  </style></head><body><header><p class="eyebrow">Design Orchestra · concept round</p><h1>Three materially distinct ways to make the same promise.</h1><p class="intro">Brief: ${escapeHtml(brief.offer)}. Review one direction at a time, then make an explicit selection in your coding-agent conversation. No implementation should be edited before that selection.</p><div class="controls" role="tablist" aria-label="Moodboard directions">${directions.map((d, i) => `<button role="tab" aria-selected="${i === 0}" aria-pressed="${i === 0}" data-tab="${i}">0${i + 1} · ${escapeHtml(d.name)}</button>`).join("")}</div></header><main>${cards}</main><p class="footer-note">Seed: ${escapeHtml(directions[0].seed)} · Generated locally by Design Orchestra. The gallery is a decision artifact, not a substitute for user selection.</p><script>const tabs=[...document.querySelectorAll('[data-tab]')],dirs=[...document.querySelectorAll('.direction')];tabs.forEach(t=>t.addEventListener('click',()=>{const n=Number(t.dataset.tab);tabs.forEach((x,i)=>{x.setAttribute('aria-selected',String(i===n));x.setAttribute('aria-pressed',String(i===n))});dirs.forEach((x,i)=>x.classList.toggle('active',i===n))}));document.querySelectorAll('[data-select]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.select;navigator.clipboard?.writeText(id);b.textContent='Selected: '+id+' — paste this into chat';}));</script></body></html>`;
}

export function relativeLuminance(hex: string): number {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) throw new Error(`Invalid color: ${hex}`);
  const channels = [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

export function contrastRatio(foreground: string, background: string): number {
  const [light, dark] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

export function validateBrief(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (!value || typeof value !== "object") return { valid: false, errors: ["Brief must be an object."], warnings: [] };
  const brief = value as Partial<BriefV1>;
  const required = ["audience", "offer", "cta", "brand", "tone", "mediaPreference"] as const;
  for (const key of required) if (typeof brief[key] !== "string" || !brief[key].trim()) errors.push(`Brief.${key} is required.`);
  if (!Array.isArray(brief.proof)) errors.push("Brief.proof must be an array; use an empty array when proof is unavailable.");
  if (brief.colorPalette && (!Array.isArray(brief.colorPalette.colors) || brief.colorPalette.colors.length < 2 || brief.colorPalette.colors.some((color) => !/^#[0-9a-f]{6}$/i.test(color)))) {
    errors.push("Brief.colorPalette must contain at least two six-digit hex colors.");
  }
  if (brief.version !== 1) errors.push("Brief.version must be 1.");
  if (brief.mode !== "create" && brief.mode !== "redesign") errors.push("Brief.mode must be create or redesign.");
  return { valid: errors.length === 0, errors, warnings: [] };
}

export function validateAssetLedger(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (!value || typeof value !== "object" || !Array.isArray((value as AssetLedgerV1).assets)) return { valid: false, errors: ["Asset ledger requires an assets array."], warnings: [] };
  for (const [index, asset] of (value as AssetLedgerV1).assets.entries()) {
    for (const key of ["localPath", "origin", "license", "alt"] as const) if (!asset[key]?.trim()) errors.push(`assets[${index}].${key} is required.`);
    if (!asset.localPath.startsWith(".") && !asset.localPath.startsWith("assets/") && !asset.localPath.startsWith("public/")) errors.push(`assets[${index}].localPath must be a local project path.`);
  }
  return { valid: errors.length === 0, errors, warnings: [] };
}
