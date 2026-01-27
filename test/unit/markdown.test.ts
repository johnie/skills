import type { Code, Heading, Root } from "mdast";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import { describe, expect, test } from "vitest";
import { discoverSkills, readSkillFile } from "../helpers/skills";

/**
 * Parse markdown content into an AST
 */
function parseMarkdown(content: string): Root {
  const processor = remark().use(remarkFrontmatter, ["yaml"]);
  return processor.parse(content);
}

/**
 * Check if frontmatter is the first element in the AST
 */
function hasFrontmatterFirst(ast: Root): boolean {
  return ast.children.length > 0 && ast.children[0]?.type === "yaml";
}

/**
 * Extract all headings from the AST
 */
function extractHeadings(ast: Root): Heading[] {
  const headings: Heading[] = [];
  function visit(node: any) {
    if (node.type === "heading") {
      headings.push(node);
    }
    if (node.children) {
      for (const child of node.children) {
        visit(child);
      }
    }
  }
  visit(ast);
  return headings;
}

/**
 * Check if heading hierarchy is valid (no skipped levels)
 */
function hasValidHeadingHierarchy(headings: Heading[]): {
  valid: boolean;
  error?: string;
} {
  if (headings.length === 0) {
    return { valid: true };
  }

  let prevLevel = 0;
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    if (!heading) {
      continue;
    }
    const level = heading.depth;

    if (i === 0 && level !== 1) {
      return {
        valid: false,
        error: `First heading should be level 1, got level ${level}`,
      };
    }

    if (level > prevLevel + 1) {
      return {
        valid: false,
        error: `Heading level jumped from ${prevLevel} to ${level} (skipped level ${prevLevel + 1})`,
      };
    }

    prevLevel = level;
  }

  return { valid: true };
}

/**
 * Extract all code blocks from the AST
 */
function extractCodeBlocks(ast: Root): Code[] {
  const codeBlocks: Code[] = [];
  function visit(node: any) {
    if (node.type === "code") {
      codeBlocks.push(node);
    }
    if (node.children) {
      for (const child of node.children) {
        visit(child);
      }
    }
  }
  visit(ast);
  return codeBlocks;
}

/**
 * Check if all code blocks have language specifiers
 */
function allCodeBlocksHaveLang(codeBlocks: Code[]): {
  valid: boolean;
  error?: string;
} {
  for (const block of codeBlocks) {
    if (!block.lang || block.lang.trim() === "") {
      return {
        valid: false,
        error: "Code block without language specifier found",
      };
    }
  }
  return { valid: true };
}

describe("Markdown Structure Validation", () => {
  const skills = discoverSkills();

  if (skills.length === 0) {
    test("at least one skill exists", () => {
      expect(skills.length).toBeGreaterThan(0);
    });
  }

  for (const skillName of skills) {
    describe(`skill: ${skillName}`, () => {
      let ast: Root;

      test("can parse markdown", async () => {
        const content = await readSkillFile(skillName);
        ast = parseMarkdown(content);
        expect(ast).toBeDefined();
        expect(ast.type).toBe("root");
      });

      test("has frontmatter as first element", async () => {
        if (!ast) {
          const content = await readSkillFile(skillName);
          ast = parseMarkdown(content);
        }
        expect(hasFrontmatterFirst(ast)).toBe(true);
      });

      test("has valid heading hierarchy", async () => {
        if (!ast) {
          const content = await readSkillFile(skillName);
          ast = parseMarkdown(content);
        }
        const headings = extractHeadings(ast);
        const result = hasValidHeadingHierarchy(headings);
        expect(result.valid).toBe(true);
        if (!result.valid) {
          throw new Error(result.error);
        }
      });

      test("all code blocks have language specifiers", async () => {
        if (!ast) {
          const content = await readSkillFile(skillName);
          ast = parseMarkdown(content);
        }
        const codeBlocks = extractCodeBlocks(ast);
        const result = allCodeBlocksHaveLang(codeBlocks);
        expect(result.valid).toBe(true);
        if (!result.valid) {
          throw new Error(result.error);
        }
      });
    });
  }
});
