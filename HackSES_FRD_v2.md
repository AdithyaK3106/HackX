# HackSES — Functional Requirements Document (v2, Refactored)

**Document type:** Build spec for Claude Code
**Positioning:** An AI Coordination Protocol for hackathon teams using AI coding agents.
**Core message:** *Multiple AI agents. One shared understanding.*

---

## 0. What Changed From v1 (and Why)

This FRD replaces the previous version, which had drifted toward being an AI project manager. Every module was re-evaluated against four questions: Does it help AI agents coordinate? Does it reduce waiting? Does it reduce merge conflicts? Does it improve parallelism?

**Removed or deferred from v1:**

| Feature (old FRD) | Verdict | Reasoning |
|---|---|---|
| `hackses ideate` (idea generation, judging strategy, demo flow) | **Removed entirely** | Project ideation is not coordination. Any teammate can do this in a normal Claude chat. Zero impact on agent conflicts or parallelism. |
| `hackses plan` (milestones, estimated completion times) | **Cut down** | Milestones and time estimates are project management. What survives is only *work partitioning*: vertical slices + dependency edges, because those directly determine parallelism. Estimates and milestones are deleted. |
| `hackses demo prep` (presentations, FAQ, judge questions) | **Removed entirely** | Presentations don't coordinate agents. This is the clearest project-manager feature in the old FRD. |
| AI Stand-Ups (6-question interview) | **Simplified** | The interview format is ceremony. What coordination actually needs from a sync is three facts: *what contracts changed, what files changed, what's blocked*. Everything else (「what did you complete?」「need help?」) is status theater. Replaced by a 3-field sync (§7). |
| `progress.json` feature status board / Live Project Graph | **Cut down** | A "Completed/In Progress/Blocked" dashboard is reporting, not coordination. What survives: blocked-state tracking only, because a block on the dependency graph changes what others can safely build. Pretty status boards → v2. |
| Change Impact Engine (personalized markdown reports per teammate) | **Cut down** | The *detection* of impact is coordination gold — keep it. The *personalized report generation* is reporting. v1 emits impact as structured data appended to sync state; a `hackses pull` shows you only diffs relevant to your slice. Prose summaries → v2. |
| `WorkflowConfig` plugin system for ASES Enterprise/Startup/Research | **Deferred to v2** | This was architecture astronautics for v1. Building a generic workflow engine "so ASES can reuse it later" violates "do one thing well." v1 hardcodes the hackathon workflow. The engine/CLI split is preserved so extraction into ASES later is straightforward — but no abstract plugin interface ships now. |
| Feature flags (`feature_flags.json`) | **Removed** | No coordination function identified. If a demo needs a kill-switch, that's app code, not protocol state. |
| `hackses doctor` (demo readiness, deploy checks) | **Cut down** | Demo/deploy health is project management. What survives is contract-state validation only: are `.hackses/` files consistent, do shared_types match contracts. Renamed `hackses check`. |
| Task `estimated_minutes`, milestone tracking | **Removed** | Predictive analytics / planning, not coordination. |

**What this leaves:** a small tool with the shape of git — a handful of verbs, plain-text state, no server, no dashboard, no opinions about your project beyond how agents share it.

---

## 1. Product Vision

HackSES is an **AI Coordination Protocol** for hackathon teams where every developer drives their own AI coding agent (Claude Code, Cursor, GPT, Gemini…).

The problem it solves: AI agents are fast, but four agents working on one repo without shared contracts produce incompatible interfaces, overlapping edits, and merge hell. The team becomes sequential even though every individual is fast.

HackSES is **not** an AI project manager, an engineering management platform, a task tracker, or a DevOps platform. It does not plan your project, estimate your timeline, prepare your demo, or coach your team.

It does exactly four things:

1. **Define the contract** — one source of truth for APIs, schemas, types, ownership, conventions.
2. **Partition the work** — independent vertical slices, each with a scoped context pack.
3. **Keep everyone synchronized** — git-backed state, no server, no cloud.
4. **Validate integration** — catch contract/type/schema/ownership violations before `main`.

