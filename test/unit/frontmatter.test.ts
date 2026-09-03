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
const KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const HTML_TAG_REGEX = /<\/\w+>|<\w+\s+\w+\s*=|<\w+\s*\/>/iu;
const FRONTMATTER_REGEX = /^---\n(?:[\s\S]*?)\n---/u;

/** A tool rule: `Read`, or a scoped rule like `Bash(git commit *)`. */
const TOOL_RULE_REGEX = /^[A-Z][A-Za-z]*(?:\(.+\))?$/u;
/**
 * `Bash` and `Bash(*)` are equivalent and pre-approve every shell command
 * without a prompt. Skills must scope Bash per subcommand instead, because
 * Claude Code matches each subcommand of a chained command independently.
 */
const UNSCOPED_BASH_REGEX = /^Bash(?:\(\s*\*\s*\))?$/u;

const EFFORT_LEVELS = ["low", "medium", "high", "xhigh", "max"];
const SHELLS = ["bash", "powershell"];

interface Frontmatter {
  "allowed-tools"?: unknown;
  "argument-hint"?: unknown;
  agent?: unknown;
  arguments?: unknown;
  background?: unknown;
  compatibility?: unknown;
  context?: unknown;
  "disable-model-invocation"?: unknown;
  "disallowed-tools"?: unknown;
  description?: unknown;
  effort?: unknown;
  hooks?: unknown;
  license?: unknown;
  metadata?: unknown;
  model?: unknown;
  name?: unknown;
  paths?: unknown;
  shell?: unknown;
  "user-invocable"?: unknown;
  when_to_use?: unknown;
}

const extractFrontmatter = (content: string): string | null => {
  const match = content.match(FRONTMATTER_REGEX);
  return match?.[0]?.slice(4, -4) ?? null;
};

describe("Frontmatter Validation", () => {
  const skills = discoverSkills();

  test("discovers at least one skill", () => {
    expect(skills.length).toBeGreaterThan(0);
  });

  describe.each(skills)("skill: %s", (skillName) => {
    let parsed: Frontmatter;

    beforeAll(async () => {
      const raw = extractFrontmatter(await readSkillFile(skillName));
      if (raw === null) {
        throw new Error(`${skillName} has no YAML frontmatter`);
      }
      // SAFETY: the tests below validate every supported field's runtime shape.
      parsed = parseYAML(raw) as Frontmatter;
    });

    test("has valid required identity fields", () => {
      for (const requiredField of REQUIRED_FIELDS) {
        expect(parsed).toHaveProperty(requiredField);
      }
      expect(parsed.name).toBe(skillName);
      expect(parsed.name).toBeTypeOf("string");
      // SAFETY: the preceding assertion ensures this value is a string.
      const name = parsed.name as string;
      expect(name).toMatch(KEBAB_CASE_REGEX);
      expect(name.length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
    });

    test("has a valid listing description", () => {
      expect(parsed.description).toBeTypeOf("string");
      // SAFETY: the preceding assertion ensures this value is a string.
      const description = parsed.description as string;
      expect(description.length).toBeGreaterThanOrEqual(MIN_DESCRIPTION_LENGTH);
      expect(description).not.toMatch(HTML_TAG_REGEX);
      expect(description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
    });

    test("fits the skill listing budget", () => {
      expect(parsed.description).toBeTypeOf("string");
      const whenToUse = parsed.when_to_use ?? "";
      expect(whenToUse).toBeTypeOf("string");
      // SAFETY: the preceding assertion ensures this value is a string.
      const description = parsed.description as string;
      expect(description.length + String(whenToUse).length).toBeLessThanOrEqual(
        MAX_LISTING_LENGTH
      );
    });

    test("only declares allowed tool configuration", () => {
      for (const declaredField of Object.keys(parsed)) {
        expect(ALLOWED_FIELDS).toContain(declaredField);
      }

      const toolFields = ["allowed-tools", "disallowed-tools"] as const;
      for (const toolField of toolFields.filter(
        (field) => parsed[field] !== undefined
      )) {
        const rules = parsed[toolField];
        expect(rules).toBeInstanceOf(Array);
        // SAFETY: the preceding assertion ensures this value is an array.
        for (const rule of rules as string[]) {
          expect(rule).toBeTypeOf("string");
          expect(rule).toMatch(TOOL_RULE_REGEX);
        }
      }

      const allowedTools = parsed["allowed-tools"] ?? [];
      expect(allowedTools).toBeInstanceOf(Array);
      // SAFETY: the preceding assertion ensures this value is an array.
      expect(
        (allowedTools as string[]).filter((rule) =>
          UNSCOPED_BASH_REGEX.test(rule)
        )
      ).toStrictEqual([]);
    });

    test("uses valid optional values", () => {
      const stringFields = [
        "license",
        "when_to_use",
        "argument-hint",
        "model",
        "agent",
      ] as const;
      for (const stringField of stringFields.filter(
        (field) => parsed[field] !== undefined
      )) {
        expect(parsed[stringField]).toBeTypeOf("string");
      }

      const booleanFields = [
        "disable-model-invocation",
        "user-invocable",
        "background",
      ] as const;
      for (const booleanField of booleanFields.filter(
        (field) => parsed[field] !== undefined
      )) {
        expect(parsed[booleanField]).toBeTypeOf("boolean");
      }

      const enumFields = [
        { allowed: ["fork"], value: parsed.context },
        { allowed: EFFORT_LEVELS, value: parsed.effort },
        { allowed: SHELLS, value: parsed.shell },
      ].filter(({ value: enumValue }) => enumValue !== undefined);
      for (const { allowed, value: enumValue } of enumFields) {
        expect(allowed).toContain(enumValue);
      }

      for (const _forkRequired of [parsed.agent, parsed.background].filter(
        (optionalValue) => optionalValue !== undefined
      )) {
        expect(parsed.context).toBe("fork");
      }

      const compatibilities =
        parsed.compatibility === undefined ? [] : [parsed.compatibility];
      for (const compatibility of compatibilities) {
        expect(compatibility).toBeTypeOf("string");
        // SAFETY: the preceding assertion ensures this value is a string.
        expect((compatibility as string).length).toBeLessThanOrEqual(
          MAX_COMPATIBILITY_LENGTH
        );
      }

      const metadataValues =
        parsed.metadata === undefined ? [] : [parsed.metadata];
      for (const metadata of metadataValues) {
        expect(metadata).not.toBeNull();
        expect(metadata).toBeTypeOf("object");
        expect(metadata).not.toBeInstanceOf(Array);
      }

      const pathValues = [parsed.arguments, parsed.paths].filter(
        (optionalValue) => optionalValue !== undefined
      );
      for (const pathValue of pathValues) {
        const isString =
          Object.prototype.toString.call(pathValue) === "[object String]";
        const isStringArray =
          Array.isArray(pathValue) &&
          pathValue.every(
            (item) => Object.prototype.toString.call(item) === "[object String]"
          );
        expect(isString || isStringArray).toBeTruthy();
      }
    });
  });
});
