import path from "node:path";

import type { Link, Nodes, Root } from "mdast";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import { describe, expect, test } from "vitest";

import {
  discoverSkills,
  fileExists,
  getSkillPath,
  readSkillFile,
} from "../helpers/skills";

/**
 * Parse markdown content into an AST.
 */
const parseMarkdown = (content: string): Root => {
  const processor = remark().use(remarkFrontmatter, ["yaml"]);
  return processor.parse(content);
};

/**
 * Extract all links from the AST.
 */
const extractLinks = (ast: Root): Link[] => {
  const links: Link[] = [];
  const visit = (node: Nodes): void => {
    if (node.type === "link") {
      links.push(node);
    }
    if ("children" in node) {
      for (const child of node.children) {
        visit(child);
      }
    }
  };
  visit(ast);
  return links;
};

const REFERENCES_PATH_RE = /^references\/\S+/u;

/**
 * Extract file paths from inline code nodes (e.g. `references/foo.md`).
 */
const extractInlineCodeReferences = (ast: Root): string[] => {
  const references: string[] = [];
  const visit = (node: Nodes): void => {
    if (node.type === "inlineCode" && REFERENCES_PATH_RE.test(node.value)) {
      references.push(node.value);
    }
    if ("children" in node) {
      for (const child of node.children) {
        visit(child);
      }
    }
  };
  visit(ast);
  return references;
};

const getLocalFileReferences = (
  links: Link[],
  inlineRefs: string[]
): string[] => {
  const fromLinks = links
    .map((link) => link.url)
    .filter(
      (url) =>
        !url.startsWith("#") &&
        !url.startsWith("http://") &&
        !url.startsWith("https://")
    );
  return [...new Set([...fromLinks, ...inlineRefs])];
};

describe("Reference Validation", () => {
  const skills = discoverSkills();

  test("discovers at least one skill", () => {
    expect(skills.length).toBeGreaterThan(0);
  });

  test.each(skills)("%s has no broken local references", async (skillName) => {
    const skillPath = getSkillPath(skillName);
    const ast = parseMarkdown(await readSkillFile(skillName));
    const localReferences = getLocalFileReferences(
      extractLinks(ast),
      extractInlineCodeReferences(ast)
    );
    const missingFiles = localReferences.filter(
      (reference) => !fileExists(path.resolve(skillPath, reference))
    );

    expect(
      missingFiles,
      `Missing files referenced in SKILL.md: ${missingFiles.join(", ")}`
    ).toStrictEqual([]);
  });
});
