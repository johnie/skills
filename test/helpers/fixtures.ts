import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Regex for removing .json extension from filenames
const JSON_EXTENSION_REGEX = /\.json$/;

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

/**
 * Base scenario context shared by all skills
 */
export interface ScenarioContext {
  /** Git status output */
  gitStatus?: string;
  /** Git diff output */
  gitDiff?: string;
  /** Current branch name */
  branch?: string;
  /** Additional context */
  [key: string]: unknown;
}

/**
 * Commit skill scenario
 */
export interface CommitScenario {
  /** Scenario name/description */
  name: string;
  /** User prompt to the skill */
  prompt: string;
  /** Git context */
  context: ScenarioContext & {
    /** Files changed in this scenario */
    filesChanged?: string[];
    /** Type of changes (feature, bugfix, refactor, etc.) */
    changeType?: string[];
  };
  /** Expected characteristics of the output */
  expected?: {
    /** Expected number of commits */
    commitCount?: number;
    /** Expected commit types (feat, fix, etc.) */
    commitTypes?: string[];
    /** Files that should be mentioned */
    filesMentioned?: string[];
  };
}

/**
 * PR skill scenario
 */
export interface PRScenario {
  /** Scenario name/description */
  name: string;
  /** User prompt to the skill */
  prompt: string;
  /** Git context */
  context: ScenarioContext & {
    /** Commits included in the PR */
    commits?: Array<{
      message: string;
      files: string[];
    }>;
    /** Base branch */
    baseBranch?: string;
  };
  /** Expected characteristics of the output */
  expected?: {
    /** Required sections in PR description */
    requiredSections?: string[];
    /** Keywords that should appear */
    keywords?: string[];
  };
}

/**
 * Skill Creator scenario
 */
export interface SkillCreatorScenario {
  /** Scenario name/description */
  name: string;
  /** User prompt to the skill */
  prompt: string;
  /** Context (usually empty for skill creator) */
  context: ScenarioContext;
  /** Expected characteristics of the output */
  expected?: {
    /** Required sections in skill output */
    requiredSections?: string[];
    /** Resource types that should be mentioned */
    resourceTypes?: string[];
  };
}

/**
 * Stricli skill scenario
 */
export interface StricliScenario {
  /** Scenario name/description */
  name: string;
  /** User prompt to the skill */
  prompt: string;
  /** Context (usually empty for stricli) */
  context: ScenarioContext;
  /** Expected characteristics of the output */
  expected?: {
    /** Expected command count */
    commandCount?: number;
    /** Whether route map is expected */
    expectRouteMap?: boolean;
    /** Keywords that should appear */
    keywords?: string[];
  };
}

/**
 * WP-CLI skill scenario
 */
export interface WPCLIScenario {
  /** Scenario name/description */
  name: string;
  /** User prompt to the skill */
  prompt: string;
  /** Context */
  context: ScenarioContext & {
    /** Whether the operation is destructive */
    isDestructive?: boolean;
  };
  /** Expected characteristics of the output */
  expected?: {
    /** Expected WP-CLI commands */
    commands?: string[];
    /** Whether backup should be mentioned */
    expectBackup?: boolean;
    /** Whether dry-run should be mentioned */
    expectDryRun?: boolean;
    /** Whether safety warnings should appear */
    expectWarnings?: boolean;
  };
}

/**
 * Generic scenario type
 */
export type Scenario =
  | CommitScenario
  | PRScenario
  | SkillCreatorScenario
  | StricliScenario
  | WPCLIScenario;

/**
 * Load a scenario from a fixture file
 *
 * @param skill Skill name (e.g., "commit", "pr")
 * @param scenarioName Name of the scenario file (without .json)
 * @returns Parsed scenario object
 */
export function loadScenario<T extends Scenario = Scenario>(
  skill: string,
  scenarioName: string
): T {
  const fixturePath = join(
    CURRENT_DIR,
    "..",
    "fixtures",
    skill,
    "scenarios",
    `${scenarioName}.json`
  );

  const content = readFileSync(fixturePath, "utf-8");
  return JSON.parse(content) as T;
}

/**
 * Load expected output for a scenario (if it exists)
 *
 * @param skill Skill name
 * @param scenarioName Name of the scenario
 * @returns Expected output string, or null if not found
 */
export function loadExpected(
  skill: string,
  scenarioName: string
): string | null {
  const expectedPath = join(
    CURRENT_DIR,
    "..",
    "fixtures",
    skill,
    "expected",
    `${scenarioName}.txt`
  );

  if (!existsSync(expectedPath)) {
    return null;
  }

  return readFileSync(expectedPath, "utf-8");
}

/**
 * List all available scenarios for a skill
 *
 * @param skill Skill name
 * @returns Array of scenario names (without .json extension)
 */
export function listScenarios(skill: string): string[] {
  const scenariosDir = join(CURRENT_DIR, "..", "fixtures", skill, "scenarios");

  try {
    const files = readdirSync(scenariosDir);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(JSON_EXTENSION_REGEX, ""));
  } catch (_error) {
    // Directory doesn't exist or can't be read
    return [];
  }
}

/**
 * Get the fixtures directory path for a skill
 *
 * @param skill Skill name
 * @returns Absolute path to the skill's fixtures directory
 */
export function getFixturesDir(skill: string): string {
  return join(CURRENT_DIR, "..", "fixtures", skill);
}
