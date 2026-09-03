import type { Code, Heading, Nodes, Root } from "mdast";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import { describe, expect, test } from "vitest";

import { discoverSkills, readSkillFile } from "../helpers/skills";

const HARD_MAX_LINES = 800;

/**
 * Parse markdown content into an AST
 */
const parseMarkdown = (content: string): Root => {
  const processor = remark().use(remarkFrontmatter, ["yaml"]);
  return processor.parse(content);
};

/**
 * Check if frontmatter is the first element in the AST.
 */
const hasFrontmatterFirst = (ast: Root): boolean =>
  ast.children[0]?.type === "yaml";

/**
 * Extract all headings from the AST.
 */
const extractHeadings = (ast: Root): Heading[] => {
  const headings: Heading[] = [];
  const visit = (node: Nodes): void => {
    if (node.type === "heading") {
      headings.push(node);
    }
    if ("children" in node) {
      for (const child of node.children) {
        visit(child);
      }
    }
  };
  visit(ast);
  return headings;
};

interface ValidationResult {
  error?: string;
  valid: boolean;
}

/**
 * Check if heading hierarchy is valid (no skipped levels).
 */
const hasValidHeadingHierarchy = (headings: Heading[]): ValidationResult => {
  let previousLevel = 0;
  for (const [index, heading] of headings.entries()) {
    const level = heading.depth;

    if (index === 0 && level !== 1) {
      return {
        error: `First heading should be level 1, got level ${level}`,
        valid: false,
      };
    }

    if (level > previousLevel + 1) {
      return {
        error: `Heading level jumped from ${previousLevel} to ${level} (skipped level ${previousLevel + 1})`,
        valid: false,
      };
    }

    previousLevel = level;
  }

  return { valid: true };
};

/**
 * Extract all code blocks from the AST.
 */
const extractCodeBlocks = (ast: Root): Code[] => {
  const codeBlocks: Code[] = [];
  const visit = (node: Nodes): void => {
    if (node.type === "code") {
      codeBlocks.push(node);
    }
    if ("children" in node) {
      for (const child of node.children) {
        visit(child);
      }
    }
  };
  visit(ast);
  return codeBlocks;
};

/**
 * Check if all code blocks have language specifiers.
 */
const allCodeBlocksHaveLang = (codeBlocks: Code[]): ValidationResult => {
  for (const block of codeBlocks) {
    if (!block.lang || block.lang.trim() === "") {
      return {
        error: "Code block without language specifier found",
        valid: false,
      };
    }
  }
  return { valid: true };
};

describe("Markdown Structure Validation", () => {
  const skills = discoverSkills();

  test("discovers at least one skill", () => {
    expect(skills.length).toBeGreaterThan(0);
  });

  test.each(skills)("%s has valid SKILL.md structure", async (skillName) => {
    const content = await readSkillFile(skillName);
    const ast = parseMarkdown(content);
    expect(ast.type).toBe("root");
    expect(hasFrontmatterFirst(ast)).toBeTruthy();

    const headingResult = hasValidHeadingHierarchy(extractHeadings(ast));
    expect(headingResult).toStrictEqual({ valid: true });

    const codeBlockResult = allCodeBlocksHaveLang(extractCodeBlocks(ast));
    expect(codeBlockResult).toStrictEqual({ valid: true });

    const lineCount = content.split("\n").length;
    expect(lineCount).toBeLessThanOrEqual(HARD_MAX_LINES);
  });
});
