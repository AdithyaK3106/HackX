# HackSES: Claude Code Instructions

**Project:** HackSES — AI Coordination Protocol for hackathon teams  
**FRD:** `HackSES_FRD_v2.md`  
**Mode:** [Ponytail (full)](~/.claude/skills/ponytail/SKILL.md) — lazy, minimal, YAGNI-first

---

## Core Principle

> **HackSES should feel like git.** Small, composable, predictable, developer-first. No speculation, no abstractions for v2.

---

## What This Project Is NOT

- A project manager or task tracker
- A dashboard or reporting tool
- A hosted service or daemon
- A GitHub/Slack integration (v1)
- A workflow plugin system (v1)

It's a CLI tool that coordinates AI agents via git-backed state files. Nothing more.

---

## Architecture Rule

**If a proposed file, command, or module doesn't map to R1–R4 (Contract, Partition, Sync, Integration), it doesn't ship.**

```
R1 Contract Definition      → hackses contract {generate, edit}
R2 Work Partitioning        → hackses partition, context
R3 Synchronization          → hackses sync, pull
R4 Integration Validation   → hackses check, integrate
```

Breaking this rule is a code-review blocker.

---

## Implementation Order

Ship in milestone order (IMPLEMENTATION_PLAN.md). Each milestone:
1. Implements the data schemas (zod)
2. Writes read/write utilities
3. Adds the CLI commands
4. Tests thoroughly before moving to the next milestone

**No skipping ahead.** State layer (M1) must validate before contract definition (M2) works.

---

## Coding Conventions

### Simplification Rules (Ponytail)

1. **Stdlib first** — no external lib if Node or TypeScript stdlib does it
2. **Skip boilerplate** — no `interface WithOneImpl`, no factory for one product, no config for static values
3. **Mark deliberate simplifications** with `// ponytail:` comments:
   ```ts
   // ponytail: global lock; per-account locks if throughput > N req/s
   ```
4. **One line over fifty** — if it fits in one line, write one line
5. **No speculative features** — YAGNI applies hardest here

### File Organization

- Minimal files, maximum coherence
- One responsibility per file
- No `index.ts` re-exports for internal modules (developers read the source)
- Tests colocated: `src/foo.ts` + `src/foo.test.ts`

### Comments & Documentation

- Default: zero comments (code should be obvious)
- Exception: non-obvious WHY (constraint, workaround, edge case)
- Never comment the WHAT; well-named identifiers do that
- No multi-paragraph docstrings; one short line max

### Error Handling

- Validate at system boundaries (user input, file I/O, external APIs)
- Trust internal code and framework guarantees
- No error handling for scenarios that can't happen

### Testing

- Unit tests for schemas, read/write, validators
- E2E tests for CLI flows (init → contract → partition → sync → integrate)
- Target: > 80% code coverage for new modules
- No test fixtures or frameworks unless essential
- Tests live next to code: `module.test.ts`

---

## State Files (.hackses/)

All state is plain text, git-diffable, hand-editable. **No opaque serialization.**

**Core design principle:** conflict-resistant:
- Append-only files for logs (`sync/`)
- One file per owner for multi-author state (`packs/`)
- Single-writer files for contracts (guarded by integration pipeline)

---

## Tech Stack (Fixed for v1)

- **Language:** TypeScript (Node)
- **CLI:** `commander`
- **Validation:** `zod` (all schemas)
- **Config:** `js-yaml` (YAML parsing)
- **Testing:** `vitest`
- **Distribution:** npm package (`npx hackses init`)

No LLM API calls from the engine. We generate prompts; developers' agents do the generating.

---

## Definition of Done (per Milestone)

- [ ] All acceptance criteria met
- [ ] > 80% code coverage for new modules
- [ ] No hand-editable state schema changes after first ship (or documented migration)
- [ ] README updated with new CLI commands
- [ ] Hardening phase passes (perf budget, conflict-resistance, edge cases)

---

## Boundaries & Out-of-Scope

**Explicitly NOT in v1:**
- Ideation, demo prep, presentation generation
- Time estimates, milestones, workload balancing
- Status dashboards, prose impact reports
- Daemons, watchers, or any background service
- GitHub/Slack/Discord/VS Code integrations
- Predictive analytics, AI coaching

**Explicitly v2 or later:**
- AI-assisted merge proposals
- File watcher for auto-refresh context packs
- Prose change-impact summaries
- GitHub PR status checks
- Contract linting

**Never (belongs to other tools):**
- Project ideation, judging
- Deployment/demo health
- Project management, estimation

---

## Debugging & Development

- `npm test` — run all tests (vitest)
- `npm run check` — lint + type check
- `npm run build` — compile TypeScript
- Inspect `.hackses/` state files directly (they're JSON/YAML)
- `git log .hackses/` to trace state changes

---

## Code Review Checklist

### Must Block Merge
- [ ] Violates R1–R4 mapping (no stray files/commands)
- [ ] Adds speculative features (v2 scope creep)
- [ ] Breaks conflict-resistance design (sync/ state not append-only, etc.)
- [ ] Hand-editable state files use opaque encoding
- [ ] Command not mapped to a CLI verb

### Should Review
- [ ] Unnecessary dependencies added
- [ ] Boilerplate that could be one line
- [ ] Over-engineered error handling
- [ ] Missing acceptance criteria from IMPLEMENTATION_PLAN.md

---

## Contact & Questions

Refer to HackSES_FRD_v2.md for requirements.  
Refer to IMPLEMENTATION_PLAN.md for task breakdown.  
Update STATUS.md as you work.

**Principle:** if it's not in the FRD, it's v2+. Ship the minimal thing that solves the FRD, and question any scope creep in the same response you ship it.

---

**Status:** Active | Updated 2026-07-06