Design principle: **HackSES should feel like git.** Git does version control extremely well and nothing else. HackSES does AI coordination extremely well and nothing else. Small, composable, predictable, developer-first.

---

## 2. The Four Responsibilities (System Decomposition)

The architecture *is* the four responsibilities. Each is one engine module, one or two CLI verbs, and a defined slice of `.hackses/` state.

```
┌────────────────────────────────────────────────────┐
│                 CLI: hackses <verb>                  │
│   init · contract · partition · context ·           │
│   sync · pull · check · integrate                    │
└──────────────────┬─────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────┐
│                  Core Engine                          │
│                                                        │
│  R1 Contract      R2 Partition     R3 Sync            │
│  ─ contract        ─ slicer         ─ state writer/    │
│    generator       ─ dependency       reader           │
│  ─ type emitter      graph          ─ relevance        │
│                    ─ context pack     filter           │
│                      builder                            │
│                                                        │
│  R4 Integration                                        │
│  ─ validation pipeline (contract/type/schema/         │
│    ownership compatibility)                            │
│  ─ merge decision logic                                │
└──────────────────┬─────────────────────────────────┘
                   │ reads/writes (only state that exists)
┌──────────────────▼─────────────────────────────────┐
│        .hackses/  (git-tracked, plain text)           │
│  config.yaml · contracts.yaml · schema.sql ·          │
│  ownership.yaml · conventions.md · slices.json ·      │
│  graph.json · sync/ · shared_types/ · packs/          │
└────────────────────────────────────────────────────┘
```

Rule: **if a proposed file, command, or module doesn't map to R1–R4, it doesn't ship.** This rule is part of the spec — Claude Code should reject additions that fail it.

---

## 3. R1 — Contract Definition

**Purpose:** one shared understanding all agents build against.

**Artifacts (in `.hackses/`):**
- `contracts.yaml` — endpoints, request/response models, enums. Canonical source.
- `schema.sql` — database schema.
- `ownership.yaml` — path globs → owner, plus policy per path.
- `conventions.md` — naming, error format, folder layout. Short; agents read it whole.
- `shared_types/` — **generated from** `contracts.yaml`, never hand-edited. TypeScript or Python emitted per `config.yaml` stack setting.

**CLI:**
- `hackses contract generate` — interactive/flag-driven generation of the above from a feature list.
- `hackses contract edit <endpoint>` — structured mutation of contracts.yaml, then regenerates shared_types. (Editing YAML by hand is allowed too; `hackses check` catches drift.)

**Rules:**
- No implementation before contracts exist — `hackses context` refuses to build packs if `contracts.yaml` is missing.
- Contract changes are the highest-signal event in the protocol: every contract mutation is recorded in sync state (§5) so other agents learn of it on next `pull`.

---

## 4. R2 — Work Partitioning

**Purpose:** maximum parallelism through independent vertical slices.

**Artifacts:**
- `slices.json` — the only "task-like" structure in HackSES. Deliberately minimal:

```json
{
  "slices": [
    {
      "id": "auth",
      "owner": "rahul",
      "paths": ["backend/auth/**"],
      "contracts": ["POST /auth/login", "POST /auth/signup"],
      "depends_on": [],
      "acceptance": ["Endpoints match contracts.yaml", "No edits outside owned paths"],
      "blocked": false
    }
  ]
}
```

No status field beyond `blocked`. No estimates. No milestones. A slice is either integrable or not — the Integration Engine (R4) is the judge, not a status column.

- `graph.json` — dependency edges between slices. Exists solely to answer: *"what can be built right now in parallel?"* and *"whose contracts do I consume?"*

**Context Packs (`packs/<owner>.md`):** the R2 deliverable each developer hands to their AI agent. Contains **only**:
1. The slice definition
2. The slice's relevant excerpt of `contracts.yaml` and `schema.sql`
3. `conventions.md`
4. Owned paths (and the instruction: touch nothing else)
5. Contracts of slices this one `depends_on` (consume-only)
6. A ready-to-paste implementation prompt

**CLI:**
- `hackses partition` — proposes vertical slices + dependency edges from contracts; user assigns owners.
- `hackses context <owner>` — (re)builds that owner's pack. Regenerated automatically whenever `hackses pull` detects contract changes affecting the slice.

