# HackX — AI Coordination Protocol for Hackathon Teams

![Status](https://img.shields.io/badge/status-complete-brightgreen) ![Tests](https://img.shields.io/badge/tests-111%20passing-brightgreen) ![Coverage](https://img.shields.io/badge/coverage-%3E80%25-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

A git-backed CLI protocol that lets hackathon teams coordinate multiple AI coding agents (Claude, Cursor, GPT, Gemini…) without merge conflicts, interface drift, or coordination overhead.

## The Problem

You have 4 developers, each with their own AI coding agent. The agents are *fast*—but without shared contracts, they build incompatible interfaces, step on each other's code, and create merge conflicts you don't have time to untangle.

**HackX solves this.** Agents work in true parallel. No merge conflicts. One contract, one truth.

## Quick Start

```bash
# 1. Initialize project
npx hackx init

# 2. Define APIs
npx hackx contract generate

# 3. Slice work, assign owners
npx hackx partition

# 4. Each dev gets their context pack
npx hackx context <your-name>

# 5. Pass pack to your AI agent
# (Agent implements your slice)

# 6. Record progress
npx hackx sync

# 7. See teammate updates
npx hackx pull <your-name>

# 8. Validate and merge
npx hackx integrate
git commit && git push
```

**Total time: ~5 minutes to first context pack.**

See [QUICKSTART.md](./QUICKSTART.md) for a detailed walkthrough.

## Features

✅ **No servers** — Works offline, uses only git  
✅ **Zero merge conflicts** — Append-only event log  
✅ **Type sync** — Auto-generates TypeScript + Python from contracts  
✅ **Ownership enforcement** — Agents can only edit assigned paths  
✅ **Relevance filtering** — Each dev sees only changes that matter  
✅ **Merge gating** — Auto-approve safe changes, require review for APIs  
✅ **< 1s validation** — Even with 100 contracts + 50 slices  

## How It Works

### 1. Define Contracts
Write API contracts once. Types auto-flow to all agents.

```yaml
# .hackx/contracts.yaml
endpoints:
  - id: POST /auth/login
    method: POST
    path: /auth/login
    request: { type: object }
    response: { type: object }
```

### 2. Partition Work
AI automatically proposes vertical slices from contracts. Assign owners. Done.

```json
{
  "slices": [
    {
      "id": "auth",
      "owner": "alice",
      "paths": ["backend/auth/**"],
      "contracts": ["POST /auth/login"]
    }
  ]
}
```

### 3. Generate Context Packs
Each developer gets a scoped `.md` file with:
- Their endpoints to implement
- Their owned paths (edit only these)
- Dependencies (reference-only)
- Schema + conventions
- Implementation prompt

Pass the pack to your AI agent.

### 4. Sync Changes
Agents implement in parallel. Record progress with:
```bash
hackx sync
```

Creates append-only event files (one per sync, zero conflicts).

### 5. Stay Synchronized
Pull relevant updates:
```bash
hackx pull <your-name>
```

Shows only events relevant to your slice:
- Contracts you implement or depend on
- Files in your paths or dependencies
- Blockers affecting you

### 6. Validate Before Merge
```bash
hackses integrate
```

Checks:
- ✅ Ownership: only edited your paths
- ✅ Contracts: no undeclared changes
- ✅ Types: TypeScript/Python in sync
- ✅ Schema: no destructive SQL

**Result:**
- Auto-approve: all checks pass + no API changes
- Manual review: API changes detected
- Block: validation failures

## Architecture

```
CLI (8 commands)
    ↓
Core Engines (5 responsibilities)
    ├─ R1: Contract Definition (Contracts → Types)
    ├─ R2: Work Partitioning (Slices + Context Packs)
    ├─ R3: Synchronization (Append-only Events)
    ├─ R4: Integration Validation (Ownership + Contracts + Types + Schema)
    └─ Foundation: State Management (Schemas + I/O)
    ↓
.hackx/ (Plain text, git-backed)
    ├─ config.yaml
    ├─ contracts.yaml
    ├─ slices.json
    ├─ sync/ (append-only events)
    ├─ packs/ (context per owner)
    └─ shared_types/ (generated)
```

See [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for detailed architecture.

## Commands

| Command | Purpose |
|---------|---------|
| `hackx init` | Bootstrap project (stack, team, toolchain) |
| `hackx contract generate` | Define API contracts interactively |
| `hackx partition` | Propose slices, assign owners |
| `hackx context <owner>` | Generate/refresh context pack |
| `hackx sync` | Record contract/file/blocker changes |
| `hackx pull <owner>` | Show relevant teammate updates |
| `hackx check` | Validate `.hackx/` consistency |
| `hackx integrate` | Merge validation pipeline |

## Workflow

```
Setup (Day 1)
├─ hackx init
├─ hackx contract generate
├─ hackx partition
└─ hackx context <each-name> → Agents get packs

Sprint Cycles (20-30 min cadence)
├─ Agents implement in parallel
├─ hackx sync (each dev)
├─ hackx pull <name> (each dev)
├─ hackx integrate
└─ git commit + push

End of Hackathon
└─ All changes validated, ready to merge
```

## Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** — 5-minute walkthrough, key concepts, troubleshooting
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** — Complete project overview, architecture, metrics
- **[HackSES_FRD_v2.md](./HackSES_FRD_v2.md)** — Full functional requirements spec
- **[CLAUDE.md](./CLAUDE.md)** — Development guidelines (Ponytail principle)
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** — Milestone breakdown
- **[STATUS.md](./STATUS.md)** — Project completion status

## Project Status

✅ **Complete** — All 5 core milestones shipped + hardening phase

| Milestone | Tests | Status |
|-----------|-------|--------|
| M1: State Layer | 28 | ✅ |
| M2: Contract Definition | 17 | ✅ |
| M3: Work Partitioning | 14 | ✅ |
| M4: Sync & Pull | 17 | ✅ |
| M5: Integration Validation | 19 | ✅ |
| Hardening Phase | 16 | ✅ |
| **Total** | **111** | **✅** |

## Tech Stack

- **Language:** TypeScript (Node.js)
- **CLI:** `commander`
- **Validation:** `zod`
- **Config:** `js-yaml`
- **Glob matching:** `minimatch`
- **Testing:** `vitest`
- **Distribution:** npm package (`npx hackses`)

## Running Tests

```bash
npm install
npm run build    # Compile TypeScript
npm test         # Run vitest
npm run check    # Type check + lint
```

**Result:** 111 tests ✅

## Performance

| Operation | Target | Measured |
|-----------|--------|----------|
| `check` | < 5s | < 1s (100 contracts) |
| `integrate` | < 60s | < 10s typical |
| Sync event write | — | < 100ms |
| Context pack gen | — | < 500ms |

## Conflict-Resistance

**Verified for 4 concurrent authors:**
- Append-only sync events (one file per event) → zero merge conflicts
- One-file-per-owner context packs → no overlapping rewrites
- Single-writer contracts/config → no concurrent mutations
- DAG dependency graph → no circular conflicts

See [src/hardening/conflicts.test.ts](./src/hardening/conflicts.test.ts) for tests.

## Key Design Principles

1. **Contract-first** — APIs defined before coding prevents drift
2. **Vertical slicing** — Independent slices with clear ownership
3. **Append-only state** — Sync events never conflict
4. **Relevance filtering** — Developers only see their concerns
5. **Ownership validation** — Agents can't cross-contaminate
6. **Type sync** — Generated types guarantee alignment
7. **Git-native** — No servers, works offline, human-recoverable

## Lazy Design (Ponytail)

This project follows the "Ponytail" principle: lazy, minimal, YAGNI-first.

- **No speculative abstractions** — only build what's needed
- **Stdlib first** — minimize dependencies
- **One-line solutions** work when they work
- **Deliberate simplifications** are marked with `// ponytail:` comments

## What's Deferred to v2

- File watcher for auto-refresh packs
- AI-assisted merge proposals
- GitHub PR integration
- Contract linting
- VS Code extension
- Prose change-impact summaries
- Live project graph view

## Use Cases

**Hackathons:** 4-8 developers + AI agents, 24-48 hour sprints  
**Team sprints:** Small teams (3-5) working on independent features  
**Parallel development:** When you need strict ownership + coordination  
**AI-assisted coding:** Any team using Claude Code, Cursor, or similar  

## License

MIT — See LICENSE file

## Contributing

This is a reference implementation of the HackSES coordination protocol. Contributions welcome:
- Bug fixes and performance improvements
- Additional validators (security linting, performance checks)
- Language support (Go, Rust, Python CLIs)
- IDE integrations (VS Code, JetBrains)
- Educational use cases and templates

## Contact

Questions? Open an issue or see [QUICKSTART.md](./QUICKSTART.md) troubleshooting.

---

**Ready to coordinate AI teams?** Run:
```bash
npx hackx init
```

**⚡ HackX: One contract, one truth, true parallelism.**
