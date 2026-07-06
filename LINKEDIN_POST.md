# HackSES: Coordination Protocol for AI Coding Teams

Just shipped **HackSES** — a CLI tool that lets hackathon teams coordinate AI agents (Claude, Cursor, GPT, Gemini…) without merge hell.

## The Problem

You have 4 developers, each with their own AI coding agent. The agents are *fast*—but without shared contracts, they build incompatible interfaces, step on each other's code, and create merge conflicts you don't have time to untangle. The team becomes sequential again.

## The Solution

**HackSES** is a git-backed protocol (no servers, no cloud) that:

1. **Defines one contract** — canonical API definitions that all agents see upfront
2. **Partitions work** — vertical slices, each with scoped ownership and a context pack
3. **Keeps everyone synced** — append-only event log (zero merge conflicts)
4. **Validates integration** — blocks breaking changes before merge

All state is plain text in `.hackses/`. All coordination happens through git. Your agents work in parallel; you stay aligned.

## 5-Minute Setup

```bash
npx hackses init              # Define team + stack
npx hackses contract generate # Define your APIs
npx hackses partition         # Slice work, assign owners
npx hackses context <name>    # Each dev gets their context pack
```

Pass the context pack to your AI agent. While your agent codes:

```bash
npx hackses sync              # Record progress
npx hackses pull <name>       # See relevant teammate updates
npx hackses integrate         # Merge validation (auto-approve if safe)
```

## Key Features

✅ **No servers** — works offline, uses only git  
✅ **Zero merge conflicts** — append-only event log  
✅ **Type sync** — auto-generates TypeScript + Python from contracts  
✅ **Ownership enforcement** — agents can only edit assigned paths  
✅ **Relevance filtering** — each dev sees only changes that matter to them  
✅ **Merge decisions** — auto-approve safe changes, require review for API changes  

## What Ships

**8 CLI commands** (init, contract, partition, context, sync, pull, check, integrate)  
**111 passing tests** (perf, conflict-resistance, edge cases)  
**5 core engines** (R1–R4 modules mapping to responsibilities)  
**< 1s validation** even with 100 contracts + 50 slices

## Why It Matters

Hackathons are about moving fast. Coordination overhead kills momentum. HackSES removes it:
- No "wait for main to be unlocked"
- No manual merge conflict resolution
- No "which API did you implement again?"
- Agents work in true parallel

The contract is the coordination mechanism. Everything else follows.

## Open & MIT

Full code is on GitHub. No dependencies on proprietary platforms. Works with *any* AI coding agent.

**Try it**: `npx hackses init` → 5 minutes to coordinated teams.

---

*Built for ASES hackathon protocol research. Shipping at v1 with M1–M5 complete: state layer, contracts, partitioning, sync, integration.*

**#hackathon #AI #coordination #DevTools #OpenSource**

---

### Hashtags for reach
#HackathonTools #AIcoding #ClaudeCode #GitOps #TeamCoordination #OpenSource #SoftwareEng
