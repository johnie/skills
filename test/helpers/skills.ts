import { readdirSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const SKILLS_DIR = path.join(import.meta.dirname, "../../skills");

/**
 * Discover all skills by scanning the skills/ directory
 * Returns array of skill directory names
 */
export const discoverSkills = (): string[] => {
  try {
    const entries = readdirSync(SKILLS_DIR);
    return entries.filter((entry) => {
      // skill-creator eval workspaces are siblings, not skills
      if (entry.endsWith("-workspace")) {
        return false;
      }
      const fullPath = path.join(SKILLS_DIR, entry);
      return statSync(fullPath).isDirectory();
    });
  } catch (error) {
    console.error("Error discovering skills:", error);
    return [];
  }
};

/**
 * Get the full path to a skill directory
 */
export const getSkillPath = (skillName: string): string =>
  path.join(SKILLS_DIR, skillName);

/**
 * Read and return the SKILL.md content for a skill
 */
export const readSkillFile = (skillName: string): Promise<string> => {
  const skillPath = getSkillPath(skillName);
  const skillFilePath = path.join(skillPath, "SKILL.md");

  return readFile(skillFilePath, "utf-8");
};

/**
 * Check if a file exists
 */
export const fileExists = (filePath: string): boolean => {
  try {
    statSync(filePath);
    return true;
  } catch {
    return false;
  }
};
