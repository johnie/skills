/**
 * Runtime values shared with client components. No path aliases or non-erasable syntax here:
 * `content-collections.ts` imports this file through `skill-schema.ts`.
 */

export const categoryIds = [
  "git",
  "github",
  "codebase",
  "cli",
  "writing",
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
  writing: "Writing",
};
