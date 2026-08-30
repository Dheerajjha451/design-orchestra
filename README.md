# Design Orchestra

Design Orchestra is an MIT-licensed npm package for chat-native React landing
page creation and redesign. It installs a portable skill set plus specialist
agent profiles for Codex, Claude Code, Cursor, Gemini CLI, and GitHub Copilot.

It makes the workflow deliberately hard to shortcut: inspect, ask a focused
brief, produce **exactly three** substantially different directions, wait for
the user's choice, build only the approved direction, then review it
independently.

## Install

```bash
npx design-orchestra init
```

The default is project scope and an auto-detected provider. Select one or more
providers explicitly when needed:

```bash
npx design-orchestra init --provider codex,claude,cursor --yes
```

Other lifecycle commands:

```bash
design-orchestra update
design-orchestra doctor
design-orchestra validate
design-orchestra uninstall
```

All commands accept `--scope project|global`, `--dry-run`, `--yes`, and
`--force`. The installer has no postinstall hook and only writes when an
explicit command is run. It records package-owned files and hashes in
`.design-orchestra-install.json`; updates preserve user changes and uninstall
removes only unchanged package-owned files.

## Generate a reviewable concept gallery

The skills normally drive this from a coding-agent conversation. For a
reproducible standalone artifact:

```bash
design-orchestra concepts --brief ./brief.json --out .design-orchestra/moodboards
design-orchestra concepts --brief ./brief.json --seed launch-2026
```

The command writes a self-contained HTML gallery containing exactly three
directions, each with desktop/mobile studies, tokens, type, image and motion
notes. A cryptographically random seed is used when one is not supplied.

## What gets installed

- Portable skills: `.agents/skills/design-orchestra` and five focused skills.
- Provider agents: `.codex/agents/*.toml`, `.claude/agents/*.md`,
  `.cursor/agents/*.md`, `.gemini/agents/*.md`, or
  `.github/agents/*.agent.md`.
- Native distributable artifacts under `.design-orchestra/plugins/` for
  Codex/ChatGPT, Claude, and Gemini.
- `design-orchestra.config.json`, a versioned, editable configuration.

Claude receives a `.claude/skills` adapter because its native skill location
is different. Other selected hosts share the portable `.agents/skills`
directory.

## Design guarantees

- A structured question round happens before concept generation.
- A landing-page implementation is never edited before an explicit selection.
- Directions must pass a seven-dimension diversity check.
- Existing `DESIGN.md`, brand assets, and component systems are authoritative
  in redesigns.
- Proof is never invented. Image assets need provenance and useful alt text.
- Handwritten inline SVG icons and standalone SVG icon assets are rejected;
  use one installed icon family such as Lucide React or React Icons.
- Reviews cover accessibility, responsive reflow, performance, motion, and
  visual coherence.

## Development

```bash
npm install
npm test
npm run validate
npm run pack:check
```

Node.js 20 or newer is required. Publishing is intentionally not automated:
run the authenticated npm release step only after reviewing the packed tarball
and confirming the package name remains available.
