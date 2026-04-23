---
name: Dotfiles & Device Resilience Plan
description: Plan to back up Claude Code memories, global CLAUDE.md, and MCP settings to a private GitHub dotfiles repo so setup survives device changes
type: project
---

Yan wants to move away from a single-device (WSL) dependency for Claude Code setup. Currently everything works locally but is at risk if the machine changes.

**Why:** Risk of losing memories, global config, and MCP settings if device changes or WSL breaks. Skills and project CLAUDE.md are already safe (in git).

**How to apply:** When Yan asks to resume this, scaffold the dotfiles repo and install script below.

## Current Risk Assessment

| Item | Location | Status |
|---|---|---|
| Skills | `.cursor/skills/` in git repo | ✅ Safe |
| Project `CLAUDE.md` | Project root in git | ✅ Safe |
| Memories | `~/.claude/projects/.../memory/` | ❌ Local only |
| Global `CLAUDE.md` | `~/.claude/CLAUDE.md` | ❌ Local only |
| MCP settings | `~/.claude/settings.json` | ❌ Local only |
| Cron jobs | Session-only or `.claude/scheduled_tasks.json` | ❌ Mostly ephemeral |

## Agreed Plan: Private Dotfiles Repo

Target structure: `github.com/yanjin/dotfiles` (private)
```
dotfiles/
├── claude/
│   ├── CLAUDE.md           ← global instructions
│   ├── settings.json       ← MCP keys + permissions (⚠️ contains API keys)
│   └── memory/             ← all memory files + MEMORY.md
└── install.sh              ← symlinks everything back to ~/.claude/
```

On a new device: `git clone + ./install.sh` restores everything.

## Memory Sync Strategy
- Memory system auto-writes to `~/.claude/projects/.../memory/`
- Manually `git add + commit` memory folder after significant sessions
- Or add a periodic cron to auto-commit memory changes

## Status
⏸️ **Parked** — Yan said "for now" is fine staying local. Resume when ready to set up the dotfiles repo.

**Next action**: Scaffold `install.sh` and repo structure when Yan gives the go-ahead.
