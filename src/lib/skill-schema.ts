import { z } from "zod";

import { categoryIds } from "./skill-metadata.ts";

const text = z.string().trim().min(1);

/**
 * Build-time and test-only: `content-collections.ts` and the unit tests import this file under plain Node, so
 * zod never reaches a bundle.
 */

/**
 * The SKILL.md frontmatter fields the website uses. Unlisted fields are dropped, not rejected; the frontmatter
 * suite owns the full field rules.
 */
export const SkillFrontmatter = z.object({
  "allowed-tools": z.array(z.string()).optional(),
  "argument-hint": z.string().optional(),
  description: text,
  name: text,
});

/** One skill's website listing in `skills.config.ts`. */
const SkillListing = z.object({
  category: z.enum(categoryIds, {
    error: `must be one of ${categoryIds.join(", ")}; to add one, extend categoryIds in src/lib/skill-metadata.ts`,
  }),
  never: text,
  reads: text,
  summary: text,
  writes: text,
});

/** `skills.config.ts`: a listing per skill directory name, and the names kept off the site. */
export const SkillsConfigSchema = z.object({
  exclude: z.array(text),
  skills: z.record(text, SkillListing),
});

export type SkillsConfig = z.input<typeof SkillsConfigSchema>;
