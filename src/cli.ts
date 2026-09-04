#!/usr/bin/env node
import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, rmdir, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_CONFIG,
  createDirections,
  createRandomSeed,
  renderMoodboardHtml,
  validateAssetLedger,
  validateBrief,
} from "./core.js";
import { AGENTS } from "./data/agents.js";
import { ARCHETYPES } from "./data/archetypes.js";
import { PROVIDERS, type ConfigV1, type InstallRecord, type Provider, type Scope } from "./types.js";

const PACKAGE_VERSION = "0.1.2";
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const templateRoot = join(packageRoot, "templates");
const ledgerName = ".design-orchestra-install.json";

interface CliOptions {
  providers?: Provider[];
  scope: Scope;
  dryRun: boolean;
  force: boolean;
  yes: boolean;
  seed?: string;
  briefPath?: string;
  out?: string;
  packageRoot?: string;
  target?: string;
}

interface ManagedFile {
  target: string;
  content: string;
}

const help = () => {
  console.log("Design Orchestra v" + PACKAGE_VERSION);
  console.log("Usage: design-orchestra <init|update|doctor|validate|uninstall|concepts> [options]");
  console.log("Options: --provider codex,claude,cursor,gemini,copilot --scope project|global --dry-run --yes --force");
};

function parseArgs(argv: string[]): { command: string; options: CliOptions } {
  const [command = "help", ...rest] = argv;
  const options: CliOptions = { scope: "project", dryRun: false, force: false, yes: false };
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    const value = () => {
      const val = rest[++index];
      if (val === undefined || val.startsWith("--")) throw new Error(`Option ${arg} requires a value.`);
      return val;
    };
    if (arg === "--provider") {
      const input = value();
      const parsed = input.split(",").map((provider) => provider.trim()).filter(Boolean);
      const invalid = parsed.filter((provider) => !PROVIDERS.includes(provider as Provider));
      if (invalid.length) throw new Error("Unsupported provider: " + invalid.join(", "));
      options.providers = [...new Set(parsed as Provider[])];
    } else if (arg === "--scope") {
      const scope = value();
      if (scope !== "project" && scope !== "global") throw new Error("--scope must be project or global.");
      options.scope = scope;
    } else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--yes") options.yes = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--seed") options.seed = value();
    else if (arg === "--brief") options.briefPath = value();
    else if (arg === "--out") options.out = value();
    else if (arg === "--package-root") options.packageRoot = value();
    else if (arg === "--target") options.target = value();
    else if (arg === "--help" || arg === "-h") return { command: "help", options };
    else throw new Error("Unknown option: " + arg);
  }
  return { command, options };
}

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

async function sha(path: string): Promise<string> {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function contentSha(content: string): Promise<string> {
  return createHash("sha256").update(content).digest("hex");
}

const EXCLUDED_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build"]);

async function listFiles(root: string, skipIgnored = false): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    if (skipIgnored && EXCLUDED_DIRS.has(entry.name)) return [];
    const path = join(root, entry.name);
    return entry.isDirectory() ? listFiles(path, skipIgnored) : [path];
  }));
  return files.flat();
}

async function readRecord(root: string): Promise<InstallRecord | undefined> {
  const path = join(root, ledgerName);
  if (!(await exists(path))) return undefined;
  try {
    const data = JSON.parse(await readFile(path, "utf8")) as InstallRecord;
    return data.version === 1 && data.files ? data : undefined;
  } catch { return undefined; }
}

