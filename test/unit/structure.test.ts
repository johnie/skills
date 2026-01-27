import { describe, expect, test } from "bun:test";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { discoverSkills, fileExists, getSkillPath } from "../helpers/skills";

const ALLOWED_SUBDIRS = ["references", "scripts", "assets"];
const DISALLOWED_FILES = [
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "package.json",
];

/**
 * Get all entries in a directory
 */
function getDirectoryEntries(dirPath: string): {
  files: string[];
  dirs: string[];
} {
  try {
    const entries = readdirSync(dirPath);
    const files: string[] = [];
    const dirs: string[] = [];

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        dirs.push(entry);
      } else if (stats.isFile()) {
        files.push(entry);
      }
    }

    return { files, dirs };
  } catch {
    return { files: [], dirs: [] };
  }
}

describe("Directory Structure Validation", () => {
  const skills = discoverSkills();

  if (skills.length === 0) {
    test("at least one skill exists", () => {
      expect(skills.length).toBeGreaterThan(0);
    });
  }

  for (const skillName of skills) {
    describe(`skill: ${skillName}`, () => {
      const skillPath = getSkillPath(skillName);

      test("SKILL.md exists", () => {
        const skillFile = join(skillPath, "SKILL.md");
        expect(fileExists(skillFile)).toBe(true);
      });

      test("only contains allowed subdirectories", () => {
        const { dirs } = getDirectoryEntries(skillPath);
        const disallowedDirs = dirs.filter(
          (dir) => !ALLOWED_SUBDIRS.includes(dir)
        );

        expect(disallowedDirs).toEqual([]);
        if (disallowedDirs.length > 0) {
          throw new Error(
            `Disallowed directories found: ${disallowedDirs.join(", ")}. Only ${ALLOWED_SUBDIRS.join(", ")} are allowed.`
          );
        }
      });

      test("does not contain extraneous files", () => {
        const { files } = getDirectoryEntries(skillPath);
        const extraneousFiles = files.filter(
          (file) => file !== "SKILL.md" && DISALLOWED_FILES.includes(file)
        );

        expect(extraneousFiles).toEqual([]);
        if (extraneousFiles.length > 0) {
          throw new Error(
            `Extraneous files found: ${extraneousFiles.join(", ")}. These files should not be in the skill directory.`
          );
        }
      });
    });
  }
});
