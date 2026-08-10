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
  - `evals/trigger-set.json` - Optional description-triggering cases
  - Each skill is a self-contained unit

- `cli/` - Stricli-based CLI (`pnpm run skills`) for symlinking skills to `~/.claude/skills/` where Claude Code discovers them
- `test/unit/` - Validation suite for every skill: frontmatter schema, directory structure, markdown shape, link resolution, dangerous-pattern scan, marketplace sync, eval sets
- `.claude-plugin/marketplace.json` - Hand-maintained plugin manifest. **Add every new skill here**; a test fails if it drifts from `skills/`

### Skill Architecture

Skills are **markdown-based prompt templates** with YAML frontmatter:

```markdown
---
name: skill-name
description: What the skill does, and when to use it. 50-1024 chars.
argument-hint: "[optional-arg]"
allowed-tools:
  - Bash(git status *)
  - Read
---

# Skill Instructions
...
```

`allowed-tools` **pre-approves** tools for the invoking turn — it does not restrict them. A bare `Bash` entry therefore lets every shell command run without a prompt, and the test suite rejects it. Scope rules per subcommand: `Bash(git commit *)`, not `Bash(git *)`.

**How skills work:**
1. User invokes via `/skill-name`, or Claude loads it automatically when the `description` matches
2. Claude Code loads `SKILL.md` from `~/.claude/skills/skill-name/`
3. The rendered content enters the conversation and **stays there for the rest of the session**
4. Skills can reference files in their own `references/` directory

**When creating/modifying skills:**
- Keep SKILL.md focused on instructions, workflows, and decision trees; under 500 lines
- Every line of the body is a recurring token cost — don't restate the `description` in a "When to use" section. Trigger phrases belong in `when_to_use`
- Use `references/` for templates, examples, or large reference material
- Test skills by symlinking them with `pnpm run skills link <name>`
- Skills should be self-contained - don't assume other skills exist
- Run `pnpm test` before pushing; see the authoring conventions in README.md for the full rule list

## PNPM & Node.js Runtime

Use pnpm exclusively - not Bun, Node.js directly, npm, yarn, or vite.

**Prefer Node.js standard APIs:**
- Use built-in standard modules like `node:fs`, `node:path`, `node:child_process`, etc.
- Use `tsx` for running TypeScript files directly without a manual compilation step.

**Testing:** Use `vitest` - imports are `import { test, expect } from "vitest"`
