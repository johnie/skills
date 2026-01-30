import { createScorer } from "evalite";
import {
  extractCommitMessages,
  validateCommitGrouping,
  validateCommitMessage,
  validateCommitQuality,
  validateFileMentions,
  validatePRTemplate,
} from "./validators";

// Top-level regex constants for performance
const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---/;
const NAME_REGEX = /^name:/m;
const DESCRIPTION_REGEX = /^description:/m;
const H1_REGEX = /^#\s+.+$/m;
const WORKFLOW_TEXT_REGEX = /workflow|usage|how to|quick start/i;
const WORKFLOW_HEADING_REGEX = /##\s+(workflow|usage|how to|quick start)/i;
const STRICLI_CORE_REGEX = /@stricli\/core/;
const BUILD_COMMAND_REGEX = /buildCommand/;
const BUILD_APPLICATION_REGEX = /buildApplication/;
const BUILD_ROUTE_MAP_REGEX = /buildRouteMap/;
const INTERFACE_REGEX = /interface\s+\w+/;
const TYPES_REGEX = /:\s*(string|number|boolean|readonly)/;
const IMPORT_REGEX = /import\s+.*from/;
const BUILD_COMMAND_CALL_REGEX = /buildCommand\s*\(/;
const DOCS_REGEX = /docs:\s*\{/;
const PARAMETERS_REGEX = /parameters:\s*\{/;
const FUNC_REGEX = /func\s*\(/;
const BUILD_ROUTE_MAP_CALL_REGEX = /buildRouteMap\s*\(/;
const ROUTES_REGEX = /routes:\s*\{/;
const WP_COMMAND_REGEX = /wp\s+\w+/;
const WP_SUBCOMMANDS_REGEX =
  /wp\s+(db|core|plugin|theme|user|post|comment|option|cache|cron|config|site)/;
const WARNING_REGEX = /\b(warning|caution|careful|dangerous|destructive)\b/i;
const CONFIRMATION_REGEX = /\b(confirm|ensure|verify|check)\b/i;
const BACKUP_REGEX = /backup/i;
const EXPORT_COMMAND_REGEX = /wp\s+db\s+export/i;
const DRY_RUN_FLAG_REGEX = /--dry-run/i;
const DRY_RUN_TEXT_REGEX = /dry.?run/i;

/**
 * Scorer that validates commit messages follow conventional commit format
 */
export const ConventionalCommit = createScorer<
  string,
  string,
  Record<string, never>
>({
  name: "Conventional Commit",
  scorer: ({ output }) => {
    const commits = extractCommitMessages(output);

    if (commits.length === 0) {
      return {
        score: 0,
        metadata: {
          error: "No commits found in output",
          commits: [],
        },
      };
    }

    const results = commits.map((commit) => {
      const msg = `${commit.type}${commit.scope ? `(${commit.scope})` : ""}: ${commit.subject}`;
      const result = validateCommitMessage(msg);
      return { commit: msg, valid: result.valid, errors: result.errors };
    });

    const validCount = results.filter((r) => r.valid).length;
    const score = validCount / commits.length;

    return {
      score,
      metadata: {
        total: commits.length,
        valid: validCount,
        invalid: commits.length - validCount,
        results,
      },
    };
  },
});

/**
 * Scorer that validates commit message quality (not vague, descriptive)
 */
export const CommitQuality = createScorer<
  string,
  string,
  Record<string, never>
>({
  name: "Commit Quality",
  scorer: ({ output }) => {
    const commits = extractCommitMessages(output);

    if (commits.length === 0) {
      return {
        score: 0,
        metadata: {
          error: "No commits found in output",
        },
      };
    }

    const result = validateCommitQuality(commits);
    const score = result.valid ? 1 : 0.5; // Partial credit if quality issues found

    return {
      score,
      metadata: {
        valid: result.valid,
        errors: result.errors,
        commitCount: commits.length,
      },
    };
  },
});

/**
 * Scorer that validates commits are properly grouped by purpose
 */
export const CommitGrouping = createScorer<
  string,
  string,
  Record<string, never>
>({
  name: "Commit Grouping",
  scorer: ({ output }) => {
    const commits = extractCommitMessages(output);

    if (commits.length === 0) {
      return {
        score: 0,
        metadata: {
          error: "No commits found in output",
        },
      };
    }

    const result = validateCommitGrouping(commits);
    const score = result.valid ? 1 : 0.7; // Partial credit for grouping issues

    return {
      score,
      metadata: {
        valid: result.valid,
        errors: result.errors,
        commitCount: commits.length,
      },
    };
  },
});

/**
 * Scorer that validates PR template has required sections
 */
export const PRTemplate = (requiredSections: string[]) =>
  createScorer<string, string, Record<string, never>>({
    name: "PR Template",
    scorer: ({ output }) => {
      const result = validatePRTemplate(output, requiredSections);

      const foundSections = requiredSections.length - result.errors.length;
      const score =
        requiredSections.length > 0
          ? foundSections / requiredSections.length
          : 1;

      return {
        score,
        metadata: {
          valid: result.valid,
          errors: result.errors,
          requiredSections,
          foundSections,
        },
      };
    },
  });

/**
 * Scorer that validates expected files are mentioned in the output
 */
export const FileMentions = (expectedFiles: string[]) =>
  createScorer<string, string, Record<string, never>>({
    name: "File Mentions",
    scorer: ({ output }) => {
      const result = validateFileMentions(output, expectedFiles);

      const mentionedCount = expectedFiles.length - result.errors.length;
      const score =
        expectedFiles.length > 0 ? mentionedCount / expectedFiles.length : 1;

      return {
        score,
        metadata: {
          valid: result.valid,
          errors: result.errors,
          expectedFiles,
          mentionedCount,
        },
      };
    },
  });

/**
 * Scorer that validates expected keywords are mentioned in the output (case-insensitive)
 */
export const Keywords = (expectedKeywords: string[]) =>
  createScorer<string, string, Record<string, never>>({
    name: "Keywords",
    scorer: ({ output }) => {
      const outputLower = output.toLowerCase();
      const foundKeywords = expectedKeywords.filter((keyword) =>
        outputLower.includes(keyword.toLowerCase())
      );

      const score =
        expectedKeywords.length > 0
          ? foundKeywords.length / expectedKeywords.length
          : 1;

      return {
        score,
        metadata: {
          expectedKeywords,
          foundKeywords,
          missingKeywords: expectedKeywords.filter(
            (k) => !foundKeywords.includes(k)
          ),
        },
      };
    },
  });

/**
 * Scorer that validates YAML frontmatter in skill output
 */
export const ValidFrontmatter = createScorer<
  string,
  string,
  Record<string, never>
>({
  name: "Valid Frontmatter",
  scorer: ({ output }) => {
    const match = output.match(FRONTMATTER_REGEX);

    if (!match) {
      return {
        score: 0,
        metadata: {
          error: "No frontmatter found",
          hasFrontmatter: false,
        },
      };
    }

    const frontmatter = match[1] ?? "";
    const hasName = NAME_REGEX.test(frontmatter);
    const hasDescription = DESCRIPTION_REGEX.test(frontmatter);

    const score = hasName && hasDescription ? 1 : 0.5;

    return {
      score,
      metadata: {
        hasFrontmatter: true,
        hasName,
        hasDescription,
      },
    };
  },
});

/**
 * Scorer that validates skill structure (h1 title, workflow sections)
 */
export const SkillStructure = createScorer<
  string,
  string,
  Record<string, never>
>({
  name: "Skill Structure",
  scorer: ({ output }) => {
    const hasH1 = H1_REGEX.test(output);
    const hasWorkflow =
      WORKFLOW_TEXT_REGEX.test(output) || WORKFLOW_HEADING_REGEX.test(output);

    let score = 0;
    if (hasH1 && hasWorkflow) {
      score = 1;
    } else if (hasH1 || hasWorkflow) {
      score = 0.7;
    }

    return {
      score,
      metadata: {
        hasH1,
        hasWorkflow,
      },
    };
  },
});

/**
 * Scorer that validates resource mentions in skill output
 */
export const ResourceMentions = (expectedTypes: string[]) =>
  createScorer<string, string, Record<string, never>>({
    name: "Resource Mentions",
    scorer: ({ output }) => {
      const foundTypes = expectedTypes.filter((type) => {
        const pattern = new RegExp(type.replace("/", "\\/"), "i");
        return pattern.test(output);
      });

      const score =
        expectedTypes.length > 0 ? foundTypes.length / expectedTypes.length : 1;

      return {
        score,
        metadata: {
          expectedTypes,
          foundTypes,
          missingTypes: expectedTypes.filter((t) => !foundTypes.includes(t)),
        },
      };
    },
  });

/**
 * Scorer that validates Stricli imports in TypeScript code
 */
export const StricliImports = createScorer<
  string,
  string,
  Record<string, never>
>({
  name: "Stricli Imports",
  scorer: ({ output }) => {
    const hasStricliCore = STRICLI_CORE_REGEX.test(output);
    const hasBuildCommand = BUILD_COMMAND_REGEX.test(output);
    const hasBuildApplication =
      BUILD_APPLICATION_REGEX.test(output) ||
      BUILD_ROUTE_MAP_REGEX.test(output);

    const score = hasStricliCore && hasBuildCommand ? 1 : 0.5;

    return {
      score,
      metadata: {
        hasStricliCore,
        hasBuildCommand,
        hasBuildApplication,
      },
    };
  },
});

/**
 * Scorer that validates basic TypeScript syntax patterns
 */
export const TypeScriptSyntax = createScorer<
  string,
  string,
  Record<string, never>
>({
  name: "TypeScript Syntax",
  scorer: ({ output }) => {
    const hasInterface = INTERFACE_REGEX.test(output);
    const hasTypes = TYPES_REGEX.test(output);
    const hasImport = IMPORT_REGEX.test(output);

    const score = hasInterface && hasTypes && hasImport ? 1 : 0.7;

    return {
      score,
      metadata: {
        hasInterface,
        hasTypes,
        hasImport,
      },
    };
  },
});

/**
 * Scorer that validates buildCommand pattern in Stricli code
 */
export const CommandPattern = createScorer<
  string,
  string,
  Record<string, never>
>({
  name: "Command Pattern",
  scorer: ({ output }) => {
    const hasBuildCommand = BUILD_COMMAND_CALL_REGEX.test(output);
    const hasDocs = DOCS_REGEX.test(output);
    const hasParameters = PARAMETERS_REGEX.test(output);
    const hasFunc = FUNC_REGEX.test(output);

    const score =
      hasBuildCommand && hasDocs && hasParameters && hasFunc ? 1 : 0.6;

    return {
      score,
      metadata: {
        hasBuildCommand,
        hasDocs,
        hasParameters,
        hasFunc,
      },
    };
  },
});

/**
 * Scorer that validates buildRouteMap pattern for multi-command CLIs
 */
export const RouteMapPattern = createScorer<
  string,
  string,
  Record<string, never>
>({
  name: "Route Map Pattern",
  scorer: ({ output }) => {
    const hasBuildRouteMap = BUILD_ROUTE_MAP_CALL_REGEX.test(output);
    const hasRoutes = ROUTES_REGEX.test(output);

    const score = hasBuildRouteMap && hasRoutes ? 1 : 0.5;

    return {
      score,
      metadata: {
        hasBuildRouteMap,
        hasRoutes,
      },
    };
  },
});

/**
 * Scorer that validates WP-CLI command syntax
 */
export const WPCLISyntax = createScorer<string, string, Record<string, never>>({
  name: "WP-CLI Syntax",
  scorer: ({ output }) => {
    const hasWpCommand = WP_COMMAND_REGEX.test(output);
    const validSubcommands = WP_SUBCOMMANDS_REGEX.test(output);

    let score = 0;
    if (hasWpCommand && validSubcommands) {
      score = 1;
    } else if (hasWpCommand) {
      score = 0.7;
    }

    return {
      score,
      metadata: {
        hasWpCommand,
        validSubcommands,
      },
    };
  },
});

/**
 * Scorer that validates safety warnings for destructive operations
 */
export const SafetyWarnings = createScorer<
  string,
  string,
  Record<string, never>
>({
  name: "Safety Warnings",
  scorer: ({ output }) => {
    const _outputLower = output.toLowerCase();
    const hasWarning = WARNING_REGEX.test(output);
    const hasConfirmation = CONFIRMATION_REGEX.test(output);
    const mentionsBackup = BACKUP_REGEX.test(output);

    const score = hasWarning || hasConfirmation || mentionsBackup ? 1 : 0.5;

    return {
      score,
      metadata: {
        hasWarning,
        hasConfirmation,
        mentionsBackup,
      },
    };
  },
});

/**
 * Scorer that validates backup recommendations
 */
export const BackupMentioned = createScorer<
  string,
  string,
  Record<string, never>
>({
  name: "Backup Mentioned",
  scorer: ({ output }) => {
    const hasBackupKeyword = BACKUP_REGEX.test(output);
    const hasExportCommand = EXPORT_COMMAND_REGEX.test(output);

    const score = hasBackupKeyword || hasExportCommand ? 1 : 0;

    return {
      score,
      metadata: {
        hasBackupKeyword,
        hasExportCommand,
      },
    };
  },
});

/**
 * Scorer that validates dry-run recommendations
 */
export const DryRunFirst = createScorer<string, string, Record<string, never>>({
  name: "Dry Run First",
  scorer: ({ output }) => {
    const hasDryRun = DRY_RUN_FLAG_REGEX.test(output);
    const mentionsDryRun = DRY_RUN_TEXT_REGEX.test(output);

    const score = hasDryRun || mentionsDryRun ? 1 : 0.5;

    return {
      score,
      metadata: {
        hasDryRun,
        mentionsDryRun,
      },
    };
  },
});
