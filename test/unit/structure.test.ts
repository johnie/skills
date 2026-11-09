import { accessSync, constants, existsSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { discoverSkills, skillPath } from "../../catalog/skills";

const ALLOWED_SUBDIRS = new Set(["references", "scripts", "assets", "evals"]);

const DISALLOWED_FILES = new Set([
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "package.json",
]);

const isExecutable = (file: string): boolean => {
  try {
    accessSync(file, constants.X_OK);

    return true;
  } catch {
    return false;
  }
};

describe("Directory structure", () => {
  it.each(discoverSkills())(
    "%s matches the skill package contract",
    (skillName) => {
      const root = skillPath(skillName);
      const entries = readdirSync(root, { withFileTypes: true });

      expect(entries.map((entry) => entry.name)).toContain("SKILL.md");

      expect(
        entries
          .filter(
            (entry) => entry.isDirectory() && !ALLOWED_SUBDIRS.has(entry.name)
          )
          .map((entry) => entry.name),
        `Only ${[...ALLOWED_SUBDIRS].join(", ")} are allowed as directories`
      ).toStrictEqual([]);

      expect(
        entries
          .filter((entry) => DISALLOWED_FILES.has(entry.name))
          .map((entry) => entry.name),
        "These files should not be in the skill directory"
      ).toStrictEqual([]);

      const scripts = path.join(root, "scripts");

      expect(
        (existsSync(scripts) ? readdirSync(scripts) : []).filter(
          (file) => !isExecutable(path.join(scripts, file))
        ),
        "Scripts missing executable permission"
      ).toStrictEqual([]);
    }
  );
});
