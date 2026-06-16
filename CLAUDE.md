# AGENTS.md

Project conventions, guidelines, and best practices for AI coding assistants.

## Commands

```bash
pnpm install          # Install dependencies
pnpm test             # Run tests
pnpm test path/to/file.test.ts  # Run single test file

# Skill Management
pnpm run skills       # Interactive skill symlink manager
pnpm run skills list  # List all skills and their link status
pnpm run skills link <name>    # Link a skill to ~/.claude/skills/
pnpm run skills unlink <name>  # Unlink a skill

# Linting/Formatting (Ultracite + Biome)
pnpm exec ultracite fix   # Auto-fix formatting and lint issues
pnpm exec ultracite check # Check for issues without fixing
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
- Test skills by symlinking them with `pnpm run skills link <name>`
- Skills should be self-contained - don't assume other skills exist

## PNPM & Node.js Runtime

Use pnpm exclusively - not Bun, Node.js directly, npm, yarn, or vite.

**Prefer Node.js standard APIs:**
- Use built-in standard modules like `node:fs`, `node:path`, `node:child_process`, etc.
- Use `tsx` for running TypeScript files directly without a manual compilation step.

**Testing:** Use `vitest` - imports are `import { test, expect } from "vitest"`
