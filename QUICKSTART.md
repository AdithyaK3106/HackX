# HackX Quick Start

A CLI protocol for AI agents coordinating on hackathon teams. No servers, no cloud—just git-backed state and shared contracts.

## 5-Minute Setup

### 1. Initialize Your Project

```bash
npx hackx init
```

Answer the prompts:
- **Stack**: `typescript`, `python`, or `mixed`
- **Team**: comma-separated usernames (`alice, bob, charlie`)
- **Commands**: (optional) build, test, lint commands for your toolchain
- **Policy**: `permissive` (warn) or `strict` (block) for ownership violations

Creates `.hackx/` directory with config, empty contracts, ownership rules, and conventions.

### 2. Define Your API Contracts

```bash
npx hackx contract generate
```

Interactively add endpoints. Each endpoint becomes:
- Canonical API definition (lives in `contracts.yaml`)
- Auto-generated TypeScript types in `.hackx/shared_types/index.ts`
- Auto-generated Python types in `.hackx/shared_types/types.py`

Example:
```
HTTP Method: POST
Path: /auth/login
Response type: object
Add request schema? y
```

### 3. Partition Work into Slices

```bash
npx hackx partition
```

The tool:
1. Proposes vertical slices from your contracts (one endpoint group per slice)
2. Assigns owners round-robin across your team
3. Detects dependencies between slices
4. Generates context packs (owner-scoped markdown) for each team member

Output: `slices.json`, `graph.json`, `packs/alice.md`, `packs/bob.md`, etc.

### 4. Each Developer: Get Your Context Pack

```bash
npx hackx context <your-username>
```

Regenerates your pack with:
- Which endpoints you own (implement these)
- Which paths you control (edit only these)
- Which slices you depend on (reference-only)
- Conventions and schema excerpts
- Ready-to-paste implementation prompt for your AI agent

Pass the `.hackx/packs/<your-name>.md` file to your AI coding agent (Claude, Cursor, GPT, etc.).

### 5. Sync Changes and Pull Relevant Events

After your AI agent makes progress, record it:

```bash
npx hackx sync
```

Prompts for:
- **Contract changes**: any new/modified endpoints (auto-detected from git)
- **Blocked on**: another slice that's blocking you (leave empty if not)

Creates append-only event file in `.hackx/sync/`.

Then pull relevant updates from teammates:

```bash
npx hackx pull <your-username>
```

Shows only events relevant to your slice:
- Contract changes you implement or depend on
- File changes in your paths or dependencies' paths
- Blockers affecting you

### 6. Validate and Merge

Before merging to main:

```bash
npx hackx integrate
```

Validates:
1. **Ownership**: only edited your own paths?
2. **Contracts**: any undeclared contract changes?
3. **Types**: are TypeScript/Python types in sync with contracts?
4. **Schema**: any destructive SQL (DROP, TRUNCATE)?

**Merge decision:**
- ✅ Auto-approve: all checks pass, no contract changes
- ⚠️ Manual review: contract changes detected
- ❌ Blocked: validation failures

## Workflow Summary

```
1. hackx init              # One-time setup
   ↓
2. hackx contract generate # Define APIs once
   ↓
3. hackx partition         # Slice work once
   ↓
4. hackx context <name>    # Each dev: get pack
   ↓
5. Agents work in parallel on their slices
   ↓
6. hackx sync              # Each dev: record progress
   ↓
7. hackx pull <name>       # Each dev: see relevant updates
   ↓
8. hackx integrate         # Merge validation
   ↓
9. git commit + push
```

Repeat steps 5–9 in short sprints (20–30 min cadence recommended).

## Key Concepts

### Contracts
Canonical API definitions. One source of truth for endpoints, request/response shapes, and enums. Lives in `contracts.yaml`. Changes here trigger type regeneration and merge reviews.

### Slices
Vertical work units. One owner, one set of paths to edit, one set of contracts to implement. Dependencies form a DAG (no cycles).

### Context Packs
Owner-scoped markdown files in `packs/`. Each pack contains:
- Slice definition
- Endpoints to implement
- Owned paths (edit only these)
- Dependencies (reference-only)
- Schema + conventions excerpts
- Implementation prompt for AI agents

### Sync Events
Append-only JSON files in `sync/`. Each event records:
- Author
- Contract changes
- File changes (auto-detected from git)
- Blocked state

Idempotent: no changes = no event written. One file per event = zero merge conflicts.

### Relevance Filtering
`hackx pull` shows only events relevant to your slice:
- Contracts you implement or depend on
- Files in your paths or dependencies' paths
- Blockers affecting you

Cuts noise—teammates' unrelated work is invisible to you.

## File Structure

```
.hackx/
├── config.yaml                # Stack, team, toolchain commands
├── contracts.yaml             # API definitions (canonical)
├── schema.sql                 # Database schema
├── ownership.yaml             # Path globs → owner
├── conventions.md             # Naming, error format, layout
├── shared_types/
│   ├── index.ts              # (generated TypeScript types)
│   └── types.py              # (generated Python types)
├── slices.json                # Vertical work units
├── graph.json                 # Dependency edges
├── packs/
│   ├── alice.md              # (generated context pack)
│   ├── bob.md
│   └── charlie.md
├── sync/                      # Append-only event log
│   ├── 2026-07-06T16-05-22_alice.json
│   └── 2026-07-06T16-10-15_bob.json
└── integration_state.json     # Last validated commit + merge history
```

## Commands Reference

| Command | Purpose |
|---------|---------|
| `hackx init` | Bootstrap project |
| `hackx contract generate` | Define API contracts |
| `hackx partition` | Slice work and assign owners |
| `hackx context <owner>` | Build/refresh context pack |
| `hackx sync` | Record contract/file/blocker changes |
| `hackx pull <owner>` | Show relevant sync events |
| `hackx check` | Validate .hackx/ consistency |
| `hackx integrate` | Merge validation pipeline |

## Tips

- **First time?** Follow steps 1–4 with your team. Takes ~10 minutes.
- **Contracts early**: define your APIs before implementing. Types auto-flow to agents.
- **Ownership matters**: `hackx integrate` prevents cross-slice edits in strict mode.
- **Sync often**: 20–30 min cadence keeps teammates synchronized without noise.
- **Pull before coding**: `hackx pull` shows what changed while you were working.
- **Hand packs to agents**: copy `.hackx/packs/<your-name>.md` into your Claude Code session.

## Troubleshooting

**"contracts.yaml not found"**  
Run `hackx init` first.

**"No slice found for owner"**  
Run `hackx partition` to generate slices.

**Types out of sync**  
Run `hackx contract generate` to regenerate types.

**Integration blocked for ownership**  
Use `hackx context <name>` to see which paths are yours. Only edit those. Then run `hackx integrate` again.

**Pull shows no events**  
No teammates have synced relevant changes. Check `hackx pull <name>` — it filters by relevance.

---

**Questions?** See `HackX_FRD_v2.md` for the full spec. **Ready?** Run `hackx init`. ⚡
