import type { SkillsConfig } from "./src/lib/skill-schema.ts";

/**
 * What the website shows for each skill under `skills/`. Kept out of SKILL.md so the skills carry nothing
 * site-specific. Every skill needs an entry here unless its name is in `exclude`; the build and
 * `test/unit/skills-config.test.ts` fail otherwise.
 *
 * `exclude` takes a skill off the site entirely: listing, its pages and its markdown bundle. It stays in the
 * repo, so `npx skills add johnie/skills` and the plugin marketplace still install it.
 */
export default {
  exclude: ["wp-cli"],
  skills: {
    bluf: {
      category: "writing",
      never: "invent missing facts",
      reads: "drafts, PR bodies",
      summary: "Rewrites wordy text so the main point comes first.",
      writes: "short, plain rewrites",
    },
    cleye: {
      category: "cli",
      never: "migrate other frameworks",
      reads: "installed cleye version",
      summary: "Builds type-safe command-line tools with cleye.",
      writes: "typed CLI code",
    },
    commit: {
      category: "git",
      never: "bypass commit hooks",
      reads: "git diff",
      summary: "Turns your changes into small, conventional commits.",
      writes: "commits",
    },
    "de-slop": {
      category: "writing",
      never: "change facts or quotes",
      reads: "essays, posts, drafts",
      summary: "Strips AI tells from prose and keeps your voice.",
      writes: "rewrites, slop scores",
    },
    "gh-logs": {
      category: "github",
      never: "edit workflow YAML",
      reads: "failed workflow logs",
      summary: "Explains GitHub Actions failures and suggests fixes.",
      writes: "a diagnosis",
    },
    pr: {
      category: "github",
      never: "merge pull requests",
      reads: "branch commits, diff",
      summary: "Creates, updates, and reviews GitHub pull requests.",
      writes: "pull requests, reviews",
    },
    // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- a skill's directory name, not a symbol
    reshape: {
      category: "codebase",
      never: "fix unrelated findings",
      reads: "code, dependencies",
      summary: "Restructures code so agents read less per change.",
      writes: "structural refactors",
    },
    stricli: {
      category: "cli",
      never: "migrate other frameworks",
      reads: "@stricli/core version",
      summary: "Builds type-safe command-line tools with Stricli.",
      writes: "typed CLI code",
    },
    "typescript-engineer": {
      category: "codebase",
      never: "change runtime behavior",
      reads: "tsc --noEmit",
      summary: "Fixes TypeScript errors and strengthens your types.",
      writes: "types, type tests",
    },
    "wp-cli": {
      category: "wordpress",
      never: "untested prod commands",
      reads: "site state",
      summary: "Manages WordPress sites from the command line.",
      writes: "site data, config",
    },
  },
} satisfies SkillsConfig;
