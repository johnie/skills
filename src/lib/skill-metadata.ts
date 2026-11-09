/**
 * The skill listing's shape, shared by the page and its client components. Validation lives in
 * `skill-schema.ts`, which only the build and the tests load.
 *
 * No path aliases or non-erasable syntax here: `content-collections.ts` imports this file through `skill-schema.ts`.
 */

export const categoryIds = [
  "git",
  "github",
  "codebase",
  "cli",
  "wordpress",
] as const;

export type CategoryId = (typeof categoryIds)[number];

/** Tab order follows `categoryIds`. */
export const categoryLabels: Record<CategoryId, string> = {
  cli: "CLI",
  codebase: "Codebase",
  git: "Git",
  github: "GitHub",
  wordpress: "WordPress",
};

export interface Skill {
  name: string;
  category: CategoryId;
  /** One sentence for the listing; `description` is written for model triggering, not for people. */
  summary: string;
  /** What the skill looks at. */
  reads: string;
  /** What it creates or changes. */
  writes: string;
  /** What it will not do. */
  never: string;
}
