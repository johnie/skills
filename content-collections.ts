import path from "node:path";

import { defineCollection, defineConfig } from "@content-collections/core";
import type { Context, Meta } from "@content-collections/core";
import { compileMarkdown } from "@content-collections/markdown";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { z } from "zod";

import { parseToolRule, SkillFrontmatter } from "./catalog/frontmatter.ts";
import skillsConfig from "./skills.config.ts";
import { remarkSkillLinks } from "./src/lib/remark-skill-links.ts";
import { bundleSkill } from "./src/lib/skill-bundle.ts";
import { SkillsConfigSchema } from "./src/lib/skill-schema.ts";

/**
 * `skills/<name>/SKILL.md` and `skills/<name>/references/*.md`, validated and rendered to HTML at build time. Each
 * skill document also carries its listing from `skills.config.ts` and its markdown bundle; skills the config
 * excludes are skipped. `pnpm dev` keeps `.content-collections/generated` in sync; `src/lib/skills.ts` is the
 * only importer. `<name>-workspace/` siblings have no top-level SKILL.md, references/ or scripts/, so no glob
 * reaches them.
 */

const config = SkillsConfigSchema.safeParse(skillsConfig);

if (!config.success) {
  throw new Error(`skills.config.ts:\n${z.prettifyError(config.error)}`);
}

const excluded = new Set(config.data.exclude);
const EXCLUDED = "excluded in skills.config.ts";

/** Markdown to HTML: links rewritten for the site, heading ids for `#anchor` links, code highlighted. */
const renderMarkdown = (
  context: Pick<Context, "cache">,
  document: { content: string; _meta: Meta },
  skill: string
) =>
  compileMarkdown(context, document, {
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeShiki,
        {
          defaultColor: false,
          fallbackLanguage: "text",
          langs: ["typescript", "bash", "markdown", "yaml", "json", "csv"],
          // Vesper is dark-only; min-light is the closest monochrome light counterpart.
          themes: { dark: "vesper", light: "min-light" },
        },
      ],
    ],
    remarkPlugins: [
      remarkGfm,
      [
        remarkSkillLinks,
        {
          fromDir: path.posix.relative(skill, document._meta.directory),
          skill,
        },
      ],
    ],
  });

const references = defineCollection({
  directory: "skills",
  include: "*/references/*.md",
  name: "references",
  schema: z.object({ content: z.string() }),
  transform: async (document, context) => {
    const [skill = ""] = document._meta.directory.split("/");

    if (excluded.has(skill)) {
      return context.skip(EXCLUDED);
    }

    const slug = path.basename(document._meta.fileName, ".md");

    return {
      fileName: `references/${document._meta.fileName}`,
      html: await renderMarkdown(context, document, skill),
      skill,
      slug,
      title:
        /^# (?<title>.+)$/mu.exec(document.content)?.groups?.["title"] ?? slug,
    };
  },
});

/**
 * A skill's installable files as written, `evals/` excluded. Read by the `skills` collection for the markdown
 * bundle, so it is defined ahead of it.
 */
const files = defineCollection({
  directory: "skills",
  include: ["*/SKILL.md", "*/references/*.md", "*/scripts/**"],
  name: "files",
  parser: { hasContent: false, parse: (source: string) => ({ source }) },
  schema: z.object({ source: z.string() }),
});

/** `allowed-tools` grouped by tool, in the order the tools first appear. */
const groupPrivileges = (rules: string[]) => {
  const scopesByTool = new Map<string, string[]>();

  for (const { tool, scope } of rules.map(parseToolRule)) {
    const scopes = scopesByTool.get(tool) ?? [];

    if (scope !== undefined) {
      scopes.push(scope);
    }

    scopesByTool.set(tool, scopes);
  }

  return Array.from(scopesByTool, ([tool, scopes]) => ({ scopes, tool }));
};

const skills = defineCollection({
  directory: "skills",
  include: "*/SKILL.md",
  name: "skills",
  schema: SkillFrontmatter.safeExtend({ content: z.string() }),
  transform: async (document, context) => {
    // The directory is the skill's identity, as in the other collections; the frontmatter suite keeps `name` equal to it.
    const name = document._meta.directory;

    if (excluded.has(name)) {
      return context.skip(EXCLUDED);
    }

    const listing = config.data.skills[name];

    if (listing === undefined) {
      throw new Error(
        `${name} has no entry in skills.config.ts: add its listing under skills, or its name under exclude`
      );
    }

    const prefix = `${name}/`;

    return {
      argumentHint: document["argument-hint"],
      bundle: bundleSkill(
        context
          .documents(files)
          .filter(({ _meta }) => _meta.filePath.startsWith(prefix))
          .map(({ _meta, source }) => ({
            path: _meta.filePath.slice(prefix.length),
            source,
          }))
      ),
      description: document.description,
      html: await renderMarkdown(context, document, name),
      listing: { name, ...listing },
      name,
      privileges: groupPrivileges(document["allowed-tools"] ?? []),
    };
  },
});

export default defineConfig({ content: [references, files, skills] });
