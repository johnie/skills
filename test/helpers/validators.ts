// Regex patterns for commit message validation
const CONVENTIONAL_COMMIT_REGEX =
  /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .+/;
const CONVENTIONAL_COMMIT_PARSE_REGEX =
  /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(?:\(([^)]+)\))?: (.+)$/;
const GIT_COMMIT_REGEX = /git commit[^'"]*['"]([^'"]+)['"]/g;
const CODE_BLOCK_REGEX = /```(?:bash|sh)?\s*((?:git commit[^`]+)+)```/g;
const LIST_WITH_BACKTICKS_REGEX = /^\s*(?:\d+\.|[-*])\s+`([^`]+)`/gm;
const LIST_WITH_BOLD_REGEX = /^\s*(?:\d+\.|[-*])\s+\*\*([^*]+)\*\*/gm;
const COMMIT_TYPE_PREFIX_REGEX =
  /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?:/;
const LIST_ITEM_PLAIN_REGEX =
  /^\s*(?:\d+\.|[-*])\s+(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+?\))?:\s*(.+?)$/gm;
const LIST_ITEM_PREFIX_REGEX = /^\s*(?:\d+\.|[-*])\s+/;
const CHECKBOX_ITEM_REGEX =
  /^\s*(?:✓|✗|[-*]\s*\[[ x]\])\s+(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+?\))?:\s*(.+?)$/gm;
const CHECKBOX_PREFIX_REGEX = /^\s*(?:✓|✗|[-*]\s*\[[ x]\])\s+/;
const WHITESPACE_SPLIT_REGEX = /\s+/;

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Extracted commit message
 */
export interface CommitMessage {
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  files: string[];
}

/**
 * Validate a commit message follows conventional commit format
 * Format: type(scope): subject
 *
 * @param message The commit message to validate
 * @returns Validation result
 */
