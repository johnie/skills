import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { skillPath } from "../../catalog/skills";

export const readSkillFile = (skillName: string): string =>
  readFileSync(path.join(skillPath(skillName), "SKILL.md"), "utf-8");

export interface LinePattern {
  name: string;
  pattern: RegExp;
}

/** Binary assets can't carry prose or shell injection, so skip the read. */
const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".zip",
  ".gz",
]);

/**
 * Every text file a skill ships, as paths relative to the skill root. Scripts and assets matter as much as the
 * prose: a bundled script is executed rather than reviewed at call time. `evals/` holds test prompts, which
 * may quote the very phrasing the scans look for.
 */
const skillTextFiles = (skillName: string): string[] =>
  readdirSync(skillPath(skillName), { recursive: true, withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        !BINARY_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
    )
    .map((entry) =>
      path.relative(
        skillPath(skillName),
        path.join(entry.parentPath, entry.name)
      )
    )
    .filter((file) => !file.startsWith(`evals${path.sep}`))
    .toSorted();

/** Every line of a skill's text files that matches a pattern, one readable entry per match. */
export const scanSkill = (
  skillName: string,
  patterns: LinePattern[]
): string[] =>
  skillTextFiles(skillName).flatMap((file) =>
    readFileSync(path.join(skillPath(skillName), file), "utf-8")
      .split("\n")
      .flatMap((line, index) =>
        patterns.flatMap(({ name, pattern }) => {
          const matched = pattern.exec(line)?.[0];

          return matched === undefined
            ? []
            : [`[${name}] "${matched.slice(0, 120)}" in ${file}:${index + 1}`];
        })
      )
  );
