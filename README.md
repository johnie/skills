# Skills

The agent skills I use every day. Each one is a markdown prompt an agent loads when your request matches its description, or when you type its slash command.

Browse them at [skills.johnie.se](https://skills.johnie.se).

## Install

```bash
# Claude Code plugin
/plugin marketplace add johnie/skills
/plugin install skills@johnie

# Or the skills.sh CLI, for any agent
npx skills add johnie/skills                 # all skills
npx skills add johnie/skills --skill commit  # one skill

# Or read a skill without installing it
curl -H "Accept: text/markdown" https://skills.johnie.se/commit
```

## The skills

| Skill | What it does |
| --- | --- |
| [`commit`](skills/commit/SKILL.md) | Turns your changes into small, conventional commits. |
| [`pr`](skills/pr/SKILL.md) | Creates, updates, and reviews GitHub pull requests. |
| [`gh-logs`](skills/gh-logs/SKILL.md) | Explains GitHub Actions failures and suggests fixes. |
| [`reshape`](skills/reshape/SKILL.md) | Restructures code so agents read less per change. |
| [`typescript-engineer`](skills/typescript-engineer/SKILL.md) | Fixes TypeScript errors and strengthens your types. |
| [`stricli`](skills/stricli/SKILL.md) | Builds type-safe command-line tools with Stricli. |
| [`cleye`](skills/cleye/SKILL.md) | Builds type-safe command-line tools with cleye. |
| [`wp-cli`](skills/wp-cli/SKILL.md) | Manages WordPress sites from the command line. |

Each `SKILL.md` lists its commands and flags.

## Development

Requires pnpm and the Node version in `.nvmrc`.

```bash
pnpm install
pnpm test                      # validate every skill
pnpm check                     # lint and format (pnpm fix repairs)
pnpm run skills                # pick skills to symlink into ~/.claude/skills/
pnpm run skills link <name>    # or link one; also: unlink, list
pnpm dev                       # website at http://localhost:3000
```

### Add a skill

1. Create `skills/<name>/SKILL.md`. The directory name is kebab-case and equals the frontmatter `name`.
2. Add `"./skills/<name>"` to `.claude-plugin/marketplace.json`.
3. Add its listing to `skills.config.ts`, or its name to `exclude` to keep it off the website.
4. Run `pnpm test`, then `pnpm run skills link <name>` and try it.

### What `pnpm test` enforces

- **Layout:** only `references/`, `scripts/`, `assets/` and `evals/` beside `SKILL.md`; scripts are executable.
- **Frontmatter:** the contract in `catalog/frontmatter.ts`. `description` is 50 to 1024 characters; unknown fields fail.
- **Tools:** no bare `Bash` in `allowed-tools`. It pre-approves every shell command, so scope it: `Bash(git commit *)`.
- **`SKILL.md`:** at most 800 lines (aim for 500), a language on every code block, no skipped heading levels.
- **Links:** every local link and `#anchor` resolves.
- **Content:** nothing specific to this repo or its author, and no dangerous shell or prompt-injection patterns.
- **Manifests:** `marketplace.json` and `skills.config.ts` name exactly the skills on disk.
- **Evals:** `evals/trigger-set.json` has 8 or more cases per class and no `/slash` queries.

`CLAUDE.md` describes the repository layout and the website in detail.

## License

MIT. Created by [@johnie](https://johnie.se).
