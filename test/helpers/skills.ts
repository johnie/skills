import { readdirSync, readFileSync, statSync } from "node:fs";
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

export interface SkillFile {
  content: string;
  file: string;
}

export interface LinePattern {
  name: string;
  pattern: RegExp;
}

export interface Finding {
  file: string;
  line: number;
  matched: string;
  patternName: string;
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
 * Recursively collect readable text files under a directory, relative to the
 * skill root. Scanning scripts/ and assets/ matters as much as the prose:
 * a bundled script is executed rather than reviewed at call time.
 */
const collectTextFiles = (dir: string, prefix: string): SkillFile[] => {
  if (!fileExists(dir)) {
    return [];
  }
  const result: SkillFile[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const relative = `${prefix}/${entry}`;
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      result.push(...collectTextFiles(fullPath, relative));
      continue;
    }
    if (
      !stats.isFile() ||
      BINARY_EXTENSIONS.has(path.extname(entry).toLowerCase())
    ) {
      continue;
    }
    result.push({ content: readFileSync(fullPath, "utf-8"), file: relative });
  }
  return result;
};

/**
 * Collect all text content from a skill (SKILL.md + references/ + scripts/ + assets/)
 */
export const getAllSkillContent = async (
  skillName: string
): Promise<SkillFile[]> => {
  const skillPath = getSkillPath(skillName);
  const skillContent = await readSkillFile(skillName);

  return [
    { content: skillContent, file: "SKILL.md" },
    ...collectTextFiles(path.join(skillPath, "references"), "references"),
    ...collectTextFiles(path.join(skillPath, "scripts"), "scripts"),
    ...collectTextFiles(path.join(skillPath, "assets"), "assets"),
  ];
};

/**
 * Scan skill files line by line against a set of patterns.
 */
export const scanContent = (
  files: SkillFile[],
  patterns: LinePattern[]
): Finding[] => {
  const findings: Finding[] = [];
  for (const { file, content } of files) {
    const lines = content.split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      for (const { name, pattern } of patterns) {
        const match = line.match(pattern);
        if (match) {
          findings.push({
            file,
            line: index + 1,
            matched: match[0].slice(0, 120),
            patternName: name,
          });
        }
      }
    }
  }
  return findings;
};

/**
 * Format findings into a readable error message
 */
export const formatFindings = (findings: Finding[]): string =>
  findings
    .map(
      (finding) =>
        `  [${finding.patternName}] "${finding.matched}" in ${finding.file}:${finding.line}`
    )
    .join("\n");