---

## 5. R3 — Synchronization

**Purpose:** every agent's understanding stays current, through git alone.

**Protocol:** no server, no daemon, no cloud. `.hackses/` is committed to the shared repo; git push/pull *is* the transport. HackSES adds structure and filtering on top.

**Sync state (`sync/`):** append-only JSON event log, one file per event to avoid merge conflicts on the log itself:

```json
// sync/2026-07-06T11-05-00_rahul.json
{
  "author": "rahul",
  "at": "2026-07-06T11:05:00Z",
  "contract_changes": ["added POST /auth/refresh"],
  "files_changed": ["backend/auth/refresh.py"],
  "blocked": null
}
```

Three fields of substance: contract changes, file changes, blocked state. That is the entire stand-up. If all three are empty, `hackses sync` writes nothing (idempotent, no log spam).

**CLI:**
- `hackses sync` — infers `files_changed` from git diff, asks only for contract changes not already detected and blocked state, writes the event, commits.
- `hackses pull` — after `git pull`, shows the developer **only events relevant to their slice** (relevance = events touching contracts they consume, paths adjacent to theirs per graph.json, or their blockers being resolved). This is the surviving core of the old "Change Impact Engine": impact *detection and filtering*, no prose report generation.

**Cadence:** recommended every 20–30 min; enforced by convention, not tooling. (A watcher/daemon is explicitly v2 — it adds a moving part mid-hackathon for marginal gain.)

---

## 6. R4 — Integration Validation

**Purpose:** breaking changes never reach `main`.

