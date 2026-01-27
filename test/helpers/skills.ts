/// <reference types="bun-types" />
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SKILLS_DIR = join(import.meta.dir, "../../skills");

/**
 * Discover all skills by scanning the skills/ directory
 * Returns array of skill directory names
 */
export function discoverSkills(): string[] {
  try {
    const entries = readdirSync(SKILLS_DIR);
    return entries.filter((entry) => {
      const fullPath = join(SKILLS_DIR, entry);
      return statSync(fullPath).isDirectory();
    });
  } catch (error) {
    console.error("Error discovering skills:", error);
    return [];
  }
}

/**
 * Get the full path to a skill directory
 */
export function getSkillPath(skillName: string): string {
  return join(SKILLS_DIR, skillName);
}

/**
 * Read and return the SKILL.md content for a skill
 */
export async function readSkillFile(skillName: string): Promise<string> {
  const skillPath = getSkillPath(skillName);
  const skillFile = Bun.file(join(skillPath, "SKILL.md"));
  return await skillFile.text();
}

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    statSync(filePath);
    return true;
  } catch {
    return false;
  }
}
