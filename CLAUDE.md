# CLAUDE.md — Antigravity Workspace Instructions

## Overview

**Antigravity Development Environment** — AI-assisted development workspace with
multi-vendor support (Gemini CLI, Claude Code, Codex CLI).

### Central References

| Document              | Purpose                                  | Location                              |
| --------------------- | ---------------------------------------- | ------------------------------------- |
| **PLATFORM.md**       | Subscriptions, CLIs, vendor capabilities | `docs/PLATFORM.md`                    |
| **ROUTING.md**        | Model→task routing matrix, benchmarks    | `docs/ROUTING.md`                     |
| **Output Governance** | Where agents can create files            | `docs/standards/output_governance.md` |

> **Before delegating tasks:** Consult ROUTING.md §3 for optimal model/CLI selection.

## Available Commands

### Claude Code Commands
| Command            | Description                           |
| ------------------ | ------------------------------------- |
| `/help`            | Show available commands               |
| `/project-status`  | Project health overview               |
| `/quick-review`    | Fast code review                      |
| `/team-review`     | Parallel review (code + tests + docs) |
| `/create-tests`    | Generate unit tests                   |
| `/update-docs`     | Sync documentation                    |
| `/insights-review` | Monthly usage insights                |

## Rules of Engagement

1. **NEVER** execute DELETE, DROP, UPDATE, TRUNCATE on databases without confirmation
2. **Read docs/** before starting any task
3. **Update** `CHANGELOG.md` with significant changes
4. **Append** session logs to `docs/DEVLOG.md` only — no separate log files
5. **Update** `docs/TODO.md` for pending tasks — no scattered TODOs
6. **Discovery Before Creation** (ROUTING.md §5): Check existing agents/skills/workflows first
7. **Follow** output governance (`docs/standards/output_governance.md`)

## Opus 4.6 Features

- **Effort Controls**: low → NIVEL 1, high → NIVEL 2, max → NIVEL 3 (see ROUTING.md)
- **Agent Teams**: Parallel sub-agent execution via manifest.json teams
- **Context Window**: 1M tokens (beta), 128K output
- **Compaction**: Use `/compact` for sessions > 100K context

## Key Files

| File                       | Purpose                              |
| -------------------------- | ------------------------------------ |
| `GEMINI.md`                | Gemini CLI instructions              |
| `AGENTS.md`                | Codex CLI instructions               |
| `.subagents/manifest.json` | Sub-agent registry (source of truth) |
| `docs/TODO.md`             | Single task tracker                  |
| `docs/DEVLOG.md`           | Session log (append only)            |
| `CHANGELOG.md`             | Release history                      |

## Sub-Agents

See `ROUTING.md §4` for the full routing matrix. Quick reference:

```bash
# Dispatch sub-agent (default vendor from manifest.json)
./.subagents/dispatch.sh {agent} "prompt"

# Override vendor
./.subagents/dispatch.sh {agent} "prompt" claude
```

Available agents: `code-analyst`, `doc-writer`, `code-reviewer`,
`test-writer`, `db-analyst`, `deployer`, `researcher`