**Validation pipeline** (`hackses integrate`, fail-fast, target < 60s):
1. **Ownership** — diff touches only the author's owned paths? Non-owner edits → warning by default, hard block if `policy: strict` in config.
2. **Contract compatibility** — does implemented code drift from `contracts.yaml`? Does the branch mutate contracts without a sync event declaring it?
3. **Type compatibility** — `shared_types/` regenerated and consistent with contracts? Hand-edits to generated files → block.
4. **Schema compatibility** — `schema.sql` diff; destructive migrations flagged.
5. **Build + tests + lint** — delegated to commands declared in `config.yaml` (HackSES doesn't own your toolchain; it invokes it).

**Merge decision logic:**
```
if diff ⊆ author's owned paths AND no contract/type/schema changes:
    auto-approve after pipeline passes
elif diff touches contracts.yaml / shared_types / schema.sql:
    require pipeline pass + explicit human approval
    (AI-assisted merge proposal generation → v2)
else:
    pipeline pass → approve; fail → block with the failing check named
```

**`hackses check`** — the local, read-only subset: validates `.hackses/` internal consistency (contracts ↔ shared_types ↔ ownership ↔ slices) without running the build. Runs in seconds; developers and their agents run it constantly.

**State:** `integration_state.json` — last validated commit + append-only merge history with per-check results. Exists because R4 needs to know the last-known-good baseline to diff against; it is not a reporting feature.

---

## 7. Repository Structure (final)

```
.hackses/
├── config.yaml          # stack, team, build/test/lint commands, policy
├── contracts.yaml       # R1 canonical contracts
├── schema.sql           # R1
├── ownership.yaml       # R1
├── conventions.md       # R1
├── shared_types/        # R1 generated — never hand-edit
├── slices.json          # R2
├── graph.json           # R2
├── packs/<owner>.md     # R2 generated
├── sync/                # R3 append-only event log
└── integration_state.json  # R4
```

Eleven artifacts, down from fifteen. Removed vs old FRD: `architecture.md`, `frd.md`, `task_registry.json` (folded into slices.json, minus PM fields), `progress.json`, `feature_flags.json`, `logs/` (folded into `sync/`).

Everything is plain text, git-diffable, and human-fixable with a text editor (a hard requirement — no opaque state).

---

## 8. CLI Summary (complete v1 surface — 8 verbs)

| Verb | Responsibility | Does |
|---|---|---|
| `init` | — | Scaffold `.hackses/`, capture stack + team + toolchain commands |
| `contract generate` / `contract edit` | R1 | Create/mutate contracts, regenerate shared_types |
| `partition` | R2 | Propose slices + dependency graph, assign owners |
| `context <owner>` | R2 | Build/refresh context pack |
| `sync` | R3 | Record contract/file/blocked event, commit |
| `pull` | R3 | Filter incoming events to what's relevant to your slice |
| `check` | R4 | Fast local consistency validation of `.hackses/` |
| `integrate` | R4 | Full validation pipeline + merge decision |

If a proposed ninth verb doesn't map to R1–R4, it goes to the roadmap, not the CLI.

---

## 9. Tech Stack (unchanged in substance, simplified in scope)

- TypeScript (Node), `commander` for CLI, `zod` for all state schemas, `js-yaml`, `vitest`.
- Distributed as npm package: `npx hackses init` — zero shared install step.
- **No LLM API calls from the engine.** HackSES generates prompts and packs; developers' own agents do the generating. This keeps HackSES offline-capable, key-free, and agent-agnostic — a protocol, not a platform.

---

## 10. Non-Functional Requirements

- **NFR1 Offline-first:** works with no network beyond git remotes.
- **NFR2 Fast:** `check` < 5s; `integrate` < 60s on typical hackathon repos.
- **NFR3 Human-recoverable:** every state file hand-editable; `check` repairs/flags inconsistency.
- **NFR4 Conflict-resistant state:** `.hackses/` file design must itself avoid merge conflicts (append-only event files, one file per owner for packs, canonical single-writer files for contracts guarded by R4).
- **NFR5 Ten-minute start:** `init` → first context pack in under 10 minutes.

---

## 11. v1 Scope Statement

**In:** the 8 verbs above; the four engine modules; `.hackses/` state as specified; TypeScript + Python type emission.

**Out (explicitly):** ideation, planning/milestones/estimates, demo/presentation generation, status dashboards, prose impact reports, AI-assisted merge proposals, workflow plugin system, daemons/watchers, any hosted service, GitHub/Slack/Discord/VS Code integrations, workload balancing, predictive analytics, AI coaching.

---

## 12. Roadmap

**v2 — Deeper coordination (still within R1–R4):**
- AI-assisted merge proposals for contract-touching conflicts (R4)
- File watcher: auto-refresh context packs on contract change (R2/R3)
- Prose change-impact summaries per teammate, generated from sync events (R3)
- GitHub PR integration: run `integrate` as a status check (R4)
- Contract linting: detect implemented-but-undeclared endpoints from code (R1)

**v3 — Ecosystem:**
- VS Code extension surfacing `pull` relevance inline
- Slack/Discord sync-event relay
- Live read-only project graph view (reporting, deliberately last)
- ASES workflow extraction: generalize the engine behind a WorkflowConfig interface *after* the hackathon workflow has proven the engine's shape (the reverse of v1 FRD's premature abstraction)

**Never (belongs to other tools or other ASES workflows):**
- Ideation, judging strategy, demo prep — plain AI chat does this
- Milestones, time estimation, workload balancing — project management tools do this
- Deployment/demo health — CI/CD does this

---

## 13. Implementation Milestones for Claude Code

1. State layer: zod schemas for all §7 files, read/write utils, `check` (R4-lite) — this validates the data model first.
2. `init` + `contract generate` + shared_types emitter (R1).
3. `partition` + `context` (R2).
4. `sync` + `pull` with relevance filtering (R3).
5. `integrate` pipeline + merge decision (R4).
6. Hardening: NFR4 conflict-resistance tests (simulate 4 concurrent authors), NFR2 perf budget tests.

Each milestone ships with tests before the next begins.

**Acceptance criteria (module-level):**
- Contract → types: hand-editing `shared_types/` is detected and blocked by `check`.
- Context packs: pack for owner X contains zero content from paths not owned by or depended-on by X's slice.
- Sync: two `sync` calls with no changes produce zero new event files.
- Pull relevance: an event touching only slice A's internal files never surfaces in slice B's `pull` unless B depends on A.
- Integrate: unrelated-paths branches auto-approve; contract-touching branches always require human approval in v1.
- Conflict resistance: 4 simulated developers syncing concurrently produce zero git conflicts inside `.hackses/`.