export function validateCommitMessage(message: string): ValidationResult {
  const errors: string[] = [];

  // Check for conventional commit format: type(scope): subject or type: subject
  if (!CONVENTIONAL_COMMIT_REGEX.test(message)) {
    errors.push(
      "Commit message does not follow conventional commit format (type(scope): subject)"
    );
  }

  // Check message is not too long (subject line should be <= 100 chars)
  const subjectLine = message.split("\n")[0] ?? message;
  if (subjectLine.length > 100) {
    errors.push(`Subject line too long (${subjectLine.length} > 100 chars)`);
  }

  // Check it's not too short
  if (subjectLine.length < 10) {
    errors.push("Subject line too short (should be descriptive)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract commit messages from skill output
 * Looks for patterns like:
 * - "git commit -m 'message'"
 * - Markdown code blocks with commit messages
 * - Listed commit messages
 *
 * @param output The skill output
 * @returns Array of extracted commit messages
 */
export function extractCommitMessages(output: string): CommitMessage[] {
  const commits: CommitMessage[] = [];

  // Pattern 1: git commit -m 'message' or git commit -m "message"
  extractFromGitCommands(output, commits);

  // Pattern 2: Code blocks containing commit messages
  extractFromCodeBlocks(output, commits);

  // Pattern 3: Listed commits (numbered or bulleted) with backticks
  extractFromListWithBackticks(output, commits);

  // Pattern 4: Listed commits with bold (**message**)
  extractFromListWithBold(output, commits);

  // Pattern 5: Listed commits without formatting (plain text)
  extractFromListPlain(output, commits);

  // Pattern 6: Checkbox format (✓ or ✗ or - [ ] or - [x])
  extractFromCheckbox(output, commits);

  return commits;
}

// Helper functions to extract commits from different patterns
function extractFromGitCommands(
  output: string,
  commits: CommitMessage[]
): void {
  for (const match of output.matchAll(GIT_COMMIT_REGEX)) {
    const message = match[1];
    if (!message) {
      continue;
    }
    const parsed = parseCommitMessage(message);
    if (parsed) {
      commits.push(parsed);
    }
  }
}

function extractFromCodeBlocks(output: string, commits: CommitMessage[]): void {
  for (const match of output.matchAll(CODE_BLOCK_REGEX)) {
    const block = match[1];
    if (!block) {
      continue;
    }
    for (const blockMatch of block.matchAll(GIT_COMMIT_REGEX)) {
      const message = blockMatch[1];
      if (!message) {
        continue;
      }
      const parsed = parseCommitMessage(message);
      if (parsed) {
        commits.push(parsed);
      }
    }
  }
}

function extractFromListWithBackticks(
  output: string,
  commits: CommitMessage[]
): void {
  for (const match of output.matchAll(LIST_WITH_BACKTICKS_REGEX)) {
    const message = match[1];
    if (!message) {
      continue;
    }
    if (COMMIT_TYPE_PREFIX_REGEX.test(message)) {
      const parsed = parseCommitMessage(message);
      if (parsed) {
        commits.push(parsed);
      }
    }
  }
}

function extractFromListWithBold(
  output: string,
  commits: CommitMessage[]
): void {
  for (const match of output.matchAll(LIST_WITH_BOLD_REGEX)) {
    const message = match[1];
    if (!message) {
      continue;
    }
    if (COMMIT_TYPE_PREFIX_REGEX.test(message)) {
      const parsed = parseCommitMessage(message);
      if (parsed) {
        commits.push(parsed);
      }
    }
  }
}

function extractFromListPlain(output: string, commits: CommitMessage[]): void {
  for (const match of output.matchAll(LIST_ITEM_PLAIN_REGEX)) {
    const message = match[0].replace(LIST_ITEM_PREFIX_REGEX, "").trim();
    const parsed = parseCommitMessage(message);
    if (parsed && !commits.find((c) => c.subject === parsed.subject)) {
      commits.push(parsed);
    }
  }
}

function extractFromCheckbox(output: string, commits: CommitMessage[]): void {
  for (const match of output.matchAll(CHECKBOX_ITEM_REGEX)) {
    const message = match[0].replace(CHECKBOX_PREFIX_REGEX, "").trim();
    const parsed = parseCommitMessage(message);
    if (parsed && !commits.find((c) => c.subject === parsed.subject)) {
      commits.push(parsed);
    }
  }
}

/**
 * Parse a commit message into structured format
 */
function parseCommitMessage(message: string): CommitMessage | null {
  const match = message.match(CONVENTIONAL_COMMIT_PARSE_REGEX);

  if (!match) {
    return null;
  }

  const [, type, scope, subject] = match;

  // Ensure type and subject are present
  if (!(type && subject)) {
    return null;
  }

  // Try to extract files from the subject or message body
  const files: string[] = [];
  const fileRegex = /[\w/-]+\.[\w]+/g;
  let fileMatch = fileRegex.exec(message);

  while (fileMatch !== null) {
    files.push(fileMatch[0]);
    fileMatch = fileRegex.exec(message);
  }

  return {
    type,
    scope,
    subject,
    files,
  };
}

/**
 * Validate PR template has required sections
 *
 * @param output The PR description
 * @param requiredSections Array of section headers that must be present
 * @returns Validation result
 */
export function validatePRTemplate(
  output: string,
  requiredSections: string[]
): ValidationResult {
  const errors: string[] = [];

  // Define acceptable variations for common sections
  const sectionVariations: Record<string, string[]> = {
    Summary: [
      "summary",
      "what",
      "overview",
      "description",
      "changes",
      "change summary",
    ],
    "Test plan": [
      "test plan",
      "testing",
      "tests",
      "how to test",
      "verification",
      "test strategy",
      "qa",
    ],
    Motivation: ["motivation", "why", "rationale", "reason", "background"],
    "Breaking Changes": [
      "breaking changes",
      "breaking",
      "migration",
      "backwards compatibility",
    ],
  };

  for (const section of requiredSections) {
    // Get acceptable variations for this section (or just use the section itself)
    const variations = sectionVariations[section] || [section.toLowerCase()];

    // Check if any variation is present as a header
    const foundMatch = variations.some((variation) => {
      // Look for markdown headers (## Section or # Section)
      const headerRegex = new RegExp(`^#+\\s+${variation}\\s*$`, "mi");
      return headerRegex.test(output);
    });

    if (!foundMatch) {
      errors.push(`Missing required section: ${section}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that expected files are mentioned in the output
 *
 * @param output The skill output
 * @param expectedFiles Array of file paths that should be mentioned
 * @returns Validation result
 */
export function validateFileMentions(
  output: string,
  expectedFiles: string[]
): ValidationResult {
  const errors: string[] = [];

  for (const file of expectedFiles) {
    if (!output.includes(file)) {
      errors.push(`Expected file not mentioned: ${file}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that commits are properly grouped by type or purpose
 * Checks that files related to the same feature/fix are in the same commit
 *
 * @param commits Array of commit messages
 * @returns Validation result
 */
export function validateCommitGrouping(
  commits: CommitMessage[]
): ValidationResult {
  const errors: string[] = [];

  // Check that each commit has a clear purpose (not mixing types)
  for (const commit of commits) {
    // If a commit mentions multiple unrelated files, it might be poorly grouped
    // This is a simple heuristic - in practice, you'd want more sophisticated logic
    if (commit.files.length > 5) {
      errors.push(
        `Commit "${commit.subject}" affects many files (${commit.files.length}), may need splitting`
      );
    }
  }

  // Check that similar types of changes are grouped together
  const types = commits.map((c) => c.type);
  const _uniqueTypes = new Set(types);

  // If we have both feat and fix commits for similar scopes, they should be separate
  const scopes = commits.map((c) => c.scope).filter((s): s is string => !!s);
  const scopeCounts = new Map<string, number>();

  for (const scope of scopes) {
    scopeCounts.set(scope, (scopeCounts.get(scope) || 0) + 1);
  }

  // Warn if the same scope appears in many commits (might indicate poor grouping)
  for (const [scope, count] of scopeCounts.entries()) {
    if (count > 3) {
      errors.push(
        `Scope "${scope}" appears in ${count} commits - consider consolidating`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate commit message quality using heuristics
 *
 * @param commits Array of commit messages
 * @returns Validation result
 */
export function validateCommitQuality(
  commits: CommitMessage[]
): ValidationResult {
  const errors: string[] = [];

  for (const commit of commits) {
    // Check for vague subjects (only truly vague ones)
    const vagueWords = [
      "change",
      "modify",
      "fix stuff",
      "wip",
      "stuff",
      "things",
    ];
    const subject = commit.subject.toLowerCase();

    // Only flag if the subject is just the vague word or very short after it
    if (vagueWords.some((word) => subject === word)) {
      errors.push(
        `Commit subject too vague: "${commit.subject}" - should be more specific`
      );
    }

    // Check for extremely short subjects (after the vague word)
    const words = subject.split(WHITESPACE_SPLIT_REGEX);
    if (words.length <= 2 && words.every((w) => w.length <= 4)) {
      errors.push(
        `Commit subject too vague: "${commit.subject}" - should be more descriptive`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
