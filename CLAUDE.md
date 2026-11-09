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

# Website (rshono: Hono + Rspack + React Server Components, deployed to Cloudflare)
pnpm dev              # content-collections watcher + dev server with HMR, http://localhost:3000 (Node >= 22.18)
pnpm build            # Generate content collections, then the production build for Cloudflare
pnpm preview          # Build, then run it in workerd on port 8787
pnpm run deploy       # Build, then ship it to Cloudflare
pnpm typecheck        # tsc --noEmit

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
- `src/` - Website (rshono). Read <https://www.rshono.com/llms.txt> before guessing at a framework convention
  - `routes.ts` - Route table, the one file rshono requires
  - `server.ts` - Hono app mounted ahead of the pages: middleware, API routes, redirects, error reporting. `GET /:name` with `Accept: text/markdown` answers the skill bundle from `skillMarkdown` in `lib/skills.ts`; every other request falls through to the page. The old `/skills/*` paths 301 to the same path without the prefix
  - `components/` - Pages (server components) and components; interactive parts are `'use client'`
    - `home/` - Landing page sections; `skill-directory.tsx` (tabs + search) is the only client section
    - `skill.tsx`, `reference.tsx` - Prerendered pages for each skill (`/:name`) and reference file (`/:name/references/:reference`); `skill/skill-shell.tsx` is their shared layout, built from the pieces in `skill/parts.tsx`
  - `lib/site.ts` - Site links and install commands; `lib/github.ts` - The header's stargazer count, fetched unauthenticated and cached an hour per isolate (prerendered pages keep the build-time count)
  - `lib/skills.ts` - The only importer of the generated collections (`.content-collections/generated`, gitignored). Imported by relative path, not the alias content-collections suggests: rshono's server build externalizes unknown bare specifiers. Server-only: documents carry rendered HTML, so client components get the trimmed `skills` listing
  - `lib/skill-schema.ts` (zod schemas for the frontmatter and `skills.config.ts`, also run by `test/unit/skills-config.test.ts`), `lib/skill-metadata.ts` (categories, listing `Skill` type), `lib/remark-skill-links.ts` (rewrites GitHub-style relative links to site routes) - Loaded by `content-collections.ts` under plain Node: no `@/` aliases there
  - `fonts/` - Vendored Geist Serif (OFL). Its only npm source, `geist`, is `next/font`-only and peers on Next; Geist and Geist Mono come from `@fontsource-variable`
  - The site has no border radius: `--radius` is `0` in `src/styles.css`, and shadcn `base-lyra` components are already `rounded-none`. Don't add `rounded-*` classes
- `public/` - Served verbatim at the web root
- `content-collections.ts` - Collections for `skills/*/SKILL.md` and `skills/*/references/*.md` (validated, rendered to HTML: GFM, heading ids, Shiki with both themes as CSS variables), plus `files`: every installable skill file verbatim, for the markdown bundle. `content-collections build` exits non-zero on a validation error
- `skills.config.ts` - The website listing per skill (category, summary, reads, writes, never), kept out of SKILL.md. Every skill needs an entry unless its name is in `exclude`, which keeps it off the site but still installable
- `rshono.config.ts` - Deploy target (`cloudflare`) and the Rspack hook that runs Tailwind via `postcss.config.mjs`
- `components.json` - shadcn/ui config (preset `b3XobElTus`: `base-lyra`, Base UI, Hugeicons, Geist). rshono isn't a framework the shadcn CLI detects, so `shadcn init` and `shadcn apply` fail with "could not detect a supported framework"; theme tokens live by hand in `src/styles.css` (dark tokens under `prefers-color-scheme`, not `.dark`). `pnpm dlx shadcn@latest add <component>` works and writes to `src/components/ui/`. Any added component that wraps a Base UI primitive or uses hooks needs `"use client"` at the top: `rshono dev` externalizes `node_modules` from the server-component layer, so Base UI's own `'use client'` is never seen and the page dies with "Invalid hook call"

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
