# Agent Output Governance Standard

> **Version:** 1.0 | **Applies to:** All AI agents in Antigravity projects

---

## File Creation Rules

1. **NEVER** create files in project root (except standard: GEMINI.md, CLAUDE.md, AGENTS.md, CHANGELOG.md, README.md)
2. **NEVER** create ad-hoc log files — use `docs/DEVLOG.md` (append mode only)
3. **NEVER** create TODO/task files outside `docs/TODO.md`
4. **NEVER** create temporary analysis files — use Knowledge Items or the appropriate `docs/` subdirectory
5. **ALWAYS** check `docs/standards/output_governance.md` before creating any file

## Output Routing Table

| Output Type         | Location                               | Naming Convention       |
| ------------------- | -------------------------------------- | ----------------------- |
| Audit report        | `docs/audit/YYYY-MM-DD_<name>.md`      | Date-prefixed           |
| Implementation plan | `docs/plans/<name>.md`                 | Max 5 active            |
| Research            | `docs/research/<name>.md`              | Update INDEX.md         |
| ADR                 | `docs/decisions/ADR-NNN-<title>.md`    | Sequential number       |
| Session log         | `docs/DEVLOG.md` (append)              | See format below        |
| Task/TODO           | `docs/TODO.md` (update in-place)       | Backlog/InProgress/Done |
| Knowledge           | Antigravity KIs                        | Via KI system           |
| Skills              | `.gemini/skills/` or `.claude/skills/` | SKILL.md format         |
| Workflows           | `.agent/workflows/`                    | Frontmatter + steps     |
| Config              | `config/`                              | YAML/JSON only          |

## Forbidden Outputs

| ❌ Never Create            | ✅ Instead                      |
| ------------------------- | ------------------------------ |
| `analysis_*.md` in root   | → `docs/research/`             |
| `report_*.md` in root     | → `docs/audit/`                |
| `plan_*.md` in root       | → `docs/plans/`                |
| `log_*.md` anywhere       | → Append to `docs/DEVLOG.md`   |
| `TODO_*.md` or `TASKS.md` | → Update `docs/TODO.md`        |
| `notes_*.md` anywhere     | → Knowledge Item               |
| `temp_*.md` anywhere      | → `scripts/temp/` (gitignored) |

## Archival Policy

- Audit reports > 30 days → `docs/audit/_archive/`
- Completed plans → DELETE (or archive if ADR-worthy)
- Done TODOs → Remove after 7 days in "Done" section
- Max 5 active plans at any time

## DEVLOG.md Session Entry Format

```markdown
## YYYY-MM-DD (Session: <Topic>)

### Accomplished
- Concrete list of things done

### Decisions
- Key decisions made and rationale

### Metrics
- Files changed: N | Lines: +X/-Y
```

> **No "Next Steps" section.** All pending work goes to `docs/TODO.md`.
