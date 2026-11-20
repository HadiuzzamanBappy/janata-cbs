# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Claude Code notes

- `AGENTS.md` (above) is the single source for gates, commands, invariants and the architecture map. Don't repeat it here.
- `.claude/skills/*` are pointers: each one loads the matching `.agents/skills/*/SKILL.md`. Edit the `.agents` file, never the pointer.
- The AGENTS.md commit rule overrides Claude Code's default: never add a `Co-Authored-By` trailer or a "Generated with Claude Code" line to commits or PRs.