async function detectFramework(root: string): Promise<ConfigV1["framework"]["detected"]> {
  const packageFile = join(root, "package.json");
  if (await exists(packageFile)) {
    try {
      const pkg = JSON.parse(await readFile(packageFile, "utf8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
      if (dependencies.next) return "next";
      if (dependencies.vite) return "vite";
      if (dependencies.tailwindcss) return "tailwind";
      if (dependencies.react) return "react";
      if (dependencies["@radix-ui/react-dialog"] || dependencies["@mui/material"] || dependencies["@chakra-ui/react"]) return "component-library";
    } catch {
      // A malformed package manifest is user-owned; leave framework unknown and let doctor report normal install health.
    }
  }
  return "unknown";
}

async function detectProviders(root: string): Promise<Provider[]> {
  const candidates: Array<[Provider, string]> = [
    ["codex", ".codex"], ["claude", ".claude"], ["cursor", ".cursor"], ["gemini", ".gemini"], ["copilot", ".github"],
  ];
  const present = (await Promise.all(candidates.map(async ([provider, directory]) => [provider, await exists(join(root, directory))] as const)))
    .filter(([, found]) => found).map(([provider]) => provider);
  return present.length ? present : ["codex"];
}

function installRoot(cwd: string, scope: Scope): string {
  return scope === "global" ? join(homedir(), ".design-orchestra") : cwd;
}

function agentDestination(root: string, provider: Provider, agent: string): string {
  const base: Record<Provider, string> = {
    codex: join(root, ".codex", "agents"),
    claude: join(root, ".claude", "agents"),
    cursor: join(root, ".cursor", "agents"),
    gemini: join(root, ".gemini", "agents"),
    copilot: join(root, ".github", "agents"),
  };
  return join(base[provider], provider === "codex" ? agent + ".toml" : provider === "copilot" ? agent + ".agent.md" : agent + ".md");
}

function agentContent(provider: Provider, agent: (typeof AGENTS)[number]): string {
  if (provider === "codex") {
    const quote = agent.instructions.replace(/"""/g, "\\\"\\\"\\\"");
    return "name = \"" + agent.name + "\"\n" +
      "description = \"" + agent.description.replace(/"/g, "\\\"") + "\"\n" +
      "sandbox_mode = \"" + agent.sandbox + "\"\n" +
      "developer_instructions = \"\"\"\n" + quote + "\n\"\"\"\n";
  }
  const frontmatter = "---\nname: " + agent.name + "\ndescription: " + agent.description + "\n---";
  return frontmatter + "\n\n# " + agent.name + "\n\n" + agent.instructions + "\n";
}

async function templateSkills(): Promise<Array<{ name: string; relative: string; content: string }>> {
  const root = join(templateRoot, "skills");
  const files = await listFiles(root);
  return Promise.all(files.map(async (source) => ({
    name: basename(dirname(source)),
    relative: relative(root, source),
    content: await readFile(source, "utf8"),
  })));
}

function pluginManifest(kind: "codex" | "claude" | "gemini"): string {
  if (kind === "codex") return JSON.stringify({
    name: "design-orchestra", version: PACKAGE_VERSION, description: "Evidence-led, three-direction React landing-page workflow.",
    author: { name: "Design Orchestra Contributors" }, license: "MIT", skills: "./skills/",
    interface: { displayName: "Design Orchestra", shortDescription: "Three-direction landing-page design workflow", longDescription: "Brief, distinct art directions, selection gate, implementation, and review.", developerName: "Design Orchestra Contributors", category: "Productivity", capabilities: ["Skills"], defaultPrompt: "Use Design Orchestra to create or redesign a landing page.", brandColor: "#171719" },
  }, null, 2) + "\n";
  if (kind === "claude") return JSON.stringify({
    name: "design-orchestra", version: PACKAGE_VERSION, description: "Evidence-led, three-direction React landing-page workflow.",
  }, null, 2) + "\n";
  return JSON.stringify({
    name: "design-orchestra", version: PACKAGE_VERSION, description: "Portable skills and specialist agents for React landing-page design.",
  }, null, 2) + "\n";
}

async function plannedFiles(root: string, providers: Provider[], scope: Scope): Promise<ManagedFile[]> {
  const files: ManagedFile[] = [];
  const skills = await templateSkills();
  const skillRoots = new Set<string>();
  if (providers.some((provider) => provider !== "claude")) skillRoots.add(join(root, ".agents", "skills"));
  if (providers.includes("claude")) skillRoots.add(join(root, ".claude", "skills"));
  for (const skillRoot of skillRoots) for (const skill of skills) files.push({ target: join(skillRoot, skill.relative), content: skill.content });
  for (const provider of providers) for (const agent of AGENTS) files.push({ target: agentDestination(root, provider, agent.name), content: agentContent(provider, agent) });

  const artifacts = join(root, ".design-orchestra", "plugins");
  for (const kind of ["codex", "claude", "gemini"] as const) {
    const manifestPath = kind === "codex" ? join(artifacts, kind, ".codex-plugin", "plugin.json")
      : kind === "claude" ? join(artifacts, kind, ".claude-plugin", "plugin.json")
        : join(artifacts, kind, "gemini-extension.json");
    files.push({ target: manifestPath, content: pluginManifest(kind) });
    for (const skill of skills) files.push({ target: join(artifacts, kind, "skills", skill.relative), content: skill.content });
    if (kind !== "codex") for (const agent of AGENTS) files.push({ target: join(artifacts, kind, "agents", agent.name + ".md"), content: agentContent(kind === "claude" ? "claude" : "gemini", agent) });
  }
  const config: ConfigV1 = {
    ...DEFAULT_CONFIG,
    providers,
    scope,
    framework: { detected: await detectFramework(root), autoDetect: true },
  };
  files.push({ target: join(root, "design-orchestra.config.json"), content: JSON.stringify(config, null, 2) + "\n" });
  return files;
}

async function writeManaged(root: string, files: ManagedFile[], prior: InstallRecord | undefined, options: CliOptions): Promise<{ records: Record<string, string>; conflicts: string[] }> {
  const records = { ...(prior?.files ?? {}) };
  const conflicts: string[] = [];
  for (const item of files) {
    const relativeTarget = relative(root, item.target);
    const nextHash = await contentSha(item.content);
    const priorHash = prior?.files[relativeTarget];
    const found = await exists(item.target);
    const unchanged = found && priorHash ? (await sha(item.target)) === priorHash : false;
    if (found && !unchanged && !options.force) {
      conflicts.push(relativeTarget);
      continue;
    }
    if (!options.dryRun) {
      await mkdir(dirname(item.target), { recursive: true });
      await writeFile(item.target, item.content, "utf8");
    }
    records[relativeTarget] = nextHash;
    console.log((options.dryRun ? "would write " : "wrote ") + relativeTarget);
  }
  return { records, conflicts };
}

async function init(cwd: string, options: CliOptions, updating = false): Promise<number> {
  const root = installRoot(cwd, options.scope);
  const prior = await readRecord(root);
  const providers = options.providers ?? prior?.providers ?? await detectProviders(cwd);
  const files = await plannedFiles(root, providers, options.scope);
  const result = await writeManaged(root, files, prior, options);
  if (!options.dryRun) {
    const record: InstallRecord = { version: 1, packageVersion: PACKAGE_VERSION, scope: options.scope, providers, files: result.records };
    await writeFile(join(root, ledgerName), JSON.stringify(record, null, 2) + "\n");
  }
  if (result.conflicts.length) {
    console.warn("Preserved modified or unowned files (rerun with --force to overwrite):\n" + result.conflicts.map((file) => "  - " + file).join("\n"));
    return 2;
  }
  console.log((updating ? "Updated" : "Installed") + " Design Orchestra for " + providers.join(", ") + " at " + root);
  return 0;
}

async function doctor(cwd: string, options: CliOptions): Promise<number> {
  const root = installRoot(cwd, options.scope);
  const record = await readRecord(root);
  const checks: Array<[string, boolean, string]> = [
    ["Node.js 20+", Number(process.versions.node.split(".")[0]) >= 20, process.version],
    ["installer record", Boolean(record), record ? "found" : "run design-orchestra init"],
    ["portable skills", await exists(join(root, ".agents", "skills")) || await exists(join(root, ".claude", "skills")), "required by selected host(s)"],
  ];
  if (record) for (const [file, expected] of Object.entries(record.files)) checks.push([file, await exists(join(root, file)) && await sha(join(root, file)) === expected, "modified or missing files are preserved"]);
  checks.forEach(([name, pass, detail]) => console.log((pass ? "✓ " : "✗ ") + name + " — " + detail));
  return checks.every(([, pass]) => pass) ? 0 : 2;
}

async function validate(root: string, target?: string): Promise<number> {
  const errors: string[] = [];
  const skillsRoot = join(root, "templates", "skills");
  if (!(await exists(skillsRoot))) errors.push("Missing templates/skills.");
  else {
    const skills = await listFiles(skillsRoot);
    const markdown = skills.filter((file) => basename(file) === "SKILL.md");
    if (markdown.length !== 6) errors.push("Expected exactly six SKILL.md files.");
    for (const file of markdown) {
      const content = await readFile(file, "utf8");
      const normalized = content.replace(/\r\n/g, "\n");
      const expected = basename(dirname(file));
      if (!normalized.startsWith("---\nname: " + expected + "\n")) errors.push("Invalid skill frontmatter: " + relative(root, file));
      if (!/description: .+/.test(normalized)) errors.push("Missing skill description: " + relative(root, file));
    }
  }
  if (AGENTS.length !== 5) errors.push("Expected five provider-neutral agents.");
  if (ARCHETYPES.length < 24) errors.push("Expected at least 24 archetypes.");
  for (const archetype of ARCHETYPES) if (Object.values(archetype.fingerprint).some((axis) => axis < 0 || axis > 5)) errors.push("Invalid fingerprint: " + archetype.id);
  for (const kind of ["codex", "claude", "gemini"] as const) {
    try {
      const manifest = JSON.parse(pluginManifest(kind)) as Record<string, unknown>;
      if (manifest.name !== "design-orchestra" || manifest.version !== PACKAGE_VERSION || typeof manifest.description !== "string") errors.push("Invalid " + kind + " plugin manifest.");
      if (kind === "codex" && manifest.skills !== "./skills/") errors.push("Codex plugin manifest must expose skills.");
    } catch { errors.push("Malformed " + kind + " plugin manifest."); }
  }
  const briefResult = validateBrief({ version: 1, mode: "create", audience: "test", offer: "test", cta: "test", proof: [], brand: "test", tone: "test", constraints: [], mediaPreference: "no-images" });
  if (!briefResult.valid) errors.push(...briefResult.errors);
  const ledgerResult = validateAssetLedger({ version: 1, assets: [{ localPath: "assets/test.png", origin: "generated", license: "owned", alt: "Test asset" }] });
  if (!ledgerResult.valid) errors.push(...ledgerResult.errors);
  if (target) {
    const targetRoot = resolve(target);
    const targetFiles = await listFiles(targetRoot, true);
    for (const file of targetFiles.filter((file) => /\.(?:[cm]?[jt]sx?|html)$/i.test(file))) {
      const source = await readFile(file, "utf8");
      if (/<svg[\s>]/i.test(source)) errors.push("Handwritten inline SVG is prohibited: " + file);
    }
    const svgIcons = targetFiles.filter((file) => /icon.*\.svg$/i.test(basename(file)));
    for (const file of svgIcons) errors.push("Standalone SVG icon is prohibited: " + file);
  }
  if (errors.length) {
    console.error("Validation failed:\n" + errors.map((error) => "  - " + error).join("\n"));
    return 1;
  }
  console.log("Validation passed: skills, agents, archetypes, schemas, and policy checks are valid.");
  return 0;
}

async function uninstall(cwd: string, options: CliOptions): Promise<number> {
  const root = installRoot(cwd, options.scope);
  const record = await readRecord(root);
  if (!record) { console.log("No Design Orchestra install record found."); return 0; }
  const remaining: Record<string, string> = {};
  const rootPrefix = root.endsWith(sep) ? root : root + sep;
  for (const [file, expected] of Object.entries(record.files)) {
    const path = resolve(root, file);
    if (!path.startsWith(rootPrefix)) {
      console.warn("Skipping untrusted record path: " + file);
      continue;
    }
    if (!(await exists(path))) continue;
    if ((await sha(path)) !== expected) {
      console.warn("Preserved modified file: " + file);
      remaining[file] = expected;
      continue;
    }
    if (!options.dryRun) await unlink(path);
    if (!options.dryRun) {
      let current = dirname(path);
      while (current.startsWith(rootPrefix) && current !== root) {
        try { await rmdir(current); current = dirname(current); } catch { break; }
      }
    }
    console.log((options.dryRun ? "would remove " : "removed ") + file);
  }
  if (!options.dryRun) {
    if (Object.keys(remaining).length) await writeFile(join(root, ledgerName), JSON.stringify({ ...record, files: remaining }, null, 2) + "\n");
    else await unlink(join(root, ledgerName));
  }
  return Object.keys(remaining).length ? 2 : 0;
}

async function concepts(cwd: string, options: CliOptions): Promise<number> {
  if (!options.briefPath) throw new Error("concepts requires --brief path/to/brief.json.");
  const brief = JSON.parse(await readFile(resolve(cwd, options.briefPath), "utf8"));
  const result = validateBrief(brief);
  if (!result.valid) throw new Error(result.errors.join(" "));
  const rawSeed = options.seed ?? createRandomSeed();
  const safeSeed = rawSeed.replace(/[^a-zA-Z0-9_-]/g, "_");
  const directions = createDirections(brief, rawSeed);
  const out = resolve(cwd, options.out ?? join(".design-orchestra", "moodboards", safeSeed + ".html"));
  if (!options.dryRun) { await mkdir(dirname(out), { recursive: true }); await writeFile(out, renderMoodboardHtml(brief, directions), "utf8"); }
  console.log((options.dryRun ? "would write " : "wrote ") + out);
  console.log("Directions: " + directions.map((direction) => direction.id + " (" + direction.name + ")").join(", "));
  console.log("Selection gate: explicitly select one direction in the chat before implementation.");
  return 0;
}

async function main(): Promise<void> {
  try {
    const { command, options } = parseArgs(process.argv.slice(2));
    const cwd = process.cwd();
    let code = 0;
    if (command === "help") help();
    else if (command === "init") code = await init(cwd, options);
    else if (command === "update") code = await init(cwd, options, true);
    else if (command === "doctor") code = await doctor(cwd, options);
    else if (command === "validate") code = await validate(resolve(options.packageRoot ?? packageRoot), options.target);
    else if (command === "uninstall") code = await uninstall(cwd, options);
    else if (command === "concepts") code = await concepts(cwd, options);
    else { help(); code = 1; }
    process.exitCode = code;
  } catch (error) {
    console.error("design-orchestra: " + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}

void main();
