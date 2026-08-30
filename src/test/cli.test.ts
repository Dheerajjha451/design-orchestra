import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { appendFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const run = promisify(execFile);
const cli = resolve(process.cwd(), "dist", "cli.js");

test("CLI installs all provider profiles, protects edits, creates concepts, and safely uninstalls", async () => {
  const project = await mkdtemp(join(tmpdir(), "design-orchestra-cli-"));
  try {
    const invoke = (args: string[]) => run(process.execPath, [cli, ...args], { cwd: project });
    await invoke(["init", "--provider", "codex,claude,cursor,gemini,copilot", "--yes"]);
    const config = JSON.parse(await readFile(join(project, "design-orchestra.config.json"), "utf8"));
    assert.deepEqual(config.providers, ["codex", "claude", "cursor", "gemini", "copilot"]);
    await appendFile(join(project, ".codex", "agents", "creative-director.toml"), "\nuser modification\n");
    await assert.rejects(invoke(["update", "--provider", "codex", "--yes"]), (error: { code?: number }) => error.code === 2);

    await writeFile(join(project, "brief.json"), JSON.stringify({
      version: 1, mode: "create", audience: "SaaS teams", offer: "Ship confidently", cta: "Try it", proof: [],
      brand: "Calm product", tone: "clear", constraints: [], mediaPreference: "no-images", animationTechnology: "css",
    }));
    await invoke(["concepts", "--brief", "brief.json", "--seed", "cli-test"]);
    assert.match(await readFile(join(project, ".design-orchestra", "moodboards", "cli-test.html"), "utf8"), /Direction 03/);

    await assert.rejects(invoke(["uninstall"]), (error: { code?: number }) => error.code === 2);
    assert.match(await readFile(join(project, ".codex", "agents", "creative-director.toml"), "utf8"), /user modification/);
  } finally {
    await rm(project, { recursive: true, force: true });
  }
});
