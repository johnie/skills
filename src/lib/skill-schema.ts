import { z } from "zod";

import { categoryIds } from "./skill-metadata.ts";

/**
 * `skills.config.ts` and the listing it holds per skill. `content-collections.ts` and the unit tests load this
 * file under plain Node (no path aliases); client components import its types only, which keeps zod out of
 * their bundle.
 */

const text = z.string().trim().min(1);

const SkillListing = z.object({
  category: z.enum(categoryIds, {
    error: `must be one of ${categoryIds.join(", ")}; to add one, extend categoryIds in src/lib/skill-metadata.ts`,
  }),
  /** What it will not do. */
  never: text,
  /** What the skill looks at. */
  reads: text,
  /** One sentence for the listing; the frontmatter `description` is written for model triggering, not for people. */
  summary: text,
  /** What it creates or changes. */
  writes: text,
});

/** A listing per skill directory name, and the names kept off the site. */
export const SkillsConfigSchema = z.object({
  exclude: z.array(text),
  skills: z.record(text, SkillListing),
});

export type SkillsConfig = z.input<typeof SkillsConfigSchema>;

/** A skill as the listing shows it. */
export type Skill = z.output<typeof SkillListing> & { name: string };
