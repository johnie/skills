import { readdirSync } from "node:fs";
import path from "node:path";

export const SKILLS_DIR = path.join(import.meta.dirname, "..", "skills");

export const skillPath = (name: string): string => path.join(SKILLS_DIR, name);

/**
 * Every skill in the repo, by directory name. skill-creator leaves gitignored `<skill>-workspace/` siblings
 * beside the skills it evaluates; those are not skills. A directory counts whether or not it holds a SKILL.md,
 * so the structure suite can fail one that doesn't.
 */
export const discoverSkills = (): string[] => {
  const names = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(
      (entry) => entry.isDirectory() && !entry.name.endsWith("-workspace")
    )
    .map((entry) => entry.name)
    .toSorted();

  if (names.length === 0) {
    throw new Error(`No skills found in ${SKILLS_DIR}`);
  }

  return names;
};
