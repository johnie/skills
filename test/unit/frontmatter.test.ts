import { describe, expect, test } from "vitest";
import { parse as parseYAML } from "yaml";
import { discoverSkills, readSkillFile } from "../helpers/skills";

const ALLOWED_FIELDS = [
  "name",
  "description",
  "allowed-tools",
  "license",
  "metadata",
  "compatibility",
];
const REQUIRED_FIELDS = ["name", "description"];
const MIN_DESCRIPTION_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 1024;
const MAX_NAME_LENGTH = 64;
const MAX_COMPATIBILITY_LENGTH = 500;
const KEBAB_CASE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HTML_TAG_REGEX = /<\/\w+>|<\w+\s+\w+\s*=|<\w+\s*\/>/i;
const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;

/**
 * Extract frontmatter from markdown content
 */
function extractFrontmatter(content: string): string | null {
  const match = content.match(FRONTMATTER_REGEX);
  return match?.[1] ?? null;
}

describe("Frontmatter Validation", () => {
  const skills = discoverSkills();

  if (skills.length === 0) {
    test("at least one skill exists", () => {
      expect(skills.length).toBeGreaterThan(0);
    });
  }

  for (const skillName of skills) {
    describe(`skill: ${skillName}`, () => {
      let frontmatter: string | null;
      let parsed: Record<string, unknown>;

      test("has frontmatter block", async () => {
        const content = await readSkillFile(skillName);
        frontmatter = extractFrontmatter(content);
        expect(frontmatter).not.toBeNull();
      });

      test("has valid YAML syntax", async () => {
        if (!frontmatter) {
          const content = await readSkillFile(skillName);
          frontmatter = extractFrontmatter(content);
        }
        if (!frontmatter) {
          throw new Error("Frontmatter not found");
        }
        const fm = frontmatter;
        expect(() => {
          parsed = parseYAML(fm) as Record<string, unknown>;
        }).not.toThrow();
      });

      test("has required fields", async () => {
        if (!parsed) {
          const content = await readSkillFile(skillName);
          frontmatter = extractFrontmatter(content);
          if (!frontmatter) {
            throw new Error("Frontmatter not found");
          }
          parsed = parseYAML(frontmatter) as Record<string, unknown>;
        }
        for (const field of REQUIRED_FIELDS) {
          expect(parsed).toHaveProperty(field);
        }
      });

      test("name matches directory name", async () => {
        if (!parsed) {
          const content = await readSkillFile(skillName);
          frontmatter = extractFrontmatter(content);
          if (!frontmatter) {
            throw new Error("Frontmatter not found");
          }
          parsed = parseYAML(frontmatter) as Record<string, unknown>;
        }
        expect(parsed.name).toBe(skillName);
      });

      test("name is valid kebab-case (max 64 chars)", async () => {
        if (!parsed) {
          const content = await readSkillFile(skillName);
          frontmatter = extractFrontmatter(content);
          if (!frontmatter) {
            throw new Error("Frontmatter not found");
          }
          parsed = parseYAML(frontmatter) as Record<string, unknown>;
        }
        const name = parsed.name as string;
        expect(name).toMatch(KEBAB_CASE_REGEX);
        expect(name.length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
      });

      test("description is a string with sufficient length", async () => {
        if (!parsed) {
          const content = await readSkillFile(skillName);
          frontmatter = extractFrontmatter(content);
          if (!frontmatter) {
            throw new Error("Frontmatter not found");
          }
          parsed = parseYAML(frontmatter) as Record<string, unknown>;
        }
        expect(typeof parsed.description).toBe("string");
        expect((parsed.description as string).length).toBeGreaterThanOrEqual(
          MIN_DESCRIPTION_LENGTH
        );
      });

      test("description has no HTML-like tags and respects max length", async () => {
        if (!parsed) {
          const content = await readSkillFile(skillName);
          frontmatter = extractFrontmatter(content);
          if (!frontmatter) {
            throw new Error("Frontmatter not found");
          }
          parsed = parseYAML(frontmatter) as Record<string, unknown>;
        }
        const description = parsed.description as string;
        // Disallow HTML tags (closing tags, tags with attributes, self-closing)
        // but allow CLI-style argument placeholders (e.g. <url>, <number|url>)
        expect(description).not.toMatch(HTML_TAG_REGEX);
        expect(description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
      });

      test("only contains allowed fields", async () => {
        if (!parsed) {
          const content = await readSkillFile(skillName);
          frontmatter = extractFrontmatter(content);
          if (!frontmatter) {
            throw new Error("Frontmatter not found");
          }
          parsed = parseYAML(frontmatter) as Record<string, unknown>;
        }
        const keys = Object.keys(parsed);
        for (const key of keys) {
          expect(ALLOWED_FIELDS).toContain(key);
        }
      });

      test("allowed-tools is an array if present", async () => {
        if (!parsed) {
          const content = await readSkillFile(skillName);
          frontmatter = extractFrontmatter(content);
          if (!frontmatter) {
            throw new Error("Frontmatter not found");
          }
          parsed = parseYAML(frontmatter) as Record<string, unknown>;
        }
        if ("allowed-tools" in parsed) {
          expect(Array.isArray(parsed["allowed-tools"])).toBe(true);
        }
      });

      test("license is a string if present", async () => {
        if (!parsed) {
          const content = await readSkillFile(skillName);
          frontmatter = extractFrontmatter(content);
          if (!frontmatter) {
            throw new Error("Frontmatter not found");
          }
          parsed = parseYAML(frontmatter) as Record<string, unknown>;
        }
        if ("license" in parsed) {
          expect(typeof parsed.license).toBe("string");
        }
      });

      test("compatibility is valid if present", async () => {
        if (!parsed) {
          const content = await readSkillFile(skillName);
          frontmatter = extractFrontmatter(content);
          if (!frontmatter) {
            throw new Error("Frontmatter not found");
          }
          parsed = parseYAML(frontmatter) as Record<string, unknown>;
        }
        if ("compatibility" in parsed) {
          expect(typeof parsed.compatibility).toBe("string");
          expect((parsed.compatibility as string).length).toBeLessThanOrEqual(
            MAX_COMPATIBILITY_LENGTH
          );
        }
      });
    });
  }
});
