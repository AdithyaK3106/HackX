# HackSES Implementation Plan

Based on FRD v2, organized by milestone. Each ships with tests before the next begins.

---

## Milestone 1: State Layer & Validation (R4-lite)
**Goal:** Validate the data model; establish zod schemas for all state files.

### Tasks
- [ ] Zod schemas for all `.hackses/` files:
  - `config.yaml` (stack, team, toolchain commands, policy)
  - `contracts.yaml` (endpoints, request/response models)
  - `schema.sql` (database schema)
  - `ownership.yaml` (path globs → owner)
  - `conventions.md` (naming, error format)
  - `shared_types/` (generated TypeScript/Python)
  - `slices.json` (vertical slices + owners)
  - `graph.json` (dependency edges)
  - `packs/<owner>.md` (context packs)
  - `sync/` (append-only event log)
  - `integration_state.json` (merge history)
- [ ] Read/write utilities for each schema
- [ ] `hackses check` (read-only consistency validation)
  - Detects hand-edits to `shared_types/`
  - Validates `.hackses/` internal consistency
  - Target: < 5s
- [ ] Unit tests for all schemas + read/write
- [ ] Tests for `check` command (schema validation + drift detection)

**Acceptance Criteria:**
- Hand-editing `shared_types/` is detected by `check`
- All schema files round-trip through read/write without data loss
- `check` < 5s on typical hackathon repos

---

## Milestone 2: Init & Contract Definition (R1)
**Goal:** Bootstrap a project and define the contract.

### Tasks
- [ ] `hackses init` command
  - Interactive scaffold of `.hackses/` folder
  - Capture stack (TypeScript/Python), team, build/test/lint commands, policy
  - Create boilerplate `config.yaml`, empty `contracts.yaml`
- [ ] `hackses contract generate` command
  - Interactive or flag-driven from feature list
  - Generates `contracts.yaml` (endpoints, models)
  - Accepts user input: feature → endpoint mapping
- [ ] Shared types emitter (R1 backend)
  - Read `contracts.yaml`, emit TypeScript and/or Python types to `shared_types/`
  - Regenerate on every `contract` mutation
  - Mark files as generated (no hand-edit)
- [ ] `hackses contract edit <endpoint>` (optional v1, can defer to manual YAML)
- [ ] Unit tests for contract generation
- [ ] E2E test: `init` → `contract generate` → types emitted + `check` passes

**Acceptance Criteria:**
- `init` completes in < 10 min for a minimal project
- Generated types match `contracts.yaml` exactly
- Manual YAML edits to `contracts.yaml` are detected and flagged by `check`

---

## Milestone 3: Partitioning & Context Packs (R2)
**Goal:** Slice the work and emit context packs for agents.

### Tasks
- [ ] `hackses partition` command
  - Propose vertical slices from `contracts.yaml`
  - Auto-generate dependency graph from slice contracts
  - Interactive owner assignment
  - Output `slices.json` + `graph.json`
- [ ] Context pack builder (R2 backend)
  - For each owner, assemble `packs/<owner>.md`:
    - Slice definition
    - Relevant `contracts.yaml` excerpt
    - Relevant `schema.sql` excerpt
    - `conventions.md`
    - Owned paths
    - Consumed contracts (from `depends_on`)
    - Ready-to-paste implementation prompt
- [ ] `hackses context <owner>` command
  - Build/refresh a single pack
  - Auto-regenerate on `pull` if contracts changed
- [ ] Tests for slice proposal + dependency graph
- [ ] Tests for pack content + ownership boundaries

**Acceptance Criteria:**
- Context pack for owner X contains zero content from unowned paths
- `depends_on` contracts appear in the pack as read-only reference
- Dependency graph is acyclic (or reject with error)

---

## Milestone 4: Sync & Pull (R3)
**Goal:** Keep agents synchronized via append-only event log.

### Tasks
- [ ] Sync state schema & event writer
  - Append-only JSON files in `sync/`
  - One file per event (no merge conflicts on log itself)
  - Schema: `author`, `at`, `contract_changes`, `files_changed`, `blocked`
- [ ] `hackses sync` command
  - Infer `files_changed` from `git diff`
  - Prompt for contract changes not auto-detected
  - Prompt for blocked state
  - Write event, commit to `.hackses/sync/`
  - Idempotent (no event if all three fields empty)
- [ ] Relevance filter (R3 backend)
  - For a given owner's slice, compute relevant events:
    - Events touching contracts they consume
    - Events touching paths adjacent to theirs (per graph)
    - Events resolving their blockers
- [ ] `hackses pull` command
  - After `git pull`, show only relevant events
  - Parse incoming `sync/` files, filter, display summary
- [ ] Tests for sync event generation
- [ ] Tests for relevance filtering

**Acceptance Criteria:**
- Two `sync` calls with no changes produce zero new event files
- An event touching only slice A's internal files never surfaces in slice B's `pull` unless B depends on A
- `sync` works when git state has uncommitted changes (stashes them, commits, restores)

---

## Milestone 5: Integration Validation (R4)
**Goal:** Validate breaking changes before merge.

### Tasks
- [ ] Ownership validator
  - Diff touches only author's owned paths?
  - Non-owner edits → warning (or hard block if `policy: strict`)
- [ ] Contract compatibility checker
  - Does code drift from `contracts.yaml`?
  - Does branch mutate contracts without a sync event?
- [ ] Type compatibility checker
  - Regenerate `shared_types/`; diff against committed version
  - Hand-edits to generated files → block
- [ ] Schema compatibility checker
  - `schema.sql` diff analysis
  - Flag destructive migrations
- [ ] Integration state tracker
  - `integration_state.json`: last validated commit + merge history
  - Per-check results
- [ ] `hackses integrate` command
  - Run all validators (fail-fast)
  - Merge decision logic:
    - Author's owned paths only + no contract/type/schema changes → auto-approve
    - Contract/type/schema changes → require human approval
    - Other → pipeline pass → approve
  - Target: < 60s
- [ ] Tests for each validator
- [ ] Tests for merge decision logic
- [ ] Conflict-resistance tests (4 concurrent authors syncing)

**Acceptance Criteria:**
- Unrelated-paths branches auto-approve
- Contract-touching branches always require human approval in v1
- 4 simulated developers syncing concurrently produce zero git conflicts in `.hackses/`

---

## Hardening Phase
**Goal:** Performance & conflict-resistance at scale.

### Tasks
- [ ] NFR2 perf budget tests (check < 5s, integrate < 60s)
- [ ] NFR4 conflict-resistance tests (4 concurrent authors)
- [ ] Edge case tests:
  - Empty `contracts.yaml`
  - Circular dependencies (reject)
  - Missing owner in `slices.json`
  - Sync with no changes (idempotent)
  - Pull with no relevant events (empty list)
- [ ] Integration tests: full flow (init → contract → partition → context → sync → pull → integrate)

---

## Roadmap (v2+)
- File watcher: auto-refresh context packs on contract change
- AI-assisted merge proposals for conflicts
- GitHub PR integration for `integrate` as status check
- Contract linting (detect implemented-but-undeclared endpoints)
- VS Code extension, Slack/Discord relay, live project graph

---

## Tech Stack
- TypeScript (Node)
- `commander` (CLI)
- `zod` (schema validation)
- `js-yaml` (YAML parsing)
- `vitest` (tests)
- Distributed as npm package: `npx hackses init`

---

## Definition of Done
- All acceptance criteria met for the milestone
- > 80% code coverage for new modules
- Zero breaking changes to `.hackses/` state schema once shipped (or documented migration)
- README updated with new commands
