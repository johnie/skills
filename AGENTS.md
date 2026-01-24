# AGENTS.md

Project conventions, guidelines, and best practices for AI coding assistants.

## Commands

```bash
bun install          # Install dependencies
bun test             # Run tests
bun test path/to/file.test.ts  # Run single test file

# Skill Management
bun run skills       # Interactive skill symlink manager
bun run skills list  # List all skills and their link status
bun run skills link <name>    # Link a skill to ~/.claude/skills/
bun run skills unlink <name>  # Unlink a skill

# Linting/Formatting (Ultracite + Biome)
bun x ultracite fix   # Auto-fix formatting and lint issues
bun x ultracite check # Check for issues without fixing
```

Pre-commit hooks run `ultracite fix` automatically via lefthook.

## Repository Structure

This is a **skills repository** for Claude Code. Skills are domain-specific prompt templates that extend Claude's capabilities.

### Key Directories

- `skills/` - Individual skill directories, each containing:
  - `SKILL.md` - Skill instructions and workflow (loaded by Claude Code)
  - `references/` - Supporting documentation, templates, examples
  - Each skill is a self-contained unit

- `manage-skills.ts` - CLI tool for symlinking skills to `~/.claude/skills/` where Claude Code discovers them

### Skill Architecture

Skills are **markdown-based prompt templates** with YAML frontmatter:

```markdown
---
name: skill-name
description: What the skill does
allowed-tools:
  - Bash
  - Read
---

# Skill Instructions
...
```

**How skills work:**
1. User invokes via `/skill-name` in Claude Code
2. Claude Code loads `SKILL.md` from `~/.claude/skills/skill-name/`
3. The skill's markdown becomes part of Claude's system prompt for that conversation turn
4. Skills can reference files in their own `references/` directory

**When creating/modifying skills:**
- Keep SKILL.md focused on instructions, workflows, and decision trees
- Use `references/` for templates, examples, or large reference material
- Test skills by symlinking them with `bun run skills link <name>`
- Skills should be self-contained - don't assume other skills exist

## Bun Runtime

Use Bun exclusively - not Node.js, npm, yarn, pnpm, or vite.

**Prefer Bun APIs:**
- `Bun.serve()` for HTTP servers with routes and WebSockets (not express)
- `Bun.file()` for file I/O (not node:fs)
- `Bun.$` for shell commands (not execa)
- `bun:sqlite` for SQLite (not better-sqlite3)
- `Bun.redis` for Redis (not ioredis)
- `Bun.sql` for Postgres (not pg)
- Built-in `WebSocket` (not ws)

Bun auto-loads `.env` files - don't use dotenv.

**Testing:** Use `bun:test` - imports are `import { test, expect } from "bun:test"`

**Frontend:** Use HTML imports with `Bun.serve()` - Bun bundles .tsx/.jsx/.css automatically when imported from HTML.
