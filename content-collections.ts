import path from "node:path";

import { defineCollection, defineConfig } from "@content-collections/core";
import type { Context, Meta } from "@content-collections/core";
import { compileMarkdown } from "@content-collections/markdown";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { z } from "zod";

import skillsConfig from "./skills.config.ts";
import { remarkSkillLinks } from "./src/lib/remark-skill-links.ts";
import {
  SkillFrontmatter,
  SkillsConfigSchema,
} from "./src/lib/skill-schema.ts";

/**
 * `skills/<name>/SKILL.md` and `skills/<name>/references/*.md`, validated and rendered to HTML at build time, plus
 * every file a skill installs, verbatim, for its markdown bundle. Each skill's listing comes from
 * `skills.config.ts`, and skills it excludes are skipped in every collection. `pnpm dev` keeps
 * `.content-collections/generated` in sync; `src/lib/skills.ts` is the only importer. `<name>-workspace/` siblings
 * have no top-level SKILL.md, references/ or scripts/, so no glob reaches them.
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

const skills = defineCollection({
  directory: "skills",
  include: "*/SKILL.md",
  name: "skills",
  schema: SkillFrontmatter.extend({ content: z.string() }),
  transform: async (document, context) => {
    if (excluded.has(document.name)) {
      return context.skip(EXCLUDED);
    }

    const listing = config.data.skills[document.name];

    if (listing === undefined) {
      throw new Error(
        `${document.name} has no entry in skills.config.ts: add its listing under skills, or its name under exclude`
      );
    }

    return {
      allowedTools: document["allowed-tools"] ?? [],
      argumentHint: document["argument-hint"],
      description: document.description,
      html: await renderMarkdown(context, document, document.name),
      name: document.name,
      ...listing,
    };
  },
});

/** A skill's installable files as written, `evals/` excluded: what `Accept: text/markdown` on its page returns. */
const files = defineCollection({
  directory: "skills",
  include: ["*/SKILL.md", "*/references/*.md", "*/scripts/**"],
  name: "files",
  parser: { hasContent: false, parse: (source: string) => ({ source }) },
  schema: z.object({ source: z.string() }),
  transform: ({ source, _meta }, context) => {
    const [skill = "", ...rest] = _meta.filePath.split("/");

    if (excluded.has(skill)) {
      return context.skip(EXCLUDED);
    }

    return { path: rest.join("/"), skill, source };
  },
});

export default defineConfig({ content: [references, skills, files] });
