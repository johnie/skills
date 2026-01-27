import { describe, expect, test } from "vitest";
import { parse as parseYAML } from "yaml";
import { discoverSkills, readSkillFile } from "../helpers/skills";

const ALLOWED_FIELDS = ["name", "description", "allowed-tools", "license"];
const REQUIRED_FIELDS = ["name", "description"];
const MIN_DESCRIPTION_LENGTH = 50;
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
    });
  }
});
