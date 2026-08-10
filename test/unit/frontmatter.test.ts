import { beforeAll, describe, expect, test } from "vitest";
import { parse as parseYAML } from "yaml";
import { discoverSkills, readSkillFile } from "../helpers/skills";

/**
 * Fields defined by the Agent Skills spec (https://agentskills.io).
 * These are the only fields accepted by claude.ai uploads, the Skills API,
 * and `package_skill.py`. Anything outside this set is a hard error there.
 */
const SPEC_FIELDS = [
  "name",
  "description",
  "allowed-tools",
  "license",
  "metadata",
  "compatibility",
] as const;

/**
 * Claude Code extensions. Legal because this repo ships as a plugin
 * (.claude-plugin/marketplace.json), where every field is accepted.
 * Using any of these forfeits portability to claude.ai / the Skills API.
 */
const CLAUDE_CODE_FIELDS = [
  "when_to_use",
  "argument-hint",
  "arguments",
  "disable-model-invocation",
  "user-invocable",
  "disallowed-tools",
  "model",
  "effort",
  "context",
  "agent",
  "background",
  "hooks",
  "paths",
  "shell",
] as const;

const ALLOWED_FIELDS: string[] = [...SPEC_FIELDS, ...CLAUDE_CODE_FIELDS];

const REQUIRED_FIELDS = ["name", "description"];
const MIN_DESCRIPTION_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 1024;
/** Claude Code truncates `description` + `when_to_use` at this length in the skill listing. */
const MAX_LISTING_LENGTH = 1536;
const MAX_NAME_LENGTH = 64;
const MAX_COMPATIBILITY_LENGTH = 500;
const KEBAB_CASE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HTML_TAG_REGEX = /<\/\w+>|<\w+\s+\w+\s*=|<\w+\s*\/>/i;
const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;

/** A tool rule: `Read`, or a scoped rule like `Bash(git commit *)`. */
const TOOL_RULE_REGEX = /^[A-Z][A-Za-z]*(\(.+\))?$/;
/**
 * `Bash` and `Bash(*)` are equivalent and pre-approve every shell command
 * without a prompt. Skills must scope Bash per subcommand instead, because
 * Claude Code matches each subcommand of a chained command independently.
 */
const UNSCOPED_BASH_REGEX = /^Bash(\(\s*\*\s*\))?$/;

const EFFORT_LEVELS = ["low", "medium", "high", "xhigh", "max"];
const SHELLS = ["bash", "powershell"];

function extractFrontmatter(content: string): string | null {
  const match = content.match(FRONTMATTER_REGEX);
  return match?.[1] ?? null;
}

function isStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

describe("Frontmatter Validation", () => {
  const skills = discoverSkills();

  test("at least one skill exists", () => {
    expect(skills.length).toBeGreaterThan(0);
  });

  for (const skillName of skills) {
    describe(`skill: ${skillName}`, () => {
      let raw: string | null = null;
      let parsed: Record<string, unknown> = {};

      beforeAll(async () => {
        const content = await readSkillFile(skillName);
        raw = extractFrontmatter(content);
        if (raw !== null) {
          parsed = (parseYAML(raw) ?? {}) as Record<string, unknown>;
        }
      });

      test("has a frontmatter block parsed as YAML", () => {
        expect(raw).not.toBeNull();
        expect(typeof parsed).toBe("object");
      });

      test("has required fields", () => {
        for (const field of REQUIRED_FIELDS) {
          expect(parsed).toHaveProperty(field);
        }
      });

      test("name matches directory name", () => {
        expect(parsed.name).toBe(skillName);
      });

      test("name is valid kebab-case (max 64 chars)", () => {
        const name = parsed.name as string;
        expect(name).toMatch(KEBAB_CASE_REGEX);
        expect(name.length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
      });

      test("description is a string with sufficient length", () => {
        expect(typeof parsed.description).toBe("string");
        expect((parsed.description as string).length).toBeGreaterThanOrEqual(
          MIN_DESCRIPTION_LENGTH
        );
      });

      test("description has no HTML-like tags and respects max length", () => {
        const description = parsed.description as string;
        // Disallow HTML tags (closing tags, tags with attributes, self-closing)
        // but allow CLI-style argument placeholders (e.g. <url>, <number|url>)
        expect(description).not.toMatch(HTML_TAG_REGEX);
        expect(description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
      });

      test("description plus when_to_use fits the skill listing budget", () => {
        const description = (parsed.description as string) ?? "";
        const whenToUse = (parsed.when_to_use as string) ?? "";
        expect(description.length + whenToUse.length).toBeLessThanOrEqual(
          MAX_LISTING_LENGTH
        );
      });

      test("only contains allowed fields", () => {
        for (const key of Object.keys(parsed)) {
          expect(ALLOWED_FIELDS).toContain(key);
        }
      });

      test("tool lists are arrays of valid tool rules", () => {
        for (const field of ["allowed-tools", "disallowed-tools"]) {
          if (!(field in parsed)) {
            continue;
          }
          const rules = parsed[field];
          expect(isStringArray(rules)).toBe(true);
          for (const rule of rules as string[]) {
            expect(rule).toMatch(TOOL_RULE_REGEX);
          }
        }
      });

      test("allowed-tools does not pre-approve unscoped Bash", () => {
        const rules = (parsed["allowed-tools"] ?? []) as string[];
        const unscoped = rules.filter((rule) => UNSCOPED_BASH_REGEX.test(rule));
        expect(unscoped).toEqual([]);
      });

      test("string fields have the right type", () => {
        const stringFields = [
          "license",
          "when_to_use",
          "argument-hint",
          "model",
          "agent",
        ];
        for (const field of stringFields) {
          if (field in parsed) {
            expect(typeof parsed[field]).toBe("string");
          }
        }
      });

      test("boolean fields have the right type", () => {
        const booleanFields = [
          "disable-model-invocation",
          "user-invocable",
          "background",
        ];
        for (const field of booleanFields) {
          if (field in parsed) {
            expect(typeof parsed[field]).toBe("boolean");
          }
        }
      });

      test("enum fields use documented values", () => {
        if ("context" in parsed) {
          expect(parsed.context).toBe("fork");
        }
        if ("effort" in parsed) {
          expect(EFFORT_LEVELS).toContain(parsed.effort);
        }
        if ("shell" in parsed) {
          expect(SHELLS).toContain(parsed.shell);
        }
      });

      test("background and agent require context: fork", () => {
        for (const field of ["background", "agent"]) {
          if (field in parsed) {
            expect(parsed.context).toBe("fork");
          }
        }
      });

      test("compatibility is valid if present", () => {
        if ("compatibility" in parsed) {
          expect(typeof parsed.compatibility).toBe("string");
          expect((parsed.compatibility as string).length).toBeLessThanOrEqual(
            MAX_COMPATIBILITY_LENGTH
          );
        }
      });

      test("metadata is a map if present", () => {
        if ("metadata" in parsed) {
          expect(typeof parsed.metadata).toBe("object");
          expect(Array.isArray(parsed.metadata)).toBe(false);
          expect(parsed.metadata).not.toBeNull();
        }
      });

      test("paths and arguments are strings or string arrays if present", () => {
        for (const field of ["paths", "arguments"]) {
          if (!(field in parsed)) {
            continue;
          }
          const value = parsed[field];
          expect(typeof value === "string" || isStringArray(value)).toBe(true);
        }
      });
    });
  }
});
