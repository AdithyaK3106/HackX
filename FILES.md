# HackSES File Index

## Getting Started

- **[README.md](./README.md)** — Main project overview, quick start, features
- **[QUICKSTART.md](./QUICKSTART.md)** — 5-minute setup walkthrough
- **[LINKEDIN_POST.md](./LINKEDIN_POST.md)** — Social media announcement

## Documentation

- **[HackSES_FRD_v2.md](./HackSES_FRD_v2.md)** — Full Functional Requirements Spec
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** — Detailed project overview, architecture, metrics
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** — 5-milestone breakdown with tasks
- **[STATUS.md](./STATUS.md)** — Project completion status per milestone
- **[CLAUDE.md](./CLAUDE.md)** — Development guidelines (Ponytail principle)

## Source Code

```
src/
├── cli.ts                      # Main CLI entry point
├── index.ts                    # Public API exports
├── commands/                   # CLI commands
│   ├── init.ts                 # hackses init
│   ├── contract.ts             # hackses contract generate
│   ├── partition.ts            # hackses partition
│   ├── context.ts              # hackses context <owner>
│   ├── sync.ts                 # hackses sync
│   ├── pull.ts                 # hackses pull <owner>
│   └── integrate.ts            # hackses integrate
├── emitters/                   # Type code generation
│   ├── typescript.ts           # TypeScript emitter
│   ├── python.ts               # Python emitter
│   └── regenerate.ts           # Type regeneration
├── partition/                  # Work slicing
│   ├── slicer.ts               # Slice proposal, dependency validation
│   └── packer.ts               # Context pack builder
├── schemas/                    # Data validation (Zod)
│   ├── config.ts               # Config schema
│   ├── contracts.ts            # Contracts schema
│   ├── ownership.ts            # Ownership schema
│   ├── slices.ts               # Slices schema
│   ├── graph.ts                # Graph schema
│   ├── sync.ts                 # Sync events schema
│   └── integration.ts          # Integration state schema
├── state/                      # State management
│   └── manager.ts              # StateManager (read/write all .hackses/ files)
├── sync/                       # Synchronization
│   ├── events.ts               # Sync event creation
│   └── relevance.ts            # Relevance filtering
├── validators/                 # Integration validators
│   ├── check.ts                # hackses check command
│   ├── ownership.ts            # Ownership validation
│   ├── contracts.ts            # Contract compatibility
│   ├── types.ts                # Type consistency
│   └── schema.ts               # Schema destructive-op detection
├── io/                         # File I/O
│   ├── reader.ts               # YAML/JSON/text readers
│   └── writer.ts               # YAML/JSON/text writers
└── hardening/                  # Hardening tests
    ├── perf.test.ts            # Performance budgets
    ├── conflicts.test.ts       # Conflict-resistance
    └── edge-cases.test.ts      # Edge case scenarios
```

## Tests

```
18 test files, 111 tests total
├── Schemas (4 files, 20 tests)
│   ├── config.test.ts
│   ├── contracts.test.ts
│   ├── slices.test.ts
│   └── sync/events.test.ts
├── State & I/O (2 files, 18 tests)
│   ├── state/manager.test.ts
│   └── validators/check.test.ts
├── Emitters (2 files, 9 tests)
│   ├── emitters/typescript.test.ts
│   └── emitters/regenerate.test.ts
├── Partition (2 files, 14 tests)
│   ├── partition/slicer.test.ts
│   └── partition/packer.test.ts
├── Sync (2 files, 17 tests)
│   ├── sync/relevance.test.ts
│   └── commands/init.test.ts
├── Validators (3 files, 19 tests)
│   ├── validators/ownership.test.ts
│   ├── validators/contracts.test.ts
│   └── validators/schema.test.ts
└── Hardening (2 files, 16 tests)
    ├── hardening/perf.test.ts
    └── hardening/conflicts.test.ts
```

## Configuration

- **[package.json](./package.json)** — npm package, scripts, dependencies
- **[tsconfig.json](./tsconfig.json)** — TypeScript config
- **[vitest.config.ts](./vitest.config.ts)** — Test configuration
- **[.gitignore](./.gitignore)** — Git ignore rules

## Project Metadata

- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** — 5-milestone breakdown
- **[STATUS.md](./STATUS.md)** — Completion tracking
- **[FILES.md](./FILES.md)** — This file

## Architecture

### Milestones

1. **M1: State Layer** (28 tests)
   - Zod schemas for all `.hackses/` files
   - Read/write utilities (YAML, JSON, text)
   - `hackses check` validator

2. **M2: Contract Definition** (17 tests)
   - `hackses init` bootstrap
   - `hackses contract generate` CLI
   - TypeScript + Python type emitters

3. **M3: Work Partitioning** (14 tests)
   - `hackses partition` slice proposal
   - Context pack builder
   - `hackses context` command

4. **M4: Sync & Pull** (17 tests)
   - `hackses sync` event creation
   - Relevance filtering engine
   - `hackses pull` command

5. **M5: Integration Validation** (19 tests)
   - Ownership validator
   - Contract compatibility checker
   - Type consistency validator
   - Schema validator
   - `hackses integrate` merge decision

6. **Hardening** (16 tests)
   - Performance budget tests
   - Conflict-resistance tests
   - Edge case scenarios

### Commands (8 total)

```
hackses init              # M1-2: Bootstrap
hackses contract          # M2: Define APIs
hackses partition         # M3: Slice work
hackses context <owner>   # M3: Context pack
hackses sync              # M4: Record progress
hackses pull <owner>      # M4: View updates
hackses check             # M1: Validate state
hackses integrate         # M5: Merge gate
```

### State Files (.hackses/)

```
.hackses/
├── config.yaml                # Stack, team, commands
├── contracts.yaml             # API definitions (canonical)
├── schema.sql                 # Database schema
├── ownership.yaml             # Path globs → owner
├── conventions.md             # Naming, error format
├── shared_types/              # Generated types
│   ├── index.ts              # TypeScript
│   └── types.py              # Python
├── slices.json                # Work units + ownership
├── graph.json                 # Dependencies (DAG)
├── packs/                     # Owner-scoped context
│   ├── alice.md
│   ├── bob.md
│   └── charlie.md
├── sync/                      # Append-only events
│   ├── 2026-07-06T16-05-22_alice.json
│   └── 2026-07-06T16-10-15_bob.json
└── integration_state.json     # Merge history
```

## Key Stats

- **Lines of code:** ~3000 (source + tests + docs)
- **Test coverage:** 111 tests, > 80% on new modules
- **Performance:** check < 1s, integrate < 10s
- **Conflicts:** 0 (verified for 4 concurrent authors)
- **Setup time:** 5 minutes to first context pack

## How to Use This Repo

### For Hackathons
1. Read [QUICKSTART.md](./QUICKSTART.md)
2. Run `npx hackses init`
3. Hand context packs to your AI agents

### For Development
1. Read [CLAUDE.md](./CLAUDE.md) for guidelines
2. Check [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for architecture
3. Run `npm install && npm test`

### For Understanding the Design
1. Start with [README.md](./README.md)
2. Read [HackSES_FRD_v2.md](./HackSES_FRD_v2.md) for full spec
3. See [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for architecture

---

**HackSES is complete and ready to use.** ⚡
