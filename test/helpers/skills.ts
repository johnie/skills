import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Get current directory (works in both Bun and Node/Vitest)
const getCurrentDir = () => {
  if (typeof import.meta.dir !== "undefined") {
    // Bun runtime
    return import.meta.dir;
  }
  // Node/Vitest runtime
  return dirname(fileURLToPath(import.meta.url));
};

const CURRENT_DIR = getCurrentDir();
const SKILLS_DIR = join(CURRENT_DIR, "../../skills");

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
  const skillFilePath = join(skillPath, "SKILL.md");

  // Use Bun.file if available (Bun runtime), otherwise use fs.readFileSync (Node/Vitest)
  if (typeof Bun !== "undefined") {
    const skillFile = Bun.file(skillFilePath);
    return await skillFile.text();
  }

  const { readFileSync } = await import("node:fs");
  return readFileSync(skillFilePath, "utf-8");
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
