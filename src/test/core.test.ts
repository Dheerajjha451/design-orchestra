import assert from "node:assert/strict";
import test from "node:test";
import {
  contrastRatio,
  createDirections,
  renderMoodboardHtml,
  styleDistance,
  validateAssetLedger,
  validateBrief,
  compatible,
} from "../core.js";
import { ARCHETYPES } from "../data/archetypes.js";
import type { BriefV1 } from "../types.js";

const brief: BriefV1 = {
  version: 1,
  mode: "create",
  audience: "developer tools teams",
  offer: "Ship a calm release workflow",
  cta: "Start a project",
  proof: [],
  brand: "An opinionated developer tool",
  tone: "clear and optimistic",
  constraints: [],
  mediaPreference: "no-images",
  animationTechnology: "css",
};

test("seeds are reproducible and produce exactly three candidates", () => {
  const first = createDirections(brief, "repeatable-seed");
  const second = createDirections(brief, "repeatable-seed");
  assert.equal(first.length, 3);
  assert.deepEqual(first, second);
});

test("directions have material visual separation", () => {
  const directions = createDirections(brief, "separation-seed");
  for (let index = 0; index < directions.length; index += 1) {
    for (let other = index + 1; other < directions.length; other += 1) {
      assert.ok(styleDistance(directions[index]!.fingerprint, directions[other]!.fingerprint) >= 12);
    }
  }
  assert.equal(new Set(directions.map((direction) => direction.navigation)).size, 3);
});

test("user-selected sections and navigation are respected", () => {
  const directions = createDirections({
    ...brief,
    sections: ["Hero", "Product demo", "Contact"],
    navigationPreference: "Editorial masthead with a contact anchor.",
  }, "brief-choices");
  assert.deepEqual(directions[0]!.sections, ["Hero", "Product demo", "Contact"]);
  assert.equal(directions[0]!.navigation, "Editorial masthead with a contact anchor.");
});

test("archetype catalog is complete and bounded", () => {
  assert.ok(ARCHETYPES.length >= 24);
  for (const archetype of ARCHETYPES) for (const score of Object.values(archetype.fingerprint)) assert.ok(score >= 0 && score <= 5);
});

test("contrast uses WCAG relative luminance", () => {
  assert.equal(contrastRatio("#000000", "#ffffff"), 21);
  assert.ok(contrastRatio("#767676", "#ffffff") > 4.5);
});

test("schemas reject missing proof and asset provenance", () => {
  assert.equal(validateBrief({ ...brief, proof: undefined }).valid, false);
  assert.equal(validateBrief({ ...brief, colorPalette: { colors: ["not-a-color"] } }).valid, false);
  assert.equal(validateAssetLedger({ version: 1, assets: [{ localPath: "assets/x.png", origin: "", license: "CC0", alt: "" }] }).valid, false);
});

test("validateAssetLedger handles missing localPath and non-object entries gracefully", () => {
  const missingPathResult = validateAssetLedger({
    version: 1,
    assets: [{ origin: "generated", license: "CC0", alt: "Test" }],
  });
  assert.equal(missingPathResult.valid, false);
  assert.ok(missingPathResult.errors.some((err) => err.includes("localPath is required")));

  const nonObjectResult = validateAssetLedger({
    version: 1,
    assets: [null, "invalid"],
  });
  assert.equal(nonObjectResult.valid, false);
  assert.ok(nonObjectResult.errors.some((err) => err.includes("must be an object")));
});

test("retro-y2k archetype compatibility matches correctly", () => {
  const retroY2k = ARCHETYPES.find((a) => a.id === "retro-y2k");
  const maximalist = ARCHETYPES.find((a) => a.id === "maximalist-collage");
  const playful = ARCHETYPES.find((a) => a.id === "playful");
  assert.ok(retroY2k && maximalist && playful);
  assert.ok(compatible(retroY2k, maximalist));
  assert.ok(compatible(retroY2k, playful));
});

test("validateBrief validates enum fields strictly", () => {
  assert.equal(validateBrief({ ...brief, mediaPreference: "invalid-pref" as any }).valid, false);
  assert.equal(validateBrief({ ...brief, motionPreference: "invalid-motion" as any }).valid, false);
  assert.equal(validateBrief({ ...brief, animationTechnology: "invalid-tech" as any }).valid, false);
});

test("moodboard rendering safely handles 2-color palettes without undefined accents", () => {
  const directions = createDirections({
    ...brief,
    colorPalette: { colors: ["#000000", "#FFFFFF"] },
  }, "two-color-palette");
  const html = renderMoodboardHtml(brief, directions);
  assert.doesNotMatch(html, /--accent:undefined/);
  assert.match(html, /--accent:#000000/);
});

test("a user palette is preserved over the fallback palette", () => {
  const directions = createDirections({ ...brief, colorPalette: { colors: ["#101010", "#F5F1EA", "#D7263D"], source: "Brand guide" } }, "brand-palette");
  assert.deepEqual(directions[0]!.tokens.palette, ["#101010", "#F5F1EA", "#D7263D"]);
  assert.equal(directions[0]!.tokens.paletteSource, "Brand guide");
});

test("gallery is self-contained and preserves selection gate", () => {
  const directions = createDirections(brief, "gallery");
  const html = renderMoodboardHtml(brief, directions);
  assert.match(html, /Direction 01/);
  assert.match(html, /Direction 02/);
  assert.match(html, /Direction 03/);
  assert.match(html, /Select this direction in chat/);
  assert.doesNotMatch(html, /AI\s*99%|live status|cinematic showcase|blur\(/i);
});
