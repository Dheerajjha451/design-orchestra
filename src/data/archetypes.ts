import type { DesignArchetype, StyleFingerprint } from "../types.js";

const f = (
  composition: number,
  density: number,
  geometry: number,
  typography: number,
  color: number,
  imagery: number,
  motion: number,
): StyleFingerprint => ({ composition, density, geometry, typography, color, imagery, motion });

type Seed = Omit<DesignArchetype, "fingerprint"> & { axes: number[] };
const seeds: Seed[] = [
  { id: "functional-minimalism", name: "Functional minimalism", suitability: ["developer tools", "healthcare", "B2B SaaS"], accessibilityRisk: "low", compatibleWith: ["warm-humanist", "bento"], antiPatterns: ["empty space without hierarchy", "low-contrast chrome"], axes: [1, 1, 2, 2, 1, 1, 1] },
  { id: "editorial-minimalism", name: "Editorial minimalism", suitability: ["portfolio", "culture", "premium services"], accessibilityRisk: "medium", compatibleWith: ["magazine-editorial", "monochrome"], antiPatterns: ["tiny type", "ornament replacing navigation"], axes: [2, 1, 2, 5, 2, 2, 1] },
  { id: "luxury-minimalism", name: "Luxury minimalism", suitability: ["hospitality", "beauty", "high-end retail"], accessibilityRisk: "medium", compatibleWith: ["art-deco", "cinematic"], antiPatterns: ["weak contrast", "generic serif glamour"], axes: [2, 1, 3, 4, 2, 3, 1] },
  { id: "maximalist-collage", name: "Maximalist collage", suitability: ["music", "events", "youth brands"], accessibilityRisk: "high", compatibleWith: ["retro-y2k", "playful"], antiPatterns: ["competing CTAs", "unreadable overlays"], axes: [5, 5, 5, 4, 5, 5, 4] },
  { id: "swiss", name: "Swiss grid", suitability: ["institutions", "software", "architecture"], accessibilityRisk: "low", compatibleWith: ["typographic-poster", "monochrome"], antiPatterns: ["rigidity without rhythm", "mechanical copy"], axes: [4, 3, 3, 5, 3, 2, 1] },
  { id: "bauhaus", name: "Bauhaus", suitability: ["creative studios", "education", "products"], accessibilityRisk: "medium", compatibleWith: ["neo-brutalist", "playful"], antiPatterns: ["decorative geometry hiding content", "primary-color overload"], axes: [4, 3, 5, 3, 5, 2, 2] },
  { id: "neo-brutalist", name: "Neo-brutalist", suitability: ["independent products", "communities", "creator tools"], accessibilityRisk: "medium", compatibleWith: ["bauhaus", "typographic-poster"], antiPatterns: ["hostile interaction", "unreadable all-caps"], axes: [4, 4, 5, 4, 4, 2, 3] },
  { id: "magazine-editorial", name: "Magazine editorial", suitability: ["publishing", "fashion", "thought leadership"], accessibilityRisk: "medium", compatibleWith: ["editorial-minimalism", "cinematic"], antiPatterns: ["article-like CTA burial", "inconsistent type hierarchy"], axes: [4, 3, 2, 5, 3, 4, 2] },
  { id: "art-deco", name: "Art Deco", suitability: ["hospitality", "events", "luxury"], accessibilityRisk: "medium", compatibleWith: ["luxury-minimalism", "retro-futurist"], antiPatterns: ["ornamental overload", "thin gold on white"], axes: [3, 3, 5, 4, 4, 2, 2] },
  { id: "retro-y2k", name: "Retro Y2K", suitability: ["consumer apps", "music", "gaming"], accessibilityRisk: "high", compatibleWith: ["maximalist-collage", "playful"], antiPatterns: ["nostalgia masking clarity", "low-contrast gradients"], axes: [5, 5, 4, 3, 5, 4, 4] },
  { id: "retro-futurist", name: "Retro-futurist", suitability: ["technology", "events", "creative tools"], accessibilityRisk: "medium", compatibleWith: ["art-deco", "dark-tech"], antiPatterns: ["fake sci-fi metrics", "neon contrast failures"], axes: [4, 4, 5, 4, 5, 4, 4] },
  { id: "organic", name: "Organic", suitability: ["wellness", "food", "climate"], accessibilityRisk: "low", compatibleWith: ["warm-humanist", "soft-dimensional"], antiPatterns: ["muddy palettes", "decorative blobs everywhere"], axes: [3, 2, 1, 3, 3, 4, 2] },
  { id: "playful", name: "Playful", suitability: ["education", "family", "consumer"], accessibilityRisk: "medium", compatibleWith: ["bauhaus", "retro-y2k"], antiPatterns: ["childish tone mismatch", "animation overload"], axes: [4, 4, 4, 3, 5, 4, 4] },
  { id: "cinematic", name: "Cinematic", suitability: ["travel", "entertainment", "luxury"], accessibilityRisk: "high", compatibleWith: ["luxury-minimalism", "magazine-editorial"], antiPatterns: ["text over busy images", "slow hero video"], axes: [3, 2, 2, 4, 3, 5, 3] },
  { id: "typographic-poster", name: "Typographic poster", suitability: ["portfolio", "events", "creative studios"], accessibilityRisk: "medium", compatibleWith: ["swiss", "neo-brutalist"], antiPatterns: ["display type used as body text", "clipped critical copy"], axes: [4, 3, 3, 5, 4, 1, 3] },
  { id: "industrial", name: "Industrial", suitability: ["manufacturing", "hardware", "B2B"], accessibilityRisk: "low", compatibleWith: ["dark-tech", "swiss"], antiPatterns: ["cold jargon", "unnecessary dashboard density"], axes: [3, 4, 4, 3, 2, 2, 2] },
  { id: "warm-humanist", name: "Warm humanist", suitability: ["nonprofit", "healthcare", "local services"], accessibilityRisk: "low", compatibleWith: ["organic", "functional-minimalism"], antiPatterns: ["sentiment without proof", "overly precious copy"], axes: [2, 2, 1, 3, 3, 4, 2] },
  { id: "monochrome", name: "Monochrome", suitability: ["architecture", "fashion", "developer tools"], accessibilityRisk: "medium", compatibleWith: ["swiss", "editorial-minimalism"], antiPatterns: ["contrast relying only on hue", "indistinct actions"], axes: [2, 2, 3, 4, 1, 2, 1] },
  { id: "dark-tech", name: "Dark tech", suitability: ["developer tools", "security", "AI"], accessibilityRisk: "medium", compatibleWith: ["industrial", "glass"], antiPatterns: ["glow everywhere", "dark gray text on black"], axes: [3, 3, 4, 3, 4, 3, 3] },
  { id: "cyberpunk", name: "Cyberpunk", suitability: ["games", "experiential launches", "music"], accessibilityRisk: "high", compatibleWith: ["retro-futurist", "kinetic-experimental"], antiPatterns: ["illegible neon", "theme over task completion"], axes: [5, 5, 5, 4, 5, 4, 5] },
  { id: "glass", name: "Translucent glass", suitability: ["consumer apps", "AI products", "finance"], accessibilityRisk: "high", compatibleWith: ["dark-tech", "soft-dimensional"], antiPatterns: ["unreadable transparent panels", "excessive blur"], axes: [3, 3, 3, 3, 4, 3, 3] },
  { id: "soft-dimensional", name: "Soft dimensional", suitability: ["wellness", "consumer products", "education"], accessibilityRisk: "medium", compatibleWith: ["organic", "glass"], antiPatterns: ["fake depth as affordance", "low-elevation controls"], axes: [3, 2, 2, 3, 3, 3, 2] },
  { id: "bento", name: "Bento system", suitability: ["SaaS", "developer tools", "product launches"], accessibilityRisk: "low", compatibleWith: ["functional-minimalism", "dark-tech"], antiPatterns: ["card soup", "identical hierarchy in every tile"], axes: [4, 4, 4, 3, 3, 3, 2] },
  { id: "kinetic-experimental", name: "Kinetic experimental", suitability: ["creative technology", "events", "portfolios"], accessibilityRisk: "high", compatibleWith: ["cyberpunk", "typographic-poster"], antiPatterns: ["motion as navigation", "ignoring reduced motion"], axes: [5, 4, 4, 5, 5, 3, 5] }
];

export const ARCHETYPES: DesignArchetype[] = seeds.map(({ axes, ...item }) => ({
  ...item,
  fingerprint: f(...(axes as [number, number, number, number, number, number, number])),
}));
