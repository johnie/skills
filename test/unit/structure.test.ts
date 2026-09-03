import { accessSync, constants, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { discoverSkills, fileExists, getSkillPath } from "../helpers/skills";

const ALLOWED_SUBDIRS = new Set(["references", "scripts", "assets", "evals"]);
const DISALLOWED_FILES = new Set([
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "package.json",
]);

interface DirectoryEntries {
  dirs: string[];
  files: string[];
}

/**
 * Get all entries in a directory.
 */
const getDirectoryEntries = (dirPath: string): DirectoryEntries => {
  try {
    const entries = readdirSync(dirPath);
    const dirs: string[] = [];
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        dirs.push(entry);
      } else if (stats.isFile()) {
        files.push(entry);
      }
    }

    return { dirs, files };
  } catch {
    return { dirs: [], files: [] };
  }
};

describe("Directory Structure Validation", () => {
  const skills = discoverSkills();

  test("discovers at least one skill", () => {
    expect(skills.length).toBeGreaterThan(0);
  });

  test.each(skills)("%s matches the skill package contract", (skillName) => {
    const skillPath = getSkillPath(skillName);
    const skillFile = path.join(skillPath, "SKILL.md");
    expect(fileExists(skillFile)).toBeTruthy();

    const { dirs, files } = getDirectoryEntries(skillPath);
    const disallowedDirs = dirs.filter((dir) => !ALLOWED_SUBDIRS.has(dir));
    expect(
      disallowedDirs,
      `Disallowed directories found: ${disallowedDirs.join(", ")}. Only ${[...ALLOWED_SUBDIRS].join(", ")} are allowed.`
    ).toStrictEqual([]);

    const extraneousFiles = files.filter(
      (file) => file !== "SKILL.md" && DISALLOWED_FILES.has(file)
    );
    expect(
      extraneousFiles,
      `Extraneous files found: ${extraneousFiles.join(", ")}. These files should not be in the skill directory.`
    ).toStrictEqual([]);

    const scriptsPath = path.join(skillPath, "scripts");
    const { files: scriptFiles } = getDirectoryEntries(scriptsPath);
    const nonExecutable = scriptFiles.filter((file) => {
      try {
        accessSync(path.join(scriptsPath, file), constants.X_OK);
        return false;
      } catch {
        return true;
      }
    });
    expect(
      nonExecutable,
      `Scripts missing executable permission: ${nonExecutable.join(", ")}`
    ).toStrictEqual([]);
  });
});
