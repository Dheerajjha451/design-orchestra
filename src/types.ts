export const PROVIDERS = ["codex", "claude", "cursor", "gemini", "copilot"] as const;
export type Provider = (typeof PROVIDERS)[number];
export type Scope = "project" | "global";

export interface ConfigV1 {
  version: 1;
  providers: Provider[];
  scope: Scope;
  framework: {
    detected: "next" | "vite" | "react" | "tailwind" | "component-library" | "unknown";
    autoDetect: boolean;
  };
  mediaPolicy: {
    allowGeneratedImages: boolean;
    allowWebSearch: boolean;
    requireVerifiedReuseTerms: boolean;
    requireLocalCopies: boolean;
  };
  approvedIconLibraries: string[];
  qualityThresholds: {
    wcagLevel: "AA";
    minContrastText: number;
    minLighthousePerformance: number;
    minLighthouseAccessibility: number;
    maxSeriousAxeViolations: number;
  };
  seed?: string;
}

export interface BriefV1 {
  version: 1;
  mode: "create" | "redesign";
  audience: string;
  offer: string;
  cta: string;
  proof: string[];
  brand: string;
  tone: string;
  constraints: string[];
  mediaPreference: "generated" | "search" | "brand-assets" | "no-images" | "mixed";
  colorPalette?: {
    colors: string[];
    source?: string;
  };
  designFamilies?: string[];
  sections?: string[];
  navigationPreference?: string;
  emotionalResponse?: string;
  antiReferences?: string[];
  motionPreference?: "none" | "subtle" | "expressive";
  animationTechnology?: "css" | "framer-motion" | "gsap" | "3d" | "none" | "undecided";
}

export interface StyleFingerprint {
  composition: number;
  density: number;
  geometry: number;
  typography: number;
  color: number;
  imagery: number;
  motion: number;
}

export interface DirectionV1 {
  version: 1;
  id: string;
  name: string;
  seed: string;
  archetypes: string[];
  fingerprint: StyleFingerprint;
  tokens: {
    palette: string[];
    paletteSource: string;
    radius: string;
    spacing: string;
    border: string;
  };
  typography: {
    display: string;
    body: string;
    scale: string;
    treatment: string;
  };
  composition: string;
  navigation: string;
  sections: string[];
  imagery: string;
  motion: string;
  conversionStructure: string[];
  rationale: string;
  risks: string[];
}

export interface SelectionV1 {
  version: 1;
  directionId: string;
  adjustments: string[];
  approvedAt?: string;
}

export interface AssetLedgerEntry {
  localPath: string;
  origin: string;
  license: string;
  attribution?: string;
  generation?: {
    provider: string;
    promptSummary: string;
    seed?: string;
    generatedAt: string;
  };
  alt: string;
  width?: number;
  height?: number;
}

export interface AssetLedgerV1 {
  version: 1;
  assets: AssetLedgerEntry[];
}

export interface DesignArchetype {
  id: string;
  name: string;
  suitability: string[];
  accessibilityRisk: "low" | "medium" | "high";
  compatibleWith: string[];
  antiPatterns: string[];
  fingerprint: StyleFingerprint;
}

export interface InstallRecord {
  version: 1;
  packageVersion: string;
  scope: Scope;
  providers: Provider[];
  files: Record<string, string>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
